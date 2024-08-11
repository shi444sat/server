const socket = io();
const userList = document.querySelector('.contacts-list');

let currentUserUsername; // Variable to store the current user's username

// Function to add a user to the user list
function addUserToList(username) {
  const userLi = document.createElement('li');
  userLi.classList.add('contacts-item', 'friends');

  const contacts_link = document.createElement('a');
  contacts_link.classList.add('contacts-link');

  const contacts_content = document.createElement('div');
  contacts_content.classList.add('contacts-content');

  const contacts_info = document.createElement('div');
  contacts_info.classList.add('contacts-info');

  const user_name = document.createElement('h6');
  user_name.classList.add('chat-name');

  user_name.textContent = username;

  contacts_info.appendChild(user_name);
  contacts_content.appendChild(contacts_info);
  contacts_link.appendChild(contacts_content);
  userLi.appendChild(contacts_link);

  userList.appendChild(userLi);
}

// Function to update the user list
function updateUserList(users) {
  userList.innerHTML = '';
  users.forEach(username => {
    addUserToList(username);
  });
}

// Join a room and handle initial setup
const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');

if (!room) {
  document.body.innerHTML = `<h3 style="color: black;">Kya dikkat hai mere bhai tujhe ja na <a href="./">home page</a> pe.</h3>`;
}else {
  const username = prompt('Enter your username:');
  if (username) {
    currentUserUsername = username; // Store the current user's username

    document.querySelector('h5.text-truncate.mb-0').textContent = `FuxChat: ${room}`;
    socket.emit('joinRoom', { username, room });

    socket.on('usernameExists', (message) => {
      alert(message);
      window.location.reload();
    });

    socket.on('roomData', ({ users }) => {
      updateUserList(users);
    });

    socket.on('message', message => {
      const msg = document.createElement('div');
      msg.classList.add('message');

      if (message.startsWith(username + ':')) {
        msg.classList.add('self');
      }

      const msgwrapper = document.createElement('div');
      msgwrapper.classList.add('message-wrapper');

      const msgContent = document.createElement('div');
      msgContent.classList.add('message-content');

      const messageElement = document.createElement('span');
      messageElement.textContent = message;

      msgContent.appendChild(messageElement);
      msgwrapper.appendChild(msgContent);
      msg.appendChild(msgwrapper);

      // Append the constructed message to the chat message content area
      document.getElementById('chat-msg-load').appendChild(msg);
      document.getElementById('msgsound').play();

      // Scroll to the bottom of the chat area to show the latest message
      const chatArea = document.getElementById('chat-finished');
      chatArea.scrollTop = chatArea.scrollHeight;
    });

    socket.on('join', (message) => {
      const msgDay = document.createElement('div');
      msgDay.classList.add('message-day');

      const msgDivider = document.createElement('div');
      msgDivider.classList.add('message-divider', 'sticky-top', 'pb-2');
      msgDivider.dataset.label = message;

      msgDay.appendChild(msgDivider);
      document.getElementById('chat-msg-load').appendChild(msgDay);
      document.getElementById('msgsound').play();
    });

    socket.on('leave', (message) => {
      const msgDay = document.createElement('div');
      msgDay.classList.add('message-day');

      const msgDivider = document.createElement('div');
      msgDivider.classList.add('message-divider', 'sticky-top', 'pb-2');
      msgDivider.dataset.label = message;

      msgDay.appendChild(msgDivider);
      document.getElementById('chat-msg-load').appendChild(msgDay);
      document.getElementById('msgsound').play();
    });

    // Send message when the "Send" button is clicked
    document.getElementById('send').addEventListener('click', sendMessage);

    // Send message when the "Enter" key is pressed
    document.getElementById('messageInput').addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });

    // Function to send the chat message
    function sendMessage() {
      const messageInput = document.getElementById('messageInput');

      if (!messageInput) {
        console.error('Message input element not found.');
        return;
      }

      const message = messageInput.value.trim(); // Trim whitespace

      if (message !== '') { // Ensure the message is not empty
        socket.emit('chatMessage', { room, message, username });
        document.getElementById('msg-text-c').textContent = ""; // Clear the input field
        messageInput.value = ""; // Clear the input field
      } else {
        console.error('Message is empty.');
      }
    }

    socket.on('disconnect', () => {
      alert('Disconnected From Server. Reconnecting...');
      window.location.reload();
    });
  } else {
    window.location.href = '/';
  }
}
