// checklistService.js - Centralized checklist management

const DateUtils = require('../utils/dateUtils');
const ApiService = require('./apiService');

const ChecklistService = {
    /**
     * Load checklist data for a patient
     */
    async loadChecklistData(patient) {
        const formData = new FormData();
        
        // DEBUG: Try both with and without 9898 suffix
        const originalMabn = patient.mabn;
        const mabnWith9898 = patient.mabn + 9898;
        
        console.log('DEBUG - Trying both mabn formats:', { originalMabn, mabnWith9898 });
        
        // First try with 9898 suffix (original logic)
        formData.append('mabn', mabnWith9898);
        
        const { tungay, denngay } = DateUtils.getChecklistDateRange(patient.ngayvv);
        console.log('DEBUG - DateUtils.getChecklistDateRange result:', { 
            inputNgayvv: patient.ngayvv, 
            outputTungay: tungay, 
            outputDenngay: denngay 
        });
        
        formData.append('tungay', tungay);
        formData.append('denngay', denngay);

        const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();
        console.log('DEBUG - ChecklistService.loadChecklistData API response (with 9898):', result);
        
        // If no data found with 9898 suffix, try without it
        if (!result.data || result.data.length === 0) {
            console.log('DEBUG - No data with 9898 suffix, trying original mabn:', originalMabn);
            
            const fallbackFormData = new FormData();
            fallbackFormData.append('mabn', originalMabn);
            fallbackFormData.append('tungay', tungay);
            fallbackFormData.append('denngay', denngay);
            
            const fallbackResponse = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: fallbackFormData
            });
            
            const fallbackResult = await fallbackResponse.json();
            console.log('DEBUG - ChecklistService.loadChecklistData API response (original mabn):', fallbackResult);
            
            return fallbackResult;
        }
        
        return result;
    },

    /**
     * Find existing checklist object from response data
     */
    findChecklistObject(responseData) {
        console.log('DEBUG - findChecklistObject input:', responseData);
        
        if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
            console.log('DEBUG - No data array or empty array');
            return null;
        }

        console.log('DEBUG - Searching through', responseData.data.length, 'checklist objects');
        
        for (let i = 0; i < responseData.data.length; i++) {
            const item = responseData.data[i];
            console.log(`DEBUG - Checklist object ${i}:`, item);
            
            if (typeof item.hoten === 'string' && item.hoten.trim().endsWith('%')) {
                console.log('DEBUG - Found matching checklist object with hoten ending with %');
                return item;
            }
        }
        
        console.log('DEBUG - No matching checklist object found');
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
     * Load checklist state for a patient (combination of loadChecklistData and parseChecklistState)
     */
    async loadChecklistState(checklistObj) {
        try {
            // If we already have a checklist object, just parse its state
            if (checklistObj && checklistObj.chuky) {
                return this.parseChecklistState(checklistObj);
            }

            // Otherwise, we need to construct a patient object and load data
            const patient = {
                mabn: checklistObj.mabn,
                mavaovien: checklistObj.mavaovien,
                ngayvv: checklistObj.tungay // Use tungay as ngayvv for date range calculation
            };

            console.log('DEBUG - checklistService.loadChecklistState patient object:', patient);

            const responseData = await this.loadChecklistData(patient);
            const foundChecklistObj = this.findChecklistObject(responseData);
            
            if (foundChecklistObj) {
                return this.parseChecklistState(foundChecklistObj);
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to load checklist state:', error);
            return null;
        }
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
