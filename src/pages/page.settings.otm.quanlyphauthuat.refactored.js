// page.settings.otm.quanlyphauthuat.refactored.js - Refactored OTM surgeon management using OTMTokenService

const SurgeonSettingsService = require('../services/surgeonSettingsService');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const OTMTokenService = require('../services/otm.token');

function stylesOnce() {
    if (document.getElementById('dr-otm-surgeon-styles-v2')) return;
    const st = document.createElement('style');
    st.id = 'dr-otm-surgeon-styles-v2';
    st.textContent = `
    .dr-os-wrap { display:flex; flex-direction:column; gap:12px; }
    .dr-os-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .dr-os-select, .dr-os-search { padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; }
    .dr-os-columns { display:grid; grid-template-columns: 320px 1fr; gap:12px; align-items:start; }
    .dr-os-selected { border:1px solid #e5e7eb; border-radius:10px; padding:10px; background:#fff; max-height:55vh; overflow:auto; }
    .dr-os-selected h4 { margin:0 0 8px; font-size:14px; color:#334155; }
    .dr-os-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background:#f1f5f9; border:1px solid #e5e7eb; border-radius:999px; margin:4px; font-size:13px; }
    .dr-os-chip button { appearance:none; border:none; background:transparent; cursor:pointer; color:#64748b; }
    .dr-os-list { border:1px solid #e5e7eb; border-radius:10px; padding:10px; max-height:55vh; overflow:auto; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .dr-os-item { display:flex; align-items:center; gap:8px; padding:8px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; }
        .dr-os-actions { display:flex; gap:8px; }
        .dr-os-btn { appearance:none; border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer }
        .dr-os-btn.primary { border-color:#2563eb; background:#2563eb; color:#fff }
        .dr-os-status { padding:12px; text-align:center; color:#64748b; font-size:14px; }
        .dr-os-error { color:#dc2626; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:12px; margin:8px 0; }
        .dr-os-loading { display:inline-block; width:16px; height:16px; border:2px solid #e5e7eb; border-top-color:#2563eb; border-radius:50%; animation:spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1100px) { .dr-os-columns { grid-template-columns: 1fr; } }
    @media (max-width: 900px) { .dr-os-list { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(st);
}

// In-memory cache for OTM users
const _otmUsersCache = { list: null, at: 0, loading: false };

async function ensureOTMUsers() {
    if (Array.isArray(_otmUsersCache.list) && _otmUsersCache.list.length > 0) {
        console.log('DEBUG - Using cached OTM users:', _otmUsersCache.list.length);
        return _otmUsersCache.list;
    }
    
    if (_otmUsersCache.loading) {
        console.log('DEBUG - OTM users already loading, waiting...');
        // Wait for the ongoing request
        let attempts = 0;
        while (_otmUsersCache.loading && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        if (Array.isArray(_otmUsersCache.list) && _otmUsersCache.list.length > 0) {
            return _otmUsersCache.list;
        }
    }

    _otmUsersCache.loading = true;
    try {
        console.log('DEBUG - Fetching OTM users using OTMTokenService...');
        const response = await OTMTokenService.fetchUsers();
        console.log('DEBUG - Raw OTM users response:', response);
        
        // Extract users array from response
        let usersArray = [];
        if (Array.isArray(response)) {
            usersArray = response;
        } else if (response && Array.isArray(response.data)) {
            usersArray = response.data;
        } else if (response && typeof response === 'object') {
            // Look for array in various possible properties
            const candidates = ['data', 'items', 'result', 'rows', 'content', 'users', 'records', 'list'];
            for (const prop of candidates) {
                if (Array.isArray(response[prop])) {
                    usersArray = response[prop];
                    break;
                }
                // Check nested properties
                if (response[prop] && typeof response[prop] === 'object') {
                    for (const nestedProp of candidates) {
                        if (Array.isArray(response[prop][nestedProp])) {
                            usersArray = response[prop][nestedProp];
                            break;
                        }
                    }
                    if (usersArray.length > 0) break;
                }
            }
        }
        
        console.log('DEBUG - Extracted users array:', usersArray.length, 'users');
        
        // Transform and filter users
        const users = (usersArray || [])
            .map(u => ({
                id: u.id ?? u.taid ?? u.userid ?? u.userId ?? null,
                fullname: u.fullname || u.fullName || u.name || ''
            }))
            .filter(u => u.fullname && u.fullname.trim().length > 0);

        console.log('DEBUG - Processed users:', users.length, 'valid users');
        
        _otmUsersCache.list = users;
        _otmUsersCache.at = Date.now();
        return users;
        
    } catch (error) {
        console.error('DEBUG - Error fetching OTM users:', error);
        
        if (error.message === 'TOKEN_EXPIRED') {
            throw new Error('Token OTM đã hết hạn. Vui lòng đăng nhập lại OTM.');
        } else if (error.message === 'NO_TOKEN') {
            throw new Error('Không có token OTM. Vui lòng đăng nhập OTM trước.');
        }
        
        throw new Error('Không thể tải danh sách bác sĩ từ OTM: ' + error.message);
    } finally {
        _otmUsersCache.loading = false;
    }
}

function renderSurgeonManagement() {
    stylesOnce();
    return `
        <div class="dr-os-wrap">
            <div class="dr-os-row">
                <h3>Quản lý danh sách bác sĩ phẫu thuật</h3>
                <button class="dr-os-btn primary" id="dr-os-refresh">🔄 Làm mới danh sách</button>
            </div>
            <div class="dr-os-row">
                <input 
                    type="text" 
                    id="dr-os-search" 
                    class="dr-os-search" 
                    placeholder="Tìm kiếm bác sĩ..."
                    style="flex: 1; max-width: 300px;"
                />
                <button class="dr-os-btn" id="dr-os-select-all">Chọn tất cả</button>
                <button class="dr-os-btn" id="dr-os-clear-all">Bỏ chọn tất cả</button>
            </div>
            <div class="dr-os-columns">
                <div class="dr-os-selected">
                    <h4>Bác sĩ đã chọn (<span id="dr-os-selected-count">0</span>)</h4>
                    <div id="dr-os-selected-list">
                        <div class="dr-os-status">Đang tải...</div>
                    </div>
                </div>
                <div class="dr-os-list" id="dr-os-list">
                    <div class="dr-os-status">
                        <div class="dr-os-loading"></div>
                        Đang tải danh sách bác sĩ từ OTM...
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadSurgeonsList() {
    const listEl = document.getElementById('dr-os-list');
    const selectedListEl = document.getElementById('dr-os-selected-list');
    const searchEl = document.getElementById('dr-os-search');

    try {
        // Show loading state
        if (listEl) {
            listEl.innerHTML = `
                <div class="dr-os-status">
                    <div class="dr-os-loading"></div>
                    Đang tải danh sách bác sĩ từ OTM...
                </div>
            `;
        }

        console.log('DEBUG - Starting OTM users fetch...');
        const users = await ensureOTMUsers();
        console.log('DEBUG - Loaded', users.length, 'OTM users');

        // Get currently selected surgeons
        const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
        console.log('DEBUG - Currently selected surgeons:', selectedSurgeons);
        
        // Render selected surgeons
        renderSelectedSurgeons(selectedSurgeons, selectedListEl);
        
        // Render all surgeons list
        renderSurgeonsList(users, selectedSurgeons, listEl);
        
        // Set up search functionality
        if (searchEl) {
            searchEl.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterSurgeonsList(users, selectedSurgeons, query, listEl);
            });
        }

        console.log('DEBUG - Surgeon management loaded successfully');

    } catch (error) {
        console.error('DEBUG - Error loading surgeons list:', error);
        
        if (listEl) {
            listEl.innerHTML = `
                <div class="dr-os-error">
                    <p><strong>Lỗi:</strong> ${error.message}</p>
                    <button class="dr-os-btn" onclick="loadSurgeonsList()">Thử lại</button>
                </div>
            `;
        }
        
        if (selectedListEl) {
            selectedListEl.innerHTML = `
                <div class="dr-os-status">Không thể tải danh sách bác sĩ</div>
            `;
        }
    }
}

function renderSelectedSurgeons(selectedSurgeons, container) {
    if (!container) return;
    
    const countEl = document.getElementById('dr-os-selected-count');
    if (countEl) {
        countEl.textContent = selectedSurgeons.length.toString();
    }

    if (selectedSurgeons.length === 0) {
        container.innerHTML = '<div class="dr-os-status">Chưa chọn bác sĩ nào</div>';
        return;
    }

    const chipsHTML = selectedSurgeons.map(name => `
        <div class="dr-os-chip">
            ${name}
            <button onclick="removeSurgeon('${name.replace(/'/g, "\\'")}')">&times;</button>
        </div>
    `).join('');

    container.innerHTML = chipsHTML;
}

function renderSurgeonsList(users, selectedSurgeons, container) {
    if (!container) return;
    
    filterSurgeonsList(users, selectedSurgeons, '', container);
}

function filterSurgeonsList(users, selectedSurgeons, query, container) {
    if (!container) return;
    
    const selectedSet = new Set(selectedSurgeons.map(name => name.toLowerCase()));
    
    let filteredUsers = users.filter(user => {
        const nameMatch = !query || user.fullname.toLowerCase().includes(query);
        const notSelected = !selectedSet.has(user.fullname.toLowerCase());
        return nameMatch && notSelected;
    });

    if (filteredUsers.length === 0) {
        const message = query ? 
            `Không tìm thấy bác sĩ nào với từ khóa "${query}"` : 
            'Tất cả bác sĩ đã được chọn';
        container.innerHTML = `<div class="dr-os-status">${message}</div>`;
        return;
    }

    const itemsHTML = filteredUsers.map(user => `
        <div class="dr-os-item">
            <div style="flex: 1;">
                <strong>${user.fullname}</strong>
                ${user.id ? `<div style="font-size: 12px; color: #6b7280;">ID: ${user.id}</div>` : ''}
            </div>
            <button class="dr-os-btn primary" onclick="addSurgeon('${user.fullname.replace(/'/g, "\\'")}')">
                Thêm
            </button>
        </div>
    `).join('');

    container.innerHTML = itemsHTML;
}

// Global functions for button handlers
window.addSurgeon = async function(name) {
    try {
        console.log('DEBUG - Adding surgeon:', name);
        const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
        
        if (selectedSurgeons.includes(name)) {
            console.log('DEBUG - Surgeon already selected:', name);
            return;
        }

        const newSelected = [...selectedSurgeons, name];
        await SurgeonSettingsService.saveSelectedSurgeons(newSelected);
        console.log('DEBUG - Surgeon added successfully:', name);
        
        // Reload the lists
        loadSurgeonsList();

    } catch (error) {
        console.error('DEBUG - Error adding surgeon:', error);
        alert('Không thể thêm bác sĩ: ' + error.message);
    }
};

window.removeSurgeon = async function(name) {
    try {
        console.log('DEBUG - Removing surgeon:', name);
        const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
        const newSelected = selectedSurgeons.filter(s => s !== name);
        
        await SurgeonSettingsService.saveSelectedSurgeons(newSelected);
        console.log('DEBUG - Surgeon removed successfully:', name);
        
        // Reload the lists
        loadSurgeonsList();

    } catch (error) {
        console.error('DEBUG - Error removing surgeon:', error);
        alert('Không thể xóa bác sĩ: ' + error.message);
    }
};

function attachEventListeners() {
    const refreshBtn = document.getElementById('dr-os-refresh');
    const selectAllBtn = document.getElementById('dr-os-select-all');
    const clearAllBtn = document.getElementById('dr-os-clear-all');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log('DEBUG - Refresh button clicked, clearing cache');
            // Clear cache and reload
            _otmUsersCache.list = null;
            _otmUsersCache.at = 0;
            await loadSurgeonsList();
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', async () => {
            try {
                const users = await ensureOTMUsers();
                const allNames = users.map(u => u.fullname);
                await SurgeonSettingsService.saveSelectedSurgeons(allNames);
                loadSurgeonsList();
            } catch (error) {
                alert('Không thể chọn tất cả: ' + error.message);
            }
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            try {
                await SurgeonSettingsService.saveSelectedSurgeons([]);
                loadSurgeonsList();
            } catch (error) {
                alert('Không thể bỏ chọn tất cả: ' + error.message);
            }
        });
    }
}

function initSurgeonManagement() {
    console.log('DEBUG - Initializing OTM surgeon management with OTMTokenService');
    
    const container = document.createElement('div');
    container.innerHTML = renderSurgeonManagement();
    
    // Replace or append to current content
    const existingContent = document.querySelector('.dr-os-wrap');
    if (existingContent) {
        existingContent.replaceWith(container.firstElementChild);
    } else {
        document.body.appendChild(container.firstElementChild);
    }
    
    // Attach event listeners
    attachEventListeners();
    
    // Load data
    loadSurgeonsList();
}

module.exports = {
    initSurgeonManagement,
    renderSurgeonManagement,
    loadSurgeonsList,
    ensureOTMUsers
};
