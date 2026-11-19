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

document.getElementById("unityCard").addEventListener("click", () => {
  localStorage.setItem("billChallanLandingMode", "unity");
  window.location.href = "generator.html?mode=unity";
});
document.getElementById("otherCard").addEventListener("click", () => {
  localStorage.setItem("billChallanLandingMode", "other");
  window.location.href = "generator.html?mode=other";
});

renderPinned();
