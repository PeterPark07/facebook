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

// Check if the username is stored in a cookie
let storedUsername = getCookie('username');

// Set default username if not found or if the user rejects the prompt
if (!storedUsername) {
    storedUsername = prompt('Please enter your username (limit: 20 characters):', 'Anonymous');

    // Apply input validation for the username
    if (!storedUsername || storedUsername.trim() === '' || storedUsername.length > 20) {
        storedUsername = 'Anonymous';
    }

    // Store the username in a cookie
    setCookie('username', storedUsername, 365);  // Expires in 365 days
}

// Function to handle the visibility of the "Change Username" button
function updateUsernameButtonVisibility() {
    const changeUsernameButton = document.getElementById('change-username-button');
    changeUsernameButton.style.display = storedUsername.toLowerCase() === 'anonymous' ? 'inline-block' : 'none';
}

// Initial visibility check
updateUsernameButtonVisibility();

// Function to send a message
function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value;

    if (message) {
        fetch('/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'username': storedUsername,
                'message': message,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('message-form').reset();
                messageInput.focus();
                // Optionally, update the chat box without refreshing the page
                updateChatBox();
            }
        });
    }
}

// Function to handle the keypress event in the message input field
function handleKeyPress(event) {
    // Check if the pressed key is Enter (key code 13)
    if (event.keyCode === 13) {
        sendMessage();
        // Prevent the default form submission behavior
        event.preventDefault();
    }
}

// Attach the handleKeyPress function to the keypress event of the message input field
document.getElementById('message').addEventListener('keypress', handleKeyPress);

// Function to change the username
function changeUsername() {
    const newUsername = prompt('Enter your new username (limit: 20 characters):', storedUsername);

    // Apply input validation for the new username
    if (newUsername && newUsername.trim() !== '' && newUsername.length <= 20) {
        storedUsername = newUsername;
        setCookie('username', storedUsername, 365);  // Expires in 365 days
        updateChatBox();
    } else {
        alert('Invalid username. Please try again.');
    }
}

// Function to delete chats
function deleteChats() {
    // Ask for the pin before deleting chats
    const pin = prompt('Enter pin to delete chats:');
    
    // Perform server-side validation of the pin
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
                // Chats deleted successfully
                updateChatBox();
            } else {
                alert('Invalid pin. Chats not deleted.');
            }
        });
    }
}

// Function to update the chat box
function updateChatBox() {
    const chatBox = document.getElementById('chat-box');
    
    fetch('/')
        .then(response => response.text())
        .then(html => {
            // Update the chat box content
            chatBox.innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('chat-box').innerHTML;

            // Scroll to the bottom of the chat box
            chatBox.scrollTop = chatBox.scrollHeight;
        });
}

// Optionally, set up periodic updates (e.g., every 3 seconds)
setInterval(updateChatBox, 3000);
