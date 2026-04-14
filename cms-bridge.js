/**
 * ============================================================
 * CMS BRIDGE — Unified Storage Layer
 * Shared by Admin Panel AND all Frontend pages
 * islamic-history / cms-bridge.js
 * ============================================================
 *
 * ALL LocalStorage keys are defined ONCE here.
 * Admin writes → Frontend reads → same keys, zero duplication.
 */

'use strict';

// ─────────────────────────────────────────────
// CANONICAL STORAGE KEYS  (single source of truth)
// ─────────────────────────────────────────────
const CMS_KEYS = {
  life:          'cms_life',
  timeline:      'cms_timeline',
  hadis:         'cms_hadis',
  stories:       'cms_stories',
  personalities: 'cms_personalities',
  about:         'cms_about',
  others:        'cms_others',
  activity:      'cms_activity',
  settings:      'cms_site_settings'
};

// ─────────────────────────────────────────────
// READ  — parse JSON safely, default to []
// ─────────────────────────────────────────────
function cmsGet(section) {
  try {
    const raw = localStorage.getItem(CMS_KEYS[section]);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[CMS Bridge] cmsGet error for', section, e);
    return [];
  }
}

// ─────────────────────────────────────────────
// WRITE — stringify and dispatch storage event
// ─────────────────────────────────────────────
function cmsSet(section, data) {
  const key = CMS_KEYS[section];
  const json = JSON.stringify(data);
  localStorage.setItem(key, json);

  window.dispatchEvent(new StorageEvent('storage', {
    key,
    newValue: json,
    storageArea: localStorage
  }));
}

// ─────────────────────────────────────────────
// SUBSCRIBE — react to any storage change
// ─────────────────────────────────────────────
function cmsSubscribe(section, callback) {
  const key = CMS_KEYS[section];
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      try {
        callback(JSON.parse(e.newValue || '[]'));
      } catch { callback([]); }
    }
  });
}

// ─────────────────────────────────────────────
// UTILITIES shared across admin + frontend
// ─────────────────────────────────────────────
function cmsGenerateId() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function cmsTimestamp() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function cmsEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cmsCapitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ─────────────────────────────────────────────
// SEED DATA — pre-loads demo content on first visit
// ─────────────────────────────────────────────
function cmsSeedDemoData() {
  if (localStorage.getItem('cms_seeded')) return;

  const t = cmsTimestamp();

  cmsSet('life', [
    { id: cmsGenerateId(), title: 'The Night of Al-Isra wal-Miraj', category: 'Prophethood', description: 'The miraculous night journey of the Prophet Muhammad ﷺ from Masjid al-Haram to Masjid al-Aqsa and then to the heavens, where the five daily prayers were ordained.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'First Revelation at Cave Hira', category: 'Prophethood', description: 'At age 40, in the Cave of Hira, the angel Jibreel (AS) appeared and delivered the first verses of the Quran: "Iqra" — Read in the name of your Lord.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'The Hijra — Migration to Madinah', category: 'Hijra', description: 'In 622 CE the Prophet ﷺ and companions migrated from Mecca to Madinah, marking the beginning of the Islamic (Hijri) calendar.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Conquest of Mecca', category: 'Final Years', description: 'In 630 CE, the Prophet ﷺ entered Mecca with 10,000 companions, declaring a general amnesty. The Kaaba was cleansed of 360 idols.', image: '', createdAt: t, updatedAt: t }
  ]);

  cmsSet('timeline', [
    { id: cmsGenerateId(), date: '570 CE', era: 'Prophetic Era', title: 'Birth of Prophet Muhammad ﷺ', description: 'Born in Mecca in the Year of the Elephant. The Prophet ﷺ would transform Arabia and the world.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '610 CE', era: 'Prophetic Era', title: 'First Revelation at Cave Hira', description: 'The Angel Jibreel delivers the first verses of the Quran.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '622 CE / 1 AH', era: 'Prophetic Era', title: 'The Hijra — Migration to Madinah', description: 'The Prophet ﷺ migrates from Mecca to Madinah, marking Year 1 of the Islamic Hijri calendar.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '624 CE / 2 AH', era: 'Prophetic Era', title: 'Battle of Badr — First Victory', description: '313 believers defeat an army of ~1,000. The first major military victory of Islam.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '630 CE / 8 AH', era: 'Prophetic Era', title: 'Conquest of Mecca', description: 'The Prophet ﷺ enters Mecca with 10,000 companions. The Kaaba is cleansed of 360 idols.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '632–661 CE', era: 'Caliphate', title: 'The Rightly-Guided Caliphs (Khulafa Rashidun)', description: 'Abu Bakr, Umar, Uthman, and Ali (RA) lead the Muslim community.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '750–1258 CE', era: 'Abbasid', title: 'Abbasid Caliphate — Islamic Golden Age', description: 'Baghdad becomes the center of the world. Scholars revolutionize science, medicine, and mathematics.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), date: '1453 CE', era: 'Ottoman', title: 'Conquest of Constantinople', description: 'Sultan Muhammad al-Fatih fulfills the prophecy of the Prophet ﷺ.', createdAt: t, updatedAt: t }
  ]);

  cmsSet('hadis', [
    { id: cmsGenerateId(), type: 'Hadis', arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', transliteration: 'Innamal a\'malu binniyyaat', translation: 'Indeed, actions are only according to intentions, and every person will get what they intended.', reference: 'Bukhari #1', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), type: 'Dua', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina \'adhaban-nar', translation: 'Our Lord, give us good in this world and good in the hereafter, and protect us from the punishment of the Fire.', reference: 'Quran 2:201', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), type: 'Hadis', arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', transliteration: 'Khayrukum man ta\'allamal Qur\'ana wa \'allamahu', translation: 'The best among you is the one who learns the Quran and teaches it.', reference: 'Bukhari #5027', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), type: 'Dua', arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni \'ilma', translation: 'My Lord, increase me in knowledge.', reference: 'Quran 20:114', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), type: 'Quran', arabic: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ', transliteration: 'Wa ma arsalnaka illa rahmatan lil-\'alamin', translation: 'And We have not sent you except as a mercy to the worlds.', reference: 'Quran 21:107', createdAt: t, updatedAt: t }
  ]);

  cmsSet('stories', [
    { id: cmsGenerateId(), title: 'The Year of Sorrow — Aam al-Huzn', category: 'Seerah', description: 'In 619 CE, the Prophet ﷺ lost both his beloved wife Khadijah (RA) and his uncle Abu Talib.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Battle of Badr — First Victory', category: 'Battle', description: '313 believers faced an army three times their size near the wells of Badr in 624 CE.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Imam al-Bukhari — Master of Hadis', category: 'Scholar', description: 'Muhammad ibn Ismail al-Bukhari compiled over 600,000 hadis, selecting only 7,563 authentic ones.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'House of Wisdom — Bayt al-Hikmah', category: 'Civilisation', description: 'Founded in Baghdad, the House of Wisdom was the world\'s greatest center of knowledge.', image: '', createdAt: t, updatedAt: t }
  ]);

  cmsSet('personalities', [
    { id: cmsGenerateId(), name: 'Abu Bakr As-Siddiq (RA)', arabicName: 'أبو بكر', type: 'Companion', era: '573–634 CE', bio: 'First Caliph of Islam, closest companion of the Prophet ﷺ. Known as As-Siddiq (The Truthful).', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), name: 'Umar ibn al-Khattab (RA)', arabicName: 'عُمَر', type: 'Companion', era: '584–644 CE', bio: 'Second Caliph, Al-Farooq, the great administrator of Islam.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), name: 'Khalid ibn al-Walid (RA)', arabicName: 'خَالِد', type: 'General', era: '585–642 CE', bio: 'Sword of Allah, never lost a single battle. One of the greatest military commanders in history.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), name: 'Aisha bint Abi Bakr (RA)', arabicName: 'عَائِشَة', type: 'Women', era: '614–678 CE', bio: 'Mother of the Believers. Transmitted over 2,000 hadis and was the greatest female scholar of Islam.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), name: 'Ibn Sina (Avicenna)', arabicName: 'ابن سينا', type: 'Scholar', era: '980–1037 CE', bio: 'Father of early modern medicine. Wrote the Canon of Medicine.', image: '', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), name: 'Salahuddin al-Ayyubi', arabicName: 'صلاح الدين', type: 'General', era: '1137–1193 CE', bio: 'Liberator of Jerusalem (1187 CE), known for his chivalry and justice even to his enemies.', image: '', createdAt: t, updatedAt: t }
  ]);

  cmsSet('about', [
    { id: cmsGenerateId(), title: 'Our Mission', type: 'Mission', content: 'To make authentic Islamic history accessible to every Muslim and curious mind through a beautiful, modern digital experience.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Our Vision', type: 'Vision', content: 'A world where every person has access to the profound wisdom of Islamic civilization.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Our Values', type: 'Values', content: 'Authenticity, accuracy, accessibility, and respect for all schools of thought within Islam.', createdAt: t, updatedAt: t }
  ]);

  cmsSet('others', [
    { id: cmsGenerateId(), title: 'Pillars of Islam', icon: '🕋', type: 'Pillars', description: 'The five fundamental acts of worship: Shahada, Salah, Zakat, Sawm, and Hajj.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: '99 Names of Allah', icon: '📿', type: 'Names of Allah', description: 'Al-Asma al-Husna — the beautiful names and attributes of Allah (SWT).', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Islamic Architecture', icon: '🏛️', type: 'Resource', description: 'The art and science of mosque design, calligraphy, and geometric patterns.', createdAt: t, updatedAt: t },
    { id: cmsGenerateId(), title: 'Hijri Calendar', icon: '📅', type: 'Resource', description: 'The Islamic lunar calendar beginning from the Hijra in 622 CE.', createdAt: t, updatedAt: t }
  ]);

  localStorage.setItem('cms_seeded', '1');
  console.log('[CMS Bridge] Demo data seeded ✓');
}

// Auto-seed on load (frontend only)
(function() {
  const page = window.location.pathname.split('/').pop();
  const adminPages = ['admin.html', 'login.html'];
  if (!adminPages.includes(page)) {
    cmsSeedDemoData();
  }
})();