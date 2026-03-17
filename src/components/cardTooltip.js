// cardTooltip.js - Global hover tooltip for patient cards

const STORAGE_KEY = 'dr-card-hover-preview';
let tooltipEnabled = true;

function syncEnabledFromStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            tooltipEnabled = saved !== '0';
        }
    } catch (_) {}
    return tooltipEnabled;
}

function setEnabled(enabled) {
    tooltipEnabled = enabled !== false;
    const tooltip = document.getElementById('dr-global-card-tooltip');
    if (tooltip && !tooltipEnabled) {
        tooltip.style.display = 'none';
    }
}

function isEnabled() {
    return tooltipEnabled;
}

syncEnabledFromStorage();

/**
 * Attach hover tooltip to a patient card
 * @param {HTMLElement} card - The card or wrapper element to trigger the tooltip
 * @param {HTMLElement} contentSource - The element to clone into the tooltip (usually the card itself)
 */
function attach(card, contentSource) {
    if (!card || !contentSource) return;

    card.addEventListener('mouseenter', (e) => {
        if (!isEnabled()) return;
        let tooltip = document.getElementById('dr-global-card-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dr-global-card-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                z-index: 100000;
                pointer-events: none;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                width: 320px;
                transform: translate(15px, 15px);
                display: none;
            `;
            document.body.appendChild(tooltip);
        }

        const clone = contentSource.cloneNode(true);
        // Ensure clone is visible and reset any truncations
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';
        clone.style.opacity = '1';
        clone.classList.remove('dr-tracking-card'); // Remove tracking specific styles if any
        
        // Remove interactive stuff from clone
        const rmBtns = clone.querySelectorAll('button, .dr-tracking-remove, .dr-action-buttons');
        rmBtns.forEach(b => b.remove());

        // Fix CSS clamp to show full text for specific lines
        const lines = clone.querySelectorAll('.dr-diagnosis-line, .dr-pt-info, .dr-hxt-block');
        lines.forEach(l => {
            l.style.webkitLineClamp = 'unset';
            l.style.display = 'block';
            l.style.whiteSpace = 'normal';
        });

        tooltip.innerHTML = '';
        tooltip.appendChild(clone);
        tooltip.style.display = 'block';
    });

    card.addEventListener('mousemove', (e) => {
        if (!isEnabled()) return;
        const tooltip = document.getElementById('dr-global-card-tooltip');
        if (tooltip && tooltip.style.display === 'block') {
            let top = e.clientY + 15;
            let left = e.clientX + 15;
            
            // Wait for next frame to get height correctly if needed, 
            // but usually it's already there
            const rect = tooltip.getBoundingClientRect();
            if (top + rect.height > window.innerHeight) {
                top = e.clientY - rect.height - 15;
            }
            if (left + rect.width > window.innerWidth) {
                left = e.clientX - rect.width - 15;
            }
            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
        }
    });

    card.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('dr-global-card-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    });
}

module.exports = {
    attach,
    setEnabled,
    isEnabled,
    syncEnabledFromStorage,
    STORAGE_KEY
};
