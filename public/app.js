(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const state = { platform: null, type: 'video', result: null, visibleMedia: [], previewIndex: 0, busy: false, controller: null };
  const icons = { tiktok: '♪', instagram: '◎', pinterest: 'P', mediafire: '↧', youtube: '▶' };
  const labels = { tiktok: 'TikTok', instagram: 'Instagram', pinterest: 'Pinterest', mediafire: 'MediaFire', youtube: 'YouTube' };
  const formats = { tiktok: ['video', 'audio', 'image'], instagram: ['video', 'image'], pinterest: ['video', 'image'], mediafire: ['file'], youtube: ['video', 'audio'] };
  const platformGrid = $('#platformGrid'), selectedWrap = $('#selectedWrap'), inputCard = $('#inputCard'), urlInput = $('#urlInput'), processBtn = $('#processBtn'), statusText = $('#statusText'), modalBackdrop = $('#modalBackdrop'), mediaList = $('#mediaList'), preview = $('#preview'), previewInfo = $('#previewInfo'), drawer = $('#drawer'), drawerBackdrop = $('#drawerBackdrop');

  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.__feliciaToast); window.__feliciaToast = setTimeout(() => el.classList.remove('show'), 3200); }
  function setStatus(message, cls = 'idle') { statusText.textContent = ''; const dot = document.createElement('i'); statusText.append(dot, document.createTextNode(message)); statusText.className = `status ${cls}`; }
  function escapeHtml(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c])); }
  function sizeText(v) { if (!v) return ''; if (typeof v === 'number') { let n = v, i = 0; while (n > 1024 && i < 3) { n /= 1024; i++; } return `${n.toFixed(n >= 10 ? 0 : 1)} ${['B','KB','MB','GB'][i]}`; } return String(v); }
  function allMedia(result) { return Array.isArray(result?.media) ? result.media.filter(x => x && x.url) : []; }
  function filteredMedia(result) { const a = allMedia(result); if (state.type === 'audio') return a.filter(x => x.type === 'audio'); if (state.type === 'image') return a.filter(x => x.type === 'image'); if (state.type === 'file') return a.filter(x => x.type === 'file'); return a.filter(x => x.type === 'video'); }
  function downloadUrl(url) { return '/api/download?url=' + encodeURIComponent(url); }
  function audioDownloadUrl(url) { return '/api/download-audio?url=' + encodeURIComponent(url); }
  function audioStreamUrl(url) { return '/api/stream-audio?url=' + encodeURIComponent(url); }
  function bestMedia(result) { const a = state.visibleMedia.length ? state.visibleMedia : allMedia(result); return a.find(x => x.type === 'video') || a.find(x => x.type === 'image') || a.find(x => x.type === 'audio') || a[0]; }

  function updateFormats() {
    const allowed = formats[state.platform] || ['video', 'audio', 'image'];
    $$('.format').forEach(btn => { btn.hidden = !allowed.includes(btn.dataset.type); btn.classList.toggle('active', allowed.includes(state.type) && btn.dataset.type === state.type); });
    if (!allowed.includes(state.type)) state.type = allowed[0] || 'video';
    $$('.format').forEach(btn => btn.classList.toggle('active', !btn.hidden && btn.dataset.type === state.type));
  }
  function selectPlatform(platform) { state.platform = platform; state.type = platform === 'mediafire' ? 'file' : 'video'; updateFormats(); platformGrid.classList.add('hidden'); selectedWrap.classList.remove('hidden'); inputCard.classList.remove('hidden'); $('#selectedIcon').textContent = icons[platform]; $('#selectedName').textContent = labels[platform]; setStatus('READY'); urlInput.focus(); $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function changePlatform() { state.platform = null; state.type = 'video'; urlInput.value = ''; inputCard.classList.add('hidden'); selectedWrap.classList.add('hidden'); platformGrid.classList.remove('hidden'); updateFormats(); setStatus('READY'); }

  function openDrawer() { drawer.classList.add('open'); drawerBackdrop.classList.add('open'); document.body.classList.add('drawer-open'); }
  function closeDrawer() { drawer.classList.remove('open'); drawerBackdrop.classList.remove('open'); document.body.classList.remove('drawer-open'); }
  $('#menuBtn')?.addEventListener('click', openDrawer); $('#closeDrawer')?.addEventListener('click', closeDrawer); drawerBackdrop?.addEventListener('click', closeDrawer); $$('.drawer a').forEach(a => a.addEventListener('click', closeDrawer));
  $$('.platform-card').forEach(btn => btn.addEventListener('click', () => selectPlatform(btn.dataset.platform)));
  $('#changePlatform')?.addEventListener('click', changePlatform);
  $('#clearBtn')?.addEventListener('click', () => { urlInput.value = ''; urlInput.focus(); });
  $$('.format').forEach(btn => btn.addEventListener('click', () => { state.type = btn.dataset.type; updateFormats(); }));

  function openModal(result) { $('#modalTitle').textContent = result.title || `${labels[state.platform]} result`; $('#modalMeta').textContent = [result.author ? `@${result.author}` : '', result.provider || labels[state.platform]].filter(Boolean).join(' · '); modalBackdrop.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  function closeModal() { modalBackdrop.classList.add('hidden'); document.body.style.overflow = ''; }
  $('#closeModal')?.addEventListener('click', closeModal); modalBackdrop?.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });

  function renderPreview(result, chosen = null) {
    preview.innerHTML = ''; previewInfo.innerHTML = '';
    const images = state.visibleMedia.filter(x => x.type === 'image');
    let media = chosen || bestMedia(result);
    if (!media) { preview.innerHTML = '<div class="preview-empty"><span>◌</span><b>MEDIA TIDAK DITEMUKAN</b><small>Sumber tidak mengembalikan media yang bisa ditampilkan.</small></div>'; return; }
    if (media.type === 'image' && images.length) { const idx = images.findIndex(x => x.url === media.url); if (idx >= 0) state.previewIndex = idx; state.previewIndex = Math.max(0, Math.min(state.previewIndex, images.length - 1)); media = images[state.previewIndex]; }
    const shell = document.createElement('div'); shell.className = 'preview-stage';
    const tag = document.createElement('div'); tag.className = 'preview-tag'; tag.innerHTML = `<i></i>${escapeHtml((media.type || 'media').toUpperCase())}`; shell.appendChild(tag);
    if (media.type === 'video') { const v = document.createElement('video'); v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.poster = result.thumbnail || ''; v.src = media.url; v.onerror = () => toast('Video tidak bisa diputar di pratinjau. Kamu tetap bisa mengunduhnya.'); shell.appendChild(v); }
    else if (media.type === 'image') {
      const img = document.createElement('img'); img.src = media.url; img.alt = result.title || 'Preview image'; img.loading = 'eager'; img.onerror = () => toast('Gambar tidak bisa ditampilkan. Coba unduh langsung.'); shell.appendChild(img);
      const musicUrl = media.musicUrl || result.music?.url || result.musicUrl || (state.platform === 'tiktok' ? allMedia(result).find(x => x.type === 'audio')?.url : '');
      if (state.platform === 'tiktok' && musicUrl) {
        const musicBox = document.createElement('div'); musicBox.className = 'photo-music-player';
        musicBox.innerHTML = '<span class="music-note">♫</span><div><b>Foto dengan musik TikTok</b><small>Putar audio asli tanpa menghilangkan musik</small></div>';
        const audio = document.createElement('audio'); audio.controls = true; audio.preload = 'metadata'; audio.src = audioStreamUrl(musicUrl); audio.setAttribute('crossorigin','anonymous'); musicBox.appendChild(audio); const musicDl = document.createElement('a'); musicDl.className = 'music-download'; musicDl.textContent = 'UNDUH MUSIK'; musicDl.href = audioDownloadUrl(musicUrl); musicDl.setAttribute('download',''); musicBox.appendChild(musicDl); shell.appendChild(musicBox);
      }
      if (images.length > 1) {
        const nav = document.createElement('div'); nav.className = 'preview-carousel-nav';
        const prev = document.createElement('button'); prev.type = 'button'; prev.className = 'preview-nav-btn'; prev.textContent = '‹'; prev.disabled = state.previewIndex === 0; prev.setAttribute('aria-label', 'Foto sebelumnya');
        const count = document.createElement('span'); count.className = 'preview-counter'; count.textContent = `${state.previewIndex + 1} / ${images.length}`;
        const next = document.createElement('button'); next.type = 'button'; next.className = 'preview-nav-btn'; next.textContent = '›'; next.disabled = state.previewIndex === images.length - 1; next.setAttribute('aria-label', 'Foto berikutnya');
        const dl = document.createElement('a'); dl.className = 'preview-current-download'; dl.textContent = 'UNDUH FOTO'; dl.href = downloadUrl(media.url); dl.target = '_blank'; dl.rel = 'noopener'; dl.download = '';
        prev.onclick = () => { state.previewIndex--; renderPreview(result, images[state.previewIndex]); };
        next.onclick = () => { state.previewIndex++; renderPreview(result, images[state.previewIndex]); };
        nav.append(prev, count, next, dl); shell.appendChild(nav);
      }
    } else if (media.type === 'audio') { const box = document.createElement('div'); box.className = 'preview-audio'; box.innerHTML = '<div class="audio-art"><span>♫</span></div><div class="audio-copy"><b>Audio preview</b><small>Siap diputar</small></div>'; const audio = document.createElement('audio'); audio.controls = true; audio.src = audioStreamUrl(media.url); box.appendChild(audio); shell.appendChild(box); }
    else shell.innerHTML = '<div class="preview-empty"><span>↧</span><b>FILE SIAP</b><small>Pilih tombol unduh pada daftar di bawah.</small></div>';
    preview.appendChild(shell);
    previewInfo.innerHTML = `<div><strong>${escapeHtml(media.quality || media.resolution || media.ext || media.type || 'MEDIA')}</strong><span>${escapeHtml(sizeText(media.filesize) || 'READY')}</span></div><em>${escapeHtml(result.provider || 'PROVIDER').toUpperCase()}</em>`;
  }

  function renderMediaList(result) {
    mediaList.innerHTML = ''; const list = filteredMedia(result); $('#resultCount').textContent = `${list.length} PILIHAN`;
    if (!list.length) { mediaList.innerHTML = '<div class="preview-empty"><b>FORMAT TIDAK TERSEDIA</b><small>Pilih output lain yang tersedia.</small></div>'; return; }
    list.forEach((m, index) => {
      const row = document.createElement('div'); row.className = 'media-row';
      const badge = document.createElement('div'); badge.className = 'media-badge'; badge.innerHTML = `<span>${escapeHtml((m.type || 'MEDIA').toUpperCase())}</span>`;
      const info = document.createElement('div'); info.className = 'media-info'; info.innerHTML = `<b>${escapeHtml(m.quality || m.resolution || `${(m.type || 'media').toUpperCase()} ${index + 1}`)}</b><small>${escapeHtml(sizeText(m.filesize) || 'Tautan media langsung')}</small>`;
      const actions = document.createElement('div'); actions.className = 'media-actions';
      const previewBtn = document.createElement('button'); previewBtn.type = 'button'; previewBtn.className = 'download-btn secondary'; previewBtn.textContent = 'PRATINJAU'; const download = document.createElement('a'); download.className = 'download-btn hidden-download'; download.textContent = 'UNDUH'; download.href = downloadUrl(m.url); download.target = '_blank'; download.rel = 'noopener'; download.download = '';
      previewBtn.onclick = () => { state.previewIndex = 0; renderPreview(result, m); download.classList.add('revealed'); };
      actions.append(previewBtn, download); row.append(badge, info, actions); mediaList.appendChild(row);
    });
  }

  function saveHistory(result) { try { const old = JSON.parse(localStorage.getItem('felicia_history') || '[]'); old.unshift({ title: result.title || labels[state.platform], platform: state.platform, url: urlInput.value.trim(), thumbnail: result.thumbnail || '', time: new Date().toLocaleString('id-ID') }); localStorage.setItem('felicia_history', JSON.stringify(old.slice(0, 8))); renderHistory(); } catch {} }
  function renderHistory() { const box = $('#historyList'); let data = []; try { data = JSON.parse(localStorage.getItem('felicia_history') || '[]'); } catch {} if (!data.length) { box.innerHTML = '<div class="empty-history"><span>◌</span><p>Belum ada riwayat di perangkat ini.</p></div>'; return; } box.innerHTML = ''; data.forEach(item => { const row = document.createElement('div'); row.className = 'history-item'; row.innerHTML = `<div class="history-thumb">${item.thumbnail ? `<img src="${escapeHtml(item.thumbnail)}" alt="">` : '↧'}</div><div><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.platform || '')} · ${escapeHtml(item.time || '')}</small></div><a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener">OPEN ↗</a>`; box.appendChild(row); }); }
  $('#clearHistory')?.addEventListener('click', () => { localStorage.removeItem('felicia_history'); renderHistory(); toast('Riwayat unduhan dihapus.'); });

  async function processUrl() {
    if (state.busy) return;
    const url = urlInput.value.trim();
    if (!state.platform) return toast('Pilih platform terlebih dahulu.');
    if (!url) return toast('Tempel tautan terlebih dahulu.');
    state.busy = true; processBtn.disabled = true; processBtn.querySelector('span').textContent = 'MEMPROSES...'; setStatus('MEMPROSES', 'busy');
    state.controller = new AbortController(); const timeout = setTimeout(() => state.controller.abort(), 90000);
    try {
      const response = await fetch('/api/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, platform: state.platform, type: state.type }), signal: state.controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.message || `Server error ${response.status}`);
      state.result = payload.result; state.visibleMedia = filteredMedia(payload.result); state.previewIndex = 0;
      if (!state.visibleMedia.length) throw new Error('Format yang dipilih tidak tersedia.');
      openModal(payload.result); renderPreview(payload.result); renderMediaList(payload.result); saveHistory(payload.result); setStatus('SELESAI', 'done'); toast('Media berhasil diproses.');
    } catch (e) { const msg = e.name === 'AbortError' ? 'Proses terlalu lama. Coba tautan lain.' : e.message || 'Tautan gagal diproses.'; setStatus('GAGAL', 'error'); toast(msg); }
    finally { clearTimeout(timeout); state.busy = false; state.controller = null; processBtn.disabled = false; processBtn.querySelector('span').textContent = 'PROSES'; }
  }
  processBtn?.addEventListener('click', processUrl); urlInput?.addEventListener('keydown', e => { if (e.key === 'Enter') processUrl(); });
  renderHistory();
})();
