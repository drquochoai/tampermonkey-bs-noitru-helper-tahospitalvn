// checklistAPIModule.js - Unified, centralized checklist data API
// Single source of truth for all checklist operations (fetch, save, create)
// Handles consistent mabn normalization and error recovery

const DateUtils = require('../utils/dateUtils');
const ApiService = require('./apiService');

// In-memory single-result cache for the most recently fetched checklist
// Key: mabn, Value: { checklistObj, state, timestamp }
const _cache = new Map();

const ChecklistAPIModule = {
    /**
     * Get checklist data for a patient.
     * Handles mabn normalization: tries +9898 first, falls back to plain mabn.
     * Returns: { mabn, checklistObj, state } or null if not found
     */
    async getChecklistData(patient, options = {}) {
        if (!patient || !patient.mabn) {
            console.error('ChecklistAPIModule.getChecklistData: invalid patient');
            return null;
        }

        const { forceRefresh = false, skipCache = false } = options;
        const originalMabn = String(patient.mabn).trim();
        
        // Check cache first
        if (!forceRefresh && !skipCache && _cache.has(originalMabn)) {
            const cached = _cache.get(originalMabn);
            if (cached && cached.checklistObj) {
                console.log('ChecklistAPIModule.getChecklistData: returning cached result for', originalMabn);
                return {
                    mabn: originalMabn,
                    checklistObj: cached.checklistObj,
                    state: cached.state
                };
            }
        }

        // Clear cache if force refresh
        if (forceRefresh) {
            _cache.delete(originalMabn);
        }

        try {
            // Fetch checklist data (tries +9898 first, fallback to plain mabn internally)
            const responseData = await this._fetchChecklistDataInternal(patient);
            
            if (!responseData) {
                console.warn('ChecklistAPIModule.getChecklistData: no response data for', originalMabn);
                return null;
            }

            // Find matching checklist object in response
            const checklistObj = this._findChecklistObject(responseData);
            
            if (!checklistObj) {
                console.warn('ChecklistAPIModule.getChecklistData: no matching checklist object for', originalMabn);
                return null;
            }

            // Parse checklist state from the object
            const state = this._parseChecklistState(checklistObj);

            // Cache the result
            _cache.set(originalMabn, {
                checklistObj,
                state,
                timestamp: Date.now()
            });

            console.log('ChecklistAPIModule.getChecklistData: loaded for', originalMabn);

            return {
                mabn: originalMabn,
                checklistObj,
                state
            };
        } catch (error) {
            console.error('ChecklistAPIModule.getChecklistData error:', error);
            return null;
        }
    },

    /**
     * Save checklist state for a patient.
     * Preserves the original mabn from the checklist object.
     * Returns: { ok: boolean, result: any }
     */
    async saveChecklistState(checklistObj, checklistState, options = {}) {
        if (!checklistObj || !checklistState || typeof checklistState !== 'object') {
            console.error('ChecklistAPIModule.saveChecklistState: invalid inputs');
            return { ok: false };
        }

        try {
            const mabn = String(checklistObj.mabn || checklistObj.MABN || checklistObj.MaBN || '').trim();
            
            // Call ApiService.updateChecklistData with the full checklist object
            // This preserves the original mabn and ID from the API response
            const result = await ApiService.updateChecklistData(checklistObj, checklistState, options);
            const ok = result && (result.Status == 1 || result.isValid);
            
            if (ok) {
                // Invalidate cache on successful save
                _cache.delete(mabn);
                console.log('ChecklistAPIModule.saveChecklistState: saved for', mabn);
            }

            return { ok, result };
        } catch (error) {
            console.error('ChecklistAPIModule.saveChecklistState error:', error);
            return { ok: false, error };
        }
    },

    /**
     * Create a new checklist for a patient.
     * Returns: { ok: boolean, checklistObj: any }
     */
    async createChecklist(patient) {
        if (!patient || !patient.mabn) {
            console.error('ChecklistAPIModule.createChecklist: invalid patient');
            return { ok: false };
        }

        try {
            const result = await ApiService.createChecklistForPatient(patient);
            const ok = result && result.isValid;
            
            if (ok) {
                // Invalidate cache after creation
                const mabn = String(patient.mabn).trim();
                _cache.delete(mabn);
                console.log('ChecklistAPIModule.createChecklist: created for', mabn);
            }

            return { ok, result };
        } catch (error) {
            console.error('ChecklistAPIModule.createChecklist error:', error);
            return { ok: false, error };
        }
    },

    /**
     * Internal: Fetch checklist data with automatic mabn+9898 fallback
     */
    async _fetchChecklistDataInternal(patient) {
        const originalMabn = String(patient.mabn).trim();
        const mabnWith9898 = originalMabn + '9898';
        const { tungay, denngay } = DateUtils.getChecklistDateRange(patient.ngayvv);

        // Try with +9898 first
        try {
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
            
            if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                console.log('ChecklistAPIModule: fetched with +9898 format, got', result.data.length, 'items');
                return result;
            }
        } catch (e) {
            console.warn('ChecklistAPIModule: fetch with +9898 failed, trying plain mabn', e);
        }

        // Fallback: try with plain mabn
        try {
            const formData = new FormData();
            formData.append('mabn', originalMabn);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);

            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();
            
            if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                console.log('ChecklistAPIModule: fetched with plain mabn, got', result.data.length, 'items');
                return result;
            }
        } catch (e) {
            console.warn('ChecklistAPIModule: fetch with plain mabn failed', e);
        }

        return null;
    },

    /**
     * Internal: Find matching checklist object from response
     * Prefers items with hoten ending in '%', falls back to single item
     */
    _findChecklistObject(responseData) {
        if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
            return null;
        }

        const items = responseData.data;

        // Prefer item with hoten ending in '%'
        for (const item of items) {
            if (item && typeof item.hoten === 'string' && item.hoten.trim().endsWith('%')) {
                return item;
            }
        }

        // Fallback: single item
        if (items.length === 1 && items[0]) {
            return items[0];
        }

        // Last resort: first item with mabn
        for (const item of items) {
            if (item && (item.mabn || item.MABN || item.MaBN)) {
                return item;
            }
        }

        return null;
    },

    /**
     * Internal: Parse checklist state from checklist object
     */
    _parseChecklistState(checklistObj) {
        if (!checklistObj || !checklistObj.chuky) {
            return {};
        }

        try {
            const parsed = JSON.parse(checklistObj.chuky);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            console.warn('ChecklistAPIModule: failed to parse chuky:', e);
            return {};
        }
    },

    /**
     * Invalidate cache for a specific mabn or all entries
     */
    invalidateCache(mabn) {
        if (mabn) {
            _cache.delete(String(mabn).trim());
        } else {
            _cache.clear();
        }
    }
};

module.exports = ChecklistAPIModule;
