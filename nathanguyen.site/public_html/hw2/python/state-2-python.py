#!/usr/bin/env python3
import os
import json
import uuid
import tempfile
from http import cookies

COOKIE_NAME = "MySessionID"
TEMP_DIR = tempfile.gettempdir()

cookie_string = os.environ.get("HTTP_COOKIE")
c = cookies.SimpleCookie()
if cookie_string:
    c.load(cookie_string)

if COOKIE_NAME in c:
    sid = c[COOKIE_NAME].value
else:
    sid = str(uuid.uuid4())

session_file = os.path.join(TEMP_DIR, f"sess_{sid}.json")
data = {}

if os.path.exists(session_file):
    try:
        with open(session_file, "r") as f:
            data = json.load(f)
    except:
        data = {}

display_name = data.get("username", "No name set")

print(f"Set-Cookie: {COOKIE_NAME}={sid}; Path=/; HttpOnly")
print("Content-Type: text/html\n")

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>State Page 2</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">State Page 2</h1>
    </header>

    <div class="card active">
        <h2>State Data</h2>
        <p><strong>Name:</strong> {display_name}</p>
        <p><strong>Session ID:</strong> <span style="color: #8ab4f8; font-family: monospace;">{sid}</span></p>
    </div>

    <div class="card">
        <h2>Actions</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="state-1-python.py" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">State Page 1</a>
            <a href="session-form-python.html" style="text-align: center; display: block; padding: 12px; border: 1px solid #5a5a7a; border-radius: 8px; background-color: #2b2b3b; color: #fff; text-decoration: none;">Back to Form</a>
            <form action="state-destroy-python.py" method="POST" style="margin: 0;">
                <button type="submit" class="hw2-tab" style="background-color: #543737; border-color: #b59e9e;">Destroy Session</button>
            </form>
        </div>
    </div>
</div>
</body>
</html>
""")