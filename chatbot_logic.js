
        // Global variables
        let apiKey = localStorage.getItem('gemini_api_key');
        let isDarkTheme = localStorage.getItem('dark_theme') === 'true';
        let chatHistory = JSON.parse(localStorage.getItem('chat_history') || '[]');

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            initializeTheme();
            initializeApiKey();
            loadChatHistory();
            setupEventListeners();
        });

        function initializeTheme() {
            if (isDarkTheme) {
                document.body.classList.add('dark-theme');
                document.getElementById('themeIcon').textContent = '☀️';
            }
        }

        function initializeApiKey() {
            if (apiKey) {
                enableChat();
                updateStatus('Connected', 'success');
            } else {
                updateStatus('API Key Required', 'error');
            }
        }

        function setupEventListeners() {
            const chatInput = document.getElementById('chatInput');
            const sendButton = document.getElementById('sendButton');

            // Auto-resize textarea
            chatInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });

            // Send message on Enter (but allow Shift+Enter for new line)
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Enable/disable send button based on input
            chatInput.addEventListener('input', function() {
                sendButton.disabled = !this.value.trim() || !apiKey;
            });
        }

        function toggleTheme() {
            isDarkTheme = !isDarkTheme;
            document.body.classList.toggle('dark-theme');
            document.getElementById('themeIcon').textContent = isDarkTheme ? '☀️' : '🌙';
            localStorage.setItem('dark_theme', isDarkTheme);
        }

        function openApiKeyModal() {
            document.getElementById('apiKeyModal').style.display = 'flex';
            document.getElementById('apiKeyInput').value = apiKey || '';
            document.getElementById('apiKeyInput').focus();
        }

        function closeApiKeyModal() {
            document.getElementById('apiKeyModal').style.display = 'none';
        }

        function saveApiKey() {
            const newApiKey = document.getElementById('apiKeyInput').value.trim();
            if (newApiKey) {
                apiKey = newApiKey;
                localStorage.setItem('gemini_api_key', apiKey);
                enableChat();
                updateStatus('Connected', 'success');
                closeApiKeyModal();
            } else {
                alert('Please enter a valid API key');
            }
        }

        function enableChat() {
            document.getElementById('chatInput').disabled = false;
            document.getElementById('sendButton').disabled = false;
        }

        function updateStatus(text, type = 'success') {
            document.getElementById('statusText').textContent = text;
            const statusDot = document.getElementById('statusDot');
            statusDot.className = `status-dot ${type === 'error' ? 'error' : ''}`;
        }

        async function sendMessage() {
            const chatInput = document.getElementById('chatInput');
            const message = chatInput.value.trim();
            
            if (!message || !apiKey) return;

            // Add user message to chat
            addMessage(message, 'user');
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // Show typing indicator
            showTypingIndicator();

            try {
                // Call Gemini API
                const response = await callGeminiAPI(message);
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // Add bot response to chat
                addMessage(response, 'bot');
                
                updateStatus('Connected', 'success');
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                hideTypingIndicator();
                addMessage('Sorry, I encountered an error. Please check your API key and try again.', 'bot');
                updateStatus('Error', 'error');
            }
        }

        async function callGeminiAPI(message) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format');
            }
        }

        function addMessage(content, sender) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = sender === 'user' ? 'U' : 'AI';

            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.innerHTML = content.replace(/\n/g, '<br>');

            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = new Date().toLocaleTimeString();

            messageContent.appendChild(messageTime);
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
            chatMessages.appendChild(messageDiv);

            // Save to chat history
            chatHistory.push({
                content,
                sender,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('chat_history', JSON.stringify(chatHistory));

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator() {
            document.getElementById('typingIndicator').style.display = 'flex';
            document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        }

        function hideTypingIndicator() {
            document.getElementById('typingIndicator').style.display = 'none';
        }

        function loadChatHistory() {
            if (chatHistory.length > 0) {
                // Clear welcome message
                document.getElementById('chatMessages').innerHTML = '';
                
                // Load chat history
                chatHistory.forEach(msg => {
                    addMessage(msg.content, msg.sender);
                });
            }
        }

        // Close modal when clicking outside
        document.getElementById('apiKeyModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeApiKeyModal();
            }
        });

        // Handle API key input Enter key
        document.getElementById('apiKeyInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                saveApiKey();
            }
        });