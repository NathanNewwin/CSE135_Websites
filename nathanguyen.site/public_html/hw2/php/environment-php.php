<?php
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>PHP Environment</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1 align="center">Environment Variables (PHP)</h1>
    <pre>
<?php
    $env = $_SERVER;
    ksort($env);

    foreach ($env as $key => $value) {
        if (is_array($value)) {
            $value = json_encode($value);
        }
        echo htmlspecialchars($key) . ": " . htmlspecialchars($value) . "\n";
    }
?>
    </pre>
</body>
</html>