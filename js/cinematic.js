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

    function enterMenu() {
      if (stage !== 'title') return;
      stage = 'menu';
      body.classList.remove('stage-title');
      body.classList.add('stage-menu');
      setActive(0);
    }

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

  // ─── Quest grid filter (Projects Campaign Log — Phase 2) ───
  const filterPills = document.querySelectorAll('.filter-pill');
  if (filterPills.length) {
    const cards = Array.from(document.querySelectorAll('.quest-card'));
    const filters = { status: 'all', type: 'all' };
    const counter = document.querySelector('[data-quest-count]');

    function applyFilters() {
      let visible = 0;
      cards.forEach(card => {
        const matchStatus = filters.status === 'all' || card.dataset.status === filters.status;
        const matchType = filters.type === 'all' || card.dataset.type === filters.type;
        const ok = matchStatus && matchType;
        card.classList.toggle('is-hidden', !ok);
        if (ok) visible++;
      });
      if (counter) counter.textContent = visible;
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const group = pill.dataset.group;
        const value = pill.dataset.filter;
        filters[group] = value;
        document.querySelectorAll('.filter-pill[data-group="' + group + '"]').forEach(p => {
          p.classList.toggle('is-active', p === pill);
        });
        applyFilters();
      });
    });
  }
})();
