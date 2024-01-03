from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Store messages in memory for simplicity (replace with a database in a real application)
messages = []


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
