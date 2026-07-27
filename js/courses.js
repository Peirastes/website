/* ============================================================
   PEIRASTES · COURSES · completion hook  (WEB-11)
   ------------------------------------------------------------
   STUB. Reveals per-course progress slots ([data-course-progress])
   only when PeirAuth reports a signed-in user. The actual per-course
   completion data binding is DEFERRED (phase 2 — a completion
   endpoint on the Pi backend, which is currently preoccupied).

   Graceful degradation: if PeirAuth is absent or unreachable, the
   slots simply stay hidden — never a broken UI, never a thrown error
   (matches the auth.js contract).
   ============================================================ */
(function () {
  "use strict";

  function sync() {
    var authed = !!(window.PeirAuth && window.PeirAuth.isLoggedIn && window.PeirAuth.isLoggedIn());
    var slots = document.querySelectorAll("[data-course-progress]");
    for (var i = 0; i < slots.length; i++) {
      slots[i].hidden = !authed;
    }
    // ── Phase 2 (deferred) ──────────────────────────────────────
    // When authed, fetch per-course completion from the Pi backend
    // and, per course, set:
    //   .course-progress__fill { width: <pct>% }
    //   .course-progress__label textContent = "<pct>% complete"
    // Keyed by a data-course-id on each [data-course-progress] slot.
  }

  // auth.js mounts on DOMContentLoaded and confirms the session async;
  // give it a tick before reading isLoggedIn().
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(sync, 80); });
  } else {
    setTimeout(sync, 80);
  }
})();
