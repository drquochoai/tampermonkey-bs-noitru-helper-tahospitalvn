// otm-entry.js - Entry point for OTM content script
(function() {
    'use strict';

    // Only run on OTM domain
    if (window.location.hostname !== 'otm.tahospital.vn') {
        return;
    }

    console.log('OTM Entry Script loaded');

    // Load the content script
    try {
        require('./otm.content');
    } catch (error) {
        console.error('Failed to load OTM content script:', error);
    }

})();
