<?php
$title = "Undefined";
$body = "Undefined";
$method = $_SERVER['REQUEST_METHOD'];
$protocol = $_SERVER['SERVER_PROTOCOL'];
$query_string = $_SERVER['QUERY_STRING'] ?? '';

$raw_input = file_get_contents('php://input');

if ($method === 'GET') {
    $title = $_GET['title'] ?? $title;
    $body = $_GET['body'] ?? $body;
} elseif ($method === 'POST') {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
        $json_data = json_decode($raw_input, true);
        $title = $json_data['title'] ?? $title;
        $body = $json_data['body'] ?? $body;
    } else {
        $title = $_POST['title'] ?? $title;
        $body = $_POST['body'] ?? $body;
    }
} else {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
        $json_data = json_decode($raw_input, true);
        $title = $json_data['title'] ?? $title;
        $body = $json_data['body'] ?? $body;
    } else {
        parse_str($raw_input, $put_vars);
        $title = $put_vars['title'] ?? $title;
        $body = $put_vars['body'] ?? $body;
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
        <h1 class="course-title">Echo Chamber</h1>
        <p class="course-subtitle">PHP Processor</p>
    </header>

    <div class="card">
        <h2>Message Details</h2>
        <table>
            <tr>
                <th>Key</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Title</td>
                <td><?php echo htmlspecialchars($title); ?></td>
            </tr>
            <tr>
                <td>Body</td>
                <td><?php echo htmlspecialchars($body); ?></td>
            </tr>
        </table>
    </div>

    <div class="card">
        <h2>Request Details</h2>
        <table>
            <tr>
                <th>Key</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Protocol</td>
                <td><?php echo htmlspecialchars($protocol); ?></td>
            </tr>
            <tr>
                <td>Method</td>
                <td><?php echo htmlspecialchars($method); ?></td>
            </tr>
            <tr>
                <td>Query String</td>
                <td><?php echo htmlspecialchars($query_string); ?></td>
            </tr>
        </table>
    </div>

    <div class="card">
        <h2>Server Headers</h2>
        <table>
            <tr>
                <th>Header</th>
                <th>Value</th>
            </tr>
            <?php
            ksort($_SERVER);
            foreach ($_SERVER as $key => $val) {
                if (is_array($val)) $val = json_encode($val);
                echo "<tr>";
                echo "<td>" . htmlspecialchars($key) . "</td>";
                echo "<td>" . htmlspecialchars($val) . "</td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>

    <div style="text-align: center;">
        <a href="../echo-form.html">&larr; Return to Form</a>
    </div>

</div>
</body>
</html>