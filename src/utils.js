// Common utility functions (date formatting, age calculation, etc.)
const Utils = {
    _normalizeDateInput(dateInput) {
        if (!dateInput) return { dateObj: null, timeStr: null };
        let effectiveDateObj = null;
        let extractedTimeStr = null;
        if (dateInput instanceof Date) {
            effectiveDateObj = dateInput;
            extractedTimeStr = `${String(effectiveDateObj.getHours()).padStart(2, '0')}:${String(effectiveDateObj.getMinutes()).padStart(2, '0')}`;
        } else if (typeof dateInput === 'string') {
            let datePart = dateInput;
            let timePart = null;
            if (datePart.includes('T')) {
                const parts = datePart.split('T');
                datePart = parts[0];
                if (parts[1]) timePart = parts[1].substring(0, 5);
            } else if (datePart.includes(' ')) {
                const parts = datePart.split(' ');
                datePart = parts[0];
                if (parts[1]) timePart = parts[1].substring(0, 5);
            }
            extractedTimeStr = timePart;
            if (/\d{4}-\d{2}-\d{2}/.test(datePart)) {
                effectiveDateObj = new Date(datePart + 'T00:00:00');
            } else if (/\d{2}\/\d{2}\/\d{4}/.test(datePart)) {
                const [d, m, y] = datePart.split('/');
                effectiveDateObj = new Date(`${y}-${m}-${d}T00:00:00`);
            } else {
                const potentialDate = new Date(dateInput);
                if (!isNaN(potentialDate.getTime())) {
                    effectiveDateObj = potentialDate;
                    if (!extractedTimeStr && (dateInput.includes('T') || dateInput.includes(' ')) && dateInput.includes(':')) {
                        extractedTimeStr = `${String(effectiveDateObj.getHours()).padStart(2, '0')}:${String(effectiveDateObj.getMinutes()).padStart(2, '0')}`;
                    }
                }
            }
            if (effectiveDateObj && isNaN(effectiveDateObj.getTime())) {
                effectiveDateObj = null;
            }
        }
        return { dateObj: effectiveDateObj, timeStr: extractedTimeStr };
    },
    calculateAge(dateString) {
        const { dateObj: birth } = this._normalizeDateInput(dateString);
        if (!birth) return '';
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },
    formatDate(date) {
        const { dateObj } = this._normalizeDateInput(date);
        if (!dateObj) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    },
    formatDateForApi(date) {
        const { dateObj, timeStr } = this._normalizeDateInput(date);
        if (!dateObj) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const finalTime = timeStr || '00:00';
        return `${month}/${day}/${year} ${finalTime}`;
    },
    pad(n, width = 2) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    },
    getQueryParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    },
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }
};

module.exports = Utils;
