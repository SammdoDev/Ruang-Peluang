# Ruang Peluang

Katalog terbuka berisi **100 ide model bisnis** dari luar negeri untuk diteliti di Indonesia: masing-masing 25 ide produk, kuliner, hotel, dan sektor lain. Setiap ide menyertakan contoh operator, tautan sumber, ringkasan bukti yang terlihat, hipotesis lokal, uji awal, risiko, dan skor awal yang bisa diubah.

**Situs publik:** [Ruang Peluang](https://ruang-peluang-samuel.sammdopurn.chatgpt.site). Repositori ini disiapkan untuk berbagi kode dan data agar dapat dipelajari serta dijalankan sendiri.

## Cara pakai

Pengunjung dapat mencari, memfilter menurut kategori, model bisnis, dan kompleksitas, menyimpan ide, serta membandingkan hingga tiga ide tanpa masuk akun. Skor untuk potensi pasar, persaingan, monetisasi, dan kesulitan eksekusi bisa disesuaikan. Simpanan dan draf usulan berada di `localStorage` perangkat; tidak tersinkron antarperangkat.

Untuk mengusulkan ide, isi formulir di situs lalu pilih **Kirim lewat GitHub**. Tombol membuka draf GitHub Issue; masuk ke GitHub bila diminta, periksa kembali isinya, kemudian kirim. Usulan tidak langsung masuk katalog. Kamu juga bisa [membuka templat usulan langsung di GitHub](https://github.com/SammdoDev/Ruang-Peluang/issues/new?template=ide-baru.md). Tidak ada akun atau kata sandi yang disimpan oleh situs ini.

## Jalankan secara lokal

Persyaratan: Node.js modern untuk pemeriksaan dan build; Python 3 dapat digunakan untuk server lokal.

```bash
npm run check
npm run build
cd dist
python3 -m http.server 4173
```

Buka `http://localhost:4173`. Situs ini statis tanpa API atau basis data, sehingga hasil `dist/` dapat dipindahkan ke hosting statis lain. Jalankan melalui server HTTP agar impor modul JavaScript bekerja.

## Struktur data dan batasan riset

- `ideas.js` dan `ideas-extra.js`: data katalog. `example`, `source`, dan `evidence` merangkum contoh operator luar negeri; baca halaman sumber asli untuk verifikasi.
- `hypothesis`, `pilot`, `risk`, kompleksitas, dan skor awal: penilaian editorial untuk diuji di Indonesia, **bukan** fakta pasar atau hasil survei kompetitor.
- Klaim bahwa suatu model masih jarang di Indonesia adalah titik awal riset. Tidak ada sensus menyeluruh terhadap pesaing, permintaan, regulasi, atau kelayakan finansial.
- Skor berbobot: potensi pasar 35%, persaingan yang lebih ringan 20%, monetisasi 25%, kemudahan eksekusi 20%. Nilai 1–5 dan hasil /100 bersifat subjektif.

Sumber ditautkan per ide. Deskripsi perusahaan pihak ketiga, merek dagang, dan konten pada situs sumber tetap milik pemegang hak masing-masing.

## Kontribusi dan lisensi

Baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk mengusulkan ide, memperbaiki data, atau mengirim pull request. Kode menggunakan [lisensi MIT](LICENSE). Naskah katalog asli dan kurasi data menggunakan [CC BY 4.0](DATA-LICENSE.md); tautan sumber pihak ketiga tidak ikut dilisensikan.
