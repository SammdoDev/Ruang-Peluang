const fields = ['title', 'category', 'summary', 'example', 'source', 'evidence', 'hypothesis', 'pilot', 'risk'];

export function validateProposal(input) {
  const data = Object.fromEntries(fields.map(key => [key, String(input[key] ?? '').trim()]));
  if (data.title.length < 8 || data.title.length > 100) return { error: 'Nama ide perlu 8–100 karakter.' };
  if (!['Produk', 'Kuliner', 'Hotel', 'Lainnya'].includes(data.category)) return { error: 'Pilih kategori.' };
  if (data.summary.length < 20 || data.summary.length > 400) return { error: 'Ringkasan perlu 20–400 karakter.' };
  if (data.example.length < 2 || data.example.length > 100) return { error: 'Isi nama operator luar negeri.' };
  try {
    const url = new URL(data.source);
    if (url.protocol !== 'https:' || !url.hostname.includes('.')) throw new Error('source');
  } catch { return { error: 'Gunakan tautan sumber HTTPS yang lengkap.' }; }
  for (const [key, label, max] of [
    ['evidence', 'Bukti dari sumber', 500], ['hypothesis', 'Hipotesis Indonesia', 500],
    ['pilot', 'Uji awal', 350], ['risk', 'Risiko utama', 350]
  ]) {
    if (data[key].length < 10 || data[key].length > max) return { error: `${label} perlu 10–${max} karakter.` };
  }
  return { data };
}

export function proposalIssueUrl(data) {
  const sections = [
    ['Kategori', data.category], ['Ringkasan model', data.summary],
    ['Contoh operator luar negeri', data.example], ['Tautan sumber', data.source],
    ['Bukti dari sumber', data.evidence], ['Hipotesis Indonesia (belum diverifikasi)', data.hypothesis],
    ['Uji awal', data.pilot], ['Risiko utama', data.risk]
  ];
  const params = new URLSearchParams({
    title: `Usulan ide: ${data.title}`,
    body: sections.map(([label, value]) => `### ${label}\n${value}`).join('\n\n')
  });
  return `https://github.com/SammdoDev/Ruang-Peluang/issues/new?${params}`;
}
