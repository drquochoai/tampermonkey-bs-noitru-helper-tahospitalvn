function pad2(value) {
    return String(value).padStart(2, '0');
}

function normalizeToDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
        const copy = new Date(value.getTime());
        if (isNaN(copy.getTime())) return null;
        copy.setHours(0, 0, 0, 0);
        return copy;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    let normalized = raw;

    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
        normalized = raw.replace(' ', 'T');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
        const [part1, part2, part3] = raw.split('/');
        const [year, time = '00:00'] = part3.split(' ');
        const num1 = parseInt(part1, 10);
        const num2 = parseInt(part2, 10);

        let day = part1;
        let month = part2;
        if (num1 <= 12 && num2 > 12) {
            month = part1;
            day = part2;
        }

        normalized = `${year}-${pad2(month)}-${pad2(day)}T${time || '00:00'}`;
    }

    const date = new Date(normalized);
    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function toISODate(value) {
    const date = normalizeToDate(value);
    if (!date) return '';
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDisplayDate(value) {
    const date = normalizeToDate(value);
    if (!date) return '';
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function getTodayISODate() {
    return toISODate(new Date());
}

function getEntryDischargeDate(entry) {
    if (!entry || typeof entry !== 'object') return '';

    const explicit = entry.expectedDischargeDate || entry.dischargeDate || entry.dischargeDateExpected;
    if (explicit) return toISODate(explicit);

    if (entry.timestamp) {
        const timestampDate = String(entry.timestamp).split(' ')[0];
        return toISODate(timestampDate);
    }

    return '';
}

function isDischargeEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    const content = String(entry.content || entry.action || '').toLowerCase();
    return content.includes('xuất viện') || (entry.q === true && entry.action === 'Xuất viện');
}

function isDischargeEntryOnDate(entry, targetDate) {
    if (!isDischargeEntry(entry)) return false;
    const entryDate = getEntryDischargeDate(entry);
    const effectiveTarget = toISODate(targetDate || new Date()) || getTodayISODate();
    return !!entryDate && entryDate === effectiveTarget;
}

function getDischargeDisplayText(entry) {
    if (!entry || !isDischargeEntry(entry)) return '';
    const plannedDate = entry.expectedDischargeDate ? formatDisplayDate(entry.expectedDischargeDate) : '';
    const timeText = entry.dischargeTime ? ` ${entry.dischargeTime}` : '';
    if (plannedDate && timeText) return `dự kiến ${plannedDate}${timeText}`;
    if (plannedDate) return `dự kiến ${plannedDate}`;
    if (timeText) return `lúc${timeText}`;
    return '';
}

module.exports = {
    formatDisplayDate,
    getDischargeDisplayText,
    getEntryDischargeDate,
    getTodayISODate,
    isDischargeEntry,
    isDischargeEntryOnDate,
    normalizeToDate,
    toISODate
};