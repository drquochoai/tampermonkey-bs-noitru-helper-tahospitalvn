// advancedFilter.js - Logic for advanced dashboard filtering
const DialogManager = require('./dialogManager');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const Utils = require('../utils');
const DateUtils = require('../utils/dateUtils');

let advancedFilterState = {
    active: false,
    yLenhTags: [],      // Array of strings
    surgeryName: '',     // %like% search
    surgeons: [],       // Array of strings (doctor names)
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
        maxWidth: '600px',
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
        <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:12px;">
            <h2 style="margin:0; font-size:1.4em; color:#1e293b;">Bộ lọc nâng cao</h2>
            <p style="margin:4px 0 0 0; color:#64748b; font-size:0.9em;">Tìm kiếm bệnh nhân theo tiêu chí chuyên sâu</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:20px;">
            <!-- Category: Surgery Name -->
            <section>
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-hand-holding-medical" style="color:#1976d2;"></i> Tên phẫu thuật
                </h3>
                <input type="text" id="filter-surgery-name" value="${advancedFilterState.surgeryName}" placeholder="Nhập tên mổ (vd: sỏi, túi mật...)" 
                    style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">
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
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-user-md" style="color:#1976d2;"></i> Phẫu thuật viên
                </h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:8px; max-height:150px; overflow-y:auto; padding:4px; border:1px solid #f1f5f9; border-radius:6px; background:#f8fafc;">
                    ${BS_CAI_DAT.danhSachBacSi.map(doc => `
                        <label style="display:flex; align-items:center; gap:8px; font-size:0.9em; cursor:pointer; padding:2px 4px;">
                            <input type="checkbox" class="filter-surgeon-check" value="${doc}" ${advancedFilterState.surgeons.includes(doc) ? 'checked' : ''}>
                            ${doc}
                        </label>
                    `).join('')}
                </div>
            </section>

            <!-- Category: Manual Y lệnh tags -->
            <section>
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-tags" style="color:#1976d2;"></i> Log y lệnh (Manual)
                </h3>
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
        </style>
    `;

    // Add buttons
    const footer = DialogManager.createActionButtons([
        {
            text: 'Bỏ tất cả',
            className: 'btn-secondary',
            onclick: () => {
                resetFilter();
                dialog.remove();
                if (onApply) onApply();
                updateFilterBadge(document.getElementById('dr-advanced-filter-btn') || {});
            }
        },
        {
            text: 'Áp dụng',
            className: 'btn-primary',
            onclick: () => {
                applyInputs();
                dialog.remove();
                if (onApply) onApply();
                updateFilterBadge(document.getElementById('dr-advanced-filter-btn') || {});
            }
        }
    ]);
    inner.appendChild(footer);

    // Event listeners for date chips
    inner.querySelectorAll('.filter-date-chip').forEach(chip => {
        chip.onclick = () => {
            inner.querySelectorAll('.filter-date-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            advancedFilterState.surgeryDate = chip.getAttribute('data-date') || null;
        };
    });

    // Clear icon logic
    const surgeryInput = inner.querySelector('#filter-surgery-name');
    const clearBtn = inner.querySelector('#clear-surgery-name');
    if (surgeryInput && clearBtn) {
        surgeryInput.oninput = () => {
            clearBtn.style.display = surgeryInput.value ? 'block' : 'none';
        };
        clearBtn.onclick = () => {
            surgeryInput.value = '';
            clearBtn.style.display = 'none';
            surgeryInput.focus();
        };
    }

    function applyInputs() {
        advancedFilterState.surgeryName = (inner.querySelector('#filter-surgery-name').value || '').trim();
        
        advancedFilterState.surgeons = [];
        inner.querySelectorAll('.filter-surgeon-check:checked').forEach(cb => {
            advancedFilterState.surgeons.push(cb.value);
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
        advancedFilterState.surgeryName = '';
        advancedFilterState.surgeons = [];
        advancedFilterState.surgeryDate = null;
    }
}

/**
 * Filter logic: check if patient matches current criteria
 */
function matchesAdvancedFilter(item) {
    let hasCondition = false;
    
    // 1. Filter by Surgery Name (PPPT)
    if (advancedFilterState.surgeryName.trim()) {
        hasCondition = true;
        const query = advancedFilterState.surgeryName.toLowerCase().trim();
        let ptNameHtml = '';
        if (item.phauThuatInfo) {
            ptNameHtml = (item.phauThuatInfo.method || item.phauThuatInfo.pppt || '').toLowerCase();
        } else if (item.checklistState?.phauThuatLog?.[0]) {
            ptNameHtml = (item.checklistState.phauThuatLog[0].method || '').toLowerCase();
        }
        if (!ptNameHtml.includes(query)) return false;
    }

    // 2. Filter by Surgeon
    if (advancedFilterState.surgeons.length > 0) {
        hasCondition = true;
        let doctorsString = '';
        if (item.phauThuatInfo) {
            doctorsString = (item.phauThuatInfo.doctors || '').toLowerCase();
        } else if (item.checklistState?.phauThuatLog?.[0]) {
            doctorsString = (item.checklistState.phauThuatLog[0].doctors || '').toLowerCase();
        }
        
        const matchesAnySurgeon = advancedFilterState.surgeons.some(s => 
            doctorsString.includes(s.toLowerCase())
        );
        if (!matchesAnySurgeon) return false;
    }

    // 3. Filter by Surgery Date
    if (advancedFilterState.surgeryDate) {
        hasCondition = true;
        let surgeryDateStr = null;
        if (item.phauThuatInfo) {
            surgeryDateStr = item.phauThuatInfo.date || item.phauThuatInfo.ngayPhauThuat;
        } else if (item.checklistState?.phauThuatLog?.[0]) {
            surgeryDateStr = item.checklistState.phauThuatLog[0].date;
        }

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
        
        const matchesAnyTag = advancedFilterState.yLenhTags.some(tag => 
            patientManualTags.includes(tag)
        );
        if (!matchesAnyTag) return false;
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
