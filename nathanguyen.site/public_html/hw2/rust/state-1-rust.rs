use std::env;
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::PathBuf;

fn url_decode(s: &str) -> String {
    let mut res = String::new();
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c == '%' {
            let hex: String = chars.clone().take(2).collect();
            if hex.len() == 2 {
                if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                    res.push(byte as char);
                    chars.next(); chars.next();
                    continue;
                }
            }
        } else if c == '+' {
            res.push(' ');
            continue;
        }
        res.push(c);
    }
    res
}

fn generate_session_id() -> String {
    let mut f = File::open("/dev/urandom").unwrap();
    let mut buf = [0u8; 16];
    f.read_exact(&mut buf).unwrap();
    let mut s = String::new();
    for byte in buf.iter() {
        s.push_str(&format!("{:02x}", byte));
    }
    s
}

fn parse_username_from_json(json: &str) -> String {
    let key = "\"username\"";
    if let Some(idx) = json.find(key) {
        let remainder = &json[idx + key.len()..];
        if let Some(colon) = remainder.find(':') {
            let val_part = &remainder[colon + 1..].trim();
            if val_part.starts_with('"') {
                if let Some(end_quote) = val_part[1..].find('"') {
                    return val_part[1..=end_quote].to_string();
                }
            }
        }
    }
    "No name set".to_string()
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
        sid = generate_session_id();
    }

    let session_filename = format!("sess_{}.json", sid);
    let session_path = temp_dir.join(session_filename);

    let mut username = "No name set".to_string();
    if session_path.exists() {
        if let Ok(content) = fs::read_to_string(&session_path) {
            username = parse_username_from_json(&content);
        }
    }
    if let Ok(method) = env::var("REQUEST_METHOD") {
        if method == "POST" {
            let mut body = String::new();
            io::stdin().read_to_string(&mut body).unwrap_or(0);
            
            for pair in body.split('&') {
                let mut split = pair.splitn(2, '=');
                if let (Some(k), Some(v)) = (split.next(), split.next()) {
                    if k == "username" {
                        username = url_decode(v);
                        let json_str = format!("{{\"username\": \"{}\"}}", username);
                        let _ = fs::write(&session_path, json_str);
                        break;
                    }
                }
            }
        }
    }

    println!("Set-Cookie: {}={}; Path=/; HttpOnly", cookie_name, sid);
    println!("Content-Type: text/html\n");

    println!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>State Page 1</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">State Page 1</h1>
    </header>

    <div class="card active">
        <h2>State Data</h2>
        <p><strong>Name:</strong> {}</p>
        <p><strong>Session ID:</strong> <span style="color: #8ab4f8; font-family: monospace;">{}</span></p>
    </div>

    <div class="card">
        <h2>Actions</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="state-2-rust.cgi" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 2</a>
            <a href="session-form-rust.html" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
            <form action="state-destroy-rust.cgi" method="POST" style="margin: 0;">
                <button type="submit" class="hw2-tab" style="background-color: #543737; border-color: #b59e9e;">Destroy Session</button>
            </form>
        </div>
    </div>
</div>
</body>
</html>"#, username, sid);
}