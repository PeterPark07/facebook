from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from datetime import datetime
import os

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient(os.getenv('mongodb'))
db = client['chat']
messages_collection = db['messages']

def persist_message(message_text):
    should_persist = False
    if '/persist' in message_text:
        should_persist = True
        message_text = message_text.replace('/persist', '')
    return message_text, should_persist

@app.route('/')
def index():
    messages = messages_collection.find()
    return render_template('index.html', messages=messages)

@app.route('/send', methods=['POST'])
def send():
    username = request.form.get('username')
    message_text = request.form.get('message')

    if username and message_text:
        message_text, should_persist = persist_message(message_text)
        timestamp = datetime.utcnow()
        new_message = {'username': username, 'message': message_text, 'timestamp': timestamp, 'persist': should_persist}
        messages_collection.insert_one(new_message)
        
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Username and message are required.'})


@app.route('/delete-chats', methods=['POST'])
def delete_chats():
    password = request.form.get('pin')

    # Implement your password validation logic here
    # For simplicity, let's assume the password is 'secret'
    if password in ['0', '1234']:
        if password == '0':
            messages_collection.delete_many({'persist': False})
        elif password == '1234':
            messages_collection.delete_many({})
        return jsonify({'success': True})
        
    return jsonify({'success': False, 'error': 'Invalid password.'})

if __name__ == '__main__':
    app.run(debug=True)
