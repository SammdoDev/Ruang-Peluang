import assert from 'node:assert/strict';

class MockElement {
  constructor() {
    this.innerHTML = ''; this.textContent = ''; this.value = ''; this.hidden = false; this.style = {};
    this.listeners = {}; this.dataset = {};
    this.classList = { toggle() {} };
  }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  setAttribute() {}
  focus() {}
  closest() { return this; }
  emit(name, value = this.value) { this.value = value; this.listeners[name]?.({ target: this }); }
}
const nodes = new Map();
const node = (key) => nodes.get(key) ?? (nodes.set(key, new MockElement()), nodes.get(key));
const documentListeners = {};
globalThis.document = {
  body: { style: {} }, activeElement: { tagName: 'BODY' },
  querySelector: node,
  addEventListener: (name, handler) => { documentListeners[name] = handler; }
};
const store = new Map();
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };

await import('./app.js');
assert.match(node('#resultCount').textContent, /^100 ide$/);
assert.equal((node('#cards').innerHTML.match(/<article class="card"/g) || []).length, 18);
node('#loadMore').emit('click');
assert.equal((node('#cards').innerHTML.match(/<article class="card"/g) || []).length, 36);
for (let i = 0; i < 4; i++) node('#loadMore').emit('click');
assert.equal((node('#cards').innerHTML.match(/<article class="card"/g) || []).length, 100);
assert.equal(node('#loadMore').hidden, true);

node('#query').emit('input', 'day pass');
assert.equal(node('#resultCount').textContent, '1 ide');
assert.match(node('#cards').innerHTML, /Day pass fasilitas hotel/);
node('#query').emit('input', '');
node('#complexity').emit('change', 'Tinggi');
assert.ok(Number(node('#resultCount').textContent.split(' ')[0]) > 0);
node('#complexity').emit('change', '');
node('#businessModel').emit('change', 'SaaS');
assert.ok(Number(node('#resultCount').textContent.split(' ')[0]) > 0);
node('#businessModel').emit('change', '');

function click(dataset) { documentListeners.click({ target: Object.assign(new MockElement(), { dataset }) }); }
click({ category: 'Kuliner' });
assert.equal(node('#resultCount').textContent, '25 ide');
click({ category: 'Semua ide' });
click({ save: '10' });
node('#savedFilter').emit('click');
assert.equal(node('#resultCount').textContent, '1 ide');
node('#savedFilter').emit('click');

click({ compare: '10' }); click({ compare: '19' });
assert.match(node('#compareBar').innerHTML, /2 dari 3 ide dipilih/);
click({ showCompare: 'true' });
assert.match(node('#compareDialog').innerHTML, /Paket kejutan makanan surplus/);
assert.match(node('#compareDialog').innerHTML, /Day pass fasilitas hotel/);
click({ close: 'true' });

click({ open: '19' });
assert.match(node('#drawer').innerHTML, /HIPOTESIS INDONESIA/);
assert.match(node('#drawer').innerHTML, /https:\/\/www\.resortpass\.com/);
const oldScore = node('#drawerScore').innerHTML;
node('#drawer').listeners.input({ target: { dataset: { rating: 'potential' }, value: '1' } });
assert.notEqual(node('#drawerScore').innerHTML, oldScore);
assert.ok(store.get('rp-ratings-v1'));
console.log('Verified search, categories, saved items, comparison, source detail, and editable scoring.');
