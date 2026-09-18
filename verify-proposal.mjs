import assert from 'node:assert/strict';
import { validateProposal, proposalIssueUrl } from './proposal.js';

const valid = {
  title: 'Sewa dapur untuk acara komunitas', category: 'Kuliner',
  summary: 'Sewakan dapur pada jam kosong untuk acara memasak komunitas.',
  example: 'Peerspace', source: 'https://www.peerspace.com/',
  evidence: 'Operator menyediakan pemesanan ruang berdasarkan kegiatan dan jam.',
  hypothesis: 'Komunitas kota mungkin mencari dapur bersama untuk acara kecil.',
  pilot: 'Uji tiga dapur dan dua puluh pemesanan dalam sebulan.',
  risk: 'Perizinan, sanitasi, dan keselamatan ruang.'
};
assert.deepEqual(validateProposal(valid).data, valid);
assert.match(validateProposal({ ...valid, source: 'http://example.com' }).error, /HTTPS/);
assert.match(validateProposal({ ...valid, evidence: '' }).error, /Bukti/);
assert.match(validateProposal({ ...valid, category: 'Tidak ada' }).error, /kategori/);
const issue = new URL(proposalIssueUrl(valid));
assert.equal(issue.hostname, 'github.com');
assert.equal(issue.pathname, '/SammdoDev/Ruang-Peluang/issues/new');
assert.match(issue.searchParams.get('body'), /Bukti dari sumber/);
assert.match(issue.searchParams.get('body'), /Hipotesis Indonesia \(belum diverifikasi\)/);
console.log('Verified contributor draft validation and source requirements.');
