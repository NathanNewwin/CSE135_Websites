<?php
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$content_type = $_SERVER['CONTENT_TYPE'] ?? '';
$query_string = $_SERVER['QUERY_STRING'] ?? '';
$remote_addr = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
$server_name = $_SERVER['SERVER_NAME'] ?? 'localhost';
$request_time = date('Y-m-d H:i:s');

$payload_data = [];
$raw_input = file_get_contents('php://input');

if ($method === 'GET' || $method === 'DELETE') {
    $payload_data = $_GET;
} else {
    if (stripos($content_type, 'application/json') !== false) {
        $json_decoded = json_decode($raw_input, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $payload_data = $json_decoded;
        } else {
            $payload_data = ["Error" => "Malformed JSON", "Raw" => $raw_input];
        }
    } else {
        if ($method === 'POST') {
            $payload_data = $_POST;
        } else {
            parse_str($raw_input, $payload_data);
        }
    }
}

header("Content-Type: text/html");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Echo PHP</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    
    <header class="course-header">
        <h1 class="course-title">Echo PHP</h1>
    </header>

    <div class="card active">
        <h2>Server Details</h2>
        <p><strong>Method:</strong> <?php echo htmlspecialchars($method); ?></p>
        <p><strong>Encoding:</strong> <?php echo htmlspecialchars($content_type ?: "N/A"); ?></p>
        <p><strong>Host:</strong> <?php echo htmlspecialchars($server_name); ?></p>
        <p><strong>IP:</strong> <?php echo htmlspecialchars($remote_addr); ?></p>
        <p><strong>Time:</strong> <?php echo $request_time; ?></p>
    </div>

    <div class="card">
        <h2>Received Body</h2>
        <div style="padding-top: 5px;">
            <?php if (empty($payload_data)): ?>
                <p style='opacity: 0.6;'>No data parameters received.</p>
            <?php else: ?>
                <table>
                    <tr><th>Key</th><th>Value</th></tr>
                    <?php foreach ($payload_data as $k => $v): ?>
                        <tr>
                            <td><?php echo htmlspecialchars((string)$k); ?></td>
                            <td><?php echo htmlspecialchars(is_array($v) ? json_encode($v) : (string)$v); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <div class="card">
        <h3>User Agent</h3>
        <p style="font-size: 0.85rem; line-height: 1.4; color: #8ab4f8; word-wrap: break-word;">
            <?php echo htmlspecialchars($user_agent); ?>
        </p>
    </div>

    <div style="text-align: center; margin-top: 10px;">
        <a href="../echo-form.html" style="font-size: 1.1rem; font-weight: bold;">&larr; Return to Form</a>
    </div>

</div>
</body>
</html>