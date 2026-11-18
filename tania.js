/* =====================================================================================
   Tania — inside the Economics Department room, as one scene with the room.
   -----------------------------------------------------------------------------------
   map.js calls window.TaniaRoom.update(t) once per rendered frame with the scroll value
   `t` (0..7). Everything here is a function of `t`, so scrolling back plays it in reverse.

   t 5.0 – 5.9 is map.js's own gate/door/walk-in animation (see map.js, around `gIn`,
   `dOpen`, `walk`): the gate fades in, the two doors swing open, the camera walks through,
   and by t=5.9 the gate arch has faded out and the "Inside the Economics Department"
   caption is showing. None of that is touched here. Tania's own sequence only starts once
   all of that is finished, at t=6.0, so the butterflies never appear in front of a still-
   closed door:

     6.00         the gate/door/walk animation is already finished; a swarm of butterflies
                  appears over her (she is not visible yet — covered by the swarm)
     6.00 – 6.06  swarm fades in
     6.06 – 6.12  held: the swarm just flies in place a moment before the camera moves
     6.12 – 6.62  one camera zooms into the room, with Tania and the room on the same camera.
                  The swarm stays on her the whole time, covering her face.
                  Her cut-off bottom edge lands on the bottom of the screen.
     6.62 – 6.74  the swarm scatters outward and fades; her face is revealed
     6.74         the speech bubble (Bengali) appears
     7.00         the room stays still; an extra stretch of scroll (map.js FRAME_SCROLL_VH) plays the
                  12 frames (frame-000 … frame-011) one by one: one frame at a time, no blending
     end of that stretch: talk-cycle (or lip-level audio, if a voice file is set)
   She is always fully opaque. The only exception is when she has scrolled off the top
   of the screen (under the header): then she is removed in one step, never faded — so the
   section that follows (#vibe) rises up the screen and covers her without ever showing a
   visibly cut-off head.

   The room's camera is map.js's #mi-cam group. While Tania is on screen this file takes
   that camera over (a CSS transform override plus the room svg's viewBox), so the room and
   Tania are always computed with the same camera. When she leaves, the camera is handed back
   to map.js.
   ===================================================================================== */
(() => {
    'use strict';

    /* ---------------------------------------------------------------------------
       1) CONFIG
       --------------------------------------------------------------------------- */
    const TANIA_CONFIG = {
        folderPath: 'media/frames/',
        framePrefix: 'frame-',
        frameDigits: 3,
        frameExt: '.png',
        totalFrames: 12,
        posterImage: 'media/frames/tania-poster.png',

        // Optional voice file. null = no audio request (no 404 in the console).
        audioSrc: null,

        // the speech bubble always shows this Bengali line
        speechBn: 'হ্যালো, আমি তাসনিয়া আক্তার তানিয়া, আমার পৃথিবীতে আপনাকে স্বাগতম।',
        speechEn: 'Hello, I am Tasnia Akhter Tania. Welcome to my world.',

        restFrame: 0,        // neutral pose, before the scrub
        talkOpenFrame: 10,   // "mouth open" pose while she talks
        talkRestFrame: 11,   // last frame: the pose she finishes on
        talkFallbackMs: 3200,

        // butterflies: a dense swarm covering her, then scattering
        butterflyCount: 64,          // the site's roaming butterflies, covering her completely
        butterflies: ['#ff9fd0', '#e6b6ff', '#ffc2e4', '#c8a0f7', '#ff8cc6', '#d8b0ff'],

        // timeline on the scroll value t — all after the gate/door/walk animation (t 5.0-5.9
        // in map.js) has fully finished, so the swarm never appears in front of a closed door
        swarm: [6.00, 6.06],   // the swarm fades in, over her, once the room is fully open
        zoom: [6.12, 6.62],    // camera zooms in (after a short held beat); the swarm stays on her
        scatter: [6.62, 6.86], // the butterflies stay over her until she fills the screen, then drift away slowly
        scrub: [6.62, 7.00],   // 12 frames scrubbed slowly by the scroll, after she is fully shown
        flyStart: 5.90,        // the butterflies appear once the room is fully open (far away)
        reveal: 6.40          // Tania appears once the butterflies have gathered around her
    };

    // Tania in the room's own 1000x600 scene (must match buildInteriorArt() in map.js)
    const SCENE_W = 1000, SCENE_H = 600;
    const ANCHOR = { x: 500, y: 400, vw: 190 };     // x = centre, y = her cut-off bottom edge
    const FRAME_W = 384, FRAME_H = 342;
    const RATIO = FRAME_H / FRAME_W;
    const FACE = { x: ANCHOR.x, y: ANCHOR.y - ANCHOR.vw * RATIO * 0.5, rx: ANCHOR.vw * 0.58, ry: ANCHOR.vw * RATIO * 0.62 };
    const LAST = TANIA_CONFIG.totalFrames - 1;
    const TL = { swarm: TANIA_CONFIG.swarm, zoom: TANIA_CONFIG.zoom, scatter: TANIA_CONFIG.scatter, scrub: TANIA_CONFIG.scrub };

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    const lerp = (a, b, k) => a + (b - a) * k;
    const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* ---------------------------------------------------------------------------
       2) THE CAMERA — one camera for the room and for Tania.
       k = 0 : the room as map.js shows it at rest (slice fit)
       k = 1 : camera at her, her cut edge on the bottom of the screen
       --------------------------------------------------------------------------- */
    function cameraAt(k, W, H) {
        const sc = Math.max(W / SCENE_W, H / SCENE_H);                       // slice fit
        // where map.js's walk-in leaves the camera (scale 1.65, shifted up 80): k = 0 starts exactly there
        const S0 = sc * 1.65, Cy0 = 300 + 80 / 1.65;
        // at the end she is 80% of the screen tall, or as wide as the screen allows
        const sEnd = Math.max(S0 * 1.2, Math.min(0.8 * H / (ANCHOR.vw * RATIO), 1.4 * W / ANCHOR.vw));
        const S = Math.exp(lerp(Math.log(S0), Math.log(sEnd), k));          // zoom in log steps
        const Cx = ANCHOR.x;
        const Cy = lerp(Cy0, ANCHOR.y - H / (2 * sEnd), k);                 // her bottom edge -> screen bottom at k=1
        return { S, Cx, Cy };
    }

    // the camera map.js uses while it walks in (t 5.3 - 6.0): so the butterflies can appear before Tania's camera takes over
    function walkCamera(t, W, H) {
        const w = smooth((t - 5.3) / 0.7);
        const sc = Math.max(W / SCENE_W, H / SCENE_H);
        const scale = 1 + 0.65 * w;
        return { S: sc * scale, Cx: ANCHOR.x, Cy: 300 + 80 * w / scale };
    }

    // scene point -> screen px, for a camera
    const toScreen = (c, W, H, x, y) => ({
        x: W / 2 + c.S * (x - c.Cx),
        y: H / 2 + c.S * (y - c.Cy)
    });

    let sceneSvg = null, camG = null, camOwned = false;
    const artEl = document.getElementById('map-interior-art');   // the room layer (blurred gradually during the zoom)

    function findScene() {
        if (sceneSvg && camG) return true;
        const art = document.getElementById('map-interior-art');
        sceneSvg = art ? art.querySelector('svg') : null;
        camG = art ? art.querySelector('#mi-cam') : null;
        return !!(sceneSvg && camG);
    }

    function takeCamera() {
        if (!findScene()) return false;
        if (!camOwned) { camG.style.transform = 'none'; camOwned = true; }  // overrides map.js's own walk
        return true;
    }

    function applyCamera(c, W, H) {
        const vb = [c.Cx - W / (2 * c.S), c.Cy - H / (2 * c.S), W / c.S, H / c.S];
        sceneSvg.setAttribute('viewBox', vb.map(v => v.toFixed(3)).join(' '));
    }

    function releaseCamera() {
        if (!camOwned) return;
        camG.style.transform = '';                              // map.js's walk takes over again
        sceneSvg.setAttribute('viewBox', '0 0 ' + SCENE_W + ' ' + SCENE_H);
        camOwned = false;
    }

    /* ---------------------------------------------------------------------------
       3) Frames: preloaded, drawn on a canvas
       --------------------------------------------------------------------------- */
    const frameURL = i => TANIA_CONFIG.folderPath + TANIA_CONFIG.framePrefix +
        String(i).padStart(TANIA_CONFIG.frameDigits, '0') + TANIA_CONFIG.frameExt;

    const frames = new Array(TANIA_CONFIG.totalFrames).fill(null);
    let wantIdx = TANIA_CONFIG.restFrame, lastIdx = -1;

    for (let i = 0; i < TANIA_CONFIG.totalFrames; i++) {
        const im = new Image();
        im.decoding = 'async';
        im.addEventListener('load', () => { if (i === wantIdx && ready) { lastIdx = -1; renderFrame(i); } }, { once: true });
        im.src = frameURL(i);
        frames[i] = im;
    }
    const poster = new Image();
    poster.decoding = 'async';
    poster.src = TANIA_CONFIG.posterImage;

    function frameImgFor(idx) {
        const im = frames[clamp(idx, 0, LAST)];
        if (im && im.complete && im.naturalWidth) return im;
        if (poster.complete && poster.naturalWidth) return poster;
        return null;
    }

    /* ---------------------------------------------------------------------------
       4) DOM: canvas (Tania), butterflies (over her), bubble — all inside #map-interior
       --------------------------------------------------------------------------- */
    let container = null, root = null, glow = null, canvas = null, ctx = null, flyCanvas = null, flyCtx = null, bubble = null;
    let ready = false;

    function buildDom() {
        container = document.getElementById('map-interior');
        if (!container) return false;
        root = document.createElement('div');
        root.id = 'tania-guide';
        root.setAttribute('aria-hidden', 'true');

        glow = document.createElement('div');
        glow.id = 'tania-glow';
        root.appendChild(glow);   // soft rose shadow behind her

        canvas = document.createElement('canvas');
        canvas.id = 'tania-canvas';
        ctx = canvas.getContext('2d');

        flyCanvas = document.createElement('canvas');
        flyCanvas.id = 'tania-fly';
        flyCtx = flyCanvas.getContext('2d');

        bubble = document.createElement('div');
        bubble.id = 'tania-bubble';

        root.appendChild(canvas);
        root.appendChild(flyCanvas);   // above her: the swarm covers her at first
        root.appendChild(bubble);
        container.appendChild(root);
        ready = true;
        return true;
    }

    if (!buildDom()) document.addEventListener('DOMContentLoaded', buildDom, { once: true });

    /* ---------------------------------------------------------------------------
       5) Layout for Tania, from the camera (so she is exactly where the room's desk is)
       --------------------------------------------------------------------------- */
    let cache = null;   // { W, H, dpr, finalW, finalH }
    let visible = false, lastT = -1;

    function layoutFromCamera(c, W, H) {
        const w = ANCHOR.vw * c.S;
        const h = w * RATIO;
        const bottom = toScreen(c, W, H, ANCHOR.x, ANCHOR.y).y;
        return { cx: W / 2, top: bottom - h, w, h };
    }

    function applyBackings(rect) {
        const W = rect.width, H = rect.height;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        // backing store sized for the largest view (the final size); CSS scales it while she is small
        const cEnd = cameraAt(1, W, H);
        const fin = layoutFromCamera(cEnd, W, H);
        cache = { W, H, dpr, finalW: fin.w, finalH: fin.h };
        canvas.width = Math.max(1, Math.round(fin.w * dpr));
        canvas.height = Math.max(1, Math.round(fin.h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        flyCanvas.width = Math.max(1, Math.round(W * dpr));
        flyCanvas.height = Math.max(1, Math.round(H * dpr));
        flyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastIdx = -1;
    }

    function paint(L) {
        const left = (L.cx - L.w / 2).toFixed(1) + 'px';
        glow.style.left = (L.cx - L.w * 0.7).toFixed(1) + 'px';
        glow.style.top = (L.top + L.h * 0.45).toFixed(1) + 'px';
        glow.style.width = (L.w * 1.4).toFixed(1) + 'px';
        glow.style.height = (L.h * 0.75).toFixed(1) + 'px';
        canvas.style.left = left;
        canvas.style.top = L.top.toFixed(1) + 'px';
        canvas.style.width = L.w.toFixed(1) + 'px';
        canvas.style.height = L.h.toFixed(1) + 'px';
        // wide screens: the bubble sits beside her face; narrow ones: above her head
        const side = cache && cache.W >= 700;
        bubble.classList.toggle('side', !!side);
        if (side) {
            bubble.style.left = (L.cx + L.w * 0.2).toFixed(1) + 'px';
            bubble.style.top = (L.top + L.h * 0.16).toFixed(1) + 'px';
        } else {
            bubble.style.left = L.cx.toFixed(1) + 'px';
            bubble.style.top = (L.top + L.h * 0.02).toFixed(1) + 'px';
        }
    }

    // draw an image into the w x h box without stretching it: a frame that is not loaded yet
    // falls back to the poster (a different shape), which must keep its own proportions
    // (cover-fit, anchored to the top so the face stays in view), otherwise it looks squashed
    function drawImageFit(im, w, h) {
        const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
        if (!iw || !ih) return;
        const k = Math.max(w / iw, h / ih);
        const dw = iw * k, dh = ih * k;
        ctx.drawImage(im, (w - dw) / 2, 0, dw, dh);
    }

    // draws the frame at a fractional position: the two neighbouring frames are cross-faded, so the motion is smooth
    let lastBlend = '';
    function renderBlend(pos) {
        if (!cache) return;
        const i0 = Math.floor(pos), i1 = Math.min(LAST, i0 + 1), a = pos - i0;
        const key = i0 + '|' + Math.round(a * 60);
        if (key === lastBlend) return;
        lastBlend = key; wantIdx = Math.round(pos); lastIdx = -1;
        ctx.clearRect(0, 0, cache.finalW, cache.finalH);
        const im0 = frameImgFor(i0), im1 = frameImgFor(i1);
        if (im0) drawImageFit(im0, cache.finalW, cache.finalH);
        if (im1 && a > 0.001) { ctx.globalAlpha = a; drawImageFit(im1, cache.finalW, cache.finalH); ctx.globalAlpha = 1; }
    }

    function renderFrame(idx) {
        wantIdx = idx; lastBlend = '';
        if (!cache || idx === lastIdx) return;
        const im = frameImgFor(idx);
        ctx.clearRect(0, 0, cache.finalW, cache.finalH);
        if (im) drawImageFit(im, cache.finalW, cache.finalH);
        lastIdx = idx;
    }

    /* ---------------------------------------------------------------------------
       6) Butterflies: a swarm in the scene around her body, covering her at the start.
          As the camera moves in they scatter outward and fade; gone by the halfway point.
       --------------------------------------------------------------------------- */
    // seeded random, so the swarm is the same each time
    let rs = 9317;
    const rnd = () => (rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296;
    // each butterfly starts far away in the room (small, far) and flies in toward her face as the camera comes closer
    const FLIES = Array.from({ length: TANIA_CONFIG.butterflyCount }, () => {
        const bx = FACE.x + (rnd() * 2 - 1) * FACE.rx, by = FACE.y + (rnd() * 2 - 1) * FACE.ry;   // where they gather: over her whole body
        const ang = Math.atan2(by - FACE.y, bx - FACE.x) + (rnd() - 0.5) * 0.7;                  // outward from her face, varied
        return {
            fx: 150 + rnd() * 700, fy: 190 + rnd() * 190,                                         // far away, spread over the room
            fd: 0.22 + 0.2 * rnd(),                                                              // depth: small when far
            bx, by,
            ux: Math.cos(ang), uy: Math.sin(ang),
            dist: 0.9 + 0.7 * rnd(),
            ph: rnd() * 6.28,
            sp: 0.008 + rnd() * 0.006
        };
    });

    let flyK = 0, flyP = 0, flySwarm = 0, flyAlive = false, flyDirty = false, flyCam = null, flyA = 0;
    let flyAS = 0, flyLast = 0, flyT = 0;   // flyAS: the approach, eased over time so the flight is slower than the scroll
    const flyIn = t => smooth((t - TANIA_CONFIG.flyStart) / 0.12);   // they fade in, far away
    const flyAp = t => smooth((t - TANIA_CONFIG.flyStart) / 0.6);    // 0 = far in the room, 1 = around her face

    // the site's own butterfly (same drawing as script.js), drawn onto the room layer
    const FLY_PAL = ['#c2467f', '#d9b8f2', '#f8bcd3'];
    function flyWings(ctx, s, fore) {
        ctx.beginPath();
        if (fore) {
            ctx.moveTo(0, -s * .15);
            ctx.bezierCurveTo(s * .55, -s * 1.3, s * 1.5, -s * 1.1, s * 1.25, -s * .3);
            ctx.bezierCurveTo(s * 1.1, s * .12, s * .55, s * .3, 0, s * .12);
        } else {
            ctx.moveTo(0, s * .05);
            ctx.bezierCurveTo(s * .95, s * .02, s * 1.1, s * .95, s * .5, s * 1.05);
            ctx.bezierCurveTo(s * .25, s * 1.1, s * .05, s * .65, 0, s * .25);
        }
        ctx.closePath();
    }

    function drawSiteButterfly(ctx, x, y, s, heading, flap, a) {
        if (a <= 0.01) return;
        const sc = .2 + .8 * Math.abs(Math.sin(flap));
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(heading + Math.PI / 2);
        
        const g = ctx.createLinearGradient(0, 0, s * 1.4, 0);
        g.addColorStop(0, FLY_PAL[0]); g.addColorStop(.55, FLY_PAL[1]); g.addColorStop(1, FLY_PAL[2]);
        for (const side of [1, -1]) {
            ctx.save(); ctx.scale(side * sc, 1);
            flyWings(ctx, s, false); ctx.fillStyle = g; ctx.globalAlpha = a * .85; ctx.fill();
            flyWings(ctx, s, true); ctx.fillStyle = g; ctx.globalAlpha = a * .95; ctx.fill();
            ctx.shadowBlur = 0; ctx.globalAlpha = a;
            ctx.strokeStyle = 'rgba(255,240,248,.35)'; ctx.lineWidth = .7;
            ctx.beginPath(); ctx.moveTo(0, -s * .1); ctx.quadraticCurveTo(s * .6, -s * .5, s * 1.15, -s * .4);
            ctx.moveTo(0, -s * .05); ctx.quadraticCurveTo(s * .5, s * .05, s * .9, s * .15); ctx.stroke();
            ctx.beginPath(); ctx.arc(s * .5, s * .78, s * .14, 0, Math.PI * 2); ctx.fillStyle = '#3f2f56'; ctx.fill();
            ctx.beginPath(); ctx.arc(s * .5, s * .78, s * .07, 0, Math.PI * 2); ctx.fillStyle = '#ffd6e4'; ctx.fill();
            ctx.restore();
            
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.ellipse(0, 0, s * .13, s * .72, 0, 0, Math.PI * 2); ctx.fillStyle = '#3f2f56'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-s * .03, -s * .1, s * .04, s * .4, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(248,188,211,.5)'; ctx.fill();
        ctx.strokeStyle = '#3f2f56'; ctx.lineWidth = .9;
        ctx.beginPath(); ctx.moveTo(0, -s * .6); ctx.quadraticCurveTo(s * .2, -s * 1.1, s * .4, -s * 1.2);
        ctx.moveTo(0, -s * .6); ctx.quadraticCurveTo(-s * .2, -s * 1.1, -s * .4, -s * 1.2); ctx.stroke();
        ctx.beginPath(); ctx.arc(s * .4, -s * 1.2, s * .05, 0, Math.PI * 2); ctx.arc(-s * .4, -s * 1.2, s * .05, 0, Math.PI * 2);
        ctx.fillStyle = '#ee8fb5'; ctx.fill();
        ctx.restore();
    }

    // a soft rose mist around her, made of many drifting puffs of different sizes. It drifts in from far away,
    // thickens around her, and then dissolves outward. Pink on the light side, a little lilac in the shade.
    const MIST = Array.from({ length: 34 }, (_, i) => ({
        x: (rnd() * 2 - 1) * 120,                                                // across her width
        y: (rnd() * 2 - 1) * 120,                                                // from above her head to below her cut edge
        r: 0.28 + 0.3 * rnd(),                                                   // size, in units of her width
        w: 1.2 + 0.8 * rnd(),                                                    // stretched sideways, like low mist
        a: 0.2 + 0.2 * rnd(),
        shade: i % 4 === 0,                                                      // every 4th puff is a deeper lilac, for depth
        ph: rnd() * 6.28,
        sp: 0.0005 + 0.0005 * rnd()
    }));

    function drawMist(c, W, H, alpha, A, now, pK) {
        const spread = 2.2 - 1.2 * A;                                            // far: spread across the room; near: gathered
        const rise = pK * 120;                                                   // while it clears it lifts and widens
        MIST.forEach(m => {
            const sx = 500 + m.x * spread + Math.sin(now * m.sp + m.ph) * 10 * (1 - pK) + m.x * pK * 0.8;
            const sy = 315 + m.y * spread + Math.cos(now * m.sp * 1.3 + m.ph) * 6 * (1 - pK) - rise;
            const p = toScreen(c, W, H, sx, sy);
            const R = ANCHOR.vw * m.r * (0.55 + 0.45 * A) * (1 + pK * 0.6) * c.S;
            const k = (1 - smooth((pK - 0.4) / 0.6)) * alpha;
            if (k <= 0.01) return;
            // each puff is a flattened, sideways-stretched soft cloud
            flyCtx.save();
            flyCtx.translate(p.x, p.y); flyCtx.scale(m.w, 0.6);
            const g = flyCtx.createRadialGradient(0, 0, 0, 0, 0, R);
            if (m.shade) {
                g.addColorStop(0, 'rgba(170, 118, 192, ' + (m.a * k).toFixed(3) + ')');
                g.addColorStop(0.5, 'rgba(170, 118, 192, ' + (m.a * 0.45 * k).toFixed(3) + ')');
            } else {
                g.addColorStop(0, 'rgba(255, 214, 234, ' + (m.a * k).toFixed(3) + ')');
                g.addColorStop(0.5, 'rgba(244, 180, 216, ' + (m.a * 0.5 * k).toFixed(3) + ')');
            }
            g.addColorStop(1, 'rgba(232, 160, 206, 0)');
            flyCtx.fillStyle = g;
            flyCtx.beginPath(); flyCtx.arc(0, 0, R, 0, Math.PI * 2); flyCtx.fill();
            flyCtx.restore();
        });
    }

    // Tania shows only once the time has come AND the butterflies have gathered over her
    function syncShown() {
        const on = flyT >= TANIA_CONFIG.reveal && flyAS > 0.85;
        if (canvas) canvas.style.visibility = on ? 'visible' : 'hidden';
        if (glow) glow.style.opacity = on ? '0.9' : '0';
    }

    function drawFlies(now) {
        if (!cache || !flyCam) return;
        const W = cache.W, H = cache.H, c = flyCam;
        flyCtx.clearRect(0, 0, W, H);
        const pK = flyP;                                                     // 0 = gathered, 1 = gone
        const alpha = clamp(flySwarm * (1 - smooth((pK - 0.55) / 0.45)));    // fades out as they leave
        if (alpha <= 0.01) return;
        const reach = Math.max(W, H) * 1.2;
        // ease the approach over time (about one second to settle), so the butterflies drift in slowly
        const dt = flyLast ? Math.min(64, now - flyLast) : 16;
        flyLast = now;
        flyAS += (flyA - flyAS) * (1 - Math.exp(-dt / 380));
        syncShown();
        drawMist(c, W, H, alpha, flyAS, now, pK);                                // mist only: no butterflies in the room
        return;
        FLIES.forEach(f => {
            const A = flyAS;
            const wx = Math.sin(now / 900 + f.ph) * 10 * (1 - pK), wy = Math.cos(now / 1100 + f.ph) * 8 * (1 - pK);
            const sx = lerp(f.fx, f.bx, A) + wx, sy = lerp(f.fy, f.by, A) + wy;   // scene position, far -> near
            const depth = lerp(f.fd, 1, A);                                       // perspective: far ones are small
            const size = clamp(0.24 * ANCHOR.vw * c.S * depth, 4, 110);
            const p = toScreen(c, W, H, sx, sy);
            const d = pK * f.dist * reach;                                        // then they fly off, smoothly
            drawSiteButterfly(flyCtx, p.x + f.ux * d, p.y + f.uy * d, size,
                Math.atan2(f.uy, f.ux), now * f.sp + f.ph, alpha);
        });
    }

    /* ---------------------------------------------------------------------------
       7) Speech bubble, audio and talk-cycle. The talk runs only at the end of the scroll.
       --------------------------------------------------------------------------- */
    let greetOn = false, talkOn = false, talkDone = false, talkDeadline = 0;
    let audioEl = null, audioCtxObj = null, analyser = null, dataArr = null, usingAudioLevel = false;
    let rafId = 0;

    // the bubble follows the site's language toggle (English or Bangla)
    const speechText = () => document.documentElement.lang === 'bn' ? TANIA_CONFIG.speechBn : TANIA_CONFIG.speechEn;
    function setGreeting(on) {
        if (on === greetOn) return;
        greetOn = on;
        if (on) {
            bubble.textContent = speechText();
            bubble.classList.add('show');
        } else {
            bubble.classList.remove('show');
        }
    }

    function playGreetingAudio() {
        if (!TANIA_CONFIG.audioSrc) return;
        const el = new Audio();
        el.preload = 'auto';
        el.addEventListener('canplaythrough', () => {
            if (!talkOn) return;
            if (window.siteMusic) window.siteMusic.pause();
            el.play().then(() => {
                try {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    audioCtxObj = new AC();
                    const src = audioCtxObj.createMediaElementSource(el);
                    analyser = audioCtxObj.createAnalyser();
                    analyser.fftSize = 256;
                    dataArr = new Uint8Array(analyser.frequencyBinCount);
                    src.connect(analyser);
                    analyser.connect(audioCtxObj.destination);
                    usingAudioLevel = true;
                } catch (e) { usingAudioLevel = false; }
            }).catch(() => { /* autoplay blocked: the timed talk-cycle keeps running */ });
            el.addEventListener('ended', () => { talkDone = true; stopTalk(); }, { once: true });
        }, { once: true });
        el.src = TANIA_CONFIG.audioSrc;
        audioEl = el;
    }

    function startTalk() {
        talkOn = true;
        talkDeadline = performance.now() + TANIA_CONFIG.talkFallbackMs;
        playGreetingAudio();
        kick();
    }

    function stopTalk() {
        if (!talkOn) return;
        talkOn = false;
        if (audioEl) { try { audioEl.pause(); } catch (e) { /* ignore */ } audioEl = null; }
        if (audioCtxObj) { try { audioCtxObj.close(); } catch (e) { /* ignore */ } audioCtxObj = null; }
        analyser = null;
        usingAudioLevel = false;
        if (window.siteMusic) window.siteMusic.resume();
        renderFrame(TANIA_CONFIG.talkRestFrame);
    }

    function setTalk(want) {
        if (want && !talkOn && !talkDone && !reduceMotion) startTalk();
        else if (!want && talkOn) stopTalk();
        if (!want) talkDone = false;
    }

    /* ---------------------------------------------------------------------------
       8) One small animation loop, only while something moves (butterflies or talk).
       --------------------------------------------------------------------------- */
    function kick() {
        if (!rafId && visible) rafId = requestAnimationFrame(tick);
    }

    function tick(now) {
        rafId = 0;
        if (!visible || !cache) return;

        if (talkOn) {
            let open;
            if (usingAudioLevel && analyser) {
                analyser.getByteFrequencyData(dataArr);
                let sum = 0;
                for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
                open = sum / dataArr.length / 255 > 0.12;
            } else if (now < talkDeadline) {
                open = Math.floor(now / 260) % 2 === 0;
            } else {
                talkDone = true;
                stopTalk();
                open = false;
            }
            if (talkOn) renderFrame(open ? TANIA_CONFIG.talkOpenFrame : TANIA_CONFIG.talkRestFrame);
        }

        if (flyAlive) drawFlies(now);
        if (talkOn || flyAlive) kick();
    }

    /* ---------------------------------------------------------------------------
       9) Navbar exit: as the stage scrolls up past the end of the track, fade her out before
          her head reaches the fixed header. The room itself scrolls on as map.js moves it.
       --------------------------------------------------------------------------- */
    function exitedUnderHeader(rect, L) {
        if (rect.top > -1) return false;                              // stage still stuck at the top
        const header = document.querySelector('header');
        const navBottom = header ? header.getBoundingClientRect().bottom : 70;
        const headY = rect.top + L.top + L.h * 0.04;
        return headY <= navBottom + 6;
    }

    function fadeUnderHeader(rect, L) {
        if (rect.top > -1) return 1;                                  // stage still stuck at the top
        const header = document.querySelector('header');
        const navBottom = header ? header.getBoundingClientRect().bottom : 70;
        const headY = rect.top + L.top + L.h * 0.04;
        return smooth((headY - navBottom) / (L.h * 0.22));           // 1 = fully shown, 0 = gone
    }

    function hide() {
        if (visible) {
            visible = false;
            root.style.visibility = 'hidden';
            setGreeting(false);
            stopTalk();
            talkDone = false;
            flyAlive = false;
            releaseCamera();
        }
        if (flyDirty && cache) { flyCtx.clearRect(0, 0, cache.W, cache.H); flyDirty = false; }
    }

    /* ---------------------------------------------------------------------------
       10) The entry point map.js calls once per rendered frame.
       --------------------------------------------------------------------------- */
    let lastEx = 0;
    function update(t, ex) {
        if (!ready || !container) return;
        lastT = t; lastEx = ex || 0;

        const rect = container.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) { hide(); return; }
        if (!cache || cache.W !== rect.width || cache.H !== rect.height) applyBackings(rect);

        // before the camera reaches her, nothing of her is shown; the room walks in on map.js's own camera
        if (t < TL.swarm[0] || !takeCamera()) { hide(); return; }
        if (!visible) visible = true;

        // the one camera: the room and Tania both use it (zoom in until her cut edge is on the bottom of the screen)
        const W = rect.width, H = rect.height;
        const k = smooth((t - TL.zoom[0]) / (TL.zoom[1] - TL.zoom[0]));
        const sr = sceneSvg.getBoundingClientRect();
        const SW = sr.width || W, SH = sr.height || H;          // the room's own box, as map.js draws it
        const c = cameraAt(k, SW, SH);
        applyCamera(c, SW, SH);
        const L = layoutFromCamera(c, W, H);
        paint(L);

        // she fades in smoothly as the zoom reaches its end, and then stays (the page scrolls on past her)
        // leaving under the header: she fades out smoothly over the scroll, rather than vanishing in one step
        const keep = fadeUnderHeader(rect, L);
        const gone = keep <= 0.001;
        root.style.visibility = gone ? 'hidden' : 'visible';
        root.style.opacity = keep.toFixed(3);
        // she shows only once the zoom is complete (her cut edge on the bottom of the screen)
        const fade = smooth((k - 0.97) / 0.03);
        canvas.style.opacity = fade.toFixed(3);
        glow.style.opacity = (0.9 * fade).toFixed(3);

        // the room is sharp when the gate opens, and gradually goes out of focus as the camera moves in
        if (artEl) artEl.style.filter = k > 0.001 ? 'blur(' + (2.5 * k).toFixed(2) + 'px)' : 'none';

        // frames: the extra scroll after the zoom plays the 12 frames one at a time, in order, forwards and backwards
        const full = t >= TL.zoom[1];
        const inTail = t >= TL.scrub[1] - 1e-4;
        const atEnd = inTail && lastEx >= 0.999;
        setGreeting(full && !gone);
        setTalk(atEnd && full && !gone);
        // plain frame by frame: every slice of the extra scroll shows exactly one frame, no blending
        if (!talkOn) renderFrame(inTail ? Math.min(LAST, Math.floor(lastEx * (LAST + 1))) : TANIA_CONFIG.restFrame);
    }

    // the page scrolls without the map's frame loop always running, so re-run on scroll and resize
    let refreshRaf = 0;
    const refresh = () => {
        if (refreshRaf) return;
        refreshRaf = requestAnimationFrame(() => { refreshRaf = 0; if (lastT >= 0) update(lastT, lastEx); });
    };
    addEventListener('scroll', refresh, { passive: true });
    addEventListener('resize', refresh, { passive: true });

    // language switched while she is talking: update the bubble text straight away
    new MutationObserver(() => { if (greetOn && bubble) bubble.textContent = speechText(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    window.TaniaRoom = { update };
})();
