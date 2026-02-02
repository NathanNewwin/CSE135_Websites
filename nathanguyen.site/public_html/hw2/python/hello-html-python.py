#!/usr/bin/python3

import datetime

t = datetime.datetime.now()

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
</body>
</html>
""")
