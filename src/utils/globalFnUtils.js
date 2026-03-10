// globalFnUtils.js - Helper to call functions that may live on multiple global scopes
// (unsafeWindow, globalThis, window) without repeating the boilerplate everywhere.

/**
 * Call a named function across all known global scopes.
 * Returns true if the function was found and called successfully.
 * @param {string} fnName - Name of the global function to call
 * @param {...any} args - Arguments to pass to the function
 * @returns {boolean}
 */
function callGlobalFn(fnName, ...args) {
    const scopes = [];
    try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow) scopes.push(unsafeWindow); } catch (_) { }
    try { if (typeof globalThis !== 'undefined' && globalThis) scopes.push(globalThis); } catch (_) { }
    try { if (typeof window !== 'undefined' && window) scopes.push(window); } catch (_) { }

    for (const scope of scopes) {
        if (scope && typeof scope[fnName] === 'function') {
            try {
                scope[fnName](...args);
                return true;
            } catch (e) {
                console.warn(`callGlobalFn: error calling ${fnName}`, e);
            }
        }
    }
    return false;
}

module.exports = { callGlobalFn };
