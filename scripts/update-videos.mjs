// Refreshes videos.json from the playlist's public RSS feed.
// No API key, no dependencies. Run with: node scripts/update-videos.mjs
// Note: YouTube's feed only lists the most recent ~15 playlist entries; the
// embedded playlist player on the page always has the full list.
import { readFile, writeFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../site.json", import.meta.url), "utf8"));
const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${config.playlistId}`;
const outFile = new URL("../videos.json", import.meta.url);

const res = await fetch(feedUrl, { headers: { "User-Agent": "heroicrock-site-updater" } });
if (!res.ok) {
  console.error(`Feed request failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const xml = await res.text();

const decode = (s = "") =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};
const attr = (block, name, attribute) => {
  const m = block.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]*)"`));
  return m ? decode(m[1]) : "";
};

const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
const videos = entries
  .map((e) => ({
    id: tag(e, "yt:videoId"),
    title: tag(e, "title"),
    channel: tag((e.match(/<author>([\s\S]*?)<\/author>/) || [])[1] || "", "name"),
    published: tag(e, "published"),
    views: Number(attr(e, "media:statistics", "views")) || null,
    description: tag(e, "media:description").slice(0, 400),
  }))
  .filter((v) => v.id);

const playlistTitle = decode((xml.match(/<feed[\s\S]*?<title>([\s\S]*?)<\/title>/) || [])[1] || "");

let previous = null;
try {
  previous = JSON.parse(await readFile(outFile, "utf8"));
} catch {}

if (videos.length === 0) {
  console.error("Feed returned no videos; keeping the existing videos.json.");
  process.exit(0);
}

const data = { playlistId: config.playlistId, playlistTitle, videos };
const unchanged = previous && JSON.stringify({ ...previous, updated: undefined }) === JSON.stringify({ ...data, updated: undefined });
if (unchanged) {
  console.log(`No changes (${videos.length} videos).`);
} else {
  await writeFile(outFile, JSON.stringify({ ...data, updated: new Date().toISOString() }, null, 2) + "\n");
  console.log(`Wrote ${videos.length} videos.`);
}
