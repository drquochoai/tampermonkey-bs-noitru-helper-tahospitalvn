// checklistService.js - Centralized checklist management

const DateUtils = require('../utils/dateUtils');
const ApiService = require('./apiService');
const SaveQueue = require('./saveQueue');

// In-memory cache to dedupe checklist fetches per patient and date range
const _checklistCache = new Map();
function _makeCacheKey(mabn, tungay, denngay) {
    return `${String(mabn)}|${String(tungay)}|${String(denngay)}`;
}

const ChecklistService = {
    // Expose small helpers for cache invalidation (internal use)
    _invalidateCacheForMabn(mabn) {
        try {
            const prefix = `${String(mabn)}|`;
            for (const key of _checklistCache.keys()) {
                if (key.startsWith(prefix)) _checklistCache.delete(key);
            }
        } catch (_) {}
    },

    async drainSaveQueue() {
        return await SaveQueue.drain(async ({ checklistObj, checklistState }) => {
            try {
                const res = await ApiService.updateChecklistData(checklistObj, checklistState);
                const ok = res && (res.Status == 1 || res.isValid);
                if (ok) {
                    try {
                        const mabn = checklistObj && (checklistObj.mabn || checklistObj.MABN || checklistObj.MaBN);
                        let ngayvv = (checklistObj && (checklistObj.tungay || checklistObj.ngayvv || checklistObj.NgayVV)) || null;
                        if (mabn) {
                            if (ngayvv) {
                                const { tungay, denngay } = DateUtils.getChecklistDateRange(ngayvv);
                                const key = _makeCacheKey(mabn, tungay, denngay);
                                _checklistCache.delete(key);
                            }
                            this._invalidateCacheForMabn(mabn);
                        }
                    } catch (_) {}
                }
                return ok;
            } catch (_) {
                return false;
            }
        });
    },
    /**
     * Load checklist data for a patient
     */
    async loadChecklistData(patient, options = {}) {
        const originalMabn = patient.mabn;
        const mabnWith9898 = patient.mabn + 9898;
        const { tungay, denngay } = DateUtils.getChecklistDateRange(patient.ngayvv);
        console.log('DEBUG - DateUtils.getChecklistDateRange result:', {
            inputNgayvv: patient.ngayvv,
            outputTungay: tungay,
            outputDenngay: denngay
        });
        console.log('DEBUG - Trying both mabn formats:', { originalMabn, mabnWith9898 });

        const cacheKey = _makeCacheKey(originalMabn, tungay, denngay);
        if (options && options.forceRefresh) {
            _checklistCache.delete(cacheKey);
        }
        if (_checklistCache.has(cacheKey)) {
            console.log('DEBUG - Returning cached/inflight checklist response for', cacheKey);
            return _checklistCache.get(cacheKey);
        }

        const inflight = (async () => {
            // First try with 9898 suffix
            const formData = new FormData();
            formData.append('mabn', mabnWith9898);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);
            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const result = await response.json();
            console.log('DEBUG - ChecklistService.loadChecklistData API response (with 9898):', result);
            if (!result.data || result.data.length === 0) {
                // Fallback without 9898
                const fallbackFormData = new FormData();
                fallbackFormData.append('mabn', originalMabn);
                fallbackFormData.append('tungay', tungay);
                fallbackFormData.append('denngay', denngay);
                const fallbackResponse = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                    method: 'POST',
                    credentials: 'include',
                    body: fallbackFormData
                });
                const fallbackResult = await fallbackResponse.json();
                console.log('DEBUG - ChecklistService.loadChecklistData API response (original mabn):', fallbackResult);
                return fallbackResult;
            }
            return result;
        })();

        _checklistCache.set(cacheKey, inflight);
        try {
            const finalRes = await inflight;
            // Store resolved promise for subsequent reuse
            _checklistCache.set(cacheKey, Promise.resolve(finalRes));
            return finalRes;
        } catch (e) {
            _checklistCache.delete(cacheKey);
            throw e;
        }
    },

    /**
     * Find existing checklist object from response data
     */
    findChecklistObject(responseData) {
        console.log('DEBUG - findChecklistObject input:', responseData);
        
        if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
            console.log('DEBUG - No data array or empty array');
            return null;
        }

        console.log('DEBUG - Searching through', responseData.data.length, 'checklist objects');
        
        for (let i = 0; i < responseData.data.length; i++) {
            const item = responseData.data[i];
            console.log(`DEBUG - Checklist object ${i}:`, item);
            
            if (typeof item.hoten === 'string' && item.hoten.trim().endsWith('%')) {
                console.log('DEBUG - Found matching checklist object with hoten ending with %');
                return item;
            }
        }
        
        console.log('DEBUG - No matching checklist object found');
        return null;
    },

    /**
     * Parse checklist state from checklist object
     */
    parseChecklistState(checklistObj) {
        let state = {};
        if (checklistObj && checklistObj.chuky) {
            try {
                state = JSON.parse(checklistObj.chuky);
            } catch (e) {
                console.warn('Failed to parse checklist state:', e);
                state = {};
            }
        }
        return state;
    },

    /**
     * Load checklist state for a patient (combination of loadChecklistData and parseChecklistState)
     */
    async loadChecklistState(checklistObj) {
        try {
            // If we already have a checklist object, just parse its state
            if (checklistObj && checklistObj.chuky) {
                return this.parseChecklistState(checklistObj);
            }

            // Otherwise, we need to construct a patient object and load data
            const patient = {
                mabn: checklistObj.mabn,
                mavaovien: checklistObj.mavaovien,
                ngayvv: checklistObj.tungay // Use tungay as ngayvv for date range calculation
            };

            console.log('DEBUG - checklistService.loadChecklistState patient object:', patient);

            const responseData = await this.loadChecklistData(patient);
            const foundChecklistObj = this.findChecklistObject(responseData);
            
            if (foundChecklistObj) {
                return this.parseChecklistState(foundChecklistObj);
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to load checklist state:', error);
            return null;
        }
    },

    /**
     * Update checklist state on server
     */
    _locks: new Map(), // mabn -> Promise chain for serialization

    async updateChecklistState(checklistObj, checklistState, options = {}) {
        const { enqueueOnOffline = true, signal, ctxId, clientVersion = Date.now() } = options || {};
        const mabn = checklistObj && (checklistObj.mabn || checklistObj.MABN || checklistObj.MaBN);
        // If offline, queue and return
        if (enqueueOnOffline && typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
            SaveQueue.enqueueUpdate(checklistObj, checklistState);
            return { ok: false, queued: true, clientVersion };
        }
        const send = async () => {
            const result = await ApiService.updateChecklistData(checklistObj, checklistState, { signal });
            const ok = result && (result.Status == 1 || result.isValid);
            return { ok, queued: false, clientVersion };
        };
        // Serialize per patient to avoid races
        if (mabn) {
            const prev = this._locks.get(mabn) || Promise.resolve();
            const next = prev.then(send, send);
            this._locks.set(mabn, next.catch(() => {}));
            try {
                const res = await next;
                if (res.ok) {
                    // Invalidate cache when saved
                    try {
                        let ngayvv = (checklistObj && (checklistObj.tungay || checklistObj.ngayvv || checklistObj.NgayVV)) || null;
                        if (ngayvv) {
                            const { tungay, denngay } = DateUtils.getChecklistDateRange(ngayvv);
                            const key = _makeCacheKey(mabn, tungay, denngay);
                            _checklistCache.delete(key);
                        }
                        this._invalidateCacheForMabn(mabn);
                    } catch (_) {}
                }
                return res;
            } catch (error) {
                console.error('Failed to update checklist state:', error);
                // Network error: queue if allowed
                if (enqueueOnOffline) {
                    SaveQueue.enqueueUpdate(checklistObj, checklistState);
                    return { ok: false, queued: true, clientVersion };
                }
                return { ok: false, queued: false, clientVersion };
            }
        } else {
            try {
                return await send();
            } catch (error) {
                console.error('Failed to update checklist state:', error);
                if (enqueueOnOffline) {
                    SaveQueue.enqueueUpdate(checklistObj, checklistState);
                    return { ok: false, queued: true, clientVersion };
                }
                return { ok: false, queued: false, clientVersion };
            }
        }
    },

    /**
     * Create new checklist for patient
     */
    async createNewChecklist(patient) {
        try {
            const result = await ApiService.createChecklistForPatient(patient);
            return result && result.isValid;
        } catch (error) {
            console.error('Failed to create new checklist:', error);
            return false;
        }
    }
};

module.exports = ChecklistService;
