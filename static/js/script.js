// script.js

// Cookie functions
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Socket.IO setup
var socket = io();

socket.on('connect', function() {
    console.log('Connected to server');
});

socket.on('receive_message', function(data) {
    updateChatBox(data);
});

// Function to notify the server about user entry
function notifyServerAboutUserEntry(username) {
    socket.emit('user_entered', {
        enteredUsername: username
    });
}

// Check if the username is stored in a cookie
let storedUsername = getCookie('username');

// If username is not found in the cookie or user rejects the prompt, set to "Anonymous"
if (!storedUsername) {
    storedUsername = prompt('Please enter your username (limit: 20 characters):', 'Anonymous');

    // Apply input validation for the username
    if (storedUsername === null || storedUsername.trim() === '' || storedUsername.length > 20) {
        storedUsername = 'Anonymous';
    }

    // Store the username in a cookie
    setCookie('username', storedUsername, 365);  // Expires in 365 days
}

notifyServerAboutUserEntry(storedUsername);

// Function to handle the beforeunload event
function handleBeforeUnload() {
    socket.emit('user_left', {
        username: storedUsername
    });
}

// Attach the handleBeforeUnload function to the beforeunload event of the window
window.addEventListener('beforeunload', handleBeforeUnload);

// Function to handle the visibility of the "Change Username" button
function updateUsernameButtonVisibility() {
    const changeUsernameButton = document.getElementById('change-username-button');

    if (storedUsername.toLowerCase() === 'anonymous') {
        changeUsernameButton.style.display = 'inline-block';
    } else {
        changeUsernameButton.style.display = 'none';
    }
}

// Initial visibility check
updateUsernameButtonVisibility();



// Function to send a message
function sendMessage() {
    var messageInput = document.getElementById('message');
    var message = messageInput.value;

    if (message) {
        socket.emit('send_message', {
            username: storedUsername,
            message: message
        });

        messageInput.value = '';
        messageInput.focus();
    }
}

// Function to handle the keypress event in the message input field
function handleKeyPress(event) {
    if (event.keyCode === 13) {
        sendMessage();
        event.preventDefault();
    }
}

document.getElementById('message').addEventListener('keypress', handleKeyPress);

// Function to change the username
function changeUsername() {
    const newUsername = prompt('Enter your new username (limit: 20 characters):', storedUsername);

    if (newUsername !== null && newUsername.trim() !== '' && newUsername.length <= 20) {
        storedUsername = newUsername;
        setCookie('username', storedUsername, 365);
        updateChatBox();
    } else {
        alert('Invalid username. Please try again.');
    }
}

// Function to delete chats
function deleteChats() {
    const pin = prompt('Enter pin to delete chats:');

    if (pin) {
        fetch('/delete-chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'pin': pin,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateChatBox();
            } else {
                alert('Invalid pin. Chats not deleted.');
            }
        });
    }
}

let userScrolledUp = false;


// Function to update the chat box
function updateChatBox(newMessage) {
    const chatBox = document.getElementById('chat-box');

    if (newMessage) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `<strong>${newMessage.display_time} - ${newMessage.username}:</strong> ${newMessage.message}`;
        
        // Add effects classes if present
        if (newMessage.golden) messageElement.classList.add('golden');
        if (newMessage.animate) messageElement.classList.add('animate');
        if (newMessage.highlight) messageElement.classList.add('highlight');
        if (newMessage.system) messageElement.classList.add('system');

        chatBox.appendChild(messageElement);
    }

    if (chatBox.scrollTop + chatBox.clientHeight + 100 < chatBox.scrollHeight) {
        userScrolledUp = true;
    } else {
        userScrolledUp = false;
    }

    if (!userScrolledUp) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Function to scroll to the bottom of the chat box
function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

