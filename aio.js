
const fetch = require('node-fetch');
const { fileTypeFromBuffer } = require('file-type');

module.exports = async function aioHandler(m, { alya, text, prefix, command }) {
    try {
        if (!text) {
            return m.reply(`*Contoh:*\n${prefix + command} https://link-target.com`);
        }

        // React loading (AMAN)
        if (alya?.sendMessage) {
            await alya.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            }).catch(() => {});
        }

        const res = await fetch(
            'https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0',
                    'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
                    'x-rapidapi-key': '1dda0d29d3mshc5f2aacec619c44p16f219jsn99a62a516f98'
                },
                body: JSON.stringify({ url: text })
            }
        );

        const json = await res.json();

        const medias =
            json?.medias ||
            json?.data?.medias ||
            json?.result?.links ||
            [];

        if (!Array.isArray(medias) || medias.length === 0) {
            throw 'Media tidak ditemukan / link tidak didukung';
        }

        const source = json.source || json.platform || '-';
        const title = json.title || '-';

        const videos = medias.filter(v =>
            (v.type || v.mime || '').toLowerCase().includes('video')
        );
        const audios = medias.filter(v =>
            (v.type || v.mime || '').toLowerCase().includes('audio')
        );
        const images = medias.filter(v =>
            (v.type || v.mime || '').toLowerCase().includes('image')
        );

        // ===== PRIORITAS VIDEO =====
        if (videos.length) {
            const best = videos.sort((a, b) =>
                (b.resolution || '').localeCompare(a.resolution || '')
            )[0];

            const r = await fetch(best.url || best.link);
            const buffer = Buffer.from(await r.arrayBuffer());
            const ft = await fileTypeFromBuffer(buffer);

            const caption =
                `🎯 *ALL IN ONE DOWNLOADER*\n\n` +
                `🔗 *Source:* ${source}\n` +
                `📛 *Title:* ${title}\n` +
                `🎥 *Type:* Video\n` +
                `📐 *Quality:* ${best.quality || best.resolution || '-'}`;

            await alya.sendMessage(
                m.chat,
                {
                    video: buffer,
                    mimetype: ft?.mime || 'video/mp4',
                    caption
                },
                { quoted: m }
            );
            return;
        }

        // ===== AUDIO =====
        if (audios.length) {
            const best = audios[0];

            const r = await fetch(best.url || best.link);
            const buffer = Buffer.from(await r.arrayBuffer());
            const ft = await fileTypeFromBuffer(buffer);

            await alya.sendMessage(
                m.chat,
                {
                    audio: buffer,
                    mimetype: ft?.mime || 'audio/mpeg'
                },
                { quoted: m }
            );
            return;
        }

        // ===== IMAGE =====
        if (images.length) {
            const best = images[0];

            const caption =
                `🎯 *ALL IN ONE DOWNLOADER*\n\n` +
                `🔗 *Source:* ${source}\n` +
                `📛 *Title:* ${title}\n` +
                `🖼️ *Type:* Image`;

            await alya.sendMessage(
                m.chat,
                {
                    image: { url: best.url || best.link },
                    caption
                },
                { quoted: m }
            );
        }
    } catch (err) {
        await m.reply(
            `🍂 *Downloader Error*\n\n` +
            `Reason: ${err?.message || err}`
        );
    } finally {
        // Clear react (AMAN)
        if (alya?.sendMessage) {
            await alya.sendMessage(m.chat, {
                react: { text: '', key: m.key }
            }).catch(() => {});
        }
    }
};
