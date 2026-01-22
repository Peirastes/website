// === Dark Mode Persistence ===
console.log('main.js loaded');

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  console.log('toggleDarkMode clicked - setting localStorage to:', isDarkMode);
  localStorage.setItem('darkMode', isDarkMode);
  console.log('localStorage after set:', localStorage.getItem('darkMode'));
}

function initializeDarkMode() {
  const savedDarkMode = localStorage.getItem('darkMode');
  console.log('initializeDarkMode called - savedDarkMode:', savedDarkMode, 'current class:', document.body.className);
  console.log('Full localStorage:', JSON.stringify(localStorage));
  console.log('window.location:', window.location.href);
  if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
    console.log('Added dark-mode class');
  } else if (savedDarkMode === 'false') {
    document.body.classList.remove('dark-mode');
    console.log('Removed dark-mode class');
  } else {
    console.log('No saved preference, keeping default');
  }
}

// Initialize dark mode preference on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeDarkMode();

  // === Search filtering (only on home page) ===
  const searchInput = document.getElementById("search");
  if (!searchInput) return; // Skip if not on home page

  const projectCards = document.querySelectorAll(".project-card");
  const categoryButtons = document.querySelectorAll("#categories button");

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    projectCards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? "" : "none";
    });
  });

  categoryButtons.forEach(button => {
    button.addEventListener("click", function () {
      const category = this.dataset.category;
      projectCards.forEach(card => {
        const matches = category === "All" || card.dataset.category === category;
        card.style.display = matches ? "" : "none";
      });
    });
  });

  // === Lightbox functionality (only on pages with lightbox) ===
  const overlay = document.getElementById("lightbox-overlay");
  if (!overlay) return; // Skip if no lightbox on this page

  const img = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");

  document.querySelectorAll(".lightbox-trigger").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const src = this.getAttribute("href");
      img.src = src;
      overlay.style.display = "flex";
    });
  });

  closeBtn.addEventListener("click", function () {
    overlay.style.display = "none";
    img.src = "";
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      overlay.style.display = "none";
      img.src = "";
    }
  });
});
