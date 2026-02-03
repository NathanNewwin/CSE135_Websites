#!/usr/bin/env python3
import json
import os
import sys
import datetime
from urllib.parse import parse_qs

# Set response header
print("Content-Type: application/json")
print()

try:
    # Gather Metadata
    response = {
        "hostname": os.environ.get('HTTP_HOST', 'N/A'),
        "datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_agent": os.environ.get('HTTP_USER_AGENT', 'N/A'),
        "ip_address": os.environ.get('REMOTE_ADDR', 'N/A'),
        "method": os.environ.get('REQUEST_METHOD', 'GET'),
        "data": {}
    }

    # Handle Request Data
    method = response["method"]
    content_length = int(os.environ.get('CONTENT_LENGTH', 0))
    content_type = os.environ.get('CONTENT_TYPE', '')

    if method in ["POST", "PUT", "DELETE"] and content_length > 0:
        body = sys.stdin.read(content_length)
        if "application/json" in content_type:
            response["data"] = json.loads(body)
        else:
            response["data"] = {k: v[0] for k, v in parse_qs(body).items()}
    else:
        # Fallback to Query String for GET
        query_string = os.environ.get('QUERY_STRING', '')
        response["data"] = {k: v[0] for k, v in parse_qs(query_string).items()}

    print(json.dumps(response, indent=2))

except Exception as e:
    print(json.dumps({"error": str(e)}))