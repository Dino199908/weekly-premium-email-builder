const assert = require('node:assert/strict');
const parse = require('../schedule-import.js');
function fixture(number = '493', offset = 0) {
  const words = [];
  const add = (text, x, y, width = 40) => words.push({ text, bbox: { x0: x, x1: x + width, y0: y + offset, y1: y + offset + 10 } });
  add('#' + number, 0, 0);
  add('Rep', 100, 30); add('Name', 145, 30); add('Repld', 300, 30);
  for (let i = 0; i < 7; i++) add('9/' + (13 + i) + '/2026', 400 + i * 150, 30, 100);
  ['Christina Barnes', 'cody moore'].forEach((name, r) => {
    add(name, 100, 60 + r * 30); add('560270', 300, 60 + r * 30);
    for (let i = 0; i < 7; i++) add(i === 0 || i === r + 1 ? '8 hrs' : '-', 400 + i * 150, 60 + r * 30);
  });
  return words;
}
const words = fixture();
const result = parse(words)[0];
assert.equal(result.storeNumber, '493');
assert.equal(result.visits[0].date, '2026-09-13');
assert.equal(result.visits[0].person, 'Christina Barnes, cody moore');
assert.equal(result.visits[1].person, 'Christina Barnes');
assert.equal(result.visits[2].person, 'cody moore');
assert.equal(result.visits[6].person, '');
assert.equal(parse([...words, ...fixture('3772', 200)]).length, 2);
assert.throws(() => parse(words.filter(w => !w.text.startsWith('#'))), /Store number/);
assert.throws(() => parse(words.map(w => w.text === '8 hrs' ? { ...w, text: 'blurred' } : w)), /Unreadable hours/);
assert.throws(() => parse(words.filter(w => !w.text.includes('9/19/2026'))), /No weekly schedule/);
console.log('SCHEDULE_IMPORT_OK');
assert.equal(globalThis.mergeScheduleImports([result, structuredClone(result)]).length, 1);
const conflict = structuredClone(result);
conflict.visits[0].person = 'Different rep';
assert.throws(() => globalThis.mergeScheduleImports([result, conflict]), /Conflicting coverage/);
