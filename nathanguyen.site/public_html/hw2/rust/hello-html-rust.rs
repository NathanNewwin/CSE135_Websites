use std::env;
use std::process::Command;

fn main() {
    println!("Content-Type: text/html\n");

    let remote_addr = env::var("REMOTE_ADDR").unwrap_or_else(|_| "Unknown".to_string());
    let date_output = Command::new("date").output().expect("failed to execute process");
    let date = String::from_utf8_lossy(&date_output.stdout).trim().to_string();

    println!(r#"<!DOCTYPE html>
<html>
<head>
  <title>Hello Rust</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1 align=center>Hello, World!</h1>
  <p>Nathan says hello!</p>
  <p>This page was generated using Rust CGI.</p>
  <p>This program was generated at: {}</p>
  <p>Your IP Address is: {}</p>
</body>
</html>"#, date, remote_addr);
}