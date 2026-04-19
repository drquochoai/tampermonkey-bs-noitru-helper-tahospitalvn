// apiService.js - Centralized API service
const { getSelectedKhoa } = require('../utils/khoaUtils');

const ApiService = {
    _pickFirstValue(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) return '';
        for (let i = 0; i < keys.length; i += 1) {
            const v = obj[keys[i]];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    },

    _extractToDieuTriRows(payload) {
        if (Array.isArray(payload)) return payload;
        if (!payload || typeof payload !== 'object') return [];

        const candidates = [
            payload.data,
            payload.Data,
            payload.rows,
            payload.Rows,
            payload.result,
            payload.Result,
            payload.items,
            payload.Items
        ];
        for (let i = 0; i < candidates.length; i += 1) {
            if (Array.isArray(candidates[i])) return candidates[i];
        }
        return [];
    },

    /**
     * Load list of khoa/phòng (departments)
     */
    async fetchKhoaPhong() {
        const body = new URLSearchParams();
        body.set('loaibn', '');
        body.set('makp', '');
        const res = await fetch('/ToDieuTri/LoadKhoaPhong', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            },
            body
        });
        const json = await res.json();
        return (json && json.data) || [];
    },

    /**
     * Load rooms by khoa id
     */
    async fetchRoomsByKhoa(khoaId) {
        const body = new URLSearchParams();
        body.set('code', String(khoaId || ''));
        const res = await fetch('/ToDieuTri/LoadRoom', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            },
            body
        });
        const json = await res.json();
        return (json && json.data) || [];
    },
    /**
     * Fetch patient data from ToDieuTri endpoint
     */
    async fetchToDieuTriData() {
        try {
            const formData = new FormData();
            const khoa = getSelectedKhoa('551');
            formData.append('khoa', khoa);
            formData.append('tk', '0');
            formData.append('cbAll', '1');

            const response = await fetch('/ToDieuTri/Search', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': '*/*'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return data;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu ToDieuTri:', error);
            throw error;
        }
    },

    /**
     * Fetch all inpatients from Search endpoint without khoa filter.
     */
    async fetchToDieuTriDataAllKhoa() {
        try {
            const formData = new FormData();
            formData.append('tk', '0');
            formData.append('cbAll', '1');

            const response = await fetch('/ToDieuTri/Search', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': '*/*'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const contentType = String(response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/json')) {
                return await response.json();
            }
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (_) {
                return { data: [] };
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu ToDieuTri (all khoa):', error);
            throw error;
        }
    },

    /**
     * Build unique active khoa/phong list from current Search data.
     * Uses a single-pass Map for speed on large patient datasets.
     */
    async fetchActiveKhoaPhongFromSearch() {
        const payload = await this.fetchToDieuTriDataAllKhoa();
        const rows = this._extractToDieuTriRows(payload);
        const uniq = new Map();

        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i] || {};
            const makp = this._pickFirstValue(row, ['makp', 'maKP', 'khoa', 'khoA_ID', 'makhoa', 'MAKP', 'Makp']);
            const tenkp = this._pickFirstValue(row, ['tenkp', 'teN_KP', 'tenkhoa', 'teN_KHOA', 'khoaphong', 'TENKP', 'Tenkp']);
            if (!makp || !tenkp) continue;

            const key = `${makp}::${tenkp.toLowerCase()}`;
            const existing = uniq.get(key);
            if (existing) {
                existing.patientCount += 1;
            } else {
                uniq.set(key, {
                    id: makp,
                    name: tenkp,
                    patientCount: 1
                });
            }
        }

        return Array.from(uniq.values())
            .sort((a, b) => {
                const byName = String(a.name || '').localeCompare(String(b.name || ''), 'vi');
                if (byName !== 0) return byName;
                return String(a.id || '').localeCompare(String(b.id || ''));
            });
    },

    /**
     * Fetch a specific patient's data by PID
     */
    async fetchPatientByPID(pid) {
        try {
            const formData = new FormData();
            formData.append('loaibn', '');
            formData.append('mabn', pid);
            formData.append('tk', '0');
            formData.append('cbAll', '1');

            const response = await fetch('/ToDieuTri/Search', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': '*/*'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return data;
        } catch (error) {
            console.error(`Lỗi khi lấy dữ liệu patient PID ${pid}:`, error);
            throw error;
        }
    },

    /**
     * Update checklist data
     */
    async updateChecklistData(oldData, checklistState, { signal } = {}) {
        try {
            const formData = new FormData();
            
            // Add all old data fields
            for (const key in oldData) {
                if (Object.prototype.hasOwnProperty.call(oldData, key)) {
                    formData.append(key.toLowerCase(), oldData[key] == null ? '' : oldData[key]);
                }
            }
            
            // Update checklist state
            formData.set('chuky', JSON.stringify(checklistState));

            const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/EditAjax', {
                method: 'POST',
                credentials: 'include',
                body: formData,
                signal
            });

            return response.json();
        } catch (error) {
            console.error('Lỗi cập nhật checklist phiếu:', error);
            throw error;
        }
    },

    /**
     * Create new checklist for patient
     */
    async createChecklistForPatient(patient) {
        try {
            const formData = new FormData();
            formData.append('status', '1');
            formData.append('thebaohiemyte', patient.thebaohiemyte || 'Không');
            formData.append('chuky', '{}');
            formData.append('khac', '--*--');
            formData.append('khu', patient.khu || '1');
            formData.append('mabn', patient.mabn + 9898);
            formData.append('bieumauid', '027');
            // prefer patient's makp; fallback to selected khoa
            const makp = (patient.makp || getSelectedKhoa('551'));
            formData.append('makp', makp);
            formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
            formData.append('actiontype', '');
            formData.append('hoten', (patient.hoten || '') + "%");
            formData.append('ngaysinh', '10/10/1999');
            formData.append('gioitinh', patient.phai === 1 ? 'Nữ' : 'Nam');
            formData.append('diachi', patient.diachi || '');
            formData.append('sdt', patient.sdt || '');

            const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            return response.json();
        } catch (error) {
            console.error('Lỗi tạo mới checklist phiếu:', error);
            throw error;
        }
    }
};

module.exports = ApiService;
