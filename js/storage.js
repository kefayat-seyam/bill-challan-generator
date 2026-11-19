const Storage = {
  themeKey: "billChallanTheme",
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  initTheme() {
    const theme = localStorage.getItem(this.themeKey) || "dark";
    document.documentElement.dataset.theme = theme;
  },
  bindTheme(button) {
    if (!button) return;
    this.initTheme();
    const setLabel = () => button.textContent = document.documentElement.dataset.theme === "dark" ? "Light" : "Dark";
    setLabel();
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(this.themeKey, next);
      setLabel();
    });
  },
  companyKey(mode) {
    return `billChallanCompanies:${mode}`;
  },
  companies(mode) {
    return this.get(this.companyKey(mode), []);
  },
  saveCompanies(mode, companies) {
    this.set(this.companyKey(mode), companies);
  },
  documentKey(mode) {
    return `billChallanDocument:${mode}`;
  },
  customizationKey(mode) {
    return `billChallanCustomization:${mode}`;
  }
};
