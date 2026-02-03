#!/usr/bin/env python3
import os
import tempfile
from http import cookies

COOKIE_NAME = "MySessionID"
TEMP_DIR = tempfile.gettempdir()

message = "No session to destroy."

cookie_string = os.environ.get("HTTP_COOKIE")
c = cookies.SimpleCookie()
if cookie_string:
    c.load(cookie_string)

if COOKIE_NAME in c:
    sid = c[COOKIE_NAME].value
    session_file = os.path.join(TEMP_DIR, f"sess_{sid}.json")
    
    if os.path.exists(session_file):
        os.remove(session_file)
        message = "Session file deleted successfully."
    else:
        message = "Session file not found (already deleted?)."

print(f"Set-Cookie: {COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly")
print("Content-Type: text/html\n")

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Session Destroyed</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">Session Destroyed</h1>
    </header>

    <div class="card active">
        <h2>Status</h2>
        <p>{message}</p>
        
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                <a href="session-form-python.html" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
                <a href="state-1-python.py" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 1</a>
                <a href="state-2-python.py" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 2</a>
        </div>
    </div>
</div>
</body>
</html>
""")