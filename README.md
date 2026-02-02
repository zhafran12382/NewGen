# AI Chatbot - Powered by Google Gemini

A modern, responsive AI chatbot web application powered by Google's Gemini API.

![AI Chatbot](https://img.shields.io/badge/AI-Chatbot-blue)
![Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🤖 AI-powered conversations using Google Gemini API
- 💬 Modern, clean chat interface
- 📱 Fully responsive design (works on mobile and desktop)
- 🔐 Secure API key storage (stored locally in browser)
- ⚡ Real-time typing indicators
- 🎨 Beautiful gradient UI design
- 🎯 **Response Overrides** - Create custom responses for specific questions

## 🎯 Response Overrides (Unique Feature)

You can create custom responses that override the AI for specific phrases. The matching is **word-order independent**, meaning:

- "siapa anda" and "anda siapa" will both trigger the same response
- "siapa anda sebenarnya" will also match because it contains "siapa anda"

### How to Use:
1. Click the ⚙️ settings button in the header
2. Add a trigger phrase (e.g., "siapa anda")
3. Add a custom response (e.g., "Saya adalah Syahla")
4. The AI will now respond with your custom message whenever the trigger phrase is detected

## 🚀 Getting Started

### Option 1: Open Directly in Browser

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Enter your Gemini API key when prompted

### Option 2: Use a Local Server

```bash
# Using Python
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key
5. Paste it into the chatbot when prompted

## 📁 Project Structure

```
NewGen/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── script.js       # JavaScript logic
├── README.md       # This file
└── LICENSE         # MIT License
```

## 🛡️ Security Notes

- Your API key is stored locally in your browser's localStorage
- API keys are never sent to any third-party servers
- For production use, consider implementing a backend proxy to protect your API key

## 🎨 Customization

You can easily customize the chatbot by modifying:

- **Colors**: Edit the gradient colors in `styles.css` (look for `#667eea` and `#764ba2`)
- **Model**: Change the Gemini model in `script.js` (default: `gemini-2.0-flash`)
- **Temperature**: Adjust response creativity in `script.js` (`generationConfig.temperature`)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for providing the AI capabilities
- Modern CSS techniques for the beautiful UI design
