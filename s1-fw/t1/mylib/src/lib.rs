use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use rusqlite::{Connection, Error as RusqliteError};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;

// Schema metadata for a table
#[derive(Debug)]
struct TableSchema {
    name: String,
    columns: Vec<ColumnSchema>,
    primary_keys: Vec<String>,
}

#[derive(Debug)]
struct ColumnSchema {
    name: String,
    type_name: String,
    not_null: bool,
}

// App state with database connection and schema
#[derive(Clone)]
struct AppState {
    conn: Arc<Mutex<Connection>>, // Use Mutex to make Connection thread-safe
    schemas: Arc<Vec<TableSchema>>,
}

// Public function to start the API
pub async fn mylib(db_path: &str) -> anyhow::Result<()> {
    // Connect to SQLite database
    let conn = Connection::open(db_path)?;
    let conn = Arc::new(Mutex::new(conn)); // Wrap in Mutex

    // Get schema for all tables
    let schemas = get_schemas(&conn)?;
    let schemas = Arc::new(schemas);

    // Create Axum router
    let mut app = Router::new();

    // Generate OpenAPI spec and serve it
    let openapi_spec = generate_openapi(&schemas);
    app = app.route("/openapi.json", get(|| async { Json(openapi_spec) }));

    // Generate CRUD routes for each table
    for schema in schemas.iter() {
        let state = AppState {
            conn: conn.clone(),
            schemas: schemas.clone(),
        };
        let table_router = create_table_router(schema);
        app = app.nest(&format!("/{}", schema.name), table_router.with_state(state));
    }

    // Start the server
    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}

// Fetch schema for all tables
fn get_schemas(conn: &Arc<Mutex<Connection>>) -> anyhow::Result<Vec<TableSchema>> {
    let conn = conn.lock().unwrap();
    let mut schemas = Vec::new();
    let tables = get_tables(&conn)?;
    for table in tables {
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
        let columns = stmt
            .query_map([], |row| {
                Ok(ColumnSchema {
                    name: row.get(1)?,
                    type_name: row.get(2)?,
                    not_null: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        // Fetch primary keys using PRAGMA table_info
        let mut pk_stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
        let primary_keys = pk_stmt
            .query_map([], |row| {
                let is_pk: i32 = row.get(5)?;
                let name: String = row.get(1)?;
                Ok((name, is_pk))
            })?
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .filter(|&(_, is_pk)| is_pk > 0)
            .map(|(name, _)| name)
            .collect();

        schemas.push(TableSchema {
            name: table,
            columns,
            primary_keys,
        });
    }
    Ok(schemas)
}

// Fetch all table names
fn get_tables(conn: &Connection) -> anyhow::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'")?;
    let tables = stmt
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(tables)
}

// Create a router for a table
fn create_table_router(schema: &TableSchema) -> Router<AppState> {
    let pk_path = if schema.primary_keys.len() == 1 {
        format!("/{}", schema.primary_keys[0])
    } else {
        schema
            .primary_keys
            .iter()
            .map(|pk| format!("/{}", pk))
            .collect::<Vec<_>>()
            .join("")
    };
    Router::new()
        .route("/", get(list_rows))
        .route(&pk_path, get(get_row))
        .route("/", post(create_row))
        .route(&pk_path, put(update_row))
        .route(&pk_path, delete(delete_row))
}

// CRUD handlers
async fn list_rows(
    State(state): State<AppState>,
    Path(table): Path<String>,
) -> Result<Json<Vec<Value>>, StatusCode> {
    let schema = state
        .schemas
        .iter()
        .find(|s| s.name == table)
        .ok_or(StatusCode::NOT_FOUND)?;
    let query = format!("SELECT * FROM {}", table);
    let conn = state.conn.lock().unwrap();
    let rows = execute_query(&conn, &query, &[], &schema.columns)?;
    Ok(Json(rows))
}

async fn get_row(
    State(state): State<AppState>,
    Path(params): Path<Vec<(String, String)>>,
) -> Result<Json<Value>, StatusCode> {
    let table = params
        .get(0)
        .map(|(t, _)| t)
        .ok_or(StatusCode::BAD_REQUEST)?;
    let schema = state
        .schemas
        .iter()
        .find(|s| s.name == *table)
        .ok_or(StatusCode::NOT_FOUND)?;
    let where_clause = schema
        .primary_keys
        .iter()
        .zip(params.iter().skip(1))
        .map(|(pk, _)| format!("{} = ?", pk))
        .collect::<Vec<_>>()
        .join(" AND ");
    let query = format!("SELECT * FROM {} WHERE {}", table, where_clause);
    let values: Vec<String> = params.into_iter().skip(1).map(|(_, v)| v).collect();
    let conn = state.conn.lock().unwrap();
    let row = execute_query(&conn, &query, &values, &schema.columns)?
        .into_iter()
        .next()
        .ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(row))
}

async fn create_row(
    State(state): State<AppState>,
    Path(table): Path<String>,
    Json(payload): Json<Value>,
) -> Result<StatusCode, StatusCode> {
    let schema = state
        .schemas
        .iter()
        .find(|s| s.name == table)
        .ok_or(StatusCode::NOT_FOUND)?;
    let obj = payload.as_object().ok_or(StatusCode::BAD_REQUEST)?;
    let (columns, values): (Vec<String>, Vec<String>) = obj
        .iter()
        .filter(|(k, _)| schema.columns.iter().any(|c| c.name == **k))
        .map(|(k, v)| (k.clone(), v.to_string()))
        .unzip();
    if columns.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let placeholders = values.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let query = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        table,
        columns.join(","),
        placeholders
    );
    let conn = state.conn.lock().unwrap();
    conn.execute(&query, rusqlite::params_from_iter(&values))
        .map_err(|e| map_sqlite_error(e))?;
    Ok(StatusCode::CREATED)
}

async fn update_row(
    State(state): State<AppState>,
    Path(params): Path<Vec<(String, String)>>,
    Json(payload): Json<Value>,
) -> Result<StatusCode, StatusCode> {
    let table = params
        .get(0)
        .map(|(t, _)| t)
        .ok_or(StatusCode::BAD_REQUEST)?;
    let schema = state
        .schemas
        .iter()
        .find(|s| s.name == *table)
        .ok_or(StatusCode::NOT_FOUND)?;
    let obj = payload.as_object().ok_or(StatusCode::BAD_REQUEST)?;
    let updates: Vec<String> = obj
        .iter()
        .filter(|(k, _)| {
            schema.columns.iter().any(|c| c.name == **k) && !schema.primary_keys.contains(k)
        })
        .map(|(k, v)| format!("{} = {}", k, v))
        .collect();
    if updates.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let where_clause = schema
        .primary_keys
        .iter()
        .zip(params.iter().skip(1))
        .map(|(pk, _)| format!("{} = ?", pk))
        .collect::<Vec<_>>()
        .join(" AND ");
    let query = format!("UPDATE {} SET {} WHERE {}", table, updates.join(","), where_clause);
    let values: Vec<String> = params.into_iter().skip(1).map(|(_, v)| v).collect();
    let conn = state.conn.lock().unwrap();
    conn.execute(&query, rusqlite::params_from_iter(&values))
        .map_err(|e| map_sqlite_error(e))?;
    Ok(StatusCode::OK)
}

async fn delete_row(
    State(state): State<AppState>,
    Path(params): Path<Vec<(String, String)>>,
) -> Result<StatusCode, StatusCode> {
    let table = params
        .get(0)
        .map(|(t, _)| t)
        .ok_or(StatusCode::BAD_REQUEST)?;
    let schema = state
        .schemas
        .iter()
        .find(|s| s.name == *table)
        .ok_or(StatusCode::NOT_FOUND)?;
    let where_clause = schema
        .primary_keys
        .iter()
        .zip(params.iter().skip(1))
        .map(|(pk, _)| format!("{} = ?", pk))
        .collect::<Vec<_>>()
        .join(" AND ");
    let query = format!("DELETE FROM {} WHERE {}", table, where_clause);
    let values: Vec<String> = params.into_iter().skip(1).map(|(_, v)| v).collect();
    let conn = state.conn.lock().unwrap();
    conn.execute(&query, rusqlite::params_from_iter(&values))
        .map_err(|e| map_sqlite_error(e))?;
    Ok(StatusCode::NO_CONTENT)
}

// Execute a query and map rows to JSON
fn execute_query(
    conn: &Connection,
    query: &str,
    params: &[String],
    columns: &[ColumnSchema],
) -> Result<Vec<Value>, StatusCode> {
    let mut stmt = conn.prepare(query).map_err(|e| map_sqlite_error(e))?;
    let rows = stmt
        .query_map(rusqlite::params_from_iter(params), |row| {
            let mut map = serde_json::Map::new();
            for (i, col) in columns.iter().enumerate() {
                let value: Value = match row.get::<_, Option<String>>(i)? {
                    Some(v) => json!(v),
                    None => json!(null),
                };
                map.insert(col.name.clone(), value);
            }
            Ok(json!(map))
        })
        .map_err(|e| map_sqlite_error(e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| map_sqlite_error(e))?;
    Ok(rows)
}

// Map SQLite errors to HTTP status codes
fn map_sqlite_error(e: RusqliteError) -> StatusCode {
    match e {
        RusqliteError::QueryReturnedNoRows => StatusCode::NOT_FOUND,
        RusqliteError::SqliteFailure(_, Some(msg)) if msg.contains("constraint") => {
            StatusCode::BAD_REQUEST
        }
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

// Generate OpenAPI 3.0 specification
fn generate_openapi(schemas: &[TableSchema]) -> Value {
    let mut paths = serde_json::Map::new();
    for schema in schemas {
        let path_prefix = format!("/{}", schema.name);
        let pk_path = if schema.primary_keys.len() == 1 {
            format!("/{}/{}", schema.name, schema.primary_keys[0])
        } else {
            let pk_segment = schema
                .primary_keys
                .iter()
                .map(|pk| format!("/{}", pk))
                .collect::<Vec<_>>()
                .join("");
            format!("/{}{}", schema.name, pk_segment)
        };

        // Define schema for the table
        let mut properties = serde_json::Map::new();
        for col in &schema.columns {
            let col_type = match col.type_name.to_lowercase().as_str() {
                "integer" => json!({ "type": "integer" }),
                "real" => json!({ "type": "number", "format": "float" }),
                "text" => json!({ "type": "string" }),
                "blob" => json!({ "type": "string", "format": "binary" }),
                _ => json!({ "type": "string" }),
            };
            let mut col_schema = col_type;
            if col.not_null {
                col_schema = json!({
                    "type": col_schema["type"],
                    "format": col_schema.get("format"),
                    "nullable": false
                });
            }
            properties.insert(col.name.clone(), col_schema);
        }
        let table_schema = json!({
            "type": "object",
            "properties": properties,
            "required": schema.columns.iter().filter(|c| c.not_null).map(|c| c.name.clone()).collect::<Vec<_>>()
        });

        // Define paths
        let mut path_obj = serde_json::Map::new();
        path_obj.insert(
            "get".to_string(),
            json!({
                "summary": format!("List all {} records", schema.name),
                "responses": {
                    "200": {
                        "description": "List of records",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": table_schema
                                }
                            }
                        }
                    }
                }
            }),
        );
        path_obj.insert(
            "post".to_string(),
            json!({
                "summary": format!("Create a {} record", schema.name),
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": table_schema
                        }
                    }
                },
                "responses": {
                    "201": { "description": "Created" },
                    "400": { "description": "Bad request" }
                }
            }),
        );
        paths.insert(path_prefix.clone(), json!(path_obj));

        let mut pk_path_obj = serde_json::Map::new();
        pk_path_obj.insert(
            "get".to_string(),
            json!({
                "summary": format!("Get a {} record by primary key", schema.name),
                "parameters": schema.primary_keys.iter().map(|pk| json!({
                    "name": pk,
                    "in": "path",
                    "required": true,
                    "schema": { "type": "string" }
                })).collect::<Vec<_>>(),
                "responses": {
                    "200": {
                        "description": "Record",
                        "content": {
                            "application/json": { "schema": table_schema }
                        }
                    },
                    "404": { "description": "Not found" }
                }
            }),
        );
        pk_path_obj.insert(
            "put".to_string(),
            json!({
                "summary": format!("Update a {} record", schema.name),
                "parameters": schema.primary_keys.iter().map(|pk| json!({
                    "name": pk,
                    "in": "path",
                    "required": true,
                    "schema": { "type": "string" }
                })).collect::<Vec<_>>(),
                "requestBody": {
                    "content": {
                        "application/json": { "schema": table_schema }
                    }
                },
                "responses": {
                    "200": { "description": "Updated" },
                    "400": { "description": "Bad request" },
                    "404": { "description": "Not found" }
                }
            }),
        );
        pk_path_obj.insert(
            "delete".to_string(),
            json!({
                "summary": format!("Delete a {} record", schema.name),
                "parameters": schema.primary_keys.iter().map(|pk| json!({
                    "name": pk,
                    "in": "path",
                    "required": true,
                    "schema": { "type": "string" }
                })).collect::<Vec<_>>(),
                "responses": {
                    "204": { "description": "Deleted" },
                    "404": { "description": "Not found" }
                }
            }),
        );
        paths.insert(pk_path, json!(pk_path_obj));
    }

    json!({
        "openapi": "3.0.0",
        "info": {
            "title": "SQLite CRUD API",
            "version": "1.0.0"
        },
        "paths": paths
    })
}