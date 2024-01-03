from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from datetime import datetime
import os

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient(os.getenv('mongodb'))
db = client['chat']
messages_collection = db['messages']

@app.route('/')
def index():
    messages = messages_collection.find()
    return render_template('index.html', messages=messages)


@app.route('/send', methods=['POST'])
def send():
    username = request.form.get('username')
    message_text = request.form.get('message')

    if username and message_text:
        # Store the message in the database
        timestamp = datetime.utcnow()
        new_message = {'username': username, 'message': message_text, 'timestamp': timestamp}
        messages_collection.insert_one(new_message)

        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Username and message are required.'})


if __name__ == '__main__':
    app.run(debug=True)
