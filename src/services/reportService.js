// reportService.js - Service for generating reports

const DateUtils = require('../utils/dateUtils');
const PatientDataMapper = require('../utils/patientDataMapper');
const ChecklistService = require('./checklistService');
const SurgeryUtils = require('../utils/surgeryUtils');
const { escapeHtml } = require('../utils/htmlUtils');

const ReportService = {

    /**
     * Load checklist state for multiple patients (sorted).
     * Options:
     *   preferInMemory (boolean, default false): if true, use the checklistState already
     *   present in window.dr_data[patient] (updated real-time by sidebar edits) and skip
     *   the server fetch for those patients. Only patients without in-memory state are fetched.
     */
    async getBatchChecklistStates(patients, { preferInMemory = false } = {}) {
        const sortedPatients = PatientDataMapper.sortPatients([...patients]);

        // Build a lookup of in-memory checklistState from window.dr_data (if available)
        const inMemoryMap = {};
        if (preferInMemory && typeof window !== 'undefined' && window.dr_data && Array.isArray(window.dr_data)) {
            for (const p of window.dr_data) {
                if (p && p.mabn && p.checklistState) {
                    inMemoryMap[p.mabn] = p.checklistState;
                }
            }
        }

        const promises = sortedPatients.map(async (patient) => {
            // Use in-memory state if available (real-time updated by sidebar)
            if (preferInMemory && patient && patient.mabn && inMemoryMap[patient.mabn]) {
                return inMemoryMap[patient.mabn];
            }
            // Otherwise fetch from server
            try {
                const res = await ChecklistService.loadChecklistData(patient);
                const obj = ChecklistService.findChecklistObject(res);
                return obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
            } catch (e) {
                console.warn('Failed to load checklist state for', patient?.mabn, e);
                return {};
            }
        });
        const states = await Promise.all(promises);
        return { sortedPatients, states };
    },

    /**
     * Format patient data for report
     */
    formatPatientData(patient, index, state = {}) {
        const { dob, age } = this.formatDateOfBirth(patient.ngaysinh);
        const gender = patient.phai === 1 ? 'Nữ' : 'Nam';
        const phauThuat = PatientDataMapper.mapPhauThuatData(state);
        const hxt = (state && typeof state.huongXuTri === 'string') ? state.huongXuTri.trim() : '';
        const cdkt = (state && typeof state.chanDoanKemTheo === 'string') ? state.chanDoanKemTheo.trim() : '';

        // Build surgery displays similar to dr-card
        let ppptDisplay = '';
        let ngayPtDisplay = '';
        if (phauThuat) {
            const date = phauThuat.ngayPhauThuat || '';
            const time = phauThuat.gioPhauThuat || '';
            const method = phauThuat.pppt || '';
            const info = SurgeryUtils.getSurgeryDateInfo(date);
            
            let hpnSuffix = '';
            if (info && info.postOpDay !== null) {
                if (info.postOpDay === 0) {
                    // Check if surgery time has passed
                    try {
                        const now = new Date();
                        const [d, m, y] = date.split('/').map(Number);
                        const [hh, mm] = time.split(':').map(Number);
                        const surgeryDate = new Date(y, m - 1, d, hh || 0, mm || 0);
                        if (now >= surgeryDate) {
                            hpnSuffix = ' (HPN0)';
                        }
                    } catch (_) {
                        // Fallback to showing it if we can't parse
                        hpnSuffix = ' (HPN0)';
                    }
                } else {
                    hpnSuffix = ` (HPN${info.postOpDay})`;
                }
            }
            // Show PPPT with HPNx when available
            ppptDisplay = `${method}${hpnSuffix}`.trim();
            // Show only the surgery date (no time)
            ngayPtDisplay = date;
        }

        return {
            index: index + 1,
            name: patient.hoten || '',
            mabn: patient.mabn || '',
            dob,
            age,
            gender,
            room: patient.teN_PHONG || '',
            bed: patient.teN_GIUONG || '',
            diagnosis: `${patient.chandoanvk || ''}${cdkt ? '; ' + cdkt : ''}`,
            hxt,
            ppptDisplay,
            ngayPtDisplay
        };
    },

    /**
     * Format date of birth and calculate age
     */
    formatDateOfBirth(ngaysinh) {
        let dob = '';
        let age = '';

        if (ngaysinh) {
            let d = ngaysinh.split('T')[0];

            if (d.includes('-')) {
                const [y, m, day] = d.split('-');
                dob = `${day}/${m}/${y}`;
                age = (new Date().getFullYear() - parseInt(y, 10)).toString() + 't';
            } else if (d.includes('/')) {
                dob = d;
                const y = d.split('/')[2];
                age = (new Date().getFullYear() - parseInt(y, 10)).toString() + 't';
            }
        }

        return { dob, age };
    },

    /**
     * Generate HTML report content
     */
    generateHTMLReport(patients, states) {
        let html = ``;
        // html += `<div style="margin-bottom:10px">Số lượng bệnh nhân hiện có: <b>${patients.length}</b></div>`;

        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, states[idx] || {});

            html += `<div style='margin-bottom:8px; line-height:1.15;'>`;
            html += `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${data.index}. ${data.name} - ${data.mabn}</strong></h3>`;
            html += `<div style='margin:2px 0;'><b>DOB</b>: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}</div>`;
            html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`;
            if (data.ppptDisplay) html += `<div style='margin:2px 0;'><b>PPPT</b>: ${data.ppptDisplay}</div>`;
            if (data.ngayPtDisplay) html += `<div style='margin:2px 0;'><b>Ngày PT</b>: ${data.ngayPtDisplay}</div>`;
            if (data.hxt) html += `<div style='margin:2px 0;'><b>HXT</b>: ${data.hxt.replace(/\n/g, '<br>')}</div>`;
            html += `</div>`;
        });

        return html;
    },

    /**
     * Generate HTML for a single patient (no numbering)
     */
    generateSingleHTML(patient, state = {}) {
        const data = this.formatPatientData(patient, 0, state);
        let html = ``;
        html += `<div style='margin-bottom:8px; line-height:1.15;'>`;
        html += `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${data.name} - ${data.mabn}</strong></h3>`;
        html += `<div style='margin:2px 0;'><b>DOB</b>: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}</div>`;
        html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`;
        if (data.ppptDisplay) html += `<div style='margin:2px 0;'><b>PPPT</b>: ${data.ppptDisplay}</div>`;
        if (data.ngayPtDisplay) html += `<div style='margin:2px 0;'><b>Ngày PT</b>: ${data.ngayPtDisplay}</div>`;
        if (data.hxt) html += `<div style='margin:2px 0;'><b>HXT</b>: ${data.hxt.replace(/\n/g, '<br>')}</div>`;
        html += `</div>`;
        return html;
    },

    /**
     * Generate plain text report content
     */
    generateTextReport(patients, states) {
        let report = `BÁO CÁO TRỰC\nSố lượng bệnh nhân hiện có: ${patients.length}\n`;

        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, states[idx] || {});

            report += `${data.index}. ${data.bed} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
            report += `   Chẩn đoán: ${data.diagnosis}\n`;
            if (data.ppptDisplay) report += `   PPPT: ${data.ppptDisplay}\n`;
            if (data.ngayPtDisplay) report += `   Ngày PT: ${data.ngayPtDisplay}\n`;
            if (data.hxt) report += `   HXT: ${data.hxt}\n`;
        });

        return report;
    }
    ,
    /**
     * Generate plain text for a single patient (no numbering)
     */
    generateSingleText(patient, state = {}) {
        const data = this.formatPatientData(patient, 0, state);
        let report = '';
        report += `${data.bed} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
        report += `Chẩn đoán: ${data.diagnosis}\n`;
        if (data.ppptDisplay) report += `PPPT: ${data.ppptDisplay}\n`;
        if (data.ngayPtDisplay) report += `Ngày PT: ${data.ngayPtDisplay}\n`;
        if (data.hxt) report += `HXT: ${data.hxt}\n`;
        return report;
    },

    /**
     * Specialized report for upcoming surgeries (PT ngày mai).
     * Header: [STT]. [Giờ] - [Tên bệnh nhân] - [MABN]
     * Row: Bác sĩ thực hiện: [Bác sĩ]
     * Sorted by surgery time ascending.
     */
    generateSurgerySpecialReport(patients, states) {
        // Zip patients and states for sorting
        const zipped = patients.map((p, idx) => ({
            p,
            s: states[idx] || {},
            pt: PatientDataMapper.mapPhauThuatData(states[idx]) || {}
        }));

        // Sort by surgery time ascending
        zipped.sort((a, b) => {
            const timeA = a.pt.time || a.pt.gioPhauThuat || '99:99';
            const timeB = b.pt.time || b.pt.gioPhauThuat || '99:99';
            return timeA.localeCompare(timeB);
        });

        let html = '';
        let text = 'DANH SÁCH PHẪU THUẬT\n\n';

        zipped.forEach((item, idx) => {
            const data = this.formatPatientData(item.p, idx, item.s);
            const time = item.pt.time || item.pt.gioPhauThuat || '--:--';
            const doctors = item.pt.doctors || item.pt.bacSiPhauThuat || 'Chưa rõ';

            // HTML - Standardized style
            html += `<div style='margin-bottom:12px; line-height:1.15;'>`;
            html += `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${data.index}. ${time} - ${data.name} - ${data.mabn}</strong></h3>`;
            html += `<div style='margin:2px 0;'><b>DOB</b>: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}</div>`;
            html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`;
            html += `<div style='margin:2px 0;'><b>PTV</b>: <span style='color:#d32f2f; font-weight:700;'>${item.pt.bacSi || 'Chưa rõ'}</span></div>`;
            if (data.ppptDisplay) html += `<div style='margin:2px 0;'><b>PPPT</b>: ${data.ppptDisplay}</div>`;
            html += `</div>`;

            // Text
            text += `${data.index}. ${time} - ${data.name} - ${data.mabn}\n`;
            text += `   PTV: ${item.pt.bacSi || 'Chưa rõ'}\n`;
            text += `   Chẩn đoán: ${data.diagnosis}\n`;
            if (data.ppptDisplay) text += `   PPPT: ${data.ppptDisplay}\n`;
        });

        return { html, text };
    }
};

module.exports = ReportService;
