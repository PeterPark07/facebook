// script.js

// Cookie functions
function getCookie(name) {
    // Retrieve a cookie value by name
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function setCookie(name, value, days) {
    // Set a cookie with a specified expiration period
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Function to notify the server about user entry
function notifyServerAboutUserEntry(username) {
    fetch('/user-entered', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'enteredUsername': username,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Server notified about user entry successfully
            // You can optionally handle this success case
        } else {
            console.error('Failed to notify server about user entry.');
        }
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
    // Notify the server that the user is leaving
    fetch('/exit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'username': storedUsername,
        }),
    });
}

// Attach the handleBeforeUnload function to the beforeunload event of the window
window.addEventListener('beforeunload', handleBeforeUnload);

// Function to handle the visibility of the "Change Username" button
function updateUsernameButtonVisibility() {
    // Adjust the visibility of the "Change Username" button based on the current username
    const changeUsernameButton = document.getElementById('change-username-button');

    if (storedUsername.toLowerCase() === 'anonymous') {
        // Show the button if the username is 'Anonymous'
        changeUsernameButton.style.display = 'inline-block';
    } else {
        // Hide the button if the username is not 'Anonymous'
        changeUsernameButton.style.display = 'none';
    }
}

// Initial visibility check
updateUsernameButtonVisibility();

// Function to log various user information and send it to the server
function logUserInfoAndSendToServer(username) {
    // Build a JSON object with user information
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

    // 1. Fetch IPv4 and IPv6 addresses
    Promise.all([
        fetch('https://api.ipify.org?format=json').then(response => response.json()),
        fetch('https://api64.ipify.org?format=json').then(response => response.json())
    ]).then(([ipv4Data, ipv6Data]) => {
        userInfo.IP = `IPv4: ${ipv4Data.ip}, IPv6: ${ipv6Data.ip}`;
        sendUserInfoToServer(username, userInfo);
    });

    // 2. Display User-Agent string
    userInfo.UserAgent = navigator.userAgent;

    // 3. Display Screen Resolution and Device Orientation
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const deviceOrientation = window.orientation;
    userInfo.ScreenInfo = `Resolution: ${screenWidth}x${screenHeight}, Orientation: ${deviceOrientation}`;

    // 4. Display User Language and Timezone
    const userLanguage = navigator.language || navigator.userLanguage;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userInfo.LanguageTimezone = `Language: ${userLanguage}, Timezone: ${userTimezone}`;

    // 5. Display Device Type
    userInfo.DeviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

    // 6. Display Referrer Information
    userInfo.Referrer = document.referrer || 'Direct visit';

    // 7. Display Network Connection Type
    userInfo.ConnectionType = navigator.connection ? navigator.connection.type : 'Not available';

    // 8. Display Touch Screen Support
    userInfo.TouchScreen = 'maxTouchPoints' in navigator ? navigator.maxTouchPoints : 'Not available';

    // 9. Display Device Memory
    userInfo.DeviceMemory = navigator.deviceMemory || 'Not available';

    // 10. Display Battery Information
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function (battery) {
            userInfo.Battery = `Level: ${Math.round(battery.level * 100)}%, Charging: ${battery.charging ? 'Yes' : 'No'}`;
        });
    }

    // 11. Display Hardware Concurrency
    userInfo.HardwareConcurrency = navigator.hardwareConcurrency || 'Not available';
}

// Function to send user information to the server
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
// Call the function to log user information and send it to the server
logUserInfoAndSendToServer(storedUsername);


// Function to send a message
function sendMessage() {
    // Send a user's message to the server and update the chat box
    var messageInput = document.getElementById('message');
    var message = messageInput.value;

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
                // Show notification for the new message
                showNotification(message);
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
    // Prompt the user for a new username and update it if valid
    const newUsername = prompt('Enter your new username (limit: 20 characters):', storedUsername);

    // Apply input validation for the new username
    if (newUsername !== null && newUsername.trim() !== '' && newUsername.length <= 20) {
        storedUsername = newUsername;
        setCookie('username', storedUsername, 365);  // Expires in 365 days
        updateChatBox();
    } else {
        alert('Invalid username. Please try again.');
    }
}

// Function to delete chats
function deleteChats() {
    // Prompt for a pin and delete chats if the pin is valid
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

// Function to display a notification
function showNotification(message) {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
    } else if (Notification.permission === "granted") {
        // If permission is already granted, create the notification
        var notification = new Notification("New Message", {
            body: message
        });
    } else if (Notification.permission !== 'denied') {
        // Otherwise, request permission from the user
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                // If permission is granted, create the notification
                var notification = new Notification("New Message", {
                    body: message
                });
            }
        });
    }
}


// Function to update the chat box
function updateChatBox() {
    // Fetch the latest chat content from the server and update the chat box
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

function toggleInfoMenu() {
    var infoMenu = document.getElementById('info-menu');
    infoMenu.style.display = (infoMenu.style.display === 'none' || infoMenu.style.display === '') ? 'block' : 'none';
}


// Optionally, set up periodic updates (e.g., every 3 seconds)
setInterval(updateChatBox, 3000);
