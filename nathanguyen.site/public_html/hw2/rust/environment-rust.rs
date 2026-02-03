use std::env;

fn main() {
    println!("Content-Type: text/html\n");

    println!(r#"<!DOCTYPE html>
<html>
<head>
    <title>Rust Environment</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1 align="center">Environment Variables (Rust)</h1>
    <pre>"#);

    // Sort vars
    let mut vars: Vec<(String, String)> = env::vars().collect();
    vars.sort_by(|a, b| a.0.cmp(&b.0));

    for (key, value) in vars {
        println!("{}: {}", key, value);
    }

    println!(r#"</pre>
</body>
</html>"#);
}