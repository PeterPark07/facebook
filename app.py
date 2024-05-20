from flask import Flask, render_template, request, jsonify
#from flask_socketio import SocketIO, emit
from datetime import datetime
import pytz
from database import messages_collection, user_log
from functions import commands

app = Flask(__name__)

@app.route('/')
def index():
    messages = list(messages_collection.find())
    last_date = None

    for message in messages:
        system = message.get('system')
        if system:
            message_date = message.get('display_time')[:10]  # Extract date part
            message['display_time'] = message.get('display_time')[8:]

        else:
            message_date = message.get('timestamp')[:10]

            if message_date != last_date:
                # Add a key to indicate a new date divider should be shown before this message
                message['new_date'] = message_date
                last_date = message_date

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


@app.route('/log-user-info', methods=['POST'])
def log_user_info():
    data = request.get_json()

    if 'username' in data and 'userInfo' in data:
        username = data['username']
        user_info = data['userInfo']

        # Add additional information to the user_info dictionary
        user_info.update({
            'Username': username,
            'Timestamp': datetime.now(pytz.timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M")
        })

        # Check if a record with the same username and timestamp already exists
        existing_record = user_log.find_one(user_info)

        if existing_record:
            # Update the existing record instead of inserting a new one
            user_log.update_one({'_id': existing_record['_id']}, {'$set': user_info})
        else:
            # Insert a new record
            user_log.insert_one(user_info)

        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Invalid request data.'})




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


@app.route('/user-entered', methods=['POST'])
def user_entered():
    entered_username = request.form.get('enteredUsername')
    
    if entered_username:
        timestamp = datetime.now(pytz.timezone("Asia/Kolkata"))
        display_time = timestamp.strftime('%H:%M')

        # Create a system notification message for the user entry
        entry_message = {
            'username': 'System',
            'message': f'{entered_username} has entered the chat!',
            'display_time': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            'system': True,
        }

        messages_collection.insert_one(entry_message)
        
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Entered username not provided.'})

@app.route('/exit', methods=['POST'])
def handle_exit():
    # Get user input
    username = request.form.get('username')

    if username:
        # Create a system message indicating that the user has left the chat
        system_message = f'{username} has left the chat.'
        timestamp = datetime.now(pytz.timezone("Asia/Kolkata"))
        display_time = timestamp.strftime('%H:%M')

        new_message = {
            'username': 'System',
            'message': system_message,
            'display_time': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            'system': True
        }

        messages_collection.insert_one(new_message)

        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Username is required.'})

if __name__ == '__main__':
    app.run(debug=True)
