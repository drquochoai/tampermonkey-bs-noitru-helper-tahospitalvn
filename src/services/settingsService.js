// settingsService.js - Manage settings stored in a checklist-like phiếu using doctor name as mabn

const ApiService = require('./apiService');

const SettingsService = {
    async fetchDoctorName() {
        try {
            const body = new URLSearchParams();
            body.set('FilterProperty', '');
            body.set('FilterBy', '');
            body.set('Page', '1');
            body.set('PageSize', '20');
            body.set('OrderProperty', '');
            body.set('OrderBy', '');
            body.set('id', '');
            body.set('_key', 'change-pin-chung-thu-so');

            const response = await fetch('/sp-admin/change-pin-chung-thu-so/Form', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body
            });

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const input = doc.querySelector('#HoTen');
            let name = '';
            if (input) {
                name = (input.value || input.getAttribute('value') || '').trim();
            }
            return name;
        } catch (e) {
            console.error('Failed to fetch doctor name:', e);
            return '';
        }
    },

    async loadSettingsPhieu(doctorName) {
        // Use DSPhieu API with doctorName as mabn
        const formData = new FormData();
        formData.append('mabn', doctorName);
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
        // Pick first item that looks like our settings (hoten endsWith % and mabn==doctorName)
        const found = data.find(item => item && item.mabn === doctorName && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
        return found;
    },

    parseSettingsState(checklistObj) {
        if (!checklistObj || !checklistObj.chuky) return {};
        try {
            const parsed = JSON.parse(checklistObj.chuky);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    },

    async createSettingsPhieu(doctorName) {
        // Reuse CreateAjax endpoint with doctorName as mabn
        const formData = new FormData();
        formData.append('status', '1');
        formData.append('thebaohiemyte', 'Không');
        formData.append('chuky', '{}');
        formData.append('khac', '--*--');
        formData.append('khu', '1');
        formData.append('mabn', doctorName);
        formData.append('bieumauid', '027');
        formData.append('makp', '551');
        formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
        formData.append('actiontype', '');
        // Mark with name% so it can be identified and matched by endsWith('%')
        formData.append('hoten', `${doctorName}%`);
        formData.append('ngaysinh', '10/10/1999');
        formData.append('gioitinh', 'Nam');

        const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return response.json();
    },

    async updateSettingsState(oldData, settingsState) {
        try {
            const res = await ApiService.updateChecklistData(oldData, settingsState);
            return res && (res.Status == 1 || res.isValid);
        } catch (e) {
            console.error('Failed to update settings state:', e);
            return false;
        }
    },

    getDefaultSettings() {
        return {
            danDoRaVien: [
                'Uống thuốc đúng toa được dặn',
                'Tái khám đúng hẹn',
                'Liên hệ khi có dấu hiệu bất thường'
            ]
        };
    },

    async getOrCreateSettings() {
        const doctorName = await this.fetchDoctorName();
        if (!doctorName) {
            return { doctorName: '', checklistObj: null, settings: this.getDefaultSettings() };
        }
        let checklistObj = await this.loadSettingsPhieu(doctorName);
        if (!checklistObj) {
            const created = await this.createSettingsPhieu(doctorName);
            if (created && created.isValid && created.data) {
                // Some CreateAjax returns full object, some just flags; re-read list to get object
                checklistObj = await this.loadSettingsPhieu(doctorName);
            }
        }
        const settings = checklistObj ? this.parseSettingsState(checklistObj) : this.getDefaultSettings();
        if (!settings.danDoRaVien) settings.danDoRaVien = this.getDefaultSettings().danDoRaVien;
        return { doctorName, checklistObj, settings };
    }
};

module.exports = SettingsService;
