// Bakes the song list and SEO metadata from videos.json into index.html, and writes sitemap.xml.
// Search engines (and link previews) then see real content without running JavaScript.
// Run with: node scripts/build-page.mjs
import { readFile, writeFile } from "node:fs/promises";

const SITE = "https://heroicrock.com/";
const file = (p) => new URL(`../${p}`, import.meta.url);
const data = JSON.parse(await readFile(file("videos.json"), "utf8"));
const videos = data.videos || [];
let html = await readFile(file("index.html"), "utf8");

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const month = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
};
// "Queen - Brighton Rock (Official Video)" -> artist "Queen"
const artistOf = (v) => {
  const m = v.title.match(/^(.+?)(?:\s+[-\u2013\u2014]|:)\s+/);
  const a = m ? m[1].trim() : "";
  return a.length <= 30 && !/[|]|\bhits\b|\bmix\b/i.test(a) ? a : ""; // skip compilations
};
const replaceBlock = (name, content) => {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(html)) throw new Error(`Marker ${name} missing from index.html`);
  html = html.replace(re, `$1\n${content}\n$2`);
};
const setMeta = (attr, key, value) => {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  html = html.replace(re, `$1${esc(value)}$2`);
};

// Bands for the description: unique artists in playlist order.
const artists = [...new Set(videos.map(artistOf).filter(Boolean))];
const named = artists.slice(0, 6);
const more = artists.length > named.length;
const list = more ? `${named.join(", ")} and more` : named.length > 1 ? `${named.slice(0, -1).join(", ")} and ${named.at(-1)}` : named[0] || "";
const summary = `A hand-picked playlist of ${videos.length || ""} classic and heroic rock songs`.replace("  ", " ") + (list ? `, from ${list}` : "") + ".";
const description = `${summary} Watch the whole playlist here.`;

setMeta("name", "description", description);
setMeta("property", "og:description", description);
setMeta("name", "twitter:description", description);

// Song cards (app.js re-renders these, but they are real links in the HTML too).
replaceBlock(
  "TRACKLIST",
  videos
    .map(
      (v) => `        <li><a class="card" data-id="${esc(v.id)}" href="https://www.youtube.com/watch?v=${esc(v.id)}&amp;list=${esc(data.playlistId)}"><div class="thumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" width="480" height="360"></div><div class="meta"><h3>${esc(v.title)}</h3><p>${esc([v.channel, month(v.published)].filter(Boolean).join(" \u00b7 "))}</p></div></a></li>`
    )
    .join("\n")
);

replaceBlock("ABOUT", `      <p class="about">${esc(summary)}</p>`);

// Structured data: the site plus the playlist and its tracks.
const jsonld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE}#website`, url: SITE, name: "Heroic Rock", description },
    {
      "@type": "MusicPlaylist",
      "@id": `${SITE}#playlist`,
      name: data.playlistTitle || "The Heroic Rock Playlist",
      url: SITE,
      sameAs: `https://www.youtube.com/playlist?list=${data.playlistId}`,
      numTracks: videos.length,
      track: videos.map((v) => {
        const artist = artistOf(v);
        return {
          "@type": "MusicRecording",
          name: (artist ? v.title.slice(artist.length).replace(/^\s*[-\u2013\u2014:]\s*/, "") : v.title).replace(/\s*[(\[](official|lyric)[^)\]]*[)\]]/gi, "").trim(),
          url: `https://www.youtube.com/watch?v=${v.id}`,
          ...(artist ? { byArtist: { "@type": "MusicGroup", name: artist } } : {}),
        };
      }),
    },
  ],
};
replaceBlock("JSONLD", `  <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2).replace(/</g, "\\u003c")}\n  </script>`);

await writeFile(file("index.html"), html);

const lastmod = (data.updated || new Date().toISOString()).slice(0, 10);
await writeFile(
  file("sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>\n`
);
console.log(`Built page with ${videos.length} songs.`);
