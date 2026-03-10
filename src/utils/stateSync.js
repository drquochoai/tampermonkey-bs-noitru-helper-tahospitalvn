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
        const p = window.dr_data.find(p => p.mabn === mabn);
        if (p) p.checklistState = { ...newState };
    } catch (_) { }
}

module.exports = { syncPatientStateToGlobal };
