use std::env;
use std::io::{self, Read};
use std::collections::HashMap;

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
    for pair in input.split('&') {
        let mut split = pair.splitn(2, '=');
        if let (Some(k), Some(v)) = (split.next(), split.next()) {
            map.insert(k.to_string(), url_decode(v));
        }
    }
    map
}

fn parse_json_value(json: &str, key: &str) -> String {
    let search_key = format!("\"{}\"", key);
    if let Some(idx) = json.find(&search_key) {
        let remainder = &json[idx + search_key.len()..];
        if let Some(colon_idx) = remainder.find(':') {
            let value_part = &remainder[colon_idx + 1..].trim();
            if value_part.starts_with('"') {
                if let Some(end_quote) = value_part[1..].find('"') {
                    return value_part[1..=end_quote].to_string();
                }
            }
        }
    }
    String::from("Undefined")
}


fn main() {
    println!("Content-Type: text/html\n");

    let method = env::var("REQUEST_METHOD").unwrap_or_default();
    let query_string = env::var("QUERY_STRING").unwrap_or_default();
    let protocol = env::var("SERVER_PROTOCOL").unwrap_or_default();
    let content_type = env::var("CONTENT_TYPE").unwrap_or_default();

    let mut body_raw = String::new();
    io::stdin().read_to_string(&mut body_raw).unwrap_or(0);

    let mut title = String::from("Undefined");
    let mut body_content = String::from("Undefined");

    if method == "GET" {
        let params = parse_query_string(&query_string);
        if let Some(t) = params.get("title") { title = t.clone(); }
        if let Some(b) = params.get("body") { body_content = b.clone(); }
    } else {
        if content_type.contains("application/json") {
            title = parse_json_value(&body_raw, "title");
            body_content = parse_json_value(&body_raw, "body");
        } else {
            let params = parse_query_string(&body_raw);
            if let Some(t) = params.get("title") { title = t.clone(); }
            if let Some(b) = params.get("body") { body_content = b.clone(); }
        }
    }

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
        <h1 class="course-title">Echo Chamber</h1>
        <p class="course-subtitle">Rust Processor</p>
    </header>

    <div class="card">
        <h2>Message Details</h2>
        <table>
            <tr><th>Key</th><th>Value</th></tr>
            <tr><td>Title</td><td>{}</td></tr>
            <tr><td>Body</td><td>{}</td></tr>
        </table>
    </div>

    <div class="card">
        <h2>Request Details</h2>
        <table>
            <tr><th>Key</th><th>Value</th></tr>
            <tr><td>Protocol</td><td>{}</td></tr>
            <tr><td>Method</td><td>{}</td></tr>
            <tr><td>Query String</td><td>{}</td></tr>
        </table>
    </div>

    <div class="card">
        <h2>Server Headers</h2>
        <table>
            <tr><th>Header</th><th>Value</th></tr>"#, 
        title, body_content, protocol, method, query_string);

    let mut vars: Vec<(String, String)> = env::vars().collect();
    vars.sort_by(|a, b| a.0.cmp(&b.0));
    
    for (key, value) in vars {
        println!("<tr><td>{}</td><td>{}</td></tr>", key, value);
    }

    println!(r#"        </table>
    </div>

    <div style="text-align: center;">
        <a href="../echo-form.html">&larr; Return to Form</a>
    </div>

</div>
</body>
</html>"#);
}