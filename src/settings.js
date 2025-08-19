// settings.js - Render a settings page similar to dashboard, triggered by ?caidat

const SettingsService = require('./services/settingsService');

async function showSettingsIfNeeded() {
        if (!(/[?&](caidat)($|&)/.test(window.location.search))) return;

        // Reset page and mount a two-column layout with tabs
        document.body.innerHTML = '';

        const styles = document.createElement('style');
        styles.textContent = `
            .dr-st-wrap{display:flex; min-height:100vh; color:#111827; background:#fff; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
            .dr-st-left{width:260px; border-right:1px solid #e5e7eb; background:#fafafa}
            .dr-st-left h2{margin:16px; font-size:18px}
            .dr-st-menu{display:flex; flex-direction:column; gap:8px; padding:0 12px 16px}
            .dr-st-menu button{appearance:none; border:1px solid #e5e7eb; background:#fff; padding:10px 12px; border-radius:10px; text-align:left; cursor:pointer}
            .dr-st-menu button.active{border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15) inset}
            .dr-st-right{flex:1; min-width:0;}
            .dr-st-head{display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #e5e7eb}
            .dr-st-title{margin:0; font-size:18px}
            .dr-st-content{padding:16px 20px}
            .dr-st-row{display:flex; gap:8px; align-items:center; margin-bottom:8px}
            .dr-st-input{flex:1; padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px}
            .dr-st-btn{appearance:none; border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer}
            .dr-st-btn.primary{border-color:#2563eb; background:#2563eb; color:#fff}
            .dr-st-list{display:flex; flex-direction:column; gap:8px; margin:12px 0}
            .dr-st-tab{display:none}
            .dr-st-tab.active{display:block}
            .dr-st-footer{padding:12px 20px; color:#6b7280; border-top:1px solid #e5e7eb}
        `;
        document.head.appendChild(styles);

        const wrap = document.createElement('div');
        wrap.className = 'dr-st-wrap';

        // Left menu
        const left = document.createElement('aside');
        left.className = 'dr-st-left';
        left.innerHTML = `
            <h2>Cài đặt</h2>
            <div class="dr-st-menu">
                <button data-tab="discharge" class="active">Lời dặn dò ra viện</button>
            </div>
            <div class="dr-st-footer" id="dr-st-doctor"></div>
        `;

        // Right content with header and tabs
        const right = document.createElement('section');
        right.className = 'dr-st-right';
        right.innerHTML = `
            <div class="dr-st-head">
                <h3 class="dr-st-title">Lời dặn dò ra viện</h3>
                <div>
                    <button class="dr-st-btn" id="reload-tab">Tải lại</button>
                    <button class="dr-st-btn primary" id="save-tab">Lưu</button>
                </div>
            </div>
            <div class="dr-st-content">
                <div id="tab-discharge" class="dr-st-tab active">
                    <p style="margin:0 0 8px; color:#6b7280">Danh sách các lời dặn dò ra viện. Bạn có thể thêm/xóa và chỉnh sửa.</p>
                    <div id="discharge-list" class="dr-st-list"></div>
                    <button id="add-discharge" class="dr-st-btn">+ Thêm mục</button>
                </div>
            </div>
        `;

        wrap.appendChild(left);
        wrap.appendChild(right);
        document.body.appendChild(wrap);

        // Load settings state
        let { doctorName, checklistObj, settings } = await SettingsService.getOrCreateSettings();
        const titleEl = right.querySelector('.dr-st-title');
        const listEl = right.querySelector('#discharge-list');
        const doctorEl = left.querySelector('#dr-st-doctor');
        if (doctorEl) doctorEl.textContent = doctorName ? `Bác sĩ: ${doctorName}` : 'Bác sĩ: (không xác định)';

        const renderDischarge = (items) => {
                listEl.innerHTML = '';
                (items || []).forEach(text => {
                        const row = document.createElement('div');
                        row.className = 'dr-st-row';
                        row.innerHTML = `
                            <input class="dr-st-input" type="text" value="${(text || '').replace(/"/g,'&quot;')}" placeholder="Nhập lời dặn dò..." />
                            <button class="dr-st-btn remove-row" title="Xóa">Xóa</button>
                        `;
                        listEl.appendChild(row);
                });
        };

        renderDischarge(settings && settings.danDoRaVien ? settings.danDoRaVien : SettingsService.getDefaultSettings().danDoRaVien);

        // Left menu switching (future tabs-ready)
        left.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-tab]');
                if (!btn) return;
                left.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                titleEl.textContent = tab === 'discharge' ? 'Lời dặn dò ra viện' : btn.textContent.trim();
                right.querySelectorAll('.dr-st-tab').forEach(t => t.classList.remove('active'));
                const target = right.querySelector(`#tab-${tab}`);
                if (target) target.classList.add('active');
        });

        // Right actions
        right.addEventListener('click', async (e) => {
                if (e.target.id === 'add-discharge') {
                        const row = document.createElement('div');
                        row.className = 'dr-st-row';
                        row.innerHTML = `
                            <input class="dr-st-input" type="text" placeholder="Nhập lời dặn dò..." />
                            <button class="dr-st-btn remove-row" title="Xóa">Xóa</button>
                        `;
                        listEl.appendChild(row);
                        return;
                }
                if (e.target.classList && e.target.classList.contains('remove-row')) {
                        e.target.closest('.dr-st-row')?.remove();
                        return;
                }
                if (e.target.id === 'reload-tab') {
                        const data = await SettingsService.getOrCreateSettings();
                        doctorName = data.doctorName;
                        checklistObj = data.checklistObj;
                        settings = data.settings || SettingsService.getDefaultSettings();
                        renderDischarge(settings.danDoRaVien || []);
                        if (doctorEl) doctorEl.textContent = doctorName ? `Bác sĩ: ${doctorName}` : 'Bác sĩ: (không xác định)';
                        return;
                }
                if (e.target.id === 'save-tab') {
                        const values = Array.from(listEl.querySelectorAll('input')).map(i => i.value.trim()).filter(Boolean);
                        const next = { ...(settings || {}), danDoRaVien: values };
                        // Ensure checklist exists
                        if (!checklistObj && doctorName) {
                                const created = await SettingsService.createSettingsPhieu(doctorName);
                                if (created && created.isValid) {
                                        checklistObj = await SettingsService.loadSettingsPhieu(doctorName);
                                }
                        }
                        if (!checklistObj) {
                                alert('Không thể lưu: chưa có phiếu cài đặt.');
                                return;
                        }
                        const ok = await SettingsService.updateSettingsState(checklistObj, next);
                        if (ok) {
                                settings = next;
                                alert('Đã lưu cài đặt');
                        } else {
                                alert('Lưu thất bại');
                        }
                }
        });
}

module.exports = { showSettingsIfNeeded };
