/* ===== Tania Multiverse: lightweight floating video planets =====
   Add your 10-second vertical MP4 clips to media/multiverse/ using the paths below.
   The player intentionally reuses the A Little Moment of Magic overlay/timer language.
*/
(function () {
  const stage = document.getElementById('multiverseStage');
  if (!stage) return;

  const CLIPS = [
    { file: 'actress.mp4', icon: 'camera', label: 'Memory', en: "In this universe, Tania is an actress.", bn: "এই জগতে তানিয়া একজন অভিনেত্রী।" },
    { file: 'astronaut.mp4', icon: 'music', label: 'Music', en: "In this universe, Tania is an astronaut.", bn: "এই জগতে তানিয়া একজন মহাকাশচারী।" },
    { file: 'chawali.mp4', icon: 'plane', label: 'Travel', en: "In this universe, Tania is a tea seller.", bn: "এই জগতে তানিয়া একজন চা বিক্রেতা।" },
    { file: 'mafia.mp4', icon: 'heart', label: 'Moments', en: "In this universe, Tania is a mafia boss.", bn: "এই জগতে তানিয়া একজন মাফিয়া বস।" },
    { file: 'artist.mp4', icon: 'flower', label: 'Little joys', en: "In this universe, Tania is an artist.", bn: "এই জগতে তানিয়া একজন শিল্পী।" },
    { file: 'rickshaw-wala.mp4', icon: 'sparkle', label: 'Magic', en: "In this universe, Tania is a rickshaw driver.", bn: "এই জগতে তানিয়া একজন রিকশাচালক।" },
    { file: 'village-wife.mp4', icon: 'image', label: 'Memories', en: "In this universe, Tania is a village housewife.", bn: "এই জগতে তানিয়া একজন গ্রামের গৃহিণী।" },
    { file: 'superhero.mp4', icon: 'sun', label: 'Sunny days', en: "In this universe, Tania is a superhero.", bn: "এই জগতে তানিয়া একজন সুপারহিরো।" },
    { file: 'chef.mp4', icon: 'coffee', label: 'Quiet time', en: "In this universe, Tania is a chef.", bn: "এই জগতে তানিয়া একজন শেফ।" },
    { file: 'crazy-girl.mp4', icon: 'star', label: 'Favorites', en: "In this universe, Tania is a crazy girl.", bn: "এই জগতে তানিয়া একজন পাগলাটে মেয়ে।" },
    { file: 'scientist.mp4', icon: 'butterfly', label: 'Free spirit', en: "In this universe, Tania is a scientist.", bn: "এই জগতে তানিয়া একজন বিজ্ঞানী।" },
    { file: 'tiktoker.mp4', icon: 'film', label: 'Stories', en: "In this universe, Tania is a TikToker.", bn: "এই জগতে তানিয়া একজন টিকটকার।" },
    { file: 'queen.mp4', icon: 'camera', label: 'Behind the scenes', en: "In this universe, Tania is a queen.", bn: "এই জগতে তানিয়া একজন রানী।" },
    { file: 'doctor.mp4', icon: 'music', label: 'Favourite tunes', en: "In this universe, Tania is a doctor.", bn: "এই জগতে তানিয়া একজন ডাক্তার।" },
    { file: 'vampire.mp4', icon: 'plane', label: 'Little trips', en: "In this universe, Tania is a vampire.", bn: "এই জগতে তানিয়া একজন ভ্যাম্পায়ার।" },
    { file: 'fashion-designer.mp4', icon: 'heart', label: 'Friendship', en: "In this universe, Tania is a fashion designer.", bn: "এই জগতে তানিয়া একজন ফ্যাশন ডিজাইনার।" },
    { file: 'robber.mp4', icon: 'flower', label: 'Blooming days', en: "In this universe, Tania is a robber.", bn: "এই জগতে তানিয়া একজন ডাকাত।" },
    { file: 'air-hostess.mp4', icon: 'sparkle', label: 'Special moments', en: "In this universe, Tania is an air hostess.", bn: "এই জগতে তানিয়া একজন এয়ার হোস্টেস।" },
    { file: 'ghotok.mp4', icon: 'image', label: 'Photo memories', en: "In this universe, Tania is a matchmaker.", bn: "এই জগতে তানিয়া একজন ঘটক।" },
    { file: 'warrior.mp4', icon: 'sun', label: 'Golden hour', en: "In this universe, Tania is a warrior.", bn: "এই জগতে তানিয়া একজন যোদ্ধা।" },
    { file: 'makeup-artisi.mp4', icon: 'coffee', label: 'Slow mornings', en: "In this universe, Tania is a makeup artist.", bn: "এই জগতে তানিয়া একজন মেকআপ আর্টিস্ট।" },
    { file: 'pailot.mp4', icon: 'star', label: 'Dreams', en: "In this universe, Tania is a pilot.", bn: "এই জগতে তানিয়া একজন পাইলট।" },
    { file: 'black-magician.mp4', icon: 'butterfly', label: 'Free spirit', en: "In this universe, Tania is a black magician.", bn: "এই জগতে তানিয়া একজন কালো জাদুকর।" },
    { file: 'business-woman.mp4', icon: 'film', label: 'Mini stories', en: "In this universe, Tania is a businesswoman.", bn: "এই জগতে তানিয়া একজন ব্যবসায়ী।" },
    { file: 'rapper.mp4', icon: 'camera', label: 'Snapshots', en: "In this universe, Tania is a rapper.", bn: "এই জগতে তানিয়া একজন র‍্যাপার।" },
    { file: 'teacher.mp4', icon: 'music', label: 'Melodies', en: "In this universe, Tania is a teacher.", bn: "এই জগতে তানিয়া একজন শিক্ষিকা।" },
    { file: 'gamer.mp4', icon: 'plane', label: 'Adventures', en: "In this universe, Tania is a gamer.", bn: "এই জগতে তানিয়া একজন গেমার।" },
    { file: 'vlogger.mp4', icon: 'heart', label: 'Sweet memories', en: "In this universe, Tania is a vlogger.", bn: "এই জগতে তানিয়া একজন ভ্লগার।" },
    { file: 'aline.mp4', icon: 'flower', label: 'Happy days', en: "In this universe, Tania is an alien.", bn: "এই জগতে তানিয়া একজন এলিয়েন।" },
    { file: 'water-queen.mp4', icon: 'sparkle', label: 'Surprises', en: "In this universe, Tania is the Water Queen.", bn: "এই জগতে তানিয়া একজন জলরানী।" }
  ];
  // Every planet has its own size (px on desktop), like a little solar system.
  const SIZES = [50, 68, 58, 44, 76, 60, 52, 73, 47, 62, 70, 55, 44, 65, 58, 47, 76, 60, 52, 68, 58, 44, 70, 62, 50, 73, 55, 47, 65, 60];
  // Planets that get Saturn-style rings (indexes into CLIPS), kept off the stage edges so rings are never cut off.
  const RINGED = new Set([1, 2, 7, 11, 13, 16, 18, 22]);
  // Eight real-planet looks, so neighbouring planets never match: gas giant, earth-like, mars, ice, moon, neptune, venus, lava.
  const PLANET_TYPES = ['gas', 'earth', 'mars', 'ice', 'moon', 'neptune', 'venus', 'lava'];
  const DURATION = 10000;
  const R = 20, C = 2 * Math.PI * R;
  const ICONS = {
    camera: '<path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z"/><circle cx="12" cy="13.5" r="3.2"/>',
    music: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    plane: '<path d="M3 12l18-8-5 17-3-7-10-2z"/><path d="M13 14l4-5"/>',
    heart: '<path d="M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10z"/>',
    flower: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C7 6 10 2 12 2s5 4 0 7.8zM14.2 12c3.8-5 7.8-2 7.8 0s-4 5-7.8 0zM12 14.2c5 3.8 2 7.8 0 7.8s-5-4 0-7.8zM9.8 12C6 17 2 14 2 12s4-5 7.8 0z"/>',
    sparkle: '<path d="M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4-2.4 7.1-2.4-7.1-7.1-2.4 7.1-2.4z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5L5 20"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    coffee: '<path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 10h2a2 2 0 1 1 0 4h-2M8 3v2m4-2v2"/>',
    star: '<path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.4l6.3-.9z"/>',
    butterfly: '<path d="M12 12c-2-5-8-9-9-4-1 4 4 7 9 4zm0 0c2-5 8-9 9-4 1 4-4 7-9 4zm0 0c-2 5-8 9-9 4-1-4 4-7 9-4zm0 0c2 5 8 9 9 4 1-4-4-7-9-4z"/><path d="M12 8v8"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>'
  };

  // A compact 5 x 6 layout keeps all 30 planets evenly distributed on phones and desktops.

  const planets = [];
  CLIPS.forEach((clip, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mv-planet';
    button.dataset.type = PLANET_TYPES[i % PLANET_TYPES.length];
    // every planet gets its own texture spots (deterministic, so the look stays the same on each visit)
    const rnd = n => { const v = Math.sin((i + 1) * n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    ['tx1', 'ty1', 'tx2', 'ty2', 'tx3', 'ty3'].forEach((name, n) => {
      button.style.setProperty('--' + name, (16 + rnd(n + 1) * 68).toFixed(0) + '%');
    });
    button.style.setProperty('--ang1', (100 + rnd(9) * 50).toFixed(0) + 'deg');
    // each planet spins on its own axis: its own speed (9 - 18 s per turn) and its own direction
    button.style.setProperty('--spin', (9 + rnd(13) * 9).toFixed(1) + 's');
    button.style.setProperty('--spindir', i % 3 === 1 ? 'reverse' : 'normal');
    button.style.setProperty('--x', (10 + col * 20) + '%');
    button.style.setProperty('--y', (9 + row * 16.4) + '%');
    button.style.setProperty('--s', SIZES[i % SIZES.length]);
    button.setAttribute('aria-label', 'Play ' + clip.label + ' video');
    // no hover tooltip: the label is kept for screen readers only (aria-label above)
    const ring = RINGED.has(i);
    button.innerHTML = (ring ? '<span class="mv-ring mv-ring-back" aria-hidden="true"></span>' : '') +
      '<span class="mv-planet-core"></span>' +
      (ring ? '<span class="mv-ring mv-ring-front" aria-hidden="true"></span>' : '');
    button.addEventListener('click', () => openClip(clip, button));
    stage.appendChild(button);
    // Each planet orbits its own home spot on a gentle tilted ellipse, at its own speed
    // (18 - 46 s per lap), some clockwise and some not, like a little solar system.
    const rx = 16 + ((i * 5) % 7) * 3;
    planets.push({
      el: button,
      rx: rx,
      ry: rx * (0.45 + ((i * 3) % 4) * 0.1),
      period: 34 + ((i * 7) % 8) * 9,   // slower, more like real orbits
      ecc: 0.1 + ((i * 11) % 7) * 0.035, // orbit eccentricity: each planet's path is a slightly stretched ellipse
      dir: i % 3 === 0 ? -1 : 1,
      phase: i * 0.9,
      tilt: ((i * 37) % 180) * Math.PI / 180
    });
  });

  // ---- Constellation links: thin glowing threads connect neighbouring planets, so the whole
  // multiverse reads as one connected web. The threads sit behind the planets and follow them
  // as they orbit (updated inside place(), in the same animation frame). ----
  const NS = 'http://www.w3.org/2000/svg';
  const web = document.createElementNS(NS, 'svg');
  web.setAttribute('class', 'mv-web');
  web.setAttribute('aria-hidden', 'true');
  const glowG = document.createElementNS(NS, 'g');
  const lineG = document.createElementNS(NS, 'g');
  const pulseG = document.createElementNS(NS, 'g');
  web.appendChild(glowG); web.appendChild(lineG); web.appendChild(pulseG);
  stage.insertBefore(web, stage.firstChild);   // first child = painted underneath every planet

  const hash = n => { const v = Math.sin(n * 78.233) * 43758.5453; return v - Math.floor(v); };
  const pairs = new Set();
  const addPair = (a, b) => { if (a !== b && a >= 0 && b >= 0 && a < 30 && b < 30) pairs.add(a < b ? a + '-' + b : b + '-' + a); };
  for (let i = 0; i < 30; i++) {
    const col = i % 5, row = Math.floor(i / 5);
    if (row < 5) addPair(i, i + 5);                                   // down
    if (col < 4 && hash(i + 1) > 0.42) addPair(i, i + 1);              // right
    if (row < 5 && col < 4 && hash(i + 40) > 0.62) addPair(i, i + 6);  // diagonal down-right
    if (row < 5 && col > 0 && hash(i + 90) > 0.68) addPair(i, i + 4);  // diagonal down-left
    if (row < 4 && hash(i + 140) > 0.9) addPair(i, i + 10);            // a few long threads
  }
  const links = [];
  let li = 0;
  pairs.forEach(key => {
    const [a, b] = key.split('-').map(Number);
    const glow = document.createElementNS(NS, 'path');
    glow.setAttribute('class', 'mv-link-glow');
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('class', 'mv-link');
    glowG.appendChild(glow); lineG.appendChild(line);
    let pulse = null;
    if (hash(li + 7) > 0.62) {   // a small light travels along some threads
      pulse = document.createElementNS(NS, 'circle');
      pulse.setAttribute('class', 'mv-pulse');
      pulse.setAttribute('r', '1.7');
      pulseG.appendChild(pulse);
    }
    links.push({
      a: a, b: b, glow: glow, line: line, pulse: pulse,
      bow: (hash(li + 3) - 0.5) * 0.34,          // each thread curves a little, a different way
      sway: hash(li + 5) * 6.28,
      pSpeed: 0.05 + hash(li + 9) * 0.05,
      pPhase: hash(li + 11)
    });
    li++;
  });

  function drawLinks() {
    for (let k = 0; k < links.length; k++) {
      const L = links[k], A = planets[L.a], B = planets[L.b];
      const dx = B.cx - A.cx, dy = B.cy - A.cy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      // start / end on the planet surfaces, so threads touch the planets instead of crossing them
      const ax = A.cx + ux * A.r * 0.6, ay = A.cy + uy * A.r * 0.6;
      const bx = B.cx - ux * B.r * 0.6, by = B.cy - uy * B.r * 0.6;
      // gently curved thread that breathes slowly, like a real tether
      const bend = len * L.bow * (1 + 0.18 * Math.sin(clock * 0.45 + L.sway));
      const qx = (ax + bx) / 2 - uy * bend, qy = (ay + by) / 2 + ux * bend;
      const d = 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1);
      L.glow.setAttribute('d', d);
      L.line.setAttribute('d', d);
      if (L.pulse) {
        const t = (clock * speed * L.pSpeed + L.pPhase) % 1, m = 1 - t;
        L.pulse.setAttribute('cx', (m * m * ax + 2 * m * t * qx + t * t * bx).toFixed(1));
        L.pulse.setAttribute('cy', (m * m * ay + 2 * m * t * qy + t * t * by).toFixed(1));
        L.pulse.style.opacity = (Math.sin(t * Math.PI) * 0.95).toFixed(2);
      }
    }
  }

  // ---- smooth orbit loop: one requestAnimationFrame for all planets, time-based so it is
  // identical on every screen refresh rate; paused while off-screen or the tab is hidden. ----
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reduced ? 0.6 : 1;           // reduced-motion: calmer, but never frozen
  let amp = 1, clock = 0, last = 0, raf = 0, inView = true;
  let W = 0, H = 0;
  // Each planet gets a home spot in px and a safe margin (half its size; rings get extra room),
  // so no planet or ring is ever drawn past the stage edge where it would be cut off.
  const fit = () => {
    amp = Math.min(1, Math.max(0.5, stage.clientWidth / 760)) * (reduced ? 0.7 : 1);
    W = stage.clientWidth; H = stage.clientHeight;
    web.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    planets.forEach((p, idx) => {
      const half = p.el.offsetWidth / 2;
      p.padX = RINGED.has(idx) ? half * 2.2 : half + 2;
      p.padY = half + 2;
      p.hx = W * (0.10 + (idx % 5) * 0.20);
      p.hy = H * (0.09 + Math.floor(idx / 5) * 0.164);
    });
  };
  fit();
  window.addEventListener('resize', fit);

  function place() {
    for (let k = 0; k < planets.length; k++) {
      const p = planets[k];
      // Kepler-style orbit: mean anomaly M moves at a steady rate, but the planet's real angle E
      // (solved from Kepler's equation) runs faster near one side of the ellipse and slower on the other.
      const M = p.dir * 2 * Math.PI * (clock * speed) / p.period + p.phase;
      let E = M;
      for (let it = 0; it < 3; it++) E = M + p.ecc * Math.sin(E);
      const th = E;
      const x = (Math.cos(E) - p.ecc) * p.rx * amp, y = Math.sin(E) * p.ry * amp;
      // the orbital plane tilts very slightly and drifts over time, like a real precession
      const tilt = p.tilt + 0.03 * Math.sin(clock * 0.04 + p.phase);
      // a tiny natural wobble so the motion never looks mechanical
      const wob = Math.sin(clock * 0.9 + p.phase * 2) * 0.6;
      const X = x * Math.cos(tilt) - y * Math.sin(tilt) + wob;
      const Y = x * Math.sin(tilt) + y * Math.cos(tilt) + wob * 0.5;
      const sc = 1 + 0.06 * Math.sin(th);   // a touch bigger on the near side of its orbit
      // keep the whole planet (and its ring) inside the stage
      const cx = Math.min(Math.max(p.hx + X, p.padX), Math.max(p.padX, W - p.padX));
      const cy = Math.min(Math.max(p.hy + Y, p.padY), Math.max(p.padY, H - p.padY));
      p.cx = cx; p.cy = cy; p.r = (p.el.offsetWidth / 2) * sc;
      p.el.style.transform = 'translate(-50%, -50%) translate3d(' + (cx - p.hx).toFixed(2) + 'px,' + (cy - p.hy).toFixed(2) + 'px,0) scale(' + sc.toFixed(3) + ')';
    }
    drawLinks();
  }
  function frame(now) {
    raf = 0;
    if (!inView || document.hidden) { last = 0; return; }
    if (last) clock += Math.min(0.1, (now - last) / 1000);
    last = now;
    place();
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && inView && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { inView = es[0].isIntersecting; stage.classList.toggle('mv-idle', !inView); wake(); }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener('visibilitychange', wake);
  place();
  wake();

  let active = null;

  // Keep each caption on ONE line: shrink its text a little until it fits the card width
  // (only the very long sentences get smaller; the rest keep the normal size).
  function fitCaption(cap) {
    if (!cap) return;
    cap.style.fontSize = '';
    let size = parseFloat(getComputedStyle(cap).fontSize);
    while (cap.scrollWidth > cap.clientWidth + 1 && size > 10) {
      size -= 0.5;
      cap.style.fontSize = size + 'px';
    }
  }
  // When the language changes while a video is open, the other caption may be longer: fit again
  new MutationObserver(() => {
    if (active) fitCaption(active.overlay.querySelector('.mv-caption'));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  function openClip(clip, trigger) {
    closeClip();
    const overlay = document.createElement('div');
    overlay.className = 'mg-overlay mv-overlay';
    overlay.innerHTML =
      '<div class="mg-card mv-card" role="dialog" aria-modal="true" aria-label="Tania&#39;s Multiverse video">' +
      '<button type="button" class="mg-close mv-close" aria-label="Close video">&times;</button>' +
      '<div class="mv-video-wrap"><video class="mv-video" playsinline webkit-playsinline preload="none"></video></div>' +
      '<p class="mv-caption"></p>' +
      '</div>';
    const video = overlay.querySelector('video');
    const close = overlay.querySelector('.mv-close');
    video.src = 'media/multiverse/' + clip.file;
    video.setAttribute('aria-label', clip.label + ' short video');
    // English and Bangla captions: shown by the page language (html lang), see multiverse.css
    overlay.querySelector('.mv-caption').innerHTML =
      '<span class="lang-en">' + clip.en + '</span><span class="lang-bn">' + clip.bn + '</span>';
    video.load();
    document.body.appendChild(overlay);
    fitCaption(overlay.querySelector('.mv-caption'));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const state = { overlay, video, trigger, raf: 0, timer: 0, previousOverflow };
    active = state;
    // The site's background music steps aside while the video plays (same as the magic surprises)
    if (window.siteMusic) { window.siteMusic.pause(); state.musicPaused = true; }
    // The card closes only after the whole video has played ('ended'), so no clip is cut short.
    // (No countdown is shown.)
    video.addEventListener('ended', () => {
      if (active === state) closeClip();
    });
    video.addEventListener('error', () => {
      if (active !== state) return;
      // a missing or unplayable clip still returns to the website after the usual 10 seconds (no message is shown)
      state.timer = window.setTimeout(closeClip, DURATION);
    }, { once: true });
    video.play().catch(() => {
      if (active !== state) return;
      video.muted = true;
      video.play().catch(() => { /* nothing to show: the card simply stays and closes on Close or Escape */ });
    });
    close.addEventListener('click', closeClip);
    state.onKey = e => { if (e.key === 'Escape') closeClip(); };
    document.addEventListener('keydown', state.onKey);
    close.focus({ preventScroll: true });
  }

  const LEAVE_MS = 320; // matches the mvFadeOut / mvCardOut animation in multiverse.css

  function closeClip() {
    const state = active;
    if (!state) return;
    active = null;
    cancelAnimationFrame(state.raf);
    clearTimeout(state.timer);
    document.removeEventListener('keydown', state.onKey);
    state.video.pause();
    // fade the card out smoothly first, then remove it and release the page
    state.overlay.classList.add('mv-leaving');
    state.overlay.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => finishClose(state), LEAVE_MS);
  }

  function finishClose(state) {
    state.video.removeAttribute('src');
    state.video.load();
    state.overlay.remove();
    document.body.style.overflow = state.previousOverflow;
    // bring the site's background music back, unless the visitor had paused it themselves
    if (state.musicPaused && window.siteMusic) window.siteMusic.resume();
    if (state.trigger && state.trigger.isConnected) state.trigger.focus({ preventScroll: true });
  }
})();
