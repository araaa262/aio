from pathlib import Path

root=Path('/mnt/data/aio_textwork')
repls={
'public/index.html': {
'AIO FELICIA — clean premium all-in-one media downloader.':'AIO FELICIA — unduh video, foto, audio, dan file dari satu halaman.',
'<title>AIO FELICIA — Download</title>':'<title>AIO FELICIA — Pengunduh Media</title>',
'aria-label="AIO FELICIA home"':'aria-label="Beranda AIO FELICIA"',
'aria-label="Main navigation"':'aria-label="Navigasi utama"',
'>Downloader<':' >Unduh<',
'>Supported<':' >Platform<',
'>History<':' >Riwayat<',
'<span>MEDIA DOWNLOADER</span>':'<span>PENGUNDUH MEDIA</span>',
'<h1>Unduh media tanpa ribet.<br><em>Satu tempat, lebih praktis.</em></h1>':'<h1>Unduh media dengan mudah.<br><em>Semua kebutuhan di satu tempat.</em></h1>',
'Pilih aplikasi, tempel tautan, lalu ambil foto atau video yang kamu mau.':'Pilih platform, tempel tautan, lalu pilih media yang ingin kamu simpan.',
'MULAI UNDUH':'MULAI',
'LIHAT PLATFORM':'LIHAT PLATFORM',
'<b>PASTE</b>':'<b>TEMPEL</b>',
'<b>PREVIEW</b>':'<b>PRATINJAU</b>',
'<b>DOWNLOAD</b>':'<b>UNDUH</b>',
'<small>ONE CLEAN FLOW</small>':'<small>CEPAT DAN RAPI</small>',
'01 / SOURCE':'01 / PLATFORM',
'<h2>Pilih platform</h2>':'<h2>Pilih platform</h2>',
'<span class="step-note"><b>01</b> SOURCE <i></i> <b>02</b> URL <i></i> <b>03</b> RESULT</span>':'<span class="step-note"><b>01</b> PLATFORM <i></i> <b>02</b> TAUTAN <i></i> <b>03</b> HASIL</span>',
'Video · Photo · Music':'Video · Foto · Musik',
'Reels · Post · Carousel':'Reels · Foto · Album',
'Images · Video':'Foto · Video',
'Direct file':'File langsung',
'Video · MP3':'Video · MP3',
'PLATFORM TERPILIH':'PLATFORM PILIHAN',
'GANTI PLATFORM':'GANTI PLATFORM',
'02 / LINK':'02 / TAUTAN',
'<h2>Tempel tautan</h2>':'<h2>Tempel tautan</h2>',
'>SIAP<':' >SIAP<',
'placeholder="https://paste-your-link-here..."':'placeholder="Tempel tautan di sini..."',
'aria-label="Hapus URL"':'aria-label="Hapus tautan"',
'>PROSES<':' >PROSES<',
'<span class="format-label">OUTPUT</span>':'<span class="format-label">HASIL</span>',
'<div class="input-foot"><span>TAUTAN PUBLIK</span><span>HTTPS</span><span>PREVIEW CEPAT</span></div>':'<div class="input-foot"><span>TAUTAN PUBLIK</span><span>HTTPS</span><span>PRATINJAU CEPAT</span></div>',
'02 / ECOSYSTEM':'02 / PLATFORM',
'<h2>Platform tersedia</h2>':'<h2>Platform yang tersedia</h2>',
'<span class="micro-note">BUILT FOR A CLEAN WORKFLOW</span>':'<span class="micro-note">PILIH, PRATINJAU, LALU UNDUH</span>',
'<span><i>↧</i>MEDIAFIRE</span>':'<span><i>↧</i>MEDIAFIRE</span><span><i>▶</i>YOUTUBE</span>',
'03 / COMMUNITY':'03 / KOMUNITAS',
'Tetap terhubung dengan Felicia.':'Tetap terhubung dengan Felicia.',
'Info terbaru, bantuan, dan kabar Felicia ada di Telegram.':'Info terbaru dan bantuan Felicia tersedia di Telegram.',
'OFFICIAL TELEGRAM':'TELEGRAM RESMI',
'04 / LOCAL':'04 / PERANGKAT',
'Riwayat download':'Riwayat unduhan',
'CLEAR ALL':'HAPUS SEMUA',
'Belum ada riwayat download.':'Belum ada riwayat unduhan.',
'PREMIUM MEDIA WORKSPACE · 2026':'MEDIA DOWNLOADER · 2026',
'<span class="drawer-label">NAVIGATION</span>':'<span class="drawer-label">MENU</span>',
'Downloader <span>01</span>':'Unduh <span>01</span>',
'Supported <span>02</span>':'Platform <span>02</span>',
'History <span>04</span>':'Riwayat <span>04</span>',
'03 / RESULT':'03 / HASIL',
'<h2 id="modalTitle">Hasil unduhan</h2>':'<h2 id="modalTitle">Hasil media</h2>',
'PILIH MEDIA YANG INGIN DISIMPAN':'PILIH MEDIA YANG INGIN DIUNDUH',
},
'public/app.js': {
"'NO MEDIA FOUND'":"'MEDIA TIDAK DITEMUKAN'",
"Provider tidak mengembalikan media yang bisa ditampilkan.":"Sumber tidak mengembalikan media yang bisa ditampilkan.",
"Preview video gagal dimuat. Tombol download tetap tersedia.":"Video tidak bisa diputar di pratinjau. Kamu tetap bisa mengunduhnya.",
"Preview gambar gagal dimuat. Coba download langsung.":"Gambar tidak bisa ditampilkan. Coba unduh langsung.",
"'Foto dengan musik TikTok'":"'Foto TikTok dengan musik'",
"'Putar audio asli tanpa menghilangkan musik'":"'Putar musik asli dari unggahan ini'",
"'SIMPAN MUSIK'":"'UNDUH MUSIK'",
"'Foto sebelumnya'":"'Foto sebelumnya'",
"'Foto berikutnya'":"'Foto berikutnya'",
"'DOWNLOAD FOTO'":"'UNDUH FOTO'",
"'Audio preview'":"'Pratinjau audio'",
"'Siap diputar'":"'Siap diputar'",
"'FILE READY'":"'FILE SIAP'",
"'File siap diunduh dari daftar di bawah.'":"'Pilih tombol unduh pada daftar di bawah.'",
"`${list.length} OPTIONS`":"`${list.length} PILIHAN`",
"'FORMAT TIDAK TERSEDIA'":"'FORMAT TIDAK TERSEDIA'",
"'Pilih output lain yang tersedia.'":"'Pilih format lain yang tersedia.'",
"'PREVIEW'":"'PRATINJAU'",
"'DOWNLOAD'":"'UNDUH'",
"'Direct media link'":"'Tautan media langsung'",
"'Pilih platform terlebih dahulu.'":"'Pilih platform terlebih dahulu.'",
"'Tempel URL terlebih dahulu.'":"'Tempel tautan terlebih dahulu.'",
"'MEMPROSES...'":"'MEMPROSES...'",
"'PROCESSING'":"'MEMPROSES'",
"'DONE'":"'SELESAI'",
"'Berhasil diproses.'":"'Media berhasil diproses.'",
"'ERROR'":"'GAGAL'",
"'Proses terlalu lama (90 detik). Coba link lain.'":"'Proses terlalu lama. Coba tautan lain.'",
"'Gagal memproses URL.'":"'Tautan gagal diproses.'",
"'Riwayat dihapus.'":"'Riwayat unduhan dihapus.'",
"'Belum ada riwayat di perangkat ini.'":"'Belum ada riwayat unduhan di perangkat ini.'",
"'OPEN ↗'":"'BUKA ↗'",
},
'README.md': {
'AIO FELICIA — CLEAN PREMIUM UI FIX':'AIO FELICIA — PEMBARUAN TAMPILAN DAN FITUR',
'Perbaikan:':'Perubahan:',
'- Menghapus elemen dekorasi yang dapat menutupi layar.':'- Menghapus elemen yang berpotensi menutupi layar.',
'- Mengunci overflow horizontal agar halaman tidak melebar/tergeser.':'- Mencegah halaman melebar atau bergeser ke samping.',
'- Modal, drawer, tombol, dan area preview dibuat lebih stabil.':'- Menata ulang modal, menu samping, tombol, dan area pratinjau.',
'- Tampilan baru terang, bersih, responsif, dan lebih cocok untuk downloader.':'- Memperbarui teks dan tampilan agar lebih sederhana, jelas, dan nyaman digunakan.',
'- Fitur TikTok foto + musik, carousel, preview, dan download dipertahankan.':'- Fitur foto TikTok, musik, carousel, pratinjau, dan unduhan tetap tersedia.',
'YouTube ditambahkan kembali: pilih YouTube lalu pilih Video (MP4) atau Audio (MP3). Modul menggunakan youtubedl.js yang dikirim pengguna.':'YouTube tersedia kembali. Pilih YouTube, lalu tentukan Video (MP4) atau Audio (MP3). Modul menggunakan youtubedl.js.',
}
}
for rel, mapping in repls.items():
    p=root/rel
    s=p.read_text(encoding='utf-8')
    for a,b in mapping.items():
        s=s.replace(a,b)
    p.write_text(s,encoding='utf-8')

# Remove wording that looks like internal AI/tool notes from source comments.
for rel in ['youtubedl.js','tiktokdl.js','server.js','aio.js','igdl.js','instagramdl.js','pinterestdl.js','mediafire.js']:
    p=root/rel
    s=p.read_text(encoding='utf-8')
    for phrase in ['// [PERBAIKAN JUDUL NULL] Menggunakan API oEmbed Resmi YouTube', '// MAIN FUNCTION', '// MusicalDown tetap dipakai khusus untuk mengambil musik TikTok jika tersedia.']:
        s=s.replace(phrase,'')
    s=s.replace('Premium Media Studio','Media Downloader')
    p.write_text(s,encoding='utf-8')
