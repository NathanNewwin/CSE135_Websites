#!/usr/bin/python3
import json
import time
import os

print("Cache-Control: no-cache")
print("Content-Type: application/json")
print()

date = time.ctime()
address = os.environ.get("REMOTE_ADDR", "")

message = {
    "title": "Hello, Python!",
    "heading": "Hello, Python!",
    "message": "This page was generated with Python CGI",
    "time": date,
    "IP": address
}

print(json.dumps(message))
