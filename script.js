const $ = s => [...document.querySelectorAll(s)], G = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), seg = (p, a, b) => clamp((p - a) / (b - a)), ease = t => 1 - Math.pow(1 - t, 3);

// ---------- Block pinch-zoom and double-tap zoom (mobile stability) ----------
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastTouchEnd < 300) e.preventDefault(); lastTouchEnd = n; }, { passive: false });

const navEl = G('nav');
function centerNav(a) { const nr = navEl.getBoundingClientRect(), ar = a.getBoundingClientRect(); navEl.scrollTo({ left: navEl.scrollLeft + (ar.left - nr.left) - (navEl.clientWidth - ar.width) / 2, behavior: 'smooth' }) }
const cv = G('fx'), cx = cv.getContext('2d'); let W = 0, H = 0, D = 1;
const PS = 10; // every falling petal has the same size

// Canvas is sized only when the width changes, or when the screen gets taller.
// Mobile address-bar show/hide changes only the height, so it no longer resets/shakes the drawing.
function size() {
    const nw = innerWidth, nh = innerHeight, widthChanged = nw !== W;
    if (!widthChanged && nh <= H) return;
    W = nw; H = widthChanged ? nh : Math.max(H, nh);
    // petals and flowers do not need full sharpness: a lower resolution on phones keeps scrolling smooth (fill-rate)
    D = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.5);
    cv.width = W * D; cv.height = H * D;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(D, 0, 0, D, 0, 0);
}
addEventListener('resize', size); size();

const PAL = ['#f8bcd3', '#ee8fb5', '#ffd6e4', '#e57aa8', '#d9b8f2'];
function petal(L, w) { cx.beginPath(); cx.moveTo(0, 0); cx.bezierCurveTo(w, -L * .3, w * .9, -L * .9, 0, -L); cx.bezierCurveTo(-w * .9, -L * .9, -w, -L * .3, 0, 0); cx.closePath() }
function flower(x, y, R, b, rot, layers, n, a) {
    if (R < 1 || a <= 0) return; cx.save(); cx.translate(x, y);
    for (let l = 0; l < layers; l++) {
        const lb = ease(clamp(b * 1.5 - l * .28)); if (lb <= 0) continue;
        const L = R * (1 - l * .17) * (.35 + .65 * lb), w = L * (.42 + .2 * lb), cnt = n + l * 2;
        const g = cx.createLinearGradient(0, 0, 0, -L); g.addColorStop(0, '#c2467f'); g.addColorStop(.55, '#ee8fb5'); g.addColorStop(1, '#ffd9e6');
        cx.fillStyle = g; cx.strokeStyle = 'rgba(255,230,240,.4)'; cx.lineWidth = 1; cx.globalAlpha = a * (.8 + .2 * l / layers);
        for (let i = 0; i < cnt; i++) { cx.save(); cx.rotate(rot * (l % 2 ? -1 : 1) + i * 6.2832 / cnt + l * .35); petal(L, w); cx.fill(); cx.stroke(); cx.restore() }
    }
    cx.globalAlpha = a; const c = cx.createRadialGradient(0, 0, 0, 0, 0, R * .16); c.addColorStop(0, '#ffe9a8'); c.addColorStop(1, '#e8a86a00'); cx.fillStyle = c; cx.beginPath(); cx.arc(0, 0, R * .16, 0, 6.3); cx.fill(); cx.restore()
}
// Butterfly drawn in the site's palette: rose body, blush-to-lavender wings with soft veins and eyespots.
// Local frame: head at -y, wings spread along x. `heading` is the flight direction in radians.
function wingPath(s, fore) {
    cx.beginPath();
    if (fore) {
        cx.moveTo(0, -s * .15);
        cx.bezierCurveTo(s * .55, -s * 1.3, s * 1.5, -s * 1.1, s * 1.25, -s * .3);
        cx.bezierCurveTo(s * 1.1, s * .12, s * .55, s * .3, 0, s * .12);
    } else {
        cx.moveTo(0, s * .05);
        cx.bezierCurveTo(s * .95, s * .02, s * 1.1, s * .95, s * .5, s * 1.05);
        cx.bezierCurveTo(s * .25, s * 1.1, s * .05, s * .65, 0, s * .25);
    }
    cx.closePath();
}
function butterfly(x, y, s, heading, flap, a) {
    if (a <= 0.01) return;
    const sc = .2 + .8 * Math.abs(Math.sin(flap));          // wing opening, from closed to fully spread
    cx.save(); cx.globalAlpha = a; cx.translate(x, y); cx.rotate(heading + Math.PI / 2);
    cx.shadowColor = 'rgba(238,143,181,.55)'; cx.shadowBlur = s * .6;
    const g = cx.createLinearGradient(0, 0, s * 1.4, 0);
    g.addColorStop(0, '#c2467f'); g.addColorStop(.55, '#d9b8f2'); g.addColorStop(1, '#f8bcd3');
    for (const side of [1, -1]) {
        cx.save(); cx.scale(side * sc, 1);
        // hind wing, then fore wing on top
        wingPath(s, false); cx.fillStyle = g; cx.globalAlpha = a * .85; cx.fill();
        wingPath(s, true); cx.fillStyle = g; cx.globalAlpha = a * .95; cx.fill();
        cx.shadowBlur = 0; cx.globalAlpha = a;
        // veins
        cx.strokeStyle = 'rgba(255,240,248,.35)'; cx.lineWidth = .7;
        cx.beginPath(); cx.moveTo(0, -s * .1); cx.quadraticCurveTo(s * .6, -s * .5, s * 1.15, -s * .4);
        cx.moveTo(0, -s * .05); cx.quadraticCurveTo(s * .5, s * .05, s * .9, s * .15); cx.stroke();
        // eyespot on the hind wing
        cx.beginPath(); cx.arc(s * .5, s * .78, s * .14, 0, Math.PI * 2);
        cx.fillStyle = '#3f2f56'; cx.fill();
        cx.beginPath(); cx.arc(s * .5, s * .78, s * .07, 0, Math.PI * 2);
        cx.fillStyle = '#ffd6e4'; cx.fill();
        cx.restore();
        cx.shadowColor = 'rgba(238,143,181,.55)'; cx.shadowBlur = s * .6;
    }
    cx.shadowBlur = 0; cx.globalAlpha = a;
    // body
    cx.beginPath(); cx.ellipse(0, 0, s * .13, s * .72, 0, 0, Math.PI * 2); cx.fillStyle = '#3f2f56'; cx.fill();
    cx.beginPath(); cx.ellipse(-s * .03, -s * .1, s * .04, s * .4, 0, 0, Math.PI * 2); cx.fillStyle = 'rgba(248,188,211,.5)'; cx.fill();
    // antennae with small knobs
    cx.strokeStyle = '#3f2f56'; cx.lineWidth = .9;
    cx.beginPath(); cx.moveTo(0, -s * .6); cx.quadraticCurveTo(s * .2, -s * 1.1, s * .4, -s * 1.2);
    cx.moveTo(0, -s * .6); cx.quadraticCurveTo(-s * .2, -s * 1.1, -s * .4, -s * 1.2); cx.stroke();
    cx.beginPath(); cx.arc(s * .4, -s * 1.2, s * .05, 0, Math.PI * 2); cx.arc(-s * .4, -s * 1.2, s * .05, 0, Math.PI * 2);
    cx.fillStyle = '#ee8fb5'; cx.fill();
    cx.restore();
}

const P = [], B = []; let ptr = { x: -999, y: -999 }, sv = 0, lastY = scrollY, lastT = 0;
function spawn(x, y, burst, amb) { const a = Math.random() * 6.283, s = burst ? 2 + Math.random() * 5 : 0; P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (burst ? 2 : 0), r: Math.random() * 6.3, vr: (Math.random() - .5) * .06, s: PS, ph: Math.random() * 6.3, c: PAL[Math.random() * 5 | 0], a: 1, amb }) }
for (let i = 0; i < 34; i++)spawn(Math.random() * W, Math.random() * H, 0, 1);
addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; const n = Date.now(); if (e.pointerType === 'mouse' && n - lastT > 70) { lastT = n; spawn(e.clientX, e.clientY, 0, 0) } });
// Tap to bloom. On phones, 'click' does not fire on plain (non-button) areas, so a tap is read from
// pointerup instead: a short touch that did not move (not a scroll) makes the flower.
let tapDown = null;
addEventListener('pointerdown', e => { tapDown = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId }; }, { passive: true });
addEventListener('pointercancel', () => { tapDown = null; });
addEventListener('pointerup', e => {
    const d = tapDown; tapDown = null;
    if (!d || d.id !== e.pointerId) return;
    if (Date.now() - d.t > 500 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
    if (e.target.closest('button,.flip,input,a,.modal-card,.runner-wrap')) return;
    bloomAt(e.clientX, e.clientY);
});
function bloomAt(x, y) {
    // keep the bloom fully on screen so its petals are never cut off at the edge
    const bx = Math.max(40, Math.min(W - 40, x)), by = Math.max(40, Math.min(H - 40, y));
    B.push({ x: bx, y: by, t: 0, R: 24 + Math.random() * 28, rot: Math.random() * 6 });
    for (let i = 0; i < 14; i++)spawn(bx, by, 1, 0);
}

// Side vines: straight and fixed (no sideways sway)
function vineX(side, y) { // gentle, fixed S-curve (static)
    const pad = W < 700 ? 12 : 26, d = side ? -1 : 1, x0 = side ? W - pad : pad;
    return x0 + d * (6 + Math.sin(y * .011 + side * 1.7) * 7);
}
function leaf(x, y, ang, len, w) {
    cx.save(); cx.translate(x, y); cx.rotate(ang);
    const g = cx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, 'rgba(120,160,118,.55)'); g.addColorStop(1, 'rgba(176,206,172,.6)');
    cx.fillStyle = g; cx.beginPath(); cx.moveTo(0, 0);
    cx.bezierCurveTo(len * .3, -w, len * .75, -w * .9, len, 0);
    cx.bezierCurveTo(len * .75, w * .9, len * .3, w, 0, 0); cx.fill();
    cx.strokeStyle = 'rgba(200,225,198,.35)'; cx.lineWidth = .7; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(len * .85, 0); cx.stroke();
    cx.restore();
}
function vine(side, Y) {
    if (Y < 4) return;
    const d = side ? -1 : 1, inward = d > 0 ? 0 : Math.PI;
    // stem: tapered, thicker at the top, thinner toward the growing tip
    cx.lineCap = 'round';
    for (let y = 0; y < Y; y += 8) {
        const y2 = Math.min(Y, y + 8);
        cx.beginPath(); cx.moveTo(vineX(side, y), y); cx.lineTo(vineX(side, y2), y2);
        cx.strokeStyle = 'rgba(155,184,154,.6)'; cx.lineWidth = 2.4 - 1.2 * (y / Math.max(Y, 1)); cx.stroke();
    }
    // leaves alternate left/right of the stem, always pointing toward the screen centre
    let k = 0;
    for (let y = 90 + side * 60; y < Y - 30; y += 120, k++) {
        const x = vineX(side, y), slope = (vineX(side, y + 6) - vineX(side, y - 6)) / 12;
        const tilt = Math.atan(slope) * .6, b = clamp((Y - y) / 160), len = 22 * b;
        if (len < 2) continue;
        const sgn = k % 2 ? 1 : -1, ang = inward + tilt + sgn * .85;
        leaf(x, y, ang, len, 6.5 * b);
        if (k % 2 === 0) flower(x + Math.cos(ang) * len * 1.05, y + Math.sin(ang) * len * 1.05, (W < 700 ? 7 : 10) * b, b, y * .01, 2, 5, .9);
    }
    // curl (tendril) at the growing tip
    const tx = vineX(side, Y), r = 7;
    cx.beginPath(); cx.strokeStyle = 'rgba(155,184,154,.55)'; cx.lineWidth = 1.2;
    cx.arc(tx + Math.cos(inward) * r, Y, r, inward + Math.PI, inward + Math.PI + 4.2, false);
    cx.stroke();
}
const hero = G('home'), core = G('core'), c1 = G('c1'), c2 = G('c2'), cue = G('cue'), bar = G('bar');
function draw(t) {
    cx.clearRect(0, 0, W, H);
    const dy = scrollY - lastY; lastY = scrollY; sv += (dy - sv) * .15;
    const sp = scrollY / ((document.documentElement.scrollHeight - innerHeight) || 1);
    const hs = hero.offsetHeight - H, p = clamp(scrollY / hs), fade = 1 - seg(scrollY, hs, hs + H * .8);
    bar.style.transform = 'scaleX(' + sp + ')';
    const R = Math.min(W, H) * (W < 700 ? .4 : .36), b = ease(seg(p, 0, .62));
    // keep the big flower fully inside the screen so no petal is cut
    const fxRaw = W / 2 + (ptr.x > 0 ? (ptr.x - W / 2) * .015 : 0), fyRaw = H * .44;
    const fx = Math.max(R, Math.min(W - R, fxRaw)), fy = Math.max(R, Math.min(H - R, fyRaw));
    if (fade > 0) {
        flower(fx, fy, R * (.55 + .45 * b), b, scrollY * .0011 + t * .00005, 4, 8, fade);
        const cs = R * .5 * seg(p, .45, .72); core.style.cssText = 'left:' + fx + 'px;top:' + fy + 'px;width:' + cs + 'px;height:' + cs + 'px;opacity:' + fade
    }
    c1.style.opacity = seg(p, .02, .12) * (1 - seg(p, .36, .46)); c1.style.transform = 'translateY(' + (1 - seg(p, .02, .12)) * 24 + 'px)';
    const o2 = seg(p, .5, .68); c2.style.opacity = o2; c2.style.transform = 'translateY(' + (1 - o2) * 30 + 'px)'; cue.style.opacity = 1 - seg(p, 0, .04);
    // ONE butterfly for the whole page. It crosses the screen (left->right, then right->left on the next pass)
    // and drifts down as it goes; it fades in, flies across, fades out, and comes back on a later scroll.
    {
        const bs = Math.min(W, H) * .07, flap = t * .0075;
        const BF = window.__bfState || (window.__bfState = {});   // eased position: smooth, not jumpy
        const sy = Math.max(0, scrollY), period = H * 2.6;        // one crossing every ~2.6 screens of scrolling
        const k = Math.floor(sy / period), u = (sy - k * period) / period;
        const fromLeft = k % 2 === 0, ww = W + 100;
        const a = ease(seg(u, 0, .2)) * (1 - seg(u, .8, 1));
        const ph = u * Math.PI * 2 * 1.5;
        const x = fromLeft ? -50 + u * ww : W + 50 - u * ww;
        const y = H * (.12 + .5 * u) + Math.sin(ph) * H * .06;   // drifts down as it crosses
        const hd = Math.atan2(Math.cos(ph) * Math.PI * 3 * H * .06, fromLeft ? ww : -ww);
        if (a > .01) {
            let st = BF.one;
            if (!st || a < .05) st = BF.one = { x, y };          // (re)start from the spot, no slide across the screen
            st.x += (x - st.x) * .16; st.y += (y - st.y) * .16;
            butterfly(st.x, st.y, bs * (.5 + .5 * a), hd, flap, .95 * a);
        } else {
            delete BF.one;
        }
    }
    for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i];
        const dx = q.x - ptr.x, dyy = q.y - ptr.y, d = Math.hypot(dx, dyy); if (d < 110 && d > 0) { q.vx += dx / d * .7; q.vy += dyy / d * .4 }
        q.vx *= .98; q.vy = q.vy * .98 + .035; if (q.vy > 1.5 && q.amb) q.vy = 1.5;
        q.x += q.vx + Math.sin(t * .0012 + q.ph) * .5; q.y += q.vy - sv * .35; q.r += q.vr;
        if (q.amb) { if (q.y > H + 20) { q.y = -20; q.x = Math.random() * W } if (q.y < -40) q.y = H + 20 } else { q.a -= .005; if (q.a <= 0 || q.y > H + 30) { P.splice(i, 1); continue } }
        cx.save(); cx.translate(q.x, q.y); cx.rotate(q.r); cx.globalAlpha = (q.amb ? .55 : .9) * q.a; cx.fillStyle = q.c; petal(q.s, q.s * .5); cx.fill(); cx.restore()
    }
    for (let i = B.length - 1; i >= 0; i--) { const o = B[i]; o.t += .016; flower(o.x, o.y, o.R, ease(Math.min(1, o.t / 0.6)), o.rot + o.t * .25, 2, 6, o.t > 1.4 ? Math.max(0, 1 - (o.t - 1.4) / 0.6) : 1); if (o.t > 2) B.splice(i, 1) }
    const tl = G('tl'), tr = tl.getBoundingClientRect(); tl.style.setProperty('--p', clamp((H * .7 - tr.top) / tr.height));
    // at the very bottom of the page every point is on screen, so all of them are shown in full (the last points
    // could otherwise stop short of the scroll that lights them)
    const tlEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
    tl.querySelectorAll('li').forEach(li => { const s0 = tlEnd ? 1 : clamp((H * .88 - li.getBoundingClientRect().top) / (H * .46)); const q = s0 * s0 * (3 - 2 * s0); li.style.setProperty('--q', q.toFixed(3)); });   // scroll-linked, eased in and out: nothing shows before the year is in view
    $('.tl-words').forEach(e => { const q = clamp((H * .85 - e.getBoundingClientRect().top) / (H * .45)), ws = e.children, n = ws.length * q; for (let i = 0; i < ws.length; i++)ws[i].classList.toggle('lit', i < n) });   // timeline lines light word by word, like the About text
    $('.words').forEach(e => { const q = clamp((H * .85 - e.getBoundingClientRect().top) / (H * .45)), ws = e.children, n = ws.length * q; for (let i = 0; i < ws.length; i++)ws[i].classList.toggle('lit', i < n) });
    requestAnimationFrame(draw)
}
requestAnimationFrame(draw);
$('.words').forEach(e => e.innerHTML = e.textContent.split(' ').map(w => '<span class="w">' + w + ' </span>').join(''));
// timeline lines: split into words, lit by scroll exactly like the About text
$('.tl-words').forEach(e => e.innerHTML = e.textContent.trim().split(/\s+/).map(w => '<span class="w">' + w + '</span>').join(' '));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }), { threshold: .2, rootMargin: '0px 0px -8% 0px' });
$('.rv').forEach(e => io.observe(e));
const links = $('#nav a');
// nav tabs: each section / the hero carries data-tab; the tab of whatever crosses the middle of the screen lights up.
// (the centre line, not a % of the element, so the very tall map section lights its tab too)
const tabOf = el => el.dataset.tab;
const tabIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const t = tabOf(e.target); links.forEach(a => { const on = a.dataset.tab === t; if (on && !a.classList.contains('on')) centerNav(a); a.classList.toggle('on', on) }) }), { rootMargin: '-45% 0px -54% 0px', threshold: 0 });
tabIO.observe(hero);
$('main section').forEach(s => tabIO.observe(s));
$('.flip').forEach(f => f.onclick = () => f.classList.toggle('on'));
const rng = G('rng'), ml = G('mlabel'), L = ['Calm as a lake', 'Slightly stubborn', 'Fully committed to being right', 'Immovable, like a mountain'];
const jedVal = document.getElementById('jedval');
const meter = () => { const v = +rng.value; jedVal.textContent = v + '%'; rng.style.setProperty('--p', v + '%'); }; meter();

// ---------- Developer Info modal: opens straight away ----------
(() => {
    const button = document.getElementById('devInfoBtn');
    const modal = document.getElementById('devModal');
    if (!button || !modal) return;

    const closeButton = modal.querySelector('.close-modal');
    let open = false;
    let lastFocus = null;
    let closeTimer = 0;

    function openInfo() {
        if (open) return;
        open = true;
        lastFocus = document.activeElement;
        clearTimeout(closeTimer);
        modal.classList.remove('hidden', 'closing');
        modal.setAttribute('aria-hidden', 'false');
        button.setAttribute('aria-expanded', 'true');
        document.body.classList.add('dev-modal-open');
        if (closeButton) closeButton.focus({ preventScroll: true });
    }

    function closeInfo() {
        if (!open) return;
        open = false;
        modal.classList.remove('unfold');
        modal.classList.add('closing');
        modal.setAttribute('aria-hidden', 'true');
        button.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('dev-modal-open');
        closeTimer = setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('closing');
            if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        }, 380);
    }

    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    modal.setAttribute('aria-hidden', 'true');
    button.addEventListener('click', openInfo);
    if (closeButton) closeButton.addEventListener('click', closeInfo);
    modal.addEventListener('click', e => { if (e.target === modal) closeInfo(); });
    document.addEventListener('keydown', e => { if (open && e.key === 'Escape') closeInfo(); });
})();
// ---------- One photo at a time (gallery carousel with dots) ----------
$('.gallery').forEach(g => {
    const cards = [...g.querySelectorAll('.flip')];
    const bar2 = document.createElement('div'); bar2.className = 'g-dots';
    const dots = cards.map((c, i) => { const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Photo ' + (i + 1)); d.onclick = () => goTo(i); bar2.appendChild(d); return d });
    g.after(bar2);
    function goTo(i) {
        const gr = g.getBoundingClientRect(), cr = cards[i].getBoundingClientRect();
        g.scrollTo({ left: g.scrollLeft + (cr.left - gr.left) - (g.clientWidth - cr.width) / 2, behavior: 'smooth' });
    }
    let raf = 0;
    function update() {
        raf = 0; const mid = g.getBoundingClientRect().left + g.clientWidth / 2; let best = 0, bd = Infinity;
        cards.forEach((c, i) => { const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i } });
        dots.forEach((d, i) => d.classList.toggle('on', i === best));
        // the card in the middle gets a gentle wave (see style.css "photo wave")
        cards.forEach((c, i) => {
            if (i === best && !c.classList.contains('centre')) {
                c.classList.remove('arrive'); void c.offsetWidth; c.classList.add('arrive');
                c.addEventListener('animationend', () => c.classList.remove('arrive'), { once: true });
            }
            c.classList.toggle('centre', i === best);
        });
    }
    g.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update) }, { passive: true });
    update();
});


// ---------- Social Platforms carousel (swipe cards with dots) ----------
(function () {
    const track = document.getElementById('soc-track');
    if (!track) return;
    const cards = [...track.children];
    const bar = document.createElement('div');
    bar.className = 'g-dots';
    const dots = cards.map((c, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Profile ' + (i + 1));
        d.onclick = () => goTo(i);
        bar.appendChild(d);
        return d;
    });
    track.after(bar);
    function goTo(i) {
        const tr = track.getBoundingClientRect(), cr = cards[i].getBoundingClientRect();
        track.scrollTo({ left: track.scrollLeft + (cr.left - tr.left) - (track.clientWidth - cr.width) / 2, behavior: 'smooth' });
    }
    let raf = 0;
    function update() {
        raf = 0;
        const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
        let best = 0, bd = Infinity;
        cards.forEach((c, i) => {
            const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bd) { bd = d; best = i }
        });
        dots.forEach((d, i) => d.classList.toggle('on', i === best));
        cards.forEach((c, i) => c.classList.toggle('active', i === best));
    }
    track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update) }, { passive: true });
    update();
})();



