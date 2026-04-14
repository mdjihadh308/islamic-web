/**
 * ============================================================
 * ISLAMIC HISTORY — FRONTEND DYNAMIC LOADER
 * Reads from LocalStorage via CMS Bridge, renders all pages
 * ============================================================
 */

'use strict';

/* ─────────────────────────────────────────────
   RENDER HELPERS — reusable UI builders
───────────────────────────────────────────── */

function showLoading(container, style = 'cards') {
  if (!container) return;
  const skeletons = Array(style === 'timeline' ? 4 : 6).fill(0).map(() => {
    if (style === 'timeline') {
      return `<div class="tl-skeleton"><div class="sk-dot"></div><div class="sk-block"><div class="sk-line w60"></div><div class="sk-line w40"></div><div class="sk-line w80"></div></div></div>`;
    }
    if (style === 'list') {
      return `<div class="sk-list-item"><div class="sk-line w80"></div><div class="sk-line w50"></div></div>`;
    }
    return `<div class="sk-card"><div class="sk-img"></div><div class="sk-body"><div class="sk-line w60"></div><div class="sk-line w80"></div><div class="sk-line w40"></div></div></div>`;
  }).join('');
  container.innerHTML = `<div class="skeleton-wrap ${style}">${skeletons}</div>`;
}

function showEmpty(container, icon = '📭', msg = 'No content yet. Check back soon!') {
  if (!container) return;
  container.innerHTML = `
    <div class="fe-empty">
      <div class="fe-empty-icon">${icon}</div>
      <p>${cmsEscape(msg)}</p>
      <span>Content will appear here once added from the Admin Panel.</span>
    </div>`;
}

function badge(label, color = 'gold') {
  if (!label) return '';
  return `<span class="fe-badge fe-badge-${color}">${cmsEscape(label)}</span>`;
}

function imgOrPlaceholder(src, emoji = '🖼️', alt = '') {
  if (src && src.trim()) return `<img src="${src}" alt="${cmsEscape(alt)}" loading="lazy">`;
  return `<span class="img-emoji">${emoji}</span>`;
}

function fadeInCards(container) {
  if (!container) return;
  const cards = container.querySelectorAll('.fe-card, .tl-item, .dua-card, .other-tile, .fe-personality-card, .fe-about-card');
  cards.forEach((c, i) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(20px)';
    setTimeout(() => {
      c.style.transition = `opacity .5s ease ${i * 60}ms, transform .5s ease ${i * 60}ms`;
      c.style.opacity = '1';
      c.style.transform = 'translateY(0)';
    }, 30);
  });
}

/* ─────────────────────────────────────────────
   MODAL (shared detail popup)
───────────────────────────────────────────── */
function openDetailModal(title, bodyHtml) {
  let modal = document.getElementById('fe-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fe-detail-modal';
    modal.className = 'fe-modal-backdrop';
    modal.innerHTML = `
      <div class="fe-modal" role="dialog" aria-modal="true">
        <div class="fe-modal-header">
          <h3 id="fe-modal-title"></h3>
          <button class="fe-modal-close" onclick="closeDetailModal()" aria-label="Close">✕</button>
        </div>
        <div class="fe-modal-body" id="fe-modal-body"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeDetailModal(); });
  }
  document.getElementById('fe-modal-title').textContent = title;
  document.getElementById('fe-modal-body').innerHTML = bodyHtml;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  const m = document.getElementById('fe-detail-modal');
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDetailModal();
});

/* ─────────────────────────────────────────────
   ANIMATE COUNT
───────────────────────────────────────────── */
function animateCount(el, target) {
  if (!el) return;
  if (!target || target === 0) { el.textContent = '0'; return; }
  const dur = 1400;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

/* ─────────────────────────────────────────────
   PAGE: INDEX.HTML (Home)
───────────────────────────────────────────── */
function initHomePage() {
  renderHomeStories();
  renderHomePersonalities();
  renderHomeDuaOfDay();
  renderHomeStats();

  cmsSubscribe('stories', () => renderHomeStories());
  cmsSubscribe('personalities', () => renderHomePersonalities());
  cmsSubscribe('hadis', () => renderHomeDuaOfDay());
  cmsSubscribe('life', () => renderHomeStats());
  cmsSubscribe('timeline', () => renderHomeStats());
  cmsSubscribe('stories', () => renderHomeStats());
}

function renderHomeStories() {
  const container = document.getElementById('home-stories-grid');
  if (!container) return;
  const items = cmsGet('stories').slice(0, 6);
  if (!items.length) { showEmpty(container, '✨', 'No stories yet.'); return; }
  container.innerHTML = items.map(item => `
    <div class="fe-card" onclick="openDetailModal('${cmsEscape(item.title)}', buildStoryModal('${item.id}'))">
      <div class="fe-card-media">${imgOrPlaceholder(item.image, '✨', item.title)}</div>
      <div class="fe-card-body">
        ${badge(item.category, 'gold')}
        <h3>${cmsEscape(item.title)}</h3>
        <p>${cmsEscape(item.description)}</p>
        <div class="fe-card-footer">
          <span class="fe-date">📅 ${cmsEscape(item.createdAt)}</span>
          <span class="fe-read-more">Read More →</span>
        </div>
      </div>
    </div>`).join('');
  fadeInCards(container);
}

function renderHomePersonalities() {
  const container = document.getElementById('home-personalities-grid');
  if (!container) return;
  const items = cmsGet('personalities').slice(0, 8);
  if (!items.length) { showEmpty(container, '👤', 'No personalities yet.'); return; }
  container.innerHTML = items.map(item => `
    <div class="fe-personality-card" onclick="openDetailModal('${cmsEscape(item.name)}', buildPersonalityModal('${item.id}'))">
      <div class="fe-personality-avatar">${item.image ? `<img src="${item.image}" alt="${cmsEscape(item.name)}">` : '🌟'}</div>
      <h4>${cmsEscape(item.name)}</h4>
      ${item.arabicName ? `<div class="fe-arabic-name">${cmsEscape(item.arabicName)}</div>` : ''}
      <p>${cmsEscape(item.bio)}</p>
    </div>`).join('');
  fadeInCards(container);
}

function renderHomeDuaOfDay() {
  const container = document.getElementById('home-dua-box');
  if (!container) return;
  const items = cmsGet('hadis');
  if (!items.length) { container.innerHTML = '<p style="color:var(--text-muted);text-align:center">No du\'a available yet.</p>'; return; }
  const item = items[Math.floor(Math.random() * items.length)];
  container.innerHTML = `
    <div class="fe-dua-featured">
      <div class="fe-arabic">${cmsEscape(item.arabic)}</div>
      ${item.transliteration ? `<div class="fe-translit">${cmsEscape(item.transliteration)}</div>` : ''}
      <div class="fe-translation">${cmsEscape(item.translation)}</div>
      <div class="fe-source">${badge(item.type, 'green')} ${cmsEscape(item.reference)}</div>
    </div>`;
}

function renderHomeStats() {
  const stats = {
    'stat-life': cmsGet('life').length,
    'stat-timeline': cmsGet('timeline').length,
    'stat-hadis': cmsGet('hadis').length,
    'stat-stories': cmsGet('stories').length,
    'stat-personalities': cmsGet('personalities').length,
    'stat-others': cmsGet('others').length
  };
  Object.entries(stats).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateCount(el, val);
  });
}

/* ─────────────────────────────────────────────
   PAGE: LIFE.HTML
───────────────────────────────────────────── */
function initLifePage() {
  renderLife();
  setupSearch('life-search', 'life-filter', () => renderLife());
  cmsSubscribe('life', () => renderLife());
}

function renderLife(search = '', filter = '') {
  const container = document.getElementById('life-grid');
  if (!container) return;
  showLoading(container, 'cards');

  setTimeout(() => {
    let items = cmsGet('life');
    items = applySearchFilter(items, search || getSearchVal('life-search'), filter || getFilterVal('life-filter'));
    if (!items.length) { showEmpty(container, '📖', 'No life entries found.'); return; }
    container.innerHTML = items.map(item => `
      <div class="fe-card" onclick="openDetailModal('${cmsEscape(item.title)}', buildLifeModal('${item.id}'))">
        <div class="fe-card-media">${imgOrPlaceholder(item.image, '📖', item.title)}</div>
        <div class="fe-card-body">
          ${badge(item.category, 'gold')}
          <h3>${cmsEscape(item.title)}</h3>
          <p>${cmsEscape(item.description)}</p>
          <div class="fe-card-footer">
            <span class="fe-date">📅 ${cmsEscape(item.createdAt)}</span>
            <span class="fe-read-more">Read More →</span>
          </div>
        </div>
      </div>`).join('');
    fadeInCards(container);
  }, 100);
}

/* ─────────────────────────────────────────────
   PAGE: TIMELINE.HTML
───────────────────────────────────────────── */
function initTimelinePage() {
  renderTimeline();
  setupSearch('timeline-search', 'timeline-filter', () => renderTimeline());
  cmsSubscribe('timeline', () => renderTimeline());
}

function renderTimeline(search = '', filter = '') {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  showLoading(container, 'timeline');

  setTimeout(() => {
    let items = cmsGet('timeline');
    items = applySearchFilter(items, search || getSearchVal('timeline-search'), filter || getFilterVal('timeline-filter'), 'era');
    if (!items.length) { showEmpty(container, '⏳', 'No timeline events found.'); return; }
    container.innerHTML = `<div class="fe-timeline">${
      items.map((item, i) => `
        <div class="tl-item ${i % 2 === 0 ? 'left' : 'right'}">
          <div class="tl-dot"></div>
          <div class="tl-content" onclick="openDetailModal('${cmsEscape(item.title)}', buildTimelineModal('${item.id}'))">
            <div class="tl-year">📅 ${cmsEscape(item.date)}</div>
            ${badge(item.era, 'green')}
            <h3>${cmsEscape(item.title)}</h3>
            <p>${cmsEscape(item.description)}</p>
          </div>
        </div>`).join('')
    }</div>`;
    fadeInCards(container);
  }, 100);
}

/* ─────────────────────────────────────────────
   PAGE: HADIS.HTML
───────────────────────────────────────────── */
function initHadisPage() {
  renderHadis();
  setupSearch('hadis-search', 'hadis-filter', () => renderHadis());
  cmsSubscribe('hadis', () => renderHadis());
}

function renderHadis(search = '', filter = '') {
  const container = document.getElementById('hadis-grid');
  if (!container) return;
  showLoading(container, 'cards');

  setTimeout(() => {
    let items = cmsGet('hadis');
    items = applySearchFilter(items, search || getSearchVal('hadis-search'), filter || getFilterVal('hadis-filter'), 'type');
    if (!items.length) { showEmpty(container, '🤲', 'No du\'a or hadis found.'); return; }
    container.innerHTML = items.map(item => `
      <div class="dua-card">
        <div class="dua-arabic">${cmsEscape(item.arabic)}</div>
        ${item.transliteration ? `<div class="dua-translit">${cmsEscape(item.transliteration)}</div>` : ''}
        <div class="dua-translation">${cmsEscape(item.translation)}</div>
        <div class="dua-footer">
          ${badge(item.type, item.type === 'Quran' ? 'green' : item.type === 'Hadis' ? 'blue' : 'gold')}
          <span class="dua-source">📚 ${cmsEscape(item.reference)}</span>
          <button class="dua-copy-btn" onclick="copyDua(this, '${item.id}')" title="Copy">📋</button>
        </div>
      </div>`).join('');
    fadeInCards(container);
  }, 100);
}

function copyDua(btn, id) {
  const item = cmsGet('hadis').find(i => i.id === id);
  if (!item) return;
  const text = `${item.arabic}\n\n${item.translation}\n\n— ${item.reference}`;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅';
    setTimeout(() => btn.textContent = '📋', 2000);
  }).catch(() => {
    btn.textContent = '❌';
    setTimeout(() => btn.textContent = '📋', 1500);
  });
}

/* ─────────────────────────────────────────────
   PAGE: NEWSTORY.HTML
───────────────────────────────────────────── */
function initNewStoryPage() {
  renderStories();
  renderPersonalities();
  setupSearch('stories-search', 'stories-filter', () => renderStories());
  setupSearch('personalities-search', 'personalities-filter', () => renderPersonalities());
  cmsSubscribe('stories', () => renderStories());
  cmsSubscribe('personalities', () => renderPersonalities());
  checkUrlSearch();
}

function renderStories(search = '', filter = '') {
  const container = document.getElementById('stories-grid');
  if (!container) return;
  showLoading(container, 'cards');

  setTimeout(() => {
    let items = cmsGet('stories');
    items = applySearchFilter(items, search || getSearchVal('stories-search'), filter || getFilterVal('stories-filter'));
    if (!items.length) { showEmpty(container, '✨', 'No stories found.'); return; }
    container.innerHTML = items.map(item => `
      <div class="fe-card" onclick="openDetailModal('${cmsEscape(item.title)}', buildStoryModal('${item.id}'))">
        <div class="fe-card-media">${imgOrPlaceholder(item.image, '✨', item.title)}</div>
        <div class="fe-card-body">
          ${badge(item.category, 'gold')}
          <h3>${cmsEscape(item.title)}</h3>
          <p>${cmsEscape(item.description)}</p>
          <div class="fe-card-footer">
            <span class="fe-date">📅 ${cmsEscape(item.createdAt)}</span>
            <span class="fe-read-more">Read More →</span>
          </div>
        </div>
      </div>`).join('');
    fadeInCards(container);
  }, 100);
}

function renderPersonalities(search = '', filter = '') {
  const container = document.getElementById('personalities-grid');
  if (!container) return;
  showLoading(container, 'cards');

  setTimeout(() => {
    let items = cmsGet('personalities');
    items = applySearchFilter(items, search || getSearchVal('personalities-search'), filter || getFilterVal('personalities-filter'), 'type');
    if (!items.length) { showEmpty(container, '👤', 'No personalities found.'); return; }
    container.innerHTML = items.map(item => `
      <div class="fe-personality-card" onclick="openDetailModal('${cmsEscape(item.name)}', buildPersonalityModal('${item.id}'))">
        <div class="fe-personality-avatar">${item.image ? `<img src="${item.image}" alt="${cmsEscape(item.name)}">` : '🌟'}</div>
        <h4>${cmsEscape(item.name)}</h4>
        ${item.arabicName ? `<div class="fe-arabic-name">${cmsEscape(item.arabicName)}</div>` : ''}
        ${badge(item.type, 'green')}
        ${item.era ? `<div class="fe-era">🕐 ${cmsEscape(item.era)}</div>` : ''}
        <p>${cmsEscape(item.bio)}</p>
      </div>`).join('');
    fadeInCards(container);
  }, 100);
}

/* ─────────────────────────────────────────────
   PAGE: ABOUT.HTML
───────────────────────────────────────────── */
function initAboutPage() {
  renderAbout();
  cmsSubscribe('about', () => renderAbout());
  
  const stats = {
    'stat-life': cmsGet('life').length,
    'stat-timeline': cmsGet('timeline').length,
    'stat-hadis': cmsGet('hadis').length,
    'stat-personalities': cmsGet('personalities').length
  };
  Object.entries(stats).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateCount(el, val);
  });
}

function renderAbout() {
  const container = document.getElementById('about-sections');
  if (!container) return;

  const items = cmsGet('about');
  if (!items.length) { showEmpty(container, 'ℹ️', 'About content coming soon.'); return; }

  const typeIcons = { Mission: '🎯', Vision: '👁️', Values: '💡', Team: '👥', General: 'ℹ️' };

  container.innerHTML = items.map(item => `
    <div class="fe-about-card">
      <div class="fe-about-icon">${typeIcons[item.type] || 'ℹ️'}</div>
      <div class="fe-about-content">
        ${badge(item.type, 'gold')}
        <h3>${cmsEscape(item.title)}</h3>
        <p>${cmsEscape(item.content)}</p>
      </div>
    </div>`).join('');
  fadeInCards(container);
}

/* ─────────────────────────────────────────────
   PAGE: OTHERS.HTML
───────────────────────────────────────────── */
function initOthersPage() {
  renderOthers();
  setupSearch('others-search', 'others-filter', () => renderOthers());
  cmsSubscribe('others', () => renderOthers());
}

function renderOthers(search = '', filter = '') {
  const container = document.getElementById('others-grid');
  if (!container) return;
  showLoading(container, 'cards');

  setTimeout(() => {
    let items = cmsGet('others');
    items = applySearchFilter(items, search || getSearchVal('others-search'), filter || getFilterVal('others-filter'), 'type');
    if (!items.length) { showEmpty(container, '📚', 'No items found.'); return; }
    container.innerHTML = items.map(item => `
      <div class="other-tile" onclick="openDetailModal('${cmsEscape(item.title)}', buildOtherModal('${item.id}'))">
        <div class="other-tile-icon">${item.icon || '📌'}</div>
        ${badge(item.type, 'gold')}
        <h3>${cmsEscape(item.title)}</h3>
        <p>${cmsEscape(item.description)}</p>
      </div>`).join('');
    fadeInCards(container);
  }, 100);
}

/* ─────────────────────────────────────────────
   MODAL BODY BUILDERS
───────────────────────────────────────────── */
function buildStoryModal(id) {
  const item = cmsGet('stories').find(i => i.id === id);
  if (!item) return '<p>Not found.</p>';
  return `
    ${item.image ? `<img src="${item.image}" alt="${cmsEscape(item.title)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:10px;margin-bottom:16px">` : ''}
    <div style="margin-bottom:10px">${badge(item.category, 'gold')}</div>
    <p style="line-height:1.8;color:var(--text-secondary)">${cmsEscape(item.description)}</p>
    <div style="margin-top:16px;font-size:.78rem;color:var(--text-muted)">📅 ${cmsEscape(item.createdAt)}</div>`;
}

function buildLifeModal(id) {
  const item = cmsGet('life').find(i => i.id === id);
  if (!item) return '<p>Not found.</p>';
  return `
    ${item.image ? `<img src="${item.image}" alt="${cmsEscape(item.title)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:10px;margin-bottom:16px">` : ''}
    <div style="margin-bottom:10px">${badge(item.category, 'gold')}</div>
    <p style="line-height:1.8;color:var(--text-secondary)">${cmsEscape(item.description)}</p>
    <div style="margin-top:16px;font-size:.78rem;color:var(--text-muted)">📅 ${cmsEscape(item.createdAt)}</div>`;
}

function buildTimelineModal(id) {
  const item = cmsGet('timeline').find(i => i.id === id);
  if (!item) return '<p>Not found.</p>';
  return `
    <div style="margin-bottom:12px">${badge(item.era, 'green')}</div>
    <div style="font-family:"Cinzel",serif;color:var(--gold);margin-bottom:10px;font-size:.9rem">📅 ${cmsEscape(item.date)}</div>
    <p style="line-height:1.8;color:var(--text-secondary)">${cmsEscape(item.description)}</p>`;
}

function buildPersonalityModal(id) {
  const item = cmsGet('personalities').find(i => i.id === id);
  if (!item) return '<p>Not found.</p>';
  return `
    <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
      <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#9a7d35,#c9a84c);display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0;overflow:hidden">
        ${item.image ? `<img src="${item.image}" alt="${cmsEscape(item.name)}" style="width:100%;height:100%;object-fit:cover">` : '🌟'}
      </div>
      <div>
        <h4 style="color:var(--gold-light);font-family:"Cinzel",serif;margin-bottom:4px">${cmsEscape(item.name)}</h4>
        ${item.arabicName ? `<div style="font-family:"Noto Naskh Arabic",serif;font-size:1.1rem;color:var(--gold);direction:rtl">${cmsEscape(item.arabicName)}</div>` : ''}
        ${item.era ? `<div style="font-size:.8rem;color:var(--text-muted)">🕐 ${cmsEscape(item.era)}</div>` : ''}
      </div>
    </div>
    <div style="margin-bottom:10px">${badge(item.type, 'green')}</div>
    <p style="line-height:1.8;color:var(--text-secondary)">${cmsEscape(item.bio)}</p>`;
}

function buildOtherModal(id) {
  const item = cmsGet('others').find(i => i.id === id);
  if (!item) return '<p>Not found.</p>';
  return `
    <div style="font-size:2.5rem;margin-bottom:12px">${item.icon || '📌'}</div>
    <div style="margin-bottom:10px">${badge(item.type, 'gold')}</div>
    <p style="line-height:1.8;color:var(--text-secondary)">${cmsEscape(item.description)}</p>`;
}

/* ─────────────────────────────────────────────
   SEARCH & FILTER UTILITIES
───────────────────────────────────────────── */
function applySearchFilter(items, search, filter, filterKey = 'category') {
  let result = [...items];
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(item =>
      Object.values(item).some(v => typeof v === 'string' && v.toLowerCase().includes(q))
    );
  }
  if (filter && filter.trim()) {
    const f = filter.toLowerCase().trim();
    result = result.filter(item => {
      const val = item[filterKey] || item.category || item.type || item.era || '';
      return val.toLowerCase() === f;
    });
  }
  return result;
}

function getSearchVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getFilterVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setupSearch(searchId, filterId, callback) {
  const searchEl = document.getElementById(searchId);
  const filterEl = document.getElementById(filterId);
  if (searchEl) searchEl.addEventListener('input', () => callback());
  if (filterEl) filterEl.addEventListener('change', () => callback());
}

function homeSearch() {
  const q = document.getElementById('home-search-input')?.value.trim();
  if (!q) return;
  window.location.href = `newstory.html?q=${encodeURIComponent(q)}`;
}

function checkUrlSearch() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (!q) return;
  const searchEl = document.getElementById('stories-search');
  if (searchEl) {
    searchEl.value = q;
    searchEl.dispatchEvent(new Event('input'));
  }
}

/* ─────────────────────────────────────────────
   AUTO-DETECT PAGE AND INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

  const pageMap = {
    'index.html': () => { initHomePage(); },
    '': () => { initHomePage(); },
    'life.html': initLifePage,
    'timeline.html': initTimelinePage,
    'hadis.html': initHadisPage,
    'newstory.html': initNewStoryPage,
    'about.html': initAboutPage,
    'others.html': initOthersPage
  };

  const init = pageMap[page];
  if (init) {
    init();
  }
});