// common/styles.js
// Hàm inject CSS toàn cục
(function() {
    if (window.addGlobalStyles) return;
    window.addGlobalStyles = function() {
        if (document.getElementById('dr-global-style')) return;
        const style = document.createElement('style');
        style.id = 'dr-global-style';
        style.textContent = `
            /* Thêm CSS toàn cục tại đây */
        `;
        document.head.appendChild(style);
    };
})();
