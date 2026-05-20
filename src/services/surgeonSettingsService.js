// surgeonSettingsService.js - Store selected surgeons per khoa using checklist-like records

const ApiService = require('./apiService');

function makeKeyForKhoa(khoaId) {
    return `${String(khoaId)}%h991h otm.dsbacsi`;
}

async function loadRecordForKhoa(khoaId) {
    const key = makeKeyForKhoa(khoaId);
    const formData = new FormData();
    formData.append('mabn', key);
    // Use a very wide range to ensure the special record is returned
    formData.append('tungay', '01/01/1001 01:01');
    formData.append('denngay', '01/01/3001 01:01');
    const resp = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    const result = await resp.json();
    const data = (result && result.data) || [];
    let found = data.find(item => item && item.mabn === key && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
    if (!found && data.length === 1 && data[0] && data[0].mabn === key) {
        found = data[0];
    }
    return found;
}

async function createRecordForKhoa(khoaId) {
    const key = makeKeyForKhoa(khoaId);
    const formData = new FormData();
    formData.append('status', '1');
    formData.append('thebaohiemyte', 'Không');
    // Initialize with empty list
    formData.append('chuky', JSON.stringify({ otm: { dsbacsi: [] } }));
    formData.append('khac', '--*--');
    formData.append('khu', '1');
    formData.append('mabn', key);
    formData.append('bieumauid', '027');
    // Use a fixed marker date as per convention
    formData.append('makp', '551');
    formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
    formData.append('actiontype', '');
    formData.append('hoten', `${key}%`);
    formData.append('ngaysinh', '10/10/1010');
    formData.append('gioitinh', 'Nam');
    const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    return response.json();
}

function parseState(obj) {
    if (!obj || !obj.chuky) return { otm: { dsbacsi: [] } };
    try {
        const parsed = JSON.parse(obj.chuky);
        if (parsed && parsed.otm && Array.isArray(parsed.otm.dsbacsi)) return parsed;
        // normalize
        const arr = parsed && (parsed.dsbacsi || parsed.surgeons || []);
        return { otm: { dsbacsi: Array.isArray(arr) ? arr : [] } };
    } catch (_) {
        return { otm: { dsbacsi: [] } };
    }
}

const SurgeonSettingsService = {
    makeKeyForKhoa,
    async getOrCreateRecord(khoaId) {
        let obj = await loadRecordForKhoa(khoaId);
        if (!obj) {
            const created = await createRecordForKhoa(khoaId);
            if (created && (created.isValid || created.Status == 1)) {
                obj = await loadRecordForKhoa(khoaId);
            }
        }
        return obj;
    },
    async loadSurgeonList(khoaId) {
        const obj = await loadRecordForKhoa(khoaId);
        const state = parseState(obj);
        return { list: state.otm.dsbacsi || [], obj };
    },
    async saveSurgeonList(khoaId, fullnames) {
        const obj = await this.getOrCreateRecord(khoaId);
        if (!obj) return { ok: false };
        const next = { otm: { dsbacsi: Array.from(new Set((fullnames || []).map(s => String(s).trim()).filter(Boolean))) } };
        const res = await ApiService.updateChecklistData(obj, next);
        const ok = res && (res.Status == 1 || res.isValid);
        return { ok };
    }
};

module.exports = SurgeonSettingsService;
