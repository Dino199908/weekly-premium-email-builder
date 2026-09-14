(function (root) {
  function parseSchedule(words) {
    const center = (word) => (word.bbox.y0 + word.bbox.y1) / 2;
    const rows = [];
    for (const word of [...words].sort((a, b) => center(a) - center(b) || a.bbox.x0 - b.bbox.x0)) {
      let row = rows.find((item) => Math.abs(item.y - center(word)) < Math.max(6, (word.bbox.y1 - word.bbox.y0) * 0.6));
      if (!row) { row = { y: center(word), words: [] }; rows.push(row); }
      row.words.push(word);
    }
    rows.forEach((row) => { row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0); row.text = row.words.map((w) => w.text).join(' '); });
    const results = [];
    let storeNumber = '';
    for (const row of rows) {
      const store = row.text.match(/(?:#\s*|Store\s*:?\s*)(\d{3,5})\b/i);
      if (store) storeNumber = String(Number(store[1]));
      const dateWords = row.words.filter((word) => /\d{1,2}\/\d{1,2}\/\d{4}/.test(word.text));
      if (dateWords.length !== 7) continue;
      if (!storeNumber) throw new Error('Store number was not readable. Include the store heading in the picture.');
      const dates = dateWords.map((word) => {
        const [month, day, year] = word.text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)[0].split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error('A schedule date could not be read.');
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      });
      if (dates.some((date, i) => i && Date.parse(date) - Date.parse(dates[i - 1]) !== 86400000)) throw new Error('Schedule dates must be seven consecutive days.');
      const reps = row.words.filter((word) => /^Rep(?:[Il]d)?$/i.test(word.text));
      if (reps.length < 2) throw new Error('Rep Name and Rep Id columns were not readable. Include the full schedule.');
      const starts = dateWords.map((word, i) => {
        const previousDate = i ? dateWords[i - 1].bbox.x1 : reps[1].bbox.x1;
        const weekday = row.words.find((w) => w.bbox.x0 > previousDate && w.bbox.x0 < word.bbox.x0 && /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/i.test(w.text));
        return weekday?.bbox.x0 ?? word.bbox.x0;
      });
      const visits = dates.map((date) => ({ date, person: '' }));
      let repCount = 0;
      for (const dataRow of rows.filter((item) => item.y > row.y)) {
        if (/#\s*\d{3,5}|Walmart|Director Name|\d{1,2}\/\d{1,2}\/\d{4}/i.test(dataRow.text)) break;
        const id = dataRow.words.find((w) => w.bbox.x0 >= reps[1].bbox.x0 - 12 && w.bbox.x0 < starts[0] && /^\d{4,8}$/.test(w.text));
        if (!id) continue;
        const name = dataRow.words.filter((w) => w.bbox.x0 >= reps[0].bbox.x0 - 12 && w.bbox.x0 < reps[1].bbox.x0 - 12).map((w) => w.text).join(' ').trim();
        if (!name) throw new Error('A representative name was unreadable. Try a sharper picture.');
        repCount++;
        visits.forEach((visit, i) => {
          const cell = dataRow.words.filter((w) => w.bbox.x0 >= starts[i] - 12 && (i === 6 || w.bbox.x0 < starts[i + 1] - 12)).map((w) => w.text).join(' ');
          if (/\b\d+(?:\.\d+)?\s*h(?:rs?|ours?)\b/i.test(cell) && parseFloat(cell) > 0) visit.person += `${visit.person ? ', ' : ''}${name}`;
          else if (!/^\s*(?:[-=–—]|0(?:\s*hrs?)?)\s*$/i.test(cell)) throw new Error(`Unreadable hours for ${name} on ${visit.date}. Try a sharper picture.`);
        });
      }
      if (!repCount) throw new Error('No representative rows were readable. Include names, rep IDs, and all seven days.');
      results.push({ storeNumber, visits });
      storeNumber = '';
    }
    if (!results.length) throw new Error('No weekly schedule found. Include the store number, date headings, names, and hours.');
    return results;
  }
  root.parseScheduleImageWords = parseSchedule;
  root.mergeScheduleImports = function (schedules) {
    const unique = new Map();
    for (const schedule of schedules) {
      const previous = unique.get(schedule.storeNumber);
      const signature = (item) => JSON.stringify(item.visits.map(v => [v.date, v.person.toLowerCase().split(',').map(n => n.trim()).sort()]));
      if (previous && signature(previous) !== signature(schedule)) throw new Error(`Conflicting coverage for store #${schedule.storeNumber}. Upload its complete schedule only once.`);
      unique.set(schedule.storeNumber, schedule);
    }
    return [...unique.values()];
  };
  if (typeof module !== 'undefined') module.exports = parseSchedule;
})(typeof window !== 'undefined' ? window : globalThis);
