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

    // Returning-visitor short-circuit: if the user has already entered
    // the Atrium during this browser session, skip Propylaea and land
    // them directly in the menu. New sessions still see the first-
    // impression entrance through the title.
    let isReturning = false;
    try {
      isReturning = sessionStorage.getItem('atrium-visited') === '1';
    } catch (e) { /* private mode / storage disabled — fall through */ }

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
      try { sessionStorage.setItem('atrium-visited', '1'); } catch (e) {}
    }

    // If returning, fire the transition immediately and tag the body
    // so CSS can drop the entrance-animation delays for snappy reentry.
    if (isReturning) {
      body.classList.add('is-returning');
      enterMenu();
    }

    /* Align the .atrium-quote's TOP edge to the .menu's TOP edge on
       desktop/tablet (both vertically centered, but quote is shorter).
       On mobile (≤720px) the quote has its own anchor (top: 7rem, below
       profile pip) — we clear inline styles so mobile CSS takes over. */
    (function alignQuoteToMenu() {
      const menu  = document.querySelector('.menu');
      const quote = document.querySelector('.atrium-quote');
      if (!menu || !quote) return;
      function sync() {
        if (window.innerWidth <= 720) {
          quote.style.top = '';
          quote.style.transform = '';
          return;
        }
        requestAnimationFrame(() => {
          const t = menu.getBoundingClientRect().top;
          quote.style.top = t + 'px';
          quote.style.transform = 'none';
        });
      }
      sync();
      window.addEventListener('resize', sync);
    })();

    /* Featured card dismiss — clicking the ✕ in the top-right hides
       the card for the current page load. (No persistence yet — refresh
       brings it back. Persistence can be layered in via localStorage.) */
    (function wireFeaturedDismiss() {
      const featured = document.querySelector('.featured');
      const closeBtn = featured && featured.querySelector('.featured__close');
      if (!featured || !closeBtn) return;
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        featured.classList.add('is-dismissed');
      });
    })();

    /* Shrink .atrium-quote__text font-size until the quote panel fits
       within a viewport-relative budget. Prevents long quotes from
       overflowing the screen (which previously got hard-clipped at
       3 lines via CSS max-height). */
    function fitAtriumQuote(target) {
      if (!target) return;
      const textEl = target.querySelector('.atrium-quote__text');
      if (!textEl) return;
      // Available vertical budget — narrower on mobile where it has to
      // share space between profile pip and menu.
      const isMobile = window.innerWidth <= 720;
      const budgetPx = window.innerHeight * (isMobile ? 0.35 : 0.62);
      // Read computed font size, shrink in 0.5px steps until panel fits
      // its budget or we hit a readability floor (10px).
      let fs = parseFloat(getComputedStyle(textEl).fontSize);
      textEl.style.fontSize = fs + 'px';   // pin it so reads aren't from clamp
      const floor = 10;
      let safety = 80;
      while (target.scrollHeight > budgetPx && fs > floor && safety-- > 0) {
        fs -= 0.5;
        textEl.style.fontSize = fs + 'px';
      }
    }

    /* Pull a random quote from quotes.html and drop it into the
       Atrium .atrium-quote element. Quotes.html is the single source
       of truth — this just fetches, parses, picks, populates. Silent
       fail if anything goes wrong (the quote is optional flourish). */
    (function loadRandomQuote() {
      const target = document.querySelector('.atrium-quote');
      if (!target) return;
      fetch('quotes.html')
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const quoteEls = doc.querySelectorAll('.quote');
          if (!quoteEls.length) return;
          const pick = quoteEls[Math.floor(Math.random() * quoteEls.length)];
          const quoteEl = pick.querySelector('.quote__text');
          const citeEl  = pick.querySelector('.quote__cite');
          if (!quoteEl || !citeEl) return;
          target.querySelector('.atrium-quote__text').textContent = quoteEl.textContent.trim();
          target.querySelector('.atrium-quote__cite').textContent = citeEl.textContent.trim();
          target.classList.add('is-loaded');
          // Fit after layout + fonts settle (fonts can shift word wrapping)
          requestAnimationFrame(() => fitAtriumQuote(target));
          if (document.fonts) document.fonts.ready.then(() => fitAtriumQuote(target));
          // Re-fit on resize / orientation change
          window.addEventListener('resize', () => fitAtriumQuote(target));
        })
        .catch(() => {});
    })();

    function returnToTitle() {
      if (stage !== 'menu') return;
      stage = 'title';
      body.classList.remove('stage-menu', 'is-returning');
      body.classList.add('stage-title');
      items.forEach(it => it.classList.remove('is-active'));
      // Clear the returning-visit flag so a reload from here starts
      // fresh at the Propylaea. Pressing Esc is now a "reset to first
      // impression" affordance, not just a within-page transition.
      try { sessionStorage.removeItem('atrium-visited'); } catch (e) {}
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

  function applyQuoteFilter() {
    const quoteEls = document.querySelectorAll('.quote');
    if (!quoteEls.length) return;
    const counter = document.querySelector('[data-quote-count]');
    let visible = 0;
    quoteEls.forEach(f => {
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
    applyQuoteFilter();
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
    const TYPE_LABEL = { simulator: 'Simulator', application: 'Application', study: 'Study' };

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
  applyQuoteFilter();
  applyTimelineFilter();
})();
