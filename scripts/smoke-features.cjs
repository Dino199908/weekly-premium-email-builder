const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const mainSource = fs.readFileSync(path.join(root, "main.cjs"), "utf8");
const preloadSource = fs.readFileSync(path.join(root, "preload.cjs"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

let exposedDesktopBridge;
let invokedDesktopChannel;
vm.runInNewContext(preloadSource, {
  require: (moduleId) => {
    assert.equal(moduleId, "electron", "sandboxed preload may only require Electron here");
    return {
      contextBridge: {
        exposeInMainWorld: (name, value) => {
          assert.equal(name, "weeklyEmailApp");
          exposedDesktopBridge = value;
        }
      },
      ipcRenderer: {
        invoke: (channel, payload) => {
          invokedDesktopChannel = { channel, payload };
          return { ok: true };
        },
        removeAllListeners: () => {},
        on: () => {}
      }
    };
  }
}, { filename: "preload.cjs" });

assert.equal(typeof exposedDesktopBridge?.createOutlookDrafts, "function", "desktop Outlook bridge must load in the sandbox");
exposedDesktopBridge.createOutlookDrafts([{ to: "manager@example.com", html: "<strong>Rich</strong>" }]);
assert.equal(invokedDesktopChannel.channel, "create-outlook-drafts");
assert.match(invokedDesktopChannel.payload[0].html, /<strong>Rich<\/strong>/);
assert.equal(typeof exposedDesktopBridge?.polishEmailWithAI, "function", "sandboxed AI editor bridge must load");
exposedDesktopBridge.polishEmailWithAI({ text: "Draft email", style: "professional" });
assert.equal(invokedDesktopChannel.channel, "polish-email-with-ai");
assert.equal(invokedDesktopChannel.payload.style, "professional");
assert.equal(typeof exposedDesktopBridge?.openOutlookCompose, "function", "new Outlook compose bridge must load");
exposedDesktopBridge.openOutlookCompose({ to: "manager@example.com", html: "<strong>Copied</strong>", subject: "Weekly Update" });
assert.equal(invokedDesktopChannel.channel, "open-outlook-compose");
assert.match(invokedDesktopChannel.payload.html, /<strong>Copied<\/strong>/);

function dateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const start = new Date();
start.setHours(0, 0, 0, 0);
start.setDate(start.getDate() - start.getDay());
const end = new Date(start);
end.setDate(end.getDate() + 6);

const store = {
  id: crypto.randomUUID(),
  storeNumber: "739",
  storeName: "Harlan",
  contactName: "Cathy",
  managerEmail: "cathy@example.com",
  weekStart: dateInput(start),
  weekEnd: dateInput(end),
  visits: [{ date: dateInput(start), person: "Henry Stewart" }],
  importantNotes: "The team has a strong opportunity to finish the month well.",
  helpNotes: "Please keep sending qualified opportunities and supporting protection conversations.",
  newsNotes: "New display table is live near the front of the store.",
  staffingNotes: "Coverage is set for the week.",
  openItems: "",
  featuredDeals: "Current device promotions are available.",
  regularReps: "Henry Stewart, Shane Kelly",
  preferredWording: "Thank you for the partnership and continued support.",
  lastSentWeekKey: "",
  metrics: [
    { name: "Postpaid Activation", mtd: 20, goal: 41, format: "number" },
    { name: "Prepaid Sales", mtd: 30, goal: 60, format: "number" },
    { name: "Prepaid Activation", mtd: 15, goal: 25, format: "number" },
    { name: "Device Protection", mtd: 9, goal: 10, format: "percent" },
    { name: "Accessory Sales", mtd: 4000, goal: 8000, format: "currency" }
  ]
};

const savedState = JSON.stringify({
  stores: [store],
  settings: { mtdMultiplier: 10 },
  profiles: [],
  history: [],
  lastSavedAt: new Date().toISOString()
});

const storage = new Map([
  ["premiumWeeklyEmailBuilder.v1", savedState]
]);

const context = vm.createContext({
  __WEEKLY_EMAIL_FEATURE_TEST__: true,
  console,
  crypto: crypto.webcrypto,
  structuredClone,
  Date,
  Intl,
  Math,
  Number,
  String,
  Array,
  Object,
  RegExp,
  JSON,
  Map,
  Set,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  }
});

vm.runInContext(source, context, { filename: "app.js" });

const active = context.getActiveStore();
const migrated = context.normalizeLoadedState({ stores: [structuredClone(store)] });
assert.equal(new Set(migrated.stores.map((item) => item.storeNumber)).size, 24);
assert.equal(migrated.stores[0].managerEmail, store.managerEmail);
const deletedRoster = { ...migrated, stores: migrated.stores.filter((item) => item.storeNumber !== "1048") };
assert.equal(context.normalizeLoadedState(deletedRoster).stores.length, 23, "deleted stores stay deleted after restart");
const partialImport = context.finalizeImportedState({ stores: [structuredClone(store)] }, migrated);
assert.equal(partialImport.stores.length, 24, "partial reports preserve the full roster");
assert.equal(active.storeName, "Harlan");
assert.equal(active.regularReps, "Henry Stewart, Shane Kelly");

const jasonMapping = context.expectedStoreMappings().find((mapping) => mapping.storeNumber === "1247");
assert.equal(jasonMapping.contactName, "Jason");
assert.equal(jasonMapping.managerEmail, "store-mgr.s01247@stores.us.wal-mart.com");
const williamsburgMapping = context.expectedStoreMappings().find((mapping) => mapping.storeNumber === "1048");
assert.equal(williamsburgMapping.storeName, "Williamsburg");
assert.equal(williamsburgMapping.managerEmail, "store-mgr.s01048@stores.us.wal-mart.com");
const mappedImportNumbers = context.ensureExpectedStores({ stores: [] }, "1048").stores.map((item) => item.storeNumber);
assert.ok(mappedImportNumbers.includes("739"), "core stores should still be filled when OCR misses one");
assert.ok(mappedImportNumbers.includes("1048"), "a mapped store mentioned in the report should be added if OCR misses it");
assert.ok(!mappedImportNumbers.includes("1113"), "unmentioned mapped stores should not flood the import");

const savedProfile = context.buildProfileFromStore(active);
const importedStore = {
  stores: [{
    ...structuredClone(active),
    metrics: active.metrics.map((metric) => ({ ...metric, mtd: Number(metric.mtd) + 1 }))
  }]
};
const mergedImport = context.finalizeImportedState(importedStore, {
  stores: [structuredClone(active)],
  settings: { mtdMultiplier: 10 },
  profiles: [savedProfile],
  history: []
});
assert.equal(mergedImport.stores[0].regularReps, "Henry Stewart, Shane Kelly", "imports must preserve the store's saved profile details");

const checks = context.buildSafetyChecks(active);
assert.equal(checks.length, 7, "pre-send review must have seven checks");
assert.ok(checks.every((check) => check.ok), "complete store should pass all seven pre-send checks");

const readiness = context.getReadiness(active);
assert.equal(readiness.state, "ready");
assert.equal(readiness.percent, 100);

const insight = context.buildCoachingInsight(active);
assert.match(insight.strongest, /Device Protection/);
assert.match(insight.gap, /Postpaid Activation|Prepaid Sales|Accessory Sales/);
assert.match(insight.pace, /per day/);
assert.ok(insight.focus.length > 20);

const profile = context.buildProfileFromStore(active);
assert.equal(profile.managerEmail, "cathy@example.com");
assert.equal(profile.goals.length, 5);
const imported = {
  ...structuredClone(active),
  contactName: "Manager",
  managerEmail: "",
  regularReps: "",
  metrics: active.metrics.map((metric) => ({ ...metric, goal: 0 }))
};
const profiled = context.applyStoredProfileToStore(imported, [profile]);
assert.equal(profiled.contactName, "Cathy");
assert.equal(profiled.managerEmail, "cathy@example.com");
assert.equal(profiled.regularReps, "Henry Stewart, Shane Kelly");
assert.ok(profiled.metrics.every((metric) => Number(metric.goal) > 0));

const html = context.buildRichEmailHtml(active);
assert.match(html, /Outlook|Weekly Partnership Update/);
assert.match(html, /Focus this week/);
assert.match(html, /background:#087b61/);
assert.match(html, /Postpaid Activation/);
assert.doesNotMatch(html, /Location Tier Hours/);
assert.match(html, /News/);
assert.match(html, /New display table is live near the front of the store\./);
assert.match(html, /Featured Device\/Carrier Deals/);
assert.doesNotMatch(html, /Premium Retail Team/);

const textEmail = context.buildEmail(active);
assert.match(textEmail, /News/);
assert.match(textEmail, /New display table is live near the front of the store\./);

const snapshot = context.recordSnapshot(active, "snapshot");
assert.equal(snapshot.metrics.length, 5);
assert.match(snapshot.emailHtml, /Weekly Partnership Update/);
assert.equal(snapshot.newsNotes, "New display table is live near the front of the store.");
assert.equal(context.historyForStore(active).length, 1);
const monthlyHistory = context.monthlyHistoryForStore(active);
assert.equal(monthlyHistory.length, 1);
assert.equal(monthlyHistory[0].metrics.length, 5);

const draft = context.draftForStore(active);
assert.equal(draft.to, "cathy@example.com");
assert.equal(draft.cc, "KHartley@premiumretail.com");
assert.match(draft.html, /Weekly Partnership Update/);
assert.equal(draft.html, html, "Outlook draft must use the rich email HTML");

active.lastSentWeekKey = context.storeWeekKey(active);
assert.equal(context.getReadiness(active).state, "sent");

assert.match(source, /copyRichEmail/);
assert.match(source, /createAllOutlookDrafts/);
assert.match(source, /duplicateLastWeek/);
assert.match(mainSource, /create-outlook-drafts/);
assert.match(mainSource, /Outlook\.Application/);
assert.match(mainSource, /open-outlook-compose/);
assert.match(mainSource, /clipboard\.write\(\{ html: draft\.html, text: draft\.body \}\)/);
assert.doesNotMatch(mainSource, /PublicClientApplication|graph\.microsoft\.com|Mail\.ReadWrite/);
assert.match(mainSource, /\$mail\.HTMLBody = \[string\]\$draft\.html/);
assert.match(mainSource, /weekly-email-outlook-/);
assert.match(mainSource, /save-drafts\.ps1/);
assert.match(mainSource, /drafts\.json/);
assert.match(mainSource, /"-File"/);
assert.doesNotMatch(mainSource, /-EncodedCommand/);
assert.match(mainSource, /copy-rich-email/);
assert.match(mainSource, /safeStorage\.encryptString/);
assert.match(mainSource, /https:\/\/api\.openai\.com\/v1\/responses/);
assert.match(mainSource, /polish-email-with-ai/);
assert.match(preloadSource, /createOutlookDrafts/);
assert.match(preloadSource, /copyRichEmail/);
assert.match(preloadSource, /polishEmailWithAI/);
assert.match(preloadSource, /openOutlookCompose/);
assert.doesNotMatch(preloadSource, /node:path|node:url/);
assert.match(htmlSource, /Featured device\/carrier deals/);
assert.match(htmlSource, /id="newsNotes"/);
assert.match(htmlSource, /id="aiStyleSelect"/);
assert.match(htmlSource, /id="aiSettingsDialog"/);
assert.match(htmlSource, /id="outlookModeSelect"/);
assert.match(htmlSource, /New Outlook \(No Sign-In\)/);
assert.match(htmlSource, /Open in New Outlook/);
assert.doesNotMatch(htmlSource, /Microsoft Application ID|Mail\.ReadWrite/);

console.log("FEATURE_SMOKE_OK: no-sign-in new Outlook compose, guided multi-draft queue, Classic Outlook fallback, AI polish, news notes, expanded store mappings, monthly history, rich drafts, profiles, readiness, coaching, and safety");
