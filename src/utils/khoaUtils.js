// khoaUtils.js - central helpers for selected khoa id

function getSelectedKhoa(defaultValue = '551') {
    try {
        const ls = window.localStorage;
        return (ls.getItem('bsnt_khoa_dashboard') || defaultValue);
    } catch (_) {
        return defaultValue;
    }
}

module.exports = {
    getSelectedKhoa
};
