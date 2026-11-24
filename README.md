# heroicrock.com

A static, zero-maintenance site for the Heroic Rock YouTube playlist, hosted on GitHub Pages.

- **Player:** embeds the whole playlist (`youtube-nocookie.com`), so every song is always there.
- **Video grid:** `videos.json` is refreshed weekly by a GitHub Action from the playlist's public RSS feed
  (no API key). The feed only lists the ~15 most recent playlist entries, so once the playlist passes 15 songs the grid becomes "Latest additions" and a note points to the full list in the player.
- **Extras:** shuffle (press `S`), full screen (press `F`), shareable links (`heroicrock.com/#v=VIDEO_ID`).
  A search box is built in but switched off; set `SHOW_SEARCH = true` at the top of `app.js` to turn it on.

## SEO

`scripts/build-page.mjs` bakes the song list, meta description, and JSON-LD (MusicPlaylist) into `index.html`
and writes `sitemap.xml`; the workflow runs it on every deploy (weekly, plus on every push). Social preview image: `assets/og.png`.

## Changing the playlist

Edit `playlistId` in `site.json` and `PLAYLIST` in `app.js`.

## Running the refresh by hand

Actions tab → "Refresh playlist and deploy" → Run workflow. Locally: `node scripts/update-videos.mjs` (Node 18+).

## DNS

Apex `heroicrock.com` A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
AAAA: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153
`www` CNAME → `multiplicit-com.github.io`
