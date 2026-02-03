<?php
session_start();
$_SESSION = array();
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Session Destroyed (PHP)</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">Logged Out</h1>
        <p class="course-subtitle">Session Destroyed</p>
    </header>

    <div class="card active">
        <h2>Status</h2>
        <p>Session destroyed successfully.</p>
        
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
            <a href="session-form-php.php" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
            <a href="state-1-php.php" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 1</a>
            <a href="state-2-php.php" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 2</a>
        </div>
    </div>
</div>
</body>
</html>