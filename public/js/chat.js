// emit connection event to server
const socket = io(); // get return socket from server

/* 
// recieve custom event fired from server
socket.on('countUpdated', (count) => {
  console.log('The count has been updated.', count);
});


document.querySelector('#increment').addEventListener('click', () => {
  console.log('Clicked');
  // emit custom event from client to server
  socket.emit('increment');
});
 */

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
// location.search is getting query string in JS
// ignoreQueryPrefix: true option is to remove "?" from query string (e.g, localhost:3000/chat.html?name=Andrew)
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Auto Scroll Function
const autoscroll= () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage); // get all css style of element
  // margin for $newMessage is 0px 0px 16px, so only calculated marginBottom
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  // offsetHeight is not contain margin, so added marginBottom to it
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height of messages container
  const visibleHeight = $messages.offsetHeight;

  // Total Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  // scrollTop is between container top and scroll bar top
  const scrollOffset = $messages.scrollTop + visibleHeight; // calculating the bottom of scorll bar which is (scrollTop + visible hieight of container)

  if (containerHeight - newMessageHeight <= scrollOffset) { // checking for scroll bar current position
    $messages.scrollTop = $messages.scrollHeight; // scroll to the container bottom
  }

  // alternate code for auto-scrolling using two lines of codes as following:
  // const element=$message.lastElementChild;
  // element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
}

// recieve custom event fired from server
socket.on('message', (message) => {
  console.log(message);

  // render template into div#messages
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);

  // Auto Scroll
  autoscroll();
});

// recieve custom event from server
socket.on('locationMessage', (message) => {
  console.log(message);

  // render template into div#messages
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);

  // Auto Scroll
  autoscroll();
});

// recieve custom event from server
socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // disable
  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;
   // client emit custom event to server (last parameter function is Event Acknowledgement)
  socket.emit('sendMessage', message, (ackError) => {
    // enable
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (ackError) {
      return console.log(ackError);
    }
    console.log('Message deliveried!');
  });
});

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  // disable 
  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position);

    // emit custom event from client to server , (last parameter function is Event Acknowledgement)
    socket.emit('sendLocation', { 
      latitude: position.coords.latitude, 
      longitude: position.coords.longitude 
    }, () => {
      // enable
      $sendLocationButton.removeAttribute('disabled');
      console.log("Location shared!");
    });
  });
});

// emait a built-in event from client to server (for joining to a room), (last parameter function is Event Acknowledgement)
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/'; // redirect to root page
  }
});