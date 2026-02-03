<?php
$date = date('Y-m-d H:i:s');
$remote_addr = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
  <title>Hello PHP</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1 align="center">Hello, World!</h1>
  <p>Nathan says hello!</p>
  <p>This page was generated using PHP.</p>
  <p>This program was generated at: <?php echo $date; ?></p>
  <p>Your IP Address is: <?php echo $remote_addr; ?></p>
</body>
</html>