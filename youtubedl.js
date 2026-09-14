const axios = require("axios")
const https = require("https")
const fetch = require("node-fetch")
const WebSocket = require("ws")

const BASE_URL = "https://hub.ytconvert.org/api/download"
const headers = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Origin": "https://media.ytmp3.gg",
  "Referer": "https://media.ytmp3.gg/",
  "User-Agent": "Mozilla/5.0"
}
const delay = ms => new Promise(res => setTimeout(res, ms))

function extractVideoId(url) {
  try {
    const u = new URL(url)
    if (u.searchParams.get("v")) return u.searchParams.get("v")
    if (u.hostname.includes("youtu.be")) return u.pathname.split("/")[1]
    if (u.pathname.includes("/shorts/")) return u.pathname.split("/shorts/")[1]
    return null
  } catch {
    return null
  }
}

function buildThumbnail(url, fallback = null) {
  const id = extractVideoId(url)
  if (!id) return fallback
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}


async function getYoutubeTitle(url) {
  try {
    const { data } = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`);
    return data.title || "YouTube Video";
  } catch (e) {
    return "YouTube Video (Title tidak ditemukan)";
  }
}

async function requestConvert(payload) {
  const res = await axios.post(BASE_URL, payload, { headers })
  return res.data
}

async function waitUntilReady(statusUrl) {
  if (!statusUrl) throw new Error("Server converter tidak mengembalikan status URL");
  for (let attempt = 0; attempt < 40; attempt++) {
    const { data } = await axios.get(statusUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    if (data.status === "completed" || data.downloadUrl) return data
    if (data.status === "error") throw new Error("Convert error")

    await delay(3000)
  }
  throw new Error("Konversi YouTube timeout");
}

async function primaryMP3(url) {
  const titleFallback = await getYoutubeTitle(url)
  const convert = await requestConvert({
    url,
    os: "windows",
    output: { type: "audio", format: "mp3" }
  })
  const status = await waitUntilReady(convert.statusUrl || convert.status_url || convert.progressUrl || convert.progress_url || convert.url)

  return {
    title: convert.title || titleFallback,
    downloadUrl: status.downloadUrl || status.download_url || status.url,
    thumbnail: buildThumbnail(url)
  }
}

async function primaryMP4(url, quality = "720") {
  const titleFallback = await getYoutubeTitle(url)
  const convert = await requestConvert({
    url,
    os: "windows",
    output: { type: "video", format: "mp4", quality: quality + "p" }
  })
  const status = await waitUntilReady(convert.statusUrl || convert.status_url || convert.progressUrl || convert.progress_url || convert.url)

  return {
    title: convert.title || titleFallback,
    downloadUrl: status.downloadUrl || status.download_url || status.url,
    thumbnail: buildThumbnail(url),
    quality
  }
}

async function secondaryDownload(url, type = "mp3", format = "128") {
  const titleFallback = await getYoutubeTitle(url)
  const params =
    type === "mp3"
      ? { format: "mp3", audio_quality: format, url }
      : { format, url }

  const { data } = await axios.get(
    "https://p.lbserver.xyz/ajax/download.php",
    { params }
  )

  if (!data?.progress_url) throw new Error("No progress_url")

  return new Promise(resolve => {
    const poll = async () => {
      try {
        const { data: res } = await axios.get(data.progress_url)
        if (res.progress >= 1000) {
          resolve({
            title: data.title || data.info?.title || titleFallback,
            downloadUrl: res.download_url,
            thumbnail: data.info?.image || buildThumbnail(url)
          })
        } else setTimeout(poll, 500)
      } catch {
        setTimeout(poll, 500)
      }
    }
    poll()
  })
}

const SaveNow = {
  api: "https://p.savenow.to",
  key: "dfcb6d76f2f6a9894gjkege8a4ab232222",
  agent: new https.Agent({ rejectUnauthorized: false })
}

async function tertiaryDownload(url, type = "mp3") {
  const titleFallback = await getYoutubeTitle(url)
  const format = type === "mp3" ? "mp3" : "720"

  const { data } = await axios.get(`${SaveNow.api}/ajax/download.php`, {
    params: { format, url, api: SaveNow.key },
    httpsAgent: SaveNow.agent
  })

  for (let i = 0; i < 40; i++) {
    try {
      const { data: res } = await axios.get(data.progress_url, {
        httpsAgent: SaveNow.agent
      })

      if (res.success && res.download_url) {
        return {
          title: data.info?.title || titleFallback,
          downloadUrl: res.download_url,
          thumbnail: data.info?.image || buildThumbnail(url)
        }
      }
    } catch {}

    await delay(2500)
  }

  throw new Error("SaveNow gagal")
}

const SS_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'Content-Type': 'application/x-www-form-urlencoded',
  'origin': 'https://ssyoutube.online',
  'referer': 'https://ssyoutube.online/en12/'
}

function wsWait(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)

    ws.onmessage = e => {
      try {
        const d = JSON.parse(e.data)
        if (d.status === "done") {
          ws.close()
          resolve(d.output.url)
        }
      } catch {}
    }

    ws.onerror = () => reject("WS error")
  })
}

async function quaternaryDownload(url, type = "mp3", quality = "720") {
  const titleFallback = await getYoutubeTitle(url)
  const resolusi = type === "mp3" ? "audio" : quality

  const r = await fetch("https://ssyoutube.online/yt-video-detail/", {
    method: "POST",
    headers: SS_HEADERS,
    body: new URLSearchParams({ videoURL: url })
  })

  const html = await r.text()

  const title = (html.match(/videoTitle[^>]*>(.*?)</) || [])[1] || titleFallback
  const thumbnail = (html.match(/thumbnail" src="([^"]+)/) || [])[1] || buildThumbnail(url)

  if (resolusi === "audio") {
    const req = await fetch("https://ssyoutube.online/wp-admin/admin-ajax.php", {
      method: "POST",
      headers: SS_HEADERS,
      body: new URLSearchParams({
        action: "get_mp3_conversion_url",
        videoUrl: url
      })
    })

    const json = await req.json()

    return { title, thumbnail, downloadUrl: json.data.url }
  }

  throw new Error("SSYoutube MP4 skip (fallback only mp3 safe)")
}

/* =========================
   FUNGSI UTAMA
========================= */

async function ytmp3(url) {
  try {
    return await primaryMP3(url)
  } catch {
    try {
      return await secondaryDownload(url, "mp3")
    } catch {
      try {
        return await tertiaryDownload(url, "mp3")
      } catch {
        return await quaternaryDownload(url, "mp3")
      }
    }
  }
}

async function ytmp4(url, quality = "720") {
  try {
    return await primaryMP4(url, quality)
  } catch {
    try {
      return await secondaryDownload(url, "mp4", quality)
    } catch {
      try {
        return await tertiaryDownload(url, "mp4")
      } catch {
        throw new Error("Semua server video gagal")
      }
    }
  }
}

module.exports = { ytmp3, ytmp4 }