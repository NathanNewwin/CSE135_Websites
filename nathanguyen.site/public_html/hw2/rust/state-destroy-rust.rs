use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    let cookie_name = "MySessionID";
    let temp_dir = env::temp_dir();
    let mut message = "No session to destroy.";

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

    if !sid.is_empty() {
        let session_filename = format!("sess_{}.json", sid);
        let session_path = temp_dir.join(session_filename);
        if session_path.exists() {
            if fs::remove_file(session_path).is_ok() {
                message = "Session file deleted successfully.";
            } else {
                message = "Error deleting session file.";
            }
        } else {
            message = "Session file not found (already deleted?).";
        }
    }

    println!("Set-Cookie: {}=; Max-Age=0; Path=/; HttpOnly", cookie_name);
    println!("Content-Type: text/html\n");

    println!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Session Destroyed</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">Session Destroyed</h1>
    </header>

    <div class="card active">
        <h2>Status</h2>
        <p>{}</p>
        
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                <a href="session-form-rust.html" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
                <a href="state-1-rust.cgi" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 1</a>
                <a href="state-2-rust.cgi" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 2</a>
        </div>
    </div>
</div>
</body>
</html>"#, message);
}