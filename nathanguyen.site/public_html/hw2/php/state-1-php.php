<?php
session_start();
if (isset($_POST['username'])) {
    $_SESSION['username'] = $_POST['username'];
}

$username = isset($_SESSION['username']) ? $_SESSION['username'] : "No name set";
$sid = session_id();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>State Page 1 (PHP)</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">State Page 1</h1>
    </header>

    <div class="card active">
        <h2>State Data</h2>
        <p><strong>Name:</strong> <?php echo htmlspecialchars($username); ?></p>
        <p><strong>Session ID:</strong> <span style="color: #8ab4f8; font-family: monospace;"><?php echo $sid; ?></span></p>
    </div>

    <div class="card">
        <h2>Actions</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="state-2-php.php" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 2</a>
            <a href="session-form-php.html" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
            
            <form action="state-destroy-php.php" method="POST" style="margin: 0;">
                <button type="submit" class="hw2-tab" style="background-color: #543737; border-color: #b59e9e;">Destroy Session</button>
            </form>
        </div>
    </div>
</div>
</body>
</html>