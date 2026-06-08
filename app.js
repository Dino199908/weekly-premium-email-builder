const STORAGE_KEY = "premiumWeeklyEmailBuilder.v1";
const STORE_MAPPING_KEY = "premiumWeeklyEmailBuilder.storeMappings.v1";
const DEFAULT_CC_EMAIL = "KHartley@premiumretail.com";
const defaultSettings = {
  mtdMultiplier: Math.max(new Date().getDate() - 1, 1)
};

const metricDefaults = [
  { name: "Postpaid Activation", mtd: 14, goal: 41, format: "number" },
  { name: "Prepaid Sales", mtd: 30, goal: 60, format: "number" },
  { name: "Prepaid Activation", mtd: 12, goal: 25, format: "number" },
  { name: "Device Protection", mtd: 6.67, goal: 10, format: "percent" },
  { name: "Accessory Sales", mtd: 2431, goal: 8000, format: "currency" }
];

const defaultStoreMappings = [
  { storeNumber: "739", storeName: "", contactName: "", managerEmail: "" },
  { storeNumber: "1743", storeName: "", contactName: "", managerEmail: "" },
  { storeNumber: "1247", storeName: "", contactName: "", managerEmail: "" },
  { storeNumber: "3772", storeName: "", contactName: "", managerEmail: "" }
];

const reportMetricKeys = [
  ["postpspd", "Post PSPD", "number"],
  ["apppspd", "App PSPD", "number"],
  ["preactspspd", "Pre ACTs PSPD", "number"],
  ["preunitspspd", "Pre Units PSPD", "number"],
  ["accpspd", "Accessory PSPD", "currency"],
  ["installretail", "Install Retail", "currency"],
  ["totalprotectrate", "Total Protect Rate", "percent"],
  ["postpspdyoy", "Post PSPD YOY", "percent"],
  ["upgraderate", "Upgrade Rate", "percent"],
  ["byodrate", "BYOD Rate", "percent"],
  ["addalinerate", "Add-a-line Rate", "percent"],
  ["portrate", "Port Rate", "percent"],
  ["postacts", "Post ACTs", "number"],
  ["apps", "Apps", "number"],
  ["byodacts", "BYOD ACTs", "number"],
  ["upgradepspd", "Upgrade PSPD", "number"],
  ["preacts", "Pre ACTs", "number"],
  ["preactrate", "Pre ACT Rate", "percent"],
  ["storecount", "Store Count", "number"]
];

const emailMetricColumns = [
  { defaultIndex: 0, sourceKeys: ["postpaidactivation", "postacts"] },
  { defaultIndex: 1, sourceKeys: ["prepaidsales", "preunits", "preunitspspd"], multiplyDailyPace: true },
  { defaultIndex: 2, sourceKeys: ["preactspspd", "prepaidactivation", "preacts"], multiplyDailyPace: true },
  { defaultIndex: 3, sourceKeys: ["deviceprotection", "totalprotectrate"] },
  { defaultIndex: 4, sourceKeys: ["accessorysales", "accpspd"] }
];

const sampleStores = [
  {
    id: crypto.randomUUID(),
    storeName: "Harlan",
    contactName: "Cathy",
    weekStart: "2026-05-17",
    weekEnd: "2026-05-22",
    visits: [
      { date: "2026-05-17", person: "Henry Stewart" },
      { date: "2026-05-18", person: "Henry Stewart" },
      { date: "2026-05-19", person: "Shane Kelly" },
      { date: "2026-05-20", person: "Shane Kelly" },
      { date: "2026-05-21", person: "Henry Stewart" },
      { date: "2026-05-22", person: "" }
    ],
    importantNotes: "Harlan has been having a rough start to the month, but I am confident that my team can get the sales turned around.",
    helpNotes: "The chart below shows the team's focal metrics and goals for this month for your store, as well as surrounding locations.",
    metrics: metricDefaults
  },
  {
    id: crypto.randomUUID(),
    storeName: "Store 2",
    contactName: "Manager",
    weekStart: "2026-05-17",
    weekEnd: "2026-05-22",
    visits: [],
    importantNotes: "The team is focused on building consistent customer conversations and converting more traffic into activations.",
    helpNotes: "Please continue sending customers our way for accessory bundles, protection conversations, and prepaid opportunities.",
    metrics: metricDefaults.map((metric) => ({ ...metric, mtd: 0 }))
  },
  {
    id: crypto.randomUUID(),
    storeName: "Store 3",
    contactName: "Manager",
    weekStart: "2026-05-17",
    weekEnd: "2026-05-22",
    visits: [],
    importantNotes: "We are watching the month-to-date trend closely and will keep pushing the strongest opportunities.",
    helpNotes: "Any support from the management team around customer handoffs and protection reminders will help us close the gap.",
    metrics: metricDefaults.map((metric) => ({ ...metric, mtd: 0 }))
  },
  {
    id: crypto.randomUUID(),
    storeName: "Store 4",
    contactName: "Manager",
    weekStart: "2026-05-17",
    weekEnd: "2026-05-22",
    visits: [],
    importantNotes: "The team has clear targets for the rest of the month and is working daily to improve the results.",
    helpNotes: "We appreciate the continued partnership and any coaching support around the focal metrics.",
    metrics: metricDefaults.map((metric) => ({ ...metric, mtd: 0 }))
  }
];

let state = loadState();
let activeStoreId = state.stores[0]?.id;
let storeMappings = loadStoreMappings();

const elements = {
  tabs: document.querySelector("#storeTabs"),
  form: document.querySelector("#storeForm"),
  storeNumber: document.querySelector("#storeNumber"),
  storeName: document.querySelector("#storeName"),
  contactName: document.querySelector("#contactName"),
  managerEmail: document.querySelector("#managerEmail"),
  weekStart: document.querySelector("#weekStart"),
  weekEnd: document.querySelector("#weekEnd"),
  importantNotes: document.querySelector("#importantNotes"),
  helpNotes: document.querySelector("#helpNotes"),
  visitsList: document.querySelector("#visitsList"),
  metricsList: document.querySelector("#metricsList"),
  emailPreview: document.querySelector("#emailPreview"),
  emailChecklist: document.querySelector("#emailChecklist"),
  statusText: document.querySelector("#statusText"),
  reportPreview: document.querySelector("#reportPreview"),
  importReview: document.querySelector("#importReview"),
  mtdMultiplier: document.querySelector("#mtdMultiplier"),
  multiplierStatus: document.querySelector("#multiplierStatus"),
  ocrStatus: document.querySelector("#ocrStatus"),
  writerStatus: document.querySelector("#writerStatus"),
  mappingStatus: document.querySelector("#mappingStatus"),
  storeMappingsList: document.querySelector("#storeMappingsList"),
  screenshotDropZone: document.querySelector("#screenshotDropZone"),
  visitTemplate: document.querySelector("#visitTemplate"),
  metricTemplate: document.querySelector("#metricTemplate"),
  mappingTemplate: document.querySelector("#mappingTemplate")
};

document.querySelector("#pasteScreenshotBtn").addEventListener("click", pasteScreenshotFromClipboard);
document.querySelector("#addStoreBtn").addEventListener("click", addStore);
document.querySelector("#addVisitBtn").addEventListener("click", addVisit);
document.querySelector("#addMetricBtn").addEventListener("click", addMetric);
document.querySelector("#deleteStoreBtn").addEventListener("click", deleteActiveStore);
document.querySelector("#sendEmailBtn").addEventListener("click", sendActiveEmail);
document.querySelector("#copyEmailBtn").addEventListener("click", copyActiveEmail);
document.querySelector("#copyAllBtn").addEventListener("click", copyAllEmails);
document.querySelector("#saveEmailBtn").addEventListener("click", saveActiveEmail);
document.querySelector("#saveAllBtn").addEventListener("click", saveAllEmails);
document.querySelector("#polishEmailBtn").addEventListener("click", polishActiveEmail);
document.querySelector("#polishAllBtn").addEventListener("click", polishAllEmails);
document.querySelector("#exportBtn").addEventListener("click", exportData);
document.querySelector("#resetBtn").addEventListener("click", resetData);
document.querySelector("#addStoreMappingBtn").addEventListener("click", addStoreMapping);
document.querySelector("#saveStoreMappingsBtn").addEventListener("click", saveStoreMappingsFromForm);
document.querySelector("#backupSettingsBtn").addEventListener("click", backupSettings);
document.querySelector("#restoreSettingsInput").addEventListener("change", restoreSettings);
document.querySelector("#importInput").addEventListener("change", importData);
document.querySelector("#pasteImportBtn").addEventListener("click", importPastedRows);
document.addEventListener("paste", handleClipboardPaste, true);
elements.screenshotDropZone.addEventListener("click", () => elements.screenshotDropZone.focus());
elements.screenshotDropZone.addEventListener("paste", handleClipboardPaste);
elements.reportPreview.addEventListener("paste", handleClipboardPaste);
elements.reportPreview.addEventListener("drop", blockReportPreviewDrop);

elements.form.addEventListener("input", (event) => {
  if (event.target.closest("#visitsList, #metricsList")) return;
  if (event.target === elements.mtdMultiplier) {
    updateMtdMultiplier();
    return;
  }
  updateActiveStoreFromForm();
  saveAndRender();
});

render();
renderStoreMappings();
loadPersistentStoreMappings();
window.weeklyEmailApp?.onUpdateStatus?.((message) => {
  elements.statusText.textContent = message;
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return normalizeLoadedState({ stores: structuredClone(sampleStores) });
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed.stores) && parsed.stores.length > 0) {
      return normalizeLoadedState(parsed);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return normalizeLoadedState({ stores: structuredClone(sampleStores) });
}

function normalizeLoadedState(value) {
  const stores = Array.isArray(value.stores) && value.stores.length ? value.stores : structuredClone(sampleStores);
  return {
    ...value,
    stores: stores.map(normalizeSavedStore),
    settings: { ...defaultSettings, ...(value.settings || {}) },
    lastImportReview: Array.isArray(value.lastImportReview) ? value.lastImportReview : []
  };
}

function normalizeSavedStore(store) {
  return {
    ...store,
    metrics: normalizeMetricFormats(store.metrics)
  };
}

function normalizeMetricFormats(metrics) {
  const safeMetrics = Array.isArray(metrics) && metrics.length ? metrics : metricDefaults.map((metric) => ({ ...metric, mtd: 0 }));
  return safeMetrics.map((metric) => metric.name === "Prepaid Activation"
    ? { ...metric, format: "number" }
    : metric);
}

function loadStoreMappings() {
  const saved = localStorage.getItem(STORE_MAPPING_KEY);
  if (!saved) {
    return structuredClone(defaultStoreMappings);
  }

  try {
    const parsed = JSON.parse(saved);
    return mergeStoreMappings(Array.isArray(parsed) ? parsed : []);
  } catch {
    localStorage.removeItem(STORE_MAPPING_KEY);
    return structuredClone(defaultStoreMappings);
  }
}

async function loadPersistentStoreMappings() {
  if (!window.weeklyEmailApp?.readStoreMappings) return;

  try {
    const result = await window.weeklyEmailApp.readStoreMappings();
    if (result?.ok && Array.isArray(result.mappings) && result.mappings.length) {
      storeMappings = mergeStoreMappings(result.mappings);
      saveStoreMappings();
      renderStoreMappings();
      applyMappingsToCurrentStores();
      saveAndRender();
    } else {
      saveStoreMappings();
    }
  } catch {
    // Local storage still keeps the app usable if the desktop settings file is unavailable.
  }
}

function mergeStoreMappings(mappings) {
  const merged = new Map(defaultStoreMappings.map((mapping) => [mapping.storeNumber, { ...mapping }]));
  mappings.forEach((mapping) => {
    const storeNumber = String(mapping.storeNumber || "").trim();
    if (!storeNumber) return;
    merged.set(storeNumber, {
      storeNumber,
      storeName: String(mapping.storeName || "").trim(),
      contactName: String(mapping.contactName || "").trim(),
      managerEmail: String(mapping.managerEmail || mapping.email || "").trim()
    });
  });
  return [...merged.values()];
}

function renderStoreMappings() {
  elements.storeMappingsList.innerHTML = "";
  storeMappings.forEach((mapping, index) => {
    elements.storeMappingsList.appendChild(createMappingRow(mapping, index));
  });
}

function createMappingRow(mapping, index) {
  const row = elements.mappingTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".mapping-number").value = mapping.storeNumber || "";
  row.querySelector(".mapping-name").value = mapping.storeName || "";
  row.querySelector(".mapping-contact").value = mapping.contactName || "";
  row.querySelector(".mapping-email").value = mapping.managerEmail || mapping.email || "";
  row.querySelector(".remove-mapping").addEventListener("click", () => {
    storeMappings.splice(index, 1);
    saveStoreMappings();
    renderStoreMappings();
  });
  return row;
}

function addStoreMapping() {
  storeMappings.push({ storeNumber: "", storeName: "", contactName: "", managerEmail: "" });
  renderStoreMappings();
}

function saveStoreMappingsFromForm() {
  syncStoreMappingsFromForm();
  saveStoreMappings();
  renderStoreMappings();
  applyMappingsToCurrentStores();
  saveAndRender();
  elements.mappingStatus.textContent = "Store number settings saved and applied.";
}

function syncStoreMappingsFromForm() {
  storeMappings = [...elements.storeMappingsList.querySelectorAll(".mapping-row")]
    .map((row) => ({
      storeNumber: row.querySelector(".mapping-number").value.trim(),
      storeName: row.querySelector(".mapping-name").value.trim(),
      contactName: row.querySelector(".mapping-contact").value.trim(),
      managerEmail: row.querySelector(".mapping-email").value.trim()
    }))
    .filter((mapping) => mapping.storeNumber || mapping.storeName || mapping.contactName || mapping.managerEmail);
}

function saveStoreMappings() {
  localStorage.setItem(STORE_MAPPING_KEY, JSON.stringify(storeMappings));
  window.weeklyEmailApp?.writeStoreMappings?.(storeMappings).catch(() => {
    // The browser/localStorage copy remains as a fallback.
  });
}

function mappingForStoreNumber(storeNumber) {
  const normalized = String(storeNumber || "").trim();
  return storeMappings.find((mapping) => String(mapping.storeNumber || "").trim() === normalized);
}

function applyMappingToStore(store) {
  const mapping = mappingForStoreNumber(store.storeNumber);
  if (!mapping) return store;

  if (mapping.storeName) store.storeName = mapping.storeName;
  if (mapping.contactName) store.contactName = mapping.contactName;
  if (mapping.managerEmail) store.managerEmail = mapping.managerEmail;
  return store;
}

function applyMappingsToCurrentStores() {
  state.stores.forEach((store) => {
    applyMappingToStore(store);
    store.polishedEmail = "";
  });
}

function render() {
  if (!state.stores.some((store) => store.id === activeStoreId)) {
    activeStoreId = state.stores[0]?.id;
  }

  renderTabs();
  renderForm();
  renderImportSettings();
  renderImportReview();
  renderChecklist();
  renderPreview();
}

function renderImportSettings() {
  elements.mtdMultiplier.value = state.settings?.mtdMultiplier || defaultSettings.mtdMultiplier;
  elements.multiplierStatus.textContent = `Prepaid Sales and Accessory Sales use x${elements.mtdMultiplier.value || defaultSettings.mtdMultiplier} when importing PSPD values.`;
}

function updateMtdMultiplier() {
  const value = Math.max(Number(elements.mtdMultiplier.value || defaultSettings.mtdMultiplier), 1);
  state.settings = { ...defaultSettings, ...(state.settings || {}), mtdMultiplier: value };
  elements.multiplierStatus.textContent = `Prepaid Sales and Accessory Sales use x${value} when importing PSPD values.`;
  saveWithoutRender();
}

function renderImportReview() {
  const review = state.lastImportReview || buildImportReviewRows(state.stores);
  if (!review.length) {
    elements.importReview.innerHTML = `<div class="review-row"><span class="muted">No import reviewed yet.</span></div>`;
    return;
  }

  elements.importReview.innerHTML = "";
  review.forEach((row) => {
    const item = document.createElement("div");
    item.className = `review-row${row.warnings?.length ? " warning" : ""}`;
    item.title = row.warnings?.join(" ") || "";
    item.innerHTML = `
      <strong>${escapeHtml(row.storeNumber || "")}</strong>
      <span>${escapeHtml(row.storeName || "")}${row.managerEmail ? "" : " <span class=\"muted\">(no email)</span>"}</span>
      <span>${escapeHtml(row.values.postpaid)}</span>
      <span>${escapeHtml(row.values.prepaidSales)}</span>
      <span>${escapeHtml(row.values.prepaidActivation)}</span>
      <span>${escapeHtml(row.values.deviceProtection)}</span>
      <span>${escapeHtml(row.values.accessorySales)}</span>
    `;
    elements.importReview.appendChild(item);
  });
}

function renderChecklist() {
  const store = getActiveStore();
  if (!store) {
    elements.emailChecklist.innerHTML = "";
    return;
  }

  const checks = buildChecklist(store);
  elements.emailChecklist.innerHTML = checks
    .map((check) => `<div class="checklist-item ${check.ok ? "ok" : "warn"}">${escapeHtml(check.label)}</div>`)
    .join("");
}

function buildChecklist(store) {
  const metricNames = new Set((store.metrics || []).map((metric) => metric.name));
  return [
    { ok: Boolean(store.managerEmail), label: "Manager email added" },
    { ok: Boolean(store.storeName && !/^Store \d+$/i.test(store.storeName)), label: "Store name mapped" },
    { ok: metricDefaults.every((metric) => metricNames.has(metric.name)), label: "All five metric rows present" },
    { ok: (store.metrics || []).every((metric) => metric.mtd !== "" && Number.isFinite(Number(metric.mtd))), label: "Metrics are readable numbers" },
    { ok: Boolean(store.importantNotes && store.helpNotes), label: "Notes generated" },
    { ok: Boolean(store.polishedEmail), label: "Email polished" }
  ];
}

function buildImportReviewRows(stores) {
  return (stores || []).map((store) => {
    const metrics = metricLookup(store);
    const values = {
      postpaid: reviewValue(metrics["postpaid activation"]),
      prepaidSales: reviewValue(metrics["prepaid sales"]),
      prepaidActivation: reviewValue(metrics["prepaid activation"]),
      deviceProtection: reviewValue(metrics["device protection"]),
      accessorySales: reviewValue(metrics["accessory sales"])
    };
    const warnings = [];
    if (!store.managerEmail) warnings.push("Missing manager email.");
    if (!store.storeName || /^Store \d+$/i.test(store.storeName)) warnings.push("Store name may need mapping.");
    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value === "0") warnings.push(`${key} is blank or zero.`);
    });
    if (Number(metrics["postpaid activation"]?.mtd || 0) > 150) warnings.push("Postpaid Activation looks too high.");
    if (Number(metrics["prepaid sales"]?.mtd || 0) > 1000) warnings.push("Prepaid Sales looks too high.");
    return {
      storeNumber: store.storeNumber || "",
      storeName: store.storeName || "",
      managerEmail: store.managerEmail || "",
      values,
      warnings
    };
  });
}

function reviewValue(metric) {
  if (!metric) return "";
  return formatValue(metric.mtd, metric.format);
}

function finalizeImportedState(imported, previousState) {
  const previousStores = previousState?.stores || [];
  const stores = (imported.stores || []).map((store) => {
    const previous = findPreviousStore(store, previousStores);
    const merged = {
      ...store,
      managerEmail: store.managerEmail || previous?.managerEmail || "",
      visits: Array.isArray(previous?.visits) && previous.visits.length ? previous.visits : store.visits,
      metrics: mergeMetricGoals(store.metrics || [], previous?.metrics || [])
    };
    return applyMappingToStore(merged);
  });

  return {
    ...imported,
    stores,
    settings: { ...defaultSettings, ...(previousState?.settings || state.settings || {}) },
    lastImportReview: buildImportReviewRows(stores)
  };
}

function findPreviousStore(store, stores) {
  const number = String(store.storeNumber || "").trim();
  if (number) {
    const byNumber = stores.find((item) => String(item.storeNumber || "").trim() === number);
    if (byNumber) return byNumber;
  }
  return stores.find((item) => item.storeName && item.storeName === store.storeName);
}

function mergeMetricGoals(metrics, previousMetrics) {
  return metrics.map((metric) => {
    const previous = previousMetrics.find((item) => item.name === metric.name);
    if (metric.name === "Prepaid Activation") {
      return {
        ...metric,
        goal: previous?.goal ?? metric.goal,
        format: "number"
      };
    }
    return previous
      ? { ...metric, goal: previous.goal, format: previous.format || metric.format }
      : metric;
  });
}

function renderTabs() {
  elements.tabs.innerHTML = "";

  state.stores.forEach((store) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `store-tab${store.id === activeStoreId ? " active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(store.storeName || "Untitled Store")}</strong><span>${escapeHtml(store.contactName || "No contact")}</span>`;
    button.addEventListener("click", () => {
      activeStoreId = store.id;
      render();
    });
    elements.tabs.appendChild(button);
  });
}

function renderForm() {
  const store = getActiveStore();
  if (!store) return;

  elements.storeName.value = store.storeName || "";
  elements.storeNumber.value = store.storeNumber || "";
  elements.contactName.value = store.contactName || "";
  elements.managerEmail.value = store.managerEmail || "";
  elements.weekStart.value = store.weekStart || "";
  elements.weekEnd.value = store.weekEnd || "";
  elements.importantNotes.value = store.importantNotes || "";
  elements.helpNotes.value = store.helpNotes || "";

  elements.visitsList.innerHTML = "";
  store.visits.forEach((visit, index) => elements.visitsList.appendChild(createVisitRow(visit, index)));

  elements.metricsList.innerHTML = "";
  store.metrics.forEach((metric, index) => elements.metricsList.appendChild(createMetricRow(metric, index)));
}

function createVisitRow(visit, index) {
  const row = elements.visitTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".visit-date").value = visit.date || "";
  row.querySelector(".visit-person").value = visit.person || "";
  row.querySelector(".visit-date").addEventListener("input", (event) => updateVisit(index, "date", event.target.value));
  row.querySelector(".visit-person").addEventListener("input", (event) => updateVisit(index, "person", event.target.value));
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("blur", () => saveAndRender());
  });
  row.querySelector(".remove-visit").addEventListener("click", () => {
    getActiveStore().visits.splice(index, 1);
    saveAndRender();
  });
  return row;
}

function createMetricRow(metric, index) {
  const row = elements.metricTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".metric-name").value = metric.name || "";
  row.querySelector(".metric-mtd").value = metric.mtd ?? "";
  row.querySelector(".metric-goal").value = metric.goal ?? "";
  row.querySelector(".metric-format").value = metric.format || "number";

  refreshMetricRowProgress(row, metric);

  row.querySelector(".metric-name").addEventListener("input", (event) => updateMetric(index, "name", event.target.value, row));
  row.querySelector(".metric-mtd").addEventListener("input", (event) => updateMetric(index, "mtd", metricInputValue(event.target.value), row));
  row.querySelector(".metric-goal").addEventListener("input", (event) => updateMetric(index, "goal", metricInputValue(event.target.value), row));
  row.querySelector(".metric-format").addEventListener("input", (event) => updateMetric(index, "format", event.target.value, row));
  row.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("blur", () => saveAndRender());
  });
  row.querySelector(".remove-metric").addEventListener("click", () => {
    getActiveStore().metrics.splice(index, 1);
    saveAndRender();
  });

  return row;
}

function refreshMetricRowProgress(row, metric) {
  const progress = calculateProgress(metric);
  const progressEl = row.querySelector(".metric-progress");
  progressEl.style.setProperty("--progress", `${Math.min(progress.percent, 100)}%`);
  progressEl.innerHTML = `<span>${progress.label}</span>`;
}

function metricInputValue(value) {
  return value === "" ? "" : Number(value);
}

function renderPreview() {
  const store = getActiveStore();
  elements.emailPreview.textContent = store?.polishedEmail || buildEmail(store);
}

function updateActiveStoreFromForm() {
  const store = getActiveStore();
  if (!store) return;

  store.storeName = elements.storeName.value;
  store.storeNumber = elements.storeNumber.value;
  store.contactName = elements.contactName.value;
  store.managerEmail = elements.managerEmail.value;
  store.weekStart = elements.weekStart.value;
  store.weekEnd = elements.weekEnd.value;
  store.importantNotes = elements.importantNotes.value;
  store.helpNotes = elements.helpNotes.value;
  store.polishedEmail = "";
}

function updateVisit(index, field, value) {
  const store = getActiveStore();
  store.visits[index][field] = value;
  store.polishedEmail = "";
  saveWithoutRender();
  renderChecklist();
  renderPreview();
}

function updateMetric(index, field, value, row) {
  const store = getActiveStore();
  store.metrics[index][field] = value;
  store.polishedEmail = "";
  if (row) refreshMetricRowProgress(row, store.metrics[index]);
  saveWithoutRender();
  renderChecklist();
  renderPreview();
}

function addStore() {
  const store = {
    id: crypto.randomUUID(),
    storeName: `Store ${state.stores.length + 1}`,
    contactName: "Manager",
    managerEmail: "",
    weekStart: "",
    weekEnd: "",
    visits: [],
    importantNotes: "",
    helpNotes: "",
    metrics: metricDefaults.map((metric) => ({ ...metric, mtd: 0 }))
  };
  state.stores.push(store);
  activeStoreId = store.id;
  saveAndRender();
}

function deleteActiveStore() {
  const store = getActiveStore();
  if (!store) return;

  if (state.stores.length <= 1) {
    alert("You need at least one store in the app.");
    return;
  }

  const label = store.storeName || store.storeNumber || "this store";
  if (!confirm(`Delete ${label}? This removes the store from the current email list.`)) return;

  const index = state.stores.findIndex((item) => item.id === store.id);
  state.stores.splice(index, 1);
  const nextStore = state.stores[Math.max(index - 1, 0)] || state.stores[0];
  activeStoreId = nextStore?.id;
  saveAndRender();
  elements.statusText.textContent = `${label} deleted.`;
}

function addVisit() {
  getActiveStore().visits.push({ date: "", person: "" });
  saveAndRender();
}

function addMetric() {
  getActiveStore().metrics.push({ name: "New Metric", mtd: 0, goal: 0, format: "number" });
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSavedStatus();
  render();
}

function saveWithoutRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSavedStatus();
}

function updateSavedStatus() {
  elements.statusText.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function getActiveStore() {
  return state.stores.find((store) => store.id === activeStoreId);
}

function buildEmail(store) {
  if (!store) return "";

  const visits = store.visits.length
    ? store.visits.map((visit) => `\t\t${formatDate(visit.date)} - ${visit.person || ""}`).join("\n")
    : "\t\tNo visits entered yet.";

  const progressLines = store.metrics
    .map((metric) => {
      if (!Number(metric.goal || 0)) {
        return `${metric.name}: ${formatValue(metric.mtd, metric.format)}`;
      }
      const progress = calculateProgress(metric);
      const remaining = Math.max(Number(metric.goal || 0) - Number(metric.mtd || 0), 0);
      const remainingText = remaining > 0 ? `${formatValue(remaining, metric.format)} remaining` : "goal reached";
      return `${metric.name}: ${progress.label} (${remainingText})`;
    })
    .join("\n");

  const mtdLines = store.metrics
    .map((metric) => `${metric.name}: ${formatValue(metric.mtd, metric.format)}`)
    .join("\n");

  const goalLines = store.metrics
    .filter((metric) => Number(metric.goal || 0) > 0)
    .map((metric) => `${metric.name}: ${formatValue(metric.goal, metric.format)}`)
    .join("\n");

  return `Good morning ${store.contactName || "there"},

Here is your weekly Premium partnership update! First, let's start with who you can expect to see in your store for the next couple of weeks:

${visits}

Important Notes

${store.importantNotes || "No important notes entered yet."}

How you can help us!

${store.helpNotes || "Please continue helping us focus on the team's key monthly metrics and customer opportunities."}

Here is where we are month-to-date and what we are aiming to finish:

${progressLines}

If you or your management team have any questions or concerns, please feel free to contact me anytime.

MTD Numbers:

${mtdLines}

Month Goals:

${goalLines || "No month goals entered yet."}`;
}

function buildPolishedEmail(store) {
  if (!store) return "";

  const visits = store.visits.length
    ? store.visits.map((visit) => `\t\t${formatDate(visit.date)} - ${visit.person || ""}`).join("\n")
    : "\t\tNo visits entered yet.";

  const summary = buildPolishedSummary(store);
  const support = buildPolishedSupport(store);
  const progressLines = buildProgressLines(store);
  const mtdLines = buildMtdLines(store);
  const goalLines = buildGoalLines(store);

  return `Good morning ${store.contactName || "there"},

Here is your weekly Premium partnership update. First, here is who you can expect to see in your store over the next couple of weeks:

${visits}

Important Notes

${summary}

How you can help us!

${support}

Here is where the team stands month-to-date and where we are focused for the rest of the month:

${progressLines}

If you or your management team have any questions or concerns, please feel free to contact me anytime.

MTD Numbers:

${mtdLines}

Month Goals:

${goalLines || "No month goals entered yet."}`;
}

function buildPolishedSummary(store) {
  const metrics = metricLookup(store);
  const wins = getMetricWins(metrics);
  const focus = getMetricFocus(metrics);
  const snapshots = [];

  addMetricSentence(snapshots, metrics, "Postpaid Activation", "Postpaid Activation");
  addMetricSentence(snapshots, metrics, "Prepaid Sales", "Prepaid Sales");
  addMetricSentence(snapshots, metrics, "Prepaid Activation", "Prepaid Activation");
  addMetricSentence(snapshots, metrics, "Device Protection", "Device Protection");
  addMetricSentence(snapshots, metrics, "Accessory Sales", "Accessory Sales");

  const opener = snapshots.length
    ? `${store.storeName || "The store"} is currently sitting at ${snapshots.join(", ")}.`
    : cleanSentence(store.importantNotes) || `${store.storeName || "The store"} has been reviewed from the latest update.`;

  const winSentence = wins.length
    ? `The strongest opportunities to build from are ${joinPhrase(wins)}.`
    : "The team has room to build momentum across the key focus areas.";

  const focusSentence = focus.length
    ? `The biggest focus for the next stretch should be ${joinPhrase(focus)}.`
    : "The goal now is to keep the current pace consistent and continue improving the customer conversations that drive the monthly results.";

  return `${opener} ${winSentence} ${focusSentence}`;
}

function buildPolishedSupport(store) {
  const focus = getMetricFocus(metricLookup(store));
  if (!focus.length) {
    return "Please continue partnering with us on strong customer handoffs, protection conversations, app engagement, and accessory attachment. That support helps the team keep the momentum moving in the right direction.";
  }

  return `The biggest help from the store team this week would be continued support around ${joinPhrase(focus)}. Strong handoffs, consistent protection reminders, app conversations, and accessory attachment will give us the best chance to close the gaps and finish the month stronger.`;
}

function buildProgressLines(store) {
  return store.metrics
    .map((metric) => {
      if (!Number(metric.goal || 0)) {
        return `${metric.name}: ${formatValue(metric.mtd, metric.format)}`;
      }
      const progress = calculateProgress(metric);
      const remaining = Math.max(Number(metric.goal || 0) - Number(metric.mtd || 0), 0);
      const remainingText = remaining > 0 ? `${formatValue(remaining, metric.format)} remaining` : "goal reached";
      return `${metric.name}: ${progress.label} (${remainingText})`;
    })
    .join("\n");
}

function buildMtdLines(store) {
  return store.metrics
    .map((metric) => `${metric.name}: ${formatValue(metric.mtd, metric.format)}`)
    .join("\n");
}

function buildGoalLines(store) {
  return store.metrics
    .filter((metric) => Number(metric.goal || 0) > 0)
    .map((metric) => `${metric.name}: ${formatValue(metric.goal, metric.format)}`)
    .join("\n");
}

function metricLookup(store) {
  return Object.fromEntries((store.metrics || []).map((metric) => [metric.name.toLowerCase(), metric]));
}

function getMetricWins(metrics) {
  const wins = [];
  const protect = Number(metrics["total protect rate"]?.mtd ?? metrics["device protection"]?.mtd ?? 0);
  const postPspd = Number(metrics["post pspd"]?.mtd ?? 0);
  const appPspd = Number(metrics["app pspd"]?.mtd ?? 0);
  const preActRate = Number(metrics["pre act rate"]?.mtd ?? metrics["prepaid activation"]?.mtd ?? 0);
  const accessory = Number(metrics["accessory pspd"]?.mtd ?? metrics["accessory sales"]?.mtd ?? 0);

  if (protect >= 10) wins.push("protection performance");
  if (postPspd >= 1.1) wins.push("postpaid pace");
  if (appPspd >= 3) wins.push("app activity");
  if (preActRate >= 30 || preActRate >= 25) wins.push("prepaid activation rate");
  if (accessory >= 150) wins.push("accessory attachment");
  return wins.slice(0, 3);
}

function getMetricFocus(metrics) {
  const focus = [];
  const protect = Number(metrics["total protect rate"]?.mtd ?? metrics["device protection"]?.mtd ?? 0);
  const postPspd = Number(metrics["post pspd"]?.mtd ?? 0);
  const appPspd = Number(metrics["app pspd"]?.mtd ?? 0);
  const accessory = Number(metrics["accessory pspd"]?.mtd ?? metrics["accessory sales"]?.mtd ?? 0);
  const postYoy = Number(metrics["post pspd yoy"]?.mtd ?? 0);

  if (postPspd > 0 && postPspd < 1.1) focus.push("postpaid activation pace");
  if (appPspd > 0 && appPspd < 3) focus.push("app activity");
  if (protect < 10) focus.push("device protection");
  if (accessory > 0 && accessory < 150) focus.push("accessory sales");
  if (postYoy < -20) focus.push("turning around the postpaid year-over-year trend");
  return uniqueList(focus).slice(0, 3);
}

function addMetricSentence(parts, metrics, name, label) {
  const metric = metrics[name.toLowerCase()];
  if (!metric) return;
  parts.push(`${label} at ${formatValue(metric.mtd, metric.format)}`);
}

function cleanSentence(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function calculateProgress(metric) {
  const mtd = Number(metric.mtd || 0);
  const goal = Number(metric.goal || 0);
  if (goal <= 0) {
    return {
      percent: 0,
      label: "No goal set"
    };
  }
  const percent = goal > 0 ? (mtd / goal) * 100 : 0;
  return {
    percent,
    label: `${Math.round(percent)}% to goal`
  };
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return `${month}/${day}`;
}

function formatValue(value, format) {
  const number = Number(value || 0);

  if (format === "currency") {
    return number.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  if (format === "percent") {
    return `${trimNumber(number)}%`;
  }

  return trimNumber(number);
}

function trimNumber(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

async function copyActiveEmail() {
  await navigator.clipboard.writeText(buildEmail(getActiveStore()));
  elements.statusText.textContent = "Current email copied.";
}

async function copyAllEmails() {
  await navigator.clipboard.writeText(buildAllEmails());
  elements.statusText.textContent = "All store emails copied.";
}

async function sendActiveEmail() {
  const store = getActiveStore();
  if (!store) return;

  const email = String(store.managerEmail || "").trim();
  if (!email) {
    elements.statusText.textContent = "Add a manager email address before sending.";
    alert("Add a manager email address for this store in Store Details or Store Number Settings first.");
    return;
  }

  const subject = `${store.storeName || `Store ${store.storeNumber || ""}`} Weekly Premium Partnership Update`.trim();
  const body = store.polishedEmail || buildEmail(store);

  if (window.weeklyEmailApp?.openEmailDraft) {
    const result = await window.weeklyEmailApp.openEmailDraft({ to: email, cc: DEFAULT_CC_EMAIL, subject, body });
    if (!result?.ok) {
      showImportError(result?.error || "Windows could not open an email draft. Check your default mail app.");
      return;
    }
    elements.statusText.textContent = `Email draft opened for ${email} with ${DEFAULT_CC_EMAIL} copied.`;
    return;
  }

  window.location.href = `mailto:${encodeURIComponent(email)}?cc=${encodeURIComponent(DEFAULT_CC_EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  elements.statusText.textContent = `Email draft opened for ${email} with ${DEFAULT_CC_EMAIL} copied.`;
}

async function saveActiveEmail() {
  const store = getActiveStore();
  const fileName = `${slugify(store?.storeName || "store")}-weekly-email.txt`;
  await saveTextFile({
    title: "Save Weekly Email",
    defaultName: fileName,
    text: store?.polishedEmail || buildEmail(store)
  });
}

async function saveAllEmails() {
  const allEmails = buildAllEmails();
  await saveTextFile({
    title: "Save All Weekly Emails",
    defaultName: "all-weekly-premium-emails.txt",
    text: allEmails
  });
}

function buildAllEmails() {
  return state.stores
    .map((store) => `--- ${store.storeName} ---\n\n${store.polishedEmail || buildEmail(store)}`)
    .join("\n\n\n");
}

function polishActiveEmail() {
  const store = getActiveStore();
  if (!store) return;
  store.polishedEmail = buildPolishedEmail(store);
  saveAndRender();
  elements.writerStatus.textContent = `${store.storeName} email polished.`;
}

function polishAllEmails() {
  polishAllStores();
  saveAndRender();
  elements.writerStatus.textContent = `All ${state.stores.length} emails polished.`;
}

function polishAllStores() {
  state.stores.forEach((store) => {
    store.polishedEmail = buildPolishedEmail(store);
  });
}

async function saveTextFile({ title, defaultName, text }) {
  if (window.weeklyEmailApp?.saveTextFile) {
    const result = await window.weeklyEmailApp.saveTextFile({ title, defaultName, text });
    if (!result.canceled) {
      elements.statusText.textContent = `Saved to ${result.filePath}`;
    }
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = defaultName;
  link.click();
  URL.revokeObjectURL(url);
  elements.statusText.textContent = "Email file downloaded.";
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "weekly-email-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function backupSettings() {
  syncStoreMappingsFromForm();
  saveStoreMappings();
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    storeMappings,
    settings: { ...defaultSettings, ...(state.settings || {}) },
    storeGoals: state.stores.map((store) => ({
      storeNumber: store.storeNumber || "",
      storeName: store.storeName || "",
      metrics: (store.metrics || []).map((metric) => ({
        name: metric.name,
        goal: metric.goal,
        format: metric.format
      }))
    }))
  };
  downloadJson(backup, "weekly-email-settings-backup.json");
  elements.mappingStatus.textContent = "Settings backup created.";
}

async function restoreSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());
    if (Array.isArray(backup.storeMappings)) {
      storeMappings = mergeStoreMappings(backup.storeMappings);
      saveStoreMappings();
      renderStoreMappings();
      applyMappingsToCurrentStores();
    }
    if (backup.settings) {
      state.settings = { ...defaultSettings, ...backup.settings };
    }
    if (Array.isArray(backup.storeGoals)) {
      restoreStoreGoals(backup.storeGoals);
    }
    saveAndRender();
    elements.mappingStatus.textContent = "Settings restored.";
  } catch (error) {
    showImportError(error?.message || "That settings backup could not be restored.");
  } finally {
    event.target.value = "";
  }
}

function restoreStoreGoals(storeGoals) {
  storeGoals.forEach((saved) => {
    const store = state.stores.find((item) =>
      (saved.storeNumber && item.storeNumber === saved.storeNumber) ||
      (saved.storeName && item.storeName === saved.storeName)
    );
    if (!store) return;
    store.metrics = mergeMetricGoals(store.metrics || [], saved.metrics || []);
  });
}

function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "store";
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    syncStoreMappingsFromForm();
    saveStoreMappings();

    if (file.type.startsWith("image/")) {
      state = await importImageAndPolish(file);
    } else {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        state = finalizeImportedState(await normalizeWorkbookImport(file), state);
      } else {
        const text = await file.text();
        if (fileName.endsWith(".json")) {
          state = finalizeImportedState(normalizeJsonImport(JSON.parse(text)), state);
        } else {
          state = finalizeImportedState(normalizeTextReportImport(text), state);
        }
      }
    }

    activeStoreId = state.stores[0]?.id;
    saveAndRender();
  } catch (error) {
    showImportError(error);
  }

  event.target.value = "";
}

async function importPastedRows() {
  const text = getReportPreviewText();
  if (!text && window.weeklyEmailApp?.readClipboardImage) {
    try {
      const result = await window.weeklyEmailApp.readClipboardImage();
      const clipboardText = clipboardTableText(result);
      if (clipboardText) {
        importReportTextAndPolish(clipboardText);
        return;
      }
    } catch {
      // Fall through to the clear user-facing message below.
    }
  }

  if (!text) {
    showImportError("Copy the actual report table rows first, then click Paste Report Rows. For screenshots, use Paste Screenshot.");
    return;
  }

  if (!looksLikeReportText(text)) {
    clearReportPreview();
    showImportError("That text does not look like the store report table. It may be bad OCR from Windows. Copy the table rows or use a clearer screenshot.");
    return;
  }

  importReportTextAndPolish(text);
}

function blockReportPreviewDrop(event) {
  event.preventDefault();
  showImportError("Use Paste Screenshot or Paste Report Rows instead of dropping text into this preview.");
}

function importReportTextAndPolish(text) {
  syncStoreMappingsFromForm();
  saveStoreMappings();

  state = finalizeImportedState(normalizeTextReportImport(text), state);
  if (!state.stores.length) {
    clearReportPreview();
    showImportError("I could not find store rows in that pasted report. Make sure the paste includes StoreNumber and the metric columns.");
    return;
  }

  activeStoreId = state.stores[0]?.id;
  polishAllStores();
  setReportPreview(text);
  saveAndRender();
  elements.writerStatus.textContent = `Imported and polished ${state.stores.length} store email${state.stores.length === 1 ? "" : "s"}.`;
}

async function handleClipboardPaste(event) {
  if (event.defaultPrevented) return;

  const imageFile = findClipboardImage(event.clipboardData);
  if (imageFile) {
    event.preventDefault();
    await importImageAndPolishSafely(imageFile);
    return;
  }

  const clipboardText = clipboardTableText({
    text: event.clipboardData?.getData("text/plain") || "",
    html: event.clipboardData?.getData("text/html") || ""
  });

  if (clipboardText) {
    event.preventDefault();
    importReportTextAndPolish(clipboardText);
    return;
  }

  if (event.target === elements.reportPreview || event.target.closest?.("#screenshotDropZone")) {
    event.preventDefault();
    clearReportPreview();
    showImportError("That paste does not look like the store report table. Copy the actual table rows, or copy a clearer full-width screenshot and use Paste Screenshot.");
  }
}

async function pasteScreenshotFromClipboard() {
  elements.screenshotDropZone.classList.add("active");
  try {
    if (window.weeklyEmailApp?.readClipboardImage) {
      const result = await window.weeklyEmailApp.readClipboardImage();
      if (!result.ok) {
        throw new Error(result.error || "No screenshot was found on the clipboard.");
      }

      const clipboardText = clipboardTableText(result);
      if (clipboardText) {
        state = finalizeImportedState(normalizeTextReportImport(clipboardText), state);
        if (state.stores.length) {
          activeStoreId = state.stores[0]?.id;
          polishAllStores();
          setReportPreview(clipboardText);
          saveAndRender();
          elements.ocrStatus.textContent = `Copied report rows imported and polished: ${state.stores.length} store row${state.stores.length === 1 ? "" : "s"} found.`;
          elements.writerStatus.textContent = `Smart Writer drafted ${state.stores.length} store email${state.stores.length === 1 ? "" : "s"}.`;
          return;
        }
      }

      if (!result.dataUrl) {
        throw new Error("No screenshot was found on the clipboard. Copy the screenshot again, then click Paste Screenshot.");
      }

      await importImageAndPolishSafely(dataUrlToFile(result.dataUrl, "clipboard-screenshot.png"));
      return;
    }

    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          await importImageAndPolishSafely(new File([blob], "clipboard-screenshot.png", { type: imageType }));
          return;
        }
      }
    }

    elements.ocrStatus.textContent = "No screenshot found. Copy the screenshot, then press Ctrl+V anywhere in the app.";
  } catch {
    elements.ocrStatus.textContent = "Press Ctrl+V to paste the screenshot into the app.";
    elements.screenshotDropZone.focus();
  } finally {
    elements.screenshotDropZone.classList.remove("active");
  }
}

function clipboardTableText(result) {
  const text = String(result.text || "").trim();
  if (looksLikeReportText(text)) return text;

  const html = String(result.html || "");
  if (!html) return "";

  const document = new DOMParser().parseFromString(html, "text/html");
  const rows = [...document.querySelectorAll("tr")]
    .map((row) => [...row.children].map((cell) => cell.textContent.trim()).join("\t"))
    .filter(Boolean);

  const tableText = rows.join("\n").trim();
  return looksLikeReportText(tableText) ? tableText : "";
}

function looksLikeReportText(text) {
  const compact = normalizeHeader(text);
  return compact.includes("storenumber") || /\b\d{3,6}\b[\s\S]*\bpost\b[\s\S]*\bapps?\b/i.test(text);
}

function setReportPreview(text) {
  elements.reportPreview.textContent = text || "Recognized report rows will appear here after a valid paste.";
}

function clearReportPreview() {
  setReportPreview("");
}

function getReportPreviewText() {
  const text = elements.reportPreview.textContent.trim();
  return text === "Recognized report rows will appear here after a valid paste." ? "" : text;
}

function findClipboardImage(clipboardData) {
  if (!clipboardData?.items) return null;

  for (const item of clipboardData.items) {
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }

  return null;
}

async function importImageAndPolishSafely(file) {
  try {
    state = await importImageAndPolish(file);
    activeStoreId = state.stores[0]?.id;
    saveAndRender();
  } catch (error) {
    showImportError(error);
  }
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}

function showImportError(error) {
  const message = typeof error === "string"
    ? error
    : error?.message || "Something went wrong while reading the screenshot. Copy it again and try Paste Screenshot.";
  elements.ocrStatus.textContent = message;
  alert(message);
}

async function importImageAndPolish(file) {
  const imported = finalizeImportedState(await normalizeImageImport(file), state);
  if (!imported.stores.length) {
    throw new Error("I could not find any store rows in that screenshot. Try a clearer, full-width screenshot.");
  }

  imported.stores.forEach((store) => {
    store.polishedEmail = buildPolishedEmail(store);
  });

  elements.writerStatus.textContent = `Smart Writer drafted ${imported.stores.length} store email${imported.stores.length === 1 ? "" : "s"}.`;
  elements.ocrStatus.textContent = `Screenshot imported and polished: ${imported.stores.length} store row${imported.stores.length === 1 ? "" : "s"} found.`;
  return imported;
}

async function normalizeImageImport(file) {
  if (!window.Tesseract) {
    throw new Error("OCR did not load. Check your internet connection, reload this page, and try the screenshot again.");
  }

  elements.ocrStatus.textContent = "Reading screenshot... this can take 10 to 30 seconds.";
  const image = await prepareImageForOcr(file);
  const ocrAssets = getOcrAssetPaths();
  const result = await Tesseract.recognize(image, "eng", {
    workerPath: ocrAssets.workerPath,
    corePath: ocrAssets.corePath,
    langPath: ocrAssets.langPath,
    tessedit_pageseg_mode: "6",
    preserve_interword_spaces: "1",
    logger: (event) => {
      if (event.status === "recognizing text") {
        elements.ocrStatus.textContent = `Reading screenshot... ${Math.round(event.progress * 100)}%`;
      }
    }
  });

  const text = result.data.text.trim();
  if (!text) {
    throw new Error("I could not read text from that screenshot. Try a sharper screenshot or upload the CSV export.");
  }

  const imported = normalizeTextReportImport(text);
  if (!imported.stores.length) {
    clearReportPreview();
    throw new Error("The screenshot text was too small or blurry for OCR to read the store table. Zoom the report larger, copy a full-width screenshot, or paste the copied Excel/report rows instead.");
  }

  setReportPreview(text);
  elements.ocrStatus.textContent = `Screenshot imported: ${imported.stores.length} store row${imported.stores.length === 1 ? "" : "s"} found.`;
  return imported;
}

function getOcrAssetPaths() {
  return window.weeklyEmailApp?.ocrAssets || {
    workerPath: new URL("vendor/tesseract/worker.min.js", window.location.href).href,
    corePath: new URL("vendor/tesseract/tesseract-core-simd-lstm.wasm.js", window.location.href).href,
    langPath: new URL("vendor/tesseract/lang", window.location.href).href
  };
}

async function prepareImageForOcr(file) {
  const image = await loadImage(file);
  const scale = Math.min(Math.max(4200 / image.width, 2), 6);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index];
    const green = pixels.data[index + 1];
    const blue = pixels.data[index + 2];
    const gray = (red * 0.299) + (green * 0.587) + (blue * 0.114);
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    let boosted = ((gray - 128) * 1.85) + 128;

    if (gray > 235 && saturation < 45) boosted = 255;
    if (gray < 95) boosted = 0;

    boosted = Math.max(0, Math.min(255, boosted));
    pixels.data[index] = boosted;
    pixels.data[index + 1] = boosted;
    pixels.data[index + 2] = boosted;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be opened. Try PNG, JPG, or WEBP."));
    };
    image.src = url;
  });
}

async function normalizeWorkbookImport(file) {
  if (!window.XLSX) {
    throw new Error("Excel import did not load. Restart the app and try again.");
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "pivot") || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const cleanRows = rows
    .map((row) => row.map((cell) => cell === null || cell === undefined ? "" : String(cell).trim()))
    .filter((row) => row.some(Boolean));

  if (!cleanRows.length) {
    throw new Error("That workbook did not have any readable rows.");
  }

  const headers = cleanRows[0].map(normalizeHeader);
  if (!headers.includes("storenumber") || !hasReportMetricHeader(headers)) {
    throw new Error("That workbook does not look like the Store Sales Card pivot export.");
  }

  return normalizePerformanceReport(cleanRows.slice(1), headers);
}

function normalizeJsonImport(data) {
  if (Array.isArray(data.stores)) return data;
  if (Array.isArray(data)) return { stores: data.map(normalizeStore) };
  throw new Error("JSON must contain a stores array or be an array of stores.");
}

function normalizeTextReportImport(text) {
  const rows = parseDelimited(text);
  const headers = rows[0]?.map(normalizeHeader) || [];

  if (headers.includes("storenumber") && hasReportMetricHeader(headers)) {
    return ensureExpectedStores(normalizePerformanceReport(rows.slice(1), headers));
  }

  const ocrImport = normalizeOcrReport(text);
  if (ocrImport.stores.length) {
    return ensureExpectedStores(ocrImport);
  }

  return ensureExpectedStores(normalizeCsvImport(text));
}

function normalizeCsvImport(text) {
  const rows = parseDelimited(text);
  const headers = rows.shift().map(normalizeHeader);

  if (headers.includes("storenumber") && hasReportMetricHeader(headers)) {
    return normalizePerformanceReport(rows, headers);
  }

  const stores = new Map();

  rows.forEach((row) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
    const storeNumber = record.storenumber || record.storeid || record.locationnumber || "";
    const key = storeNumber || record.store || record.storename || "Imported Store";
    if (!stores.has(key)) {
      stores.set(key, normalizeStore({
        storeNumber,
        storeName: record.storename || record.store || (storeNumber ? `Store ${storeNumber}` : key),
        contactName: record.contact || record.contactname || record.manager || "Manager",
        weekStart: record.weekstart || "",
        weekEnd: record.weekend || "",
        visits: [],
        importantNotes: record.importantnotes || "",
        helpNotes: record.helpnotes || "",
        metrics: []
      }));
    }

    const store = stores.get(key);
    if (record.visitdate || record.representative || record.person) {
      store.visits.push({ date: record.visitdate, person: record.representative || record.person });
    }
    if (record.metric) {
      store.metrics.push({
        name: record.metric,
        mtd: Number(record.mtd || 0),
        goal: Number(record.goal || 0),
        format: record.format || guessMetricFormat(record.metric)
      });
    }
  });

  return { stores: Array.from(stores.values()) };
}

function normalizePerformanceReport(rows, headers) {
  const records = rows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])))
    .filter((record) => record.storenumber);

  const benchmark = records.find((record) => record.storenumber.toLowerCase() === "grand total");
  const stores = records
    .filter((record) => record.storenumber.toLowerCase() !== "grand total")
    .map((record) => {
      const metrics = performanceMetricsFromRecord(record);

      return normalizeStore({
        storeNumber: record.storenumber,
        storeName: `Store ${record.storenumber}`,
        contactName: "Manager",
        visits: [],
        importantNotes: buildReportNote(record, benchmark),
        helpNotes: buildHelpNote(record, benchmark),
        metrics
      });
    });

  return { stores };
}

function normalizeOcrReport(text) {
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\n{2,}/g, "\n");

  const chunks = splitOcrStoreRows(cleaned);

  const records = chunks
    .map(parseOcrStoreLine)
    .filter(Boolean);

  const benchmark = records.find((record) => record.isTotal);
  const stores = records
    .filter((record) => !record.isTotal)
    .map((record) => normalizeStore({
      storeNumber: record.storenumber,
      storeName: `Store ${record.storenumber}`,
      contactName: "Manager",
      visits: [],
      importantNotes: buildReportNote(record, benchmark),
      helpNotes: buildHelpNote(record, benchmark),
      metrics: performanceMetricsFromRecord(record)
    }));

  return { stores };
}

function ensureExpectedStores(imported) {
  const stores = Array.isArray(imported.stores) ? imported.stores : [];
  const existingNumbers = new Set(stores.map((store) => String(store.storeNumber || "").trim()).filter(Boolean));

  expectedStoreMappings().forEach((mapping) => {
    const storeNumber = String(mapping.storeNumber || "").trim();
    if (!storeNumber || existingNumbers.has(storeNumber)) return;

    stores.push(normalizeStore({
      storeNumber,
      storeName: mapping.storeName || `Store ${storeNumber}`,
      contactName: mapping.contactName || "Manager",
      managerEmail: mapping.managerEmail || "",
      visits: [],
      importantNotes: `The screenshot did not include a readable row for Store ${storeNumber}. Please review this store's numbers before sending.`,
      helpNotes: "Please review the month-to-date numbers for this store and update any unread values before sending.",
      metrics: metricDefaults.map((metric) => ({ ...metric, mtd: 0 }))
    }));
    existingNumbers.add(storeNumber);
  });

  return { stores };
}

function expectedStoreMappings() {
  const merged = new Map();
  [...defaultStoreMappings, ...storeMappings].forEach((mapping) => {
    const storeNumber = String(mapping.storeNumber || "").trim();
    if (!storeNumber) return;
    const existing = merged.get(storeNumber) || { storeNumber, storeName: "", contactName: "", managerEmail: "" };
    merged.set(storeNumber, {
      storeNumber,
      storeName: mapping.storeName || existing.storeName,
      contactName: mapping.contactName || existing.contactName,
      managerEmail: mapping.managerEmail || mapping.email || existing.managerEmail || ""
    });
  });
  return [...merged.values()];
}

function splitOcrStoreRows(text) {
  const knownStoreNumbers = expectedStoreMappings()
    .map((mapping) => String(mapping.storeNumber || "").trim())
    .filter((value, index, items) => /^\d{3,6}$/.test(value) && items.indexOf(value) === index);

  if (knownStoreNumbers.length) {
    const escaped = knownStoreNumbers.map(escapeRegExp).join("|");
    const knownPattern = new RegExp(`\\b(${escaped}|Grand\\s+Total)\\b`, "gi");
    const starts = [];
    let knownMatch;
    while ((knownMatch = knownPattern.exec(text)) !== null) {
      starts.push({ label: knownMatch[1], index: knownMatch.index });
    }

    const knownChunks = starts
      .map((start, index) => `${start.label} ${text.slice(start.index + start.label.length, starts[index + 1]?.index ?? text.length).replace(/\n/g, " ")}`)
      .filter((chunk) => /\d/.test(chunk));

    if (knownChunks.length) return knownChunks;
  }

  const chunks = [];
  const rowPattern = /(?:^|\n)\s*(\d{3,6}|Grand\s+Total)\b([\s\S]*?)(?=\n\s*(?:\d{3,6}|Grand\s+Total)\b|$)/gi;
  let match;
  while ((match = rowPattern.exec(text)) !== null) {
    const storeNumber = match[1].replace(/\s+/g, " ");
    const body = match[2].replace(/\n/g, " ");
    chunks.push(`${storeNumber} ${body}`);
  }

  return chunks;
}

function parseOcrStoreLine(line) {
  const trimmed = line.trim();
  const isTotal = /^grand\s+total/i.test(trimmed);

  const storeMatch = isTotal
    ? trimmed.match(/^(Grand\s+Total)\b\s*(.*)$/i)
    : trimmed.match(/^(\d{3,6})\b\s*(.*)$/);
  if (!storeMatch) return null;

  const valueMatches = [...storeMatch[2].matchAll(/-?\$?\d+(?:,\d{3})*(?:\.\d+)?%?/g)];
  if (!valueMatches.length) return null;

  const hasFullReportRow = valueMatches.length >= reportMetricKeys.length;
  const metricValueMatches = hasFullReportRow
    ? valueMatches.slice(-reportMetricKeys.length)
    : valueMatches.slice(-Math.min(valueMatches.length, 6));
  const firstValueIndex = metricValueMatches[0].index;
  const territory = storeMatch[2].slice(0, firstValueIndex).trim();
  const values = metricValueMatches.map((item) => item[0]);
  const keys = hasFullReportRow
    ? reportMetricKeys.map(([key]) => key)
    : shortOcrMetricKeys(values.length);

  const record = {
    storenumber: storeMatch[1],
    territorysm: isTotal ? "" : territory,
    isTotal
  };

  keys.forEach((key, index) => {
    if (values[index] !== undefined) record[key] = values[index];
  });

  if (!hasFullReportRow) {
    const labeledPostpaid = labeledNumberValue(storeMatch[2], /(?:postpaid\s+activation|post\s+acts?)/i);
    const labeledPreUnits = labeledNumberValue(storeMatch[2], /pre\s*units(?:\s*pspd)?/i);
    const labeledPrepaidActivation = labeledNumberValue(storeMatch[2], /(?:prepaid\s+activation|pre\s*acts?(?:\s*pspd)?)/i);
    const labeledProtection = labeledNumberValue(storeMatch[2], /(?:device\s+protection|total\s+protect\s+rate)/i);
    const labeledAccessory = labeledNumberValue(storeMatch[2], /(?:accessory\s+sales|acc(?:essory)?\s*pspd)/i);

    if (labeledPostpaid !== "") record.postacts = labeledPostpaid;
    if (labeledPreUnits !== "") record.preunitspspd = labeledPreUnits;
    if (labeledPrepaidActivation !== "") record.preactspspd = labeledPrepaidActivation;
    if (labeledProtection !== "") record.totalprotectrate = labeledProtection;
    if (labeledAccessory !== "") record.accpspd = labeledAccessory;
  }

  return record;
}

function performanceMetricsFromRecord(record) {
  return emailMetricColumns.map(({ defaultIndex, sourceKeys }) => {
    const metric = metricDefaults[defaultIndex];
    return {
      ...metric,
      mtd: metricMtdFromRecord(record, metric.name, sourceKeys)
    };
  });
}

function metricMtdFromRecord(record, metricName, sourceKeys) {
  if (metricName === "Prepaid Sales") {
    const rawSales = firstRecordValue(record, ["prepaidsales", "preunits"]);
    if (rawSales !== "") return parseMetricNumber(rawSales);

    const preUnitsPspd = firstRecordValue(record, ["preunitspspd"]);
    const preUnitsValue = parseMetricNumber(preUnitsPspd);
    return preUnitsPspd === "" || preUnitsValue > 25
      ? 0
      : roundMetricValue(preUnitsValue * mtdPaceMultiplier());
  }

  if (metricName === "Postpaid Activation") {
    const postActs = firstRecordValue(record, ["postacts"]);
    if (postActs !== "") return parseMetricNumber(postActs);

    const postpaidActivation = firstRecordValue(record, ["postpaidactivation"]);
    const value = parseMetricNumber(postpaidActivation);
    return postpaidActivation === "" || value > 150 ? 0 : value;
  }

  if (metricName === "Accessory Sales") {
    const rawAccessorySales = firstRecordValue(record, ["accessorysales"]);
    if (rawAccessorySales !== "") return parseMetricNumber(rawAccessorySales);

    const accessoryPspd = firstRecordValue(record, ["accpspd"]);
    return accessoryPspd === ""
      ? 0
      : roundMetricValue(parseMetricNumber(accessoryPspd) * mtdPaceMultiplier());
  }

  if (metricName === "Prepaid Activation") {
    const preActsPspd = firstRecordValue(record, ["preactspspd"]);
    const preActsValue = parseMetricNumber(preActsPspd);
    if (preActsPspd !== "" && preActsValue <= 25) {
      return Math.round(preActsValue * mtdPaceMultiplier());
    }

    const rawPreActs = firstRecordValue(record, ["prepaidactivation", "preacts"]);
    return rawPreActs === "" ? 0 : parseMetricNumber(rawPreActs);
  }

  if (metricName === "Device Protection") {
    return rateMetricFromRecord(record, sourceKeys);
  }

  const value = firstRecordValue(record, sourceKeys);
  return value === "" ? 0 : parseMetricNumber(value);
}

function rateMetricFromRecord(record, sourceKeys) {
  const value = firstRecordValue(record, sourceKeys);
  if (value === "") return 0;
  const parsed = parseMetricNumber(value);
  return String(value).includes("%") || parsed > 1 ? parsed : roundMetricValue(parsed * 100);
}

function shortOcrMetricKeys(valueCount) {
  if (valueCount >= 6) {
    return ["postacts", "apps", "preunitspspd", "preactrate", "totalprotectrate", "accpspd"];
  }

  return ["postacts", "apps", "preactrate", "totalprotectrate", "accpspd"].slice(0, valueCount);
}

function normalizeStore(store) {
  return applyMappingToStore({
    id: store.id || crypto.randomUUID(),
    storeNumber: store.storeNumber || store.storenumber || "",
    storeName: store.storeName || store.store || "Imported Store",
    contactName: store.contactName || store.contact || "Manager",
    managerEmail: store.managerEmail || store.email || "",
    weekStart: store.weekStart || "",
    weekEnd: store.weekEnd || "",
    visits: Array.isArray(store.visits) ? store.visits : [],
    importantNotes: store.importantNotes || "",
    helpNotes: store.helpNotes || "",
    metrics: normalizeMetricFormats(store.metrics)
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseDelimited(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  if (firstLine.includes("\t")) {
    return text
      .split(/\r?\n/)
      .map((line) => line.split("\t").map((cell) => cell.trim()))
      .filter((row) => row.some(Boolean));
  }

  return parseCsv(text);
}

function normalizeHeader(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[$%]/g, "")
    .replace(/\.\.\.$/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function hasReportMetricHeader(headers) {
  const sourceKeys = emailMetricColumns.flatMap((metric) => metric.sourceKeys);
  return headers.some((header) => sourceKeys.includes(header));
}

function firstRecordValue(record, keys) {
  const key = keys.find((item) => record[item] !== undefined && record[item] !== "");
  return key ? record[key] : "";
}

function labeledNumberValue(text, labelPattern) {
  const labelMatch = labelPattern.exec(text);
  if (!labelMatch) return "";

  const afterLabel = text.slice(labelMatch.index + labelMatch[0].length);
  const valueMatch = afterLabel.match(/-?\$?\d+(?:,\d{3})*(?:\.\d+)?%?/);
  return valueMatch ? valueMatch[0] : "";
}

function mtdPaceMultiplier(date = new Date()) {
  return Math.max(Number(state.settings?.mtdMultiplier || date.getDate() - 1), 1);
}

function roundMetricValue(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseMetricNumber(value) {
  const cleaned = String(value).replace(/[$,%]/g, "").trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function buildReportNote(record, benchmark) {
  const highlights = getStoreHighlights(record, benchmark);
  const opportunities = getStoreOpportunities(record, benchmark);
  const snapshot = buildMetricSnapshot(record);

  if (!snapshot.length) {
    return `Store ${record.storenumber} has been imported from the latest performance report.`;
  }

  const highlightText = highlights.length
    ? `The strongest areas are ${joinPhrase(highlights)}.`
    : "The store has a few areas we can build on, but no clear standout metric came through from the screenshot.";
  const opportunityText = opportunities.length
    ? `The main opportunities are ${joinPhrase(opportunities)}.`
    : "The store is holding steady against the key benchmarks shown in the report.";

  return `Store ${record.storenumber} has been imported from the latest performance report. ${snapshot.join(", ")}. ${highlightText} ${opportunityText}`;
}

function buildHelpNote(record, benchmark) {
  const opportunities = getStoreOpportunities(record, benchmark);
  if (!opportunities.length) {
    return "Please continue supporting the team with strong customer handoffs, protection conversations, app engagement, and accessory attachment so we can keep the current momentum going.";
  }

  return `Please help us stay focused on ${joinPhrase(opportunities)}. Strong customer handoffs, protection reminders, app conversations, and accessory attachment will give us the best chance to improve the month-to-date results.`;
}

function buildMetricSnapshot(record) {
  return performanceMetricsFromRecord(record)
    .filter((metric) => metric.mtd !== "" && Number(metric.mtd) > 0)
    .map((metric) => `${metric.name} ${metricVerb(metric.name)} ${formatValue(metric.mtd, metric.format)}`);
}

function addSnapshotMetric(parts, record, key, label, format) {
  if (record[key] === undefined || record[key] === "") return;
  if (parts.some((part) => part.startsWith(`${label} `))) return;
  parts.push(`${label} ${metricVerb(label)} ${formatValue(parseMetricNumber(record[key]), format)}`);
}

function metricVerb(label) {
  return /\b(ACTs|Apps|Units)\b/.test(label) ? "are" : "is";
}

function getStoreHighlights(record, benchmark) {
  const highlights = [];
  if (isAtOrAboveBenchmark(record, benchmark, "postpspd")) highlights.push("postpaid pace");
  if (isAtOrAboveBenchmark(record, benchmark, "apppspd")) highlights.push("app activity");
  if (isAtOrAboveBenchmark(record, benchmark, "preactrate")) highlights.push("prepaid activation rate");
  if (parseMetricNumber(record.totalprotectrate) >= Math.max(parseMetricNumber(benchmark?.totalprotectrate), 10)) highlights.push("protection rate");
  if (parseMetricNumber(record.upgraderate) >= Math.max(parseMetricNumber(benchmark?.upgraderate), 20)) highlights.push("upgrade rate");
  if (parseMetricNumber(record.byodrate) >= Math.max(parseMetricNumber(benchmark?.byodrate), 20)) highlights.push("BYOD rate");
  if (parseMetricNumber(record.addalinerate) >= Math.max(parseMetricNumber(benchmark?.addalinerate), 18)) highlights.push("add-a-line rate");
  return uniqueList(highlights).slice(0, 3);
}

function getStoreOpportunities(record, benchmark) {
  const opportunities = [];
  if (isBelowBenchmark(record, benchmark, "postpspd", 0.9)) opportunities.push("postpaid activation pace");
  if (isBelowBenchmark(record, benchmark, "apppspd", 0.9)) opportunities.push("app activity");
  if (isBelowBenchmark(record, benchmark, "accpspd", 0.9)) opportunities.push("accessory sales");
  if (parseMetricNumber(record.totalprotectrate) < Math.max(parseMetricNumber(benchmark?.totalprotectrate), 10)) opportunities.push("device protection");
  if (parseMetricNumber(record.postpspdyoy) < -20) opportunities.push("turning around the postpaid year-over-year trend");
  if (isBelowBenchmark(record, benchmark, "preactrate", 0.9)) opportunities.push("prepaid activation rate");
  return uniqueList(opportunities).slice(0, 3);
}

function isAtOrAboveBenchmark(record, benchmark, key) {
  const value = parseMetricNumber(record[key]);
  if (!Number.isFinite(value) || record[key] === undefined || record[key] === "") return false;
  const benchmarkValue = parseMetricNumber(benchmark?.[key]);
  return benchmarkValue > 0 ? value >= benchmarkValue : value > 0;
}

function isBelowBenchmark(record, benchmark, key, tolerance = 1) {
  const value = parseMetricNumber(record[key]);
  if (!Number.isFinite(value) || record[key] === undefined || record[key] === "") return false;
  const benchmarkValue = parseMetricNumber(benchmark?.[key]);
  if (benchmarkValue > 0) return value < benchmarkValue * tolerance;
  return value <= 0;
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

function joinPhrase(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function guessMetricFormat(metricName) {
  const name = metricName.toLowerCase();
  if (name.includes("protection") || name.includes("activation %")) return "percent";
  if (name.includes("accessory") || name.includes("sales $")) return "currency";
  return "number";
}

function resetData() {
  if (!confirm("Reset all stores to the starter data?")) return;
  state = { stores: structuredClone(sampleStores) };
  activeStoreId = state.stores[0].id;
  saveAndRender();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}
