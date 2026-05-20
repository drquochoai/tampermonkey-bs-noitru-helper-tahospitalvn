// settingsService.js - Manage settings stored in a checklist-like phiếu using doctor name as mabn

const ApiService = require('./apiService');
const { getSelectedKhoa } = require('../utils/khoaUtils');

const CLOUD_ACCOUNTS_VERSION = 1;
const CLOUD_ACCOUNTS_ALG_AES = 'AES-GCM';
const CLOUD_ACCOUNTS_ALG_FALLBACK = 'XOR-B64';

function toBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i += 1) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function fromBase64(base64Text) {
    const binary = atob(base64Text || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function xorBytes(inputBytes, keyBytes) {
    if (!inputBytes || !keyBytes || keyBytes.length === 0) return inputBytes;
    const output = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i += 1) {
        output[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return output;
}

function normalizeAccountList(list) {
    if (!Array.isArray(list)) return [];
    return list
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            return {
                title: String(item.title || '').trim(),
                username: String(item.username || '').trim(),
                password: String(item.password || '')
            };
        })
        .filter((item) => item && item.username);
}

function buildCryptoSeed(context) {
    const chungThuSo = String((context && context.chungThuSo) || '').trim();
    const doctorName = String((context && context.doctorName) || '').trim();
    const source = chungThuSo || doctorName || 'anonymous';
    return `dr.cloud.accounts.v1::${source}`;
}

async function deriveAesKey(seed) {
    try {
        if (!window.crypto || !window.crypto.subtle) return null;
        const encoder = new TextEncoder();
        const raw = encoder.encode(String(seed || ''));
        const digest = await window.crypto.subtle.digest('SHA-256', raw);
        return await window.crypto.subtle.importKey(
            'raw',
            digest,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (_) {
        return null;
    }
}

async function encryptWithAesGcm(plainText, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(String(plainText || ''))
    );
    return {
        iv: toBase64(iv),
        data: toBase64(new Uint8Array(encrypted))
    };
}

async function decryptWithAesGcm(ivBase64, dataBase64, key) {
    const iv = fromBase64(ivBase64 || '');
    const cipher = fromBase64(dataBase64 || '');
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipher
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

const SettingsService = {
    async fetchDoctorInfo() {
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
            const nameInput = doc.querySelector('#HoTen');
            const ctsInput = doc.querySelector('#ChungThuSo');
            
            let name = '';
            if (nameInput) {
                name = (nameInput.value || nameInput.getAttribute('value') || '').trim();
            }
            let chungThuSo = '';
            if (ctsInput) {
                chungThuSo = (ctsInput.value || ctsInput.getAttribute('value') || '').trim();
            }

            return { name, chungThuSo };
        } catch (e) {
            console.error('Failed to fetch doctor info:', e);
            return { name: '', chungThuSo: '' };
        }
    },

    async loadSettingsPhieu(chungThuSo) {
        // Use DSPhieu API with chungThuSo as mabn
        const formData = new FormData();
        formData.append('mabn', chungThuSo);
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
        // Pick first item that matches mabn==chungThuSo and hoten endsWith %
        let found = data.find(item => item && item.mabn === chungThuSo && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
        // Fallback: if API returned exactly one candidate for this chungThuSo, accept it even without the '%' marker
        if (!found && data.length === 1 && data[0] && data[0].mabn === chungThuSo) {
            found = data[0];
        }
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

    async encodeCloudAccounts(accounts, context) {
        const normalized = normalizeAccountList(accounts);
        const payloadText = JSON.stringify({
            accounts: normalized,
            updatedAt: Date.now()
        });
        const seed = buildCryptoSeed(context);
        const key = await deriveAesKey(seed);

        if (key) {
            const encrypted = await encryptWithAesGcm(payloadText, key);
            return {
                v: CLOUD_ACCOUNTS_VERSION,
                alg: CLOUD_ACCOUNTS_ALG_AES,
                iv: encrypted.iv,
                data: encrypted.data
            };
        }

        return {
            v: CLOUD_ACCOUNTS_VERSION,
            alg: CLOUD_ACCOUNTS_ALG_FALLBACK,
            data: toBase64(
                xorBytes(
                    new TextEncoder().encode(payloadText),
                    new TextEncoder().encode(seed)
                )
            )
        };
    },

    async decodeCloudAccounts(cloudAccounts, context) {
        try {
            if (!cloudAccounts) return [];

            if (Array.isArray(cloudAccounts)) {
                return normalizeAccountList(cloudAccounts);
            }

            if (typeof cloudAccounts === 'string') {
                try {
                    const parsed = JSON.parse(cloudAccounts);
                    return this.decodeCloudAccounts(parsed, context);
                } catch (_) {
                    return [];
                }
            }

            if (cloudAccounts && Array.isArray(cloudAccounts.items)) {
                return normalizeAccountList(cloudAccounts.items);
            }

            const alg = String((cloudAccounts && cloudAccounts.alg) || CLOUD_ACCOUNTS_ALG_FALLBACK);
            const seed = buildCryptoSeed(context);
            const encodedData = cloudAccounts && cloudAccounts.data;
            if (!encodedData) return [];

            let payloadText = '';
            if (alg === CLOUD_ACCOUNTS_ALG_AES) {
                const key = await deriveAesKey(seed);
                if (!key) return [];
                payloadText = await decryptWithAesGcm(cloudAccounts.iv, encodedData, key);
            } else {
                payloadText = new TextDecoder().decode(
                    xorBytes(
                        fromBase64(encodedData),
                        new TextEncoder().encode(seed)
                    )
                );
            }

            const payload = JSON.parse(payloadText);
            if (Array.isArray(payload)) return normalizeAccountList(payload);
            return normalizeAccountList(payload && payload.accounts);
        } catch (e) {
            console.warn('Decode cloud accounts failed:', e);
            return [];
        }
    },

    async getCloudAccounts(settings, context) {
        const state = settings && typeof settings === 'object' ? settings : {};

        if (Object.prototype.hasOwnProperty.call(state, 'cloudAccounts') && state.cloudAccounts) {
            return this.decodeCloudAccounts(state.cloudAccounts, context);
        }

        if (Array.isArray(state.accountsCloud)) {
            return normalizeAccountList(state.accountsCloud);
        }

        if (Array.isArray(state.accounts)) {
            return normalizeAccountList(state.accounts);
        }

        return [];
    },

    async withCloudAccounts(settings, accounts, context) {
        const next = {
            ...(settings && typeof settings === 'object' ? settings : {})
        };
        next.cloudAccounts = await this.encodeCloudAccounts(accounts, context);
        return next;
    },

    async createSettingsPhieu({ name, chungThuSo }) {
        // Reuse CreateAjax endpoint with chungThuSo as mabn
        const formData = new FormData();
        formData.append('status', '1');
        formData.append('thebaohiemyte', 'Không');
        formData.append('chuky', '{}');
        formData.append('khac', '--*--');
        formData.append('khu', '1');
        formData.append('mabn', chungThuSo);
        formData.append('bieumauid', '027');
        formData.append('makp', getSelectedKhoa('551'));
        formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
        formData.append('actiontype', '');
        // Mark with name% so it can be identified and matched by endsWith('%')
        formData.append('hoten', `${name}%`);
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
            ],
            dashboard: {}, // To store dashboard toggles/filters
            cloudAccounts: null
        };
    },

    async getOrCreateSettings() {
        const info = await this.fetchDoctorInfo();
        if (!info.name || !info.chungThuSo) {
            return { doctorName: info.name, chungThuSo: info.chungThuSo, checklistObj: null, settings: this.getDefaultSettings() };
        }
        let checklistObj = await this.loadSettingsPhieu(info.chungThuSo);
        if (!checklistObj) {
            const created = await this.createSettingsPhieu(info);
            if (created && created.isValid && created.data) {
                // Some CreateAjax returns full object, some just flags; re-read list to get object
                checklistObj = await this.loadSettingsPhieu(info.chungThuSo);
            }
        }
        const settings = checklistObj ? this.parseSettingsState(checklistObj) : this.getDefaultSettings();
        if (!settings.danDoRaVien) settings.danDoRaVien = this.getDefaultSettings().danDoRaVien;
        if (!settings.dashboard) settings.dashboard = this.getDefaultSettings().dashboard;
        return { doctorName: info.name, chungThuSo: info.chungThuSo, checklistObj, settings };
    }
};

module.exports = SettingsService;
