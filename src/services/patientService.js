// patientService.js - Centralized patient data fetching

const { fetchToDieuTriData } = require('../pages/page.dashboard.support');
const PatientDataMapper = require('../utils/patientDataMapper');
const LoginHandler = require('../components/loginHandler');
const ChecklistService = require('./checklistService');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

const PatientService = {
    /**
     * Fetch and process patient data
     */
    async fetchPatientData() {
        try {
            const data = await fetchToDieuTriData();
            console.log('Dữ liệu ToDieuTri đã được lấy:', data);

            let arr = Array.isArray(data) ? data : (data && data.data ? data.data : []);

            if (!arr || arr.length === 0) {
                return [];
            }

            // DEBUG: Check raw tungay format before mapping
            console.log('DEBUG - Raw tungay format from API:');
            arr.slice(0, 3).forEach((item, index) => {
                console.log(`Raw item ${index + 1} - mabn: ${item.mabn}, tungay: ${item.tungay}, typeof: ${typeof item.tungay}`);
            });

            return PatientDataMapper.mapPatientArray(arr);
        } catch (error) {
            console.error('Error fetching patient data:', error);
            throw error;
        }
    },

    /**
     * Enrich patient data with checklist information including surgery data
     */
    async enrichPatientDataWithChecklist(patients) {
        if (!Array.isArray(patients) || patients.length === 0) {
            return patients;
        }

        console.log('Starting to enrich patient data with checklist information for', patients.length, 'patients');

        const ChecklistAPIModule = require('./checklistAPIModule');
        const batchSize = 5;
        const enrichedPatients = [...patients]; // Copy array to avoid mutation

        for (let i = 0; i < patients.length; i += batchSize) {
            const batch = patients.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(patients.length / batchSize)}`);

            const batchPromises = batch.map(async (patient, batchIndex) => {
                const actualIndex = i + batchIndex;
                try {
                    console.log('Loading checklist for patient:', patient.mabn, 'with ngayvv:', patient.ngayvv);

                    // Use unified ChecklistAPIModule for consistent mabn handling
                    const result = await ChecklistAPIModule.getChecklistData(patient);
                    if (result && result.state) {
                        console.log('Checklist state loaded for patient:', patient.mabn);

                        // Store checklist state for y lệnh tags
                        enrichedPatients[actualIndex].checklistState = result.state;
                        syncPatientStateToGlobal(patient.mabn, result.state);

                        // Map surgery data from checklist
                        const surgeryData = PatientDataMapper.mapPhauThuatData(result.state);
                        if (surgeryData) {
                            console.log('Surgery data mapped for patient:', patient.mabn);
                            enrichedPatients[actualIndex].phauThuatInfo = surgeryData;
                        } else {
                            console.log('No surgery data found for patient:', patient.mabn);
                        }
                    } else {
                        console.log('No checklist state found for patient:', patient.mabn);
                    }
                } catch (error) {
                    console.warn('Failed to load checklist for patient:', patient.mabn, error);
                }
            });

            // Wait for current batch to complete before proceeding
            await Promise.all(batchPromises);

            // Small delay between batches to be nice to the server
            if (i + batchSize < patients.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('Enrichment completed. Patients with surgery info:',
            enrichedPatients.filter(p => p.phauThuatInfo).length);

        // Check for celebration animations after enrichment
        setTimeout(() => {
            if (typeof window.checkAllCelebrationAnimations === 'function') {
                window.checkAllCelebrationAnimations(enrichedPatients);
            }
        }, 200);

        return enrichedPatients;
    },

    /**
     * Get patient data from window.dr_data or fetch from API
     */
    async getPatientData(options = {}) {
        const { forceRefresh = false } = options || {};
        const selectedKhoa = String(getSelectedKhoa('551') || '551');

        // Check if data already exists in window
        if (!forceRefresh && window.dr_data && Array.isArray(window.dr_data) && window.dr_data.length > 0 && String(window.dr_data_khoa_id || '') === selectedKhoa) {
            return window.dr_data;
        }


        // Fetch basic patient data from API first (fast)
        const basicData = await this.fetchPatientData();

        // Store basic data immediately for fast initial render
        window.dr_data = basicData;
        window.dr_data_khoa_id = selectedKhoa;

        // Start enrichment in background (don't wait for it)
        this.enrichPatientDataInBackground(basicData);

        return basicData;
    },

    /**
     * Enrich patient data in background without blocking initial render
     */
    async enrichPatientDataInBackground(patients) {
        console.log('Starting background enrichment for', patients.length, 'patients');

        try {
            const enrichedData = await this.enrichPatientDataWithChecklist(patients);

            // Update the global data
            window.dr_data = enrichedData;

            // Trigger re-render of cards with updated data
            if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.refreshPatientCards === 'function') {
                unsafeWindow.refreshPatientCards(enrichedData);
            } else if (typeof this !== 'undefined' && typeof this.refreshPatientCards === 'function') {
                this.refreshPatientCards(enrichedData);
            } else if (typeof globalThis.refreshPatientCards === 'function') {
                globalThis.refreshPatientCards(enrichedData);
            } else if (typeof window.refreshPatientCards === 'function') {
                window.refreshPatientCards(enrichedData);
            }

            console.log('Background enrichment completed');

            // Check for celebration animations after background enrichment
            setTimeout(() => {
                if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.checkAllCelebrationAnimations === 'function') {
                    unsafeWindow.checkAllCelebrationAnimations(enrichedData);
                } else if (typeof this !== 'undefined' && typeof this.checkAllCelebrationAnimations === 'function') {
                    this.checkAllCelebrationAnimations(enrichedData);
                } else if (typeof globalThis.checkAllCelebrationAnimations === 'function') {
                    globalThis.checkAllCelebrationAnimations(enrichedData);
                } else if (typeof window.checkAllCelebrationAnimations === 'function') {
                    window.checkAllCelebrationAnimations(enrichedData);
                }
            }, 200);
        } catch (error) {
            console.error('Background enrichment failed:', error);
        }
    },

    /**
     * Load surgery info for a specific patient (for immediate use)
     */
    async loadPatientSurgeryInfo(patient) {
        try {
            const checklistObj = {
                mabn: patient.mabn,
                mavaovien: patient.mavaovien,
                tungay: patient.tungay
            };

            const checklistState = await ChecklistService.loadChecklistState(checklistObj);
            if (checklistState) {
                const surgeryData = PatientDataMapper.mapPhauThuatData(checklistState);
                return surgeryData;
            }
            return null;
        } catch (error) {
            console.warn('Failed to load surgery info for patient:', patient.mabn, error);
            return null;
        }
    },

    /**
     * Handle patient data loading with error handling
     */
    async loadPatientDataWithErrorHandling(options = {}) {
        try {
            return await this.getPatientData(options);
        } catch (error) {
            console.error('Failed to load patient data:', error);
            LoginHandler.handleLoginRequired();
            return null;
        }
    }
};

module.exports = PatientService;
