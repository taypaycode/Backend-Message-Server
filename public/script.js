// Global state
const state = {
    token: localStorage.getItem('authToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('authToken'),
    messages: [],
    images: []
};

// API configuration
const apiConfig = {
    // Try both options by uncommenting one:
    
    // Option 1: Use current origin (default)
    baseUrl: window.location.origin, 
    
    // Option 2: Explicitly use localhost:3000
    // baseUrl: 'http://localhost:3000',
    
    // Debug mode will log all API requests
    debug: true
};

// DOM elements
const elements = {
    // Auth elements
    authSection: document.getElementById('auth-section'),
    loginForm: document.getElementById('login-form').querySelector('form'),
    registerForm: document.getElementById('register-form').querySelector('form'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    
    // Dashboard elements
    dashboardSection: document.getElementById('dashboard-section'),
    username: document.getElementById('username'),
    logoutBtn: document.getElementById('logout-btn'),
    dashboardTabs: document.querySelectorAll('.dashboard-tab'),
    dashboardContents: document.querySelectorAll('.dashboard-content'),
    
    // Messages elements
    messageInput: document.getElementById('messageInput'),
    sendMessage: document.getElementById('sendMessage'),
    messageList: document.getElementById('messageList'),
    
    // Images elements
    uploadForm: document.getElementById('upload-form'),
    imageFile: document.getElementById('imageFile'),
    uploadImage: document.getElementById('uploadImage'),
    uploadProgress: document.getElementById('upload-progress'),
    uploadError: document.getElementById('upload-error'),
    imagesGallery: document.getElementById('images-gallery'),
    
    // API Test elements
    getMessage: document.getElementById('getMessage'),
    getMessage2: document.getElementById('getMessage2'),
    getMessage3: document.getElementById('getMessage3'),
    getProtected: document.getElementById('getProtected'),
    getAdmin: document.getElementById('getAdmin'),
    getMe: document.getElementById('getMe'),
    publicResponse: document.getElementById('public-response'),
    protectedResponse: document.getElementById('protected-response'),
    
    // Log elements
    refreshLogs: document.getElementById('refreshLogs'),
    logLevel: document.getElementById('logLevel'),
    logEntries: document.getElementById('log-entries')
};

// =====================
// Utility functions
// =====================

/**
 * Makes an API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
async function apiRequest(url, options = {}) {
    // Ensure URL has the correct base
    const fullUrl = url.startsWith('http') ? url : `${apiConfig.baseUrl}${url}`;
    
    // Set default headers
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add auth header if we have a token
    if (state.token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${state.token}`
        };
    }
    
    try {
        console.log(`Making API request to: ${fullUrl}`, options);
        const response = await fetch(fullUrl, options);
        
        // Debug info
        console.log(`API Response status: ${response.status}`, 
            `Content-Type: ${response.headers.get('content-type')}`);
        
        // Check if response is OK first
        if (!response.ok) {
            // Try to get error info from JSON if possible
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
            } catch (jsonError) {
                // If we can't parse JSON, just use status text
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
        }
        
        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error(`Expected JSON but got: ${contentType}`, 
                `URL: ${fullUrl}`, 
                `Status: ${response.status}`);
            throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error, `URL: ${fullUrl}`);
        throw error;
    }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    switch (type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show the toast with animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string}
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleString();
}

// =====================
// Authentication
// =====================

/**
 * Handles user login
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Basic validation
    if (!email || !password) {
        elements.loginError.textContent = 'Please enter both email and password';
        return;
    }
    
    try {
        elements.loginBtn.disabled = true;
        elements.loginBtn.textContent = 'Logging in...';
        elements.loginError.textContent = '';
        
        console.log('Attempting login for:', email);
        
        // First, test the debug route to check API connectivity
        try {
            const debugResult = await fetch(`${apiConfig.baseUrl}/api/debug`);
            const debugData = await debugResult.json();
            console.log('Debug API test result:', debugData);
            
            // Also try the auth test route
            const authTestResult = await fetch(`${apiConfig.baseUrl}/api/auth/test`);
            const authTestData = await authTestResult.json();
            console.log('Auth test result:', authTestData);
        } catch (debugError) {
            console.error('Debug route test failed:', debugError);
        }
        
        // Proceed with login using direct fetch
        const requestBody = { email, password };
        console.log('Sending login request to:', `${apiConfig.baseUrl}/api/auth/login`);
        console.log('Request payload:', requestBody);
        
        const response = await fetch(`${apiConfig.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Login response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Login error response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
            } catch (jsonError) {
                throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}...`);
            }
        }
        
        const data = await response.json();
        console.log('Login successful, received data:', data);
        
        // Save auth data
        state.token = data.token;
        state.user = data.user;
        state.isAuthenticated = true;
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update UI and show dashboard
        elements.username.textContent = data.user.username;
        showDashboard();
        
        showToast('Login successful!', 'success');
    } catch (error) {
        console.error('Login failed:', error);
        elements.loginError.textContent = error.message || 'Invalid credentials';
        showToast('Login failed', 'error');
    } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.textContent = 'Login';
    }
}

/**
 * Handles user registration
 * @param {Event} e - Form submit event 
 */
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Basic validation
    if (!username || !email || !password) {
        elements.registerError.textContent = 'Please fill out all fields';
        return;
    }
    
    if (password.length < 6) {
        elements.registerError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    try {
        elements.registerBtn.disabled = true;
        elements.registerBtn.textContent = 'Creating account...';
        elements.registerError.textContent = '';
        
        console.log('Attempting registration for:', email);
        
        // First, test the debug route to check API connectivity
        try {
            const debugResult = await fetch(`${apiConfig.baseUrl}/api/debug`);
            const debugData = await debugResult.json();
            console.log('Debug API test result:', debugData);
            
            // Also try the auth test route
            const authTestResult = await fetch(`${apiConfig.baseUrl}/api/auth/test`);
            const authTestData = await authTestResult.json();
            console.log('Auth test result:', authTestData);
        } catch (debugError) {
            console.error('Debug route test failed:', debugError);
        }
        
        // Proceed with registration using direct fetch API
        const requestBody = { username, email, password };
        console.log('Sending registration request to:', `${apiConfig.baseUrl}/api/auth/register`);
        console.log('Request payload:', requestBody);
        
        const response = await fetch(`${apiConfig.baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Registration response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Registration error response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
            } catch (jsonError) {
                throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}...`);
            }
        }
        
        const data = await response.json();
        console.log('Registration successful:', data);
        
        showToast('Registration successful! You can now log in.', 'success');
        
        // Auto-switch to login tab
        switchTab('login');
        
        // Pre-fill the login form with the registered email
        document.getElementById('loginEmail').value = email;
    } catch (error) {
        console.error('Registration failed:', error);
        elements.registerError.textContent = error.message || 'Registration failed';
        showToast('Registration failed', 'error');
    } finally {
        elements.registerBtn.disabled = false;
        elements.registerBtn.textContent = 'Register';
    }
}

/**
 * Handles user logout
 */
function handleLogout() {
    // Clear auth data
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Show auth section
    elements.authSection.classList.add('active');
    elements.dashboardSection.classList.remove('active');
    
    showToast('You have been logged out', 'info');
}

/**
 * Switch between auth tabs (login/register)
 * @param {string} tabName - Tab to switch to
 */
function switchTab(tabName) {
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.getElementById('login-form').classList.toggle('active', tabName === 'login');
    document.getElementById('register-form').classList.toggle('active', tabName === 'register');
    
    // Clear error messages
    elements.loginError.textContent = '';
    elements.registerError.textContent = '';
}

/**
 * Show dashboard after login
 */
function showDashboard() {
    elements.authSection.classList.remove('active');
    elements.dashboardSection.classList.add('active');
    
    // Load initial data
    loadMessages();
    loadImages();
}

// =====================
// Messages Functionality
// =====================

/**
 * Load messages from the API
 */
async function loadMessages() {
    try {
        const messages = await apiRequest('/api/messages');
        state.messages = messages;
        
        if (elements.messageList) {
            elements.messageList.innerHTML = '';
            
            if (messages.length === 0) {
                elements.messageList.innerHTML = '<li class="message-item">No messages yet. Be the first to send one!</li>';
                return;
            }
            
            messages.forEach(message => {
                const li = document.createElement('li');
                li.className = 'message-item';
                li.innerHTML = `
                    <div class="message-content">${message.text}</div>
                    <div class="message-timestamp">${formatDate(message.timestamp)}</div>
                `;
                elements.messageList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showToast('Failed to load messages', 'error');
    }
}

/**
 * Send a new message
 */
async function sendNewMessage() {
    const messageText = elements.messageInput.value.trim();
    
    if (!messageText) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    try {
        elements.sendMessage.disabled = true;
        elements.sendMessage.textContent = 'Sending...';
        
        await apiRequest('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: messageText })
        });
        
        // Clear input and reload messages
        elements.messageInput.value = '';
        await loadMessages();
        
        showToast('Message sent successfully', 'success');
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    } finally {
        elements.sendMessage.disabled = false;
        elements.sendMessage.textContent = 'Send Message';
    }
}

// =====================
// Image Upload Functionality
// =====================

/**
 * Load user's uploaded images
 */
async function loadImages() {
    if (!state.isAuthenticated) return;
    
    try {
        const images = await apiRequest('/api/images');
        state.images = images;
        
        if (elements.imagesGallery) {
            elements.imagesGallery.innerHTML = '';
            
            if (images.length === 0) {
                elements.imagesGallery.innerHTML = '<div class="image-placeholder">No images uploaded yet</div>';
                return;
            }
            
            images.forEach(image => {
                const imageCard = document.createElement('div');
                imageCard.className = 'image-card';
                imageCard.innerHTML = `
                    <img src="${image.url}" alt="${image.originalName}">
                    <div class="image-info">
                        <div class="image-name">${image.originalName}</div>
                        <div class="image-date">Uploaded: ${formatDate(image.uploadDate)}</div>
                    </div>
                `;
                elements.imagesGallery.appendChild(imageCard);
            });
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showToast('Failed to load images', 'error');
    }
}

/**
 * Handle image upload
 * @param {Event} e - Form submit event
 */
async function handleImageUpload(e) {
    e.preventDefault();
    
    const fileInput = elements.imageFile;
    if (!fileInput.files || !fileInput.files[0]) {
        elements.uploadError.textContent = 'Please select an image to upload';
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validate file type
    if (!file.type.match('image.*')) {
        elements.uploadError.textContent = 'Please select an image file (JPEG, PNG, etc.)';
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        elements.uploadImage.disabled = true;
        elements.uploadImage.textContent = 'Uploading...';
        elements.uploadError.textContent = '';
        
        // Show progress placeholder
        elements.uploadProgress.innerHTML = '<div style="width: 0%"></div>';
        
        // Upload the image
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });
        
        // Update progress
        elements.uploadProgress.querySelector('div').style.width = '100%';
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        // Clear file input
        fileInput.value = '';
        
        // Reload images
        await loadImages();
        
        showToast('Image uploaded successfully', 'success');
    } catch (error) {
        elements.uploadError.textContent = error.message || 'Upload failed';
        showToast('Image upload failed', 'error');
    } finally {
        elements.uploadImage.disabled = false;
        elements.uploadImage.textContent = 'Upload Image';
        
        // Hide progress after a delay
        setTimeout(() => {
            elements.uploadProgress.innerHTML = '';
        }, 2000);
    }
}

// =====================
// API Test Functionality
// =====================

/**
 * Test public API endpoints
 * @param {string} endpoint - API endpoint to test
 * @param {HTMLElement} responseElement - Element to show response
 */
async function testPublicEndpoint(endpoint, responseElement) {
    try {
        responseElement.textContent = 'Loading...';
        const data = await apiRequest(endpoint);
        responseElement.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        responseElement.textContent = `Error: ${error.message}`;
    }
}

/**
 * Test protected API endpoints
 * @param {string} endpoint - API endpoint to test
 * @param {HTMLElement} responseElement - Element to show response
 */
async function testProtectedEndpoint(endpoint, responseElement) {
    if (!state.isAuthenticated) {
        responseElement.textContent = 'Error: Authentication required';
        showToast('You must be logged in to access this endpoint', 'warning');
        return;
    }
    
    try {
        responseElement.textContent = 'Loading...';
        const data = await apiRequest(endpoint);
        responseElement.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        responseElement.textContent = `Error: ${error.message}`;
    }
}

// =====================
// Logs Functionality
// =====================

/**
 * Load system logs
 */
async function loadLogs() {
    if (!state.isAuthenticated) return;
    
    const logLevel = elements.logLevel.value;
    
    try {
        const logs = await apiRequest(`/api/logs?level=${logLevel}`);
        
        elements.logEntries.innerHTML = '';
        
        if (logs.length === 0) {
            elements.logEntries.innerHTML = '<div class="log-placeholder">No logs found</div>';
            return;
        }
        
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <div>
                    <span class="log-timestamp">${formatDate(log.timestamp)}</span>
                    <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                </div>
                <div class="log-message">${log.message}</div>
            `;
            elements.logEntries.appendChild(logEntry);
        });
    } catch (error) {
        console.error('Error loading logs:', error);
        elements.logEntries.innerHTML = `<div class="log-placeholder error">Error loading logs: ${error.message}</div>`;
    }
}

// =====================
// Dashboard Navigation
// =====================

/**
 * Switch dashboard tabs
 * @param {string} sectionId - Section ID to switch to
 */
function switchDashboardTab(sectionId) {
    // Update tab buttons
    elements.dashboardTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === sectionId);
    });
    
    // Update content sections
    elements.dashboardContents.forEach(content => {
        content.classList.toggle('active', content.id === sectionId);
    });
    
    // Load section-specific data
    if (sectionId === 'logs-section') {
        loadLogs();
    }
}

// =====================
// Event Listeners
// =====================

document.addEventListener('DOMContentLoaded', () => {
    // Auth tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Dashboard tab switching
    elements.dashboardTabs.forEach(tab => {
        tab.addEventListener('click', () => switchDashboardTab(tab.dataset.section));
    });
    
    // Auth events
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Message events
    elements.sendMessage.addEventListener('click', sendNewMessage);
    elements.messageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendNewMessage();
    });
    
    // Image upload events
    elements.uploadForm.addEventListener('submit', handleImageUpload);
    
    // API Test events
    elements.getMessage.addEventListener('click', () => testPublicEndpoint('/api/hello', elements.publicResponse));
    elements.getMessage2.addEventListener('click', () => testPublicEndpoint('/api/hello2', elements.publicResponse));
    elements.getMessage3.addEventListener('click', () => testPublicEndpoint('/api/hello3', elements.publicResponse));
    elements.getProtected.addEventListener('click', () => testProtectedEndpoint('/api/protected', elements.protectedResponse));
    elements.getAdmin.addEventListener('click', () => testProtectedEndpoint('/api/admin', elements.protectedResponse));
    elements.getMe.addEventListener('click', () => testProtectedEndpoint('/api/auth/me', elements.protectedResponse));
    
    // Log events
    elements.refreshLogs.addEventListener('click', loadLogs);
    elements.logLevel.addEventListener('change', loadLogs);
    
    // Check authentication state on page load
    if (state.isAuthenticated) {
        elements.username.textContent = state.user?.username || 'User';
        showDashboard();
    } else {
        elements.authSection.classList.add('active');
        elements.dashboardSection.classList.remove('active');
    }
}); 