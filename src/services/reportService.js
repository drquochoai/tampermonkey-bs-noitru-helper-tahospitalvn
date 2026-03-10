// reportService.js - Service for generating reports

const DateUtils = require('../utils/dateUtils');
const PatientDataMapper = require('../utils/patientDataMapper');
const ChecklistService = require('./checklistService');
const SurgeryUtils = require('../utils/surgeryUtils');

const ReportService = {
    _escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    // Deprecated: kept for reference; reports now load full checklist state
    async getPatientTreatmentPlan(mabn, ngayvv) {
        try {
            const formData = new FormData();
            formData.append('mabn', mabn + 9898);
            const { tungay, denngay } = DateUtils.getChecklistDateRange(ngayvv);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);
            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST', credentials: 'include', body: formData
            });
            const res = await response.json();
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const obj = res.data[res.data.length - 1];
                let state = {};
                if (obj && obj.chuky) {
                    try { state = JSON.parse(obj.chuky); } catch (e) { state = {}; }
                }
                return state.kehoach || '';
            }
            return '';
        } catch (error) {
            console.error('Error getting treatment plan:', error);
            return '';
        }
    },

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
            const method = phauThuat.pppt || '';
            const info = SurgeryUtils.getSurgeryDateInfo(date);
            const hpnSuffix = (info && info.postOpDay !== null) ? ` (HPN${info.postOpDay})` : '';
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
            html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${this._escapeHtml(data.diagnosis)}</div>`;
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
        html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${this._escapeHtml(data.diagnosis)}</div>`;
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
    }
};

module.exports = ReportService;
