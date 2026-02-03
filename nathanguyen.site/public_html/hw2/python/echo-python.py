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

# Helper: Parse Query String (used for GET/DELETE or fallback)
def parse_query(qs):
    data = {}
    if not qs: return data
    pairs = qs.split('&')
    for pair in pairs:
        if '=' in pair:
            key, value = pair.split('=', 1)
            # URL Decode
            key = urllib.parse.unquote_plus(key)
            value = urllib.parse.unquote_plus(value)
            data[key] = value
    return data

if method in ['GET', 'DELETE']:
    payload_data = parse_query(query_string)

else: # POST, PUT
    try:
        length = int(content_length)
    except (ValueError, TypeError):
        length = 0

    if length > 0:
        # Read binary from stdin then decode
        body_str = sys.stdin.buffer.read(length).decode('utf-8', 'ignore')
        
        if 'application/json' in content_type:
            try:
                payload_data = json.loads(body_str)
            except json.JSONDecodeError:
                payload_data = {"Error": "Malformed JSON", "Raw": body_str}
        else:
            # Assume form-urlencoded
            payload_data = parse_query(body_str)

# --- 3. Construct HTML Response ---
print("Content-Type: text/html\n")

print(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Python Echo</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="page">
    
    <div class="course-header">
        <h1 class="course-title">Python Echo</h1>
        <p class="course-subtitle">Backend Response</p>
    </div>

    <div class="card active">
        <div class="card-header">
            <h2>Server Details</h2>
        </div>
        <div class="card-links">
            <p><strong>Method:</strong> {html.escape(method)}</p>
            <p><strong>Host:</strong> {html.escape(server_name)}</p>
            <p><strong>IP:</strong> {html.escape(remote_addr)}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>

    <div class="card inactive">
        <div class="card-header">
            <h2>Received Body</h2>
        </div>
        <div class="card-links" style="padding: 10px;">
""")

if not payload_data:
    print("<p style='opacity: 0.6;'>No data parameters received.</p>")
else:
    print("<table style='width:100%; border-collapse: collapse;'>")
    print("<tr><th style='text-align:left; border-bottom:1px solid #555;'>Key</th><th style='text-align:left; border-bottom:1px solid #555;'>Value</th></tr>")
    
    for k, v in payload_data.items():
        safe_k = html.escape(str(k))
        safe_v = html.escape(str(v))
        print(f"<tr><td style='padding: 8px 0; color: #b39eb5;'>{safe_k}</td><td style='padding: 8px 0;'>{safe_v}</td></tr>")
    
    print("</table>")

print(f"""
        </div>
    </div>

    <aside class="sidebar">
        <h3>User Agent</h3>
        <p style="font-family: monospace; font-size: 0.85rem; word-break: break-all; color: #8ab4f8;">
            {html.escape(user_agent)}
        </p>
    </aside>

    <div class="hw2-footer">
        <a href="../echo-form.html">&larr; Back to Form</a>
    </div>

</div>
</body>
</html>
""")