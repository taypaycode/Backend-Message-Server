document.getElementById('getMessage').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/hello');
        const data = await response.json();
        document.getElementById('message').textContent = data.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Error fetching message';
    }
}); 

document.getElementById('getMessage2').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/hello2');
        const data = await response.json();
        document.getElementById('message2').textContent = data.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message2').textContent = 'Error fetching message';
    }
}); 

document.getElementById('getMessage3').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/hello3');
        const data = await response.json();
        document.getElementById('message3').textContent = data.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message3').textContent = 'Error fetching message';
    }
}); 

// Function to load and display messages
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const messages = await response.json();
        console.log('Fetched messages:', messages);
        const messageList = document.getElementById('messageList');
        messageList.innerHTML = messages.map(msg => `
            <li>
                ${msg.text}
                <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Load messages when page loads
loadMessages();

// Handle sending new messages
document.getElementById('sendMessage').addEventListener('click', async () => {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (response.ok) {
            input.value = '';
            loadMessages();  // Reload messages after sending
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}); 