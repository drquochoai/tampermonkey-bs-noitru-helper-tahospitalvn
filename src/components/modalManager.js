// modalManager.js - Centralized modal/sidebar management
let SidebarSession = null;
try { SidebarSession = require('./sidebarSession'); } catch(_) {}

const ModalManager = {
    /**
     * Create or get existing backdrop element
     */
    getOrCreateBackdrop() {
        let backdrop = document.getElementById('dr-sidebar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'dr-sidebar-backdrop';
            backdrop.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:99999;';
            document.body.appendChild(backdrop);
        }
        return backdrop;
    },

    /**
     * Create or get existing sidebar element
     */
    getOrCreateSidebar() {
        let sidebar = document.getElementById('dr-sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'dr-sidebar';
            document.body.appendChild(sidebar);
        }
        return sidebar;
    },

    /**
     * Show modal with backdrop
     */
    showModal(sidebar, backdrop) {
        backdrop.style.display = 'block';
        sidebar.style.display = 'block';
    },

    /**
     * Hide modal and backdrop
     */
    hideModal(sidebar, backdrop) {
        if (sidebar) {
            sidebar.style.display = 'none';
            sidebar.innerHTML = ''; // Clear content between patients
        }
        backdrop.style.display = 'none';
    try { if (SidebarSession && typeof SidebarSession.endSession === 'function') SidebarSession.endSession(); } catch(_) {}
    },

    /**
     * Setup modal close handlers
     */
    setupCloseHandlers(sidebar, backdrop) {
        const hideModal = () => this.hideModal(sidebar, backdrop);
        
        // Click backdrop to close
        backdrop.onclick = hideModal;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Đóng';
        closeBtn.style = 'position:absolute;top:12px;right:12px;background:#eee;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;';
        closeBtn.onclick = hideModal;
        
        return closeBtn;
    }
};

module.exports = ModalManager;
