// common/styles.js
// Hàm inject CSS toàn cục
(function() {
    if (window.addGlobalStyles) return;
    window.addGlobalStyles = function() {
        if (document.getElementById('dr-global-style')) return;
        const style = document.createElement('style');
        style.id = 'dr-global-style';
        style.textContent = `
            .dr-card-list { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 30px; }
            .dr-card { background: #fff; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.10); padding: 24px 20px 50px 20px; min-width: 260px; max-width: 320px; flex: 1 1 260px; display: flex; flex-direction: column; align-items: flex-start; position: relative; border: 2px solid #e3e3e3; cursor:pointer; }
            .dr-card.dr-blue { background: #e3f2fd; border: 2px solid #90caf9; }
            .dr-card h2 { margin: 0 0 8px 0; font-size: 1.2em; color: #1976d2; }
            .dr-card .dr-label { font-weight: bold; color: #333; }
            .dr-card .dr-value { margin-bottom: 6px; }
            .dr-card .dr-detail-btn { position: absolute; right: 16px; bottom: 12px; background: #1976d2; color: #fff; border: none; border-radius: 50px; padding: 6px 16px 6px 10px; font-size: 15px; cursor: pointer; display: flex; align-items: center; box-shadow: 0 2px 6px rgba(25,118,210,0.10); }
            .dr-card .dr-detail-btn svg { margin-right: 4px; }
            .dr-total { text-align: center; font-size: 1.1em; margin-top: 30px; color: #1976d2; font-weight: bold; }
            .dr-nodata, .dr-login { text-align: center; font-size: 1.2em; color: #b71c1c; margin-top: 40px; }
            .dr-bottom-bar {
                position: fixed;
                left: 0; right: 0; bottom: 0;
                width: 100vw;
                background: #fff;
                border-top: 2px solid #90caf9;
                box-shadow: 0 -2px 8px rgba(25,118,210,0.08);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 24px;
                height: 54px;
                z-index: 99999;
                font-size: 1.1em;
            }
            .dr-bottom-bar-left { color: #1976d2; font-weight: bold; }
            @media (max-width: 600px) {
                .dr-bottom-bar { flex-direction: column; height: auto; padding: 8px 8px; }
                .dr-card-list { flex-direction: column; align-items: center; }
            }
            #dr-sidebar-backdrop {
                position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:99999;
            }
            #dr-sidebar {
                position:fixed;top:0;right:0;width:400px;max-width:100vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;
            }
            @media print {
                .no-print { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    };
})();
