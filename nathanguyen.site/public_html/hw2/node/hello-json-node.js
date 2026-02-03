#!/usr/bin/env node

console.log("Cache-Control: no-cache");
console.log("Content-Type: application/json\n");

const date = new Date().toString();
const remoteAddr = process.env.REMOTE_ADDR || "Unknown";

const message = {
    title: "Hello, Node!",
    heading: "Hello, Node!",
    message: "Nathan says hello! This page was generated with Node.js CGI",
    time: date,
    IP: remoteAddr
};

console.log(JSON.stringify(message));