(() => {
  const PLAYLIST = "PL4VCJB1SddC5PD1Tb29bBtH06Xur5RAn9";
  const EMBED = "https://www.youtube.com/embed/";
  // Set to true to show the search box above the song grid (handy once the playlist grows).
  const SHOW_SEARCH = false;
  // YouTube's feed lists at most this many songs, so beyond it the grid is only the newest ones.
  const FEED_LIMIT = 15;

  const $ = (id) => document.getElementById(id);
  const player = $("player");
  const nowTitle = $("now-title");
  let ytUrl = `https://www.youtube.com/playlist?list=${PLAYLIST}`;
  const grid = $("grid");
  const search = $("search");
  const shuffleBtn = $("shuffle");

  let videos = [];
  let current = null;

  const playlistSrc = () => `${EMBED}videoseries?list=${PLAYLIST}&rel=0`;
  const videoSrc = (id, autoplay) => `${EMBED}${id}?list=${PLAYLIST}&rel=0${autoplay ? "&autoplay=1" : ""}`;

  function play(video, { autoplay = true, scroll = true } = {}) {
    current = video;
    player.src = videoSrc(video.id, autoplay);
    nowTitle.textContent = video.title;
    ytUrl = `https://www.youtube.com/watch?v=${video.id}&list=${PLAYLIST}`;
    history.replaceState(null, "", `#v=${video.id}`);
    document.querySelectorAll(".card").forEach((c) => c.classList.toggle("playing", c.dataset.id === video.id));
    if (scroll) document.querySelector(".stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function shuffle() {
    if (!videos.length) return;
    const pool = videos.filter((v) => v !== current);
    play(pool[Math.floor(Math.random() * pool.length)] || videos[0]);
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  }

  function render(list) {
    grid.replaceChildren();
    if (!list.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Nothing matches that. Try another band.";
      grid.append(li);
      return;
    }
    for (const v of list) {
      const li = document.createElement("li");
      const btn = document.createElement("a");
      btn.href = `https://www.youtube.com/watch?v=${v.id}&list=${PLAYLIST}`;
      btn.className = "card" + (current && current.id === v.id ? " playing" : "");
      btn.dataset.id = v.id;
      btn.innerHTML = `<div class="thumb"><img loading="lazy" alt=""></div><div class="meta"><h3></h3><p></p></div>`;
      btn.querySelector("img").src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
      btn.querySelector("h3").textContent = v.title;
      btn.querySelector("p").textContent = [v.channel, fmtDate(v.published)].filter(Boolean).join(" · ");
      btn.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // let "open in new tab" work
        e.preventDefault();
        play(v);
      });
      li.append(btn);
      grid.append(li);
    }
  }

  // Default: the whole playlist.
  player.src = playlistSrc();

  fetch("videos.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || !Array.isArray(data.videos) || !data.videos.length) return;
      videos = data.videos;
      $("grid-section").hidden = false;
      shuffleBtn.hidden = false;
      if (data.updated) $("updated").textContent = `playlist refreshed ${new Date(data.updated).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
      search.hidden = !SHOW_SEARCH;
      if (videos.length >= FEED_LIMIT) {
        $("grid-title").textContent = "Latest additions";
        $("feed-note").hidden = false;
      } else {
        $("grid-title").textContent = `Tracklist \u00b7 ${videos.length} songs`;
      }
      render(videos);

      const fromHash = location.hash.match(/v=([\w-]{6,})/);
      const linked = fromHash && videos.find((v) => v.id === fromHash[1]);
      if (linked) play(linked, { autoplay: false, scroll: false });
    })
    .catch(() => {});

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    render(q ? videos.filter((v) => `${v.title} ${v.channel}`.toLowerCase().includes(q)) : videos);
  });

  function fullscreen() {
    const el = document.querySelector(".screen");
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) req.call(el);
    else window.open(ytUrl, "_blank", "noopener"); // e.g. iPhone: use YouTube's own full screen
  }
  $("fullscreen").addEventListener("click", fullscreen);

  shuffleBtn.addEventListener("click", shuffle);
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || document.activeElement === search) return;
    if (e.key.toLowerCase() === "s") shuffle();
    if (e.key.toLowerCase() === "f") fullscreen();
  });
})();
