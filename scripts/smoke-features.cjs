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
assert.equal(typeof exposedDesktopBridge?.getMicrosoftStatus, "function", "Microsoft account status bridge must load");
assert.equal(typeof exposedDesktopBridge?.saveMicrosoftSettings, "function", "Microsoft settings bridge must load");
assert.equal(typeof exposedDesktopBridge?.connectMicrosoftAccount, "function", "Microsoft sign-in bridge must load");
exposedDesktopBridge.createOutlookDrafts({ mode: "cloud", drafts: [{ to: "manager@example.com", html: "<strong>Cloud</strong>" }] });
assert.equal(invokedDesktopChannel.channel, "create-outlook-drafts");
assert.equal(invokedDesktopChannel.payload.mode, "cloud");

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
  hoursNotes: "Sunday: 11-6\nMonday - Wednesday: 11-7\nThursday: 11-8\nFriday - Saturday: 10-8",
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
assert.equal(active.storeName, "Harlan");
assert.equal(active.regularReps, "Henry Stewart, Shane Kelly");

const customTierHours = context.buildTierHoursText({
  sunday: "12-5",
  monWed: "10-7",
  thursday: "10-8",
  friSat: "9-9"
});
assert.equal(customTierHours, "Sunday: 12-5\nMonday - Wednesday: 10-7\nThursday: 10-8\nFriday - Saturday: 9-9");
assert.equal(context.parseTierHours(customTierHours).friSat, "9-9");
active.hoursNotes = customTierHours;

const staleProfile = {
  ...context.buildProfileFromStore(active),
  hoursNotes: "Sunday: 11-6\nMonday - Wednesday: 11-7\nThursday: 11-8\nFriday - Saturday: 10-8"
};
const importedWithDefaultHours = {
  stores: [{
    ...structuredClone(active),
    hoursNotes: staleProfile.hoursNotes,
    metrics: active.metrics.map((metric) => ({ ...metric, mtd: Number(metric.mtd) + 1 }))
  }]
};
const mergedImport = context.finalizeImportedState(importedWithDefaultHours, {
  stores: [structuredClone(active)],
  settings: { mtdMultiplier: 10 },
  profiles: [staleProfile],
  history: []
});
assert.equal(mergedImport.stores[0].hoursNotes, customTierHours, "imports must preserve the store's saved tier hours");

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
assert.equal(profile.hoursNotes, customTierHours);
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
assert.equal(profiled.hoursNotes, customTierHours);
assert.ok(profiled.metrics.every((metric) => Number(metric.goal) > 0));

const html = context.buildRichEmailHtml(active);
assert.match(html, /Outlook|Weekly Partnership Update/);
assert.match(html, /Focus this week/);
assert.match(html, /background:#087b61/);
assert.match(html, /Postpaid Activation/);
assert.match(html, /Friday - Saturday: 9-9/);
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
assert.match(mainSource, /PublicClientApplication/);
assert.match(mainSource, /https:\/\/graph\.microsoft\.com\/v1\.0\/me\/messages/);
assert.match(mainSource, /Mail\.ReadWrite/);
assert.match(mainSource, /acquireTokenByDeviceCode/);
assert.match(mainSource, /microsoft-token-cache\.bin/);
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
assert.match(preloadSource, /getMicrosoftStatus/);
assert.match(preloadSource, /connectMicrosoftAccount/);
assert.doesNotMatch(preloadSource, /node:path|node:url/);
assert.match(htmlSource, /Featured device\/carrier deals/);
assert.match(htmlSource, /id="newsNotes"/);
assert.match(htmlSource, /id="aiStyleSelect"/);
assert.match(htmlSource, /id="aiSettingsDialog"/);
assert.match(htmlSource, /id="outlookModeSelect"/);
assert.match(htmlSource, /id="outlookSettingsDialog"/);
assert.match(htmlSource, /New Outlook \/ Web/);

console.log("FEATURE_SMOKE_OK: new Outlook cloud drafts, encrypted Microsoft sign-in, Classic Outlook fallback, AI polish, news notes, long draft payloads, import-safe tier hours, rich drafts, profiles, history, readiness, coaching, and safety");
