#!/usr/bin/python3

import datetime
import socket

t = datetime.datetime.now()
hostname = socket.gethostname()
IPAddr = socket.gethostbyname(hostname)

print("Content-Type: text/html")
print()

print(f"""<!DOCTYPE html>
<html>
<head>
  <title>Hello Python</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1 align=center>Hello, World!</h1>
  <p>This page was generated using Python CGI.</p>
  <p>This program was generated at: {t}</p>
  <p>Your computer name is: {hostname}</p>
  <p>Your current IP Address is: {IPAddr}</p>
</body>
</html>
""")
