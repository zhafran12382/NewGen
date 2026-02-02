// DOM Elements
const apiKeySection = document.getElementById('apiKeySection');
const chatMain = document.getElementById('chatMain');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const changeApiKeyBtn = document.getElementById('changeApiKey');

// Override Modal Elements
const settingsBtn = document.getElementById('settingsBtn');
const overrideModal = document.getElementById('overrideModal');
const closeModalBtn = document.getElementById('closeModal');
const triggerInput = document.getElementById('triggerInput');
const responseInput = document.getElementById('responseInput');
const addOverrideBtn = document.getElementById('addOverrideBtn');
const overridesList = document.getElementById('overridesList');

// State
let apiKey = '';
let responseOverrides = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for stored API key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        apiKey = storedKey;
        showChatInterface();
    }

    // Load stored overrides
    loadOverrides();

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

// Override Modal Event Listeners
settingsBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
overrideModal.addEventListener('click', (e) => {
    if (e.target === overrideModal) closeModal();
});
addOverrideBtn.addEventListener('click', addOverride);

// Modal Functions
function openModal() {
    overrideModal.classList.add('active');
    renderOverridesList();
}

function closeModal() {
    overrideModal.classList.remove('active');
    triggerInput.value = '';
    responseInput.value = '';
}

// Override Management Functions
function loadOverrides() {
    const stored = localStorage.getItem('response_overrides');
    if (stored) {
        try {
            responseOverrides = JSON.parse(stored);
        } catch (e) {
            responseOverrides = [];
        }
    }
}

function saveOverrides() {
    localStorage.setItem('response_overrides', JSON.stringify(responseOverrides));
}

function addOverride() {
    const trigger = triggerInput.value.trim().toLowerCase();
    const response = responseInput.value.trim();
    
    if (!trigger || !response) {
        alert('Please fill in both trigger phrase and response.');
        return;
    }
    
    // Check for duplicate triggers
    const existingIndex = responseOverrides.findIndex(o => normalizeForMatching(o.trigger) === normalizeForMatching(trigger));
    if (existingIndex !== -1) {
        responseOverrides[existingIndex].response = response;
    } else {
        responseOverrides.push({ trigger, response });
    }
    
    saveOverrides();
    renderOverridesList();
    triggerInput.value = '';
    responseInput.value = '';
}

function deleteOverride(index) {
    responseOverrides.splice(index, 1);
    saveOverrides();
    renderOverridesList();
}

function renderOverridesList() {
    if (responseOverrides.length === 0) {
        overridesList.innerHTML = '<p class="no-overrides">No overrides configured yet.</p>';
        return;
    }
    
    overridesList.innerHTML = responseOverrides.map((override, index) => `
        <div class="override-item">
            <div class="override-info">
                <div class="override-trigger">"${escapeHtml(override.trigger)}"</div>
                <div class="override-response">${escapeHtml(override.response)}</div>
            </div>
            <button class="override-delete" data-index="${index}">Delete</button>
        </div>
    `).join('');
    
    // Add event listeners for delete buttons
    overridesList.querySelectorAll('.override-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            deleteOverride(index);
        });
    });
}

// Word-order independent matching
function normalizeForMatching(text) {
    // Convert to lowercase, remove punctuation, split into words, sort, and join
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0)
        .sort()
        .join(' ');
}

function checkForOverride(message) {
    const normalizedMessage = normalizeForMatching(message);
    const messageWords = normalizedMessage.split(' ');
    
    for (const override of responseOverrides) {
        const normalizedTrigger = normalizeForMatching(override.trigger);
        const triggerWords = normalizedTrigger.split(' ');
        
        // Check if the message contains all words from the trigger (allows extra words)
        const allWordsMatch = triggerWords.every(word => messageWords.includes(word));
        
        if (allWordsMatch) {
            return override.response;
        }
    }
    
    return null;
}

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

    // Check for override first
    const overrideResponse = checkForOverride(message);
    
    if (overrideResponse) {
        // Use override response with a small delay to feel natural
        setTimeout(() => {
            addMessage(overrideResponse);
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }, 500);
        return;
    }

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
