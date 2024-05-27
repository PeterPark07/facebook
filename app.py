import logging
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from datetime import datetime
import pytz
from database import messages_collection, user_log
from functions import commands
from bson import ObjectId

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

        # Ensure all ObjectId fields are converted to strings
        if '_id' in message:
            message['_id'] = str(message['_id'])

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
            result = messages_collection.insert_one(new_message)

            # Add the inserted_id to the message for sending to the client
            new_message['_id'] = str(result.inserted_id)

            emit('receive_message', new_message, broadcast=True)
    except Exception as e:
        app.logger.error(f"Error in handle_send_message: {str(e)}", exc_info=True)

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

            result = messages_collection.insert_one(entry_message)
            entry_message['_id'] = str(result.inserted_id)

            emit('receive_message', entry_message, broadcast=True)
    except Exception as e:
        app.logger.error(f"Error in handle_user_entered: {str(e)}", exc_info=True)

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

            result = messages_collection.insert_one(new_message)
            new_message['_id'] = str(result.inserted_id)

            emit('receive_message', new_message, broadcast=True)
    except Exception as e:
        app.logger.error(f"Error in handle_user_left: {str(e)}", exc_info=True)


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
