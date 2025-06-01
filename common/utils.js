// common/utils.js
// Các hàm tiện ích dùng chung cho mọi domain
(function() {
    if (window.Utils) return; // Tránh nạp lại
    window.Utils = {
        /**
         * Calculate age from a date string (ISO or dd/MM/yyyy)
         * @param {string} dateString
         * @returns {number|string}
         */
        calculateAge(dateString) {
            if (!dateString) return '';
            let birth;
            if (dateString.includes('T')) {
                // ISO format: yyyy-MM-ddTHH:mm:ss
                birth = new Date(dateString.split('T')[0]);
            } else if (/\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
                // dd/MM/yyyy
                const [day, month, year] = dateString.split('/');
                birth = new Date(`${year}-${month}-${day}`);
            } else if (/\d{4}-\d{2}-\d{2}/.test(dateString)) {
                // yyyy-MM-dd
                birth = new Date(dateString);
            } else {
                birth = new Date(dateString);
            }
            if (isNaN(birth)) return '';
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        },
        /**
         * Format a date string to dd/MM/yyyy
         * @param {string|Date} date
         * @returns {string}
         */
        formatDate(date) {
            let d = date;
            if (!d) return '';
            if (typeof d === 'string' && d.includes('T')) d = d.split('T')[0];
            if (typeof d === 'string' && d.includes('-')) {
                // yyyy-MM-dd
                const [y, m, day] = d.split('-');
                return `${day}/${m}/${y}`;
            } else if (typeof d === 'string' && d.includes('/')) {
                // dd/MM/yyyy
                return d;
            } else if (d instanceof Date) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
            }
            return d;
        },
        /**
         * Format a date string to MM/dd/yyyy HH:mm (for API)
         * @param {string|Date} date
         * @returns {string}
         */
        formatDateForApi(date) {
            let d = date;
            let time = '00:00';
            if (!d) return '';
            if (typeof d === 'string' && d.includes('T')) d = d.split('T')[0];
            if (typeof d === 'string' && d.includes(' ')) {
                [d, time] = d.split(' ');
            }
            if (typeof d === 'string' && d.includes('-')) {
                // yyyy-MM-dd
                const [y, m, day] = d.split('-');
                return `${m}/${day}/${y} ${time}`;
            } else if (typeof d === 'string' && d.includes('/')) {
                // dd/MM/yyyy
                const [day, month, year] = d.split('/');
                return `${month}/${day}/${year} ${time}`;
            } else if (d instanceof Date) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${month}/${day}/${year} ${time}`;
            }
            return d;
        },
        /**
         * Pad a number with leading zeros
         * @param {number|string} n
         * @param {number} width
         * @returns {string}
         */
        pad(n, width = 2) {
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
        },
        /**
         * Get query param from URL
         * @param {string} name
         * @returns {string|null}
         */
        getQueryParam(name) {
            const url = new URL(window.location.href);
            return url.searchParams.get(name);
        },
        /**
         * Copy text to clipboard
         * @param {string} text
         */
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
})();
