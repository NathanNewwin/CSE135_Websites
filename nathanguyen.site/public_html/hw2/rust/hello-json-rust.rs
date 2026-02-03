use std::env;
use std::process::Command;

fn main() {
    println!("Cache-Control: no-cache");
    println!("Content-Type: application/json\n");

    let remote_addr = env::var("REMOTE_ADDR").unwrap_or_else(|_| "Unknown".to_string());
    
    let date_output = Command::new("date").output().expect("failed to execute process");
    let date = String::from_utf8_lossy(&date_output.stdout).trim().to_string();

    println!(
        "{{\"title\": \"Hello, Rust!\", \"heading\": \"Hello, Rust!\", \"message\": \"Nathan says hello! This page was generated with Rust CGI\", \"time\": \"{}\", \"IP\": \"{}\"}}", 
        date, remote_addr
    );
}