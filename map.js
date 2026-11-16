/* Scroll-driven map: world -> Bangladesh -> Bogura -> college -> economics department.
   Points are exact coordinates [longitude, latitude] from Wikipedia.
   Outlines come from data/world.js, data/bangladesh.js and data/bogura.js (window.MAP_SHAPES).
   Each of those files sets window.MAP_SHAPES.<name> = [ring, ring, ...], where a ring is
   an array of [longitude, latitude] pairs. Missing files just leave that layer empty. */
(() => {
    const track = document.getElementById('map-track');
    const svg = document.getElementById('map-svg');
    if (!track || !svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const SHAPES = window.MAP_SHAPES || {};

    // zoom stops: [lon min, lon max, lat min, lat max]
    const STAGES = [
        [-180, 180, -58, 84],          // 0 world
        [88.0, 92.7, 20.6, 26.7],      // 1 Bangladesh
        [89.28, 89.45, 24.78, 24.92],  // 2 Bogura (city view)
        [89.33, 89.38, 24.82, 24.87],  // 3 Govt. Azizul Haque College
        [89.35, 89.37, 24.835, 24.855] // 4 economics department (same campus; position to be confirmed)
    ];
    // exact points
    // from = scroll position (0-4) where the pin starts to appear
    const PINS = [
        { lon: 89.367, lat: 24.850, from: 0.6 },   // Bogura (city), Wikipedia
        { lon: 89.3566, lat: 24.8464, from: 2.4 } // Govt. Azizul Haque College, Wikipedia
    ];

    const landG = svg.querySelector('#map-land');
    const areaG = svg.querySelector('#map-area');
    const pinG = svg.querySelector('#map-pins');
    const labels = [...track.querySelectorAll('.map-label')];

    // [lon, lat] ring -> SVG path (x = longitude, y = -latitude)
    const toPath = pts => 'M' + pts.map(([x, y]) => x + ' ' + (-y)).join('L') + 'Z';
    function addRings(g, rings, cls) {
        (rings || []).forEach(ring => {
            const p = document.createElementNS(NS, 'path');
            p.setAttribute('d', toPath(ring));
            p.setAttribute('class', cls);
            g.appendChild(p);
        });
    }
    addRings(landG, SHAPES.world, 'land');
    // the country gets its own group so it can fade out once the zoom reaches Bogura
    const bdG = document.createElementNS(NS, 'g');
    areaG.appendChild(bdG);
    addRings(bdG, SHAPES.bangladesh, 'bd');
    const boguraG = document.createElementNS(NS, 'g');
    areaG.appendChild(boguraG);
    addRings(boguraG, SHAPES.bogura, 'bogura');

    // latitude / longitude grid, so the zoom is visible even before any outline is loaded
    const gridG = svg.querySelector('#map-grid');
    const GRID_N = 24;
    const gridLines = [];
    for (let k = 0; k < GRID_N; k++) {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('class', 'grid');
        gridG.appendChild(l);
        gridLines.push(l);
    }
    function niceStep(raw) {
        const pow = Math.pow(10, Math.floor(Math.log10(raw)));
        const f = raw / pow;
        return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * pow;
    }
    function drawGrid(x0, y0, w, h) {
        const step = niceStep(w / 5);
        let k = 0;
        for (let lon = Math.ceil(x0 / step) * step; lon <= x0 + w && k < GRID_N; lon += step) {
            const l = gridLines[k++];
            l.setAttribute('x1', lon); l.setAttribute('x2', lon);
            l.setAttribute('y1', y0); l.setAttribute('y2', y0 + h);
        }
        // latitude lines: svg y = -lat, so the visible band is y0..y0+h
        for (let lat = Math.ceil(y0 / step) * step; lat <= y0 + h && k < GRID_N; lat += step) {
            const l = gridLines[k++];
            l.setAttribute('x1', x0); l.setAttribute('x2', x0 + w);
            l.setAttribute('y1', lat); l.setAttribute('y2', lat);
        }
        for (; k < GRID_N; k++) { gridLines[k].setAttribute('x1', 0); gridLines[k].setAttribute('x2', 0); gridLines[k].setAttribute('y1', 0); gridLines[k].setAttribute('y2', 0); }
    }

    const pinEls = PINS.map(pin => {
        const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('class', 'ring');
        const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('class', 'dot');
        pinG.append(ring, dot);
        return { ...pin, ring, dot };
    });

    let ratio = 0.6;  // height / width of the map box
    function measure() {
        const r = svg.getBoundingClientRect();
        if (r.width) ratio = r.height / r.width;
    }

    // the view that fits one stop on screen, with a little margin
    function view(s) {
        const [x1, x2, y1, y2] = STAGES[s];
        return {
            cx: (x1 + x2) / 2,
            cy: -(y1 + y2) / 2,
            w: Math.max(x2 - x1, (y2 - y1) / ratio) * 1.12
        };
    }

    function frame(now) {
        const total = Math.max(1, track.offsetHeight - innerHeight);
        const p = clamp(-track.getBoundingClientRect().top / total);
        const N = STAGES.length, t = p * (N - 1);
        const i = Math.min(N - 2, Math.floor(t)), f = t - i;
        const e = f * f * (3 - 2 * f);            // smooth start and stop between stops

        const a = view(i), b = view(i + 1);
        const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), e));   // zoom in logarithmic steps
        const cx = lerp(a.cx, b.cx, e), cy = lerp(a.cy, b.cy, e), h = w * ratio;
        svg.setAttribute('viewBox', (cx - w / 2) + ' ' + (cy - h / 2) + ' ' + w + ' ' + h);
        drawGrid(cx - w / 2, cy - h / 2, w, h);

        // Bogura lies inside Bangladesh, so the country fill would cover the whole view up close
        bdG.setAttribute('opacity', clamp(1 - (t - 1.4) / 0.5));
        // close to the college the district fill would cover the frame, so only its outline stays
        boguraG.style.setProperty('--bf', (0.45 * clamp(1 - (t - 2.2) / 0.6)).toFixed(3));

        labels.forEach(el => {
            const k = +el.dataset.stage;
            const o = clamp(1 - Math.abs(t - k) / 0.6);
            el.style.opacity = o;
            el.style.transform = 'translateY(' + ((1 - o) * 12) + 'px)';
        });

        const pulse = (Math.sin(now / 400) + 1) / 2;
        pinEls.forEach(pn => {
            const o = clamp((t - pn.from) / 0.4);
            const r = w * 0.012;
            [pn.dot, pn.ring].forEach(c => { c.setAttribute('cx', pn.lon); c.setAttribute('cy', -pn.lat); });
            pn.dot.setAttribute('r', r); pn.dot.setAttribute('opacity', o);
            pn.ring.setAttribute('r', r * (2 + pulse * 1.5));
            pn.ring.setAttribute('opacity', o * (1 - pulse) * 0.8);
        });

        requestAnimationFrame(frame);
    }

    measure();
    addEventListener('resize', measure);
    requestAnimationFrame(frame);
})();
