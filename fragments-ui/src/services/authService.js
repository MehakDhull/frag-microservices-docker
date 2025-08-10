export class AuthService {
    constructor() {
        // Removed Cognito configuration - using basic auth only
    }

    // Main login method - now always uses basic auth
    async login() {
        return this.basicAuthLogin();
    }


    // Basic auth for development
    basicAuthLogin() {
        return new Promise((resolve) => {
            console.log('Creating login modal...');
            // Create a simple modal for basic auth
            const modal = this.createBasicAuthModal();
            document.body.appendChild(modal);
            
            // Force display of modal
            modal.style.display = 'flex';
            console.log('Modal created and displayed');

            const form = modal.querySelector('#basic-auth-form');
            const closeButtons = modal.querySelectorAll('.close-modal');
            
            if (!form) {
                console.error('Form not found in modal');
                return;
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted');
                const username = form.querySelector('#username').value;
                const password = form.querySelector('#password').value;
                
                console.log('Username:', username, 'Password:', password ? '[HIDDEN]' : 'empty');

                if (username && password) {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                    resolve({
                        success: true,
                        user: { username, email: username },
                        token: `${username}:${password}`
                    });
                } else {
                    alert('Please enter both username and password');
                }
            });

            // Add event listeners to all close buttons
            closeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Close button clicked');
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                    resolve({ success: false, message: 'Login cancelled' });
                });
            });
            
            // Close modal on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('Background clicked');
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                    resolve({ success: false, message: 'Login cancelled' });
                }
            });
        });
    }

    createBasicAuthModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Login</h3>
                    <span class="close close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="basic-auth-form">
                        <div class="form-group">
                            <label for="username">Username:</label>
                            <input type="text" id="username" class="form-control" 
                                   placeholder="user1@email.com" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" class="form-control" 
                                   placeholder="password1" required>
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </div>
                    </form>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; font-size: 0.9rem; color: #666;">
                        <strong>Test credentials:</strong><br>
                        Username: user1@email.com<br>
                        Password: password1
                    </div>
                </div>
            </div>
        `;
        return modal;
    }


    logout() {
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        
        // Reload the page to reset the UI
        window.location.reload();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    // Get stored user info
    getStoredUser() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    // Get stored token
    getStoredToken() {
        return localStorage.getItem('authToken');
    }
}
