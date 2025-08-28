// autoLoginToggle.js - Shared toggle UI for Auto Login

function applyToggleStyles(a, enabled) {
    a.className = (a.className || '') + ' dr-autologin-toggle nav-link';
    a.style.borderRadius = '12px';
    a.style.display = 'inline-flex';
    a.style.alignItems = 'center';
    a.style.gap = '6px';
    a.style.padding = '6px 10px';
    if (enabled) {
        a.innerHTML = '<i class="fas fa-toggle-on"></i> <span style="margin-left:6px; font-weight:600;">TỰ ĐỘNG LOGIN</span>';
        a.style.background = '#dc2626';
        a.style.color = '#fff';
        a.style.border = '1px solid #b91c1c';
    } else {
        a.innerHTML = '<i class="fas fa-toggle-off"></i> <span style="margin-left:6px;">TỰ ĐỘNG LOGIN</span>';
        a.style.background = '#fff';
        a.style.color = '#111827';
        a.style.border = '1px solid #e5e7eb';
    }
}

function createAutoLoginToggle({ enabled, onToggle, onDblClick, title }) {
    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.title = title || 'Bật/tắt tự động login';
    applyToggleStyles(a, !!enabled);
    a.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof onToggle === 'function') onToggle();
    });
    if (typeof onDblClick === 'function') {
        a.addEventListener('dblclick', (e) => {
            e.preventDefault();
            onDblClick();
        });
    }
    return a;
}

module.exports = { createAutoLoginToggle, applyToggleStyles };
