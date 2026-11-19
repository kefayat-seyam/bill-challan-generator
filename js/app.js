Storage.bindTheme(document.getElementById("themeToggle"));

const pinnedContainer = document.getElementById("pinnedCompanies");

function renderPinned() {
  const mode = localStorage.getItem("billChallanLandingMode") || "all";
  const unity = Storage.companies("unity").filter(company => company.pinned);
  const other = Storage.companies("other").filter(company => company.pinned);
  const companies = [...unity, ...other];
  pinnedContainer.innerHTML = "";

  if (!companies.length) {
    pinnedContainer.innerHTML = '<span class="muted">No pinned companies yet</span>';
    return;
  }

  companies.forEach(company => {
    const button = document.createElement("button");
    button.className = "pin-chip";
    button.textContent = company.name;
    button.addEventListener("click", () => {
      localStorage.setItem("billChallanSelectedCompany", JSON.stringify(company));
      window.location.href = `generator.html?mode=${company.mode}`;
    });
    pinnedContainer.appendChild(button);
  });
}

function openMode(mode, type = "bill") {
  localStorage.setItem("billChallanLandingMode", mode);
  window.location.href = `generator.html?mode=${mode}&type=${type}`;
}

document.querySelectorAll("[data-document-type]").forEach(option => {
  option.addEventListener("click", event => {
    event.stopPropagation();
    const card = event.currentTarget.closest(".mode-card");
    openMode(card.id === "unityCard" ? "unity" : "other", event.currentTarget.dataset.documentType);
  });
});

document.getElementById("unityCard").addEventListener("click", () => openMode("unity"));
document.getElementById("otherCard").addEventListener("click", () => openMode("other"));

renderPinned();
