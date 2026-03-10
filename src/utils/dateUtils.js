// dateUtils.js - Centralized date handling utilities

const DateUtils = {
    /**
     * Convert Vietnamese date format (dd/mm/yyyy) to US format (mm/dd/yyyy)
     * Also handles cases where input is already in mm/dd/yyyy format
     */
    convertToUSFormat(admitDate) {
        if (!admitDate) {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            return `${mm}/${dd}/${yyyy} 00:00`;
        }

        // DEBUG: Log input format
        console.log('DEBUG - DateUtils.convertToUSFormat input:', admitDate);

        if (/^\d{2}\/\d{2}\/\d{4}/.test(admitDate)) {
            const [part1, part2, yearAndTime] = admitDate.split('/');
            const [year, time] = yearAndTime.split(' ');

            // Try to determine if it's dd/mm/yyyy or mm/dd/yyyy
            // If part1 > 12, it must be dd/mm/yyyy format
            // If part2 > 12, it must be mm/dd/yyyy format  
            const num1 = parseInt(part1);
            const num2 = parseInt(part2);

            let month, day;

            if (num1 > 12) {
                // part1 is day, part2 is month (dd/mm/yyyy format)
                day = part1;
                month = part2;
                console.log('DEBUG - Detected dd/mm/yyyy format');
            } else if (num2 > 12) {
                // part1 is month, part2 is day (mm/dd/yyyy format - already US format)
                month = part1;
                day = part2;
                console.log('DEBUG - Detected mm/dd/yyyy format (already US format)');
            } else {
                // Both numbers <= 12, assume Vietnamese format (dd/mm/yyyy)
                day = part1;
                month = part2;
                console.log('DEBUG - Ambiguous format, assuming dd/mm/yyyy');
            }

            const result = `${month}/${day}/${year} ${time || '00:00'}`;
            console.log('DEBUG - DateUtils.convertToUSFormat output:', result);
            return result;
        }

        console.log('DEBUG - DateUtils.convertToUSFormat: returning input as-is');
        return admitDate;
    },

    /**
     * Calculate date range for checklist (from admit date to +30 days)
     */
    getChecklistDateRange(admitDate) {
        const tungay = this.convertToUSFormat(admitDate);
        const [admitMonth, admitDay, admitYearAndTime] = tungay.split('/');
        const [admitYear, admitTime] = admitYearAndTime.split(' ');

        const tungayDate = new Date(`${admitYear}-${admitMonth}-${admitDay}T${admitTime || '00:00'}`);
        const denngayDate = new Date(tungayDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        const dd = String(denngayDate.getDate()).padStart(2, '0');
        const mm = String(denngayDate.getMonth() + 1).padStart(2, '0');
        const yyyy = denngayDate.getFullYear();
        const denngay = `${mm}/${dd}/${yyyy} 23:59`;

        return { tungay, denngay };
    },

    /**
     * Get today's date as dd/mm/yyyy string (used in y lệnh timestamps, tags, etc.)
     */
    getTodayStr() {
        const d = new Date();
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
};

module.exports = DateUtils;
