const express = require("express");
const path = require("path");
const fs = require("fs");

const { instagram } = require("./instagramdl");
const { igdl } = require("./igdl");
const { pinterest } = require("./pinterestdl");
const { tiktokDl } = require("./tiktokdl");
const mediafire = require("./mediafire");
const { ytmp3, ytmp4 } = require("./youtubedl");

const app = express();
const PORT = Number(process.env.PORT || 3010);
const ROOT = __dirname;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));

const PLATFORM_RULES = {
  instagram: /(^|\.)instagram\.com$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  pinterest: /(^|\.)((pinterest\.com)|(pin\.it))$/i,
  mediafire: /(^|\.)mediafire\.com$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
};

function validUrl(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) ? u : null;
  } catch { return null; }
}

function detectPlatform(value) {
  const u = validUrl(value);
  if (!u) return null;
  const host = u.hostname.toLowerCase();
  if (PLATFORM_RULES.instagram.test(host)) return "instagram";
  if (PLATFORM_RULES.tiktok.test(host)) return "tiktok";
  if (PLATFORM_RULES.pinterest.test(host)) return "pinterest";
  if (PLATFORM_RULES.mediafire.test(host)) return "mediafire";
  if (PLATFORM_RULES.youtube.test(host)) return "youtube";
  return null;
}

function safeString(v, fallback = "") {
  return v == null ? fallback : String(v);
}

function normalizeInstagram(raw) {
  const result = raw?.result || raw;
  const media = [];
  const push = (type, url, quality = "", extra = {}) => {
    if (url && /^https?:\/\//i.test(url)) media.push({ type, url, quality: quality || "", ...extra });
  };

  const m = result?.media || {};
  if (Array.isArray(m.videos)) m.videos.forEach(v => push("video", v.url, v.resolution, { mime: v.type }));
  if (m.videoUrl) push("video", m.videoUrl, m.videoResolution, { mime: "video/mp4" });

  if (Array.isArray(m.slides)) {
    m.slides.forEach(slide => {
      (slide.videos || []).forEach(v => push("video", v.url, v.resolution, { mime: v.type }));
      (slide.images || []).forEach(v => push("image", v.url, v.resolution));
    });
  }
  if (m.thumbnail && !media.length) push("image", m.thumbnail);

  return {
    platform: "instagram",
    title: safeString(result?.metadata?.caption, "Instagram media"),
    author: safeString(result?.author?.username, ""),
    thumbnail: m.thumbnail || m.thumbnails?.[0]?.url || null,
    media: dedupeMedia(media),
    provider: "instagramdl"
  };
}

function normalizeIgdl(raw) {
  const media = (raw?.media || []).map(x => ({
    type: String(x.type || "").toLowerCase().includes("video") ? "video" : "image",
    url: x.download || x.url,
    quality: x.resolution || x.quality || "",
  })).filter(x => x.url);
  return {
    platform: "instagram",
    title: raw?.author?.caption || "Instagram media",
    author: raw?.author?.username || "",
    thumbnail: media.find(x => x.type === "image")?.url || null,
    media: dedupeMedia(media),
    provider: "igdl-fallback"
  };
}

function normalizeTikTok(raw) {
  const media = (raw?.data || []).map(x => {
    const originalType = String(x?.type || x?.mime || "").toLowerCase();
    const type = originalType.includes("audio") || originalType.includes("music") ? "audio" : (originalType.includes("photo") || originalType.includes("image") ? "image" : "video");
    return { type, url: x?.url || x?.download || x?.src, quality: x?.quality || x?.type || "" };
  }).filter(x => x.url && /^https?:\/\//i.test(x.url));
  const musicUrl = raw?.music_info?.url || raw?.music_info?.play || raw?.music || "";
  if (musicUrl && /^https?:\/\//i.test(musicUrl)) media.push({ type: "audio", url: musicUrl, quality: "Original TikTok Music" });
  return {
    platform: "tiktok",
    title: safeString(raw?.title, "TikTok media"),
    author: safeString(raw?.author?.nickname, ""),
    thumbnail: raw?.cover || null,
    music: musicUrl && /^https?:\/\//i.test(musicUrl) ? { url: musicUrl, title: safeString(raw?.music_info?.title, "TikTok Music"), author: safeString(raw?.music_info?.author, "") } : null,
    media: dedupeMedia(media),
    provider: safeString(raw?.source, "tiktokdl")
  };
}

function normalizeYouTube(raw, type) {
  const url = raw?.downloadUrl || raw?.url;
  if (!url) return { platform: "youtube", title: raw?.title || "YouTube", author: "", thumbnail: raw?.thumbnail || null, media: [], provider: "youtubedl" };
  return {
    platform: "youtube",
    title: safeString(raw?.title, "YouTube media"),
    author: "",
    thumbnail: raw?.thumbnail || null,
    media: [{ type: type === "audio" ? "audio" : "video", url, quality: type === "audio" ? "MP3" : (raw?.quality ? `${raw.quality}p` : "MP4") }],
    provider: "youtubedl"
  };
}

function normalizePinterest(raw) {
  const c = raw?.content || {};
  const media = [];
  (c.videos || []).forEach(v => {
    const url = v.url || v.videoUrl || v.src;
    if (url) media.push({ type: "video", url, quality: v.width && v.height ? `${v.width}x${v.height}` : "" });
  });
  (c.images || []).forEach(v => {
    const url = v.url || v.src;
    if (url) media.push({ type: "image", url, quality: v.width && v.height ? `${v.width}x${v.height}` : "" });
  });
  return {
    platform: "pinterest",
    title: safeString(raw?.post?.title, "Pinterest media"),
    author: safeString(raw?.user?.username || raw?.user?.name, ""),
    thumbnail: media.find(x => x.type === "image")?.url || null,
    media: dedupeMedia(media),
    provider: "pinterestdl"
  };
}

function dedupeMedia(arr) {
  const seen = new Set();
  return arr.filter(x => {
    if (!x?.url || seen.has(x.url)) return false;
    seen.add(x.url);
    return true;
  });
}

async function resolvePlatform(platform, url, outputType = "video") {
  switch (platform) {
    case "instagram":
      try {
        const primary = await instagram.download(url);
        if (primary?.status) {
          const normalized = normalizeInstagram(primary);
          if (normalized.media.length) return normalized;
        }
      } catch (e) {
        console.warn("[Instagram] instagramdl failed:", e.message);
      }
      return normalizeIgdl(await igdl(url));

    case "tiktok":
      return normalizeTikTok(await tiktokDl(url));

    case "pinterest":
      return normalizePinterest(await pinterest(url));

    case "youtube": {
      const wantsAudio = outputType === "audio";
      const r = wantsAudio ? await ytmp3(url) : await ytmp4(url, "720");
      return normalizeYouTube(r, wantsAudio ? "audio" : "video");
    }

    case "mediafire": {
      const r = await mediafire(url);
      return {
        platform: "mediafire",
        title: safeString(r?.name, r?.filename || "MediaFire file"),
        author: "",
        thumbnail: null,
        media: r?.download ? [{ type: "file", url: r.download, quality: r.size || r.type || "" }] : [],
        provider: "mediafire"
      };
    }
    default:
      throw new Error("Platform belum didukung");
  }
}


async function proxyAudio(req, res, filename = "felicia-audio.mp3") {
  const target = String(req.query.url || "");
  if (!/^https?:\/\//i.test(target)) return res.status(400).send("URL audio tidak valid");

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Safari/537.36",
    "Accept": "audio/*,video/*;q=0.9,*/*;q=0.8"
  };
  if (req.headers.range) headers.Range = req.headers.range;

  const upstream = await fetch(target, { headers, redirect: "follow" });
  if (!upstream.ok || !upstream.body) return res.status(502).send("Audio tidak dapat diputar");

  const contentType = upstream.headers.get("content-type") || "audio/mpeg";
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  const acceptRanges = upstream.headers.get("accept-ranges") || "bytes";

  res.status(upstream.status === 206 ? 206 : 200);
  res.setHeader("Content-Type", /^audio\//i.test(contentType) ? contentType : "audio/mpeg");
  if (contentLength) res.setHeader("Content-Length", contentLength);
  if (contentRange) res.setHeader("Content-Range", contentRange);
  res.setHeader("Accept-Ranges", acceptRanges);
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");

  const reader = upstream.body.getReader();
  let closed = false;
  res.on("close", () => { closed = true; reader.cancel().catch(() => {}); });
  while (!closed) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) res.write(Buffer.from(value));
  }
  if (!res.writableEnded) res.end();
}

app.get("/api/stream-audio", async (req, res) => {
  try {
    await proxyAudio(req, res, "felicia-audio.mp3");
  } catch (e) {
    console.error("[audio stream]", e.message);
    if (!res.headersSent) res.status(502).send("Gagal memuat audio YouTube/TikTok");
  }
});

app.get("/api/download-audio", async (req, res) => {
  try {
    const target = String(req.query.url || "");
    if (!/^https?:\/\//i.test(target)) return res.status(400).send("URL audio tidak valid");
    const upstream = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "audio/*,*/*;q=0.8" }, redirect: "follow" });
    if (!upstream.ok || !upstream.body) return res.status(502).send("Audio tidak dapat diunduh");
    const type = upstream.headers.get("content-type") || "audio/mpeg";
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", 'attachment; filename="tiktok-music.mp3"');
    const reader = upstream.body.getReader();
    res.on("close", () => reader.cancel().catch(() => {}));
    while (true) { const { value, done } = await reader.read(); if (done) break; res.write(Buffer.from(value)); }
    res.end();
  } catch (e) { res.status(502).send("Gagal mengambil audio TikTok"); }
});

app.get("/api/download", async (req, res) => {
  try {
    const target = String(req.query.url || "");
    if (!/^https?:\/\//i.test(target)) return res.status(400).send("URL tidak valid");
    const upstream = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
    if (!upstream.ok || !upstream.body) return res.status(502).send("Media tidak dapat diunduh");
    const type = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", "attachment; filename=\"felicia-download\"");
    const reader = upstream.body.getReader();
    res.on("close", () => reader.cancel().catch(() => {}));
    while (true) { const { value, done } = await reader.read(); if (done) break; res.write(Buffer.from(value)); }
    res.end();
  } catch (e) { res.status(502).send("Gagal mengambil media"); }
});

app.post("/api/resolve", async (req, res) => {
  const url = safeString(req.body?.url).trim();
  const selected = safeString(req.body?.platform).toLowerCase();

  const u = validUrl(url);
  if (!u) return res.status(400).json({ ok: false, message: "URL tidak valid." });

  const detected = detectPlatform(url);
  if (!detected) return res.status(400).json({ ok: false, message: "Platform tidak dikenali." });
  if (selected && selected !== detected) {
    return res.status(400).json({ ok: false, message: `URL ini terdeteksi sebagai ${detected}, bukan ${selected}.` });
  }

  try {
    const result = await resolvePlatform(detected, url, safeString(req.body?.type).toLowerCase());
    if (!result.media?.length) throw new Error("Media tidak ditemukan dari provider.");
    res.json({ ok: true, result });
  } catch (error) {
    console.error(`[${detected}]`, error);
    res.status(502).json({ ok: false, message: error?.message || "Provider gagal memproses URL." });
  }
});

app.get("/api/health", (_, res) => res.json({ ok: true, name: "AIO FELICIA", version: "11.0.0" }));
app.use((_, res) => res.sendFile(path.join(ROOT, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`\n╭────────────────────────────────────────────╮`);
  console.log(`│  AIO FELICIA v12 • Media Downloader       │`);
  console.log(`│  http://localhost:${PORT}                     │`);
  console.log(`╰────────────────────────────────────────────╯\n`);
});
