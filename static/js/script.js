<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Chat Room</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css">

    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #fce1cc;
            color: #333;
        }

        #chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }

        #chat-box {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
            box-sizing: content-box;
            max-height: calc(100vh - 50px);
        }

        #chat-box p.golden {
            color: gold;
        }

        #message-form {
            display: flex;
            padding: 10px;
            box-sizing: content-box;
            position: fixed;
            bottom: 0;
            width: 100%;
        }

        #message-form input,
        #message-form button {
            margin-right: 10px;
            font-size: 16px;
            padding: 10px;
            border-radius: 8px;
        }

        #message-form input {
            flex-grow: 1;
        }

        #send-button {
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
            border: none;
        }

        #info-menu {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 8px;
            display: none;
            z-index: 1000;
        }

        #info-menu-button {
            position: absolute;
            top: 45px;
            right: 10px;
            font-size: 18px;
            cursor: pointer;
            z-index: 1001;
        }

        #delete-button,
        #change-username-button {
            position: absolute;
            right: 10px;
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 8px;
        }

        #delete-button { top: 5px; }
        #change-username-button { top: 80px; }

        @keyframes bounce {
            0%, 50%, 100% {
                transform: translate(0, 0);
            }
            15% {
                transform: translate(-5px, -5px);
            }
            35% {
                transform: translate(5px, -5px);
            }
            65% {
                transform: translate(-5px, 5px);
            }
            85% {
                transform: translate(5px, 5px);
            }
        }

        @keyframes colorChange {
            0% {
                color: red;
            }
            25% {
                color: orange;
            }
            50% {
                color: yellow;
            }
            75% {
                color: green;
            }
            100% {
                color: red;
            }
        }

        #chat-box p.highlight {
            animation: colorChange 2s infinite; /* Add your animation properties here */
        }
        #chat-box p.animate {
            animation: bounce 2s 7; /* Add your animation properties here */
        }

        #chat-box p.system {
            color: #ad0202; /* Set the color for system notification messages */
            font-style: italic;
        }
    </style>
</head>
<body>
    <!-- Info menu button -->
    <div id="info-menu-button" onclick="toggleInfoMenu()">
        <i class="fas fa-info-circle" style="font-size: 30px;"></i>
    </div>

    <!-- Info menu content -->
    <div id="info-menu">
        <p>Commands:</p>
        <ul>
            <li>/persist - Makes messages permanent.</li>
            <li>/golden - Displays messages in golden color.</li>
            <li>/animate - Adds animation to the messages.</li>
            <li>/highlight - Flashes the message in various colours.</li>
            <li>/delete [number] - Deletes recent messages. (default: 5, max: 20)</li>
        </ul>
    </div>

    <!-- Main chat container -->
    <div id="chat-container">
        <!-- Chat messages display -->
        <div id="chat-box">
            {% for message in messages %}
                <p class="{% if message.golden %}golden{% endif %}{% if message.animate %} animate{% endif %}{% if message.highlight %} highlight{% endif %}{% if message.system %} system{% endif %}">
                    <strong>{{ message.display_time }} - {{ message.username }}:</strong> {{ message.message }}
                </p>
            {% endfor %}
        </div>

        <!-- Message input form -->
        <form id="message-form">
            <input type="text" id="message" name="message" placeholder="Message" maxlength="400" required>
            <button type="button" id="send-button" onclick="sendMessage()">Send</button>
        </form>

        <!-- Delete and Change Username buttons -->
        <button id="delete-button" onclick="deleteChats()">Clear Chats</button>
        <button id="change-username-button" onclick="changeUsername()">Change Username</button>
    </div>

    <!-- Reference the external JavaScript file -->
    <script src="{{ url_for('static', filename='js/script.js') }}"></script>

</body>
</html>
