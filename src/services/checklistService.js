// checklistService.js - Compatibility wrapper around ChecklistAPIModule
// Delegates to ChecklistAPIModule for core operations; maintains backward compatibility

const ApiService = require('./apiService');
const SaveQueue = require('./saveQueue');
const ChecklistAPIModule = require('./checklistAPIModule');

const ChecklistService = {
    // Delegate to ChecklistAPIModule for cache invalidation
    _invalidateCacheForMabn(mabn) {
        try {
            ChecklistAPIModule.invalidateCache(mabn);
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
     * DELEGATION: Delegates to ChecklistAPIModule for unified mabn handling
     */
    async loadChecklistData(patient, options = {}) {
        const result = await ChecklistAPIModule.getChecklistData(patient, options);
        if (!result) {
            return { data: [] };
        }
        // Return in legacy format: { data: [checklistObj, ...] }
        return {
            isValid: true,
            data: result.checklistObj ? [result.checklistObj] : []
        };
    },

    /**
     * Find existing checklist object from response data
     * DELEGATION: Uses ChecklistAPIModule's improved matching logic
     */
    findChecklistObject(responseData) {
        return ChecklistAPIModule._findChecklistObject(responseData);
    },

    /**
     * Parse checklist state from checklist object
     * DELEGATION: Uses ChecklistAPIModule's logic
     */
    parseChecklistState(checklistObj) {
        return ChecklistAPIModule._parseChecklistState(checklistObj);
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
