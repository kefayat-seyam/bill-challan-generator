Storage.bindTheme(document.getElementById("themeToggle"));

const mode = "unity";
const select = document.getElementById("clientSelect");
const receivedText = document.getElementById("receivedText");
const deliveryLabel = document.getElementById("deliveryLabel");
const receivedLabel = document.getElementById("receivedLabel");

function companyKey(company) {
  return company.name.trim().toLowerCase();
}

function loadCompanies() {
  const companies = Storage.companies(mode);
  select.innerHTML = "";
  if (!companies.length) {
    const option = document.createElement("option");
    option.textContent = "No saved Unity clients";
    option.value = "";
    select.appendChild(option);
    return;
  }
  companies.forEach(company => {
    const option = document.createElement("option");
    option.value = companyKey(company);
    option.textContent = company.name;
    select.appendChild(option);
  });
  const selected = Storage.get("billChallanSelectedCompany", null);
  if (selected && selected.mode === "unity") {
    const selectedValue = companyKey(selected);
    if ([...select.options].some(option => option.value === selectedValue)) {
      select.value = selectedValue;
    }
  }
  loadSettings();
}

function loadSettings() {
  if (!select.value) return;
  const all = Storage.get(Storage.customizationKey(mode), {});
  const settings = all[select.value] || {};
  receivedText.value = settings.receivedText || "";
  deliveryLabel.value = settings.deliveryLabel || "Delivery By";
  receivedLabel.value = settings.receivedLabel || "Received By";
}

select.addEventListener("change", loadSettings);
document.getElementById("saveCustomization").addEventListener("click", () => {
  if (!select.value) return;
  const all = Storage.get(Storage.customizationKey(mode), {});
  all[select.value] = {
    receivedText: receivedText.value.trim(),
    deliveryLabel: deliveryLabel.value.trim() || "Delivery By",
    receivedLabel: receivedLabel.value.trim() || "Received By"
  };
  Storage.set(Storage.customizationKey(mode), all);
  alert("Challan settings saved.");
});

loadCompanies();
