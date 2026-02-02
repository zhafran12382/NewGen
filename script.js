// DOM Elements
const apiKeySection = document.getElementById('apiKeySection');
const chatMain = document.getElementById('chatMain');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const changeApiKeyBtn = document.getElementById('changeApiKey');

// State
let apiKey = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for stored API key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        apiKey = storedKey;
        showChatInterface();
    }

    // Auto-resize textarea
    userInput.addEventListener('input', autoResizeTextarea);
});

// Event Listeners
saveApiKeyBtn.addEventListener('click', saveApiKey);
apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveApiKey();
});

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

changeApiKeyBtn.addEventListener('click', () => {
    localStorage.removeItem('gemini_api_key');
    apiKey = '';
    apiKeyInput.value = '';
    showApiKeySection();
});

// Functions
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    const apiError = document.getElementById('apiError');
    
    if (!key) {
        apiError.textContent = 'Please enter a valid API key';
        apiError.style.display = 'block';
        apiKeyInput.focus();
        return;
    }
    
    apiError.style.display = 'none';
    apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    showChatInterface();
}

function showChatInterface() {
    apiKeySection.style.display = 'none';
    chatMain.style.display = 'flex';
    userInput.focus();
}

function showApiKeySection() {
    chatMain.style.display = 'none';
    apiKeySection.style.display = 'flex';
    apiKeyInput.focus();
}

function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
}

function addMessage(content, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}${isError ? ' error-message' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">
            <p>${escapeHtml(content)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show typing indicator
    addTypingIndicator();

    try {
        const response = await callGeminiAPI(message);
        removeTypingIndicator();
        addMessage(response);
    } catch (error) {
        removeTypingIndicator();
        addMessage(`Error: ${error.message}`, false, true);
    }

    // Re-enable input
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

async function callGeminiAPI(message) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: message
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
        }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
            throw new Error('Invalid API key. Please check your API key and try again.');
        } else if (response.status === 403) {
            throw new Error('API key does not have access. Please ensure your API key is valid.');
        } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else {
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from API. Please try again.');
    }

    return data.candidates[0].content.parts[0].text;
}
