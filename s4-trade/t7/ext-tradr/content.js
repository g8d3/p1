console.log('Content script loaded');
window.addEventListener('message', (event) => {
  console.log('Message received', event.data);
  if (event.source === window && event.data.action) {
    console.log('Forwarding message', event.data);
    chrome.runtime.sendMessage(event.data);
  }
});