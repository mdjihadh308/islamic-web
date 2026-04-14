/**
 * ============================================================
 * ISLAMIC HISTORY CMS — ADMIN PANEL JAVASCRIPT (v2 — Connected)
 * Uses CMS_KEYS from cms-bridge.js (single source of truth)
 * Every write goes through cmsSet() which fires storage events
 * so the frontend auto-updates in other tabs.
 * ============================================================
 */

'use strict';

const STORE_KEYS = CMS_KEYS;
const getData = cmsGet;
const generateId = cmsGenerateId;
const getTimestamp = cmsTimestamp;
const escapeHtml = cmsEscape;
const capitalize = cmsCapitalize;

const PAGE_SIZE = 10;
const pageState = {};
Object.keys(STORE_KEYS).forEach(k => { pageState[k] = 1; });
const tempImages = {};

function saveData(section, arr) {
  cmsSet(section, arr);
  updateBadge(section);
  updateAllDashCounts();
}

function checkAuth() {
  if (localStorage.getItem('cms_session') !== 'active') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('cms_session');
  localStorage.removeItem('cms_session_time');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  document.getElementById('adminLayout').style.display = 'flex';
  loadUserInfo();
  updateAllBadges();
  refreshDashboard();
  loadSettings();
  refreshStorageInfo();
});

function loadUserInfo() {
  const creds = JSON.parse(localStorage.getItem('cms_credentials') || '{}');
  const name = creds.name || 'Admin';
  const el1 = document.getElementById('userNameSidebar');
  const el2 = document.getElementById('userAvatarSidebar');
  if (el1) el1.textContent = name;
  if (el2) el2.textContent = name.charAt(0).toUpperCase();
}

function logActivity(action, section, title, type = 'gold') {
  const key = CMS_KEYS.activity;
  const acts = JSON.parse(localStorage.getItem(key) || '[]');
  acts.unshift({ action, section, title, type, time: getTimestamp() });
  if (acts.length > 30) acts.pop();
  localStorage.setItem(key, JSON.stringify(acts));
  renderActivityList();
}

function renderActivityList() {
  const el = document.getElementById('activityList');
  if (!el) return;
  const acts = JSON.parse(localStorage.getItem(CMS_KEYS.activity) || '[]');
  if (!acts.length) {
    el.innerHTML = '<li class="activity-item"><div class="activity-dot"></div><div><div class="activity-text">No activity yet.</div></div></li>';
    return;
  }
  el.innerHTML = acts.slice(0, 10).map(a => `
    <li class="activity-item">
      <div class="activity-dot ${a.type}"></div>
      <div>
        <div class="activity-text"><strong>${a.action}</strong> in ${a.section} — ${escapeHtml(a.title)}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </li>`).join('');
}

const sectionTitles = {
  dashboard: 'Dashboard',
  life: 'Life Section Manager',
  timeline: 'Timeline Manager',
  hadis: "Du'a / Hadis Manager",
  stories: 'New Story Manager',
  personalities: 'Personalities Manager',
  about: 'About Us Manager',
  others: 'Others Manager',
  settings: 'Settings'
};

function navigate(section, navEl) {
  document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`sec-${section}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  else {
    const f = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (f) f.classList.add('active');
  }

  const pt = document.getElementById('pageTitle');
  if (pt) pt.textContent = sectionTitles[section] || section;

  const content = ['life', 'timeline', 'hadis', 'stories', 'personalities', 'about', 'others'];
  if (content.includes(section)) renderTable(section);
  if (section === 'dashboard') refreshDashboard();
  if (section === 'settings') { loadSettings(); refreshStorageInfo(); }
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

function updateBadge(section) {
  const el = document.getElementById(`badge-${section}`);
  if (el) el.textContent = getData(section).length;
}

function updateAllBadges() {
  ['life', 'timeline', 'hadis', 'stories', 'personalities', 'about', 'others'].forEach(updateBadge);
}

function updateAllDashCounts() {
  const map = {
    'dash-life-count': 'life', 'dash-timeline-count': 'timeline',
    'dash-hadis-count': 'hadis', 'dash-stories-count': 'stories',
    'dash-personalities-count': 'personalities', 'dash-others-count': 'others'
  };
  Object.entries(map).forEach(([id, k]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = getData(k).length;
  });
}

function refreshDashboard() {
  updateAllDashCounts();
  renderActivityList();
}

function renderTable(section, search = '', filter = '') {
  let data = getData(section);
  if (search) {
    const q = search.toLowerCase();
    data = data.filter(item =>
      Object.values(item).some(v => typeof v === 'string' && v.toLowerCase().includes(q))
    );
  }
  if (filter) {
    data = data.filter(item => {
      const val = item.category || item.era || item.type || '';
      return val.toLowerCase() === filter.toLowerCase();
    });
  }

  const total = data.length;
  const page = pageState[section] || 1;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageData = data.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById(`${section}TableBody`);
  const empty = document.getElementById(`${section}Empty`);
  if (!tbody) return;

  if (!total) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = pageData.map(item => buildRow(section, item)).join('');
  }
  renderPagination(section, page, totalPages, total, search, filter);
}

function buildRow(section, item) {
  const id = `<td class="td-id">#${item.id.slice(0, 6)}</td>`;
  const acts = `<td><div class="td-actions">
    <button class="btn btn-sm btn-outline btn-icon" title="View" onclick="viewEntry('${section}','${item.id}')">👁️</button>
    <button class="btn btn-sm btn-outline btn-icon" title="Edit" onclick="editEntry('${section}','${item.id}')">✏️</button>
    <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="confirmDelete('${section}','${item.id}','${escapeHtml(item.title || item.name || 'this entry')}')">🗑️</button>
  </div></td>`;
  const ts = `<td style="white-space:nowrap;font-size:.75rem;color:var(--text-muted)">${item.createdAt}</td>`;
  const imgTd = src => `<td><div class="td-image">${src ? `<img src="${src}" alt="">` : '🖼️'}</div></td>`;

  switch (section) {
    case 'life':
      return `<tr>${id}${imgTd(item.image)}<td>${escapeHtml(item.title)}</td>
        <td><span class="td-badge badge-gold">${escapeHtml(item.category || '—')}</span></td>
        <td class="truncate">${escapeHtml(item.description)}</td>${ts}${acts}</tr>`;
    case 'timeline':
      return `<tr>${id}<td style="white-space:nowrap;font-weight:600;color:var(--gold-light)">${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.title)}</td>
        <td><span class="td-badge badge-green">${escapeHtml(item.era || '—')}</span></td>
        <td class="truncate">${escapeHtml(item.description)}</td>${ts}${acts}</tr>`;
    case 'hadis':
      return `<tr>${id}
        <td class="truncate" style="font-family:"Noto Naskh Arabic",serif;font-size:1rem;color:var(--gold-light);direction:rtl;text-align:right;max-width:160px">${escapeHtml(item.arabic)}</td>
        <td class="truncate">${escapeHtml(item.translation)}</td>
        <td><span class="td-badge badge-blue">${escapeHtml(item.type || '—')}</span></td>
        <td class="truncate">${escapeHtml(item.reference)}</td>${ts}${acts}</tr>`;
    case 'stories':
      return `<tr>${id}${imgTd(item.image)}<td>${escapeHtml(item.title)}</td>
        <td><span class="td-badge badge-gold">${escapeHtml(item.category || '—')}</span></td>
        <td class="truncate">${escapeHtml(item.description)}</td>${ts}${acts}</tr>`;
    case 'personalities':
      return `<tr>${id}${imgTd(item.image)}
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td style="font-family:"Noto Naskh Arabic",serif;color:var(--gold);direction:rtl">${escapeHtml(item.arabicName || '')}</td>
        <td><span class="td-badge badge-green">${escapeHtml(item.type || '—')}</span></td>
        <td class="truncate">${escapeHtml(item.bio)}</td>${ts}${acts}</tr>`;
    case 'about':
      return `<tr>${id}<td><strong>${escapeHtml(item.title)}</strong></td>
        <td class="truncate">${escapeHtml(item.content)}</td>
        <td><span class="td-badge badge-blue">${escapeHtml(item.type || 'General')}</span></td>${ts}${acts}</tr>`;
    case 'others':
      return `<tr>${id}<td style="font-size:1.4rem">${item.icon || '📌'}</td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="td-badge badge-gold">${escapeHtml(item.type || '—')}</span></td>
        <td class="truncate">${escapeHtml(item.description)}</td>${ts}${acts}</tr>`;
    default: return '';
  }
}

function renderPagination(section, page, totalPages, total, search, filter) {
  const el = document.getElementById(`${section}Pagination`);
  if (!el) return;
  if (!total) { el.innerHTML = ''; return; }
  const from = (page - 1) * PAGE_SIZE + 1, to = Math.min(page * PAGE_SIZE, total);
  let btns = '';
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 3 && i < totalPages - 2 && Math.abs(i - page) > 1) {
      if (i === 4 && page > 5) btns += `<span class="page-btn" style="pointer-events:none">…</span>`;
      continue;
    }
    btns += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage('${section}',${i},'${search}','${filter}')">${i}</button>`;
  }
  el.innerHTML = `
    <span>Showing ${from}–${to} of ${total} entries</span>
    <div class="page-btns">
      <button class="page-btn" onclick="goPage('${section}',${Math.max(1, page - 1)},'${search}','${filter}')" ${page <= 1 ? 'disabled' : ''}>‹</button>
      ${btns}
      <button class="page-btn" onclick="goPage('${section}',${Math.min(totalPages, page + 1)},'${search}','${filter}')" ${page >= totalPages ? 'disabled' : ''}>›</button>
    </div>`;
}

function goPage(section, page, search, filter) {
  pageState[section] = page;
  renderTable(section, search, filter);
}

function openModal(section, id = null) {
  document.getElementById('editId').value = id || '';
  document.getElementById('editSection').value = section;
  clearForm(section);

  const modal = document.getElementById(`modal-${section}`);
  const titleEl = document.getElementById(`modal-${section}-title`);

  if (id) {
    const item = getData(section).find(i => i.id === id);
    if (item) fillForm(section, item);
    if (titleEl) titleEl.textContent = `✏️ Edit ${capitalize(section)}`;
  } else {
    if (titleEl) titleEl.textContent = `➕ Add ${capitalize(section)}`;
  }

  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(section) {
  const modal = document.getElementById(`modal-${section}`);
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  delete tempImages[section];
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
    Object.keys(tempImages).forEach(k => delete tempImages[k]);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
    closeConfirm();
  }
});

const FIELDS = {
  life: ['title', 'category', 'description'],
  timeline: ['date', 'era', 'title', 'description'],
  hadis: ['type', 'arabic', 'transliteration', 'translation', 'reference'],
  stories: ['title', 'category', 'description'],
  personalities: ['name', 'arabicName', 'type', 'era', 'bio'],
  about: ['title', 'type', 'content'],
  others: ['title', 'icon', 'type', 'description']
};

function clearForm(section) {
  (FIELDS[section] || []).forEach(f => {
    const el = document.getElementById(`${section}-${f}`);
    if (el) el.value = '';
  });
  const prev = document.getElementById(`${section}-img-preview`);
  if (prev) prev.innerHTML = `<div class="placeholder"><span>🖼️</span>Click to upload image</div>`;
  delete tempImages[section];
}

function fillForm(section, item) {
  (FIELDS[section] || []).forEach(f => {
    const el = document.getElementById(`${section}-${f}`);
    if (el) el.value = item[f] || '';
  });
  if (item.image) {
    const prev = document.getElementById(`${section}-img-preview`);
    if (prev) prev.innerHTML = `<img src="${item.image}" alt="Preview">`;
    tempImages[section] = item.image;
  }
}

function previewImage(event, previewId) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Image too large. Max 2MB.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const b64 = e.target.result;
    const prev = document.getElementById(previewId);
    if (prev) prev.innerHTML = `<img src="${b64}" alt="Preview">`;
    const section = previewId.replace('-img-preview', '');
    tempImages[section] = b64;
  };
  reader.readAsDataURL(file);
}

const REQUIRED = {
  life: ['title', 'description'],
  timeline: ['date', 'title', 'description'],
  hadis: ['type', 'arabic', 'translation', 'reference'],
  stories: ['title', 'description'],
  personalities: ['name', 'bio'],
  about: ['title', 'content'],
  others: ['title', 'description']
};

function saveEntry(section) {
  const obj = {};
  (FIELDS[section] || []).forEach(f => {
    const el = document.getElementById(`${section}-${f}`);
    obj[f] = el ? el.value.trim() : '';
  });

  for (const r of (REQUIRED[section] || [])) {
    if (!obj[r]) {
      showToast(`Required field missing: ${r}`, 'error');
      document.getElementById(`${section}-${r}`)?.focus();
      return;
    }
  }

  if (tempImages[section]) obj.image = tempImages[section];

  const editId = document.getElementById('editId').value;
  const data = getData(section);

  if (editId) {
    const idx = data.findIndex(i => i.id === editId);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...obj, updatedAt: getTimestamp() };
      saveData(section, data);
      logActivity('Updated', capitalize(section), obj.title || obj.name || obj.arabic?.slice(0, 20) || '—', 'blue');
      showToast('Entry updated successfully!', 'success');
    }
  } else {
    const newItem = { id: generateId(), ...obj, createdAt: getTimestamp(), updatedAt: getTimestamp() };
    data.push(newItem);
    saveData(section, data);
    logActivity('Created', capitalize(section), obj.title || obj.name || obj.arabic?.slice(0, 20) || '—', 'green');
    showToast('New entry added successfully!', 'success');
  }

  closeModal(section);
  renderTable(section);
}

function editEntry(section, id) { openModal(section, id); }

function viewEntry(section, id) {
  const item = getData(section).find(i => i.id === id);
  if (!item) return;
  const title = document.getElementById('view-modal-title');
  const body = document.getElementById('view-modal-body');
  if (!title || !body) return;
  title.textContent = `👁️ ${item.title || item.name || 'Entry'}`;

  const skip = ['id', 'image', 'createdAt', 'updatedAt'];
  const labels = { title: 'Title', name: 'Name', date: 'Date/Year', era: 'Era', category: 'Category', type: 'Type', description: 'Description', bio: 'Biography', arabic: 'Arabic', transliteration: 'Transliteration', translation: 'Translation', reference: 'Reference', content: 'Content', arabicName: 'Arabic Name', icon: 'Icon' };

  let html = '<div style="display:flex;flex-direction:column;gap:14px">';
  if (item.image) html += `<img src="${item.image}" alt="" style="width:100%;max-height:240px;object-fit:cover;border-radius:10px;border:1px solid var(--border)">`;
  Object.entries(item).forEach(([k, v]) => {
    if (skip.includes(k) || !v) return;
    const label = labels[k] || k;
    const isArabic = k === 'arabic' || k === 'arabicName';
    html += `<div style="border-bottom:1px solid var(--border);padding-bottom:12px">
      <div style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:4px">${label}</div>
      <div style="${isArabic ? 'font-family:"Noto Naskh Arabic",serif;font-size:1.2rem;direction:rtl;text-align:right;color:var(--gold-light)' : 'color:var(--text-primary);font-size:.9rem;line-height:1.7'}">${escapeHtml(v)}</div>
    </div>`;
  });
  html += `<div style="display:flex;gap:16px;font-size:.75rem;color:var(--text-muted)">
    <span>🕐 Created: ${item.createdAt}</span>
    <span>✏️ Updated: ${item.updatedAt}</span>
    <span>🆔 ID: ${item.id}</span>
  </div></div>`;
  body.innerHTML = html;
  document.getElementById('modal-view').classList.add('open');
  document.body.style.overflow = 'hidden';
}

let pendingDelete = { section: '', id: '', title: '' };

function confirmDelete(section, id, title) {
  pendingDelete = { section, id, title };
  const dialog = document.getElementById('confirmDialog');
  const msg = document.getElementById('confirmMsg');
  const btn = document.getElementById('confirmDeleteBtn');
  if (msg) msg.textContent = `Delete "${title}"? This cannot be undone.`;
  if (btn) btn.textContent = '🗑️ Delete';
  if (dialog) dialog.classList.add('open');
}

function closeConfirm() {
  const d = document.getElementById('confirmDialog');
  if (d) d.classList.remove('open');
  pendingDelete = { section: '', id: '', title: '' };
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('confirmDeleteBtn');
  if (btn) btn.addEventListener('click', () => window.executeDelete());
});

window.executeDelete = function() {
  if (pendingDelete.section === '__CLEAR_ALL__') {
    ['life', 'timeline', 'hadis', 'stories', 'personalities', 'about', 'others'].forEach(k => {
      cmsSet(k, []);
    });
    updateAllBadges();
    updateAllDashCounts();
    refreshDashboard();
    showToast('All content data cleared.', 'success');
    logActivity('Cleared', 'Settings', 'All Content', 'red');
    closeConfirm();
    refreshStorageInfo();
    const btn = document.getElementById('confirmDeleteBtn');
    if (btn) btn.textContent = '🗑️ Delete';
    return;
  }

  const { section, id, title } = pendingDelete;
  if (!section || !id) return;
  const data = getData(section).filter(i => i.id !== id);
  saveData(section, data);
  logActivity('Deleted', capitalize(section), title, 'red');
  showToast(`Entry "${title}" deleted.`, 'success');
  closeConfirm();
  renderTable(section);
};

function loadSettings() {
  const creds = JSON.parse(localStorage.getItem('cms_credentials') || '{}');
  const ne = document.getElementById('settingName');
  const ue = document.getElementById('settingUsername');
  if (ne) ne.value = creds.name || '';
  if (ue) ue.value = creds.username || '';
}

function saveProfile() {
  const name = document.getElementById('settingName')?.value.trim();
  const username = document.getElementById('settingUsername')?.value.trim();
  if (!name || !username) { showToast('Fill in all fields.', 'error'); return; }
  const creds = JSON.parse(localStorage.getItem('cms_credentials') || '{}');
  creds.name = name;
  creds.username = username;
  localStorage.setItem('cms_credentials', JSON.stringify(creds));
  loadUserInfo();
  showToast('Profile updated!', 'success');
}

function changePassword() {
  const oldP = document.getElementById('settingOldPwd')?.value;
  const newP = document.getElementById('settingNewPwd')?.value;
  const cfmP = document.getElementById('settingConfirmPwd')?.value;
  const creds = JSON.parse(localStorage.getItem('cms_credentials') || '{}');
  if (!oldP || !newP || !cfmP) { showToast('Fill in all password fields.', 'error'); return; }
  if (oldP !== creds.password) { showToast('Current password is incorrect.', 'error'); return; }
  if (newP.length < 6) { showToast('New password must be ≥ 6 characters.', 'error'); return; }
  if (newP !== cfmP) { showToast('New passwords do not match.', 'error'); return; }
  creds.password = newP;
  localStorage.setItem('cms_credentials', JSON.stringify(creds));
  ['settingOldPwd', 'settingNewPwd', 'settingConfirmPwd'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  showToast('Password changed successfully!', 'success');
}

function exportData() {
  const allData = {};
  Object.keys(CMS_KEYS).forEach(k => { allData[k] = getData(k); });
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `cms-export-${Date.now()}.json` });
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      let n = 0;
      Object.keys(CMS_KEYS).forEach(k => {
        if (Array.isArray(data[k])) { cmsSet(k, data[k]); n++; }
      });
      updateAllBadges();
      updateAllDashCounts();
      refreshDashboard();
      showToast(`Imported ${n} sections!`, 'success');
      refreshStorageInfo();
    } catch { showToast('Invalid JSON file.', 'error'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function confirmClearData() {
  pendingDelete = { section: '__CLEAR_ALL__', id: '__CLEAR_ALL__', title: 'ALL CONTENT DATA' };
  const dialog = document.getElementById('confirmDialog');
  const msg = document.getElementById('confirmMsg');
  const btn = document.getElementById('confirmDeleteBtn');
  if (msg) msg.textContent = '⚠️ This deletes ALL content permanently. Cannot be undone!';
  if (btn) btn.textContent = '🗑️ Clear Everything';
  if (dialog) dialog.classList.add('open');
}

function refreshStorageInfo() {
  const el = document.getElementById('storageInfo');
  if (!el) return;
  let total = 0;
  const rows = [];
  Object.entries(CMS_KEYS).forEach(([k, key]) => {
    const val = localStorage.getItem(key) || '';
    const bytes = new Blob([val]).size;
    total += bytes;
    if (k !== 'activity') {
      const count = (JSON.parse(val || '[]')).length;
      rows.push(`<div>📂 <strong style="color:var(--text-primary)">${capitalize(k)}</strong>: ${count} items — ${fmtBytes(bytes)}</div>`);
    }
  });
  rows.push(`<div style="margin-top:8px;color:var(--gold)">📦 Total: <strong>${fmtBytes(total)}</strong></div>`);
  el.innerHTML = rows.join('');
}

function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}

function showToast(message, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-text">${escapeHtml(message)}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.cssText = 'transition:opacity .4s,transform .4s;opacity:0;transform:translateX(20px)';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

console.log('🕌 Islamic History CMS Admin v2 — Connected to Frontend | Bismillah');