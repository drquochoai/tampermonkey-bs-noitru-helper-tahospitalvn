// advancedFilter.js - Logic for advanced dashboard filtering
const DialogManager = require('./dialogManager');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const Utils = require('../utils');
const DateUtils = require('../utils/dateUtils');

/**
 * Trích xuất tên gốc của bác sĩ, loại bỏ các chức danh (BS, TS, ThS...)
 */
function getBaseName(name) {
    if (!name) return '';
    const titles = ['pgs', 'ts', 'bs', 'ths', 'bsnt', 'cki', 'ckii', 'ck1', 'ck2', 'bác', 'sĩ', 'gs'];
    return name.toLowerCase()
        .replace(/[.,;/()\-]/g, ' ') // Thay dấu câu bằng khoảng trắng, thay vì dùng regex phức tạp dễ mất chữ 'đ'
        .split(/\s+/)
        .filter(w => w && !titles.includes(w))
        .join(' ');
}


let advancedFilterState = {
    active: false,
    yLenhTags: [],      // Array of strings
    yLenhTagsLogic: 'OR', // 'OR' | 'AND'
    surgeryName: '',     // %like% search
    surgeons: [],       // Array of objects { name, role: 'any'|'main'|'1'|'2'|'3' }
    surgeonsLogic: 'OR', // 'OR' | 'AND'
    surgeryDate: null,   // 'yesterday' | 'today' | 'tomorrow' | null
};

/**
 * Setup Advanced Filter button and logic
 */
function setupAdvancedFilter(topBar, onApply) {
    const topbarRight = topBar.querySelector('.dr-topbar-right');
    if (!topbarRight) return;

    // Add "Lọc nâng cao" button
    const filterBtn = document.createElement('button');
    filterBtn.id = 'dr-advanced-filter-btn';
    filterBtn.title = 'Lọc nâng cao theo Y lệnh, Phẫu thuật...';
    filterBtn.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #475569;
        transition: all 0.2s;
    `;
    filterBtn.innerHTML = '<i class="fas fa-filter"></i> Lọc nâng cao <span id="dr-filter-badge" style="display:none; background:#1976d2; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px;">0</span>';
    
    // Insert before view toggle
    const viewToggle = topBar.querySelector('#dr-view-toggle');
    if (viewToggle) {
        topbarRight.insertBefore(filterBtn, viewToggle);
    } else {
        topbarRight.appendChild(filterBtn);
    }

    filterBtn.onclick = () => openFilterDialog(onApply);

    // Initial badge update
    updateFilterBadge(filterBtn);
}

/**
 * Update the numeric badge on the filter button
 */
function updateFilterBadge(btn) {
    const badge = btn.querySelector('#dr-filter-badge');
    if (!badge) return;

    let count = 0;
    if (advancedFilterState.yLenhTags.length > 0) count++;
    if (advancedFilterState.surgeryName.trim()) count++;
    if (advancedFilterState.surgeons.length > 0) count++;
    if (advancedFilterState.surgeryDate) count++;

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
        btn.style.borderColor = '#1976d2';
        btn.style.color = '#1976d2';
        btn.style.background = '#eff6ff';
        advancedFilterState.active = true;
    } else {
        badge.style.display = 'none';
        btn.style.borderColor = '#cbd5e1';
        btn.style.color = '#475569';
        btn.style.background = '#f8fafc';
        advancedFilterState.active = false;
    }
}

/**
 * Open the filter dialog
 */
function openFilterDialog(onApply) {
    const { dialog, inner } = DialogManager.createDialog('dr-advanced-filter-dialog', {
        maxWidth: '850px',
        maxHeight: '90vh'
    });

    // Collect all available manual Y lệnh tags from dr_data
    const allManualTags = new Set();
    if (window.dr_data) {
        window.dr_data.forEach(p => {
            const log = p.checklistState?.yLenhLog || [];
            log.forEach(entry => {
                // filter out quick actions (we only want manual ones for this filter as per plan)
                const isQuick = entry.q === true || BS_CAI_DAT.quickYLenhActions.some(a => a.label === entry.content);
                if (!isQuick && entry.content) {
                    allManualTags.add(entry.content.trim());
                }
            });
        });
    }
    const manualTagsArray = Array.from(allManualTags).sort();

    inner.innerHTML = `
        <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h2 style="margin:0; font-size:1.4em; color:#1e293b;">Bộ lọc nâng cao</h2>
                <p style="margin:4px 0 0 0; color:#64748b; font-size:0.9em;">Tìm kiếm bệnh nhân theo tiêu chí chuyên sâu</p>
            </div>
            <div id="dr-filter-header-actions" style="display:flex; gap:8px;"></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:20px;">
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-hand-holding-medical" style="color:#1976d2;"></i> Tên phẫu thuật
                </h3>
                <div style="position:relative;">
                    <input type="text" id="filter-surgery-name" value="${advancedFilterState.surgeryName}" placeholder="Nhập tên mổ (vd: sỏi, túi mật...)" 
                        style="width:100%; padding:8px 30px 8px 12px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">
                    <span id="clear-surgery-name" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); cursor:pointer; color:#94a3b8; display:${advancedFilterState.surgeryName ? 'block' : 'none'};"><i class="fas fa-times-circle"></i></span>
                </div>
            </section>

            <!-- Category: Surgery Date -->
            <section>
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-calendar-alt" style="color:#1976d2;"></i> Ngày phẫu thuật
                </h3>
                <div style="display:flex; gap:8px;">
                    <button class="filter-date-chip ${advancedFilterState.surgeryDate === 'yesterday' ? 'active' : ''}" data-date="yesterday">Hôm qua</button>
                    <button class="filter-date-chip ${advancedFilterState.surgeryDate === 'today' ? 'active' : ''}" data-date="today">Hôm nay</button>
                    <button class="filter-date-chip ${advancedFilterState.surgeryDate === 'tomorrow' ? 'active' : ''}" data-date="tomorrow">Ngày mai</button>
                    <button class="filter-date-chip ${!advancedFilterState.surgeryDate ? 'active' : ''}" data-date="">Tất cả</button>
                </div>
            </section>

            <!-- Category: Surgeons -->
            <section>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="font-size:1em; margin:0; color:#334155; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-user-md" style="color:#1976d2;"></i> Phẫu thuật viên
                    </h3>
                    <div style="display:flex; background:#f1f5f9; border-radius:12px; padding:2px; font-size:0.8em;">
                        <button class="logic-toggle ${advancedFilterState.surgeonsLogic === 'OR' ? 'active' : ''}" data-logic="OR" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">OR</button>
                        <button class="logic-toggle ${advancedFilterState.surgeonsLogic === 'AND' ? 'active' : ''}" data-logic="AND" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">AND</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px; max-height:180px; overflow-y:auto; padding:8px; border:1px solid #f1f5f9; border-radius:6px; background:#f8fafc;">
                    ${BS_CAI_DAT.danhSachBacSi.map(doc => {
                        const selected = advancedFilterState.surgeons.find(s => s.name === doc);
                        return `
                        <div class="filter-surgeon-row" style="display:flex; align-items:center; gap:8px; font-size:0.9em; padding:4px; border-radius:4px; transition:background 0.2s;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex: 1;">
                                <input type="checkbox" class="filter-surgeon-check" value="${doc}" ${selected ? 'checked' : ''}>
                                <span style="font-weight:${selected ? '600' : '400'}">${doc}</span>
                            </label>
                            <select class="filter-surgeon-role" style="font-size:0.8em; padding:2px 4px; border:1px solid #cbd5e1; border-radius:4px; background:white; ${selected ? '' : 'display:none;'}">
                                <option value="any" ${selected?.role === 'any' ? 'selected' : ''}>Bất kỳ</option>
                                <option value="main" ${selected?.role === 'main' ? 'selected' : ''}>PTV chính</option>
                                <option value="1" ${selected?.role === '1' ? 'selected' : ''}>Phụ 1</option>
                                <option value="2" ${selected?.role === '2' ? 'selected' : ''}>Phụ 2</option>
                                <option value="3" ${selected?.role === '3' ? 'selected' : ''}>Phụ 3</option>
                            </select>
                        </div>
                    `}).join('')}
                </div>
            </section>

            <!-- Category: Manual Y lệnh tags -->
            <section>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="font-size:1em; margin:0; color:#334155; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-tags" style="color:#1976d2;"></i> Log y lệnh (Manual)
                    </h3>
                    <div style="display:flex; background:#f1f5f9; border-radius:12px; padding:2px; font-size:0.8em;">
                        <button class="logic-toggle-tags ${advancedFilterState.yLenhTagsLogic === 'OR' ? 'active' : ''}" data-logic="OR" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">OR</button>
                        <button class="logic-toggle-tags ${advancedFilterState.yLenhTagsLogic === 'AND' ? 'active' : ''}" data-logic="AND" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">AND</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:8px; max-height:200px; overflow-y:auto; padding:4px; border:1px solid #f1f5f9; border-radius:6px; background:#f8fafc;">
                    ${manualTagsArray.length > 0 ? manualTagsArray.map(tag => `
                        <label style="display:flex; align-items:center; gap:8px; font-size:0.9em; cursor:pointer; padding:2px 4px;">
                            <input type="checkbox" class="filter-tag-check" value="${tag}" ${advancedFilterState.yLenhTags.includes(tag) ? 'checked' : ''}>
                            ${tag}
                        </label>
                    `).join('') : '<div style="color:#94a3b8; font-style:italic; font-size:0.9em; padding:8px;">Không có y lệnh riêng nào...</div>'}
                </div>
            </section>
        </div>

        <style>
            .filter-date-chip {
                padding: 6px 14px;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                background: #fff;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s;
            }
            .filter-date-chip.active {
                background: #1976d2;
                color: #fff;
                border-color: #1976d2;
            }
            .filter-date-chip:hover:not(.active) {
                background: #f1f5f9;
            }
            .logic-toggle, .logic-toggle-tags {
                background: transparent;
                color: #64748b;
            }
            .logic-toggle.active, .logic-toggle-tags.active {
                background: #fff;
                color: #1976d2;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
        </style>
    `;

    // Add buttons to header: Only "Bỏ tất cả" remains, filtering is now real-time
    const headerActions = inner.querySelector('#dr-filter-header-actions');
    const actionButtons = DialogManager.createActionButtons([
        {
            text: 'Bỏ tất cả',
            className: 'btn-secondary',
            onclick: () => {
                resetFilter();
                dialog.remove();
                if (onApply) onApply();
                updateFilterBadge(document.getElementById('dr-advanced-filter-btn') || {});
            }
        }
    ]);
    if (headerActions) {
        actionButtons.style.marginTop = '0'; // Remove top margin in header
        headerActions.appendChild(actionButtons);
    }

    // Real-time trigger helper
    function triggerUpdate() {
        applyInputs();
        if (onApply) onApply();
        updateFilterBadge(document.getElementById('dr-advanced-filter-btn') || {});
    }

    // Event listeners for date chips
    inner.querySelectorAll('.filter-date-chip').forEach(chip => {
        chip.onclick = () => {
            inner.querySelectorAll('.filter-date-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            advancedFilterState.surgeryDate = chip.getAttribute('data-date') || null;
            triggerUpdate();
        };
    });

    // Logic toggle listeners
    inner.querySelectorAll('.logic-toggle').forEach(btn => {
        btn.onclick = () => {
            inner.querySelectorAll('.logic-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            advancedFilterState.surgeonsLogic = btn.getAttribute('data-logic');
            triggerUpdate();
        };
    });

    // Logic toggle for tags
    inner.querySelectorAll('.logic-toggle-tags').forEach(btn => {
        btn.onclick = () => {
            inner.querySelectorAll('.logic-toggle-tags').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            advancedFilterState.yLenhTagsLogic = btn.getAttribute('data-logic');
            triggerUpdate();
        };
    });

    // Surgeon checkbox/select listeners
    inner.querySelectorAll('.filter-surgeon-check').forEach(cb => {
        cb.onchange = () => {
            const select = cb.closest('.filter-surgeon-row').querySelector('.filter-surgeon-role');
            if (select) select.style.display = cb.checked ? 'block' : 'none';
            triggerUpdate();
        };
    });

    inner.querySelectorAll('.filter-surgeon-role, .filter-tag-check').forEach(el => {
        el.onchange = triggerUpdate;
    });

    // Clear icon logic
    const surgeryInput = inner.querySelector('#filter-surgery-name');
    const clearBtn = inner.querySelector('#clear-surgery-name');
    if (surgeryInput && clearBtn) {
        surgeryInput.oninput = () => {
            clearBtn.style.display = surgeryInput.value ? 'block' : 'none';
            triggerUpdate();
        };
        clearBtn.onclick = () => {
            surgeryInput.value = '';
            clearBtn.style.display = 'none';
            surgeryInput.focus();
            triggerUpdate();
        };
    }

    function applyInputs() {
        advancedFilterState.surgeryName = (inner.querySelector('#filter-surgery-name').value || '').trim();
        
        advancedFilterState.surgeons = [];
        inner.querySelectorAll('.filter-surgeon-row').forEach(row => {
            const cb = row.querySelector('.filter-surgeon-check');
            const select = row.querySelector('.filter-surgeon-role');
            if (cb && cb.checked) {
                advancedFilterState.surgeons.push({
                    name: cb.value,
                    role: select ? select.value : 'any'
                });
            }
        });

        advancedFilterState.yLenhTags = [];
        inner.querySelectorAll('.filter-tag-check:checked').forEach(cb => {
            advancedFilterState.yLenhTags.push(cb.value);
        });

        // CRITICAL FIX: Update active state immediately
        advancedFilterState.active = !!(
            advancedFilterState.surgeryName || 
            advancedFilterState.surgeons.length > 0 || 
            advancedFilterState.surgeryDate || 
            advancedFilterState.yLenhTags.length > 0
        );
    }

    function resetFilter() {
        advancedFilterState.active = false;
        advancedFilterState.yLenhTags = [];
        advancedFilterState.yLenhTagsLogic = 'OR';
        advancedFilterState.surgeryName = '';
        advancedFilterState.surgeons = [];
        advancedFilterState.surgeonsLogic = 'OR';
        advancedFilterState.surgeryDate = null;
    }
}

/**
 * Trích xuất ca mổ gần nhất của bệnh nhân từ nhiều nguồn dữ liệu khác nhau
 */
function getLatestSurgeryLog(item) {
    if (!item) return null;
    
    // Nguồn 1: Log đã lưu trữ / đã merge (ưu tiên cao nhất)
    if (item.checklistState?.phauThuatLog?.length > 0) {
        return item.checklistState.phauThuatLog[0];
    }
    
    // Nguồn 2: Log trực tiếp từ OTM chưa merge vào checklistState
    if (item._otmPhauThuatLog?.length > 0) {
        return item._otmPhauThuatLog[0];
    }
    
    // Nguồn 3: Dữ liệu fallback cơ bản
    if (item.phauThuatInfo) {
        return item.phauThuatInfo;
    }
    
    return null;
}


/**
 * Filter logic: check if patient matches current criteria
 */
function matchesAdvancedFilter(item) {
    let hasCondition = false;
    
    // Lấy thông tin ca phẫu thuật gần nhất của bệnh nhân
    const logEntry = getLatestSurgeryLog(item);
    
    // 1. Filter by Surgery Name (PPPT)
    if (advancedFilterState.surgeryName.trim()) {
        hasCondition = true;
        if (!logEntry) return false;
        
        const query = advancedFilterState.surgeryName.toLowerCase().trim();
        const ptNameHtml = (logEntry.method || logEntry.pppt || '').toLowerCase();
        
        if (!ptNameHtml.includes(query)) return false;
    }

    // 2. Filter by Surgeon
    if (advancedFilterState.surgeons.length > 0) {
        hasCondition = true;
        if (!logEntry) return false;

        const doctorsString = (logEntry.doctors || '').toLowerCase();
        // Tách chuỗi bác sĩ theo dấu phẩy / chấm phẩy và loại bỏ khoảng trắng thừa
        const patientDoctors = doctorsString.split(/[,;]/).map(s => s.trim()).filter(Boolean);

        const checkMatch = (sFilter) => {
            const filterBase = getBaseName(sFilter.name);
            
            // Xóa bỏ chức danh của cả 2 bên và so sánh tên gốc
            // Vd: "ThS.BS Lê Chí Hiếu" -> "lê chí hiếu"
            //     "BS.CKI Lê Chí Hiếu" -> "lê chí hiếu"
            const docIdx = patientDoctors.findIndex(pd => {
                const pdBase = getBaseName(pd);
                return pdBase && filterBase && (pdBase.includes(filterBase) || filterBase.includes(pdBase));
            });
            
            if (docIdx === -1) return false;
            
            if (sFilter.role === 'any') return true;
            if (sFilter.role === 'main' && docIdx === 0) return true;
            if (sFilter.role === '1' && docIdx === 1) return true;
            if (sFilter.role === '2' && docIdx === 2) return true;
            if (sFilter.role === '3' && docIdx === 3) return true;
            
            return false;
        };

        if (advancedFilterState.surgeonsLogic === 'AND') {
            const matchesAll = advancedFilterState.surgeons.every(checkMatch);
            if (!matchesAll) return false;
        } else {
            const matchesAny = advancedFilterState.surgeons.some(checkMatch);
            if (!matchesAny) return false;
        }
        
        // Final sanity check log if filtered
        console.log(`[Filter Match] Patient: ${item.hoten} | Doctors: ${patientDoctors.join('|')} | Match Status: SUCCESS`);
    }

    // 3. Filter by Surgery Date
    if (advancedFilterState.surgeryDate) {
        hasCondition = true;
        if (!logEntry) return false;
        
        const surgeryDateStr = logEntry.date || logEntry.ngayPhauThuat;
        if (!surgeryDateStr) return false;

        const targetDate = new Date();
        if (advancedFilterState.surgeryDate === 'yesterday') targetDate.setDate(targetDate.getDate() - 1);
        if (advancedFilterState.surgeryDate === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
        
        const targetStr = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getFullYear()}`;
        
        // Handle both formats: dd/mm/yyyy and yyyy-mm-dd
        let formattedSurgeryDate = surgeryDateStr;
        if (surgeryDateStr.includes('-')) {
            const [y, m, d] = surgeryDateStr.split('-');
            formattedSurgeryDate = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
        
        if (formattedSurgeryDate !== targetStr) return false;
    }

    // 4. Filter by Manual Y lệnh Tags
    if (advancedFilterState.yLenhTags.length > 0) {
        hasCondition = true;
        const patientManualTags = (item.checklistState?.yLenhLog || [])
            .filter(entry => {
                const isQuick = entry.q === true || BS_CAI_DAT.quickYLenhActions.some(a => a.label === entry.content);
                return !isQuick;
            })
            .map(e => (e.content || '').trim());
        
        if (advancedFilterState.yLenhTagsLogic === 'AND') {
            const matchesAll = advancedFilterState.yLenhTags.every(tag => 
                patientManualTags.includes(tag)
            );
            if (!matchesAll) return false;
        } else {
            const matchesAny = advancedFilterState.yLenhTags.some(tag => 
                patientManualTags.includes(tag)
            );
            if (!matchesAny) return false;
        }
    }

    // Update active flag for the badge
    advancedFilterState.active = hasCondition;
    
    return true;
}

module.exports = {
    setupAdvancedFilter,
    matchesAdvancedFilter,
    advancedFilterState
};
