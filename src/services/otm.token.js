// otm.token.js - OTM Token management service
// This service manages OTM authentication tokens and direct API access

const ApiService = require('./apiService');

// Special MABN identifier for OTM token storage
const OTM_TOKEN_MABN = '%9191_otm_token';

// In-memory token cache to avoid frequent API calls
let _tokenCache = {
    token: null,
    expiry: 0,
    lastValidated: 0
};

// Token validation interval (5 minutes)
const TOKEN_VALIDATION_INTERVAL = 5 * 60 * 1000;

const OTMTokenService = {
    /**
     * Check if a token appears to be valid (basic format validation)
     */
    _isLikelyValidToken(token) {
        try {
            if (typeof token !== 'string') return false;
            const t = token.trim();
            if (!t) return false;
            const low = t.toLowerCase();
            if (low === 'undefined' || low === 'null') return false;
            if (t.length < 16) return false; // heuristic: tokens are typically long
            // avoid whitespace in token
            if (/\s/.test(t)) return false;
            return true;
        } catch { 
            return false; 
        }
    },

    /**
     * Get stored OTM token from our API service
     */
    async getStoredToken() {
        try {
            // Use fixed dates as per requirement: tungay và denngay là 10/10/1010 10:10
            const tungay = '1010-10-10 10:10';
            const denngay = '1010-10-10 10:10';
            
            const formData = new FormData();
            formData.append('mabn', OTM_TOKEN_MABN);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);
            
            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            const result = await response.json();
            console.log('DEBUG - OTM Token retrieve API response:', result);
            
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                // Find the token record (similar to findChecklistObject)
                const tokenRecord = result.data.find(item => 
                    item.hoten && item.hoten.includes('OTM_TOKEN')
                );
                
                if (tokenRecord && tokenRecord.chuky) {
                    try {
                        const tokenData = JSON.parse(tokenRecord.chuky);
                        if (tokenData.token && this._isLikelyValidToken(tokenData.token)) {
                            console.log('DEBUG - Retrieved valid OTM token from storage');
                            return {
                                token: tokenData.token,
                                expiry: tokenData.expiry || 0,
                                checklistObj: tokenRecord
                            };
                        }
                    } catch (e) {
                        console.error('DEBUG - Error parsing stored token data:', e);
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('DEBUG - Error retrieving stored OTM token:', error);
            return null;
        }
    },

    /**
     * Save OTM token to our API service
     */
    async saveToken(token, expiry = null) {
        try {
            if (!this._isLikelyValidToken(token)) {
                console.error('DEBUG - Refusing to save invalid OTM token');
                return false;
            }

            // Calculate expiry if not provided (default: 24 hours from now)
            if (!expiry) {
                expiry = Date.now() + (24 * 60 * 60 * 1000);
            }

            const tokenData = {
                token: token,
                expiry: expiry,
                savedAt: Date.now()
            };

            // First, try to get existing record
            const existing = await this.getStoredToken();
            
            let checklistObj;
            if (existing && existing.checklistObj) {
                // Update existing record
                checklistObj = existing.checklistObj;
            } else {
                // Create new record structure with fixed dates: 10/10/1010 10:10
                const fixedDate = '1010-10-10';
                const fixedDateTime = '1010-10-10 10:10';
                checklistObj = {
                    mabn: OTM_TOKEN_MABN,
                    hoten: 'OTM_TOKEN_STORAGE',
                    ngaysinh: fixedDate,
                    gioitinh: '1',
                    diachi: 'SYSTEM_GENERATED',
                    ngayvv: fixedDate,
                    tungay: fixedDateTime,
                    denngay: fixedDateTime,
                    chuky: JSON.stringify(tokenData)
                };
            }

            // Update the token data
            checklistObj.chuky = JSON.stringify(tokenData);

            // Save using the same pattern as ChecklistService
            const result = await ApiService.updateChecklistData(checklistObj, tokenData);
            
            if (result && (result.Status == 1 || result.isValid)) {
                console.log('DEBUG - OTM token saved successfully');
                // Update in-memory cache
                _tokenCache = {
                    token: token,
                    expiry: expiry,
                    lastValidated: Date.now()
                };
                return true;
            } else {
                console.error('DEBUG - Failed to save OTM token:', result);
                return false;
            }
        } catch (error) {
            console.error('DEBUG - Error saving OTM token:', error);
            return false;
        }
    },

    /**
     * Test if a token is valid by making a test API call
     */
    async validateToken(token) {
        try {
            if (!this._isLikelyValidToken(token)) {
                return false;
            }

            // Use GM_xmlhttpRequest for cross-origin request if available
            return new Promise((resolve) => {
                const testUrl = `https://otm.tahospital.vn/api/booking/roomwithdepartment?_=${Date.now()}`;
                
                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: testUrl,
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'authorization': `Bearer ${token}`,
                            'logintype': '2',
                            'siteid': '1',
                            'cache-control': 'no-cache'
                        },
                        timeout: 10000,
                        onload: function(response) {
                            console.log('DEBUG - Token validation response:', response.status);
                            resolve(response.status >= 200 && response.status < 300);
                        },
                        onerror: function() {
                            console.log('DEBUG - Token validation failed - network error');
                            resolve(false);
                        },
                        ontimeout: function() {
                            console.log('DEBUG - Token validation timed out');
                            resolve(false);
                        }
                    });
                } else {
                    // Fallback - this might fail due to CORS, but try anyway
                    fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'authorization': `Bearer ${token}`,
                            'logintype': '2',
                            'siteid': '1'
                        },
                        mode: 'cors',
                        credentials: 'include'
                    })
                    .then(response => {
                        console.log('DEBUG - Token validation response (fetch):', response.status);
                        resolve(response.status >= 200 && response.status < 300);
                    })
                    .catch(() => {
                        console.log('DEBUG - Token validation failed (fetch)');
                        resolve(false);
                    });
                }
            });
        } catch (error) {
            console.error('DEBUG - Error validating token:', error);
            return false;
        }
    },

    /**
     * Get a valid OTM token - from cache, storage, or by opening OTM tab
     */
    async getValidToken() {
        const now = Date.now();
        
        // Check in-memory cache first
        if (_tokenCache.token && 
            _tokenCache.expiry > now && 
            (now - _tokenCache.lastValidated) < TOKEN_VALIDATION_INTERVAL) {
            console.log('DEBUG - Using cached OTM token');
            return _tokenCache.token;
        }

        // Try to get from storage
        const stored = await this.getStoredToken();
        if (stored && stored.token && stored.expiry > now) {
            // Validate the stored token
            const isValid = await this.validateToken(stored.token);
            if (isValid) {
                console.log('DEBUG - Using stored OTM token');
                _tokenCache = {
                    token: stored.token,
                    expiry: stored.expiry,
                    lastValidated: now
                };
                return stored.token;
            } else {
                console.log('DEBUG - Stored token is invalid, need to refresh');
            }
        }

        // Need to get a fresh token by opening OTM tab
        console.log('DEBUG - Need to open OTM tab to get fresh token');
        return await this._getTokenFromOTMTab();
    },

    /**
     * Open OTM tab to obtain a fresh token (based on existing openOTMSurgeriesTab pattern)
     */
    async _getTokenFromOTMTab() {
        return new Promise((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Token fetch timeout'));
                }
            }, 30000); // 30 second timeout

            // Subscribe to OTM messages (based on existing subscribeOTMMessages pattern)
            const unsubscribe = this._subscribeToTokenMessages(
                (tokenData) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        unsubscribe();
                        
                        if (tokenData && tokenData.token) {
                            console.log('DEBUG - Received token from OTM tab');
                            // Save the new token
                            this.saveToken(tokenData.token, tokenData.expiry);
                            resolve(tokenData.token);
                        } else {
                            reject(new Error('No token received from OTM tab'));
                        }
                    }
                },
                (error) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        unsubscribe();
                        reject(new Error(error || 'OTM token fetch failed'));
                    }
                }
            );

            // Open OTM tab with token fetch request
            const payload = encodeURIComponent(JSON.stringify({ 
                action: 'getToken',
                preferToken: true 
            }));
            const url = `https://otm.tahospital.vn/?otm-token=${payload}`;
            
            if (typeof GM !== 'undefined' && GM.openInTab) {
                try {
                    GM.openInTab(url, { active: false, insert: true, setParent: true });
                } catch (e) {
                    window.open(url, '_blank');
                }
            } else {
                window.open(url, '_blank');
            }
        });
    },

    /**
     * Subscribe to token messages from OTM tab (similar to subscribeOTMMessages)
     */
    _subscribeToTokenMessages(onSuccess, onError) {
        try {
            if (typeof GM !== 'undefined' && GM.addValueChangeListener) {
                const unsubIds = [];
                
                unsubIds.push(GM.addValueChangeListener('otm_token_success', (n, o, v) => {
                    try {
                        const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                        onSuccess && onSuccess(parsed && parsed.data);
                    } catch(_) {}
                }));
                
                unsubIds.push(GM.addValueChangeListener('otm_token_error', (n, o, v) => {
                    try {
                        const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                        onError && onError(parsed && parsed.data);
                    } catch(_) {}
                }));
                
                return () => {
                    try {
                        unsubIds.forEach(id => {
                            try {
                                GM.removeValueChangeListener && GM.removeValueChangeListener(id);
                            } catch(_) {}
                        });
                    } catch(_) {}
                };
            }
        } catch(_) {}

        // Fallback localStorage polling
        const tid = setInterval(() => {
            try {
                const s = localStorage.getItem('otm_token_success');
                if (s) {
                    localStorage.removeItem('otm_token_success');
                    const p = JSON.parse(s);
                    onSuccess && onSuccess(p && p.data);
                }
                
                const er = localStorage.getItem('otm_token_error');
                if (er) {
                    localStorage.removeItem('otm_token_error');
                    const p = JSON.parse(er);
                    onError && onError(p && p.data);
                }
            } catch(_) {}
        }, 800);
        
        return () => clearInterval(tid);
    },

    /**
     * Make an OTM API request using GM_xmlhttpRequest with automatic token handling
     */
    async makeOTMRequest(url, options = {}) {
        try {
            const token = await this.getValidToken();
            if (!token) {
                throw new Error('No valid OTM token available');
            }

            return new Promise((resolve, reject) => {
                const requestOptions = {
                    method: options.method || 'GET',
                    url: url,
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'authorization': `Bearer ${token}`,
                        'logintype': '2',
                        'siteid': '1',
                        'cache-control': 'no-cache',
                        ...options.headers
                    },
                    timeout: options.timeout || 30000
                };

                // Add body for POST requests
                if (options.body) {
                    if (typeof options.body === 'string') {
                        requestOptions.data = options.body;
                    } else {
                        requestOptions.data = JSON.stringify(options.body);
                        requestOptions.headers['content-type'] = 'application/json';
                    }
                }

                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    GM_xmlhttpRequest({
                        ...requestOptions,
                        onload: function(response) {
                            console.log('DEBUG - OTM API response:', response.status, url);
                            
                            if (response.status >= 200 && response.status < 300) {
                                try {
                                    const data = JSON.parse(response.responseText);
                                    resolve(data);
                                } catch (e) {
                                    resolve(response.responseText);
                                }
                            } else if (response.status === 401 || response.status === 403) {
                                // Token expired, clear cache and retry once
                                console.log('DEBUG - Token expired, clearing cache');
                                _tokenCache = { token: null, expiry: 0, lastValidated: 0 };
                                reject(new Error('TOKEN_EXPIRED'));
                            } else {
                                reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                            }
                        },
                        onerror: function(error) {
                            reject(error);
                        },
                        ontimeout: function() {
                            reject(new Error('REQUEST_TIMEOUT'));
                        }
                    });
                } else {
                    // Fallback to fetch (might fail due to CORS)
                    fetch(url, {
                        method: requestOptions.method,
                        headers: requestOptions.headers,
                        body: requestOptions.data,
                        mode: 'cors',
                        credentials: 'include'
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json().catch(() => response.text());
                        } else if (response.status === 401 || response.status === 403) {
                            _tokenCache = { token: null, expiry: 0, lastValidated: 0 };
                            throw new Error('TOKEN_EXPIRED');
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    })
                    .then(resolve)
                    .catch(reject);
                }
            });
        } catch (error) {
            console.error('DEBUG - OTM API request error:', error);
            throw error;
        }
    },

    /**
     * Convenience method: Fetch surgery data for date range
     */
    async fetchSurgeries(fromDate, toDate) {
        const fromISO = fromDate ? new Date(fromDate).toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z') : null;
        const toISO = toDate ? new Date(toDate).toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z') : null;
        
        if (fromISO && toISO) {
            // Range request
            const url = `https://otm.tahospital.vn/api/booking?from=${fromISO}&to=${toISO}&_=${Date.now()}`;
            return await this.makeOTMRequest(url);
        } else if (fromISO) {
            // Single date
            const url = `https://otm.tahospital.vn/api/booking?date=${fromISO}&_=${Date.now()}`;
            return await this.makeOTMRequest(url);
        } else {
            // Today
            const today = new Date().toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z');
            const url = `https://otm.tahospital.vn/api/booking?date=${today}&_=${Date.now()}`;
            return await this.makeOTMRequest(url);
        }
    },

    /**
     * Convenience method: Fetch OTM users list
     */
    async fetchUsers() {
        const url = `https://otm.tahospital.vn/api/user?ishsoft=null&page=1&limit=10000&_=${Date.now()}`;
        return await this.makeOTMRequest(url);
    },

    /**
     * Convenience method: Fetch rooms with department info
     */
    async fetchRoomsWithDepartment() {
        const url = `https://otm.tahospital.vn/api/booking/roomwithdepartment?_=${Date.now()}`;
        return await this.makeOTMRequest(url);
    }
};

module.exports = OTMTokenService;
