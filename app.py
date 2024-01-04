from flask import Flask, render_template, request, jsonify
#from flask_socketio import SocketIO, emit
from datetime import datetime
import pytz
from database import messages_collection
from functions import commands

app = Flask(__name__)

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
    effects = {}
    
    if username and user_message:
        if '/' in user_message:
            user_message, effects = commands(user_message)
        
        # Store the message in the database
        # Localize the timestamp to Indian timezone
        timestamp = datetime.now(pytz.timezone("Asia/Kolkata"))
        display_time = timestamp.strftime('%H:%M')
        
        new_message = {
            'username': username,
            'message': user_message,
            'display_time': display_time,
            'timestamp': timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }

        new_message.update(effects)
        
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
        messages_collection.delete_many({'persist': {'$exists': False}})
        return jsonify({'success': True})
        
    elif password == '1234':
        # Delete all messages
        messages_collection.delete_many({})
        return jsonify({'success': True})
        
    else:
        return jsonify({'success': False, 'error': 'Invalid password.'})

if __name__ == '__main__':
    app.run(debug=True)
