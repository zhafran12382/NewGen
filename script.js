// DOM Elements
const apiKeySection = document.getElementById('apiKeySection');
const chatMain = document.getElementById('chatMain');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const showPasswordBtn = document.getElementById('showPassword');
const chatMessages = document.getElementById('chatMessages');
const welcomeScreen = document.getElementById('welcomeScreen');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const changeApiKeyBtn = document.getElementById('changeApiKey');
const newChatBtn = document.getElementById('newChatBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const themeToggle = document.getElementById('themeToggle');

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
let chatHistory = [];
let currentChatId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load theme - prioritize saved theme, fallback to HTML default
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Check for stored API key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        apiKey = storedKey;
        showChatInterface();
    }

    // Load stored overrides
    loadOverrides();

    // Load chat history
    loadChatHistory();

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        autoResizeTextarea();
        updateSendButton();
    });

    // Initialize send button state
    updateSendButton();
});

// Event Listeners
saveApiKeyBtn.addEventListener('click', saveApiKey);
apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveApiKey();
});

// Show/Hide Password
showPasswordBtn.addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
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

// New Chat
newChatBtn.addEventListener('click', startNewChat);

// Sidebar Toggle
sidebarToggle.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Theme Toggle
themeToggle.addEventListener('click', toggleTheme);

// Suggestion Cards
document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
        const prompt = card.dataset.prompt;
        userInput.value = prompt;
        autoResizeTextarea();
        updateSendButton();
        userInput.focus();
    });
});

// Override Modal Event Listeners
settingsBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
overrideModal.addEventListener('click', (e) => {
    if (e.target === overrideModal) closeModal();
});
addOverrideBtn.addEventListener('click', addOverride);

// Functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebar.classList.add('collapsed');
    sidebarOverlay.classList.remove('active');
}

function startNewChat() {
    currentChatId = Date.now().toString();
    chatMessages.innerHTML = '';
    welcomeScreen.style.display = 'flex';
    chatMessages.classList.remove('active');
    userInput.value = '';
    userInput.focus();
    closeSidebar();
}

function loadChatHistory() {
    const stored = localStorage.getItem('chat_history');
    if (stored) {
        try {
            chatHistory = JSON.parse(stored);
            renderChatHistory();
        } catch (e) {
            chatHistory = [];
        }
    }
}

function saveChatHistory() {
    localStorage.setItem('chat_history', JSON.stringify(chatHistory));
}

function renderChatHistory() {
    const todayChats = document.getElementById('todayChats');
    if (!todayChats) return;
    
    if (chatHistory.length === 0) {
        todayChats.innerHTML = '<div class="history-item" style="color: var(--text-tertiary);">No chat history</div>';
        return;
    }
    
    todayChats.innerHTML = chatHistory.slice(0, 10).map(chat => `
        <div class="history-item" data-id="${chat.id}">${escapeHtml(chat.title)}</div>
    `).join('');
    
    // Add click listeners to history items (currently displays chat title only)
    // Full chat loading functionality can be added in future updates
}

function updateSendButton() {
    sendBtn.disabled = !userInput.value.trim();
}

// Modal Functions
function openModal() {
    overrideModal.classList.add('active');
    renderOverridesList();
    closeSidebar();
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
    
    overridesList.querySelectorAll('.override-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            deleteOverride(index);
        });
    });
}

// Word-order independent matching
function normalizeForMatching(text) {
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
        
        const allWordsMatch = triggerWords.every(word => messageWords.includes(word));
        
        if (allWordsMatch) {
            return override.response;
        }
    }
    
    return null;
}

// API Key Functions
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
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
}

function addMessage(content, isUser = false, isError = false) {
    // Hide welcome screen when messages are added
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    chatMessages.classList.add('active');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}${isError ? ' error-message' : ''}`;
    
    const avatarContent = isUser ? '👤' : '✨';
    const authorName = isUser ? 'You' : 'NewGen AI';
    
    messageDiv.innerHTML = `
        <div class="message-inner">
            <div class="message-avatar">${avatarContent}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${authorName}</span>
                </div>
                <div class="message-text">${escapeHtml(content)}</div>
                <div class="message-actions">
                    <button class="action-btn copy-btn" title="Copy message">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add copy functionality
    const copyBtn = messageDiv.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;
            setTimeout(() => {
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                `;
            }, 2000);
        });
    });
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Save to chat history
    if (isUser && (chatHistory.length === 0 || (currentChatId && !chatHistory.find(c => c.id === currentChatId)))) {
        chatHistory.unshift({
            id: currentChatId || Date.now().toString(),
            title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
            timestamp: Date.now()
        });
        saveChatHistory();
        renderChatHistory();
    }
}

function addTypingIndicator() {
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    chatMessages.classList.add('active');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-inner">
            <div class="message-avatar">✨</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">NewGen AI</span>
                </div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
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

    // Initialize chat ID if not set
    if (!currentChatId) {
        currentChatId = Date.now().toString();
    }

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
        setTimeout(() => {
            addMessage(overrideResponse);
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            updateSendButton();
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
    updateSendButton();
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
