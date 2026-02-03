#!/usr/bin/env python3
import os
import sys
import json
import html
import urllib.parse
from datetime import datetime

# --- 1. Gather Request Details ---
method = os.environ.get('REQUEST_METHOD', 'GET')
content_type = os.environ.get('CONTENT_TYPE', '')
content_length = os.environ.get('CONTENT_LENGTH', 0)
query_string = os.environ.get('QUERY_STRING', '')
remote_addr = os.environ.get('REMOTE_ADDR', 'Unknown')
user_agent = os.environ.get('HTTP_USER_AGENT', 'Unknown')
server_name = os.environ.get('SERVER_NAME', 'localhost')

# --- 2. Parse Data ---
payload_data = {}

def parse_query(qs):
    data = {}
    if not qs: return data
    pairs = qs.split('&')
    for pair in pairs:
        if '=' in pair:
            key, value = pair.split('=', 1)
            key = urllib.parse.unquote_plus(key)
            value = urllib.parse.unquote_plus(value)
            data[key] = value
    return data

if method in ['GET', 'DELETE']:
    payload_data = parse_query(query_string)
else:
    try:
        length = int(content_length)
    except (ValueError, TypeError):
        length = 0

    if length > 0:
        body_str = sys.stdin.buffer.read(length).decode('utf-8', 'ignore')
        if 'application/json' in content_type:
            try:
                payload_data = json.loads(body_str)
            except json.JSONDecodeError:
                payload_data = {"Error": "Malformed JSON", "Raw": body_str}
        else:
            payload_data = parse_query(body_str)

# --- 3. Construct HTML ---
print("Content-Type: text/html\n")

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Python Echo</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
<div class="page">
    
    <header class="course-header">
        <h1 class="course-title">Python Echo</h1>
        <p class="course-subtitle">Backend Response</p>
    </header>

    <div class="card active">
        <h2>Server Details</h2>
        <p><strong>Method:</strong> {html.escape(method)}</p>
        <p><strong>Encoding:</strong> {html.escape(content_type)}</p>
        <p><strong>Host:</strong> {html.escape(server_name)}</p>
        <p><strong>IP:</strong> {html.escape(remote_addr)}</p>
        <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <div class="card">
        <h2>Received Body</h2>
        <div style="padding-top: 5px;">
""")

if not payload_data:
    print("<p style='opacity: 0.6;'>No data parameters received.</p>")
else:
    print("<table>")
    print("<tr><th>Key</th><th>Value</th></tr>")
    for k, v in payload_data.items():
        safe_k = html.escape(str(k))
        safe_v = html.escape(str(v))
        print(f"<tr><td>{safe_k}</td><td>{safe_v}</td></tr>")
    print("</table>")

print(f"""
        </div>
    </div>

    <div class="card">
        <h3>User Agent</h3>
        <p style="font-size: 0.85rem; line-height: 1.4; color: #8ab4f8; word-wrap: break-word;">
            {html.escape(user_agent)}
        </p>
    </div>

    <div style="text-align: center; margin-top: 10px;">
        <a href="../echo-form.html" style="font-size: 1.1rem; font-weight: bold;">&larr; Return to Form</a>
    </div>

</div>
</body>
</html>
""")