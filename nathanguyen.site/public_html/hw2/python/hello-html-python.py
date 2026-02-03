#!/usr/bin/python3
import os
import datetime

t = datetime.datetime.now()
remote_addr = os.environ.get("REMOTE_ADDR", "Unknown")

print("Content-Type: text/html")
print()
print(f"""<!DOCTYPE html>
<html>
<head>
  <title>Hello Python</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1 align=center>Hello, World!</h1>
  <p>Nathan says hello!</p>
  <p>This page was generated using Python CGI.</p>
  <p>This program was generated at: {t}</p>
  <p>Your IP Address is: {remote_addr}</p>
</body>
</html>
""")