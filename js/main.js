// === Theme System ===
console.log('main.js loaded');

// Theme management with CSS variables
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('theme', themeName);
  console.log('Theme set to:', themeName);
}

function getTheme() {
  return localStorage.getItem('theme') || 'light';
}

function initializeTheme() {
  const savedTheme = getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Update dropdown if it exists
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
  console.log('Theme initialized to:', savedTheme);
}

// Initialize theme ASAP to prevent flash
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

// === Archive year toggle ===
function toggleYear(year) {
  const yearList = document.getElementById(year);
  if (yearList) {
    yearList.style.display = yearList.style.display === 'none' ? 'block' : 'none';
  }
}

// === Active nav link indicator ===
function markActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Check if the link matches the current page
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Initialize theme system and other features on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeTheme();
  markActiveNavLink();

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
