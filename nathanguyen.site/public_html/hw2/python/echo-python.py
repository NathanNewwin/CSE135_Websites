#!/usr/bin/python3
import os
import sys
import json
import time
import urllib.parse

def read_body():
    try:
        length = int(os.environ.get("CONTENT_LENGTH") or "0")
    except ValueError:
        length = 0
    if length > 0:
        return sys.stdin.read(length)
    return ""

def parse_urlencoded(raw: str):
    # parse_qs gives lists; flatten for nicer output
    qs = urllib.parse.parse_qs(raw, keep_blank_values=True)
    return {k: (v[0] if len(v) == 1 else v) for k, v in qs.items()}

def main():
    method = os.environ.get("REQUEST_METHOD", "GET").upper()
    content_type = (os.environ.get("CONTENT_TYPE") or "").split(";")[0].strip().lower()

    # Data from query string
    query_string = os.environ.get("QUERY_STRING", "")
    query_params = parse_urlencoded(query_string)

    # Data from body (POST/PUT/DELETE)
    raw_body = read_body()
    body_parsed = None
    body_error = None

    if raw_body:
        if content_type == "application/json":
            try:
                body_parsed = json.loads(raw_body)
            except Exception as e:
                body_error = f"Invalid JSON: {e}"
                body_parsed = raw_body
        elif content_type == "application/x-www-form-urlencoded":
            body_parsed = parse_urlencoded(raw_body)
        else:
            body_parsed = raw_body

    resp = {
        "title": "Echo - Python",
        "method": method,
        "content_type": content_type or "(none)",
        "hostname": os.environ.get("SERVER_NAME", ""),
        "time": time.ctime(),
        "user_agent": os.environ.get("HTTP_USER_AGENT", ""),
        "ip": os.environ.get("REMOTE_ADDR", ""),
        "query": query_params,
        "body": body_parsed,
        "raw_body": raw_body if raw_body else "",
    }

    if body_error:
        resp["error"] = body_error

    print("Cache-Control: no-cache")
    print("Content-Type: application/json")
    print()
    print(json.dumps(resp))

if __name__ == "__main__":
    main()
