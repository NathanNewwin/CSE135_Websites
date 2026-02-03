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
    // Get all server variables
    $env = $_SERVER;
    
    // Sort keys alphabetically
    ksort($env);

    foreach ($env as $key => $value) {
        // Handle array values just in case
        if (is_array($value)) {
            $value = json_encode($value);
        }
        echo htmlspecialchars($key) . ": " . htmlspecialchars($value) . "\n";
    }
?>
    </pre>
</body>
</html>