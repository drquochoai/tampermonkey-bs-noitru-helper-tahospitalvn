// loginHandler.js - Centralized login prompt handling

const LoginHandler = {
    /**
     * Show login prompt and redirect to login page
     */
    showLoginPrompt() {
        document.body.innerHTML = '';
        const loginDiv = document.createElement('div');
        loginDiv.className = 'dr-login';
        loginDiv.textContent = 'Vui lòng đăng nhập để xem dữ liệu';
        document.body.appendChild(loginDiv);
        
        setTimeout(() => {
            window.location.href = '/Home/Login';
        }, 500);
    },

    /**
     * Check if user needs to login and handle accordingly
     */
    handleLoginRequired() {
        this.showLoginPrompt();
    }
};

module.exports = LoginHandler;
