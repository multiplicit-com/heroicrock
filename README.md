# heroicrock.com

A static, zero-maintenance site for the Heroic Rock YouTube playlist, hosted on GitHub Pages.

- **Player:** embeds the whole playlist (`youtube-nocookie.com`), so every song is always there.
- **Video grid:** `videos.json` is refreshed daily by a GitHub Action from the playlist's public RSS feed
  (no API key). The feed only lists the ~15 most recent playlist entries, so the grid shows "latest additions".
- **Extras:** search, shuffle (press `S`), shareable links (`heroicrock.com/#v=VIDEO_ID`).

## Changing the playlist

Edit `playlistId` in `site.json` and `PLAYLIST` in `app.js`.

## Running the refresh by hand

Actions tab → "Refresh playlist and deploy" → Run workflow. Locally: `node scripts/update-videos.mjs` (Node 18+).

## DNS

Apex `heroicrock.com` A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
AAAA: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153
`www` CNAME → `multiplicit-com.github.io`
