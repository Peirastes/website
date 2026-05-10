/* ============================================================
   PEIRASTES · CINEMATIC TIER · CLIENT SCRIPT
   Handles Propylaea→Atrium choreography on the homepage,
   keyboard nav, and the universal corner-chrome injection.
   ============================================================ */

(function () {
  'use strict';

  const body = document.body;
  const isLanding = body.classList.contains('is-landing');

  // Cartographic corner chrome — universal across all cinematic-tier pages.
  // L-bracket marks at the four viewport corners.
  (function injectCartographicChrome() {
    const chrome = document.createElement('div');
    chrome.className = 'cartographic-chrome';
    chrome.setAttribute('aria-hidden', 'true');
    chrome.innerHTML =
      '<span class="chrome-tick chrome-tick--tl"></span>' +
      '<span class="chrome-tick chrome-tick--tr"></span>' +
      '<span class="chrome-tick chrome-tick--bl"></span>' +
      '<span class="chrome-tick chrome-tick--br"></span>';
    body.appendChild(chrome);
  })();

  // Trigger fade-in animations on next frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => body.classList.add('is-ready'));
  });

  // ─── PROPYLAEA → ATRIUM (landing only) ───
  if (isLanding) {
    const items = Array.from(document.querySelectorAll('.menu__item'));
    let stage = 'title';
    let activeIndex = 0;

    function setActive(index) {
      activeIndex = ((index % items.length) + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle('is-active', i === activeIndex));
    }

    /* Measure the title H1's current location and the menu-wordmark H1's
       target location, compute pixel deltas + scale ratio, set CSS vars.
       The transform is applied to the H1 itself (transform-origin = H1
       center), so the deltas map 1:1 to the rendered position — no
       parent transform-origin to compensate for. */
    function calibrateMorph() {
      const titleH1 = document.querySelector('.title-wordmark__name');
      const menuH1  = document.querySelector('.menu-wordmark h1');
      if (!titleH1 || !menuH1) return;
      const t = titleH1.getBoundingClientRect();
      const m = menuH1.getBoundingClientRect();
      const scale = m.height / t.height;
      const dx = (m.left + m.width / 2) - (t.left + t.width / 2);
      const dy = (m.top  + m.height / 2) - (t.top  + t.height / 2);
      body.style.setProperty('--morph-x', dx + 'px');
      body.style.setProperty('--morph-y', dy + 'px');
      body.style.setProperty('--morph-scale', scale.toFixed(4));
    }

    function enterMenu() {
      if (stage !== 'title') return;
      calibrateMorph();
      stage = 'menu';
      body.classList.remove('stage-title');
      body.classList.add('stage-menu');
      setActive(0);
    }

    // Re-measure on resize so a returning visitor or rotated phone
    // gets the correct values when ENTER fires.
    window.addEventListener('resize', () => { if (stage === 'title') calibrateMorph(); });

    function returnToTitle() {
      if (stage !== 'menu') return;
      stage = 'title';
      body.classList.remove('stage-menu');
      body.classList.add('stage-title');
      items.forEach(it => it.classList.remove('is-active'));
    }

    function activate(index) {
      const href = items[index] && items[index].dataset.href;
      if (href) window.location.href = href;
    }

    document.addEventListener('keydown', (e) => {
      if (stage === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          enterMenu();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown': case 'j':
          e.preventDefault(); setActive(activeIndex + 1); break;
        case 'ArrowUp': case 'k':
          e.preventDefault(); setActive(activeIndex - 1); break;
        case 'Enter':
          e.preventDefault(); activate(activeIndex); break;
        case 'Escape':
          e.preventDefault(); returnToTitle(); break;
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.featured')) return;
      if (e.target.closest('.menu__item')) return;
      if (stage === 'title') enterMenu();
    });

    items.forEach((item, idx) => {
      item.addEventListener('mouseenter', () => {
        if (stage === 'menu') setActive(idx);
      });
      item.addEventListener('click', (e) => {
        if (stage === 'menu') {
          e.stopPropagation();
          activate(idx);
        }
      });
    });
  }

  // ─── ROOMS — keyboard nav back to homepage ───
  if (!isLanding) {
    document.addEventListener('keydown', (e) => {
      if (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        window.location.href = '/';
      }
    });
  }

  // ─── Filter logic — shared by Campaign Log (quest cards, status×type)
  //     and Lore Fragments (tag) ───
  const filterPills = document.querySelectorAll('.filter-pill');
  const filterState = { status: 'all', type: 'all', tag: 'all', era: 'all' };

  function applyQuestFilters() {
    const cards = document.querySelectorAll('.quest-card');
    if (!cards.length) return;
    const counter = document.querySelector('[data-quest-count]');
    let visible = 0;
    cards.forEach(card => {
      const matchStatus = filterState.status === 'all' || card.dataset.status === filterState.status;
      const matchType = filterState.type === 'all' || card.dataset.type === filterState.type;
      const ok = matchStatus && matchType;
      card.classList.toggle('is-hidden', !ok);
      if (ok) visible++;
    });
    if (counter) counter.textContent = visible;
  }

  function applyFragmentFilter() {
    const fragments = document.querySelectorAll('.fragment');
    if (!fragments.length) return;
    const counter = document.querySelector('[data-fragment-count]');
    let visible = 0;
    fragments.forEach(f => {
      const tags = (f.dataset.tags || '').split(/\s+/);
      const ok = filterState.tag === 'all' || tags.indexOf(filterState.tag) !== -1;
      f.classList.toggle('is-hidden', !ok);
      if (ok) visible++;
    });
    if (counter) counter.textContent = visible;
  }

  function applyTimelineFilter() {
    const entries = document.querySelectorAll('.timeline-entry');
    if (!entries.length) return;
    const counter = document.querySelector('[data-timeline-count]');
    let visible = 0;
    entries.forEach(e => {
      const tags = (e.dataset.tags || '').split(/\s+/);
      const ok = filterState.era === 'all' || tags.indexOf(filterState.era) !== -1;
      e.classList.toggle('is-hidden', !ok);
      if (ok) visible++;
    });
    if (counter) counter.textContent = visible;
  }

  function applyAllFilters() {
    applyQuestFilters();
    applyFragmentFilter();
    applyTimelineFilter();
  }

  if (filterPills.length) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const group = pill.dataset.group;
        filterState[group] = pill.dataset.filter;
        document.querySelectorAll('.filter-pill[data-group="' + group + '"]').forEach(p => {
          p.classList.toggle('is-active', p === pill);
        });
        applyAllFilters();
      });
    });
  }

  // ─── Campaign Log render — fetch projects.json and build quest-cards ───
  const questGrid = document.querySelector('[data-quest-grid]');
  if (questGrid) {
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    const STATUS_LABEL = { active: 'Active', completed: 'Completed', inactive: 'On Hold' };
    const TYPE_LABEL = { instrument: 'Instrument', treatise: 'Treatise', discourse: 'Discourse' };

    fetch('projects.json')
      .then(r => r.json())
      .then(projects => {
        const visible = projects.filter(p => p.visible !== false);
        // Sort by published date, most recent first
        visible.sort((a, b) => (b.published || '').localeCompare(a.published || ''));

        // Hero stats
        const stats = {
          total: visible.length,
          active: visible.filter(p => p.status === 'active').length,
          completed: visible.filter(p => p.status === 'completed').length,
          inactive: visible.filter(p => p.status === 'inactive').length,
        };
        Object.keys(stats).forEach(key => {
          const el = document.querySelector('[data-stat="' + key + '"]');
          if (el) el.textContent = stats[key];
        });

        // Render quest-cards
        questGrid.innerHTML = visible.map(p => {
          const status = p.status || 'completed';
          const type = p.type || 'discourse';
          return '<a class="quest-card" data-status="' + esc(status) + '" data-type="' + esc(type) + '" href="' + esc(p.link) + '">' +
            '<div class="quest-card__body">' +
              '<div class="quest-card__meta">' +
                '<span class="quest-status quest-status--' + esc(status) + '">' + esc(STATUS_LABEL[status] || status) + '</span>' +
                '<span class="quest-type">' + esc(TYPE_LABEL[type] || type) + '</span>' +
                '<span class="quest-card__date">' + esc(p.published || '') + '</span>' +
              '</div>' +
              '<h3 class="quest-card__title">' + esc(p.title) + '</h3>' +
              '<p class="quest-card__desc">' + esc(p.description) + '</p>' +
            '</div>' +
            '<span class="quest-card__chevron" aria-hidden="true">→</span>' +
          '</a>';
        }).join('');

        // Apply current filter state (in case page loaded with active filters)
        applyQuestFilters();
      })
      .catch(err => {
        console.error('Failed to load projects.json:', err);
        questGrid.innerHTML = '<div class="empty-state">Could not load projects. Check console for details.</div>';
      });
  }

  // Initialize filters on Quotes/Timeline pages (sets initial counter from DOM count)
  applyFragmentFilter();
  applyTimelineFilter();
})();
