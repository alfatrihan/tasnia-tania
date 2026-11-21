/* Personality Meter ("A Measure of Tania", under Her World).

   The six meters are Tania's Stubborn Meter and the five trait meters (Care, Trust, Freedom Lover,
   Life of the Adda, Sulk). Their titles, percentages and captions are read from the page as it is,
   never retyped here. The original horizontal layout stays in the page (hidden) so the values,
   the language switch and every existing script keep working.

   - Circles: each meter is a ring with its percentage in the centre and its name below.
   - Count-up: each ring fills and counts from 0 to its own value when the grid comes into view
     (stubborn meter first, then the traits, 150 ms apart). Reduced motion: final values at once.
   - Captions: hidden at first. Tap or click a circle to reveal its caption. Tap it again to hide it.
     Only one caption is open at a time. */
(() => {
    'use strict';

    const mega = document.querySelector('#says .mega');
    if (!mega) return;

    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const R = 44;                       // ring radius in the 100 x 100 viewBox
    const C = 2 * Math.PI * R;
    const NS = 'http://www.w3.org/2000/svg';
    const ease = t => 1 - Math.pow(1 - t, 3);

    /* ----- read the six meters from the existing markup ----- */
    const stubRng = document.getElementById('rng');
    const stubSrc = mega.querySelector('.jed.mrow');
    const traitRows = [...mega.querySelectorAll('.mbox-all .mrow')];
    if (!stubRng || !stubSrc) return;

    const meters = [];
    meters.push({
        rng: stubRng,
        pct: document.getElementById('jedval'),
        title: stubSrc.querySelector('.mtop > span'),
        caption: document.getElementById('mlabel'),
        target: parseInt(stubRng.dataset.target, 10) || 0,
        dur: 2200,
        delay: 0
    });
    traitRows.forEach((row, i) => meters.push({
        rng: row.querySelector('.trait-rng'),
        pct: row.querySelector('.mtop b'),
        title: row.querySelector('.mtop > span'),
        caption: row.querySelector('.mstatus'),
        target: parseInt(row.querySelector('.trait-rng').value, 10) || 0,
        dur: 1800,
        delay: 150 * (i + 1)
    }));

    /* ----- one meter's value: the hidden slider, its percentage, and its ring ----- */
    function setVal(m, v) {
        m.rng.value = v;
        m.rng.style.setProperty('--p', v + '%');
        if (m.pct) m.pct.textContent = v + '%';
        m.ringFg.setAttribute('stroke-dashoffset', (C * (1 - v / 100)).toFixed(2));
        m.ringPct.textContent = v + '%';
    }

    /* ----- the grid and the shared caption panel ----- */
    const grid = document.createElement('div');
    grid.className = 'pm-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Tania’s personality meters');

    /* one shared gradient for every ring (defined once) */
    const defs = document.createElementNS(NS, 'svg');
    defs.setAttribute('class', 'pm-defs');
    defs.setAttribute('aria-hidden', 'true');
    defs.setAttribute('width', '0');
    defs.setAttribute('height', '0');
    defs.innerHTML = '<defs><linearGradient id="pmGrad" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#cdb4f0"/><stop offset=".55" stop-color="#ee8fb5"/>' +
        '<stop offset="1" stop-color="#ffd6e4"/></linearGradient></defs>';

    const caption = document.createElement('div');
    caption.className = 'pm-caption';
    caption.id = 'pm-caption';
    caption.setAttribute('role', 'region');
    caption.setAttribute('aria-live', 'polite');
    caption.inert = true;
    const capIn = document.createElement('div');
    capIn.className = 'pm-caption-in';
    const capText = document.createElement('p');
    capText.className = 'pm-caption-text';
    capIn.appendChild(capText);
    caption.appendChild(capIn);

    let openIdx = -1;

    function buildItem(m, i) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pm-item';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'pm-caption');

        const ring = document.createElement('div');
        ring.className = 'pm-ring';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('aria-hidden', 'true');
        const bg = document.createElementNS(NS, 'circle');
        bg.setAttribute('class', 'pm-bg');
        bg.setAttribute('cx', '50'); bg.setAttribute('cy', '50'); bg.setAttribute('r', R);
        const fg = document.createElementNS(NS, 'circle');
        fg.setAttribute('class', 'pm-fg');
        fg.setAttribute('cx', '50'); fg.setAttribute('cy', '50'); fg.setAttribute('r', R);
        fg.setAttribute('stroke-dasharray', C.toFixed(2));
        fg.setAttribute('stroke-dashoffset', C.toFixed(2));
        fg.setAttribute('transform', 'rotate(-90 50 50)');
        svg.append(bg, fg);
        const pctEl = document.createElement('span');
        pctEl.className = 'pm-pct';
        pctEl.textContent = '0%';
        ring.append(svg, pctEl);

        const name = document.createElement('span');
        name.className = 'pm-name';
        name.append(...[...m.title.childNodes].map(n => n.cloneNode(true)));

        btn.append(ring, name);
        grid.appendChild(btn);

        m.btn = btn;
        m.ringFg = fg;
        m.ringPct = pctEl;
        m.index = i;
        btn.addEventListener('click', () => toggle(i));
    }

    /* ----- open / close: one caption at a time ----- */
    function show(i) {
        const m = meters[i];
        meters.forEach((x, j) => x.btn.setAttribute('aria-expanded', j === i ? 'true' : 'false'));
        meters.forEach((x, j) => x.btn.classList.toggle('active', j === i));
        capText.replaceChildren(...[...m.caption.childNodes].map(n => n.cloneNode(true)));
        // restart the small fade on the text when the caption changes
        capText.classList.remove('pm-swap');
        void capText.offsetWidth;
        capText.classList.add('pm-swap');
        caption.classList.add('open');
        caption.inert = false;
        openIdx = i;
    }
    function hide() {
        meters.forEach(x => { x.btn.setAttribute('aria-expanded', 'false'); x.btn.classList.remove('active'); });
        caption.classList.remove('open');
        caption.inert = true;
        openIdx = -1;
    }
    function toggle(i) {
        if (openIdx === i) hide(); else show(i);
    }

    /* ----- build ----- */
    meters.forEach((m, i) => buildItem(m, i));
    mega.prepend(grid, defs, caption);
    mega.classList.add('pm-on');        // hides the old horizontal layout (CSS)

    meters.forEach(m => setVal(m, reduce ? m.target : 0));
    if (reduce || !('IntersectionObserver' in window)) return;

    /* ----- count-up when the grid comes into view ----- */
    const run = m => {
        const t0 = performance.now() + m.delay;
        (function step(t) {
            if (t < t0) { requestAnimationFrame(step); return; }
            const k = Math.min(1, (t - t0) / m.dur);
            setVal(m, Math.round(m.target * ease(k)));
            if (k < 1) requestAnimationFrame(step);
        })(performance.now());
    };
    const io = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        io.disconnect();
        meters.forEach(run);
    }, { threshold: 0.35 });
    io.observe(grid);
})();
