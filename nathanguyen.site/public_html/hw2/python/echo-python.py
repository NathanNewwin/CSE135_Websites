from flask import Flask, request, jsonify
from datetime import datetime
import os

app = Flask(__name__)

@app.route('/echo', methods=['GET', 'POST', 'PUT', 'DELETE'])
def echo_response():
    # Gather request metadata
    response_data = {
        "hostname": request.host,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_agent": request.headers.get('User-Agent'),
        "ip_address": request.remote_addr,
        "method": request.method,
        "payload": {}
    }

    # Handle data based on Content-Type
    if request.method == 'GET':
        response_data["payload"] = request.args.to_dict()
    else:
        if request.is_json:
            response_data["payload"] = request.get_json()
        else:
            response_data["payload"] = request.form.to_dict()

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(port=5000)