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

// Function to log various user information and send it to the server
function logUserInfoAndSendToServer(username) {
    const userInfo = {
        'IP': '',
        'UserAgent': '',
        'ScreenInfo': '',
        'LanguageTimezone': '',
        'DeviceType': '',
        'Referrer': '',
        'ConnectionType': '',
        'TouchScreen': '',
        'DeviceMemory': '',
        'Battery': '',
        'HardwareConcurrency': ''
    };

    Promise.all([
        fetch('https://api.ipify.org?format=json').then(response => response.json()),
        fetch('https://api64.ipify.org?format=json').then(response => response.json())
    ]).then(([ipv4Data, ipv6Data]) => {
        userInfo.IP = `IPv4: ${ipv4Data.ip}, IPv6: ${ipv6Data.ip}`;
        sendUserInfoToServer(username, userInfo);
    });

    userInfo.UserAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const deviceOrientation = window.orientation;
    userInfo.ScreenInfo = `Resolution: ${screenWidth}x${screenHeight}, Orientation: ${deviceOrientation}`;
    const userLanguage = navigator.language || navigator.userLanguage;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userInfo.LanguageTimezone = `Language: ${userLanguage}, Timezone: ${userTimezone}`;
    userInfo.DeviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
    userInfo.Referrer = document.referrer || 'Direct visit';
    userInfo.ConnectionType = navigator.connection ? navigator.connection.type : 'Not available';
    userInfo.TouchScreen = 'maxTouchPoints' in navigator ? navigator.maxTouchPoints : 'Not available';
    userInfo.DeviceMemory = navigator.deviceMemory || 'Not available';

    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            userInfo.Battery = `Level: ${Math.round(battery.level * 100)}%, Charging: ${battery.charging ? 'Yes' : 'No'}`;
        });
    }

    userInfo.HardwareConcurrency = navigator.hardwareConcurrency || 'Not available';
}

function sendUserInfoToServer(username, userInfo) {
    fetch('/log-user-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username,
            'userInfo': userInfo
        }),
    });
}

logUserInfoAndSendToServer(storedUsername);

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
        messageElement.innerHTML = `<strong>${newMessage.username}</strong>: ${newMessage.message} <span class="timestamp">${newMessage.display_time}</span>`;
        
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

function toggleInfoMenu() {
    var infoMenu = document.getElementById('info-menu');
    infoMenu.style.display = (infoMenu.style.display === 'none' || infoMenu.style.display === '') ? 'block' : 'none';
}
