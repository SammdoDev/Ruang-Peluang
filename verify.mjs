import assert from 'node:assert/strict';
import { ideas } from './ideas.js';

assert.equal(ideas.length, 100);
for (const category of ['Produk', 'Kuliner', 'Hotel', 'Lainnya']) {
  assert.equal(ideas.filter(idea => idea.category === category).length, 25);
}
assert.equal(new Set(ideas.map(idea => idea.id)).size, ideas.length);
assert.equal(new Set(ideas.map(idea => idea.title)).size, ideas.length);
for (const idea of ideas) {
  for (const key of ['title', 'summary', 'customer', 'model', 'complexity', 'example', 'evidence', 'hypothesis', 'pilot', 'risk']) {
    assert.ok(idea[key], `${idea.id}: missing ${key}`);
  }
  assert.equal(new URL(idea.source).protocol, 'https:');
  for (const value of Object.values(idea.ratings)) assert.ok(value >= 1 && value <= 5);
}
console.log('Verified 100 unique, complete ideas in four categories.');
