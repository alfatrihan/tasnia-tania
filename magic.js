/* ===== A Little Moment of Magic =====
   Four surprise buttons. Each one opens a floating card for exactly 10 seconds.

   CONFIGURATION: fill in these values later. Nothing else needs to change.
   - image:   the photo path. Put the photo in the media/magic folder and use its path here.
   - message: the text, in English and in Bangla.
   - music:   one of these three:
       { type: 'none' }                                    no music
       { type: 'youtube', videoId: 'XXXXXXXXXXX' }         a YouTube video ID (the 11 characters after "v=" in the link)
       { type: 'audio', src: 'media/magic/wish.mp3' }      an audio file you host yourself
   - caption: a short caption line under the message (optional text, English and Bangla).
   - fx:      the animation. Options: 'fade', 'hearts', 'sparkle', 'zoom', 'glow'.
*/
const MAGIC_SURPRISES = [
  {
    id: 'wish', fx: 'fade',
    title: { en: 'Little Escape', bn: 'ছোট্ট এক প্রশান্তির ঠিকানা' },
    image: 'media/magic/magic1.jpg',
    message: { en: 'Standing by the waves, letting my thoughts drift away.', bn: 'ঢেউয়ের পাশে দাঁড়িয়ে, মনটা একটু দূরে হারিয়ে যায়।' },
    caption: { en: '', bn: '' },
    music: { type: 'audio', src: 'media/magic/magic1.mp3' },
    icon: '<path d="M3 10c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2"/><path d="M3 15c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2"/>',
  },
  {
    id: 'note', fx: 'hearts',
    title: { en: 'Quiet Grace', bn: 'নীরব সৌন্দর্য' },
    image: 'media/magic/magic2.jpg',
    message: { en: 'Even familiar paths can hold new stories.', bn: 'চেনা পথেও কখনো নতুন গল্প খুঁজে পাওয়া যায়।' },
    caption: { en: '', bn: '' },
    music: { type: 'audio', src: 'media/magic/magic2.mp3' },
    icon: '<path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  },
  {
    id: 'you', fx: 'sparkle',
    title: { en: 'Blush Hour', bn: 'গোলাপি আভায় কোমল মুহূর্ত' },
    image: 'media/magic/magic3.jpg',
    message: { en: 'Under the open sky, finding a little peace of my own.', bn: 'আকাশের নিচে, নিজের মতো করে একটু শান্তি।' },
    caption: { en: '', bn: '' },
    music: { type: 'audio', src: 'media/magic/magic3.mp3' },
    icon: '<circle cx="12" cy="7.8" r="3"/><circle cx="12" cy="16.2" r="3"/><circle cx="7.8" cy="12" r="3"/><circle cx="16.2" cy="12" r="3"/><circle cx="12" cy="12" r="1.6"/>',
  },
  {
    id: 'memory', fx: 'zoom',
    title: { en: 'Golden Bond', bn: 'মায়ায় বাঁধা স্মৃতি' },
    image: 'media/magic/magic4.jpg',
    message: { en: 'Some moments are meant to stay as smiles.', bn: 'কিছু মুহূর্ত শুধু হাসির জন্যই থেকে যায়।' },
    caption: { en: '', bn: '' },
    music: { type: 'audio', src: 'media/magic/magic4.mp3' },
    icon: '<path d="M12 19.5s-7-4.4-7-9.6a3.9 3.9 0 0 1 7-2.4 3.9 3.9 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6z"/>',
  }
];

(function () {
  const grid = document.getElementById('magicGrid');
  if (!grid) return;

  const DURATION = 10000;                 // every popup closes after exactly 10 seconds
  const RING_R = 20;
  const RING_C = 2 * Math.PI * RING_R;    // ring circumference
  const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.3 6.9 6.9 2.3-6.9 2.3L12 20.9l-2.3-6.9-6.9-2.3 6.9-2.3z"/></svg>';
  const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.4-9.1C1.3 8 3.4 4.6 7 4.6c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.7 3.4 4.4 6.8-1.9 4.5-9.4 9.1-9.4 9.1z"/></svg>';
  const isBn = () => document.documentElement.lang === 'bn';

  let open = null;   // the one popup that is open right now

  /* ---------- buttons ---------- */
  MAGIC_SURPRISES.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'magic-btn';
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML =
      (s.emoji ? '<span class="magic-ico magic-emo" aria-hidden="true">' + s.emoji + '</span>' : '<span class="magic-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + s.icon + '</svg></span>') +
      '<span class="magic-name"><span class="lang-en">' + s.title.en + '</span><span class="lang-bn">' + s.title.bn + '</span></span>';
    b.addEventListener('click', () => {
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      openSurprise(s, b);
    });
    grid.appendChild(b);
  });

  /* ---------- popup ---------- */
  function openSurprise(s, trigger) {
    closeSurprise();   // stop any surprise that is still open (its music too) before this one starts

    const overlay = document.createElement('div');
    overlay.className = 'mg-overlay fx-' + s.fx;
    overlay.innerHTML =
      '<div class="mg-card" role="dialog" aria-modal="true">' +
        '<button type="button" class="mg-close" aria-label="Close">&times;</button>' +
        '<div class="mg-timer" aria-hidden="true">' +
          '<svg viewBox="0 0 52 52"><circle class="mg-ring-bg" cx="26" cy="26" r="' + RING_R + '"/>' +
          '<circle class="mg-ring" cx="26" cy="26" r="' + RING_R + '" stroke-dasharray="' + RING_C.toFixed(2) + '" stroke-dashoffset="0"/></svg>' +
          '<span class="mg-sec">10</span>' +
        '</div>' +
        '<div class="mg-img">' +
          '<img src="' + s.image + '" alt="" onerror="this.remove()"></div>' +
        '<p class="mg-msg"></p>' +
        '<p class="mg-cap"></p>' +
        '<div class="mg-player"></div>' +
        '<div class="mg-particles" aria-hidden="true"></div>' +
      '</div>';
    // the photo stays hidden until it has actually loaded, so no empty box or text ever shows behind it
    const photo = overlay.querySelector('.mg-img img');
    if (photo) {
      const reveal = () => photo.classList.add('is-ready');
      if (photo.complete && photo.naturalWidth) reveal();
      else photo.addEventListener('load', reveal);
    }
    overlay.querySelector('.mg-msg').textContent = isBn() ? s.message.bn : s.message.en;
    overlay.querySelector('.mg-cap').textContent = isBn() ? s.caption.bn : s.caption.en;
    document.body.appendChild(overlay);

    const o = { s, overlay, trigger, raf: 0, timers: {}, stopMusic: null, player: null };
    open = o;

    const ring = overlay.querySelector('.mg-ring');
    const secEl = overlay.querySelector('.mg-sec');
    const particles = overlay.querySelector('.mg-particles');
    const closeBtn = overlay.querySelector('.mg-close');

    // countdown ring and seconds, driven by the clock so it never drifts
    const t0 = performance.now();
    const tick = now => {
      if (open !== o) return;
      const left = Math.max(0, DURATION - (now - t0));
      ring.style.strokeDashoffset = (RING_C * (1 - left / DURATION)).toFixed(2);
      secEl.textContent = String(Math.ceil(left / 1000));
      if (left > 0) o.raf = requestAnimationFrame(tick);
    };
    o.raf = requestAnimationFrame(tick);

    // the strict 10-second close
    o.timers.auto = setTimeout(closeSurprise, DURATION);

    // floating particles for every surprise; the sparkle one also gets a burst on open
    o.timers.particles = setInterval(() => spawnParticle(particles, s.fx), 380);
    if (s.fx === 'sparkle') for (let k = 0; k < 14; k++) spawnParticle(particles, 'burst');

    o.onKey = e => { if (e.key === 'Escape') closeSurprise(); };
    document.addEventListener('keydown', o.onKey);
    closeBtn.addEventListener('click', closeSurprise);
    closeBtn.focus({ preventScroll: true });

    loadMusic(s.music, overlay.querySelector('.mg-player'), o);
  }

  function closeSurprise() {
    const o = open;
    if (!o) return;
    open = null;                         // stops the countdown loop and any late music start
    cancelAnimationFrame(o.raf);
    clearTimeout(o.timers.auto);
    clearInterval(o.timers.particles);
    document.removeEventListener('keydown', o.onKey);
    if (o.stopMusic) o.stopMusic();
    if (o.player && o.player.destroy) { try { o.player.destroy(); } catch (e) { } }
    o.overlay.remove();
    if (o.trigger) o.trigger.focus({ preventScroll: true });
  }

  /* ---------- particles ---------- */
  function spawnParticle(box, fx) {
    if (!box || !box.isConnected || box.childElementCount > 40) return;
    const p = document.createElement('span');
    const kind = fx === 'hearts' ? 'heart' : 'spark';
    const burst = fx === 'burst';
    p.className = 'mg-p mg-p-' + kind + (burst ? ' mg-burst' : '');
    p.innerHTML = kind === 'heart' ? HEART : SPARK;
    p.style.left = (burst ? 50 + (Math.random() - 0.5) * 60 : Math.random() * 100) + '%';
    if (burst) p.style.top = (30 + Math.random() * 40) + '%';
    p.style.setProperty('--d', (2.6 + Math.random() * 1.8).toFixed(2) + 's');
    p.style.setProperty('--s', Math.round(9 + Math.random() * 10) + 'px');
    p.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 60) + 'px');
    p.addEventListener('animationend', () => p.remove());
    box.appendChild(p);
  }

  /* ---------- music ---------- */
  function loadYouTubeApi() {
    return new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const sc = document.createElement('script');
        sc.src = 'https://www.youtube.com/iframe_api';
        sc.onerror = () => reject(new Error('YouTube player failed to load'));
        document.head.appendChild(sc);
      }
    });
  }

  // The surprise's own music starts by itself (no buttons). The site's background music steps aside
  // while it plays, and comes back when the popup closes.
  function pauseSiteMusic(o) {
    if (o.bgPaused) return;
    o.bgPaused = true;
    if (window.siteMusic) window.siteMusic.pause();
  }
  function resumeSiteMusic(o) {
    if (!o.bgPaused) return;
    o.bgPaused = false;
    if (window.siteMusic) window.siteMusic.resume();
  }

  function loadMusic(music, box, o) {
    if (!music || music.type === 'none') { box.remove(); return; }

    if (music.type === 'audio' && music.src) {
      const a = document.createElement('audio');
      a.preload = 'auto'; a.src = music.src;           // no controls: it just plays
      box.appendChild(a);
      pauseSiteMusic(o);
      a.play().catch(() => { resumeSiteMusic(o); });
      o.stopMusic = () => {
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) { }
        resumeSiteMusic(o);
      };
      return;
    }

    if (music.type === 'youtube' && music.videoId) {
      const holder = document.createElement('div');
      box.appendChild(holder);
      pauseSiteMusic(o);
      loadYouTubeApi().then(YTapi => {
        if (open !== o) return;          // this popup already closed, so do not start music
        o.player = new YTapi.Player(holder, {
          width: '1', height: '1', videoId: music.videoId,
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, autoplay: 1 },
          events: { onReady: e => e.target.playVideo() }
        });
      }).catch(() => { resumeSiteMusic(o); });
      o.stopMusic = () => {
        if (o.player) { try { o.player.stopVideo(); } catch (e) { } }
        resumeSiteMusic(o);
      };
      return;
    }

    box.remove();
  }
})();

/* ===== Hero caption: keep it on one line =====
   The caption is one line on every screen. If the text is wider than the screen, the font gets a little smaller until it fits. */
(function () {
  const cap = document.getElementById('c1');
  if (!cap) return;
  const fit = () => {
    cap.style.fontSize = '';
    let size = parseFloat(getComputedStyle(cap).fontSize);
    let guard = 0;
    while (cap.scrollWidth > cap.clientWidth && size > 12 && guard++ < 40) {
      size -= 0.5;
      cap.style.fontSize = size + 'px';
    }
  };
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  new MutationObserver(fit).observe(cap, { childList: true, subtree: true, characterData: true });
  fit();
})();
