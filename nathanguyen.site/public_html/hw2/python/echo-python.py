#!/usr/bin/python3
import os, sys, json, time, urllib.parse

def read_body():
    try:
        length = int(os.environ.get("CONTENT_LENGTH", "0"))
    except ValueError:
        length = 0
    return sys.stdin.read(length) if length > 0 else ""

def parse_urlencoded(s):
    qs = urllib.parse.parse_qs(s, keep_blank_values=True)
    return {k: (v[0] if len(v) == 1 else v) for k, v in qs.items()}

server_protocol = os.environ.get("SERVER_PROTOCOL", "")
method = os.environ.get("REQUEST_METHOD", "").upper()
hostname = os.environ.get("SERVER_NAME", "")
ip = os.environ.get("REMOTE_ADDR", "")
user_agent = os.environ.get("HTTP_USER_AGENT", "")
timestamp = time.ctime()

raw_query = os.environ.get("QUERY_STRING", "")
parsed_query = parse_urlencoded(raw_query) if raw_query else {}

content_type = (os.environ.get("CONTENT_TYPE") or "").split(";")[0].strip().lower()
raw_body = read_body()

parsed_body = None
body_error = None

if raw_body:
    if content_type == "application/json":
        try:
            parsed_body = json.loads(raw_body)
        except Exception as e:
            body_error = f"Invalid JSON: {e}"
            parsed_body = raw_body
    elif content_type == "application/x-www-form-urlencoded":
        parsed_body = parse_urlencoded(raw_body)
    else:
        parsed_body = raw_body

print("Cache-Control: no-cache")
print("Content-Type: text/html")
print()

print(f"""<!doctype html>
<html>
<head>
  <title>Python Echo</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<h1>Python Echo</h1>
<hr>

<p><b>Server Protocol:</b> {server_protocol}</p>
<p><b>HTTP Method:</b> {method}</p>
<p><b>Hostname:</b> {hostname}</p>
<p><b>Time:</b> {timestamp}</p>
<p><b>User Agent:</b> {user_agent}</p>
<p><b>Client IP Address:</b> {ip}</p>
<p><b>Content-Type:</b> {content_type if content_type else "(none)"}</p>

<br>

<p><b>Raw Query:</b></p>
<pre>{raw_query if raw_query else "(none)"}</pre>

<p><b>Parsed Query:</b></p>
<pre>{json.dumps(parsed_query, indent=2) if parsed_query else "(none)"}</pre>

<p><b>Raw Message Body:</b></p>
<pre>{raw_body if raw_body else "(none)"}</pre>

<p><b>Parsed Message Body:</b></p>
<pre>{json.dumps(parsed_body, indent=2) if parsed_body is not None else "(none)"}</pre>
</body></html>""")
