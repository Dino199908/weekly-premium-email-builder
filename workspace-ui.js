(() => {
  const tabs = [...document.querySelectorAll("[data-view]")];
  const workspace = document.querySelector(".workspace");
  const search = document.querySelector("#storeSearch");
  const sidebar = document.querySelector(".sidebar");
  const storeToggle = document.querySelector("#toggleStores");
  const viewKey = "premiumWeeklyEmailBuilder.workspaceView";

  function showView(name, focus = false) {
    const selected = tabs.find((tab) => tab.dataset.view === name) || tabs[0];
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.querySelector(`#view-${tab.dataset.view}`).hidden = !active;
    });
    localStorage.setItem(viewKey, selected.dataset.view);
    workspace.scrollTop = 0;
    if (focus) selected.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showView(tab.dataset.view));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      showView(tabs[next].dataset.view, true);
    });
  });
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.go, true)));
  document.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", () => {
    window.emailPreviewMode = button.dataset.preview;
    document.querySelectorAll("[data-preview]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderPreview();
  }));

  function filterStores() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll(".store-tab").forEach((button) => {
      button.hidden = !button.dataset.search.includes(query);
      if (!button.hidden) count++;
    });
    document.querySelector("#storeSearchEmpty").hidden = count > 0;
  }
  search.addEventListener("input", filterStores);
  storeToggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("is-open");
    storeToggle.setAttribute("aria-expanded", String(open));
    if (open) search.focus();
  });
  document.querySelector("#storeTabs").addEventListener("click", (event) => {
    if (!event.target.closest(".store-tab")) return;
    sidebar.classList.remove("is-open");
    storeToggle.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    sidebar.classList.remove("is-open");
    storeToggle.setAttribute("aria-expanded", "false");
  });
  document.querySelector("#addStoreBtn").addEventListener("click", () => {
    search.value = "";
    filterStores();
    showView("settings");
    document.querySelector("#storeName").focus();
  });
  document.querySelector("#storeForm").addEventListener("submit", (event) => event.preventDefault());

  function refreshWorkspace() {
    const store = getActiveStore();
    if (!store) return;
    document.querySelector("#activeStoreHeading").textContent = store.storeName || "Untitled store";
    document.querySelector("#activeStoreNumber").textContent = store.storeNumber ? `#${store.storeNumber}` : "";
    document.querySelector("#activeStoreContact").textContent = store.contactName || "Manager not set";
    document.querySelector("#activeStorePeriod").textContent = store.currentReport ? formatHistoryMonth(store.currentReport.month) : "Weekly update";
    document.querySelector("#portfolioCount").textContent = `${state.stores.length} stores`;
    document.querySelector("#reportPeriodLabel").textContent = store.currentReport ? `Through ${formatDate(store.currentReport.asOf)}` : "No dated report";
    document.querySelector("#emailRecipient").textContent = store.managerEmail || "Manager email not set";
    const icons = ["smartphone", "shopping-bag", "card-sim", "shield-check", "headphones"];
    document.querySelector("#performanceSummary").innerHTML = store.metrics.slice(0, 5).map((metric, index) => {
      const progress = calculateProgress(metric);
      const percent = Math.max(0, Math.min(progress.percent, 100));
      return `<div class="performance-item"><div class="performance-label"><i data-lucide="${icons[index]}"></i><span>${escapeHtml(metric.name)}</span></div><strong class="performance-value">${escapeHtml(formatValue(metric.mtd, metric.format))}</strong><div class="performance-track"><i style="--fill:${percent}%"></i></div><div class="performance-footer"><strong>${Math.round(progress.percent)}% to goal</strong><span>${escapeHtml(formatValue(metric.goal, metric.format))}</span></div></div>`;
    }).join("");
    filterStores();
    window.lucide?.createIcons();
  }
  window.addEventListener("workspace-render", refreshWorkspace);
  document.querySelector("#storeForm").addEventListener("input", () => requestAnimationFrame(refreshWorkspace));
  // Rows are added without rebuilding the screen, so initialize their icons separately.
  ["visitsList", "metricsList", "storeMappingsList"].forEach((id) => {
    new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === 1 && (node.matches("i[data-lucide]") || node.querySelector("i[data-lucide]"))))) window.lucide?.createIcons();
    }).observe(document.getElementById(id), { childList: true, subtree: true });
  });
  showView(localStorage.getItem(viewKey) || "overview");
  refreshWorkspace();
})();
