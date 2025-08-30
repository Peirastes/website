document.addEventListener("DOMContentLoaded", function () {
  // === Search filtering ===
  const searchInput = document.getElementById("search");
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

  // === Lightbox functionality ===
  const overlay = document.getElementById("lightbox-overlay");
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
