// trackedPatientService.js - Manage tracked patients (from other departments)

const ApiService = require('./apiService');
const { getSelectedKhoa } = require('../utils/khoaUtils');

const TrackedPatientService = {
    async loadTrackedPhieu(deptId) {
        const mabn = `${deptId}theodoi`;
        const formData = new FormData();
        formData.append('mabn', mabn);
        // very wide range
        formData.append('tungay', '01/01/1001 01:01');
        formData.append('denngay', '01/01/3001 01:01');

        const resp = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const result = await resp.json();
        const data = (result && result.data) || [];
        let found = data.find(item => item && item.mabn === mabn && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
        if (!found && data.length === 1 && data[0] && data[0].mabn === mabn) {
            // Accept single returned item as fallback even if it lacks the '%' marker
            found = data[0];
        }
        return found;
    },

    parseTrackedState(checklistObj) {
        if (!checklistObj || !checklistObj.chuky) return { pids: [], cache: {} };
        try {
            const parsed = JSON.parse(checklistObj.chuky);
            return {
                pids: Array.isArray(parsed?.pids) ? parsed.pids : [],
                cache: (parsed && typeof parsed.cache === 'object') ? parsed.cache : {}
            };
        } catch {
            return { pids: [], cache: {} };
        }
    },

    async createTrackedPhieu(deptId) {
        const mabn = `${deptId}theodoi`;
        const formData = new FormData();
        formData.append('status', '1');
        formData.append('thebaohiemyte', 'Không');
        formData.append('dieukhoancamket', 'true');
        formData.append('chuky', JSON.stringify({ pids: [], cache: {} }));
        formData.append('khac', '--*--');
        formData.append('khu', '1');
        formData.append('mabn', mabn);
        formData.append('bieumauid', '027');
        formData.append('makp', deptId);
        formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
        formData.append('actiontype', '');
        formData.append('hoten', `${mabn}%`);
        formData.append('ngaysinh', '10/10/1999');
        formData.append('gioitinh', 'Nam');

        const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return response.json();
    },

    async updateTrackedState(oldData, state) {
        try {
            const res = await ApiService.updateChecklistData(oldData, state);
            return res && (res.Status == 1 || res.isValid);
        } catch (e) {
            console.error('Failed to update tracked patients state:', e);
            return false;
        }
    },

    async getOrCreateTrackedPatients(deptId) {
        if (!deptId) return { checklistObj: null, pids: [] };
        
        let checklistObj = await this.loadTrackedPhieu(deptId);
        if (!checklistObj) {
            const created = await this.createTrackedPhieu(deptId);
            if (created && created.isValid && created.data) {
                checklistObj = await this.loadTrackedPhieu(deptId);
            }
        }
        
        const state = checklistObj ? this.parseTrackedState(checklistObj) : { pids: [], cache: {} };
        if (!Array.isArray(state.pids)) state.pids = [];
        if (typeof state.cache !== 'object') state.cache = {};
        return { checklistObj, pids: state.pids, cache: state.cache };
    }
};

module.exports = TrackedPatientService;
