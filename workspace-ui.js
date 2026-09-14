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
  const coverageDialog = document.querySelector("#bulkCoverageDialog");
  const coverageStart = document.querySelector("#bulkWeekStart");
  const coverageEnd = document.querySelector("#bulkWeekEnd");
  const coverageApply = document.querySelector("#applyBulkCoverageBtn");
  let coverageDraft = [];
  let readingSchedule = false;
  async function importScheduleImages(files) {
    if (readingSchedule || !files.length) return;
    readingSchedule = true;
    coverageDialog.querySelectorAll('button, input').forEach((control) => { control.disabled = true; });
    const status = document.querySelector('#scheduleImportStatus');
    let worker;
    try {
      status.textContent = 'Reading schedule...';
      worker = await Tesseract.createWorker('eng', 1, getOcrAssetPaths());
      await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
      const recognized = [];
      for (const file of files) {
        status.textContent = `Reading image ${files.indexOf(file) + 1} of ${files.length}: ${file.name || 'Pasted screenshot'}`;
        const source = await loadImage(file);
        const canvas = document.createElement('canvas');
        const scale = Math.min(4, Math.max(2, 4000 / source.width));
        canvas.width = source.width * scale;
        canvas.height = source.height * scale;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        await worker.setParameters({ tessedit_pageseg_mode: '6' });
        const result = await worker.recognize(canvas);
        // Sparse recognition recovers store headings above colored schedule tables.
        await worker.setParameters({ tessedit_pageseg_mode: '11' });
        const headings = await worker.recognize(canvas);
        const storeWords = headings.data.words.filter((word) => /^#\d{3,5}$/.test(word.text));
        for (const word of storeWords) {
          const crop = document.createElement('canvas');
          crop.width = (word.bbox.x1 - word.bbox.x0) * 2 + 40;
          crop.height = (word.bbox.y1 - word.bbox.y0) * 2 + 40;
          const ctx = crop.getContext('2d');
          ctx.fillStyle = 'white'; ctx.fillRect(0, 0, crop.width, crop.height);
          ctx.drawImage(canvas, word.bbox.x0, word.bbox.y0, word.bbox.x1 - word.bbox.x0, word.bbox.y1 - word.bbox.y0, 20, 20, crop.width - 40, crop.height - 40);
          await worker.setParameters({ tessedit_pageseg_mode: '7', tessedit_char_whitelist: '#0123456789' });
          const number = (await worker.recognize(crop)).data.text.trim();
          await worker.setParameters({ tessedit_char_whitelist: '' });
          if (/^#\d{3,5}$/.test(number)) {
            result.data.words = result.data.words.filter(existing => !( /^#\d{3,5}$/.test(existing.text) && Math.abs(existing.bbox.y0 - word.bbox.y0) < 20));
            word.text = number;
          }
          if (!result.data.words.some((existing) => existing.text === word.text && Math.abs(existing.bbox.y0 - word.bbox.y0) < 20)) result.data.words.push(word);
        }
        try { recognized.push(...parseScheduleImageWords(result.data.words)); }
        catch (error) { throw new Error(`${file.name || 'Pasted screenshot'}: ${error.message}`); }
      }
      const schedules = mergeScheduleImports(recognized);
      const start = schedules[0].visits[0].date;
      const end = schedules[0].visits[6].date;
      for (const schedule of schedules) {
        if (schedule.visits[0].date !== start) throw new Error('Upload schedules from the same week together.');
        if (!coverageDraft.some((store) => String(Number(store.storeNumber)) === schedule.storeNumber)) throw new Error(`Store #${schedule.storeNumber} is not in Settings. Add it before importing.`);
      }
      coverageStart.value = start;
      coverageEnd.value = end;
      coverageDraft = coverageDraft.map((store) => {
        const schedule = schedules.find((item) => item.storeNumber === String(Number(store.storeNumber)));
        return schedule ? { ...store, visits: schedule.visits } : store;
      });
      renderCoverage();
      status.textContent = `${files.length} images read; ${schedules.length} stores loaded for review: ${schedules.map((s) => '#' + s.storeNumber).join(', ')}. ${recognized.length - schedules.length} repeated schedules skipped. Check coverage, then Apply to all stores to save.`;
    } catch (error) {
      status.textContent = `Schedule not imported: ${error.message || String(error)}`;
    } finally {
      if (worker) await worker.terminate();
      readingSchedule = false;
      coverageDialog.querySelectorAll('button, input').forEach((control) => { control.disabled = false; });
      const count = datesBetween(coverageStart.value, coverageEnd.value).length;
      coverageApply.disabled = !count || count > 14;
    }
  }
  document.querySelector('#scheduleImageInput').addEventListener('change', async (event) => {
    await importScheduleImages([...event.target.files]);
    event.target.value = '';
  });
  coverageDialog.addEventListener('cancel', (event) => { if (readingSchedule) event.preventDefault(); });
  window.addEventListener('paste', (event) => {
    if (!coverageDialog.open) return;
    const files = [...(event.clipboardData?.items || [])].filter((item) => item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
    if (!files.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    importScheduleImages(files);
  }, true);
  function renderCoverage() {
    const dates = datesBetween(coverageStart.value, coverageEnd.value);
    const valid = dates.length > 0 && dates.length <= 14;
    coverageApply.disabled = !valid;
    document.querySelector("#bulkCoverageStatus").textContent = valid
      ? `${coverageDraft.length} stores | ${formatWeekRange(coverageStart.value, coverageEnd.value)}`
      : "Choose a date range of 1 to 14 days.";
    document.querySelector("#bulkCoverageHead").innerHTML = "";
    document.querySelector("#bulkCoverageBody").innerHTML = "";
    if (!valid) return;
    coverageDraft = coverageDraft.map((store) => ({ ...store, visits: reusableWeeklyVisits(store, coverageStart.value, coverageEnd.value) }));
    document.querySelector("#bulkCoverageHead").innerHTML = `<tr><th scope="col">Store</th>${dates.map((date) => `<th scope="col">${escapeHtml(parseDateInput(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }))}</th>`).join("")}</tr>`;
    const body = document.querySelector("#bulkCoverageBody");
    coverageDraft.forEach((store) => {
      const row = document.createElement("tr");
      row.innerHTML = `<th scope="row">${escapeHtml(store.storeName || "Store")}<small>${escapeHtml(store.storeNumber || "")}</small></th>`;
      store.visits.forEach((visit) => {
        const cell = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.value = visit.person;
        input.placeholder = "Open coverage";
        input.setAttribute("aria-label", `${store.storeName} ${visit.date} representative`);
        input.addEventListener("input", () => { visit.person = input.value; });
        cell.appendChild(input);
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }
  function setCoverageWeek(start) {
    coverageStart.value = start;
    coverageEnd.value = addDaysToInput(start, 6);
    renderCoverage();
  }
  document.querySelector("#bulkCoverageBtn").addEventListener("click", () => {
    document.querySelector('#scheduleImportStatus').textContent = '';
    coverageDraft = structuredClone(state.stores);
    coverageStart.value = state.settings.coverageWeekStart || toDateInputValue(startOfCurrentWeek());
    coverageEnd.value = state.settings.coverageWeekEnd || addDaysToInput(coverageStart.value, 6);
    renderCoverage();
    coverageDialog.showModal();
  });
  [coverageStart, coverageEnd].forEach((input) => input.addEventListener("change", renderCoverage));
  document.querySelector("#bulkThisWeekBtn").addEventListener("click", () => setCoverageWeek(toDateInputValue(startOfCurrentWeek())));
  document.querySelector("#bulkNextWeekBtn").addEventListener("click", () => {
    if (!parseDateInput(coverageStart.value) || !parseDateInput(coverageEnd.value)) return;
    coverageStart.value = addDaysToInput(coverageStart.value, 7);
    coverageEnd.value = addDaysToInput(coverageEnd.value, 7);
    renderCoverage();
  });
  ["closeBulkCoverageBtn", "cancelBulkCoverageBtn"].forEach((id) => document.getElementById(id).addEventListener("click", () => coverageDialog.close()));
  coverageApply.addEventListener("click", () => {
    state.stores = applyWeeklyCoverage(state.stores, coverageDraft, coverageStart.value, coverageEnd.value);
    state.settings.coverageWeekStart = coverageStart.value;
    state.settings.coverageWeekEnd = coverageEnd.value;
    saveAndRender();
    coverageDialog.close();
    elements.statusText.textContent = `Weekly coverage updated for ${state.stores.length} stores.`;
  });
  refreshWorkspace();
})();
