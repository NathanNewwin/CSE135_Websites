#!/usr/bin/python3
import os

print("Cache-Control: no-cache")
print("Content-Type: text/html")
print()

print("""<!DOCTYPE html>
<html>
<head>
    <title>Environment Variables (Python)</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1 align="center">Environment Variables (Python)</h1>
    <hr>
""")

for key in sorted(os.environ):
    value = os.environ[key]
    print(f"<b>{key}</b>: {value}<br />")

print("""
</body>
</html>
""")
