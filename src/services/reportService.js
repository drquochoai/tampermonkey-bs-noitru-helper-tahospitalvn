// reportService.js - Service for generating reports

const DateUtils = require('../utils/dateUtils');
const PatientDataMapper = require('../utils/patientDataMapper');

const ReportService = {
    /**
     * Get treatment plan for a patient
     */
    async getPatientTreatmentPlan(mabn, ngayvv) {
        try {
            const formData = new FormData();
            formData.append('mabn', mabn + 9898);
            
            const { tungay, denngay } = DateUtils.getChecklistDateRange(ngayvv);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);

            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const res = await response.json();
            
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const obj = res.data[res.data.length - 1];
                let state = {};
                
                if (obj && obj.chuky) {
                    try {
                        state = JSON.parse(obj.chuky);
                    } catch (e) {
                        console.warn('Failed to parse treatment plan state:', e);
                        state = {};
                    }
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
     * Get treatment plans for multiple patients
     */
    async getBatchTreatmentPlans(patients) {
        // Sort patients first to maintain order in report
        const sortedPatients = PatientDataMapper.sortPatients([...patients]);
        
        const promises = sortedPatients.map(patient => 
            this.getPatientTreatmentPlan(patient.mabn, patient.ngayvv)
        );
        
        const treatmentPlans = await Promise.all(promises);
        
        return { sortedPatients, treatmentPlans };
    },

    /**
     * Format patient data for report
     */
    formatPatientData(patient, index, treatmentPlan = '') {
        const { dob, age } = this.formatDateOfBirth(patient.ngaysinh);
        const gender = patient.phai === 1 ? 'Nữ' : 'Nam';
        
        return {
            index: index + 1,
            name: patient.hoten || '',
            mabn: patient.mabn || '',
            dob,
            age,
            gender,
            room: patient.teN_PHONG || '',
            bed: patient.teN_GIUONG || '',
            diagnosis: patient.chandoanvk || '',
            treatmentPlan
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
    generateHTMLReport(patients, treatmentPlans) {
        let html = `<div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>`;
        html += `<div style="margin-bottom:10px">Số lượng bệnh nhân hiện có: <b>${patients.length}</b></div>`;
        
        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, treatmentPlans[idx]);
            
            html += `<div style='margin-bottom:12px'>`;
            html += `<h3 style='font-size:1em;margin:0 0 2px 0'><strong>${data.index}. ${data.name} - ${data.mabn}</strong> - ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed} - </h3>`;
            html += `<div><b>Chẩn đoán</b>: ${data.diagnosis}</div>`;
            html += `<div><b>Điều trị</b>: ${data.treatmentPlan}</div>`;
            html += `</div>`;
        });
        
        return html;
    },

    /**
     * Generate plain text report content
     */
    generateTextReport(patients, treatmentPlans) {
        let report = `BÁO CÁO TRỰC\nSố lượng bệnh nhân hiện có: ${patients.length}\n`;
        
        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, treatmentPlans[idx]);
            
            report += `${data.index}. ${data.bed} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
            report += `   Chẩn đoán: ${data.diagnosis}\n`;
            report += `   Điều trị: ${data.treatmentPlan}\n`;
        });
        
        return report;
    }
};

module.exports = ReportService;
