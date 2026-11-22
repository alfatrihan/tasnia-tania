/* Connecting the Stars: join the glowing stars in order and Tania's picture shines through.
   Each level uses its own photo and star layout (connect-levels.js). Works with mouse, touch and pen:
   tap the glowing star, or press and drag from star to star. A wrong star only gives a gentle nudge.
   All ids and classes start with cs- so nothing clashes with the other games. */
(() => {
    const slide = document.getElementById('play-slide-connect');
    const canvas = document.getElementById('cs-canvas');
    const board = document.getElementById('cs-board');
    const photo = document.getElementById('cs-photo');
    const overlay = document.getElementById('cs-overlay');
    const playBtn = document.getElementById('cs-play');
    const doneBox = document.getElementById('cs-done');
    const doneNext = document.querySelector('#cs-done .cs-done-next');
    const doneFinal = document.querySelector('#cs-done .cs-done-final');
    const nextBtn = document.getElementById('cs-next');
    const againBtn = document.getElementById('cs-again');
    const levelEl = document.getElementById('cs-level-n');
    const totalLevelsEl = document.getElementById('cs-total-levels');
    const countEl = document.getElementById('cs-count-n');
    const totalEl = document.getElementById('cs-total-n');
    const hintEl = document.getElementById('cs-hint');
    if (!slide || !canvas || !board || !photo || !window.CONNECT_LEVELS || !window.CONNECT_LEVELS.length) return;

    const ctx = canvas.getContext('2d');
    const LEVELS = window.CONNECT_LEVELS;
    const DRAW_MS = 430;       // how long a new line takes to draw itself
    const FADE_MS = 520;       // how long each star takes to light up
    const DUST = [];
    for (let i = 0; i < 70; i++) {
        DUST.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 0.9,
            p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.4 });
    }

    let size = 0, dpr = 1;
    let level = 0;
    let stars = [];            // {x, y (fractions), px, py (pixels), born}
    let dots = [];             // dense face field for this level: [x, y, size, phase]
    let next = 0;              // index of the star the player must join next
    let lines = [];            // {a, b, t} drawn segments
    let closing = null;        // {t} the line back to the first star
    let burst = [];            // sparkle particles
    let ring = null;           // gentle feedback ring for a wrong star
    let phase = 'start';       // start | playing | finishing | done
    let pressing = false;

    const now = () => performance.now();
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

    function layout() {
        const r = board.getBoundingClientRect();
        size = Math.max(10, r.width);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars.forEach(s => { s.px = s.x * size; s.py = s.y * size; });
    }

    function setPhoto(p) {
        photo.style.opacity = (0.1 + 0.9 * p).toFixed(3);
        photo.style.filter = 'blur(' + ((1 - p) * 14).toFixed(1) + 'px) saturate(' + (0.55 + 0.45 * p).toFixed(3) + ')';
    }

    function setCounts() {
        countEl.textContent = String(next);
        totalEl.textContent = String(stars.length);
        levelEl.textContent = String(level + 1);
        totalLevelsEl.textContent = String(LEVELS.length);
    }

    function loadLevel(i) {
        level = i;
        const L = LEVELS[i];
        const t0 = now();
        dots = (window.CONNECT_FACE_DOTS && window.CONNECT_FACE_DOTS[i]) || [];
        stars = L.stars.map((s, k) => ({ x: s[0], y: s[1], px: 0, py: 0, born: t0 + 150 + k * (FADE_MS / 6) }));
        next = 0; lines = []; closing = null; burst = []; ring = null;
        layout();
        photo.src = L.img;
        setPhoto(0);
        setCounts();
        hintFlash(false);
    }

    function startPlaying(fresh) {
        phase = 'playing';
        if (fresh) loadLevel(0);
        overlay.classList.add('hidden');
        doneBox.classList.add('hidden');
    }

    function connectNext() {
        const t = now();
        const s = stars[next];
        burst.push(...sparkles(s.px, s.py, 7));
        if (next > 0) lines.push({ a: next - 1, b: next, t });
        next++;
        setCounts();
        setPhoto(next / stars.length);
        if (next === stars.length) {
            phase = 'finishing';
            closing = { t };
            burst.push(...sparkles(stars[0].px, stars[0].py, 10));
            setTimeout(showDone, DRAW_MS + 900);
        }
    }

    function showDone() {
        phase = 'done';
        const last = level === LEVELS.length - 1;
        doneNext.classList.toggle('hidden', last);
        doneFinal.classList.toggle('hidden', !last);
        doneBox.classList.remove('hidden');
    }

    function sparkles(x, y, n) {
        const out = [];
        for (let i = 0; i < n; i++) {
            const a = Math.random() * 6.28, v = 0.3 + Math.random() * 1.1;
            out.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: now(), life: 700 + Math.random() * 600 });
        }
        return out;
    }

    function hintFlash(on) {
        hintEl.classList.toggle('cs-hint-alert', on);
    }

    // ---------- input: tap or drag onto the next star ----------
    function local(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function hitRadius() {
        return Math.max(26, size * 0.075);
    }

    function tryConnect(e, isDown) {
        if (phase !== 'playing' || next >= stars.length) return;
        const p = local(e);
        const R = hitRadius();
        const s = stars[next];
        if (dist(p.x, p.y, s.px, s.py) <= R) {
            connectNext();
            return;
        }
        if (isDown) {
            // tapped a star further along the path: a soft nudge, no penalty
            for (let k = next + 1; k < stars.length; k++) {
                if (dist(p.x, p.y, stars[k].px, stars[k].py) <= R) {
                    ring = { x: stars[k].px, y: stars[k].py, t: now() };
                    board.classList.remove('cs-nudge');
                    void board.offsetWidth;
                    board.classList.add('cs-nudge');
                    hintFlash(true);
                    clearTimeout(tryConnect._h);
                    tryConnect._h = setTimeout(() => hintFlash(false), 1100);
                    break;
                }
            }
        }
    }

    canvas.addEventListener('pointerdown', e => {
        if (phase !== 'playing') return;
        e.preventDefault();
        pressing = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        tryConnect(e, true);
    });
    canvas.addEventListener('pointermove', e => {
        if (pressing) tryConnect(e, false);
    });
    const release = () => { pressing = false; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    // ---------- buttons ----------
    playBtn.addEventListener('click', () => startPlaying(true));
    nextBtn.addEventListener('click', () => {
        if (level < LEVELS.length - 1) {
            doneBox.classList.add('hidden');
            loadLevel(level + 1);
            phase = 'playing';
            overlay.classList.add('hidden');
        }
    });
    againBtn.addEventListener('click', () => {
        loadLevel(0);
        phase = 'playing';
        doneBox.classList.add('hidden');
        overlay.classList.add('hidden');
    });

    // ---------- drawing ----------
    function draw() {
        const t = now();
        ctx.clearRect(0, 0, size, size);

        // dense star field that makes the face; it dims a little as the photo appears
        const prog = stars.length ? next / stars.length : 0;
        for (const d of dots) {
            const tw = 0.75 + 0.25 * Math.sin(t / 700 + d[3]);
            const a = (0.8 - 0.45 * prog) * tw;
            ctx.fillStyle = 'rgba(210, 226, 255, ' + a.toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(d[0] * size, d[1] * size, d[2] * Math.max(0.9, size / 420), 0, 6.283);
            ctx.fill();
        }

        // soft background dust that twinkles
        for (const d of DUST) {
            const a = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t / 900 * d.s + d.p));
            ctx.fillStyle = 'rgba(246, 235, 242, ' + a.toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(d.x * size, d.y * size, d.r, 0, 6.283);
            ctx.fill();
        }

        if (stars.length) {
            // drawn lines
            ctx.lineCap = 'round';
            for (const ln of lines) drawLine(stars[ln.a], stars[ln.b], ln.t, t);
            if (closing) drawLine(stars[stars.length - 1], stars[0], closing.t, t);

            // faint guide from the last joined star to the next one
            if (phase === 'playing' && next > 0 && next < stars.length) {
                const a = stars[next - 1], b = stars[next];
                ctx.save();
                ctx.setLineDash([3, 7]);
                ctx.strokeStyle = 'rgba(255, 214, 228, .22)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.px, a.py);
                ctx.lineTo(b.px, b.py);
                ctx.stroke();
                ctx.restore();
            }

            // stars
            const base = Math.max(2.2, size * 0.0048);
            for (let k = 0; k < stars.length; k++) {
                const s = stars[k];
                if (t < s.born) continue;
                const fade = Math.min(1, (t - s.born) / FADE_MS);
                const joined = k < next;
                const isNext = k === next && phase === 'playing';
                const pulse = isNext ? 1 + 0.28 * (0.5 + 0.5 * Math.sin(t / 220)) : 1;
                const r = base * pulse;
                const glow = r * (isNext ? 7 : 5);
                const grd = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, glow);
                const c = joined ? '255, 236, 246' : '214, 190, 246';
                grd.addColorStop(0, 'rgba(' + c + ', ' + (0.85 * fade).toFixed(3) + ')');
                grd.addColorStop(0.35, 'rgba(' + c + ', ' + (0.25 * fade).toFixed(3) + ')');
                grd.addColorStop(1, 'rgba(' + c + ', 0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(s.px, s.py, glow, 0, 6.283);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 250, 252, ' + (fade * (joined ? 1 : 0.9)).toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(s.px, s.py, r, 0, 6.283);
                ctx.fill();
                if (isNext) {
                    ctx.strokeStyle = 'rgba(255, 214, 228, ' + (0.45 + 0.3 * Math.sin(t / 220)).toFixed(3) + ')';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.arc(s.px, s.py, r * 3.2, 0, 6.283);
                    ctx.stroke();
                }
            }
        }

        // gentle ring for a wrong star
        if (ring) {
            const age = (t - ring.t) / 600;
            if (age >= 1) ring = null;
            else {
                ctx.strokeStyle = 'rgba(205, 180, 240, ' + (0.7 * (1 - age)).toFixed(3) + ')';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(ring.x, ring.y, 6 + age * 26, 0, 6.283);
                ctx.stroke();
            }
        }

        // sparkles
        if (burst.length) {
            burst = burst.filter(b => t - b.t < b.life);
            for (const b of burst) {
                const age = (t - b.t) / b.life;
                b.x += b.vx; b.y += b.vy;
                ctx.fillStyle = 'rgba(255, 226, 240, ' + (1 - age).toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(b.x, b.y, 1.6 * (1 - age) + 0.4, 0, 6.283);
                ctx.fill();
            }
        }

        requestAnimationFrame(draw);
    }

    function drawLine(a, b, start, t) {
        const p = Math.min(1, (t - start) / DRAW_MS);
        if (p <= 0) return;
        const ex = a.px + (b.px - a.px) * p;
        const ey = a.py + (b.py - a.py) * p;
        ctx.save();
        ctx.shadowColor = 'rgba(255, 190, 220, .9)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255, 226, 240, .85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
    }

    // keep the stars in place when the board changes size
    if (window.ResizeObserver) new ResizeObserver(layout).observe(board);
    else window.addEventListener('resize', layout);

    layout();
    setCounts();
    loadLevel(0);
    phase = 'start';
    requestAnimationFrame(draw);
})();
