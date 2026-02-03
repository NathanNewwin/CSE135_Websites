#!/usr/bin/env node

console.log("Content-Type: text/html\n");

const keys = Object.keys(process.env).sort();

console.log(`<!DOCTYPE html>
<html>
<head>
    <title>Node Environment</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1 align="center">Environment Variables (Node)</h1>
    <pre>`);

for (const key of keys) {
    console.log(`${key}: ${process.env[key]}`);
}

console.log(`</pre>
</body>
</html>`);