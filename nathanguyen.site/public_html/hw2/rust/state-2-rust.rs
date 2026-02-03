use std::env;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
struct SessionData {
    username: String,
}

fn main() {
    let cookie_name = "MySessionID";
    let temp_dir = env::temp_dir();

    let mut sid = String::new();
    if let Ok(cookie_str) = env::var("HTTP_COOKIE") {
        for pair in cookie_str.split(';') {
            let pair = pair.trim();
            if pair.starts_with(&format!("{}=", cookie_name)) {
                if let Some(val) = pair.split('=').nth(1) {
                    sid = val.to_string();
                }
            }
        }
    }

    if sid.is_empty() {
        sid = Uuid::new_v4().to_string();
    }

    let session_filename = format!("sess_{}.json", sid);
    let session_path = temp_dir.join(session_filename);
    
    let mut data = SessionData { username: "No name set".to_string() };
    if session_path.exists() {
        if let Ok(content) = fs::read_to_string(&session_path) {
            if let Ok(json_data) = serde_json::from_str::<SessionData>(&content) {
                data = json_data;
            }
        }
    }

    println!("Set-Cookie: {}={}; Path=/; HttpOnly", cookie_name, sid);
    println!("Content-Type: text/html\n");

    println!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>State Page 2</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">State Page 2</h1>
    </header>

    <div class="card active">
        <h2>State Data</h2>
        <p><strong>Name:</strong> {}</p>
        <p><strong>Session ID:</strong> <span style="color: #8ab4f8; font-family: monospace;">{}</span></p>
    </div>

    <div class="card">
        <h2>Actions</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="state-1-rust" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 1</a>
            <a href="session-form-rust.html" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
            <form action="state-destroy-rust" method="POST" style="margin: 0;">
                <button type="submit" class="hw2-tab" style="background-color: #543737; border-color: #b59e9e;">Destroy Session</button>
            </form>
        </div>
    </div>
</div>
</body>
</html>"#, data.username, sid);
}