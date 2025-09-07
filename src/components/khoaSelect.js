// components/khoaSelect.js - Reusable khoa selection button with dropdown

const ApiService = require('../services/apiService');

function ensureStyles() {
  if (document.getElementById('dr-khoa-select-css')) return;
  const st = document.createElement('style');
  st.id = 'dr-khoa-select-css';
  st.textContent = `
    .dr-khoa-select{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#0f172a;font-size:13px;cursor:pointer}
    .dr-khoa-caret{border:solid #64748b;border-width:0 2px 2px 0;display:inline-block;padding:2px;transform:rotate(45deg);margin-left:2px}
    .dr-khoa-select-wrap{position:relative;display:inline-block}
    .dr-khoa-menu{position:absolute;top:110%;left:0;min-width:220px;max-height:320px;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 10px 20px rgba(2,6,23,.08);z-index:9999;padding:6px}
    .dr-khoa-item{padding:6px 8px;border-radius:6px;cursor:pointer}
    .dr-khoa-item:hover{background:#f1f5f9}
    .dr-khoa-active{background:#e0f2fe}
    .dr-khoa-search{display:block;width:100%;box-sizing:border-box;margin:4px 0 6px 0;padding:6px 8px;border:1px solid #e5e7eb;border-radius:6px}
  `;
  document.head.appendChild(st);
}

function getStoredKhoaId(defaultId) {
  try { return localStorage.getItem('bsnt_khoa_dashboard') || defaultId; } catch(_) { return defaultId; }
}
function setStoredKhoaId(id) {
  try { localStorage.setItem('bsnt_khoa_dashboard', String(id)); } catch(_) {}
}

function createKhoaSelect(opts) {
  ensureStyles();
  const { container, onChange } = opts || {};
  const wrap = document.createElement('span');
  wrap.className = 'dr-khoa-select-wrap';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dr-khoa-select';
  btn.id = 'dr-khoa-select';
  const label = document.createElement('span');
  label.textContent = 'Chọn khoa';
  const caret = document.createElement('i'); caret.className = 'dr-khoa-caret';
  btn.appendChild(label); btn.appendChild(caret);
  const menu = document.createElement('div'); menu.className = 'dr-khoa-menu'; menu.style.display = 'none';
  const search = document.createElement('input'); search.className = 'dr-khoa-search'; search.placeholder = 'Tìm khoa...';
  const listBox = document.createElement('div');
  menu.appendChild(search); menu.appendChild(listBox);
  wrap.appendChild(btn); wrap.appendChild(menu);
  if (container) container.innerHTML = '', container.appendChild(wrap);

  let allKhoa = [];
  let currentId = getStoredKhoaId('551');

  function renderList(filter='') {
    listBox.innerHTML = '';
    const f = filter.trim().toLowerCase();
    allKhoa
      .filter(k => !f || (k.name||'').toLowerCase().includes(f) || String(k.id).includes(f))
      .forEach(k => {
        const item = document.createElement('div');
        item.className = 'dr-khoa-item' + (String(k.id) === String(currentId) ? ' dr-khoa-active' : '');
        item.textContent = `${k.name || 'Khoa'} (${k.id})`;
        item.addEventListener('click', () => {
          currentId = String(k.id);
          setStoredKhoaId(currentId);
          label.textContent = k.name || `Khoa ${k.id}`;
          if (typeof onChange === 'function') onChange(currentId, k.name || `Khoa ${k.id}`);
          menu.style.display = 'none';
        });
        listBox.appendChild(item);
      });
  }

  async function init() {
    try {
      const list = await ApiService.fetchKhoaPhong();
      allKhoa = Array.isArray(list) ? list : [];
      const found = allKhoa.find(k => String(k.id) === String(currentId));
      label.textContent = (found && found.name) || `Khoa ${currentId}`;
      renderList();
    } catch(_) {
      label.textContent = `Khoa ${currentId}`;
    }
  }

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (menu.style.display === 'none') {
      if (!allKhoa.length) await init();
      menu.style.display = 'block';
      search.focus();
    } else {
      menu.style.display = 'none';
    }
  });
  search.addEventListener('input', () => renderList(search.value || ''));
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) menu.style.display = 'none';
  });

  init();
  return { el: wrap, button: btn, refreshLabel: init, getKhoaId: () => currentId };
}

module.exports = { createKhoaSelect };
