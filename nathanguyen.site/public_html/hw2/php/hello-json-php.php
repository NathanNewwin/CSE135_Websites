<?php
$date = date('D M j H:i:s Y');
$remote_addr = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

header('Cache-Control: no-cache');
header('Content-Type: application/json');

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