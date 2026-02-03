#!/usr/bin/env node

console.log("Content-Type: text/html\n");

const date = new Date().toString();
const remoteAddr = process.env.REMOTE_ADDR || "Unknown";

console.log(`<!DOCTYPE html>
<html>
<head>
  <title>Hello Node.js</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1 align=center>Hello, World!</h1>
  <p>Nathan says hello!</p>
  <p>This page was generated using Node.js CGI.</p>
  <p>This program was generated at: ${date}</p>
  <p>Your IP Address is: ${remoteAddr}</p>
</body>
</html>`);