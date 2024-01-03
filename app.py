from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Store messages in memory for simplicity (replace with a database in a real application)
messages = []

import requests

def get_public_ip():
    try:
        response = requests.get('https://api64.ipify.org?format=json')
        if response.status_code == 200:
            ip_data = response.json()
            return ip_data.get('ip')
        else:
            return None
    except Exception as e:
        print(f"Error fetching public IP: {e}")
        return None

# Print the public IP address
public_ip = get_public_ip()
if public_ip:
    print(f"Public IP address of your remote machine: {public_ip}")
else:
    print("Unable to fetch public IP address.")


@app.route('/')
def index():
    return render_template('index.html', messages=messages)


@app.route('/send', methods=['POST'])
def send():
    username = request.form.get('username')
    message = request.form.get('message')

    if username and message:
        new_message = {'username': username, 'message': message}
        messages.append(new_message)

    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True)
