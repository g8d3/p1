use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use mylib::mylib;
use serde_json::{json, Value};
use tokio::net::TcpListener;
use tower::ServiceExt;

#[tokio::test]
async fn test_list_users() {
    // Create a temporary SQLite database
    let db_path = "test.db";
    let conn = rusqlite::Connection::open(db_path).unwrap();
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

    // Start the server in a background task
    let server = tokio::spawn(mylib(db_path));

    // Wait briefly for the server to start
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    // Create a client to send requests
    let app = mylib::mylib(db_path).await.unwrap();
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
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
    server.abort();
    std::fs::remove_file(db_path).unwrap();
}

#[tokio::test]
async fn test_get_user() {
    // Create a temporary SQLite database
    let db_path = "test.db";
    let conn = rusqlite::Connection::open(db_path).unwrap();
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

    // Start the server in a background task
    let server = tokio::spawn(mylib(db_path));

    // Wait briefly for the server to start
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    // Create a client to send requests
    let app = mylib::mylib(db_path).await.unwrap();
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
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
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
    server.abort();
    std::fs::remove_file(db_path).unwrap();
}

#[tokio::test]
async fn test_get_user_not_found() {
    // Create a temporary SQLite database
    let db_path = "test.db";
    let conn = rusqlite::Connection::open(db_path).unwrap();
    conn.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)",
        [],
    )
    .unwrap();

    // Start the server in a background task
    let server = tokio::spawn(mylib(db_path));

    // Wait briefly for the server to start
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    // Create a client to send requests
    let app = mylib::mylib(db_path).await.unwrap();
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
    server.abort();
    std::fs::remove_file(db_path).unwrap();
}