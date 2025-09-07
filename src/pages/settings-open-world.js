// Compatibility shim: re-export the actual Open World settings module
// Some imports may reference './settings-open-world' next to this file.
module.exports = require('./page.settings-open-world');
// Compatibility shim: keep old import path working
// Some builds may still reference '../settings-open-world'
// Re-export the new module so both paths resolve.
module.exports = require('./page.settings-open-world');
