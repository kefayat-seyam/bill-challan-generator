Storage.bindTheme(document.getElementById("themeToggle"));

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") === "other" ? "other" : "unity";
const state = {
  documentType: "bill",
  items: [],
  logoDataUrl: "",
  editingCompanyId: null
};

const els = {
  unityIdentity: document.getElementById("unityIdentity"),
  otherIdentity: document.getElementById("otherIdentity"),
  customizeLink: document.getElementById("customizeLink"),
  pinnedEditor: document.getElementById("pinnedEditor"),
  companyList: document.getElementById("companyList"),
  clientName: document.getElementById("clientName"),
  clientAddress: document.getElementById("clientAddress"),
  onBehalf: document.getElementById("onBehalf"),
  defaultBillTitle: document.getElementById("defaultBillTitle"),
  otherCompanyName: document.getElementById("otherCompanyName"),
  otherSignatory: document.getElementById("otherSignatory"),
  otherDesignation: document.getElementById("otherDesignation"),
  otherRef: document.getElementById("otherRef"),
  logoUpload: document.getElementById("logoUpload"),
  billTab: document.getElementById("billTab"),
  challanTab: document.getElementById("challanTab"),
  capitalizeToggle: document.getElementById("capitalizeToggle"),
  commaToggle: document.getElementById("commaToggle"),
  documentRef: document.getElementById("documentRef"),
  documentDate: document.getElementById("documentDate"),
  requisitionNo: document.getElementById("requisitionNo"),
  challanNo: document.getElementById("challanNo"),
  requisitionWrap: document.getElementById("requisitionWrap"),
  challanNoWrap: document.getElementById("challanNoWrap"),
  billTitle: document.getElementById("billTitle"),
  billTitleWrap: document.getElementById("billTitleWrap"),
  itemsTable: document.getElementById("itemsTable"),
  preview: document.getElementById("preview"),
  addRow: document.getElementById("addRow")
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setupMode() {
  const unity = mode === "unity";
  els.unityIdentity.hidden = !unity;
  els.otherIdentity.hidden = unity;
  els.customizeLink.style.display = unity ? "inline-flex" : "none";
  els.documentRef.value = unity ? nextUnityRef(false) : "";
  if (unity) els.documentRef.readOnly = true;
  els.documentDate.value = new Date().toISOString().slice(0, 10);
  els.billTitle.value = "";
  if (unity) {
    els.otherCompanyName.value = "";
  }
}

function nextUnityRef(increment) {
  const serialKey = "billChallanUnitySerial";
  const saved = Number(localStorage.getItem(serialKey));
  const serial = Number.isFinite(saved) && saved >= UNITY_CONFIG.refSerialStart ? saved : UNITY_CONFIG.refSerialStart;
  if (increment) {
    localStorage.setItem(serialKey, String(serial + 1));
  }
  return `${UNITY_CONFIG.refPrefix}/${serial}`;
}

const UNITY_CONFIG = window.UNITY_CONFIG;

function titleCaseOutput(value) {
  if (!els.capitalizeToggle.checked) return value;
  return String(value).replace(/\S+/g, word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

function formatNumber(value) {
  const number = Number(String(value).replace(/,/g, "")) || 0;
  const result = String(Math.round(number * 100) / 100);
  if (!els.commaToggle.checked) return result;
  const [whole, decimal] = result.split(".");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimal ? `.${decimal}` : "");
}

function numberInWordsIndian(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function belowHundred(x) {
    if (x < 20) return ones[x];
    return `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`;
  }
  function belowThousand(x) {
    if (x < 100) return belowHundred(x);
    return `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? " " + belowHundred(x % 100) : ""}`;
  }
  let words = "";
  const crore = Math.floor(n / 10000000);
  const lac = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore) words += `${belowThousand(crore)} Crore `;
  if (lac) words += `${belowHundred(lac)} Lac `;
  if (thousand) words += `${belowThousand(thousand)} Thousand `;
  if (rest) words += belowThousand(rest);
  return words.trim();
}

function addItem(item = {}) {
  state.items.push({
    id: uid(),
    description: item.description || "",
    quantity: item.quantity || "",
    unitPrice: item.unitPrice || "",
    total: item.total || ""
  });
  renderItems();
  renderPreview();
}

function renderItems() {
  els.itemsTable.innerHTML = "";
  state.items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `item-row${state.documentType === "challan" ? " challan" : ""}`;
    row.dataset.id = item.id;

    const number = document.createElement("div");
    number.className = "row-number";
    number.textContent = index + 1;

    const description = document.createElement("textarea");
    description.placeholder = "Description";
    description.value = item.description;

    const quantity = document.createElement("input");
    quantity.placeholder = "Quantity";
    quantity.value = item.quantity;

    row.append(number, description, quantity);

    if (state.documentType === "bill") {
      const unitPrice = document.createElement("input");
      unitPrice.placeholder = "Unit price";
      unitPrice.value = item.unitPrice;
      const total = document.createElement("input");
      total.placeholder = "Total";
      total.value = item.total || calculatedTotal(item);
      row.append(unitPrice, total);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-row";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.items = state.items.filter(entry => entry.id !== item.id);
      renderItems();
      renderPreview();
    });
    row.appendChild(remove);

    [description, quantity].forEach(input => input.addEventListener("input", () => syncAndRender(row)));
    if (state.documentType === "bill") {
      row.querySelectorAll("input")[1].addEventListener("input", () => syncAndRender(row));
      row.querySelectorAll("input")[2].addEventListener("input", () => syncAndRender(row));
    }
    els.itemsTable.appendChild(row);
  });
}

function syncAndRender(row) {
  const item = state.items.find(entry => entry.id === row.dataset.id);
  const inputs = row.querySelectorAll("input, textarea");
  item.description = inputs[0].value;
  if (state.documentType === "challan") {
    item.quantity = inputs[1].value;
  } else {
    item.quantity = inputs[1].value;
    item.unitPrice = inputs[2].value;
    item.total = inputs[3].value;
  }
  if (state.documentType === "bill") {
    const autoTotal = row.querySelectorAll("input")[2];
    if (document.activeElement !== autoTotal) autoTotal.value = calculatedTotal(item);
  }
  renderPreview();
}

function calculatedTotal(item) {
  const quantity = Number(String(item.quantity).replace(/[^0-9.-]/g, "")) || 0;
  const price = Number(String(item.unitPrice).replace(/,/g, "")) || 0;
  return quantity && price ? String(quantity * price) : "";
}

function getBillTotal() {
  return state.items.reduce((sum, item) => {
    const supplied = Number(String(item.total).replace(/,/g, ""));
    if (supplied) return sum + supplied;
    const quantity = Number(String(item.quantity).replace(/[^0-9.-]/g, "")) || 0;
    const price = Number(String(item.unitPrice).replace(/,/g, "")) || 0;
    return sum + quantity * price;
  }, 0);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear());
  return `${dd}/${mm}/${yy}`;
}

function identity() {
  if (mode === "unity") {
    return {
      companyName: UNITY_CONFIG.companyName,
      signatory: UNITY_CONFIG.signatory,
      designation: UNITY_CONFIG.designation,
      logo: UNITY_CONFIG.logo
    };
  }
  return {
    companyName: els.otherCompanyName.value.trim(),
    signatory: els.otherSignatory.value.trim(),
    designation: els.otherDesignation.value.trim(),
    logo: state.logoDataUrl
  };
}

function companyCustomization() {
  if (mode !== "unity") return {};
  const name = els.clientName.value.trim().toLowerCase();
  if (!name) return {};
  const all = Storage.get(Storage.customizationKey(mode), {});
  return all[name] || {};
}

function renderPreview() {
  syncTotalsFromInputs();
  const id = identity();
  const bill = state.documentType === "bill";
  const clientName = titleCaseOutput(els.clientName.value.trim());
  const address = titleCaseOutput(els.clientAddress.value.trim()).replace(/\n/g, "<br>");
  const billTitle = titleCaseOutput(els.billTitle.value.trim());
  const ref = els.documentRef.value.trim();
  const date = formatDate(els.documentDate.value);
  const requisition = els.requisitionNo.value.trim();
  const challanNo = els.challanNo.value.trim();
  const customization = companyCustomization();

  let logoHtml = "";
  if (id.logo) logoHtml = `<img class="doc-logo" src="${id.logo}" alt="">`;

  const tableRows = state.items.map((item, index) => {
    const desc = titleCaseOutput(item.description).replace(/\n/g, "<br>");
    const quantity = formatNumber(item.quantity);
    if (bill) {
      const unit = formatNumber(item.unitPrice);
      const total = formatNumber(item.total || calculatedTotal(item));
      return `<tr><td>${index + 1}</td><td>${desc}</td><td>${quantity}</td><td>${unit}</td><td>${total}</td></tr>`;
    }
    return `<tr><td>${index + 1}</td><td>${desc}</td><td>${quantity}</td></tr>`;
  }).join("") || `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>${bill ? "<td>&nbsp;</td><td>&nbsp;</td>" : ""}</tr>`;

  const table = bill
    ? `<table class="doc-table bills">
        <thead><tr><th>SI.</th><th>Name of Item Descriptions</th><th>Quantity (Pcs)</th><th>Unit Price (Tk.)</th><th>Total Price (Tk.)</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`
    : `<table class="doc-table challan">
        <thead><tr><th>SI.</th><th>Name of Item Descriptions</th><th>Quantity (Pcs)</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`;

  let totalHtml = "";
  if (bill) {
    const total = getBillTotal();
    totalHtml = `<div class="doc-total">Total = <strong>${formatNumber(total)}/- Tk</strong></div>
      <div class="doc-words">In word: ${numberInWordsIndian(total)} Taka Only</div>`;
  }

  let signatureHtml = "";
  if (bill) {
    const signatory = titleCaseOutput(id.signatory);
    const designation = titleCaseOutput(id.designation);
    signatureHtml = `<div class="submitted">
        <div>Submitted By</div>
        <strong>${signatory}<br>${designation}<br>${titleCaseOutput(id.companyName)}</strong>
      </div>`;
  } else {
    const deliveryLabel = customization.deliveryLabel || "Delivery By";
    const receivedLabel = customization.receivedLabel || "Received By";
    const receivedText = customization.receivedText ||
      els.onBehalf.value.trim() ||
      `On Be Half of ${els.clientName.value.trim()}`;
    signatureHtml = `<div class="signature-area">
        <div class="signature-block"><strong>${titleCaseOutput(deliveryLabel)}<br>${titleCaseOutput(id.companyName)}</strong></div>
        <div class="signature-block"><strong>${titleCaseOutput(receivedLabel)}<br>${titleCaseOutput(receivedText)}</strong></div>
      </div>`;
  }

  els.preview.innerHTML = `<article class="document-page centered">
    <div class="doc-ref"><span>Ref: ${ref}</span><span>Date: ${date}</span></div>
    <div class="doc-header">
      <div>${logoHtml}</div>
      <div></div>
      <div></div>
    </div>
    ${requisition ? `<div class="doc-address"><strong>Requisition No: ${titleCaseOutput(requisition)}</strong></div>` : ""}
    <div class="doc-address"><strong>To,</strong>${clientName ? `<br>${clientName}` : ""}${address ? `<br>${address}` : ""}</div>
    ${challanNo ? `<div><strong>Challan no: ${titleCaseOutput(challanNo)}</strong></div>` : ""}
    <div class="doc-title">${bill ? billTitle || "Bill" : "Delivery Challan"}</div>
    ${table}
    ${totalHtml}
    ${signatureHtml}
  </article>`;
}

function syncTotalsFromInputs() {
  const rows = els.itemsTable.querySelectorAll(".item-row");
  rows.forEach(row => {
    const item = state.items.find(entry => entry.id === row.dataset.id);
    if (!item) return;
    const inputs = row.querySelectorAll("input, textarea");
    if (!inputs.length) return;
    item.description = inputs[0].value;
    if (state.documentType === "bill") {
      item.quantity = inputs[1].value;
      item.unitPrice = inputs[2].value;
      item.total = inputs[3].value;
    } else {
      item.quantity = inputs[1].value;
    }
  });
}

function profileObject() {
  return {
    id: state.editingCompanyId || uid(),
    mode,
    name: els.clientName.value.trim(),
    address: els.clientAddress.value.trim(),
    onBehalf: els.onBehalf.value.trim(),
    defaultBillTitle: els.defaultBillTitle.value.trim(),
    pinned: false
  };
}

function renderProfiles() {
  const companies = Storage.companies(mode);
  els.companyList.innerHTML = "";
  els.pinnedEditor.innerHTML = "";

  companies.filter(company => company.pinned).forEach(company => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pin-chip";
    button.textContent = company.name;
    button.addEventListener("click", () => openCompany(company));
    els.pinnedEditor.appendChild(button);
  });

  companies.forEach(company => {
    const row = document.createElement("div");
    row.className = "company-row";

    const name = document.createElement("strong");
    name.textContent = company.name;

    const actions = document.createElement("div");
    actions.className = "company-actions";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "mini-button";
    open.textContent = "Open";
    open.addEventListener("click", () => openCompany(company));

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `mini-button${company.pinned ? " active" : ""}`;
    pin.textContent = company.pinned ? "Pinned" : "Pin";
    pin.addEventListener("click", () => togglePin(company.id));

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "mini-button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openCompany(company, true));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "mini-button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteCompany(company.id));

    actions.append(open, pin, edit, remove);
    row.append(name, actions);
    els.companyList.appendChild(row);
  });
}

function openCompany(company, editOnly = false) {
  els.clientName.value = company.name || "";
  els.clientAddress.value = company.address || "";
  els.onBehalf.value = company.onBehalf || "";
  els.defaultBillTitle.value = company.defaultBillTitle || "";
  els.billTitle.value = company.defaultBillTitle || "";
  state.editingCompanyId = editOnly ? company.id : null;
  renderPreview();
  els.clientName.scrollIntoView({ block: "start" });
}

function togglePin(id) {
  const companies = Storage.companies(mode);
  const index = companies.findIndex(company => company.id === id);
  if (index >= 0) {
    companies[index].pinned = !companies[index].pinned;
    Storage.saveCompanies(mode, companies);
  }
  renderProfiles();
  renderPinnedLandingCache();
}

function renderPinnedLandingCache() {
  // Landing page reads mode-specific localStorage directly, so no cached copy is needed.
}

function deleteCompany(id) {
  if (!confirm("Delete this saved company?")) return;
  const companies = Storage.companies(mode).filter(company => company.id !== id);
  Storage.saveCompanies(mode, companies);
  clearProfile();
  renderProfiles();
}

function clearProfile() {
  state.editingCompanyId = null;
  els.clientName.value = "";
  els.clientAddress.value = "";
  els.onBehalf.value = "";
  els.defaultBillTitle.value = "";
  els.billTitle.value = "";
  renderPreview();
}

document.getElementById("saveCompany").addEventListener("click", () => {
  if (!els.clientName.value.trim()) {
    alert("Enter a client company name.");
    els.clientName.focus();
    return;
  }
  let companies = Storage.companies(mode);
  const profile = profileObject();
  if (state.editingCompanyId) {
    companies = companies.map(company => company.id === state.editingCompanyId
      ? { ...company, ...profile, pinned: company.pinned }
      : company);
  } else {
    const existing = companies.find(company =>
      company.name.trim().toLowerCase() === profile.name.trim().toLowerCase()
    );
    if (existing) {
      profile.id = existing.id;
      profile.pinned = existing.pinned;
      companies = companies.map(company => company.id === existing.id ? profile : company);
    } else {
      companies.push(profile);
    }
  }
  Storage.saveCompanies(mode, companies);
  state.editingCompanyId = null;
  renderProfiles();
  alert("Company profile saved.");
});

document.getElementById("clearProfile").addEventListener("click", clearProfile);

els.billTab.addEventListener("click", () => setDocumentType("bill"));
els.challanTab.addEventListener("click", () => setDocumentType("challan"));

function setDocumentType(type) {
  state.documentType = type;
  els.billTab.classList.toggle("active", type === "bill");
  els.challanTab.classList.toggle("active", type === "challan");
  els.billTitleWrap.hidden = type !== "bill";
  els.requisitionWrap.hidden = type !== "bill";
  els.challanNoWrap.hidden = type !== "challan";
  renderItems();
  renderPreview();
}

els.addRow.addEventListener("click", () => addItem());
[els.clientName, els.clientAddress, els.onBehalf, els.defaultBillTitle, els.documentRef,
  els.documentDate, els.requisitionNo, els.challanNo, els.billTitle,
  els.otherCompanyName, els.otherSignatory, els.otherDesignation, els.otherRef,
  els.capitalizeToggle, els.commaToggle].forEach(element => {
  element.addEventListener("input", renderPreview);
});

els.logoUpload.addEventListener("change", () => {
  const file = els.logoUpload.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.logoDataUrl = reader.result;
    renderPreview();
  };
  reader.readAsDataURL(file);
});

els.otherRef.addEventListener("input", () => {
  els.documentRef.value = els.otherRef.value;
  renderPreview();
});
els.documentRef.addEventListener("input", () => {
  if (mode === "other") els.otherRef.value = els.documentRef.value;
});

function collectDocument() {
  syncTotalsFromInputs();
  return {
    mode,
    documentType: state.documentType,
    clientName: els.clientName.value.trim(),
    clientAddress: els.clientAddress.value.trim(),
    onBehalf: els.onBehalf.value.trim(),
    defaultBillTitle: els.defaultBillTitle.value.trim(),
    billTitle: els.billTitle.value.trim(),
    ref: els.documentRef.value.trim(),
    date: els.documentDate.value,
    requisitionNo: els.requisitionNo.value.trim(),
    challanNo: els.challanNo.value.trim(),
    otherCompanyName: els.otherCompanyName.value.trim(),
    otherSignatory: els.otherSignatory.value.trim(),
    otherDesignation: els.otherDesignation.value.trim(),
    otherRef: els.otherRef.value.trim(),
    logoDataUrl: state.logoDataUrl,
    items: state.items.map(item => ({ ...item })),
    capitalize: els.capitalizeToggle.checked,
    commas: els.commaToggle.checked
  };
}

function restoreDocument(documentData) {
  if (!documentData) return;
  els.clientName.value = documentData.clientName || "";
  els.clientAddress.value = documentData.clientAddress || "";
  els.onBehalf.value = documentData.onBehalf || "";
  els.defaultBillTitle.value = documentData.defaultBillTitle || "";
  els.billTitle.value = documentData.billTitle || "";
  els.documentRef.value = documentData.ref || "";
  els.documentDate.value = documentData.date || "";
  els.requisitionNo.value = documentData.requisitionNo || "";
  els.challanNo.value = documentData.challanNo || "";
  els.otherCompanyName.value = documentData.otherCompanyName || "";
  els.otherSignatory.value = documentData.otherSignatory || "";
  els.otherDesignation.value = documentData.otherDesignation || "";
  els.otherRef.value = documentData.otherRef || "";
  els.capitalizeToggle.checked = documentData.capitalize !== false;
  els.commaToggle.checked = documentData.commas !== false;
  state.logoDataUrl = documentData.logoDataUrl || "";
  state.items = (documentData.items || []).map(item => ({ ...item, id: item.id || uid() }));
  setDocumentType(documentData.documentType === "challan" ? "challan" : "bill");
}

document.getElementById("saveDocument").addEventListener("click", () => {
  const data = collectDocument();
  Storage.set(Storage.documentKey(mode), data);
  if (mode === "unity" && els.documentRef.value === nextUnityRef(false)) {
    nextUnityRef(true);
  }
  els.documentRef.value = mode === "unity" ? nextUnityRef(false) : els.documentRef.value;
  alert("Document saved.");
  renderPreview();
});

document.getElementById("reopenDocument").addEventListener("click", () => {
  const saved = Storage.get(Storage.documentKey(mode), null);
  if (!saved) {
    alert("No saved document found.");
    return;
  }
  restoreDocument(saved);
});

async function downloadPdf() {
  if (!window.html2pdf) {
    alert("PDF library could not load.");
    return;
  }
  const name = `${els.documentRef.value || "document"}-${state.documentType}.pdf`;
  await html2pdf().set({
    margin: 0,
    filename: name,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" }
  }).from(els.preview).save();
}

document.getElementById("downloadPdf").addEventListener("click", downloadPdf);

function docText(value) {
  return titleCaseOutput(String(value || ""));
}

async function downloadDocx() {
  if (!window.docx) {
    alert("DOCX library could not load.");
    return;
  }
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType } = window.docx;
  const id = identity();
  const bill = state.documentType === "bill";
  const children = [
    new Paragraph({ children: [new TextRun(`Ref: ${els.documentRef.value}    Date: ${formatDate(els.documentDate.value)}`)] }),
    new Paragraph({ children: [new TextRun("To,")] }),
    new Paragraph({ children: [new TextRun(docText(els.clientName.value))] }),
    new Paragraph({ children: [new TextRun(docText(els.clientAddress.value))] })
  ];

  if (els.requisitionNo.value.trim() && bill) {
    children.push(new Paragraph({ children: [new TextRun(`Requisition No: ${docText(els.requisitionNo.value)}`)] }));
  }
  if (els.challanNo.value.trim() && !bill) {
    children.push(new Paragraph({ children: [new TextRun(`Challan no: ${docText(els.challanNo.value)}`)] }));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: docText(bill ? els.billTitle.value || "Bill" : "Delivery Challan"), bold: true, underline: {} })]
  }));

  const headers = bill
    ? ["SL", "Name of Item Descriptions", "Quantity (Pcs)", "Unit Price (Tk.)", "Total Price (Tk.)"]
    : ["SL", "Name of Item Descriptions", "Quantity (Pcs)"];
  const headerRow = new TableRow({
    children: headers.map(text => new TableCell({ children: [new Paragraph({ text, alignment: AlignmentType.CENTER })] }))
  });
  const itemRows = state.items.map((item, index) => {
    const cells = [
      new TableCell({ children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })] }),
      new TableCell({ children: [new Paragraph(docText(item.description))] }),
      new TableCell({ children: [new Paragraph({ text: formatNumber(item.quantity), alignment: AlignmentType.CENTER })] })
    ];
    if (bill) {
      cells.push(new TableCell({ children: [new Paragraph({ text: formatNumber(item.unitPrice), alignment: AlignmentType.CENTER })] }));
      cells.push(new TableCell({ children: [new Paragraph({ text: formatNumber(item.total || calculatedTotal(item)), alignment: AlignmentType.CENTER })] }));
    }
    return new TableRow({ children: cells });
  });
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...itemRows]
  }));

  if (bill) {
    const total = getBillTotal();
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(`Total = ${formatNumber(total)}/- Tk`)] }));
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(`In word: ${numberInWordsIndian(total)} Taka Only`)] }));
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("Submitted By")] }));
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: docText(id.signatory), bold: true }),
      new TextRun({ text: `\n${docText(id.designation)}\n${docText(id.companyName)}` })
    ] }));
  } else {
    const customization = companyCustomization();
    children.push(new Paragraph({
      children: [
        new TextRun(`${docText(customization.deliveryLabel || "Delivery By")}     ${docText(customization.receivedLabel || "Received By")}`)
      ],
      alignment: AlignmentType.CENTER
    }));
    children.push(new Paragraph({
      children: [
        new TextRun(`${docText(id.companyName)}     ${docText(customization.receivedText || `On Be Half of ${els.clientName.value.trim()}`)}`)
      ],
      alignment: AlignmentType.CENTER
    }));
  }

  const document = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${els.documentRef.value || "document"}-${state.documentType}.docx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.getElementById("downloadDocx").addEventListener("click", downloadDocx);

setupMode();
setDocumentType("bill");
renderProfiles();
addItem();

const selectedCompany = Storage.get("billChallanSelectedCompany", null);
if (selectedCompany && selectedCompany.mode === mode) {
  openCompany(selectedCompany);
  localStorage.removeItem("billChallanSelectedCompany");
}
