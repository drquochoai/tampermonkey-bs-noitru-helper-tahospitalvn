// sidebarSession.js - Manage per-sidebar session context and AbortController

let _current = {
    id: 0,
    mabn: null,
    controller: null
};

const SidebarSession = {
    startSession(mabn) {
        // End previous session
        try { if (_current.controller) _current.controller.abort(); } catch(_) {}
        _current.id = Date.now();
        _current.mabn = mabn || null;
        _current.controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        return _current.id;
    },
    endSession() {
        try { if (_current.controller) _current.controller.abort(); } catch(_) {}
        _current.controller = null;
        _current.mabn = null;
        _current.id = 0;
    },
    getSignal() {
        return _current.controller ? _current.controller.signal : undefined;
    },
    isActive(sessionId) {
        return !!sessionId && sessionId === _current.id;
    },
    getCurrent() { return { ..._current }; }
};

module.exports = SidebarSession;
