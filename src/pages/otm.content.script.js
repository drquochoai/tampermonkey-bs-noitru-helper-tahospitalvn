// otm.content.js - Content script for OTM surgery data fetching
(function() {
    'use strict';

    console.log('OTM Content Script loaded');

    // Function to check if debug is enabled
    function isDebugEnabled() {
        return localStorage.getItem('dr_debug_otm') === 'true';
    }

    // Function to log debug messages
    function debugLog(message, ...args) {
        if (isDebugEnabled()) {
            console.log('[OTM Debug]', message, ...args);
        }
    }

    // Lightweight validation for access tokens to avoid saving 'undefined'/'null'/too-short values
    function isLikelyValidToken(tok) {
        try {
            if (typeof tok !== 'string') return false;
            const t = tok.trim();
            if (!t) return false;
            const low = t.toLowerCase();
            if (low === 'undefined' || low === 'null') return false;
            if (t.length < 16) return false; // heuristic: tokens are typically long
            // avoid whitespace in token
            if (/\s/.test(t)) return false;
            return true;
        } catch { return false; }
    }

    // Function to save bearer token to GM and localStorage (only if valid)
    function saveBearerToken(token) {
        try {
            if (!isLikelyValidToken(token)) {
                debugLog('Refusing to save invalid bearer token candidate');
                return;
            }
            try { sessionStorage.setItem('otm_bearer_token', token); } catch(_) {}
            try { localStorage.setItem('otm_bearer_token', token); } catch(_) {}
            try { if (typeof GM !== 'undefined' && GM.setValue) { GM.setValue('otm_bearer_token', token); } } catch(_) {}
            debugLog('Bearer token saved');
        } catch (error) {
            debugLog('Error saving bearer token:', error);
        }
    }

    // Function to get bearer token from GM or localStorage (awaits GM when needed)
    async function getSavedBearerTokenAsync() {
        try {
            let token = null;
            try { token = sessionStorage.getItem('otm_bearer_token'); } catch(_) { token = null; }
            if (!token) { try { token = localStorage.getItem('otm_bearer_token'); } catch(_) { token = null; } }
            if (!token && typeof GM !== 'undefined' && GM.getValue) {
                try {
                    token = await GM.getValue('otm_bearer_token', '');
                    if (token) {
                        try { sessionStorage.setItem('otm_bearer_token', token); } catch(_) {}
                        try { localStorage.setItem('otm_bearer_token', token); } catch(_) {}
                    }
                } catch(_) { token = null; }
            }
            if (token) {
                // Guard against polluted storage values like 'undefined' or too short strings
                if (!isLikelyValidToken(token)) {
                    debugLog('Found invalid token in storage; cleaning up');
                    try { sessionStorage.removeItem('otm_bearer_token'); } catch(_) {}
                    try { localStorage.removeItem('otm_bearer_token'); } catch(_) {}
                    try { if (typeof GM !== 'undefined' && GM.deleteValue) { GM.deleteValue('otm_bearer_token'); } } catch(_) {}
                    return null;
                }
                debugLog('Found saved bearer token (async)');
                return token;
            }
        } catch (error) {
            debugLog('Error getting saved bearer token (async):', error);
        }
        return null;
    }

    // Function to send message to parent using GM storage
    function sendMessageToParent(type, data) {
        debugLog('Sending message to parent via GM storage:', type, data);
        try {
            const key = `otm_${type}`;
            const value = JSON.stringify({
                data: {
                    ...(data || {})
                },
                timestamp: Date.now(),
                tabId: Math.random().toString(36).substr(2, 9)
            });

            if (typeof GM !== 'undefined' && GM.setValue) {
                GM.setValue(key, value);
                debugLog(`Stored ${key} in GM storage`);
            } else {
                debugLog('GM.setValue not available, falling back to localStorage');
                localStorage.setItem(key, value);
            }
        } catch (error) {
            debugLog('Error storing message:', error);
        }
    }

    // Function to close this tab - always self-close like ?nln flow, with robust fallbacks
    function closeTab() {
        debugLog('Closing OTM tab (self + fallback signal)');
        // Signal parent as a fallback in case self-close is blocked
        try { sendMessageToParent('close_tab', { reason: 'self_close_fallback' }); } catch(_) {}
        // Try TM API if available
        try { if (typeof GM !== 'undefined' && GM.closeTab) { GM.closeTab(); } } catch(_) {}
        // Try window.close twice with small delays
        try { window.close(); } catch (_) { /* ignore */ }
        setTimeout(() => {
            try { if (typeof GM !== 'undefined' && GM.closeTab) { GM.closeTab(); } } catch(_) {}
            try { window.close(); } catch(_) {}
        }, 300);
        setTimeout(() => {
            try { if (typeof GM !== 'undefined' && GM.closeTab) { GM.closeTab(); } } catch(_) {}
            try { window.close(); } catch(_) {}
        }, 900);
    }

    // Function to test if bearer token is still valid
    async function testTokenValidity(token) {
        try {
            debugLog('Testing token validity...');
            // Use a future date for testing (next week)
            const testDate = new Date();
            testDate.setDate(testDate.getDate() + 7); // 7 days from now
            const isoDate = testDate.toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z');

            debugLog('Test date for token validation:', isoDate);

            const response = await fetch(`https://otm.tahospital.vn/api/booking?date=${isoDate}`, {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                    "authorization": `Bearer ${token}`,
                    "if-none-match": "W/\"3de9d-aNgxHg6vKhdB2PNct3jxHFKkaaU\"",
                    "logintype": "2",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "siteid": "1"
                },
                method: "GET",
                mode: "cors",
                credentials: "include"
            });

            debugLog('Token validation response status:', response.status);
            debugLog('Token validation response ok:', response.ok);

            if (!response.ok) {
                debugLog('Token validation failed - response not ok');
                return false;
            }

            // Try to parse the response
            const data = await response.json();
            debugLog('Token validation response data:', data);

            return true;
        } catch (error) {
            debugLog('Token validity test failed with error:', error);
            debugLog('Error details:', error.message);
            return false;
        }
    }

    // Check if we should run automation - read from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const otmFetchParam = urlParams.get('otm-fetch');
    const otmFetchUsers = urlParams.has('otm-fetch-users') || urlParams.get('otm-fetch-users') === '1' || urlParams.get('otm-fetch') === 'users';
    const otmTokenParam = urlParams.get('otm-token'); // New parameter for token-only extraction
    // Date range for fetching (filled from URL or defaulted later)
    let fromDate = null;
    let toDate = null;
    // Correlation id for messages back to parent
    let requestId = null;
    
    console.log('[OTM Debug] URL params check - otmFetchParam:', !!otmFetchParam, 'otmTokenParam:', !!otmTokenParam);
    
    // Handle token-only extraction requests
    if (otmTokenParam) {
        console.log('[OTM Debug] Token extraction request detected');
        setTimeout(() => {
            checkExistingTokenForExtraction();
        }, 0);
    } else {
        // Always check existing token first for normal operations
        console.log('[OTM Debug] Will check existing token first');
        debugLog('Checking for existing token...');
        // Schedule immediately (next tick) to start as soon as possible
        setTimeout(() => {
            console.log('[OTM Debug] Calling checkExistingToken ASAP');
            checkExistingToken();
        }, 0);
    }

    // Function to check existing token and start appropriate flow
    async function checkExistingToken() {
        let savedToken = await getSavedBearerTokenAsync();
        console.log('[OTM Debug] Checking existing token...');
        if (savedToken) {
            console.log('[OTM Debug] Found saved token, using it immediately');
            sendMessageToParent('progress', { step: 'token_found', message: 'Đã có token OTM, bắt đầu lấy dữ liệu...' });
            // Ensure global bearerToken is set so fetchSurgeryData can use it immediately
            try { bearerToken = savedToken; } catch(_) {}
            // Skip pre-validation to save time; fetch will detect 401/403 and fallback
            if (otmFetchUsers) {
                try {
                    await fetchOTMUsers();
                    return;
                } catch (error) {
                    console.error('Failed to fetch OTM users with saved token:', error);
                    sendMessageToParent('error', { message: 'Lỗi khi lấy danh sách OTM: ' + error.message });
                    closeTab();
                    return;
                }
            } else if (otmFetchParam) {
                try {
                    const data = JSON.parse(decodeURIComponent(otmFetchParam));
                    fromDate = data.fromDate;
                    toDate = data.toDate;
                    const preferToken = !!data.preferToken;
                    console.log('Starting direct API fetch for dates:', fromDate, 'to', toDate);
                    if (preferToken) {
                        // With preferToken, strictly avoid automation when token is present
                        await fetchSurgeryData(fromDate, toDate);
                        return;
                    }
                    await fetchSurgeryData(fromDate, toDate);
                    return;
                } catch (error) {
                    console.error('Failed to parse OTM fetch data from URL:', error);
                    sendMessageToParent('error', { message: 'Lỗi khi phân tích dữ liệu URL: ' + error.message });
                    closeTab();
                    return;
                }
            } else {
                // Default to today
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                fromDate = `${yyyy}-${mm}-${dd}`;
                toDate = fromDate;
                console.log('[OTM Debug] No URL param; defaulting to today and fetching:', fromDate);
                await fetchSurgeryData(fromDate, toDate);
                return;
            }
        } else {
            console.log('[OTM Debug] No saved token found');
            debugLog('No saved token found, starting automation');
            // Grace period: retry a few times to read GM/local storage in case it's not hydrated yet
            let tries = 0;
            while (!savedToken && tries < 5) {
                await new Promise(r => setTimeout(r, 250));
                tries++;
                savedToken = await getSavedBearerTokenAsync();
            }
            if (savedToken) {
                try { bearerToken = savedToken; } catch(_) {}
                sendMessageToParent('progress', { step: 'token_found', message: 'Đã có token OTM, bắt đầu lấy dữ liệu...' });
                if (otmFetchUsers) { await fetchOTMUsers(); return; }
                if (otmFetchParam) {
                    try {
                        const data = JSON.parse(decodeURIComponent(otmFetchParam));
                        fromDate = data.fromDate; toDate = data.toDate;
                        await fetchSurgeryData(fromDate, toDate);
                        return;
                    } catch (e) {
                        sendMessageToParent('error', { message: 'Lỗi khi phân tích dữ liệu URL: ' + e.message });
                        closeTab(); return;
                    }
                }
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                fromDate = `${yyyy}-${mm}-${dd}`; toDate = fromDate;
                await fetchSurgeryData(fromDate, toDate);
                return;
            }
            sendMessageToParent('progress', { step: 'no_token', message: 'Không tìm thấy token OTM đã lưu, bắt đầu tự động hóa...' });
        }

    // Start automation to get new token (either invalid token or no token)
    if (otmFetchParam) {
            // Parse the fetch parameters
            try {
                const data = JSON.parse(decodeURIComponent(otmFetchParam));
                fromDate = data.fromDate;
                toDate = data.toDate;
                console.log('Starting OTM automation for dates:', fromDate, 'to', toDate);
            } catch (error) {
                console.error('Failed to parse OTM fetch data from URL:', error);
                sendMessageToParent('error', { message: 'Lỗi khi phân tích dữ liệu URL: ' + error.message });
                closeTab();
                return;
            }
        }
        startAutomation();
    }

    // Function specifically for token extraction requests
    async function checkExistingTokenForExtraction() {
        console.log('[OTM Debug] Starting token extraction flow...');
        
        // Check for existing token first
        let savedToken = await getSavedBearerTokenAsync();
        
        if (savedToken && isLikelyValidToken(savedToken)) {
            console.log('[OTM Debug] Found valid saved token, returning it');
            debugLog('Token extraction: using saved token');
            bearerToken = savedToken;
            
            // Validate the token to make sure it's still working
            const isValid = await testTokenValidity(savedToken);
            if (isValid) {
                console.log('[OTM Debug] Token validation passed, sending to parent');
                sendMessageToParent('token_success', {
                    token: savedToken,
                    expiry: Date.now() + (24 * 60 * 60 * 1000), // Default 24h expiry
                    source: 'saved_token'
                });
                closeTab();
                return;
            } else {
                console.log('[OTM Debug] Saved token is invalid, need to get fresh one');
                debugLog('Token extraction: saved token invalid, starting automation');
            }
        } else {
            console.log('[OTM Debug] No valid saved token found');
            debugLog('Token extraction: no saved token, starting automation');
        }

        // No valid token available, start automation to get a fresh one
        sendMessageToParent('progress', { step: 'token_automation', message: 'Bắt đầu tự động hóa để lấy token mới...' });
        startAutomationForTokenExtraction();
    }

    // Modified automation specifically for token extraction
    async function startAutomationForTokenExtraction() {
        try {
            debugLog('=== STARTING TOKEN EXTRACTION AUTOMATION ===');
            sendMessageToParent('progress', { step: 'start', message: 'Bắt đầu tự động hóa để lấy token OTM...' });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 500));
            sendMessageToParent('progress', { step: 'page_loaded', message: 'Trang OTM đã tải xong' });

            // Step 1: Find and hover over "Quản lý Phẫu thuật"
            debugLog('Looking for "Quản lý Phẫu thuật" menu for token extraction...');
            sendMessageToParent('progress', { step: 'finding_menu', message: 'Đang tìm menu "Quản lý Phẫu thuật"...' });
            const quanLyPhauThuatElement = await waitForElement('p', 'Quản lý Phẫu thuật', 8000);

            if (!quanLyPhauThuatElement) {
                debugLog('Token extraction: Cannot find "Quản lý Phẫu thuật" menu');
                sendMessageToParent('token_error', { message: 'Không tìm thấy menu "Quản lý Phẫu thuật". Có thể tài khoản không có quyền truy cập.' });
                closeTab();
                return;
            }

            debugLog('Token extraction: Found menu, triggering mouseover...');
            sendMessageToParent('progress', { step: 'menu_found', message: 'Đã tìm thấy menu, đang mở submenu...' });

            // Step 2: Trigger mouseover to show submenu
            triggerMouseEvent(quanLyPhauThuatElement, 'mouseover');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Find and click submenu
            debugLog('Token extraction: Looking for submenu...');
            sendMessageToParent('progress', { step: 'finding_submenu', message: 'Đang tìm submenu "Đặt hẹn Lịch mổ"...' });

            let datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn Lịch mổ', 800);
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn Lịch mổ', 800);
            }
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn', 900);
            }
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn', 900);
            }

            if (datHenLichMoElement) {
                debugLog('Token extraction: Found submenu, clicking...');
                sendMessageToParent('progress', { step: 'submenu_found', message: 'Đã tìm thấy submenu, đang chuyển trang...' });
                datHenLichMoElement.click();

                // Wait for the page to load and token to be captured
                await new Promise(resolve => setTimeout(resolve, 2000));
                sendMessageToParent('progress', { step: 'token_wait', message: 'Đang chờ token được tạo...' });

                // Wait for token to be captured by our interceptors
                let attempts = 0;
                while (!bearerToken && attempts < 15) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                    debugLog(`Token extraction: waiting for token... (attempt ${attempts}/15)`);
                }

                if (bearerToken && isLikelyValidToken(bearerToken)) {
                    console.log('[OTM Debug] Token captured successfully during extraction');
                    debugLog('Token extraction: success, token captured');
                    sendMessageToParent('token_success', {
                        token: bearerToken,
                        expiry: Date.now() + (24 * 60 * 60 * 1000), // Default 24h expiry
                        source: 'fresh_automation'
                    });
                } else {
                    console.log('[OTM Debug] Token extraction failed - no token captured');
                    debugLog('Token extraction: failed, no token captured');
                    sendMessageToParent('token_error', { message: 'Không thể lấy token sau khi tự động hóa' });
                }
            } else {
                debugLog('Token extraction: submenu not found');
                sendMessageToParent('token_error', { message: 'Không tìm thấy submenu "Đặt hẹn Lịch mổ"' });
            }
        } catch (error) {
            console.error('Token extraction automation error:', error);
            sendMessageToParent('token_error', { message: 'Lỗi trong quá trình tự động hóa token: ' + error.message });
        } finally {
            closeTab();
        }
    }

    // Intercept fetch to capture Bearer token
    let bearerToken = null; // Will be set by checkExistingToken or interceptors
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        if (options && options.headers) {
            // Check for Authorization header
            const getHeaderVal = (h) => {
                try {
                    if (!h) return null;
                    // Headers object vs plain object
                    if (typeof h.get === 'function') {
                        return h.get('Authorization') || h.get('authorization') || null;
                    }
                    return h.Authorization || h.authorization || null;
                } catch { return null; }
            };
            const authHeader = getHeaderVal(options.headers);
            if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                const newToken = authHeader.substring(7);
                if (isLikelyValidToken(newToken) && newToken !== bearerToken) {
                    bearerToken = newToken;
                    saveBearerToken(bearerToken);
                    debugLog('Captured Bearer token from fetch headers');
                }
            }
        }
        return originalFetch.apply(this, args);
    };

    // Also intercept XMLHttpRequest for token capture
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this.addEventListener('loadstart', function() {
            try {
                const authHeader = this._headers && (this._headers.Authorization || this._headers.authorization);
                if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                    const newToken = authHeader.substring(7);
                    if (isLikelyValidToken(newToken) && newToken !== bearerToken) {
                        bearerToken = newToken;
                        saveBearerToken(bearerToken);
                        debugLog('Captured Bearer token from XMLHttpRequest');
                    }
                }
            } catch(_) {}
        });
        return originalOpen.apply(this, [method, url, ...args]);
    };

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (!this._headers) this._headers = {};
        this._headers[header] = value;
        try {
            if ((header === 'Authorization' || header === 'authorization') && typeof value === 'string' && value.startsWith('Bearer ')) {
                const newToken = value.substring(7);
                if (isLikelyValidToken(newToken) && newToken !== bearerToken) {
                    bearerToken = newToken;
                    saveBearerToken(bearerToken);
                    debugLog('Captured Bearer token from XMLHttpRequest setRequestHeader');
                }
            }
        } catch(_) {}
        return originalSetRequestHeader.apply(this, [header, value]);
    };

    // Utility functions
    function findElementByText(tagName, textContent) {
        const elements = document.querySelectorAll(tagName);
        for (const element of elements) {
            const elementText = element.textContent.trim();
            // Try exact match first
            if (elementText === textContent.trim()) {
                return element;
            }
            // Try case-insensitive match
            if (elementText.toLowerCase() === textContent.trim().toLowerCase()) {
                return element;
            }
            // Try partial match
            if (elementText.includes(textContent.trim())) {
                return element;
            }
            // Try partial case-insensitive match
            if (elementText.toLowerCase().includes(textContent.trim().toLowerCase())) {
                return element;
            }
        }
        return null;
    }

    function triggerMouseEvent(element, eventType) {
        const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    function waitForElement(tagName, textContent, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = findElementByText(tagName, textContent);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    resolve(null);
                }
            }, 500);
        });
    }

    // Transform raw surgery records into a lean structure required by the main UI
    function filterSurgeryData(records) {
        if (!Array.isArray(records)) return [];
        const result = [];
        for (const r of records) {
            const customerPid = r?.customer?.pid ?? r?.customer?.code ?? null;
            const operatingRoom = r?.operating_room ?? r?.room?.name ?? null;
            const item = {
                customer: {
                    fullname: r?.customer?.fullname ?? null,
                    pid: customerPid,
                    dob: r?.customer?.dob ?? null,
                },
                diagnose: r?.diagnose ?? null,
                surgerymethod: r?.surgerymethod ?? null,
                start: r?.start ?? null,
                end: r?.end ?? null,
                // Optional treatment info
                khoaLuuTri: r?.khoaLuuTri ?? null,
                khoaDieuTri: r?.khoaDieuTri ?? null,
                phongDieuTri: r?.phongDieuTri ?? null,
                giuongDieuTri: r?.giuongDieuTri ?? null,
                // Operating room name only
                operating_room: operatingRoom,
                status: r?.status ?? null,
                // Surgeons
                userexec: Array.isArray(r?.userexec)
                    ? r.userexec.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
                    : [],
                userassistant: Array.isArray(r?.userassistant)
                    ? r.userassistant.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
                    : [],
            };
            result.push(item);
        }
        return result;
    }

    // Main automation function
    async function startAutomation() {
        try {
            debugLog('=== STARTING OTM AUTOMATION ===');
            sendMessageToParent('progress', { step: 'start', message: 'Bắt đầu tự động hóa OTM...' });

            // Wait for page to load (reduced)
            await new Promise(resolve => setTimeout(resolve, 500));
            sendMessageToParent('progress', { step: 'page_loaded', message: 'Trang OTM đã tải xong' });

            // Step 1: Find and hover over "Quản lý Phẫu thuật"
            debugLog('Looking for "Quản lý Phẫu thuật" menu...');
            sendMessageToParent('progress', { step: 'finding_menu', message: 'Đang tìm menu "Quản lý Phẫu thuật"...' });
            const quanLyPhauThuatElement = await waitForElement('p', 'Quản lý Phẫu thuật', 8000);

            if (!quanLyPhauThuatElement) {
                debugLog('Không tìm thấy phần tử "Quản lý Phẫu thuật". Có thể account không có quyền truy cập.');
                sendMessageToParent('error', { message: 'Không tìm thấy menu "Quản lý Phẫu thuật". Có thể tài khoản không có quyền truy cập.' });
                closeTab();
                return;
            }

            debugLog('Tìm thấy "Quản lý Phẫu thuật", kích hoạt mouseover...');
            sendMessageToParent('progress', { step: 'menu_found', message: 'Đã tìm thấy menu, đang mở submenu...' });

            // Step 2: Trigger mouseover to show submenu
            triggerMouseEvent(quanLyPhauThuatElement, 'mouseover');

            // Wait a bit for submenu to appear (reduced from 1000ms)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Try different selectors for submenu (reduced timeouts)
            debugLog('Tìm submenu "Đặt hẹn Lịch mổ"...');
            sendMessageToParent('progress', { step: 'finding_submenu', message: 'Đang tìm submenu "Đặt hẹn Lịch mổ"...' });

            let datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn Lịch mổ', 800);
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn Lịch mổ', 800);
            }
            if (!datHenLichMoElement) {
                // Try partial text match
                datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn', 900);
            }
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn', 900);
            }
            if (!datHenLichMoElement) {
                // Last resort: search all clickable elements
                const allClickable = document.querySelectorAll('button, a, [role="button"], [onclick]');
                for (const el of allClickable) {
                    if (el.textContent && el.textContent.toLowerCase().includes('đặt hẹn')) {
                        datHenLichMoElement = el;
                        debugLog('Found via clickable elements search:', el.textContent.trim());
                        break;
                    }
                }
            }

            // Debug: Log all possible elements
            console.log('Debug: Tất cả elements h6:', Array.from(document.querySelectorAll('h6')).map(el => el.textContent.trim()));
            console.log('Debug: Tất cả elements p:', Array.from(document.querySelectorAll('p')).map(el => el.textContent.trim()));

            if (datHenLichMoElement) {
                debugLog('Tìm thấy "Đặt hẹn Lịch mổ", click...');
                sendMessageToParent('progress', { step: 'submenu_found', message: 'Đã tìm thấy submenu, đang chuyển trang...' });
                datHenLichMoElement.click();

                // Wait for the surgery scheduling page to load
                await new Promise(resolve => setTimeout(resolve, 1000));
                sendMessageToParent('progress', { step: 'page_ready', message: 'Trang đặt lịch đã sẵn sàng' });

                // Now we can fetch the surgery data if date range is available
                if (otmFetchUsers) {
                    await fetchOTMUsers();
                } else if (fromDate && toDate) {
                    await fetchSurgeryData(fromDate, toDate);
                } else {
                    debugLog('No date range provided; token should be captured by now. Closing tab.');
                    sendMessageToParent('progress', { step: 'token_ready', message: 'Token đã sẵn sàng' });
                    closeTab();
                }

            } else {
                debugLog('Không tìm thấy submenu "Đặt hẹn Lịch mổ"');
                debugLog('Debug: Current URL:', window.location.href);
                debugLog('Debug: Page title:', document.title);
                sendMessageToParent('error', { message: 'Không tìm thấy submenu "Đặt hẹn Lịch mổ"' });
                closeTab();
            }

        } catch (error) {
            console.error('Lỗi trong quá trình automation:', error);
            sendMessageToParent('error', { message: 'Lỗi trong quá trình tự động hóa: ' + error.message });
            closeTab();
        }
    }

    // Fetch OTM users list and return to parent
    async function fetchOTMUsers() {
        try {
            sendMessageToParent('progress', { step: 'token_wait', message: 'Đang chờ token xác thực...' });
            let attempts = 0;
            while (!bearerToken && attempts < 10) {
                await new Promise(r => setTimeout(r, 1000));
                attempts++;
            }
            if (!bearerToken) {
                sendMessageToParent('error', { message: 'Không thể lấy token xác thực sau 10 lần thử' });
                closeTab();
                return;
            }

            const query = 'ishsoft=null&page=1&limit=10000';
            const url = `https://otm.tahospital.vn/api/user?${query}&_=${Date.now()}`;
            debugLog('Fetching OTM users:', url);
            debugLog('Using Bearer token (prefix):', (bearerToken || '').slice(0, 12) + '...');

            const res = await fetch(url, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    'authorization': `Bearer ${bearerToken}`,
                    'logintype': '2',
                    'priority': 'u=1, i',
                    'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'siteid': '1'
                },
                referrer: 'https://otm.tahospital.vn/surgery/booking',
                body: null,
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                credentials: 'include'
            });

            debugLog('Users fetch status:', res.status, 'ok:', res.ok);
            debugLog('Users fetch headers etag:', res.headers && res.headers.get ? res.headers.get('etag') : undefined);
            let effectiveRes = res;
            if (res.status === 304) {
                // Retry once without caches using a cache-busting param
                debugLog('Received 304 for OTM users. Retrying with cache-busting...');
                const bustUrl = `${url}&_=${Date.now()}`;
                const retry = await fetch(bustUrl, {
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                        'authorization': `Bearer ${bearerToken}`,
                        'logintype': '2',
                        'siteid': '1'
                    },
                    referrer: 'https://otm.tahospital.vn/surgery/booking',
                    body: null,
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-store',
                    credentials: 'include'
                });
                effectiveRes = retry;
                debugLog('Retry users fetch status:', effectiveRes.status, 'ok:', effectiveRes.ok);
            }

            if (!effectiveRes.ok) {
                if (effectiveRes.status === 401 || effectiveRes.status === 403) {
                    sendMessageToParent('progress', { step: 'token_invalid', message: 'Token hết hạn, chuyển sang tự động hóa để lấy token mới...' });
                    startAutomation();
                    return;
                }
                throw new Error('HTTP ' + effectiveRes.status);
            }
            let json;
            try {
                json = await effectiveRes.json();
            } catch (parseErr) {
                debugLog('Users JSON parse error:', parseErr);
                try {
                    const txt = await effectiveRes.clone().text();
                    debugLog('Users raw text (first 300 chars):', (txt || '').slice(0, 300));
                } catch {}
                throw parseErr;
            }

            const keys = json && typeof json === 'object' ? Object.keys(json) : [];
            debugLog('Users response type:', Array.isArray(json) ? 'array' : typeof json, 'keys:', keys);

            function pickArrayPayload(obj) {
                if (Array.isArray(obj)) return { arr: obj, via: 'root' };
                if (!obj || typeof obj !== 'object') return { arr: [], via: 'none' };
                const candidates = ['data', 'items', 'result', 'rows', 'content', 'users', 'records', 'list'];
                for (const k of candidates) {
                    const v = obj[k];
                    if (Array.isArray(v)) return { arr: v, via: k };
                    if (v && typeof v === 'object') {
                        for (const kk of candidates) {
                            const v2 = v[kk];
                            if (Array.isArray(v2)) return { arr: v2, via: `${k}.${kk}` };
                        }
                    }
                }
                return { arr: [], via: 'not_found' };
            }

            const { arr: usersArray, via } = pickArrayPayload(json);
            debugLog('Users array source:', via, 'length:', usersArray.length || 0);
            let users = (usersArray || []).map(u => ({ id: u.id ?? u.taid ?? u.userid ?? u.userId ?? null, fullname: u.fullname || u.fullName || u.name || '' }));

            if ((users?.length || 0) === 0) {
                // Extra diagnostics for empty payloads
                debugLog('Empty users after parse. Sample payload snapshot:', JSON.stringify(json).slice(0, 400));
                sendMessageToParent('progress', { step: 'users_empty', via, keys, hint: 'Parsed 0 users from payload', url });

                // Optional fallback: drop ishsoft param if enabled
                if (localStorage.getItem('dr_otm_users_alt') === 'drop_ishsoft') {
                    const altUrl = 'https://otm.tahospital.vn/api/user?page=1&limit=10000&_=' + Date.now();
                    debugLog('Fallback fetch without ishsoft:', altUrl);
                    sendMessageToParent('progress', { step: 'users_alt_fetch', message: 'Thử lại không có ishsoft', altUrl });
                    const altRes = await fetch(altUrl, {
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                            'authorization': `Bearer ${bearerToken}`,
                            'logintype': '2',
                            'priority': 'u=1, i',
                            'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': '"Windows"',
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'same-origin',
                            'siteid': '1'
                        },
                        referrer: 'https://otm.tahospital.vn/surgery/booking',
                        body: null,
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-store',
                        credentials: 'include'
                    });
                    if (altRes.ok) {
                        let altJson;
                        try { altJson = await altRes.json(); } catch {}
                        const altKeys = altJson && typeof altJson === 'object' ? Object.keys(altJson) : [];
                        const pickAlt = pickArrayPayload(altJson);
                        debugLog('Alt users array source:', pickAlt.via, 'length:', (pickAlt.arr || []).length || 0, 'keys:', altKeys);
                        users = (pickAlt.arr || []).map(u => ({ id: u.id ?? u.taid ?? u.userid ?? u.userId ?? null, fullname: u.fullname || u.fullName || u.name || '' }));
                        sendMessageToParent('progress', { step: 'users_alt_parsed', count: users.length, via: pickAlt.via });
                    } else {
                        debugLog('Alt users fetch failed:', altRes.status);
                        sendMessageToParent('progress', { step: 'users_alt_failed', status: altRes.status });
                    }
                }
            }

            // Emit a parse summary to parent for debugging
            const sample = (users || []).slice(0, 3).map(u => u.fullname);
            sendMessageToParent('progress', { step: 'users_parsed', count: users.length, via, sample });

            sendMessageToParent('success', {
                otmUsers: users,
                count: users.length,
                summary: `Đã tải ${users.length} người dùng từ OTM`
            });
            closeTab();
        } catch (e) {
            sendMessageToParent('error', { message: 'Lỗi khi lấy DS người dùng OTM: ' + (e.message || e) });
            closeTab();
        }
    }

    // Function to fetch surgery data for a date range
    async function fetchSurgeryData(fromDate, toDate) {
        try {
            debugLog('=== STARTING SURGERY DATA FETCH ===');
            // Keep original requested range for reporting
            const requestedFrom = fromDate;
            const requestedTo = toDate;
            debugLog('Requested range:', requestedFrom, 'to', requestedTo);

            // Send progress update to parent
            sendMessageToParent('progress', { step: 'token_wait', message: 'Đang chờ token xác thực...' });

            // Wait for token if not available yet
            let attempts = 0;
            while (!bearerToken && attempts < 10) {
                debugLog(`Waiting for Bearer token... (attempt ${attempts + 1}/10)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            if (!bearerToken) {
                debugLog('No Bearer token captured after 10 attempts');
                sendMessageToParent('error', { message: 'Không thể lấy token xác thực sau 10 lần thử' });
                closeTab();
                return;
            }

            debugLog('Bearer token available:', bearerToken.substring(0, 20) + '...');
            sendMessageToParent('progress', { step: 'token_ready', message: 'Token đã sẵn sàng, đang lấy dữ liệu...' });

            // Generate array of dates from requestedFrom to requestedTo (inclusive)
            function toDateOnly(dateStr) {
                // Always treat as date-only without timezone shifting
                const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
                return new Date(Date.UTC(y, (m - 1), d)); // UTC midnight for stability
            }
            const dates = [];
            const startDate = toDateOnly(requestedFrom);
            const endDate = toDateOnly(requestedTo);
            const cur = new Date(startDate.getTime());
            while (cur.getTime() <= endDate.getTime()) {
                const y = cur.getUTCFullYear();
                const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
                const d = String(cur.getUTCDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${d}`);
                cur.setUTCDate(cur.getUTCDate() + 1);
            }

            debugLog('Dates to fetch:', dates);

            const allSurgeryData = [];
            let totalSurgeries = 0;

            const getConcurrencyLimit = () => {
                const raw = localStorage.getItem('dr_otm_concurrency');
                const n = parseInt(raw ?? '3', 10);
                return isNaN(n) ? 3 : Math.min(Math.max(n, 1), 6);
            };

            async function fetchDateData(currentDate) {
                sendMessageToParent('progress', {
                    step: 'api_call',
                    message: `Đang gọi API cho ngày ${currentDate}...`
                });

                // Convert local Vietnam midnight (UTC+07:00) to exact Z time for API
                // e.g., '2025-09-07T00:00:00+07:00' -> '2025-09-06T17:00:00.000Z'
                const isoDate = new Date(`${currentDate}T00:00:00+07:00`).toISOString();

                debugLog(`Fetching data for date: ${currentDate} (ISO: ${isoDate})`);
                sendMessageToParent('progress', { step: 'api_call', message: `GET /api/booking?date=${isoDate}`, currentDate, isoDate });

                let response = await fetch(`https://otm.tahospital.vn/api/booking?date=${isoDate}`, {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "authorization": `Bearer ${bearerToken}`,
                        "logintype": "2",
                        "priority": "u=1, i",
                        "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "siteid": "1"
                    },
                    referrer: "https://otm.tahospital.vn/surgery/booking",
                    body: null,
                    method: "GET",
                    mode: "cors",
                    cache: "no-store",
                    credentials: "include"
                });
                if (response.status === 304) {
                    debugLog(`Received 304 for ${currentDate}. Retrying with cache-busting...`);
                    const retryUrl = `https://otm.tahospital.vn/api/booking?date=${isoDate}&_=${Date.now()}`;
                    response = await fetch(retryUrl, {
                        headers: {
                            "accept": "application/json, text/plain, */*",
                            "authorization": `Bearer ${bearerToken}`,
                            "logintype": "2",
                            "siteid": "1"
                        },
                        referrer: "https://otm.tahospital.vn/surgery/booking",
                        body: null,
                        method: "GET",
                        mode: "cors",
                        cache: "no-store",
                        credentials: "include"
                    });
                }

                if (!response.ok) {
                    debugLog(`HTTP error for ${currentDate}: ${response.status}`);
                    if (response.status === 401 || response.status === 403) {
                        const err = new Error('Unauthorized');
                        err.__unauthorized = true;
                        throw err;
                    }
                    return { surgeriesWithDate: [], count: 0 };
                }
                let data;
                try { data = await response.json(); }
                catch (parseErr) {
                    debugLog('Booking JSON parse error:', parseErr);
                    try { const raw = await response.clone().text(); debugLog('Booking raw (first 300):', (raw||'').slice(0,300)); } catch {}
                    return { surgeriesWithDate: [], count: 0 };
                }
                debugLog(`Surgery data received for ${currentDate}:`, data);
                if (!Array.isArray(data) || data.length === 0) return { surgeriesWithDate: [], count: 0 };

                const surgeriesWithDate = data.map(surgery => ({ ...surgery, fetchDate: currentDate }));
                debugLog(`Full surgery data for ${currentDate}:`, data);
                return { surgeriesWithDate, count: data.length };
            }

            const concurrency = getConcurrencyLimit();
            let unauthorizedDetected = false;
            for (let i = 0; i < dates.length; i += concurrency) {
                const batch = dates.slice(i, i + concurrency);
                const results = await Promise.allSettled(batch.map(d => fetchDateData(d)));

                for (const res of results) {
                    if (res.status === 'rejected') {
                        if (res.reason && res.reason.__unauthorized) {
                            unauthorizedDetected = true;
                            break;
                        } else {
                            debugLog('Batch fetch error:', res.reason);
                        }
                    } else if (res.value) {
                        const { surgeriesWithDate, count } = res.value;
                        if (count > 0) {
                            totalSurgeries += count;
                            allSurgeryData.push(...surgeriesWithDate);
                        }
                    }
                }

                if (unauthorizedDetected) {
                    sendMessageToParent('progress', { step: 'token_invalid', message: 'Token hết hạn, chuyển sang tự động hóa để lấy token mới...' });
                    startAutomation();
                    return;
                }

                // Small delay between batches to avoid rate limiting
                if (i + concurrency < dates.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            sendMessageToParent('progress', { step: 'data_received', message: 'Đã nhận dữ liệu từ API', days: dates.length, totalCandidate: allSurgeryData.length });

            // Send success data to parent with all collected data (raw + filtered)
            const filteredSurgeryData = filterSurgeryData(allSurgeryData);
            if (filteredSurgeryData.length > 0) {
                const message = `Tìm thấy tổng cộng ${totalSurgeries} ca mổ từ ${requestedFrom} đến ${requestedTo}:\n\n` +
                    allSurgeryData.map((item, index) => 
                        `${index + 1}. ${item.customer?.fullname || 'N/A'} - ${item.surgerymethod || 'N/A'} (${item.fetchDate})`
                    ).join('\n');

                sendMessageToParent('success', {
                    surgeryData: filteredSurgeryData,
                    surgeryDataRaw: allSurgeryData,
                    count: filteredSurgeryData.length,
                    dateRange: { from: requestedFrom, to: requestedTo },
                    summary: message
                });

                debugLog('=== SURGERY DATA FETCH COMPLETED SUCCESSFULLY ===');
                debugLog(`Total surgeries found (filtered): ${filteredSurgeryData.length}`);
            } else {
                sendMessageToParent('success', {
                    surgeryData: [],
                    surgeryDataRaw: allSurgeryData,
                    count: 0,
                    dateRange: { from: requestedFrom, to: requestedTo },
                    summary: `Không tìm thấy dữ liệu mổ từ ${requestedFrom} đến ${requestedTo}`
                });
            }

            // Small delay to let storage events propagate before closing
            setTimeout(() => { try { closeTab(); } catch(_) {} }, 350);

        } catch (error) {
            debugLog('Error fetching surgery data:', error);
            debugLog('Lỗi khi lấy dữ liệu mổ: ' + error.message);
            sendMessageToParent('error', {
                message: 'Lỗi khi lấy dữ liệu mổ: ' + error.message,
                error: error.toString()
            });
            setTimeout(() => { try { closeTab(); } catch(_) {} }, 350);
        }
    }

    // Start automation when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // checkExistingToken() is already called at the top
        });
    } else {
        // checkExistingToken() is already called at the top
    }

})();
