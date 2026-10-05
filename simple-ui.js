(() => {
  const countInput = document.querySelector('#simplePostpaid');
  const yoyInput = document.querySelector('#simpleYoy');
  const staffingInput = document.querySelector('#staffingNotes');
  const staffingLabel = staffingInput.closest('label');
  staffingLabel.classList.add('simple-staffing');
  document.querySelector('.simple-actions').before(staffingLabel);
  staffingInput.addEventListener('input', event => {
    event.stopPropagation();
    const store = getActiveStore();
    if (!store) return;
    store.staffingNotes = staffingInput.value;
    store.polishedEmail = '';
    saveWithoutRender();
    renderPreview(); renderChecklist(); renderPreSendReview();
  });
  function refreshSimple() {
    const store = getActiveStore();
    if (!store) return;
    const { count, yoy } = postpaidFigures(store);
    if (document.activeElement !== countInput) countInput.value = count ?? '';
    if (document.activeElement !== yoyInput) yoyInput.value = yoy ?? '';
    if (document.activeElement !== staffingInput) staffingInput.value = store.staffingNotes || '';
    const trend = document.querySelector('#simpleTrend');
    trend.textContent = yoy === null ? 'No comparison yet' : yoy === 0 ? 'Flat year over year' : `${yoy > 0 ? 'Up' : 'Down'} ${Math.abs(yoy)}% year over year`;
    trend.dataset.direction = yoy === null || yoy === 0 ? 'flat' : yoy > 0 ? 'up' : 'down';
    document.querySelector('#simpleAsOf').textContent = store.currentReport?.asOf ? `Through ${formatDate(store.currentReport.asOf)}` : 'Current reporting period';
    document.querySelector('.review-columns').innerHTML = '<span>Store #</span><span>Store</span><span>Postpaid</span><span>YOY</span>';
    document.querySelector('#importReview').innerHTML = state.stores.map(item => {
      const values = postpaidFigures(item);
      return `<div class="review-row"><span>${escapeHtml(item.storeNumber)}</span><span>${escapeHtml(item.storeName)}</span><span>${values.count ?? 'Not entered'}</span><span>${values.yoy === null ? 'Not available' : `${values.yoy > 0 ? '+' : ''}${values.yoy}%`}</span></div>`;
    }).join('');
  }
  [[countInput, 'Postpaid Activation', 'number'], [yoyInput, 'Postpaid YOY', 'percent']].forEach(([input, name, format]) => {
    input.addEventListener('input', event => {
      event.stopPropagation();
      const store = getActiveStore();
      let metric = store.metrics.find(item => item.name === name);
      if (!metric) { metric = { name, goal: 0, format }; store.metrics.push(metric); }
      metric.mtd = input.value === '' ? '' : Number(input.value);
      store.polishedEmail = '';
      saveWithoutRender();
      renderPreview(); renderChecklist(); renderPreSendReview(); refreshSimple();
    });
  });
  window.addEventListener('workspace-render', refreshSimple);
  document.querySelector('.brand span').textContent = 'Postpaid weekly';
  document.querySelector('#tab-overview').lastChild.textContent = 'Postpaid';
  refreshSimple();
})();
