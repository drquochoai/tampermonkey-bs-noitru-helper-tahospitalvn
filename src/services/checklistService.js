// checklistService.js - Centralized checklist management

const DateUtils = require('../utils/dateUtils');
const ApiService = require('./apiService');

const ChecklistService = {
    /**
     * Load checklist data for a patient
     */
    async loadChecklistData(patient) {
        const formData = new FormData();
        formData.append('mabn', patient.mabn + 9898);
        
        const { tungay, denngay } = DateUtils.getChecklistDateRange(patient.ngayvv);
        formData.append('tungay', tungay);
        formData.append('denngay', denngay);

        const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        return response.json();
    },

    /**
     * Find existing checklist object from response data
     */
    findChecklistObject(responseData) {
        if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
            return null;
        }

        for (let i = 0; i < responseData.data.length; i++) {
            if (typeof responseData.data[i].hoten === 'string' && responseData.data[i].hoten.trim().endsWith('%')) {
                return responseData.data[i];
            }
        }
        return null;
    },

    /**
     * Parse checklist state from checklist object
     */
    parseChecklistState(checklistObj) {
        let state = {};
        if (checklistObj && checklistObj.chuky) {
            try {
                state = JSON.parse(checklistObj.chuky);
            } catch (e) {
                console.warn('Failed to parse checklist state:', e);
                state = {};
            }
        }
        return state;
    },

    /**
     * Update checklist state on server
     */
    async updateChecklistState(checklistObj, checklistState) {
        try {
            const result = await ApiService.updateChecklistData(checklistObj, checklistState);
            return result && result.Status == 1;
        } catch (error) {
            console.error('Failed to update checklist state:', error);
            return false;
        }
    },

    /**
     * Create new checklist for patient
     */
    async createNewChecklist(patient) {
        try {
            const result = await ApiService.createChecklistForPatient(patient);
            return result && result.isValid;
        } catch (error) {
            console.error('Failed to create new checklist:', error);
            return false;
        }
    }
};

module.exports = ChecklistService;
