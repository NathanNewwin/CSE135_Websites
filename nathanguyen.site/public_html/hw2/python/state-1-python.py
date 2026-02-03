#!/usr/bin/env python3
import os
import cgi
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

form = cgi.FieldStorage()
new_name = form.getvalue('username')

if new_name:
    data["username"] = new_name
    with open(session_file, "w") as f:
        json.dump(data, f)

display_name = data.get("username", "No name set")

print(f"Set-Cookie: {COOKIE_NAME}={sid}; Path=/; HttpOnly")
print("Content-Type: text/html\n")

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>State Page 1</title>
    <link rel="stylesheet" href="/hw2/style.css">
</head>
<body>
<div class="page">
    <header class="course-header">
        <h1 class="course-title">State Page 1</h1>
        <p class="course-subtitle">Session Initialized</p>
    </header>

    <div class="card active">
        <h2>Current Session Data</h2>
        <p><strong>Name:</strong> {display_name}</p>
        <p><strong>Session ID:</strong> <span style="color: #8ab4f8; font-family: monospace;">{sid}</span></p>
    </div>

    <div class="card">
        <h2>Update Data</h2>
        <form action="state-1-python.py" method="POST">
            <label>Change Name:</label>
            <input type="text" name="username" placeholder="Enter new name">
            <button type="submit" class="hw2-tab">Save</button>
        </form>
    </div>

    <div style="text-align: center;">
        <a href="state-2-python.py" style="font-size: 1.2rem; font-weight: bold;">Go to Page 2 &rarr;</a>
    </div>
    
    <div style="text-align: center; margin-top: 10px;">
        <a href="session-form-python.html">&larr; Back to Form</a>
    </div>
</div>
</body>
</html>
""")