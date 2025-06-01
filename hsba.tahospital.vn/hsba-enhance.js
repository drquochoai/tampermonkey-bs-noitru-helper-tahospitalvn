// hsba.tahospital.vn/hsba-enhance.js
// Ẩn section rỗng, auto-click, các xử lý UI cho hsba
(function() {
    if (window.location.hostname !== 'hsba.tahospital.vn') return;
    // --- HSBA V2 PAGE ENHANCEMENT: Hide empty sections (no documents) ---
    function HSBAV2HideEmptySectionsIfNeeded() {
        function hideEmptySections() {
            document.querySelectorAll('div.MuiBox-root.css-0').forEach(div => {
                const p = div.querySelector('p');
                if (p && /\(0\)\s*$/.test(p.textContent)) {
                    div.style.display = 'none';
                }
            });
        }
        function waitForFullLoadAndHide() {
            let lastCount = 0;
            let stableCount = 0;
            const maxWait = 20000; // 20 seconds max
            const startTime = performance.now();
            const interval = setInterval(() => {
                const currentCount = document.querySelectorAll('div.MuiBox-root.css-0').length;
                if (currentCount === lastCount) {
                    stableCount++;
                } else {
                    stableCount = 0;
                }
                lastCount = currentCount;
                if (stableCount > 10 || (performance.now() - startTime) > maxWait) {
                    clearInterval(interval);
                    hideEmptySections();
                    const targetDiv = document.querySelector('div.MuiBox-root.css-1ebnygn');
                    if (targetDiv) {
                        targetDiv.click();
                    }
                }
            }, 1000);
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', waitForFullLoadAndHide);
        } else {
            waitForFullLoadAndHide();
        }
        const observer = new MutationObserver(hideEmptySections);
        observer.observe(document.body, { childList: true, subtree: true });
    }
    HSBAV2HideEmptySectionsIfNeeded();
})();
