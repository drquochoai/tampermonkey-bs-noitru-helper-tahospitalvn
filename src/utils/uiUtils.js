// uiUtils.js - UI utility functions

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {object} options - Options for toast
 * @param {string} options.background - Background color
 * @param {string} options.color - Text color
 * @param {number} options.duration - Duration in milliseconds
 */
function showToast(message, options = {}) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${options.background || '#4caf50'};
        color: ${options.color || '#fff'};
        padding: 12px 28px;
        border-radius: 8px;
        font-size: 1.1em;
        z-index: 1000002;
        box-shadow: 0 2px 12px rgba(76, 175, 80, 0.3);
        transition: opacity 0.3s;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, options.duration || 2000);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            textArea.remove();
            return success;
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

module.exports = {
    showToast,
    copyToClipboard
};
