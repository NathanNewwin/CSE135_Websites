use std::env;
use std::io::{self, Read};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

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

fn parse_query_string(input: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    if input.is_empty() { return map; }
    for pair in input.split('&') {
        let mut split = pair.splitn(2, '=');
        if let (Some(k), Some(v)) = (split.next(), split.next()) {
            map.insert(k.to_string(), url_decode(v));
        }
    }
    map
}

fn parse_json_manual(json: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let trimmed = json.trim();
    if trimmed.starts_with('{') && trimmed.ends_with('}') {
        let content = &trimmed[1..trimmed.len()-1];
        for pair in content.split(',') {
            let parts: Vec<&str> = pair.splitn(2, ':').collect();
            if parts.len() == 2 {
                let key = parts[0].trim().trim_matches('"');
                let val = parts[1].trim().trim_matches('"');
                map.insert(key.to_string(), val.to_string());
            }
        }
    }
    map
}

fn main() {
    let method = env::var("REQUEST_METHOD").unwrap_or_else(|_| "GET".to_string());
    let content_type = env::var("CONTENT_TYPE").unwrap_or_else(|_| "".to_string());
    let query_string = env::var("QUERY_STRING").unwrap_or_else(|_| "".to_string());
    let remote_addr = env::var("REMOTE_ADDR").unwrap_or_else(|_| "Unknown".to_string());
    let user_agent = env::var("HTTP_USER_AGENT").unwrap_or_else(|_| "Unknown".to_string());
    let server_name = env::var("SERVER_NAME").unwrap_or_else(|_| "localhost".to_string());
    
    // Simple timestamp logic
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let time_display = format!("Unix Timestamp: {}", now);

    let mut payload_data: HashMap<String, String> = HashMap::new();
    
    if method == "GET" || method == "DELETE" {
        payload_data = parse_query_string(&query_string);
    } else {
        let mut body_raw = String::new();
        io::stdin().read_to_string(&mut body_raw).unwrap_or(0);

        if !body_raw.is_empty() {
            if content_type.contains("application/json") {
                payload_data = parse_json_manual(&body_raw);
            } else {
                payload_data = parse_query_string(&body_raw);
            }
        }
    }

    println!("Content-Type: text/html\n");

    println!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Echo Rust</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    
    <header class="course-header">
        <h1 class="course-title">Echo Rust</h1>
    </header>

    <div class="card active">
        <h2>Server Details</h2>
        <p><strong>Method:</strong> {}</p>
        <p><strong>Encoding:</strong> {}</p>
        <p><strong>Host:</strong> {}</p>
        <p><strong>IP:</strong> {}</p>
        <p><strong>Time:</strong> {}</p>
    </div>

    <div class="card">
        <h2>Received Body</h2>
        <div style="padding-top: 5px;">"#, 
        method, 
        if content_type.is_empty() { "N/A" } else { &content_type }, 
        server_name, 
        remote_addr, 
        time_display
    );

    if payload_data.is_empty() {
        println!("<p style='opacity: 0.6;'>No data parameters received.</p>");
    } else {
        println!("<table>");
        println!("<tr><th>Key</th><th>Value</th></tr>");
        for (k, v) in &payload_data {
            println!("<tr><td>{}</td><td>{}</td></tr>", k, v);
        }
        println!("</table>");
    }

    println!(r#"        </div>
    </div>

    <div class="card">
        <h3>User Agent</h3>
        <p style="font-size: 0.85rem; line-height: 1.4; color: #8ab4f8; word-wrap: break-word;">
            {}
        </p>
    </div>

    <div style="text-align: center; margin-top: 10px;">
        <a href="../echo-form.html" style="font-size: 1.1rem; font-weight: bold;">&larr; Return to Form</a>
    </div>

</div>
</body>
</html>"#, user_agent);
}