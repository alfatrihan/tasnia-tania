/* Scroll-driven map: Bangladesh -> Bogura district -> Bogura city -> college -> economics department.
   Coordinates are [longitude, latitude]. Outlines come from data/bangladesh.js and data/bogura.js (window.MAP_SHAPES).
   District label positions are approximate centres of each district. The college and department share one spot
   on the map (same campus; the department's exact position is still to be confirmed). */
(() => {
    const track = document.getElementById('map-track');
    const svg = document.getElementById('map-svg');
    if (!track || !svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const SHAPES = window.MAP_SHAPES || {};

    // zoom stops: [lon min, lon max, lat min, lat max]. The first stop is the whole of Bangladesh.
    const STAGES = [
        [88.0, 92.7, 20.6, 26.7],       // 0 Bangladesh
        [88.9, 89.8, 24.5, 25.2],       // 1 Bogura district
        [89.28, 89.45, 24.78, 24.92],   // 2 Bogura city
        [89.33, 89.38, 24.82, 24.87],   // 3 Govt. Azizul Haque College
        [89.35, 89.37, 24.835, 24.855]  // 4 economics department
    ];

    // from = scroll position (0-4) where the pin starts to appear
    const PINS = [
        { lon: 89.367, lat: 24.850, from: 0.6 },    // Bogura
        { lon: 89.3566, lat: 24.8464, from: 2.4 }   // Govt. Azizul Haque College
    ];

    // label placement around its dot: a = above, b = below, l = left, r = right
    const POS = {
        a: { anchor: 'middle', dx: 0, dy: -6 },
        b: { anchor: 'middle', dx: 0, dy: 12 },
        t: { anchor: 'middle', dx: 0, dy: -26 },   // higher above the dot, for the college name
        l: { anchor: 'end', dx: -7, dy: 3 },
        r: { anchor: 'start', dx: 7, dy: 3 }
    };

    // all 64 districts: [English, Bangla, longitude, latitude, placement]
    const DISTRICTS = [
        ['Dhaka', 'ঢাকা', 90.40, 23.81, 'a'],
        ['Faridpur', 'ফরিদপুর', 89.84, 23.61, 'l'],
        ['Gazipur', 'গাজীপুর', 90.42, 24.00, 'a'],
        ['Gopalganj', 'গোপালগঞ্জ', 89.83, 23.00, 'l'],
        ['Kishoreganj', 'কিশোরগঞ্জ', 90.78, 24.44, 'a'],
        ['Madaripur', 'মাদারীপুর', 90.19, 23.16, 'l'],
        ['Manikganj', 'মানিকগঞ্জ', 90.00, 23.86, 'l'],
        ['Munshiganj', 'মুন্সীগঞ্জ', 90.53, 23.54, 'b'],
        ['Narayanganj', 'নারায়ণগঞ্জ', 90.50, 23.62, 'l'],
        ['Narsingdi', 'নরসিংদী', 90.72, 23.92, 'r'],
        ['Rajbari', 'রাজবাড়ী', 89.64, 23.76, 'l'],
        ['Shariatpur', 'শরীয়তপুর', 90.34, 23.23, 'a'],
        ['Tangail', 'টাঙ্গাইল', 89.92, 24.25, 'b'],
        ['Chattogram', 'চট্টগ্রাম', 91.80, 22.36, 'a'],
        ['Bandarban', 'বান্দরবান', 92.19, 22.20, 'r'],
        ['Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 91.11, 23.96, 'a'],
        ['Chandpur', 'চাঁদপুর', 90.64, 23.23, 'r'],
        ['Cumilla', 'কুমিল্লা', 91.18, 23.46, 'a'],
        ["Cox's Bazar", 'কক্সবাজার', 92.00, 21.44, 'r'],
        ['Feni', 'ফেনী', 91.40, 23.02, 'r'],
        ['Khagrachhari', 'খাগড়াছড়ি', 91.97, 23.12, 'a'],
        ['Lakshmipur', 'লক্ষ্মীপুর', 90.84, 22.94, 'r'],
        ['Noakhali', 'নোয়াখালী', 91.10, 22.87, 'r'],
        ['Rangamati', 'রাঙ্গামাটি', 92.20, 22.73, 'r'],
        ['Barishal', 'বরিশাল', 90.36, 22.70, 'a'],
        ['Barguna', 'বরগুনা', 90.12, 22.10, 'l'],
        ['Bhola', 'ভোলা', 90.65, 22.20, 'r'],
        ['Jhalokati', 'ঝালকাঠি', 90.20, 22.64, 'l'],
        ['Patuakhali', 'পটুয়াখালী', 90.33, 22.36, 'r'],
        ['Pirojpur', 'পিরোজপুর', 89.97, 22.58, 'b'],
        ['Joypurhat', 'জয়পুরহাট', 89.03, 25.10, 'a'],
        ['Naogaon', 'নওগাঁ', 88.94, 24.80, 'l'],
        ['Natore', 'নাটোর', 89.00, 24.42, 'a'],
        ['Chapai Nawabganj', 'চাঁপাইনবাবগঞ্জ', 88.27, 24.60, 'l'],
        ['Pabna', 'পাবনা', 89.00, 24.00, 'l'],
        ['Rajshahi', 'রাজশাহী', 88.60, 24.37, 'l'],
        ['Sirajganj', 'সিরাজগঞ্জ', 89.70, 24.45, 'a'],
        ['Khulna', 'খুলনা', 89.55, 22.82, 'r'],
        ['Bagerhat', 'বাগেরহাট', 89.78, 22.65, 'l'],
        ['Chuadanga', 'চুয়াডাঙ্গা', 88.85, 23.64, 'l'],
        ['Jashore', 'যশোর', 89.22, 23.17, 'a'],
        ['Jhenaidah', 'ঝিনাইদহ', 89.17, 23.54, 'r'],
        ['Kushtia', 'কুষ্টিয়া', 89.12, 23.90, 'a'],
        ['Magura', 'মাগুরা', 89.42, 23.49, 'r'],
        ['Meherpur', 'মেহেরপুর', 88.63, 23.76, 'a'],
        ['Narail', 'নড়াইল', 89.50, 23.17, 'r'],
        ['Satkhira', 'সাতক্ষীরা', 89.07, 22.33, 'l'],
        ['Mymensingh', 'ময়মনসিংহ', 90.40, 24.75, 'a'],
        ['Jamalpur', 'জামালপুর', 89.94, 24.92, 'l'],
        ['Netrokona', 'নেত্রকোণা', 90.73, 24.87, 'r'],
        ['Sherpur', 'শেরপুর', 90.01, 25.02, 'a'],
        ['Dinajpur', 'দিনাজপুর', 88.63, 25.63, 'l'],
        ['Gaibandha', 'গাইবান্ধা', 89.53, 25.33, 'l'],
        ['Kurigram', 'কুড়িগ্রাম', 89.67, 25.80, 'r'],
        ['Lalmonirhat', 'লালমনিরহাট', 89.28, 25.92, 'r'],
        ['Nilphamari', 'নীলফামারী', 88.95, 25.93, 'a'],
        ['Panchagarh', 'পঞ্চগড়', 88.55, 26.34, 'r'],
        ['Rangpur', 'রংপুর', 89.25, 25.74, 'b'],
        ['Thakurgaon', 'ঠাকুরগাঁও', 88.46, 26.03, 'l'],
        ['Habiganj', 'হবিগঞ্জ', 91.42, 24.38, 'r'],
        ['Moulvibazar', 'মৌলভীবাজার', 91.40, 24.48, 'l'],
        ['Sunamganj', 'সুনামগঞ্জ', 91.41, 25.07, 'r'],
        ['Sylhet', 'সিলেট', 91.87, 24.89, 'r']
    ];

    const boguraLabel = { en: 'Bogura', bn: 'বগুড়া', lon: 89.367, lat: 24.850 };

    const bdG = svg.querySelector('#map-area');
    const cityG = svg.querySelector('#map-city');
    const dotG = svg.querySelector('#map-dots');
    const nameG = svg.querySelector('#map-names');
    const pinG = svg.querySelector('#map-pins');

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

    // the country and the district each get their own group so they can fade as the zoom goes in
    const countryG = document.createElementNS(NS, 'g');
    bdG.appendChild(countryG);
    addRings(countryG, SHAPES.bangladesh, 'bd');
    const boguraG = document.createElementNS(NS, 'g');
    bdG.appendChild(boguraG);
    addRings(boguraG, SHAPES.bogura, 'bogura');


    // ---------- illustrative city: buildings and roads, grown in when a district comes on ----------
    // not surveyed; placed by a seeded random generator so it looks the same on every visit
    let seed = 20240711;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const CITY_COLORS = ['', 'c1', 'c2'];
    const cityBuild = [], cityRoad = [];
    let lastCityFade = '', cityStart = null;   // time the city started to grow; null while the city is off
    function buildCity(lon, lat, R, count, roads) {
        for (let k = 0; k < count; k++) {
            const a = rnd() * Math.PI * 2;
            const r = R * Math.pow(rnd(), 0.7);
            const x = lon + Math.cos(a) * r, y = -lat + Math.sin(a) * r * 0.8;
            const bw = 0.0009 + rnd() * 0.0016, bh = 0.0009 + rnd() * 0.0018;
            const rect = document.createElementNS(NS, 'rect');
            const pick = rnd();
            rect.setAttribute('class', 'b ' + (pick < 0.12 ? CITY_COLORS[1] : pick < 0.18 ? CITY_COLORS[2] : CITY_COLORS[0]));
            rect.setAttribute('x', (x - bw / 2).toFixed(5));
            rect.setAttribute('y', (y - bh / 2).toFixed(5));
            rect.setAttribute('width', bw.toFixed(5));
            rect.setAttribute('height', 0);
            cityG.appendChild(rect);
            cityBuild.push({ el: rect, x: x - bw / 2, bottom: y + bh / 2, w: bw, h: bh, d: r / R });   // grows outward from the centre
        }
        for (let k = 0; k < roads; k++) {
            let x = lon, y = -lat;
            let dir = rnd() * Math.PI * 2;
            let d = 'M' + x.toFixed(5) + ' ' + y.toFixed(5);
            for (let s = 0; s < 4; s++) {
                dir += (rnd() - 0.5) * 0.8;
                const step = R * (0.35 + rnd() * 0.35);
                x += Math.cos(dir) * step; y += Math.sin(dir) * step * 0.8;
                d += 'L' + x.toFixed(5) + ' ' + y.toFixed(5);
            }
            const p = document.createElementNS(NS, 'path');
            p.setAttribute('class', 'road');
            p.setAttribute('d', d);
            cityG.appendChild(p);
            cityRoad.push(p);
        }
    }
    DISTRICTS.forEach(([, , lon, lat]) => buildCity(lon, lat, 0.035, 42, 3));
    buildCity(boguraLabel.lon, boguraLabel.lat, 0.07, 160, 6);   // Bogura: denser, the city centre

    // ---------- labels ----------
    const LABELS = [];
    function text(cls, lang, str) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('class', cls + ' lang-' + lang);
        t.textContent = str;
        nameG.appendChild(t);
        return t;
    }
    function dot(cls) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('class', 'd ' + cls);
        dotG.appendChild(c);
        return c;
    }
    // o: { en, bn, lon, lat, pos, cls, op(t), px(t), dEn?, dBn?, dpx?, withDot }
    function addLabel(o) {
        const item = {
            ...o,
            dot: o.withDot ? dot(o.cls) : null,
            names: [text('nm ' + o.cls, 'en', o.en), text('nm ' + o.cls, 'bn', o.bn)],
            descs: o.dEn ? [text('ds', 'en', o.dEn), text('ds', 'bn', o.dBn)] : []
        };
        LABELS.push(item);
    }

    const ease01 = v => { v = clamp(v); return 1 - Math.pow(1 - v, 3); };
    // rises with a small overshoot, so the buildings feel like they spring up
    const easeBack = v => { v = clamp(v); const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2); };
    const life = (from, to) => t => clamp((t - from) / (to - from));

    DISTRICTS.forEach(([en, bn, lon, lat, pos]) => addLabel({
        en, bn, lon, lat, pos, cls: 'dist', withDot: true,
        op: () => 1, px: () => 7
    }));

    // Bogura: the light name turns into a bold, larger name as the zoom reaches the district
    const boguraIn = life(0.5, 1.2);
    const boguraOut = t => 1 - life(2.0, 2.4)(t);
    addLabel({ ...boguraLabel, pos: 'a', cls: 'dist', withDot: false,
        op: t => (1 - boguraIn(t)) * 1, px: () => 9.5 });
    addLabel({ ...boguraLabel, pos: 'a', cls: 'bogura', withDot: true,
        op: t => boguraIn(t) * boguraOut(t), px: t => lerp(11, 18, life(0.5, 2.0)(t)) });

    // the college and the department appear one after another, in bold, with a short line of description
    addLabel({ en: 'Govt. Azizul Haque College', bn: 'গভর্নমেন্ট আজিজুল হক কলেজ',
        dEn: 'College of Bogura', dBn: 'গভর্নমেন্ট কলেজ অফ বগুড়া',
        lon: 89.3566, lat: 24.8464, pos: 't', cls: 'poi', withDot: false,
        op: life(2.2, 2.7), px: () => 15, dpx: () => 10 });
    addLabel({ en: 'Economics Department', bn: 'অর্থনীতি বিভাগ',
        dEn: 'Social Science', dBn: 'সমাজবিজ্ঞান',
        lon: 89.36, lat: 24.845, pos: 'b', cls: 'poi', withDot: false,
        op: life(3.2, 3.7), px: () => 15, dpx: () => 10 });

    // ---------- pins ----------
    const pinEls = PINS.map(pin => {
        const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('class', 'ring');
        const d = document.createElementNS(NS, 'circle'); d.setAttribute('class', 'pin');
        pinG.append(ring, d);
        return { ...pin, ring, dot: d };
    });

    let ratio = 0.6;   // height / width of the map box
    let pxW = 760;     // width of the map box in pixels
    function measure() {
        const r = svg.getBoundingClientRect();
        if (r.width) { ratio = r.height / r.width; pxW = r.width; }
    }

    // the view that fits one stop on screen, with a little margin
    function view(s) {
        const [x1, x2, y1, y2] = STAGES[s];
        return {
            cx: (x1 + x2) / 2,
            cy: -(y1 + y2) / 2,
            w: Math.max(x2 - x1, (y2 - y1) / ratio) * (ratio > 1.2 ? 1.25 : 1.1)   // tall phone screens get extra side room for the names
        };
    }

    const POS_SET = (el, x, y, anchor) => {
        el.setAttribute('x', x);
        el.setAttribute('y', y);
        el.setAttribute('text-anchor', anchor);
    };

    function frame(now) {
        if (!visible) { requestAnimationFrame(frame); return; }   // off screen: skip all the work
        const total = Math.max(1, track.offsetHeight - innerHeight);
        const lead = innerHeight * 0.25;   // the map waits a moment before it starts to zoom
        const p = clamp((-track.getBoundingClientRect().top - lead) / (total - lead));
        const N = STAGES.length, t = p * (N - 1);
        const i = Math.min(N - 2, Math.floor(t)), f = t - i;
        const e = f * f * (3 - 2 * f);            // smooth start and stop between stops

        const a = view(i), b = view(i + 1);
        const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), e));   // zoom in logarithmic steps
        const cx = lerp(a.cx, b.cx, e), cy = lerp(a.cy, b.cy, e), h = w * ratio;
        svg.setAttribute('viewBox', (cx - w / 2) + ' ' + (cy - h / 2) + ' ' + w + ' ' + h);

        const u = w / pxW;   // SVG units per screen pixel: keeps names the same size on screen

        // the country fades once the zoom is inside Bogura, the district fill only lightly tints it
        countryG.setAttribute('opacity', clamp(1 - (t - 0.6) / 0.8).toFixed(3));
        const cityFade = clamp((t - 0.4) / 0.4).toFixed(3);
        if (cityFade !== lastCityFade) { cityG.style.opacity = cityFade; lastCityFade = cityFade; }
        const cityOn = t > 0.7;
        if (cityOn && cityStart === null) cityStart = now;
        if (!cityOn && cityStart !== null) {
            // reset so the city grows again the next time it comes on
            cityStart = null;
            cityBuild.forEach(b => { b.el.setAttribute('height', 0); b.done = false; });
        }
        if (cityOn) {
            const age = now - cityStart;
            cityBuild.forEach(b => {
                if (b.done) return;                       // already fully grown: no more DOM writes
                const raw = clamp((age - b.d * 450) / 600);
                if (raw <= 0) return;
                const g = easeBack(raw);
                b.el.setAttribute('y', (b.bottom - b.h * g).toFixed(5));
                b.el.setAttribute('height', (b.h * g).toFixed(5));
                if (raw >= 1) b.done = true;
            });
        }
        boguraG.style.setProperty('--bf', (0.2 * clamp((t - 0.4) / 0.6) * clamp(1 - (t - 1.8) / 0.6)).toFixed(3));

        LABELS.forEach(l => {
            const o = clamp(l.op(t));
            const px = l.px(t);
            const pl = POS[l.pos];
            const x0 = l.lon, y0 = -l.lat;
            const x = x0 + pl.dx * u, y = y0 + pl.dy * u;
            const fs = (px * u).toFixed(4);
            const halo = (2.5 * u).toFixed(4);
            l.names.forEach(el => {
                POS_SET(el, x, y, pl.anchor);
                el.setAttribute('font-size', fs);
                el.setAttribute('stroke-width', halo);
                el.style.opacity = o;
            });
            l.descs.forEach(el => {
                const dfs = (l.dpx(t) * u).toFixed(4);
                POS_SET(el, x, y + px * 1.3 * u, pl.anchor);
                el.setAttribute('font-size', dfs);
                el.setAttribute('stroke-width', halo);
                el.style.opacity = o;
            });
            if (l.dot) {
                l.dot.setAttribute('cx', x0);
                l.dot.setAttribute('cy', y0);
                l.dot.setAttribute('r', (2 * u).toFixed(4));
                l.dot.style.opacity = o * 0.9;
            }
        });

        const pulse = (Math.sin(now / 400) + 1) / 2;
        pinEls.forEach(pn => {
            const o = clamp((t - pn.from) / 0.4);
            const r = 5 * u;
            [pn.dot, pn.ring].forEach(c => { c.setAttribute('cx', pn.lon); c.setAttribute('cy', -pn.lat); });
            pn.dot.setAttribute('r', r.toFixed(4)); pn.dot.setAttribute('opacity', o);
            pn.ring.setAttribute('r', (r * (2 + pulse * 1.5)).toFixed(4));
            pn.ring.setAttribute('opacity', o * (1 - pulse) * 0.8);
        });

        requestAnimationFrame(frame);
    }

    measure();
    addEventListener('resize', measure);
    let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(track);
    requestAnimationFrame(frame);
})();
