// contextMenuCopyBuilders.js - Builders for specialized context-menu copy variants

const ChecklistService = require('../services/checklistService');
const ReportService = require('../services/reportService');
const PatientDataMapper = require('./patientDataMapper');
const { escapeHtml } = require('./htmlUtils');
const GPB_CAI_DAT = require('../BS_CAI_DAT_GPB_CAT_LANH');

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function loadPatientChecklistState(patient) {
    if (patient && patient.checklistState) {
        return patient.checklistState;
    }
    return ChecklistService.loadChecklistData(patient)
        .then((res) => {
            const obj = ChecklistService.findChecklistObject(res);
            return obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
        })
        .catch(() => ({}));
}

function getPatientSurgeryData(patient, state) {
    return PatientDataMapper.mapPhauThuatData(state) || patient?.phauThuatInfo || null;
}

function parseDateDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const match = String(dateStr).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
}

function parseTimeHHMM(timeStr) {
    const match = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    const minute = Math.max(0, Math.min(59, parseInt(match[2], 10)));
    return { hour, minute };
}

function formatDateTimeVN(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    return { date: `${dd}/${mm}/${yyyy}`, time: `${HH}:${MM}` };
}

function addMinutesToSurgeryTime(dateStr, timeStr, minutes) {
    const date = parseDateDDMMYYYY(dateStr);
    const time = parseTimeHHMM(timeStr);
    if (!date || !time) return '';
    date.setHours(time.hour, time.minute, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return formatDateTimeVN(date);
}

function extractLateralityPhrase(diagnosis) {
    const raw = String(diagnosis || '').trim();
    if (!raw) return '';

    const phraseMatch = raw.match(/th[ùu]y(?:\s+[^,.;()]+){0,3}\s+(trái|phải|trai|phai)/i);
    if (phraseMatch) {
        return phraseMatch[0]
            .replace(/trai/i, 'trái')
            .replace(/phai/i, 'phải')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const normalized = normalizeText(raw);
    if (normalized.includes('trai')) return 'thùy trái';
    if (normalized.includes('phai')) return 'thùy phải';
    return '';
}

function matchesRule(diagnosis, rule) {
    const normalizedDiagnosis = normalizeText(diagnosis);
    const rawKeywords = Array.isArray(rule.keywords)
        ? rule.keywords
        : String(rule.keywords || '').split('|');
    const keywords = rawKeywords.map(item => normalizeText(item)).filter(Boolean);

    if (keywords.length === 0) return false;
    const mode = String(rule.matchMode || 'OR').toUpperCase();
    if (mode === 'AND') {
        return keywords.every(keyword => normalizedDiagnosis.includes(keyword));
    }
    return keywords.some(keyword => normalizedDiagnosis.includes(keyword));
}

function resolveTemplate(template, context) {
    const source = String(template || '').trim();
    if (!source) return '';
    return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
        const value = context[key];
        return value == null ? '' : String(value);
    }).replace(/\s+/g, ' ').trim();
}

function findGpbRule(diagnosis) {
    const rules = Array.isArray(GPB_CAI_DAT.rules) ? GPB_CAI_DAT.rules : [];
    return rules.find(rule => matchesRule(diagnosis, rule)) || null;
}

function buildPatientHeader(data, includeLocation = true) {
    const locationText = includeLocation && data.room ? `${data.room} ${data.bed}`.trim() : '';
    const parts = [];
    if (locationText) parts.push(locationText);
    if (data.name) parts.push(data.name);
    if (data.mabn) parts.push(data.mabn);
    const rest = `${data.dob} (${data.age}) - ${data.gender}`.trim();
    return parts.join(' - ') + (rest ? ` - ${rest}` : '');
}

function buildPatientHeaderHtml(data, includeLocation = true) {
    const parts = [];
    if (includeLocation && data.room) parts.push(escapeHtml(`${data.room} ${data.bed || ''}`.trim()));
    parts.push(escapeHtml(data.name || ''));
    parts.push(escapeHtml(data.mabn || ''));
    const headerText = parts.filter(Boolean).join(' - ');
    return `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${headerText}</strong></h3>`;
}

function buildPatientIdentityLines(data) {
    return {
        html: `<div style='margin:2px 0;'><b>DOB</b>: ${escapeHtml(data.dob)} (${escapeHtml(data.age)}) - ${escapeHtml(data.gender)} - ${escapeHtml(data.room)} - ${escapeHtml(data.bed)}</div>`,
        text: `DOB: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}\n`
    };
}

async function buildLichMoPtvCopy(patient, { includeLocation = true } = {}) {
    const state = await loadPatientChecklistState(patient);
    const data = ReportService.formatPatientData(patient, 0, state);
    const surgery = getPatientSurgeryData(patient, state);
    if (!surgery) return null;

    const surgeryDate = surgery.ngayPhauThuat || '';
    const surgeryTime = surgery.gioPhauThuat || '';
    const header = buildPatientHeader(data, includeLocation);
    const surgeryDisplay = surgeryDate && surgeryTime ? `${surgeryDate} ${surgeryTime}` : (surgeryDate || surgeryTime || '');

    const ptvDoctors = surgery.doctors || surgery.bacSi || surgery.bacSiPhauThuat || '';

    const html = [
        `<div style='margin-bottom:8px; line-height:1.15;'>`,
        buildPatientHeaderHtml(data, includeLocation),
        `<div style='margin:2px 0;'><b>DOB</b>: ${escapeHtml(data.dob)} (${escapeHtml(data.age)}) - ${escapeHtml(data.gender)} - ${escapeHtml(data.room)} - ${escapeHtml(data.bed)}</div>`,
        `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`,
        `<div style='margin:2px 0;'><b>Ngày PT</b>: ${escapeHtml(surgeryDate)}</div>`,
        `<div style='margin:2px 0;'><b>Giờ PT</b>: ${escapeHtml(surgeryTime)}</div>`,
        `<div style='margin:2px 0;'><b>PTV</b>: <span style='color:#d32f2f; font-weight:700;'>${escapeHtml(ptvDoctors || 'Chưa rõ')}</span></div>`,
        surgery.pppt ? `<div style='margin:2px 0;'><b>PPPT</b>: ${escapeHtml(surgery.pppt)}</div>` : '',
        `</div>`
    ].filter(Boolean).join('');

    const text = [
        header,
        `DOB: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}`,
        `Chẩn đoán: ${data.diagnosis}`,
        `Ngày PT: ${surgeryDate}`,
        `Giờ PT: ${surgeryTime}`,
        `PTV: ${ptvDoctors || 'Chưa rõ'}`,
        surgery.pppt ? `PPPT: ${surgery.pppt}` : ''
    ].filter(Boolean).join('\n') + '\n';

    return { html, text };
}

async function buildGpbCatLanhCopy(patient, { includeLocation = true } = {}) {
    const state = await loadPatientChecklistState(patient);
    const data = ReportService.formatPatientData(patient, 0, state);
    const surgery = getPatientSurgeryData(patient, state);
    if (!surgery) return null;

    const diagnosis = String(data.diagnosis || '').trim();
    const rule = findGpbRule(diagnosis) || {};
    const laterality = extractLateralityPhrase(diagnosis);
    const context = {
        diagnosis,
        laterality,
        room: data.room,
        bed: data.bed,
        name: data.name,
        mabn: data.mabn
    };

    const specimenTemplate = rule.mau_benh_pham || GPB_CAI_DAT.defaultFallbackSpecimen || 'Mẫu bệnh phẩm';
    const wantToKnowTemplate = rule.mong_muon_biet || GPB_CAI_DAT.defaultMongMuonBiet || '';
    const specimen = resolveTemplate(specimenTemplate, context) || diagnosis || 'Mẫu bệnh phẩm';
    const wantToKnow = resolveTemplate(wantToKnowTemplate, context) || (GPB_CAI_DAT.defaultMongMuonBiet || '');

    const surgeryDate = surgery.ngayPhauThuat || '';
    const surgeryTime = surgery.gioPhauThuat || '';
    const expected = addMinutesToSurgeryTime(surgeryDate, surgeryTime, Number(GPB_CAI_DAT.defaultExpectedMinutes || 90)) || '';
    const expectedText = expected ? `${expected.date} ${expected.time}`.trim() : '';

    const html = [
        `<div style='margin-bottom:8px; line-height:1.15;'>`,
        buildPatientHeaderHtml(data, includeLocation),
        `<div style='margin:2px 0;'><b>DOB</b>: ${escapeHtml(data.dob)} (${escapeHtml(data.age)}) - ${escapeHtml(data.gender)} - ${escapeHtml(data.room)} - ${escapeHtml(data.bed)}</div>`,
        `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`,
        `<div style='margin:2px 0;'><b>Ngày PT</b>: ${escapeHtml(surgeryDate)}</div>`,
        `<div style='margin:2px 0;'><b>Giờ PT</b>: ${escapeHtml(surgeryTime)}</div>`,
        surgery.pppt ? `<div style='margin:2px 0;'><b>PPPT</b>: ${escapeHtml(surgery.pppt)}</div>` : '',
        `<div style='margin:2px 0;'><b>Mẫu bệnh phẩm:</b> ${escapeHtml(specimen)}</div>`,
        `<div style='margin:2px 0;'><b>Mong muốn biết:</b> ${escapeHtml(wantToKnow)}</div>`,
        `<div style='margin:2px 0;'><b>Giờ có mẫu dự kiến:</b> ${escapeHtml(expectedText)}</div>`,
        `</div>`
    ].filter(Boolean).join('');

    const text = [
        buildPatientHeader(data, includeLocation),
        `DOB: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}`,
        `Chẩn đoán: ${data.diagnosis}`,
        `Ngày PT: ${surgeryDate}`,
        `Giờ PT: ${surgeryTime}`,
        surgery.pppt ? `PPPT: ${surgery.pppt}` : '',
        `Mẫu bệnh phẩm: ${specimen}`,
        `Mong muốn biết: ${wantToKnow}`,
        `Giờ có mẫu dự kiến: ${expectedText}`
    ].filter(Boolean).join('\n') + '\n';

    return { html, text, matchedRule: rule.label || '' };
}

module.exports = {
    buildLichMoPtvCopy,
    buildGpbCatLanhCopy,
    findGpbRule,
    extractLateralityPhrase
};
