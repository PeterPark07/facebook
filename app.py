from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from datetime import datetime
import pytz
import os

app = Flask(__name__)

# Connect to MongoDB
mongo_client = MongoClient(os.getenv('mongodb'))
db = mongo_client['chat']
messages_collection = db['messages']

# Set the timezone to Indian Standard Time (IST)
indian_timezone = pytz.timezone('Asia/Calcutta')

@app.route('/')
def index():
    # Retrieve all messages from the database
    messages = messages_collection.find()
    return render_template('index.html', messages=messages)

@app.route('/send', methods=['POST'])
def send():
    # Get user input
    username = request.form.get('username')
    user_message = request.form.get('message')
    should_persist = False
    
    if username and user_message:
        # Check for persistence flag in the message
        if '/persist' in user_message:
            should_persist = True
            # Remove the persistence flag from the message
            user_message = user_message.replace('/persist', '')
        
        # Store the message in the database
        # Localize the timestamp to Indian timezone
        timestamp = datetime.now(indian_timezone)
        
        new_message = {
            'username': username,
            'message': user_message,
            'timestamp': timestamp,
            'persist': should_persist
        }
        
        messages_collection.insert_one(new_message)
        
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Username and message are required.'})


@app.route('/delete-chats', methods=['POST'])
def delete_chats():
    # Get the password for authentication
    password = request.form.get('pin')

    # Implement your password validation logic here
    # For simplicity, let's assume the password is 'secret'
    if password == '0':
        # Delete messages without persistence flag
        messages_collection.delete_many({'persist': False})
        return jsonify({'success': True})
        
    elif password == '1234':
        # Delete all messages
        messages_collection.delete_many({})
        return jsonify({'success': True})
        
    else:
        return jsonify({'success': False, 'error': 'Invalid password.'})

if __name__ == '__main__':
    app.run(debug=True)
