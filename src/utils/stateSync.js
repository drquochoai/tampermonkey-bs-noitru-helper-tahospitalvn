// stateSync.js - Helpers to keep in-memory state in sync across window.dr_data and window.checklistState

/**
 * Sync a new checklistState back into the matching patient object in window.dr_data.
 * Call this after any mutation to window.checklistState so cards stay up to date.
 * @param {string} mabn - Patient identifier
 * @param {object} newState - The updated checklist state object
 */
function syncPatientStateToGlobal(mabn, newState) {
    try {
        if (!window.dr_data || !mabn) return;
        const key = String(mabn || '').trim();
        const p = window.dr_data.find(p => {
            if (!p) return false;
            const candidates = [p.mabn, p.pid, p.maBN, p.ma_benh_nhan];
            for (let i = 0; i < candidates.length; i++) {
                const v = candidates[i];
                if (v != null && String(v).trim() === key) return true;
            }
            return false;
        });

        if (!p) return;

        p.checklistState = { ...newState };

        try {
            if (typeof window.updatePatientCardTags === 'function') {
                window.updatePatientCardTags(key);
            }
        } catch (_) { }

        try {
            if (typeof window.updatePatientCardPhauThuat === 'function') {
                window.updatePatientCardPhauThuat(p, p.checklistState);
            }
        } catch (_) { }

        try {
            if (typeof window.updatePatientCardHXT === 'function') {
                window.updatePatientCardHXT(p);
            }
        } catch (_) { }

        try {
            if (typeof window.updatePatientCardCDKT === 'function') {
                window.updatePatientCardCDKT(p);
            }
        } catch (_) { }

        try {
            if (typeof window.__drSyncActiveSidebarState === 'function') {
                window.__drSyncActiveSidebarState(key, p.checklistState);
            }
        } catch (_) { }
    } catch (_) { }
}

module.exports = { syncPatientStateToGlobal };
