import { ideas } from './ideas.js';
import { validateProposal, proposalIssueUrl } from './proposal.js';

const $ = (q) => document.querySelector(q);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const readStorage = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const persist = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const categories = ['Semua ide', 'Produk', 'Kuliner', 'Hotel', 'Lainnya'];
const complexityOrder = { Rendah: 1, Sedang: 2, Tinggi: 3 };
const ratingLabels = [
  ['potential', 'Potensi pasar', '1 = kecil, 5 = besar; hipotesis awal'],
  ['competition', 'Persaingan', '1 = ringan, 5 = padat; semakin rendah semakin baik'],
  ['monetization', 'Monetisasi', '1 = sulit, 5 = jelas; hipotesis awal'],
  ['difficulty', 'Kesulitan eksekusi', '1 = mudah, 5 = sulit; semakin rendah semakin baik']
];
const state = {
  category: 'Semua ide', query: '', complexity: '', model: '', sort: 'score', savedOnly: false,
  saved: new Set(readStorage('rp-saved-v1', []).map(Number)),
  ratings: readStorage('rp-ratings-v1', {}), compare: [], current: null, visibleCount: 18
};

function ratingsFor(idea) {
  const changed = state.ratings[idea.id] || {};
  return Object.fromEntries(ratingLabels.map(([key]) => [key, Math.min(5, Math.max(1, Number(changed[key]) || idea.ratings[key]))]));
}
function score(idea) {
  const r = ratingsFor(idea);
  return Math.round((r.potential / 5) * 35 + ((6 - r.competition) / 5) * 20 + (r.monetization / 5) * 25 + ((6 - r.difficulty) / 5) * 20);
}
function results() {
  const q = state.query.toLocaleLowerCase('id').trim();
  return ideas.filter((idea) =>
    (state.category === 'Semua ide' || idea.category === state.category) &&
    (!state.complexity || idea.complexity === state.complexity) &&
    (!state.model || idea.model === state.model) &&
    (!state.savedOnly || state.saved.has(idea.id)) &&
    (!q || [idea.title, idea.summary, idea.customer, idea.example, idea.category, idea.model, idea.hypothesis].join(' ').toLocaleLowerCase('id').includes(q))
  ).sort((a, b) => state.sort === 'title' ? a.title.localeCompare(b.title, 'id') : state.sort === 'complexity' ? complexityOrder[a.complexity] - complexityOrder[b.complexity] || score(b) - score(a) : score(b) - score(a) || a.id - b.id);
}
function renderCategories() {
  $('#categoryList').innerHTML = categories.map((c) => `<button class="category-button ${state.category === c ? 'active' : ''}" type="button" data-category="${escapeHtml(c)}" aria-pressed="${state.category === c}"><span>${escapeHtml(c)}</span><b>${c === 'Semua ide' ? ideas.length : ideas.filter(i => i.category === c).length}</b></button>`).join('');
}
function renderCards() {
  const matched = results();
  const visible = matched.slice(0, state.visibleCount);
  $('#resultCount').textContent = `${matched.length} ide`;
  $('#activeDescriptor').textContent = matched.length ? `· ${visible.length} ditampilkan${state.savedOnly ? ' · tersimpan' : ''}${state.category === 'Semua ide' ? '' : ` · ${state.category}`}` : '';
  $('#savedCount').textContent = state.saved.size;
  $('#savedFilter').classList.toggle('active', state.savedOnly);
  $('#savedFilter').setAttribute('aria-pressed', String(state.savedOnly));
  $('#empty').hidden = matched.length > 0;
  $('#loadMore').hidden = visible.length >= matched.length;
  $('#loadMore').textContent = `Muat ${Math.min(18, matched.length - visible.length)} ide lagi`;
  $('#cards').innerHTML = visible.map((idea) => {
    const selected = state.compare.includes(idea.id), saved = state.saved.has(idea.id);
    return `<article class="card" aria-label="${escapeHtml(idea.title)}">
      <div class="card-top"><span class="tag">${escapeHtml(idea.category)}</span><span class="card-id">#${String(idea.id).padStart(3, '0')}</span></div>
      <h3>${escapeHtml(idea.title)}</h3><p>${escapeHtml(idea.summary)}</p>
      <div class="card-chips"><span class="chip">${escapeHtml(idea.model)}</span><span class="chip">${escapeHtml(idea.complexity)}</span></div>
      <div class="card-example">Contoh: <a href="${escapeHtml(idea.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(idea.example)}</a></div>
      <div class="card-bottom"><div class="score-inline"><b>${score(idea)}</b><span>/ 100 <small>skor asumsi</small></span></div>
      <div class="card-actions"><button class="text-button ${saved ? 'active' : ''}" type="button" data-save="${idea.id}" aria-label="${saved ? 'Hapus dari ide tersimpan' : 'Simpan ide'}: ${escapeHtml(idea.title)}" aria-pressed="${saved}">${saved ? 'Tersimpan' : 'Simpan'}</button>
      <button class="text-button ${selected ? 'active' : ''}" type="button" data-compare="${idea.id}" aria-label="${selected ? 'Hapus dari perbandingan' : 'Bandingkan'}: ${escapeHtml(idea.title)}" aria-pressed="${selected}">${selected ? 'Dipilih' : 'Bandingkan'}</button>
      <button class="view-button" type="button" data-open="${idea.id}">Detail</button></div></div></article>`;
  }).join('');
  renderCompareBar();
}
function renderCompareBar(message = '') {
  const bar = $('#compareBar'); bar.hidden = state.compare.length === 0;
  if (bar.hidden) return;
  bar.innerHTML = `<div><strong>${message || `${state.compare.length} dari 3 ide dipilih`}</strong><small>${state.compare.map(id => ideas.find(i => i.id === id)?.title).join(' · ')}</small></div><div><button type="button" class="clear-compare" data-clear-compare="true" aria-label="Kosongkan perbandingan">Hapus</button><button type="button" data-show-compare="true" ${state.compare.length < 2 ? 'disabled title="Pilih minimal 2 ide"' : ''}>Lihat perbandingan</button></div>`;
}
function renderDrawer(idea) {
  const r = ratingsFor(idea);
  $('#drawer').innerHTML = `<div class="drawer-head"><span>IDE / ${String(idea.id).padStart(3, '0')}</span><button type="button" class="close" data-close="true" aria-label="Tutup detail">Tutup</button></div>
    <span class="tag">${escapeHtml(idea.category)}</span><h2>${escapeHtml(idea.title)}</h2><p class="drawer-summary">${escapeHtml(idea.summary)}</p>
    <div class="detail-chips"><span class="chip">${escapeHtml(idea.model)}</span><span class="chip">Kompleksitas ${escapeHtml(idea.complexity)}</span><span class="chip">Untuk ${escapeHtml(idea.customer)}</span></div>
    <div class="drawer-section"><div class="evidence-box"><div class="note-label">CONTOH LUAR NEGERI</div><p>${escapeHtml(idea.evidence)}</p><a href="${escapeHtml(idea.source)}" target="_blank" rel="noopener noreferrer">Sumber: ${escapeHtml(idea.example)}</a></div></div>
    <div class="drawer-section"><div class="hypothesis-box"><div class="note-label">HIPOTESIS INDONESIA · BELUM DIVERIFIKASI</div><p>${escapeHtml(idea.hypothesis)}</p></div></div>
    <div class="drawer-section"><h3>Eksperimen pertama</h3><p>${escapeHtml(idea.pilot)}</p></div>
    <div class="drawer-section"><h3>Risiko yang perlu diuji</h3><p>${escapeHtml(idea.risk)}</p></div>
    <div class="drawer-section"><div class="score-header"><h3>Penilaianmu <span style="font-weight:400;color:#879588">/ estimasi 1–5</span></h3><span class="big-score" id="drawerScore">${score(idea)}<span style="font-size:12px;color:#8ca18e"> / 100</span></span></div>
      <p class="score-caption">Nilai awal adalah asumsi editorial. Geser untuk menyesuaikan; hasil tersimpan hanya di browser ini.</p>
      ${ratingLabels.map(([key, label, help]) => `<div class="slider-row"><label for="rating-${key}">${label}</label><output id="output-${key}" for="rating-${key}">${r[key]} / 5</output><input type="range" min="1" max="5" step="1" value="${r[key]}" id="rating-${key}" data-rating="${key}" aria-label="${label}" /><small>${help}</small></div>`).join('')}
      <div class="score-formula">Rumus: potensi pasar 35% + persaingan ringan 20% + monetisasi 25% + kemudahan eksekusi 20%. Skor adalah alat pembanding subjektif, bukan proyeksi keberhasilan.</div>
      <div class="detail-actions"><button type="button" data-reset-rating="${idea.id}">Reset nilai</button><button type="button" data-save="${idea.id}" class="${state.saved.has(idea.id) ? 'active' : ''}">${state.saved.has(idea.id) ? 'Tersimpan' : 'Simpan ide'}</button><button type="button" data-compare="${idea.id}" class="primary">${state.compare.includes(idea.id) ? 'Dipilih' : 'Bandingkan'}</button></div>
    </div>`;
}
function openDrawer(id) {
  state.current = ideas.find(i => i.id === id);
  if (!state.current) return;
  $('#compareDialog').hidden = true; $('#proposalDialog').hidden = true;
  renderDrawer(state.current);
  $('#overlay').hidden = false; $('#drawer').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#drawer .close').focus();
}
function closeDialogs() {
  $('#overlay').hidden = true; $('#drawer').hidden = true; $('#compareDialog').hidden = true; $('#proposalDialog').hidden = true;
  document.body.style.overflow = ''; state.current = null;
}
function toggleSave(id) {
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  persist('rp-saved-v1', [...state.saved]); renderCards();
  if (state.current) renderDrawer(state.current);
}
function toggleCompare(id) {
  if (state.compare.includes(id)) state.compare = state.compare.filter(x => x !== id);
  else if (state.compare.length < 3) state.compare.push(id);
  else { renderCompareBar('Maksimal 3 ide. Hapus satu pilihan dahulu.'); return; }
  renderCards(); if (state.current) renderDrawer(state.current);
}
function openComparison() {
  if (state.compare.length < 2) return;
  const selected = state.compare.map(id => ideas.find(i => i.id === id));
  const row = (name, values) => `<tr><td>${name}</td>${values.map(v => `<td>${v}</td>`).join('')}</tr>`;
  $('#compareDialog').innerHTML = `<div class="compare-heading"><div><small>PERBANDINGAN / ${selected.length} IDE</small><h2>Bandingkan ide</h2><p>Nilai ini adalah asumsi yang bisa kamu ubah di detail masing-masing ide.</p></div><button type="button" class="close" data-close="true" aria-label="Tutup perbandingan">Tutup</button></div>
    <div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Indikator</th>${selected.map(i => `<th>${escapeHtml(i.title)}</th>`).join('')}</tr></thead><tbody>
      ${row('Skor subjektif', selected.map(i => `<span class="strong">${score(i)}</span><span class="subtle"> / 100</span>`))}
      ${row('Kategori / model', selected.map(i => `${escapeHtml(i.category)}<br><span class="subtle">${escapeHtml(i.model)}</span>`))}
      ${row('Kompleksitas', selected.map(i => escapeHtml(i.complexity)))}
      ${row('Pelanggan', selected.map(i => escapeHtml(i.customer)))}
      ${row('Contoh luar negeri', selected.map(i => `<a href="${escapeHtml(i.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(i.example)}</a><br>${escapeHtml(i.evidence)}`))}
      ${row('Hipotesis lokal', selected.map(i => escapeHtml(i.hypothesis)))}
      ${row('Uji pertama', selected.map(i => escapeHtml(i.pilot)))}
      ${row('Risiko utama', selected.map(i => escapeHtml(i.risk)))}
    </tbody></table></div><div class="compare-actions"><button type="button" data-close="true">Selesai</button></div>`;
  $('#drawer').hidden = true; $('#proposalDialog').hidden = true; $('#compareDialog').hidden = false; $('#overlay').hidden = false;
  document.body.style.overflow = 'hidden'; $('#compareDialog .close').focus();
}
function resetFilters() {
  Object.assign(state, { category: 'Semua ide', query: '', complexity: '', model: '', savedOnly: false, visibleCount: 18 });
  $('#query').value = ''; $('#complexity').value = ''; $('#businessModel').value = '';
  renderCategories(); renderCards();
}

function openProposal() {
  $('#drawer').hidden = true; $('#compareDialog').hidden = true;
  $('#overlay').hidden = false; $('#proposalDialog').hidden = false;
  document.body.style.overflow = 'hidden'; state.current = null;
  const draft = readStorage('rp-proposal-v1', {});
  for (const [key, value] of Object.entries(draft)) {
    const field = $('#proposalForm').elements.namedItem(key);
    if (field) field.value = value;
  }
  $('#proposalStatus').textContent = '';
  $('#proposalDialog .close').focus();
}
function getProposal() {
  return validateProposal(Object.fromEntries(new FormData($('#proposalForm'))));
}
function saveProposal() {
  const result = getProposal();
  if (result.error) { $('#proposalStatus').textContent = result.error; return null; }
  persist('rp-proposal-v1', result.data);
  $('#proposalStatus').textContent = 'Draf tersimpan di browser ini. Belum dikirim atau diterbitkan.';
  return result.data;
}

document.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target) return;
  if (target.dataset.category) { state.category = target.dataset.category; state.visibleCount = 18; renderCategories(); renderCards(); }
  else if (target.dataset.open) openDrawer(Number(target.dataset.open));
  else if (target.dataset.save) toggleSave(Number(target.dataset.save));
  else if (target.dataset.compare) toggleCompare(Number(target.dataset.compare));
  else if (target.dataset.close || target === $('#overlay')) closeDialogs();
  else if (target.dataset.clearCompare) { state.compare = []; renderCards(); }
  else if (target.dataset.showCompare) openComparison();
  else if (target.dataset.resetRating) { delete state.ratings[target.dataset.resetRating]; persist('rp-ratings-v1', state.ratings); renderDrawer(state.current); renderCards(); }
});
$('#overlay').addEventListener('click', closeDialogs);
$('#query').addEventListener('input', e => { state.query = e.target.value; state.visibleCount = 18; renderCards(); });
$('#complexity').addEventListener('change', e => { state.complexity = e.target.value; state.visibleCount = 18; renderCards(); });
$('#businessModel').addEventListener('change', e => { state.model = e.target.value; state.visibleCount = 18; renderCards(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; state.visibleCount = 18; renderCards(); });
$('#savedFilter').addEventListener('click', () => { state.savedOnly = !state.savedOnly; state.visibleCount = 18; renderCards(); });
$('#loadMore').addEventListener('click', () => { state.visibleCount += 18; renderCards(); });
$('#resetFilters').addEventListener('click', resetFilters);
$('#emptyReset').addEventListener('click', resetFilters);
$('#openProposalTop').addEventListener('click', openProposal);
$('#openProposal').addEventListener('click', openProposal);
$('#proposalForm').addEventListener('submit', e => { e.preventDefault(); saveProposal(); });
$('#downloadProposal').addEventListener('click', () => {
  const data = saveProposal();
  if (!data) return;
  const blob = new Blob([JSON.stringify({ schema_version: 1, ...data }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'usulan-ruang-peluang.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#proposalStatus').textContent = 'Draf diunduh sebagai JSON. Belum dikirim atau diterbitkan.';
});
$('#submitProposal').addEventListener('click', () => {
  const data = saveProposal();
  if (!data) return;
  $('#proposalStatus').textContent = 'GitHub akan terbuka. Periksa usulanmu lalu pilih Submit new issue untuk mengirimnya.';
  window.open(proposalIssueUrl(data), '_blank', 'noopener,noreferrer');
});
$('#drawer').addEventListener('input', e => {
  const key = e.target.dataset.rating;
  if (!key || !state.current) return;
  const id = state.current.id;
  state.ratings[id] = { ...ratingsFor(state.current), [key]: Number(e.target.value) };
  persist('rp-ratings-v1', state.ratings);
  $(`#output-${key}`).textContent = `${e.target.value} / 5`;
  $('#drawerScore').innerHTML = `${score(state.current)}<span style="font-size:12px;color:#8ca18e"> / 100</span>`;
});
$('#drawer').addEventListener('change', e => { if (e.target.dataset.rating) renderCards(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDialogs();
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && $('#overlay').hidden) { e.preventDefault(); $('#query').focus(); }
});

renderCategories(); renderCards();
