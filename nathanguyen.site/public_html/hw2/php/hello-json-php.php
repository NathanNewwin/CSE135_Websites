<?php
// 1. Get Data
$date = date('D M j H:i:s Y'); // Matches Python's ctime format roughly
$remote_addr = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

// 2. Set Headers
header('Cache-Control: no-cache');
header('Content-Type: application/json');

// 3. Build Array
$response = [
    "title" => "Hello, PHP!",
    "heading" => "Hello, PHP!",
    "message" => "Nathan says hello! This page was generated with PHP",
    "time" => $date,
    "IP" => $remote_addr
];

// 4. Print JSON
echo json_encode($response);
?>