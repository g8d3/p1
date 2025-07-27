use axum::{
    body::Body,
    http::{Request, StatusCode},
    Json, // Add Json import
};
use mylib::{AppState, get_schemas, generate_openapi, create_table_router}; // Remove mylib
use rusqlite::Connection;
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use tower::ServiceExt;

#[tokio::test]
async fn test_list_users() {
    // Create a temporary SQLite database
    let db_path = "test.db";
    let conn = Connection::open(db_path).unwrap();
    conn.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO users (id, name, email) VALUES (1, 'Test User', 'test@example.com')",
        [],
    )
    .unwrap();

    // Set up the app state
    let conn = Arc::new(Mutex::new(conn));
    let schemas = get_schemas(&conn).unwrap();
    let schemas = Arc::new(schemas);
    let mut app = axum::Router::new();
    app = app.route("/openapi.json", axum::routing::get(|| async { Json(generate_openapi(&schemas)) }));
    for schema in schemas.iter() {
        let state = AppState {
            conn: conn.clone(),
            schemas: schemas.clone(),
        };
        let table_router = create_table_router(schema);
        app = app.nest(&format!("/{}", schema.name), table_router.with_state(state));
    }

    // Create a client to send requests
    let request = Request::builder()
        .method("GET")
        .uri("/users")
        .header("content-type", "application/json")
        .body(Body::empty())
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check the response
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(
        body,
        json!([
            {
                "id": "1",
                "name": "Test User",
                "email": "test@example.com"
            }
        ])
    );

    // Clean up
    std::fs::remove_file(db_path).unwrap();
}

#[tokio::test]
async fn test_get_user() {
    // Create a temporary SQLite database
    let db_path = "test.db";
    let conn = Connection::open(db_path).unwrap();
    conn.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO users (id, name, email) VALUES (1, 'Test User', 'test@example.com')",
        [],
    )
    .unwrap();

    // Set up the app state
    let conn = Arc::new(Mutex::new(conn));
    let schemas = get_schemas(&conn).unwrap();
    let schemas = Arc::new(schemas);
    let mut app = axum::Router::new();
    app = app.route("/openapi.json", axum::routing::get(|| async { Json(generate_openapi(&schemas)) }));
    for schema in schemas.iter() {
        let state = AppState {
            conn: conn.clone(),
            schemas: schemas.clone(),
        };
        let table_router = create_table_router(schema);
        app = app.nest(&format!("/{}", schema.name), table_router.with_state(state));
    }

    // Create a client to send requests
    let request = Request::builder()
        .method("GET")
        .uri("/users/1")
        .header("content-type", "application/json")
        .body(Body::empty())
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check the response
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(
        body,
        json!({
            "id": "1",
            "name": "Test User",
            "email": "test@example.com"
        })
    );

    // Clean up
    std::fs::remove_file(db_path).unwrap();
}

#[tokio::test]
async fn test_get_user_not_found() {
    // Create a temporary SQLite database
    let db_path = "test.db";
    let conn = Connection::open(db_path).unwrap();
    conn.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)",
        [],
    )
    .unwrap();

    // Set up the app state
    let conn = Arc::new(Mutex::new(conn));
    let schemas = get_schemas(&conn).unwrap();
    let schemas = Arc::new(schemas);
    let mut app = axum::Router::new();
    app = app.route("/openapi.json", axum::routing::get(|| async { Json(generate_openapi(&schemas)) }));
    for schema in schemas.iter() {
        let state = AppState {
            conn: conn.clone(),
            schemas: schemas.clone(),
        };
        let table_router = create_table_router(schema);
        app = app.nest(&format!("/{}", schema.name), table_router.with_state(state));
    }

    // Create a client to send requests
    let request = Request::builder()
        .method("GET")
        .uri("/users/1")
        .header("content-type", "application/json")
        .body(Body::empty())
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check the response
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    // Clean up
    std::fs::remove_file(db_path).unwrap();
}