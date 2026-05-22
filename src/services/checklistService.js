// checklistService.js - Unified checklist workflow service
// Single entrypoint for checklist load/create/save + local state sync.

const SaveQueue = require('./saveQueue');
const ChecklistAPIModule = require('./checklistAPIModule');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

function getMabn(input) {
    if (!input || typeof input !== 'object') return '';
    return String(input.mabn || input.MABN || input.MaBN || '').trim();
}

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
                const res = await ChecklistAPIModule.saveChecklistState(checklistObj, checklistState);
                if (res && res.ok) {
                    const mabn = getMabn(checklistObj);
                    if (mabn) {
                        try { syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
                        this._invalidateCacheForMabn(mabn);
                    }
                }
                return !!(res && res.ok);
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
     * Unified loader for dashboard/sidebar: load checklist bundle and create if missing.
     * Returns { checklistObj, state, created } or null.
     */
    async loadChecklistBundle(patient, options = {}) {
        const { forceRefresh = false, createIfMissing = false } = options || {};
        const fetched = await ChecklistAPIModule.getChecklistData(patient, { forceRefresh });
        if (fetched && fetched.checklistObj) {
            return {
                checklistObj: fetched.checklistObj,
                state: fetched.state || {},
                created: false
            };
        }

        if (!createIfMissing) return null;

        const created = await this.createNewChecklist(patient);
        if (!created) return null;

        const afterCreate = await ChecklistAPIModule.getChecklistData(patient, { forceRefresh: true, skipCache: true });
        if (!afterCreate || !afterCreate.checklistObj) return null;
        return {
            checklistObj: afterCreate.checklistObj,
            state: afterCreate.state || {},
            created: true
        };
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
        const { enqueueOnOffline = true, signal, clientVersion = Date.now() } = options || {};
        const mabn = getMabn(checklistObj);
        // If offline, queue and return
        if (enqueueOnOffline && typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
            SaveQueue.enqueueUpdate(checklistObj, checklistState);
            try { if (mabn) syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
            return { ok: false, queued: true, clientVersion };
        }
        const send = async () => {
            const result = await ChecklistAPIModule.saveChecklistState(checklistObj, checklistState, { signal });
            const ok = !!(result && result.ok);
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
                    try {
                        if (mabn) syncPatientStateToGlobal(mabn, checklistState);
                    } catch (_) {}
                }
                return res;
            } catch (error) {
                console.error('Failed to update checklist state:', error);
                // Network error: queue if allowed
                if (enqueueOnOffline) {
                    SaveQueue.enqueueUpdate(checklistObj, checklistState);
                    try { if (mabn) syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
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
                    try { if (mabn) syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
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
            const result = await ChecklistAPIModule.createChecklist(patient);
            return !!(result && result.ok);
        } catch (error) {
            console.error('Failed to create new checklist:', error);
            return false;
        }
    }
};

module.exports = ChecklistService;
