#!/usr/bin/env python3
import json
import os
import sys
import datetime
from urllib.parse import parse_qs

# Set response header to HTML so the browser renders it
print("Content-Type: text/html")
print()

try:
    # Gather Metadata
    response_data = {
        "hostname": os.environ.get('HTTP_HOST', 'N/A'),
        "datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_agent": os.environ.get('HTTP_USER_AGENT', 'N/A'),
        "ip_address": os.environ.get('REMOTE_ADDR', 'N/A'),
        "method": os.environ.get('REQUEST_METHOD', 'GET'),
        "data": {}
    }

    # Handle Request Data
    method = response_data["method"]
    content_length = int(os.environ.get('CONTENT_LENGTH', 0))
    content_type = os.environ.get('CONTENT_TYPE', '')

    if method in ["POST", "PUT", "DELETE"] and content_length > 0:
        body = sys.stdin.read(content_length)
        if "application/json" in content_type:
            response_data["data"] = json.loads(body)
        else:
            # Parses standard form data
            response_data["data"] = {k: v[0] for k, v in parse_qs(body).items()}
    else:
        # GET method data
        query_string = os.environ.get('QUERY_STRING', '')
        response_data["data"] = {k: v[0] for k, v in parse_qs(query_string).items()}

    # Output the result wrapped in your site's styling
    print(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="/style.css">
        <title>Echo Response</title>
    </head>
    <body>
        <div class="page">
            <main>
                <header class="course-header">
                    <h1 class="course-title">Echo Response</h1>
                    <p class="course-subtitle">Server-side Python Result</p>
                </header>
                <section class="card active">
                    <div class="card-header"><h2>JSON Data</h2></div>
                    <pre style="color: #8ab4f8; padding-top: 15px;">{json.dumps(response_data, indent=2)}</pre>
                    <div class="hw2-footer">
                        <a href="../../echo-form.html">← Back to Form</a>
                    </div>
                </section>
            </main>
        </div>
    </body>
    </html>
    """)

except Exception as e:
    print(f"<html><body><h1>Error</h1><p>{str(e)}</p></body></html>")