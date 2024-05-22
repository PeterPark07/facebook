import logging
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from datetime import datetime
import pytz
from database import messages_collection, user_log
from functions import commands

app = Flask(__name__)
socketio = SocketIO(app, logger=True, engineio_logger=True)

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    messages = list(messages_collection.find())
    last_date = None

    for message in messages:
        system = message.get('system')
        if system:
            message_date = message.get('display_time')[:10]
            message['display_time'] = message.get('display_time')[11:]
        else:
            message_date = message.get('timestamp')[:10]
            if message_date != last_date:
                message['new_date'] = message_date
                last_date = message_date

    return render_template('index.html', messages=messages)

@socketio.on('send_message')
def handle_send_message(data):
    try:
        username = data['username']
        user_message = data['message']
        effects = {}

        if username and user_message:
            if '/' in user_message:
                user_message, effects = commands(user_message)

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

            emit('receive_message', new_message, broadcast=True)
    except Exception as e:
        app.logger.error(f"Error in handle_send_message: {str(e)}")

@socketio.on('user_entered')
def handle_user_entered(data):
    try:
        entered_username = data['enteredUsername']
        if entered_username:
            timestamp = datetime.now(pytz.timezone("Asia/Kolkata"))

            entry_message = {
                'username': 'System',
                'message': f'{entered_username} has entered the chat!',
                'display_time': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'system': True,
            }

            messages_collection.insert_one(entry_message)
            emit('receive_message', entry_message, broadcast=True)
    except Exception as e:
        app.logger.error(f"Error in handle_user_entered: {str(e)}")

@socketio.on('user_left')
def handle_user_left(data):
    try:
        username = data['username']
        if username:
            system_message = f'{username} has left the chat.'
            timestamp = datetime.now(pytz.timezone("Asia/Kolkata"))

            new_message = {
                'username': 'System',
                'message': system_message,
                'display_time': timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'system': True
            }

            messages_collection.insert_one(new_message)
            emit('receive_message', new_message, broadcast=True)
    except Exception as e:
        app.logger.error(f"Error in handle_user_left: {str(e)}")

@app.route('/log-user-info', methods=['POST'])
def log_user_info():
    data = request.get_json()
    if 'username' in data and 'userInfo' in data:
        username = data['username']
        user_info = data['userInfo']

        user_info.update({
            'Username': username,
            'Timestamp': datetime.now(pytz.timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M")
        })

        existing_record = user_log.find_one(user_info)
        if existing_record:
            user_log.update_one({'_id': existing_record['_id']}, {'$set': user_info})
        else:
            user_log.insert_one(user_info)

        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Invalid request data.'})

@app.route('/delete-chats', methods=['POST'])
def delete_chats():
    password = request.form.get('pin')
    if password == '0':
        messages_collection.delete_many({'persist': {'$exists': False}})
        return jsonify({'success': True})
    elif password == '1234':
        messages_collection.delete_many({})
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Invalid password.'})



if __name__ == '__main__':
    socketio.run(app, debug=True)
