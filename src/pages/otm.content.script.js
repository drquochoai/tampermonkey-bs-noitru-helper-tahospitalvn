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

    // Function to save bearer token to localStorage
    function saveBearerToken(token) {
        try {
            localStorage.setItem('otm_bearer_token', token);
            debugLog('Bearer token saved to localStorage');
        } catch (error) {
            debugLog('Error saving bearer token:', error);
        }
    }

    // Function to get bearer token from localStorage
    function getSavedBearerToken() {
        try {
            const token = localStorage.getItem('otm_bearer_token');
            if (token) {
                debugLog('Found saved bearer token');
                return token;
            }
        } catch (error) {
            debugLog('Error getting saved bearer token:', error);
        }
        return null;
    }

    // Function to send message to parent using GM storage
    function sendMessageToParent(type, data) {
        debugLog('Sending message to parent via GM storage:', type, data);
        try {
            const key = `otm_${type}`;
            const value = JSON.stringify({
                data: data,
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

    // Function to close this tab
    function closeTab() {
        debugLog('Requesting parent to close OTM tab');
        try {
            // Send message to parent to close this tab
            sendMessageToParent('close_tab', {
                message: 'Please close the OTM tab',
                reason: 'Automation completed'
            });
        } catch (error) {
            debugLog('Error requesting tab close:', error);
        }
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
    // Date range for fetching (filled from URL or defaulted later)
    let fromDate = null;
    let toDate = null;
    
    console.log('[OTM Debug] URL params check - otmFetchParam:', !!otmFetchParam);
    
    // Always check existing token first
    console.log('[OTM Debug] Will check existing token first');
    debugLog('Checking for existing token...');
    // Schedule immediately (next tick) to start as soon as possible
    setTimeout(() => {
        console.log('[OTM Debug] Calling checkExistingToken ASAP');
        checkExistingToken();
    }, 0);

    // Function to check existing token and start appropriate flow
    async function checkExistingToken() {
        const savedToken = getSavedBearerToken();
        console.log('[OTM Debug] Checking existing token...');
        if (savedToken) {
            console.log('[OTM Debug] Found saved token, using it immediately');
            sendMessageToParent('progress', { step: 'token_found', message: 'Đã có token OTM, bắt đầu lấy dữ liệu...' });
            // Skip pre-validation to save time; fetch will detect 401/403 and fallback
            if (otmFetchParam) {
                try {
                    const data = JSON.parse(decodeURIComponent(otmFetchParam));
                    fromDate = data.fromDate;
                    toDate = data.toDate;
                    console.log('Starting direct API fetch for dates:', fromDate, 'to', toDate);
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

    // Intercept fetch to capture Bearer token
    let bearerToken = getSavedBearerToken(); // Try to load saved token first
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        if (options && options.headers) {
            // Check for Authorization header
            if (options.headers.Authorization) {
                const authHeader = options.headers.Authorization;
                if (authHeader.startsWith('Bearer ')) {
                    const newToken = authHeader.substring(7);
                    if (newToken !== bearerToken) {
                        bearerToken = newToken;
                        saveBearerToken(bearerToken);
                        debugLog('Captured new Bearer token from Authorization header');
                    }
                }
            }
            // Also check for lowercase authorization
            if (options.headers.authorization) {
                const authHeader = options.headers.authorization;
                if (authHeader.startsWith('Bearer ')) {
                    const newToken = authHeader.substring(7);
                    if (newToken !== bearerToken) {
                        bearerToken = newToken;
                        saveBearerToken(bearerToken);
                        debugLog('Captured new Bearer token from lowercase authorization header');
                    }
                }
            }
        }
        return originalFetch.apply(this, args);
    };

    // Also intercept XMLHttpRequest for token capture
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this.addEventListener('loadstart', function() {
            if (this._headers && this._headers.Authorization) {
                const authHeader = this._headers.Authorization;
                if (authHeader.startsWith('Bearer ')) {
                    const newToken = authHeader.substring(7);
                    if (newToken !== bearerToken) {
                        bearerToken = newToken;
                        saveBearerToken(bearerToken);
                        debugLog('Captured Bearer token from XMLHttpRequest');
                    }
                }
            }
        });
        return originalOpen.apply(this, [method, url, ...args]);
    };

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (!this._headers) this._headers = {};
        this._headers[header] = value;
        if (header === 'Authorization' && value.startsWith('Bearer ')) {
            const newToken = value.substring(7);
            if (newToken !== bearerToken) {
                bearerToken = newToken;
                saveBearerToken(bearerToken);
                debugLog('Captured Bearer token from XMLHttpRequest setRequestHeader');
            }
        }
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
            const item = {
                customer: {
                    fullname: r?.customer?.fullname ?? null,
                    pid: r?.customer?.code ?? null,
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
                operating_room: r?.room?.name ?? null,
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
                if (fromDate && toDate) {
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

    // Function to fetch surgery data for a date range
    async function fetchSurgeryData(fromDate, toDate) {
        try {
            debugLog('=== STARTING SURGERY DATA FETCH ===');
            // Keep original requested range for reporting
            const requestedFrom = fromDate;
            const requestedTo = toDate;

            // Adjust range: shift back 1 day for actual fetching
            const adjFrom = new Date(fromDate);
            adjFrom.setDate(adjFrom.getDate() - 2);
            const adjustedFromStr = adjFrom.toISOString().split('T')[0];

            const adjTo = new Date(toDate);
            adjTo.setDate(adjTo.getDate() - 2);
            const adjustedToStr = adjTo.toISOString().split('T')[0];

            debugLog('Requested range:', requestedFrom, 'to', requestedTo);
            debugLog('Adjusted (fetch) range:', adjustedFromStr, 'to', adjustedToStr);

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

            // Generate array of dates from adjustedFromStr to adjustedToStr
            const dates = [];
            const startDate = new Date(adjustedFromStr);
            const endDate = new Date(adjustedToStr);
            
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                dates.push(date.toISOString().split('T')[0]);
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

                // Convert date to ISO format with 17:00:00.000Z (next day at 00:00 Vietnam time)
                const dateObj = new Date(currentDate);
                dateObj.setDate(dateObj.getDate() + 1); // Next day
                const isoDate = dateObj.toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z');

                debugLog(`Fetching data for date: ${currentDate} (ISO: ${isoDate})`);

                const response = await fetch(`https://otm.tahospital.vn/api/booking?date=${isoDate}`, {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "authorization": `Bearer ${bearerToken}`,
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
                    referrer: "https://otm.tahospital.vn/surgery/booking",
                    body: null,
                    method: "GET",
                    mode: "cors",
                    credentials: "include"
                });

                if (!response.ok) {
                    debugLog(`HTTP error for ${currentDate}: ${response.status}`);
                    if (response.status === 401 || response.status === 403) {
                        const err = new Error('Unauthorized');
                        err.__unauthorized = true;
                        throw err;
                    }
                    return { surgeriesWithDate: [], count: 0 };
                }

                const data = await response.json();
                debugLog(`Surgery data received for ${currentDate}:`, data);
                if (!Array.isArray(data) || data.length === 0) return { surgeriesWithDate: [], count: 0 };

                const surgeriesWithDate = data.map(surgery => ({ ...surgery, fetchDate: currentDate }));
                console.log(`=== SURGERY DATA FOR ${currentDate} (FULL) ===`, data);
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

            sendMessageToParent('progress', { step: 'data_received', message: 'Đã nhận dữ liệu từ API' });

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

            closeTab();

        } catch (error) {
            debugLog('Error fetching surgery data:', error);
            debugLog('Lỗi khi lấy dữ liệu mổ: ' + error.message);
            sendMessageToParent('error', {
                message: 'Lỗi khi lấy dữ liệu mổ: ' + error.message,
                error: error.toString()
            });
            closeTab();
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
