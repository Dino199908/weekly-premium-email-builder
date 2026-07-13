const STORAGE_KEY = "premiumWeeklyEmailBuilder.v1";
const STORE_MAPPING_KEY = "premiumWeeklyEmailBuilder.storeMappings.v1";
const DEFAULT_CC_EMAIL = "KHartley@premiumretail.com";
const MAX_HISTORY_ITEMS = 40;
const defaultSettings = {
  mtdMultiplier: Math.max(new Date().getDate() - 1, 1),
  outlookMode: "cloud"
};

const STANDARD_TIER_HOURS = [
  { key: "sunday", label: "Sunday", hours: "11-6" },
  { key: "monWed", label: "Monday - Wednesday", hours: "11-7" },
  { key: "thursday", label: "Thursday", hours: "11-8" },
  { key: "friSat", label: "Friday - Saturday", hours: "10-8" }
];
const STANDARD_TIER_HOURS_TEXT = STANDARD_TIER_HOURS
  .map(({ label, hours }) => `${label}: ${hours}`)
  .join("\n");

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
    regularReps: "Henry Stewart, Shane Kelly",
    preferredWording: "Keep the tone friendly, direct, and focused on partnership.",
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

const IS_FEATURE_TEST = globalThis.__WEEKLY_EMAIL_FEATURE_TEST__ === true;
let state = loadState();
let activeStoreId = state.stores[0]?.id;
let storeMappings = loadStoreMappings();

const elements = IS_FEATURE_TEST ? {} : {
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
  newsNotes: document.querySelector("#newsNotes"),
  staffingNotes: document.querySelector("#staffingNotes"),
  hoursNotes: document.querySelector("#hoursNotes"),
  openItems: document.querySelector("#openItems"),
  featuredDeals: document.querySelector("#featuredDeals"),
  regularReps: document.querySelector("#regularReps"),
  preferredWording: document.querySelector("#preferredWording"),
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
  polishEmailBtn: document.querySelector("#polishEmailBtn"),
  polishAllBtn: document.querySelector("#polishAllBtn"),
  aiStyleSelect: document.querySelector("#aiStyleSelect"),
  aiSettingsBtn: document.querySelector("#aiSettingsBtn"),
  aiSettingsDialog: document.querySelector("#aiSettingsDialog"),
  aiKeyInput: document.querySelector("#aiKeyInput"),
  aiSettingsStatus: document.querySelector("#aiSettingsStatus"),
  saveAIKeyBtn: document.querySelector("#saveAIKeyBtn"),
  outlookModeSelect: document.querySelector("#outlookModeSelect"),
  outlookSettingsBtn: document.querySelector("#outlookSettingsBtn"),
  outlookSettingsDialog: document.querySelector("#outlookSettingsDialog"),
  outlookSettingsStatus: document.querySelector("#outlookSettingsStatus"),
  microsoftClientIdInput: document.querySelector("#microsoftClientIdInput"),
  microsoftTenantIdInput: document.querySelector("#microsoftTenantIdInput"),
  saveMicrosoftSettingsBtn: document.querySelector("#saveMicrosoftSettingsBtn"),
  disconnectMicrosoftBtn: document.querySelector("#disconnectMicrosoftBtn"),
  storeMappingsList: document.querySelector("#storeMappingsList"),
  screenshotDropZone: document.querySelector("#screenshotDropZone"),
  applyTierHoursBtn: document.querySelector("#applyTierHoursBtn"),
  saveTierHoursBtn: document.querySelector("#saveTierHoursBtn"),
  tierSunday: document.querySelector("#tierSunday"),
  tierMonWed: document.querySelector("#tierMonWed"),
  tierThursday: document.querySelector("#tierThursday"),
  tierFriSat: document.querySelector("#tierFriSat"),
  tierHoursSummary: document.querySelector("#tierHoursSummary"),
  readinessBoard: document.querySelector("#readinessBoard"),
  profileSummary: document.querySelector("#profileSummary"),
  coachingInsight: document.querySelector("#coachingInsight"),
  preSendReview: document.querySelector("#preSendReview"),
  historyList: document.querySelector("#historyList"),
  visitTemplate: document.querySelector("#visitTemplate"),
  metricTemplate: document.querySelector("#metricTemplate"),
  mappingTemplate: document.querySelector("#mappingTemplate")
};

if (!IS_FEATURE_TEST) {
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
elements.polishEmailBtn.addEventListener("click", polishActiveEmail);
elements.polishAllBtn.addEventListener("click", polishAllEmails);
elements.aiSettingsBtn.addEventListener("click", openAISettings);
elements.saveAIKeyBtn.addEventListener("click", saveAIKey);
elements.outlookSettingsBtn.addEventListener("click", openOutlookSettings);
elements.saveMicrosoftSettingsBtn.addEventListener("click", saveMicrosoftSettingsAndConnect);
elements.disconnectMicrosoftBtn.addEventListener("click", disconnectMicrosoftAccount);
elements.outlookModeSelect.addEventListener("change", updateOutlookMode);
document.querySelector("#exportBtn").addEventListener("click", exportData);
document.querySelector("#resetBtn").addEventListener("click", resetData);
document.querySelector("#addStoreMappingBtn").addEventListener("click", addStoreMapping);
document.querySelector("#saveStoreMappingsBtn").addEventListener("click", saveStoreMappingsFromForm);
document.querySelector("#backupSettingsBtn").addEventListener("click", backupSettings);
document.querySelector("#restoreSettingsInput").addEventListener("change", restoreSettings);
document.querySelector("#importInput").addEventListener("change", importData);
document.querySelector("#pasteImportBtn").addEventListener("click", importPastedRows);
document.querySelector("#saveProfileBtn").addEventListener("click", saveActiveProfile);
document.querySelector("#applyProfileBtn").addEventListener("click", applyActiveProfile);
document.querySelector("#copyRichEmailBtn").addEventListener("click", copyRichEmail);
document.querySelector("#createOutlookDraftBtn").addEventListener("click", createActiveOutlookDraft);
document.querySelector("#createAllDraftsBtn").addEventListener("click", createAllOutlookDrafts);
document.querySelector("#saveSnapshotBtn").addEventListener("click", saveActiveSnapshot);
document.querySelector("#duplicateLastWeekBtn").addEventListener("click", duplicateLastWeek);
document.querySelector("#markSentBtn").addEventListener("click", markActiveSent);
elements.applyTierHoursBtn.addEventListener("click", applyStandardTierHours);
elements.saveTierHoursBtn.addEventListener("click", () => updateTierHoursFromInputs({ announce: true }));
document.addEventListener("paste", handleClipboardPaste, true);
elements.screenshotDropZone.addEventListener("click", () => elements.screenshotDropZone.focus());
elements.screenshotDropZone.addEventListener("paste", handleClipboardPaste);
elements.reportPreview.addEventListener("paste", handleClipboardPaste);
elements.reportPreview.addEventListener("drop", blockReportPreviewDrop);

elements.form.addEventListener("input", (event) => {
  if (event.target.closest("#visitsList, #metricsList, #storeMappingsList")) return;
  if (event.target.classList.contains("tier-hour-input")) {
    updateTierHoursFromInputs();
    return;
  }
  if (event.target === elements.mtdMultiplier) {
    updateMtdMultiplier();
    return;
  }
  updateActiveStoreFromForm();
  saveWithoutRender();
  if (event.target === elements.hoursNotes) {
    renderTierHoursEditor();
  }
  if (event.target === elements.weekStart || event.target === elements.weekEnd) {
    renderVisits();
  }
  if (event.target === elements.storeName || event.target === elements.contactName) {
    renderTabs();
  }
  renderTierHoursSummary();
  renderChecklist();
  renderReadinessBoard();
  renderProfileSummary();
  renderCoachingInsight();
  renderPreSendReview();
  renderPreview();
});

render();
renderStoreMappings();
loadPersistentStoreMappings();
initializeAIStatus();
initializeMicrosoftStatus();
window.weeklyEmailApp?.onUpdateStatus?.((message) => {
  elements.statusText.textContent = message;
});
window.weeklyEmailApp?.onMicrosoftAuthStatus?.((message) => {
  elements.statusText.textContent = message;
  elements.outlookSettingsStatus.textContent = message;
});
}

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
    lastImportReview: Array.isArray(value.lastImportReview) ? value.lastImportReview : [],
    profiles: Array.isArray(value.profiles) ? value.profiles : [],
    history: Array.isArray(value.history) ? value.history.slice(0, MAX_HISTORY_ITEMS) : [],
    lastSavedAt: value.lastSavedAt || new Date().toISOString()
  };
}

function normalizeSavedStore(store) {
  return {
    ...store,
    newsNotes: store.newsNotes || "",
    staffingNotes: store.staffingNotes || "",
    hoursNotes: String(store.hoursNotes || "").trim() || STANDARD_TIER_HOURS_TEXT,
    openItems: store.openItems || "",
    featuredDeals: store.featuredDeals || "",
    regularReps: store.regularReps || "",
    preferredWording: store.preferredWording || "",
    lastSentWeekKey: store.lastSentWeekKey || "",
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
  renderReadinessBoard();
  renderProfileSummary();
  renderCoachingInsight();
  renderPreSendReview();
  renderHistory();
  renderPreview();
}

function renderImportSettings() {
  elements.mtdMultiplier.value = state.settings?.mtdMultiplier || defaultSettings.mtdMultiplier;
  elements.outlookModeSelect.value = state.settings?.outlookMode === "classic" ? "classic" : "cloud";
  elements.multiplierStatus.textContent = `Prepaid Sales, Prepaid Activation, and Accessory Sales use x${elements.mtdMultiplier.value || defaultSettings.mtdMultiplier} when importing PSPD values.`;
}

function updateMtdMultiplier() {
  const value = Math.max(Number(elements.mtdMultiplier.value || defaultSettings.mtdMultiplier), 1);
  state.settings = { ...defaultSettings, ...(state.settings || {}), mtdMultiplier: value };
  elements.multiplierStatus.textContent = `Prepaid Sales, Prepaid Activation, and Accessory Sales use x${value} when importing PSPD values.`;
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

function buildSafetyChecks(store) {
  const metricNames = new Set((store.metrics || []).map((metric) => metric.name));
  const metricsReadable = metricDefaults.every((metric) => metricNames.has(metric.name)) &&
    (store.metrics || []).every((metric) => metric.mtd !== "" && Number.isFinite(Number(metric.mtd))) &&
    metricValuesLookReasonable(store.metrics || []);
  const goalsPresent = metricDefaults.every((metric) => {
    const saved = (store.metrics || []).find((item) => item.name === metric.name);
    return Number(saved?.goal || 0) > 0;
  });
  const visits = Array.isArray(store.visits) ? store.visits : [];
  const visitsReady = visits.length > 0 && visits.every((visit) => visit.date && String(visit.person || "").trim());
  const datesReady = isCurrentWeekRange(store.weekStart, store.weekEnd);

  return [
    { id: "email", ok: isEmailAddress(store.managerEmail), label: "Manager email", detail: isEmailAddress(store.managerEmail) ? store.managerEmail : "Add a valid manager email" },
    { id: "dates", ok: datesReady, label: "Current week dates", detail: datesReady ? formatWeekRange(store.weekStart, store.weekEnd) : "Choose the current reporting week" },
    { id: "visits", ok: visitsReady, label: "Visits scheduled", detail: visitsReady ? `${visits.length} visit${visits.length === 1 ? "" : "s"} ready` : "Add a representative to every visit" },
    { id: "metrics", ok: metricsReadable, label: "Metrics readable", detail: metricsReadable ? "All five metrics look valid" : "Review missing or unusual metric values" },
    { id: "goals", ok: goalsPresent, label: "Goals present", detail: goalsPresent ? "All five goals are set" : "Add a goal for every focal metric" },
    { id: "notes", ok: Boolean(cleanSentence(store.importantNotes) && cleanSentence(store.helpNotes)), label: "Notes added", detail: cleanSentence(store.importantNotes) && cleanSentence(store.helpNotes) ? "Important and support notes are ready" : "Complete both weekly note fields" },
    { id: "saved", ok: Boolean(state.lastSavedAt), label: "Saved state", detail: state.lastSavedAt ? `Saved ${formatDateTime(state.lastSavedAt)}` : "Save the current edits" }
  ];
}

function metricValuesLookReasonable(metrics) {
  return metrics.every((metric) => {
    const value = Number(metric.mtd);
    if (!Number.isFinite(value) || value < 0) return false;
    if (metric.format === "percent" && value > 100) return false;
    if (metric.name === "Postpaid Activation" && value > 150) return false;
    if (metric.name === "Prepaid Sales" && value > 1000) return false;
    if (metric.name === "Accessory Sales" && value > 100000) return false;
    return true;
  });
}

function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isCurrentWeekRange(startValue, endValue) {
  const start = parseDateInput(startValue);
  const end = parseDateInput(endValue);
  if (!start || !end || end < start) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() - 8);
  const latest = new Date(today);
  latest.setDate(latest.getDate() + 21);
  return end >= earliest && start <= latest;
}

function getReadiness(store) {
  const checks = buildSafetyChecks(store);
  const passed = checks.filter((check) => check.ok).length;
  const total = checks.length;
  const weekKey = storeWeekKey(store);
  if (store.lastSentWeekKey && store.lastSentWeekKey === weekKey) {
    return { state: "sent", label: "Sent", passed: total, total, percent: 100, checks };
  }
  if (passed === total) {
    return { state: "ready", label: "Ready", passed, total, percent: 100, checks };
  }
  const missingData = checks.some((check) => ["dates", "metrics"].includes(check.id) && !check.ok);
  return {
    state: missingData ? "needs-data" : "needs-review",
    label: missingData ? "Needs data" : "Needs review",
    passed,
    total,
    percent: Math.round((passed / total) * 100),
    checks
  };
}

function renderReadinessBoard() {
  if (!elements.readinessBoard) return;
  elements.readinessBoard.innerHTML = state.stores.map((store) => {
    const readiness = getReadiness(store);
    return `<button class="readiness-card ${readiness.state}${store.id === activeStoreId ? " active" : ""}" type="button" data-store-id="${escapeHtml(store.id)}">
      <span class="readiness-card-head"><strong>${escapeHtml(store.storeName || "Untitled Store")}</strong><span>${escapeHtml(readiness.label)}</span></span>
      <span class="readiness-progress"><i style="--readiness:${readiness.percent}%"></i></span>
      <span class="readiness-count">${readiness.passed} / ${readiness.total}<small>${readiness.percent}%</small></span>
    </button>`;
  }).join("");

  elements.readinessBoard.querySelectorAll("[data-store-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeStoreId = button.dataset.storeId;
      render();
    });
  });
}

function renderProfileSummary() {
  const store = getActiveStore();
  if (!store || !elements.profileSummary) return;
  elements.profileSummary.innerHTML = [
    ["Manager", store.contactName || "Not set"],
    ["Manager email", store.managerEmail || "Not set"],
    ["Location tier hours", compactTierHours(store.hoursNotes)],
    ["Regular representatives", store.regularReps || "Not set"],
    ["Preferred wording", store.preferredWording || "Use the standard partnership tone"]
  ].map(([label, value]) => `<div class="profile-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function compactTierHours(value) {
  return String(value || STANDARD_TIER_HOURS_TEXT)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" · ");
}

function buildCoachingInsight(store) {
  const metrics = (store.metrics || [])
    .filter((metric) => Number(metric.goal || 0) > 0)
    .map((metric) => ({ metric, progress: calculateProgress(metric) }));
  const strongest = [...metrics].sort((a, b) => b.progress.percent - a.progress.percent)[0];
  const biggestGap = [...metrics].sort((a, b) => a.progress.percent - b.progress.percent)[0];
  const remaining = biggestGap ? Math.max(Number(biggestGap.metric.goal || 0) - Number(biggestGap.metric.mtd || 0), 0) : 0;
  const days = Math.max(daysRemainingInMonth(), 1);
  const pace = biggestGap ? remaining / days : 0;
  return {
    strongest: strongest ? `${strongest.metric.name} (${Math.round(strongest.progress.percent)}% to goal)` : "Add goals to identify a strongest result",
    gap: biggestGap ? `${biggestGap.metric.name} (${Math.round(biggestGap.progress.percent)}% to goal)` : "Add goals to identify the biggest gap",
    pace: biggestGap ? `${formatValue(roundPace(pace, biggestGap.metric.format), biggestGap.metric.format)} per day for ${biggestGap.metric.name}` : "Add goals to calculate the needed pace",
    focus: coachingFocusForMetric(biggestGap?.metric?.name)
  };
}

function roundPace(value, format) {
  return format === "currency" ? Math.ceil(value) : Math.ceil(value * 100) / 100;
}

function daysRemainingInMonth() {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return Math.max(end.getDate() - today.getDate() + 1, 1);
}

function coachingFocusForMetric(name) {
  const focus = {
    "Postpaid Activation": "Prioritize postpaid discovery, qualified handoffs, and confident close attempts.",
    "Prepaid Sales": "Drive prepaid conversations on every eligible customer and surface value early.",
    "Prepaid Activation": "Convert more prepaid interest into completed activations with clear next steps.",
    "Device Protection": "Use consistent protection questions and connect coverage to the customer's real risks.",
    "Accessory Sales": "Build complete device solutions and attach the right accessories during every setup."
  };
  return focus[name] || "Keep the team focused on the lowest progress-to-goal metric this week.";
}

function renderCoachingInsight() {
  const store = getActiveStore();
  if (!store || !elements.coachingInsight) return;
  const insight = buildCoachingInsight(store);
  elements.coachingInsight.innerHTML = `
    <div class="insight-item"><span>Strongest result</span><strong class="positive">${escapeHtml(insight.strongest)}</strong></div>
    <div class="insight-item"><span>Biggest gap</span><strong class="attention">${escapeHtml(insight.gap)}</strong></div>
    <div class="insight-item"><span>Needed pace</span><strong>${escapeHtml(insight.pace)}</strong></div>
    <div class="insight-item"><span>Suggested focus</span><p>${escapeHtml(insight.focus)}</p></div>`;
}

function renderPreSendReview() {
  const store = getActiveStore();
  if (!store || !elements.preSendReview) return;
  const checks = buildSafetyChecks(store);
  const passed = checks.filter((check) => check.ok).length;
  elements.preSendReview.innerHTML = `
    <div class="safety-list">${checks.map((check) => `<div class="safety-row ${check.ok ? "ok" : "warn"}"><span>${escapeHtml(check.label)}</span><strong>${check.ok ? "✓" : "!"} ${escapeHtml(check.detail)}</strong></div>`).join("")}</div>
    <div class="safety-summary"><strong>${passed} passed</strong><span>${checks.length - passed} warning${checks.length - passed === 1 ? "" : "s"}</span></div>`;
}

function renderHistory() {
  const store = getActiveStore();
  if (!store || !elements.historyList) return;
  const items = historyForStore(store);
  if (!items.length) {
    elements.historyList.innerHTML = `<div class="history-empty"><strong>No weekly snapshots yet</strong><span>Save a snapshot or open an email draft to start the timeline.</span></div>`;
    return;
  }

  elements.historyList.innerHTML = items.slice(0, 8).map((item, index) => {
    const prior = items[index + 1];
    const rows = (item.metrics || []).map((metric) => {
      const previous = (prior?.metrics || []).find((candidate) => candidate.name === metric.name);
      const delta = previous ? Number(metric.mtd || 0) - Number(previous.mtd || 0) : 0;
      const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      return `<div class="history-metric"><span>${escapeHtml(metric.name)}</span><strong>${escapeHtml(formatValue(metric.mtd, metric.format))}</strong><small class="${direction}">${delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} ${delta ? escapeHtml(formatValue(Math.abs(delta), metric.format)) : ""}</small></div>`;
    }).join("");
    return `<article class="history-card">
      <header><strong>${escapeHtml(formatWeekRange(item.weekStart, item.weekEnd))}</strong><span class="history-status ${escapeHtml(item.status)}">${escapeHtml(historyStatusLabel(item.status))}</span></header>
      <div class="history-metrics">${rows}</div>
    </article>`;
  }).join("");
}

function historyStatusLabel(status) {
  if (status === "sent") return "Sent";
  if (status === "draft") return "Drafted";
  return "Snapshot";
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
      weekStart: store.weekStart || previous?.weekStart || "",
      weekEnd: store.weekEnd || previous?.weekEnd || "",
      visits: Array.isArray(previous?.visits) && previous.visits.length ? previous.visits : store.visits,
      newsNotes: store.newsNotes || previous?.newsNotes || "",
      staffingNotes: store.staffingNotes || previous?.staffingNotes || "",
      hoursNotes: previous?.hoursNotes || store.hoursNotes || STANDARD_TIER_HOURS_TEXT,
      openItems: store.openItems || previous?.openItems || "",
      featuredDeals: store.featuredDeals || previous?.featuredDeals || "",
      regularReps: store.regularReps || previous?.regularReps || "",
      preferredWording: store.preferredWording || previous?.preferredWording || "",
      lastSentWeekKey: previous?.lastSentWeekKey || "",
      metrics: mergeMetricGoals(store.metrics || [], previous?.metrics || [])
    };
    const profiled = applyStoredProfileToStore(applyMappingToStore(merged), previousState?.profiles || state.profiles || []);
    if (previous?.hoursNotes) profiled.hoursNotes = previous.hoursNotes;
    return profiled;
  });

  return {
    ...imported,
    stores,
    settings: { ...defaultSettings, ...(previousState?.settings || state.settings || {}) },
    lastImportReview: buildImportReviewRows(stores),
    profiles: previousState?.profiles || state.profiles || [],
    history: previousState?.history || state.history || [],
    lastSavedAt: new Date().toISOString()
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
    const readiness = getReadiness(store);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `store-tab${store.id === activeStoreId ? " active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(store.storeName || "Untitled Store")}</strong><span>${escapeHtml(store.contactName || "No contact")}</span><small class="store-readiness ${readiness.state}">${escapeHtml(readiness.label)}</small>`;
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
  if (shouldAutoFillVisitDates(store)) {
    syncVisitsToWeekRange(store);
  }

  elements.storeName.value = store.storeName || "";
  elements.storeNumber.value = store.storeNumber || "";
  elements.contactName.value = store.contactName || "";
  elements.managerEmail.value = store.managerEmail || "";
  elements.weekStart.value = store.weekStart || "";
  elements.weekEnd.value = store.weekEnd || "";
  elements.importantNotes.value = store.importantNotes || "";
  elements.helpNotes.value = store.helpNotes || "";
  elements.newsNotes.value = store.newsNotes || "";
  elements.staffingNotes.value = store.staffingNotes || "";
  elements.hoursNotes.value = store.hoursNotes || "";
  elements.openItems.value = store.openItems || "";
  elements.featuredDeals.value = store.featuredDeals || "";
  elements.regularReps.value = store.regularReps || "";
  elements.preferredWording.value = store.preferredWording || "";

  renderTierHoursEditor();
  renderTierHoursSummary();
  renderVisits();
  renderMetrics();
}

function renderVisits() {
  const store = getActiveStore();
  if (!store) return;
  elements.visitsList.innerHTML = "";
  store.visits.forEach((visit, index) => elements.visitsList.appendChild(createVisitRow(visit, index)));
}

function renderMetrics() {
  const store = getActiveStore();
  if (!store) return;
  elements.metricsList.innerHTML = "";
  store.metrics.forEach((metric, index) => elements.metricsList.appendChild(createMetricRow(metric, index)));
}

function renderTierHoursSummary() {
  const store = getActiveStore();
  if (!store || !elements.tierHoursSummary) return;
  elements.tierHoursSummary.textContent = "Changes save automatically and appear in every generated email.";
}

function normalizeTierHoursLabel(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function parseTierHours(value) {
  const parsed = Object.fromEntries(STANDARD_TIER_HOURS.map(({ key, hours }) => [key, hours]));
  const keysByLabel = new Map(STANDARD_TIER_HOURS.map(({ key, label }) => [normalizeTierHoursLabel(label), key]));

  String(value || "").split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) return;
    const key = keysByLabel.get(normalizeTierHoursLabel(line.slice(0, separator)));
    if (key) parsed[key] = line.slice(separator + 1).trim();
  });

  return parsed;
}

function buildTierHoursText(values) {
  return STANDARD_TIER_HOURS
    .map(({ key, label }) => `${label}: ${String(values?.[key] ?? "").trim()}`)
    .join("\n");
}

function renderTierHoursEditor(store = getActiveStore()) {
  if (!store || !elements.tierSunday) return;
  const values = parseTierHours(store.hoursNotes || STANDARD_TIER_HOURS_TEXT);
  elements.tierSunday.value = values.sunday;
  elements.tierMonWed.value = values.monWed;
  elements.tierThursday.value = values.thursday;
  elements.tierFriSat.value = values.friSat;
}

function updateTierHoursFromInputs({ announce = false } = {}) {
  const store = getActiveStore();
  if (!store) return;
  const values = {
    sunday: elements.tierSunday.value,
    monWed: elements.tierMonWed.value,
    thursday: elements.tierThursday.value,
    friSat: elements.tierFriSat.value
  };
  store.hoursNotes = buildTierHoursText(values);
  store.polishedEmail = "";
  elements.hoursNotes.value = store.hoursNotes;
  saveWithoutRender();
  renderTierHoursSummary();
  renderChecklist();
  renderReadinessBoard();
  renderProfileSummary();
  renderCoachingInsight();
  renderPreSendReview();
  renderPreview();
  if (announce) elements.statusText.textContent = "Location tier hours saved for this store.";
}

function applyStandardTierHours() {
  const store = getActiveStore();
  if (!store) return;
  store.hoursNotes = STANDARD_TIER_HOURS_TEXT;
  store.polishedEmail = "";
  elements.hoursNotes.value = STANDARD_TIER_HOURS_TEXT;
  saveWithoutRender();
  renderTierHoursEditor(store);
  renderTierHoursSummary();
  renderChecklist();
  renderReadinessBoard();
  renderProfileSummary();
  renderPreSendReview();
  renderPreview();
  elements.statusText.textContent = "Standard location tier hours applied.";
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
  const remainingEl = row.querySelector(".metric-remaining");
  const remaining = Math.max(Number(metric.goal || 0) - Number(metric.mtd || 0), 0);
  progressEl.style.setProperty("--progress", `${Math.min(progress.percent, 100)}%`);
  progressEl.innerHTML = `<span>${progress.label}</span>`;
  if (remainingEl) {
    remainingEl.textContent = Number(metric.goal || 0) > 0 ? formatValue(remaining, metric.format) : "No goal";
  }
}

function metricInputValue(value) {
  return value === "" ? "" : Number(value);
}

function renderPreview() {
  const store = getActiveStore();
  const polished = store?.polishedEmail
    ? `<section class="ai-polished-preview"><div class="ai-polished-label">AI-polished plain text</div><pre>${escapeHtml(store.polishedEmail)}</pre></section>`
    : "";
  elements.emailPreview.innerHTML = `${polished}${buildRichEmailHtml(store)}`;
}

function updateActiveStoreFromForm() {
  const store = getActiveStore();
  if (!store) return;
  const previousWeekStart = store.weekStart;
  const previousWeekEnd = store.weekEnd;

  store.storeName = elements.storeName.value;
  store.storeNumber = elements.storeNumber.value;
  store.contactName = elements.contactName.value;
  store.managerEmail = elements.managerEmail.value;
  store.weekStart = elements.weekStart.value;
  store.weekEnd = elements.weekEnd.value;
  store.importantNotes = elements.importantNotes.value;
  store.helpNotes = elements.helpNotes.value;
  store.newsNotes = elements.newsNotes.value;
  store.staffingNotes = elements.staffingNotes.value;
  store.hoursNotes = elements.hoursNotes.value;
  store.openItems = elements.openItems.value;
  store.featuredDeals = elements.featuredDeals.value;
  store.regularReps = elements.regularReps.value;
  store.preferredWording = elements.preferredWording.value;
  if (store.weekStart !== previousWeekStart || store.weekEnd !== previousWeekEnd) {
    syncVisitsToWeekRange(store);
  }
  store.polishedEmail = "";
}

function updateVisit(index, field, value) {
  const store = getActiveStore();
  store.visits[index][field] = value;
  store.polishedEmail = "";
  saveWithoutRender();
  renderChecklist();
  renderReadinessBoard();
  renderCoachingInsight();
  renderPreSendReview();
  renderPreview();
}

function updateMetric(index, field, value, row) {
  const store = getActiveStore();
  store.metrics[index][field] = value;
  store.polishedEmail = "";
  if (row) refreshMetricRowProgress(row, store.metrics[index]);
  saveWithoutRender();
  renderChecklist();
  renderReadinessBoard();
  renderCoachingInsight();
  renderPreSendReview();
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
    newsNotes: "",
    staffingNotes: "",
    hoursNotes: STANDARD_TIER_HOURS_TEXT,
    openItems: "",
    featuredDeals: "",
    regularReps: "",
    preferredWording: "",
    lastSentWeekKey: "",
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
  const store = getActiveStore();
  store.visits.push({ date: nextVisitDate(store), person: "" });
  saveAndRender();
}

function addMetric() {
  getActiveStore().metrics.push({ name: "New Metric", mtd: 0, goal: 0, format: "number" });
  saveAndRender();
}

function saveAndRender() {
  state.lastSavedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSavedStatus();
  render();
}

function saveWithoutRender() {
  state.lastSavedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSavedStatus();
}

function updateSavedStatus() {
  elements.statusText.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function getActiveStore() {
  return state.stores.find((store) => store.id === activeStoreId);
}

function storeIdentity(store) {
  const number = String(store?.storeNumber || "").trim();
  if (number) return `number:${number}`;
  return `name:${String(store?.storeName || "untitled").trim().toLowerCase()}`;
}

function storeWeekKey(store) {
  return `${storeIdentity(store)}|${store?.weekStart || "no-start"}|${store?.weekEnd || "no-end"}`;
}

function profileForStore(store, profiles = state.profiles || []) {
  const identity = storeIdentity(store);
  return profiles.find((profile) => profile.storeKey === identity) || null;
}

function buildProfileFromStore(store) {
  return {
    id: profileForStore(store)?.id || crypto.randomUUID(),
    storeKey: storeIdentity(store),
    storeNumber: store.storeNumber || "",
    storeName: store.storeName || "",
    contactName: store.contactName || "",
    managerEmail: store.managerEmail || "",
    hoursNotes: store.hoursNotes || STANDARD_TIER_HOURS_TEXT,
    regularReps: store.regularReps || "",
    preferredWording: store.preferredWording || "",
    goals: (store.metrics || []).map((metric) => ({ name: metric.name, goal: metric.goal, format: metric.format })),
    updatedAt: new Date().toISOString()
  };
}

function saveActiveProfile() {
  const store = getActiveStore();
  if (!store) return;
  const profile = buildProfileFromStore(store);
  state.profiles = (state.profiles || []).filter((item) => item.storeKey !== profile.storeKey);
  state.profiles.unshift(profile);
  saveAndRender();
  elements.statusText.textContent = `${store.storeName} profile saved.`;
}

function applyStoredProfileToStore(store, profiles = state.profiles || []) {
  const profile = profileForStore(store, profiles);
  if (!profile) return store;
  const goals = Array.isArray(profile.goals) ? profile.goals : [];
  return {
    ...store,
    storeName: profile.storeName || store.storeName,
    contactName: profile.contactName || store.contactName,
    managerEmail: profile.managerEmail || store.managerEmail,
    hoursNotes: profile.hoursNotes || store.hoursNotes || STANDARD_TIER_HOURS_TEXT,
    regularReps: profile.regularReps || store.regularReps || "",
    preferredWording: profile.preferredWording || store.preferredWording || "",
    metrics: (store.metrics || []).map((metric) => {
      const saved = goals.find((goal) => goal.name === metric.name);
      return saved ? { ...metric, goal: saved.goal, format: saved.format || metric.format } : metric;
    })
  };
}

function applyActiveProfile() {
  const store = getActiveStore();
  if (!store) return;
  const profile = profileForStore(store);
  if (!profile) {
    elements.statusText.textContent = "No saved profile matches this store yet.";
    return;
  }
  const applied = applyStoredProfileToStore(store);
  Object.assign(store, applied, { polishedEmail: "" });
  saveAndRender();
  elements.statusText.textContent = `${store.storeName} profile applied.`;
}

function buildHistorySnapshot(store, status = "snapshot") {
  return {
    id: crypto.randomUUID(),
    storeKey: storeIdentity(store),
    storeNumber: store.storeNumber || "",
    storeName: store.storeName || "",
    status,
    createdAt: new Date().toISOString(),
    weekStart: store.weekStart || "",
    weekEnd: store.weekEnd || "",
    visits: structuredClone(store.visits || []),
    importantNotes: store.importantNotes || "",
    helpNotes: store.helpNotes || "",
    newsNotes: store.newsNotes || "",
    staffingNotes: store.staffingNotes || "",
    hoursNotes: store.hoursNotes || STANDARD_TIER_HOURS_TEXT,
    openItems: store.openItems || "",
    featuredDeals: store.featuredDeals || "",
    regularReps: store.regularReps || "",
    preferredWording: store.preferredWording || "",
    metrics: structuredClone(store.metrics || []),
    emailText: store.polishedEmail || buildEmail(store),
    emailHtml: buildRichEmailHtml(store)
  };
}

function recordSnapshot(store, status = "snapshot") {
  const snapshot = buildHistorySnapshot(store, status);
  const sameWeek = `${snapshot.storeKey}|${snapshot.weekStart}|${snapshot.weekEnd}`;
  state.history = (state.history || []).filter((item) => {
    const itemWeek = `${item.storeKey}|${item.weekStart}|${item.weekEnd}`;
    return !(itemWeek === sameWeek && item.status === status);
  });
  state.history.unshift(snapshot);
  state.history = state.history.slice(0, MAX_HISTORY_ITEMS);
  return snapshot;
}

function historyForStore(store) {
  const key = storeIdentity(store);
  return (state.history || [])
    .filter((item) => item.storeKey === key)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function saveActiveSnapshot() {
  const store = getActiveStore();
  if (!store) return;
  recordSnapshot(store, "snapshot");
  saveAndRender();
  elements.statusText.textContent = `${store.storeName} weekly snapshot saved.`;
}

function markActiveSent() {
  const store = getActiveStore();
  if (!store) return;
  store.lastSentWeekKey = storeWeekKey(store);
  recordSnapshot(store, "sent");
  saveAndRender();
  elements.statusText.textContent = `${store.storeName} marked sent.`;
}

function duplicateLastWeek() {
  const store = getActiveStore();
  if (!store) return;
  const latest = historyForStore(store)[0];
  if (!latest) {
    elements.statusText.textContent = "Save a weekly snapshot before duplicating last week.";
    return;
  }

  const sourceStart = parseDateInput(latest.weekStart);
  const sourceEnd = parseDateInput(latest.weekEnd);
  const duration = sourceStart && sourceEnd ? Math.max(Math.round((sourceEnd - sourceStart) / 86400000), 0) : 6;
  const targetStart = startOfCurrentWeek();
  const targetEnd = new Date(targetStart);
  targetEnd.setDate(targetEnd.getDate() + duration);
  const sourceStartValue = latest.weekStart;

  store.weekStart = toDateInputValue(targetStart);
  store.weekEnd = toDateInputValue(targetEnd);
  store.visits = (latest.visits || []).map((visit, index) => ({
    date: sourceStartValue && visit.date ? shiftDateToWeek(visit.date, sourceStartValue, store.weekStart) : addDaysToInput(store.weekStart, index),
    person: visit.person || ""
  }));
  store.importantNotes = latest.importantNotes || "";
  store.helpNotes = latest.helpNotes || "";
  store.newsNotes = latest.newsNotes || "";
  store.staffingNotes = latest.staffingNotes || "";
  store.hoursNotes = latest.hoursNotes || STANDARD_TIER_HOURS_TEXT;
  store.openItems = latest.openItems || "";
  store.featuredDeals = latest.featuredDeals || "";
  store.regularReps = latest.regularReps || "";
  store.preferredWording = latest.preferredWording || "";
  store.metrics = structuredClone(latest.metrics || store.metrics || []);
  store.lastSentWeekKey = "";
  store.polishedEmail = "";
  saveAndRender();
  elements.statusText.textContent = `${store.storeName} duplicated into ${formatWeekRange(store.weekStart, store.weekEnd)}.`;
}

function startOfCurrentWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function addDaysToInput(value, days) {
  const date = parseDateInput(value);
  if (!date) return "";
  date.setDate(date.getDate() + Number(days || 0));
  return toDateInputValue(date);
}

function shiftDateToWeek(value, sourceStart, targetStart) {
  const date = parseDateInput(value);
  const source = parseDateInput(sourceStart);
  const target = parseDateInput(targetStart);
  if (!date || !source || !target) return value || "";
  const offset = Math.round((date - source) / 86400000);
  target.setDate(target.getDate() + offset);
  return toDateInputValue(target);
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
  const optionalSections = buildOptionalEmailSections(store);

  return `Good morning ${store.contactName || "there"},

Here is your weekly Premium partnership update! First, let's start with who you can expect to see in your store for the next couple of weeks:

${visits}

${optionalSections}

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
  const optionalSections = buildOptionalEmailSections(store);

  return `Good morning ${store.contactName || "there"},

Here is your weekly Premium partnership update. Communication is a big part of being a strong partner, so I want to keep you updated on staffing, coverage, store results, and where we could use support.

Here is who you can expect to see in your store over the next couple of weeks:

${visits}

${optionalSections}

Results Update

${summary}

How you can help us!

${support}

Here is where the team stands month-to-date and where we are focused for the rest of the month:

${progressLines}

If you or your management team have any questions or concerns, please feel free to contact me anytime.

MTD Numbers:

${mtdLines}

Month Goals:

${goalLines || "No month goals entered yet."}

Please pass this update along to your management team as needed. As always, reach out any time with questions, concerns, store needs, or customer issues. I appreciate the partnership and look forward to continuing to help drive the store's success.`;
}

function buildRichEmailHtml(store) {
  if (!store) return "";
  const insight = buildCoachingInsight(store);
  const visits = (store.visits || []).length
    ? (store.visits || []).map((visit) => `<tr><td style="padding:5px 10px;border-bottom:1px solid #edf1ef;color:#5f6d68;font-size:13px;">${escapeHtml(formatDate(visit.date))}</td><td style="padding:5px 10px;border-bottom:1px solid #edf1ef;color:#1c2824;font-size:13px;">${escapeHtml(visit.person || "Open coverage")}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:8px 10px;color:#6b7672;font-size:13px;">No visits entered yet.</td></tr>`;
  const metrics = (store.metrics || []).map((metric) => {
    const progress = calculateProgress(metric);
    const width = Math.max(0, Math.min(progress.percent, 100));
    const remaining = Math.max(Number(metric.goal || 0) - Number(metric.mtd || 0), 0);
    const color = progressColor(progress.percent);
    const filledWidth = Math.round(width);
    const emptyWidth = Math.max(100 - filledWidth, 0);
    return `<tr>
      <td style="padding:8px 8px;border-bottom:1px solid #edf1ef;color:#1c2824;font-size:12px;font-weight:600;">${escapeHtml(metric.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #edf1ef;color:#35413d;font-size:12px;text-align:right;">${escapeHtml(formatValue(metric.mtd, metric.format))}</td>
      <td style="padding:8px;border-bottom:1px solid #edf1ef;color:#35413d;font-size:12px;text-align:right;">${escapeHtml(formatValue(metric.goal, metric.format))}</td>
      <td style="padding:8px;border-bottom:1px solid #edf1ef;color:#6b7672;font-size:12px;text-align:right;">${remaining > 0 ? escapeHtml(formatValue(remaining, metric.format)) : "Goal reached"}</td>
      <td style="padding:8px;border-bottom:1px solid #edf1ef;min-width:118px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="${filledWidth}%" height="7" bgcolor="${color}" style="height:7px;font-size:1px;line-height:1px;">&nbsp;</td><td width="${emptyWidth}%" height="7" bgcolor="#e8eeeb" style="height:7px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td><td style="width:38px;padding-left:7px;color:#35413d;font-size:11px;text-align:right;">${Math.round(progress.percent)}%</td></tr></table></td>
    </tr>`;
  }).join("");
  const optionalSections = [
    ["News", store.newsNotes],
    ["Staffing Update", store.staffingNotes],
    ["Location Tier Hours", store.hoursNotes],
    ["Featured Device/Carrier Deals", store.featuredDeals],
    ["Open Items / Assistance Requested", store.openItems]
  ].filter(([, body]) => cleanSentence(body)).map(([title, body]) => `<h3 style="margin:18px 0 6px;color:#173f34;font-size:14px;">${escapeHtml(title)}</h3><p style="margin:0 0 10px;color:#35413d;font-size:13px;line-height:1.55;white-space:pre-line;">${escapeHtml(cleanMultiline(body))}</p>`).join("");
  const preferred = cleanSentence(store.preferredWording);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;margin:0 auto;border:1px solid #dbe2df;border-collapse:separate;border-spacing:0;background:#ffffff;font-family:Segoe UI,Arial,sans-serif;">
    <tr><td style="padding:18px 22px;background:#087b61;color:#ffffff;">
      <div style="font-size:18px;font-weight:700;line-height:1.25;">${escapeHtml(store.storeName || "Store")} Weekly Partnership Update</div>
      <div style="margin-top:3px;font-size:12px;opacity:.9;">${escapeHtml(formatWeekRange(store.weekStart, store.weekEnd))}</div>
    </td></tr>
    <tr><td style="padding:22px;">
      <p style="margin:0 0 14px;color:#1c2824;font-size:14px;line-height:1.55;">Good morning ${escapeHtml(store.contactName || "there")},</p>
      <p style="margin:0 0 16px;color:#35413d;font-size:13px;line-height:1.6;">Here is your weekly Premium partnership update. I want to keep you current on coverage, results, and where our partnership can help close the remaining gaps.</p>
      <h2 style="margin:18px 0 8px;color:#173f34;font-size:15px;">Upcoming Visits</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e1e7e4;border-radius:5px;border-collapse:separate;border-spacing:0;">${visits}</table>
      ${optionalSections}
      <h2 style="margin:20px 0 8px;color:#173f34;font-size:15px;">Results Update</h2>
      <p style="margin:0 0 12px;color:#35413d;font-size:13px;line-height:1.6;">${escapeHtml(buildPolishedSummary(store))}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1px solid #dbe2df;border-collapse:separate;border-spacing:0;">
        <tr style="background:#f5f8f7;"><th style="padding:8px;text-align:left;color:#5f6d68;font-size:10px;text-transform:uppercase;letter-spacing:.04em;">Metric</th><th style="padding:8px;text-align:right;color:#5f6d68;font-size:10px;text-transform:uppercase;">MTD</th><th style="padding:8px;text-align:right;color:#5f6d68;font-size:10px;text-transform:uppercase;">Goal</th><th style="padding:8px;text-align:right;color:#5f6d68;font-size:10px;text-transform:uppercase;">Remaining</th><th style="padding:8px;text-align:left;color:#5f6d68;font-size:10px;text-transform:uppercase;">Progress</th></tr>
        ${metrics}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #b8d8cc;background:#eff8f4;"><tr><td style="padding:12px 14px;"><strong style="display:block;color:#087b61;font-size:12px;">Focus this week</strong><span style="display:block;margin-top:4px;color:#35413d;font-size:13px;line-height:1.5;">${escapeHtml(insight.focus)}</span></td></tr></table>
      <p style="margin:18px 0 0;color:#35413d;font-size:13px;line-height:1.6;">${escapeHtml(preferred || "If you or your management team have any questions or concerns, please feel free to contact me anytime.")}</p>
    </td></tr>
  </table>`;
}

function progressColor(percent) {
  if (percent >= 80) return "#087b61";
  if (percent >= 55) return "#d7a80c";
  return "#df6b58";
}

function buildOptionalEmailSections(store) {
  const sections = [
    ["News", store.newsNotes],
    ["Staffing Update", store.staffingNotes],
    ["Location Tier Hours", store.hoursNotes],
    ["Featured Device/Carrier Deals", store.featuredDeals],
    ["Open Items / Assistance Requested", store.openItems]
  ];

  return sections
    .map(([title, body]) => {
      const text = cleanMultiline(body);
      return text ? `${title}\n\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
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

function syncVisitsToWeekRange(store) {
  const dates = datesBetween(store.weekStart, store.weekEnd);
  if (!dates.length) return;

  const existingVisits = Array.isArray(store.visits) ? store.visits : [];
  const peopleByDate = new Map(existingVisits
    .filter((visit) => visit.date)
    .map((visit) => [visit.date, visit.person || ""]));

  store.visits = dates.map((date, index) => ({
    date,
    person: peopleByDate.get(date) ?? existingVisits[index]?.person ?? ""
  }));
}

function shouldAutoFillVisitDates(store) {
  const dates = datesBetween(store.weekStart, store.weekEnd);
  const visits = Array.isArray(store.visits) ? store.visits : [];
  return Boolean(dates.length) && (!visits.length || visits.every((visit) => !visit.date));
}

function nextVisitDate(store) {
  const dates = datesBetween(store.weekStart, store.weekEnd);
  if (!dates.length) return "";

  const usedDates = new Set((store.visits || []).map((visit) => visit.date).filter(Boolean));
  return dates.find((date) => !usedDates.has(date)) || dates[dates.length - 1] || "";
}

function datesBetween(startValue, endValue) {
  const start = parseDateInput(startValue);
  const end = parseDateInput(endValue);
  if (!start || !end || end < start) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < 31) {
    dates.push(toDateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanMultiline(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
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

function formatWeekRange(startValue, endValue) {
  const start = parseDateInput(startValue);
  const end = parseDateInput(endValue);
  if (!start || !end) return "Week dates not set";
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = start.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
  const endText = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startText} - ${endText}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "locally";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
  const store = getActiveStore();
  await navigator.clipboard.writeText(store?.polishedEmail || buildEmail(store));
  elements.statusText.textContent = "Current email copied.";
}

async function copyRichEmail() {
  const store = getActiveStore();
  if (!store) return;
  const html = buildRichEmailHtml(store);
  const text = store.polishedEmail || buildEmail(store);
  if (window.weeklyEmailApp?.copyRichEmail) {
    const result = await window.weeklyEmailApp.copyRichEmail({ html, text });
    if (!result?.ok) {
      showImportError(result?.error || "The rich email could not be copied.");
      return;
    }
  } else if (window.ClipboardItem && navigator.clipboard?.write) {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" })
    })]);
  } else {
    await navigator.clipboard.writeText(text);
  }
  elements.statusText.textContent = "Outlook-ready rich email copied.";
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
    store.lastSentWeekKey = storeWeekKey(store);
    recordSnapshot(store, "sent");
    saveAndRender();
    elements.statusText.textContent = `Email draft opened for ${email} with ${DEFAULT_CC_EMAIL} copied.`;
    return;
  }

  window.location.href = `mailto:${encodeURIComponent(email)}?cc=${encodeURIComponent(DEFAULT_CC_EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  store.lastSentWeekKey = storeWeekKey(store);
  recordSnapshot(store, "sent");
  saveAndRender();
  elements.statusText.textContent = `Email draft opened for ${email} with ${DEFAULT_CC_EMAIL} copied.`;
}

function draftForStore(store) {
  return {
    to: String(store.managerEmail || "").trim(),
    cc: DEFAULT_CC_EMAIL,
    subject: `${store.storeName || `Store ${store.storeNumber || ""}`} Weekly Premium Partnership Update`.trim(),
    body: store.polishedEmail || buildEmail(store),
    html: buildRichEmailHtml(store)
  };
}

function confirmSafetyWarnings(stores) {
  const warnings = stores.flatMap((store) => buildSafetyChecks(store)
    .filter((check) => !check.ok)
    .map((check) => `${store.storeName}: ${check.label}`));
  if (!warnings.length) return true;
  return confirm(`Pre-send review found ${warnings.length} item${warnings.length === 1 ? "" : "s"} to check:\n\n${warnings.slice(0, 10).join("\n")}\n\nCreate the draft${stores.length === 1 ? "" : "s"} anyway?`);
}

async function createActiveOutlookDraft() {
  const store = getActiveStore();
  if (!store) return;
  if (!isEmailAddress(store.managerEmail)) {
    alert("Add a valid manager email address before creating the Outlook draft.");
    return;
  }
  if (!confirmSafetyWarnings([store])) return;
  await createOutlookDraftsForStores([store]);
}

async function createAllOutlookDrafts() {
  const readyStores = state.stores.filter((store) => isEmailAddress(store.managerEmail));
  if (!readyStores.length) {
    alert("Add manager email addresses before creating Outlook drafts.");
    return;
  }
  const skipped = state.stores.length - readyStores.length;
  if (skipped && !confirm(`${skipped} store${skipped === 1 ? " is" : "s are"} missing a valid manager email and will be skipped. Continue?`)) return;
  if (!confirmSafetyWarnings(readyStores)) return;
  await createOutlookDraftsForStores(readyStores);
}

async function createOutlookDraftsForStores(stores) {
  const drafts = stores.map(draftForStore);
  if (!window.weeklyEmailApp?.createOutlookDrafts) {
    showImportError("Rich Outlook drafts require the Windows desktop app. Open Weekly Premium Email Builder Latest.exe and try again.");
    return;
  }
  const mode = elements.outlookModeSelect.value === "classic" ? "classic" : "cloud";
  const destination = mode === "cloud" ? "Microsoft mailbox" : "Classic Outlook";
  elements.statusText.textContent = `Creating ${drafts.length} draft${drafts.length === 1 ? "" : "s"} in ${destination}...`;
  const result = await window.weeklyEmailApp.createOutlookDrafts({ drafts, mode });
  if (!result?.ok) {
    if (result?.needsMicrosoftSetup) await openOutlookSettings();
    showImportError(result?.error || "Outlook could not create the drafts.");
    return;
  }
  stores.forEach((store) => recordSnapshot(store, "draft"));
  saveAndRender();
  const accountLabel = result.account ? ` for ${result.account}` : "";
  elements.statusText.textContent = `${result.count || drafts.length} Outlook draft${(result.count || drafts.length) === 1 ? "" : "s"} saved to Drafts${accountLabel}.`;
}

function updateOutlookMode() {
  state.settings = {
    ...defaultSettings,
    ...(state.settings || {}),
    outlookMode: elements.outlookModeSelect.value === "classic" ? "classic" : "cloud"
  };
  saveWithoutRender();
  const label = state.settings.outlookMode === "cloud" ? "New Outlook / Web" : "Classic Outlook";
  elements.statusText.textContent = `Outlook drafts will use ${label}.`;
}

async function initializeMicrosoftStatus() {
  const result = await window.weeklyEmailApp?.getMicrosoftStatus?.();
  if (!result) return;
  elements.microsoftClientIdInput.value = result.clientId || "";
  elements.microsoftTenantIdInput.value = result.tenantId || "organizations";
  if (result.signedIn) {
    elements.outlookSettingsStatus.textContent = `Connected as ${result.account || "your Microsoft account"}. Drafts will be saved to this mailbox.`;
    elements.outlookSettingsBtn.textContent = "Outlook Connected";
    elements.disconnectMicrosoftBtn.hidden = false;
  } else if (result.configured) {
    elements.outlookSettingsStatus.textContent = result.error || "Microsoft setup is saved. Sign in to connect your mailbox.";
    elements.outlookSettingsBtn.textContent = "Outlook Sign In";
    elements.disconnectMicrosoftBtn.hidden = true;
  } else {
    elements.outlookSettingsStatus.textContent = "Add your Microsoft Application ID, then sign in to save drafts in new Outlook and Outlook on the web.";
    elements.outlookSettingsBtn.textContent = "Outlook Settings";
    elements.disconnectMicrosoftBtn.hidden = true;
  }
}

async function openOutlookSettings() {
  await initializeMicrosoftStatus();
  if (!elements.outlookSettingsDialog.open) elements.outlookSettingsDialog.showModal();
}

async function saveMicrosoftSettingsAndConnect() {
  elements.saveMicrosoftSettingsBtn.disabled = true;
  elements.outlookSettingsStatus.textContent = "Saving Microsoft settings...";
  try {
    const saved = await window.weeklyEmailApp?.saveMicrosoftSettings?.({
      clientId: elements.microsoftClientIdInput.value.trim(),
      tenantId: elements.microsoftTenantIdInput.value.trim() || "organizations"
    });
    if (!saved?.ok) {
      elements.outlookSettingsStatus.textContent = saved?.error || "Microsoft settings could not be saved.";
      return;
    }
    elements.outlookSettingsStatus.textContent = "Opening Microsoft sign-in...";
    const connected = await window.weeklyEmailApp?.connectMicrosoftAccount?.();
    if (!connected?.ok) {
      elements.outlookSettingsStatus.textContent = connected?.error || "Microsoft sign-in was not completed.";
      return;
    }
    elements.outlookSettingsDialog.close();
    await initializeMicrosoftStatus();
    elements.statusText.textContent = `Microsoft Outlook connected as ${connected.account || "your account"}.`;
  } finally {
    elements.saveMicrosoftSettingsBtn.disabled = false;
  }
}

async function disconnectMicrosoftAccount() {
  const result = await window.weeklyEmailApp?.disconnectMicrosoftAccount?.();
  if (!result?.ok) {
    elements.outlookSettingsStatus.textContent = result?.error || "The Microsoft account could not be disconnected.";
    return;
  }
  await initializeMicrosoftStatus();
  elements.statusText.textContent = "Microsoft Outlook account disconnected from this app.";
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

async function polishActiveEmail() {
  const store = getActiveStore();
  if (!store) return;
  setAIBusy(true);
  elements.writerStatus.textContent = `AI is polishing ${store.storeName}...`;
  try {
    const fallback = buildPolishedEmail(store);
    const result = await window.weeklyEmailApp?.polishEmailWithAI?.({
      text: fallback,
      style: elements.aiStyleSelect.value
    });
    store.polishedEmail = result?.ok ? result.text : fallback;
    saveAndRender();
    if (result?.ok) {
      elements.writerStatus.textContent = `${store.storeName} was polished with AI.`;
    } else {
      elements.writerStatus.textContent = `Offline polish used. ${result?.error || "AI editor unavailable."}`;
      if (result?.needsKey) openAISettings();
    }
  } finally {
    setAIBusy(false);
  }
}

async function polishAllEmails() {
  setAIBusy(true);
  let aiCount = 0;
  try {
    for (let index = 0; index < state.stores.length; index += 1) {
      const store = state.stores[index];
      elements.writerStatus.textContent = `AI is polishing ${index + 1} of ${state.stores.length}: ${store.storeName}...`;
      const fallback = buildPolishedEmail(store);
      const result = await window.weeklyEmailApp?.polishEmailWithAI?.({
        text: fallback,
        style: elements.aiStyleSelect.value
      });
      store.polishedEmail = result?.ok ? result.text : fallback;
      if (result?.ok) aiCount += 1;
      if (result?.needsKey) {
        openAISettings();
        break;
      }
    }
    saveAndRender();
    elements.writerStatus.textContent = aiCount === state.stores.length
      ? `All ${state.stores.length} emails were polished with AI.`
      : `${aiCount} of ${state.stores.length} emails used AI; the rest used offline polish.`;
  } finally {
    setAIBusy(false);
  }
}

function setAIBusy(busy) {
  elements.polishEmailBtn.disabled = busy;
  elements.polishAllBtn.disabled = busy;
  elements.aiStyleSelect.disabled = busy;
}

async function initializeAIStatus() {
  const result = await window.weeklyEmailApp?.getAIStatus?.();
  const label = result?.configured ? `AI ready (${result.model}).` : "AI needs an API key.";
  elements.aiSettingsStatus.textContent = result?.configured
    ? `${label} The key is encrypted and stored only on this computer.`
    : "Add an OpenAI API key. It will be encrypted and stored only on this computer.";
  elements.aiSettingsBtn.textContent = result?.configured ? "AI Ready" : "AI Settings";
}

function openAISettings() {
  elements.aiKeyInput.value = "";
  elements.aiSettingsDialog.showModal();
}

async function saveAIKey() {
  const key = elements.aiKeyInput.value.trim();
  elements.saveAIKeyBtn.disabled = true;
  elements.aiSettingsStatus.textContent = "Saving securely...";
  try {
    const result = await window.weeklyEmailApp?.saveAIKey?.(key);
    if (!result?.ok) {
      elements.aiSettingsStatus.textContent = result?.error || "The API key could not be saved.";
      return;
    }
    elements.aiSettingsDialog.close();
    await initializeAIStatus();
    elements.writerStatus.textContent = "AI editor is ready.";
  } finally {
    elements.saveAIKeyBtn.disabled = false;
  }
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
    version: 2,
    exportedAt: new Date().toISOString(),
    storeMappings,
    settings: { ...defaultSettings, ...(state.settings || {}) },
    profiles: state.profiles || [],
    history: state.history || [],
    storeGoals: state.stores.map((store) => ({
      storeNumber: store.storeNumber || "",
      storeName: store.storeName || "",
      newsNotes: store.newsNotes || "",
      staffingNotes: store.staffingNotes || "",
      hoursNotes: store.hoursNotes || "",
      openItems: store.openItems || "",
      featuredDeals: store.featuredDeals || "",
      regularReps: store.regularReps || "",
      preferredWording: store.preferredWording || "",
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
    if (Array.isArray(backup.profiles)) {
      state.profiles = backup.profiles;
    }
    if (Array.isArray(backup.history)) {
      state.history = backup.history.slice(0, MAX_HISTORY_ITEMS);
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
    store.newsNotes = saved.newsNotes || store.newsNotes || "";
    store.staffingNotes = saved.staffingNotes || store.staffingNotes || "";
    store.hoursNotes = saved.hoursNotes || store.hoursNotes || "";
    store.openItems = saved.openItems || store.openItems || "";
    store.featuredDeals = saved.featuredDeals || store.featuredDeals || "";
    store.regularReps = saved.regularReps || store.regularReps || "";
    store.preferredWording = saved.preferredWording || store.preferredWording || "";
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
  let importKind = "file";

  try {
    syncStoreMappingsFromForm();
    saveStoreMappings();

    if (file.type.startsWith("image/")) {
      state = await importImageAndPolish(file);
      importKind = "screenshot";
    } else {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        state = finalizeImportedState(await normalizeWorkbookImport(file), state);
        importKind = "Excel file";
      } else {
        const text = await file.text();
        if (fileName.endsWith(".json")) {
          state = finalizeImportedState(normalizeJsonImport(JSON.parse(text)), state);
          importKind = "settings file";
        } else {
          state = finalizeImportedState(normalizeTextReportImport(text), state);
          importKind = "report rows";
        }
      }
    }

    activeStoreId = state.stores[0]?.id;
    polishAllStores();
    saveAndRender();
    if (importKind === "Excel file") {
      setReportPreview(`${file.name} loaded.\n${state.stores.length} store${state.stores.length === 1 ? "" : "s"} imported from Excel.`);
    }
    elements.ocrStatus.textContent = `${importKind} loaded: ${state.stores.length} store${state.stores.length === 1 ? "" : "s"} imported.`;
    elements.writerStatus.textContent = `Smart Writer drafted ${state.stores.length} store email${state.stores.length === 1 ? "" : "s"}.`;
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
        newsNotes: record.newsnotes || record.news || "",
        staffingNotes: record.staffingnotes || record.staffing || "",
        hoursNotes: record.hoursnotes || record.locationhours || record.hours || STANDARD_TIER_HOURS_TEXT,
        openItems: record.openitems || record.assistancerequested || "",
        featuredDeals: record.featureddeals || record.devicedeals || record.deals || "",
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
        newsNotes: "",
        staffingNotes: "",
        hoursNotes: STANDARD_TIER_HOURS_TEXT,
        openItems: "",
        featuredDeals: "",
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
      newsNotes: "",
      staffingNotes: "",
      hoursNotes: STANDARD_TIER_HOURS_TEXT,
      openItems: "",
      featuredDeals: "",
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
      newsNotes: "",
      staffingNotes: "",
      hoursNotes: STANDARD_TIER_HOURS_TEXT,
      openItems: "",
      featuredDeals: "",
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
    return pacedMetricFromRecord(record, {
      rawKeys: ["prepaidsales", "preunits"],
      pspdKeys: ["preunitspspd"],
      maxPspd: 25,
      round: roundMetricValue
    });
  }

  if (metricName === "Postpaid Activation") {
    const postActs = firstRecordValue(record, ["postacts"]);
    if (postActs !== "") return parseMetricNumber(postActs);

    const postpaidActivation = firstRecordValue(record, ["postpaidactivation"]);
    const value = parseMetricNumber(postpaidActivation);
    return postpaidActivation === "" || value > 150 ? 0 : value;
  }

  if (metricName === "Accessory Sales") {
    return pacedMetricFromRecord(record, {
      rawKeys: ["accessorysales"],
      pspdKeys: ["accpspd"],
      round: roundMetricValue
    });
  }

  if (metricName === "Prepaid Activation") {
    return pacedMetricFromRecord(record, {
      rawKeys: ["prepaidactivation", "preacts"],
      pspdKeys: ["preactspspd"],
      maxPspd: 25,
      round: Math.round
    });
  }

  if (metricName === "Device Protection") {
    return rateMetricFromRecord(record, sourceKeys);
  }

  const value = firstRecordValue(record, sourceKeys);
  return value === "" ? 0 : parseMetricNumber(value);
}

function pacedMetricFromRecord(record, { rawKeys = [], pspdKeys = [], maxPspd = Infinity, round = roundMetricValue }) {
  const pspdRaw = firstRecordValue(record, pspdKeys);
  if (pspdRaw !== "") {
    const pspdValue = parseMetricNumber(pspdRaw);
    if (pspdValue <= maxPspd) {
      return round(pspdValue * mtdPaceMultiplier());
    }
  }

  const rawValue = firstRecordValue(record, rawKeys);
  return rawValue === "" ? 0 : parseMetricNumber(rawValue);
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
    newsNotes: store.newsNotes || "",
    staffingNotes: store.staffingNotes || "",
    hoursNotes: store.hoursNotes || STANDARD_TIER_HOURS_TEXT,
    openItems: store.openItems || "",
    featuredDeals: store.featuredDeals || "",
    regularReps: store.regularReps || "",
    preferredWording: store.preferredWording || "",
    lastSentWeekKey: store.lastSentWeekKey || "",
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
  state = normalizeLoadedState({
    stores: structuredClone(sampleStores),
    settings: state.settings,
    profiles: state.profiles,
    history: state.history,
    lastSavedAt: state.lastSavedAt
  });
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
