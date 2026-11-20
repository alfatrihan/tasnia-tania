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
        [89.35, 89.37, 24.835, 24.855],  // 4 economics department
        [89.35996, 89.36004, 24.844872, 24.844878],  // 5 at the department door (the 3D camera ends here)
        [89.35996, 89.36004, 24.844872, 24.844878],  // 6 inside the building (held)
        [89.35996, 89.36004, 24.844872, 24.844878]   // 7 held again: extra scroll room for Tania (tania.js), t 6-7
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
    const interior = document.getElementById('map-interior');
    const interiorArt = document.getElementById('map-interior-art');
    let lastInside = -1;
    let camG = null, gateG = null, doorL = null, doorR = null, capEl = null;

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
    addRings(boguraG, SHAPES.boguraFill, 'bogura gapfill');   // the gap (no outline of its own), under the upazila rings
    addRings(boguraG, SHAPES.bogura, 'bogura');


    // ---------- illustrative city: realistic-looking blocks (lit windows, floor bands, rooftop units), trees and roads ----------
    // not surveyed; placed by a seeded random generator so it looks the same on every visit
    let seed = 20240711;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const CITY_COLORS = ['', 'c1', 'c2'];
    const cityRoad = [], cityBuildNear = [];   // cityBuildNear: the detailed clusters close to the college - the only buildings animated (grow in, later flatten) on scroll
    let lastCityFade = '', cityStart = null, lastCityShown = null, lastHero = '', lastFlatten = -1;

    const mk = (tag, attrs, cls) => {
        const e = document.createElementNS(NS, tag);
        if (cls) e.setAttribute('class', cls);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    };
    const winDefs = mk('defs', {});
    // facade tile (map units): a floor band plus a 3 x 3 block of windows, some lit warm, some pink, some dark glass
    const winPat = mk('pattern', { id: 'win', patternUnits: 'userSpaceOnUse', width: '0.0009', height: '0.0012' });
    const litRects = [];
    for (let r = 0; r < 3; r++) {
        winPat.appendChild(mk('rect', { x: 0, y: (r * 0.0004 + 0.00034).toFixed(5), width: 0.0009, height: 0.00005, fill: '#0e0a14', 'fill-opacity': '.28' }));
        for (let c = 0; c < 3; c++) {
            const roll = rnd();
            const fill = roll < 0.36 ? '#ffe2a8' : roll < 0.52 ? '#ffc2d6' : '#cdb4f0';
            const op = roll < 0.36 ? '.72' : roll < 0.52 ? '.48' : '.2';
            const w = mk('rect', { x: (c * 0.0003 + 0.00006).toFixed(5), y: (r * 0.0004 + 0.0001).toFixed(5), width: 0.00018, height: 0.00022, fill, 'fill-opacity': op });
            winPat.appendChild(w);
            if (roll < 0.36) litRects.push(w);
        }
    }
    winDefs.appendChild(winPat);
    const addGrad = (id, stops, x2 = 0, y2 = 1) => {
        const g = mk('linearGradient', { id, x1: 0, y1: 0, x2, y2 });
        stops.forEach(([o, c, op]) => g.appendChild(mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op })));
        winDefs.appendChild(g);
    };
    addGrad('bg0', [[0, '#7a63a3'], [0.5, '#4a3868'], [1, '#221733']]);
    addGrad('bg1', [[0, '#f1e6fb'], [0.5, '#bfa6e0'], [1, '#7c64a8']]);
    addGrad('bg2', [[0, '#ffc9dc'], [0.5, '#ee8fb5'], [1, '#9a3d6c']]);
    // the department building
    addGrad('hb', [[0, '#f6ebf2'], [1, '#bda5dc']]);
    addGrad('hs', [[0, '#a68fcc'], [1, '#6b5590']]);
    addGrad('hcol', [[0, '#ffffff'], [0.55, '#f0e2f7'], [1, '#a98fcf']], 1, 0);
    const tg = mk('radialGradient', { id: 'tree', cx: '38%', cy: '34%', r: '70%' });
    tg.appendChild(mk('stop', { offset: 0, 'stop-color': '#c4dcc0' }));
    tg.appendChild(mk('stop', { offset: 0.55, 'stop-color': '#7da57c' }));
    tg.appendChild(mk('stop', { offset: 1, 'stop-color': '#35553a' }));
    winDefs.appendChild(tg);
    // a darker, more natural green for the varied campus trees
    const tg2 = mk('radialGradient', { id: 'tree2', cx: '35%', cy: '30%', r: '72%' });
    tg2.appendChild(mk('stop', { offset: 0, 'stop-color': '#9cc08a' }));
    tg2.appendChild(mk('stop', { offset: 0.5, 'stop-color': '#4f7d46' }));
    tg2.appendChild(mk('stop', { offset: 1, 'stop-color': '#1f3a26' }));
    winDefs.appendChild(tg2);
    const tg3 = mk('radialGradient', { id: 'tree3', cx: '40%', cy: '32%', r: '70%' });
    tg3.appendChild(mk('stop', { offset: 0, 'stop-color': '#b8cf8e' }));
    tg3.appendChild(mk('stop', { offset: 0.55, 'stop-color': '#6b8f4e' }));
    tg3.appendChild(mk('stop', { offset: 1, 'stop-color': '#2b4727' }));
    winDefs.appendChild(tg3);
    svg.insertBefore(winDefs, svg.firstChild);

    function buildCity(lon, lat, R, count, roads, detail, trees, g = cityG) {
        // roads first (under everything), as a dark asphalt strip with a lane line on top
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
            g.appendChild(mk('path', { d }, 'road-base'));
            const p = mk('path', { d }, 'road');
            g.appendChild(p);
            cityRoad.push(p);
        }
        // trees (canopy with a soft ground shadow)
        for (let k = 0; k < (trees || 0); k++) {
            const a = rnd() * Math.PI * 2, r = R * 1.05 * Math.sqrt(rnd());
            const x = lon + Math.cos(a) * r, y = -lat + Math.sin(a) * r * 0.8;
            const tr = 0.00026 + rnd() * 0.00038;                  // crown radius, varies per tree
            const pickFill = rnd();
            const fillId = pickFill < 0.4 ? 'url(#tree)' : pickFill < 0.75 ? 'url(#tree2)' : 'url(#tree3)';
            const cx = x, cy = y - tr * 0.85;                      // crown centre, above the trunk
            // ground shadow, stretched away from the light
            g.appendChild(mk('ellipse', { cx: (x + tr * 0.6).toFixed(5), cy: (y + tr * 0.55).toFixed(5), rx: (tr * 1.35).toFixed(5), ry: (tr * 0.5).toFixed(5) }, 'sh'));
            // trunk: a short tapered stem, a little darker at the base
            g.appendChild(mk('path', { d: `M${(x - tr * 0.07).toFixed(5)} ${y.toFixed(5)}L${(x - tr * 0.04).toFixed(5)} ${(cy + tr * 0.6).toFixed(5)}L${(x + tr * 0.04).toFixed(5)} ${(cy + tr * 0.6).toFixed(5)}L${(x + tr * 0.07).toFixed(5)} ${y.toFixed(5)}Z`, fill: '#2e2118' }));
            // crown: 5 to 7 uneven lobes, each a slightly different size, so the outline is ragged like real foliage
            const lobes = 5 + Math.floor(rnd() * 3);
            for (let j = 0; j < lobes; j++) {
                const ang = (j / lobes) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
                const off = tr * (0.3 + rnd() * 0.3);
                const lr = tr * (0.38 + rnd() * 0.3);
                g.appendChild(mk('circle', {
                    cx: (cx + Math.cos(ang) * off).toFixed(5),
                    cy: (cy + Math.sin(ang) * off * 0.75).toFixed(5),
                    r: lr.toFixed(5), fill: fillId
                }, 'tr'));
            }
            // a core lobe to fill the middle of the crown
            g.appendChild(mk('circle', { cx: cx.toFixed(5), cy: cy.toFixed(5), r: (tr * 0.55).toFixed(5), fill: fillId }, 'tr'));
            // sunlit highlight on the upper-left of the crown, and a soft shade on the lower-right
            g.appendChild(mk('circle', { cx: (cx - tr * 0.22).toFixed(5), cy: (cy - tr * 0.25).toFixed(5), r: (tr * 0.3).toFixed(5), fill: '#e8f5d8', 'fill-opacity': '.16', 'pointer-events': 'none' }));
            g.appendChild(mk('circle', { cx: (cx + tr * 0.25).toFixed(5), cy: (cy + tr * 0.3).toFixed(5), r: (tr * 0.35).toFixed(5), fill: '#0e0a14', 'fill-opacity': '.18', 'pointer-events': 'none' }));
        }
        for (let k = 0; k < count; k++) {
            const a = rnd() * Math.PI * 2;
            const r = R * Math.pow(rnd(), 0.7);
            const x = lon + Math.cos(a) * r, y = -lat + Math.sin(a) * r * 0.8;
            if (Math.hypot(x - 89.36, y + 24.8445) < 0.0034) continue;   // leave the department's plot clear
            if (!detail) {
                // a distant district: one flat silhouette rect, painted once and never touched again.
                // This is what lets every district still show plenty of buildings without any of the
                // per-frame cost that was making the map hang - only the college/department cluster
                // below (detail = true) gets the full 3D build-up-and-flatten treatment.
                const bw = 0.0009 + rnd() * 0.0016, bh = 0.0009 + rnd() * 0.0018;
                const pick = rnd();
                const c = pick < 0.12 ? CITY_COLORS[1] : pick < 0.18 ? CITY_COLORS[2] : CITY_COLORS[0];
                g.appendChild(mk('rect', {
                    x: (x - bw / 2).toFixed(5), y: (y - bh / 2).toFixed(5),
                    width: bw.toFixed(5), height: bh.toFixed(5)
                }, 'b far ' + c));   // flat colour (see map.css): no gradient to paint per shape
                continue;
            }
            const tower = rnd() < 0.12;
            const bw = 0.0009 + rnd() * 0.0016, bh = (0.0009 + rnd() * 0.0018) * (tower ? 1.8 : 1);
            const pick = rnd();
            const c = pick < 0.12 ? CITY_COLORS[1] : pick < 0.18 ? CITY_COLORS[2] : CITY_COLORS[0];
            const x0 = x - bw / 2, yb = y + bh / 2;
            const side = mk('path', {}, 'bs ' + c);
            const roof = mk('path', {}, 'br ' + c);
            const front = mk('rect', { x: x0.toFixed(5), y: yb.toFixed(5), width: bw.toFixed(5), height: 0 }, 'b ' + c);
            const win = detail ? mk('rect', { x: x0.toFixed(5), y: yb.toFixed(5), width: bw.toFixed(5), height: 0 }, 'wn') : null;
            const unit = detail && rnd() < 0.6 ? mk('rect', {}, 'ru') : null;
            if (detail) {
                const sd = Math.min(bw, bh) * 0.9;   // soft shadow thrown onto the ground behind the building
                g.appendChild(mk('path', { d: `M${x0.toFixed(5)} ${yb.toFixed(5)}L${(x0 + bw).toFixed(5)} ${yb.toFixed(5)}L${(x0 + bw + sd).toFixed(5)} ${(yb - sd * 0.5).toFixed(5)}L${(x0 + sd).toFixed(5)} ${(yb - sd * 0.5).toFixed(5)}Z` }, 'sh'));
            }
            g.append(side, roof, front);
            if (win) g.appendChild(win);
            if (unit) g.appendChild(unit);
            const depth = Math.min(bw, bh);
            const bObj = {
                front, side, roof, win, unit, x0, yb, w: bw, h: bh,
                dx: depth * 0.55, dy: depth * 0.35,   // the side and roof go back up and to the right
                d: r / R                              // grows outward from the centre
            };
            cityBuildNear.push(bObj);   // close to the college: kept soft and animated (grows in, later flattens)
        }
    }

    // draw a building at grow amount g (0 = on the ground, 1 = full height)
    function paintBuilding(b, g) {
        // the roof/side depth shrinks together with the height, not just the height on its own -
        // otherwise, once a building is almost flattened, its roof still sticks out at the old full
        // depth and reads as a thin slanted card floating above the ground instead of a flat footprint
        const gd = Math.max(0, g);
        const H = b.h * g, top = b.yb - H, x = b.x0, w = b.w, dx = b.dx * gd, dy = b.dy * gd, yb = b.yb;
        const f = v => v.toFixed(5);
        b.front.setAttribute('y', f(top));
        b.front.setAttribute('height', f(H));
        b.side.setAttribute('d', `M${f(x + w)} ${f(top)}L${f(x + w + dx)} ${f(top - dy)}L${f(x + w + dx)} ${f(yb - dy)}L${f(x + w)} ${f(yb)}Z`);
        b.roof.setAttribute('d', `M${f(x)} ${f(top)}L${f(x + w)} ${f(top)}L${f(x + w + dx)} ${f(top - dy)}L${f(x + dx)} ${f(top - dy)}Z`);
        if (b.win) { b.win.setAttribute('y', f(top)); b.win.setAttribute('height', f(H)); }
        if (b.unit) {
            const rw = w * 0.3, rh = Math.min(w, b.h) * 0.16;
            b.unit.setAttribute('x', f(x + w / 2 + dx / 2 - rw / 2));
            b.unit.setAttribute('y', f(top - dy / 2 - rh));
            b.unit.setAttribute('width', f(rw));
            b.unit.setAttribute('height', f(rh));
            b.unit.style.display = g > 0.85 ? '' : 'none';
        }
    }

    function resetBuilding(b) {
        b.front.setAttribute('y', b.yb.toFixed(5));
        b.front.setAttribute('height', 0);
        b.side.removeAttribute('d');
        b.roof.removeAttribute('d');
        if (b.win) b.win.setAttribute('height', 0);
        if (b.unit) b.unit.style.display = 'none';
        b.done = false;
    }

    // each district's buildings are now a single flat rect apiece (see the !detail branch above),
    // painted once and never re-touched on scroll - so the count can stay generous without bringing
    // back the hang; it was the per-frame 3D growth/flatten work on thousands of them that was slow,
    // not the number of shapes on screen
    // on a phone, fewer shapes means less to paint/composite every frame - the picture is still full,
    // just a little less dense, and this is the single biggest lever for the lag reported near Bogura/the college
    const MOBILE = innerWidth < 760;
    const distG = mk('g', {}, 'far-city');   // the distant district silhouettes: hidden once the zoom is inside Bogura
    cityG.appendChild(distG);
    DISTRICTS.forEach(([, , lon, lat]) => buildCity(lon, lat, 0.035, MOBILE ? 24 : 36, 0, false, 0, distG));
    buildCity(boguraLabel.lon, boguraLabel.lat, 0.07, MOBILE ? 100 : 150, 0, true, MOBILE ? 40 : 60);   // Bogura: denser, the city centre
    buildCity(89.3566, 24.8464, 0.012, MOBILE ? 36 : 52, 0, true, MOBILE ? 26 : 40);   // the college campus: a fuller cluster of its own

    // ---------- the economics department ----------
    // top-down plan (seen from above at the start of the zoom). Units: 0.00001 degree, centred on the building.
    const heroG = mk('g', { transform: 'translate(89.36 -24.8445) scale(0.00003)' }, 'hero');
    heroG.style.opacity = 0;
    const hz = (tag, attrs) => heroG.appendChild(mk(tag, Object.assign({ 'vector-effect': 'non-scaling-stroke' }, attrs)));

    cityG.after(heroG);

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

    let sp = null, lastNow = 0, lastT = -1, raf = 0, visible = true;
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease01 = v => { v = clamp(v); return 1 - Math.pow(1 - v, 3); };
    // rises with a small overshoot, so the buildings feel like they spring up
    const easeBack = v => { v = clamp(v); const c1 = 0.65, c3 = c1 + 1; return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2); };
    const life = (from, to) => t => clamp((t - from) / (to - from));

    DISTRICTS.forEach(([en, bn, lon, lat, pos]) => addLabel({
        en, bn, lon, lat, pos, cls: 'dist', withDot: true,
        op: () => 1, px: () => 7
    }));

    // Bogura: one name that grows steadily as the zoom comes in, then fades as the zoom reaches the college
    const boguraOp = t => clamp((t - 0.25) / 0.35) * (1 - clamp((t - 1.5) / 0.5));
    const boguraPx = t => lerp(7, 40, clamp((t - 0.25) / 1.4));
    addLabel({ ...boguraLabel, pos: 'a', cls: 'poi', withDot: false, op: boguraOp, px: boguraPx });   // written like the college and economics labels

    // the college and the department grow in steadily as the zoom reaches them (bold, with a short description)
    addLabel({ en: 'Govt. Azizul Haque College', bn: 'গভর্নমেন্ট আজিজুল হক কলেজ',
        lon: 89.3566, lat: 24.8464, pos: 't', cls: 'poi', withDot: false,
        op: t => clamp((t - 1.8) / 0.4) * (1 - clamp((t - 3.3) / 0.4)),
        px: t => lerp(6, 40, clamp((t - 1.8) / 1.5)),
        dpx: t => lerp(4, 12, clamp((t - 1.8) / 1.5)) });
    addLabel({ en: 'Economics Department', bn: 'অর্থনীতি বিভাগ',
        lon: 89.36, lat: 24.845, pos: 'b', cls: 'poi', withDot: false,
        op: t => clamp((t - 3.0) / 0.4) * (1 - clamp((t - 3.9) / 0.35)),
        px: t => lerp(6, 34, clamp((t - 3.0) / 1.0)),
        dpx: t => lerp(4, 14, clamp((t - 3.0) / 1.0)) });

    // ---------- pins ----------
    const pinEls = PINS.map(pin => {
        const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('class', 'ring');
        const d = document.createElementNS(NS, 'circle'); d.setAttribute('class', 'pin');
        pinG.append(ring, d);
        return { ...pin, ring, dot: d };
    });

    // 3D canvas resolution: baseDpr is set on each measure; cvScale drops below 1 while frames are too slow to keep up
    let baseDpr = 1, cvScale = 1, r3Quick = 0, r3Slow = 0;
    const R3_BUDGET = 12;   // ms: a 3D frame that takes longer than this lowers the canvas resolution a step
    function applyCanvasSize() {
        const dpr = baseDpr * cvScale;
        cv.width = Math.max(1, Math.round(cW * dpr)); cv.height = Math.max(1, Math.round(cH * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let ratio = 0.6;   // height / width of the map box
    let pxW = 760;     // width of the map box in pixels
    // scroll budget: the zoom from Bangladesh to the department (t 0-4) gets PRE_FAST times less scroll;
    // the rest (t 4-7, the building, the room and Tania) keeps exactly the same scroll distance and speed
    const PRE_FAST = 2;
    let PRE_PX = 1, POST_PX = 1, EXTRA_PX = 1, trackDocTop = 0;
    // the viewport height the scroll timeline is built on. It is fixed at each full measure, so a phone's address bar
    // showing or hiding (which changes innerHeight while scrolling) cannot move the zoom to another point.
    let BASE_H = innerHeight;
    // extra scroll length after the room is fully shown (t stays 7): Tania's 12 frames are played one by one over it
    const FRAME_SCROLL_VH = 0.5;   // was 1.6: the 12 frames play in about a third of the old scroll
    function measure(keepBudget) {
        trackDocTop = track.getBoundingClientRect().top + scrollY;   // document position of the scroll track (re-read on resize)
        // keepBudget: a resize that only changed the height (phone address bar showing/hiding). The scroll
        // track is left alone so the zoom does not jump; only the canvas and the map box are re-sized.
        if (!keepBudget) {
            // remember the original scroll length once (from the CSS height), then size the track to the new budget
            if (!track.dataset.origSpan) track.dataset.origSpan = String(track.offsetHeight - innerHeight);
            BASE_H = innerHeight;
            const orig = +track.dataset.origSpan, lead0 = BASE_H * 0.25;
            const span = Math.max(1, orig - lead0);
            // per stage interval: Bangladesh->...->department (t 0-4) uses the same scroll step everywhere,
            // and the college->department step (t 4-5) now matches it; the room and Tania (t 5-7) keep their step
            const STEP = span / 14;
            PRE_PX = STEP * 4;
            POST_PX = STEP * 5;   // weights: 4->5 = 1 step, 5->6 = 2 steps, 6->7 = 2 steps
            EXTRA_PX = BASE_H * FRAME_SCROLL_VH;
            track.style.height = (BASE_H + lead0 + PRE_PX + POST_PX + EXTRA_PX) + 'px';
        }
        const r = svg.getBoundingClientRect();
        if (r.width) {
            ratio = r.height / r.width; pxW = r.width;
            // the 3D canvas: backing store capped at 1x on phones / 1.25x on desktop (fill-rate is the limit, not sharpness)
            baseDpr = Math.min(window.devicePixelRatio || 1, innerWidth < 420 ? 0.85 : innerWidth < 760 ? 1 : 1.25);
            cW = r.width; cH = r.height;
            applyCanvasSize();
            lastCamKey = ''; svgDirty = true;
        }
    }

    // scroll past the department-zoom start (q px) -> timeline t in 4..7 (4->5 one step, 5->6 and 6->7 two steps each)
    // the speed eases smoothly from 1 (t 4-5) to 0.5 (t 5-7) over the first 2 units instead of changing at one point,
    // so the zoom into the department and the walk into the room never speed up or jump between two frames.
    // The total still reaches t = 7 at u = 5.
    // stages 0-4 (Bangladesh -> department). Weights are the scroll share of each step: the Bogura -> college
    // steps (1->2, 2->3) get less scroll, so they move faster; the first and last steps get a little more.
    const PRE_W = [0, 1.0, 1.45, 1.85, 4];   // was [0, 1.25, 1.85, 2.45, 4]: Bangladesh -> college now takes less scroll (faster)
    function preT(f) {                       // f = 0..1 through the whole stage 0-4 scroll
        const x = clamp(f) * 4;
        for (let k = 0; k < 4; k++) {
            if (x <= PRE_W[k + 1]) return k + (x - PRE_W[k]) / (PRE_W[k + 1] - PRE_W[k]);
        }
        return 4;
    }

    function postT(q) {
        const u = clamp(q / POST_PX) * 5;
        if (u >= 2) return 4 + 0.5 * u + 0.5;
        const z = u / 2;
        const ease = u - 2 * (z * z * z - z * z * z * z / 2);   // integral of (1 - smoothstep) over [0, u]
        return 4 + 0.5 * u + 0.5 * ease;
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

    // a name must fit inside the visible map: its font size is capped so the text width stays within 90% of
    // the view (measured once per element, the width scales linearly with the font size)
    function fitName(el, want, viewW) {
        const cur = parseFloat(el.getAttribute('font-size'));
        if (el._k === undefined && cur > 0) { const L = el.getComputedTextLength(); if (L > 0) el._k = L / cur; }
        return el._k ? Math.min(want, (innerWidth < 760 ? 0.6 : 0.9) * viewW / el._k) : want;   // phones: names stay narrower, so they do not cover the buildings
    }

    const POS_SET = (el, x, y, anchor) => {
        el.setAttribute('x', x);
        el.setAttribute('y', y);
        el.setAttribute('text-anchor', anchor);
    };

    // =====================================================================================================
    // TRUE-3D CITY (pure Canvas 2D, no libraries)
    // One pinhole camera looks at the department from the south. Everything - the department, the blocks,
    // roads, trees, shadows, fog - lives in the same metre-based world space and is projected with the same
    // perspective matrix, so the main building and its neighbours share ground plane, light and vanishing
    // points. Depth is resolved with the painter's algorithm (cells are visited far -> near; inside a cell
    // far objects first), and only the cells that can reach the screen are generated, projected or drawn.
    // The city is procedural (hash of the cell index): nothing is stored, nothing is downloaded.
    // =====================================================================================================
    const K = 101030;                                   // metres per map degree (the SVG map is isotropic)
    const DOOR = { lon: 89.36, lat: 24.844875 };        // the department's door = world origin; +z is north
    const HW = 25.6, HHT = 23.2, HDEP = 18, DOORY = 4.1;   // department: width, height, depth, door mid-height (m)
    const CELL_X = 44, CELL_Z = 52, LOT_X = 32, LOT_Z = 40;   // city grid: block pitch and lot size (m)
    const NEAR = 0.8, LV = 8;                            // near plane (m), number of fog levels
    const FOGC = [110, 67, 136];                         // haze colour (matches the bottom of the sky)

    const cv = document.createElement('canvas');
    cv.id = 'map-3d';
    cv.setAttribute('aria-hidden', 'true');
    svg.parentNode.appendChild(cv);
    const ctx = cv.getContext('2d', { alpha: false });
    let cW = 0, cH = 0, cvOn = false, facadeReady = false;
    const facade = document.createElement('canvas');     // the department's front, rasterised once

    // ---- colour tables: every colour pre-mixed with the haze for LV distance levels (no per-frame maths) ----
    const mixc = (a, b, t) => 'rgb(' + (a[0] + (b[0] - a[0]) * t | 0) + ',' + (a[1] + (b[1] - a[1]) * t | 0) + ',' + (a[2] + (b[2] - a[2]) * t | 0) + ')';
    const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const tint = (c, k) => [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k];
    // plum, lilac, rose, blush, and the department's own stone
    const BASE = [[96, 76, 140], [176, 150, 216], [214, 120, 160], [226, 200, 214], [214, 198, 236]];
    // per palette: 0 south face, 1 west face (sunlit), 2 east face (shaded), 3 north face, 4 roof
    const PAL = BASE.map(c => {
        const faces = [c, tint(c, 0.14), shade(c, 0.52), shade(c, 0.46), tint(c, 0.32)];
        return Array.from({ length: LV }, (_, L) => faces.map(f => mixc(f, FOGC, L / (LV - 1) * 0.94)));
    });
    // lot, road, lawn, path, canopy light, canopy dark, trunk, lamp post
    const GROUND = [[44, 34, 66], [24, 18, 36], [18, 13, 22], [150, 128, 178], [112, 160, 118], [60, 104, 76], [74, 52, 40], [42, 29, 64]];
    const GC = GROUND.map(c => Array.from({ length: LV }, (_, L) => mixc(c, FOGC, L / (LV - 1) * 0.94)));
    const FOG_RGBA = Array.from({ length: LV }, (_, L) => 'rgba(' + FOGC + ',' + (L / (LV - 1) * 0.94).toFixed(3) + ')');

    // ---- the department's front, painted once from the same artwork as before, with the sky, lawn, lamps and
    // trees of the old flat overlay removed (those now exist as real objects in the world) ----
    function facadeSVG(bn) {
        const win = (x, y, w, h, lit) =>
            `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="#5b3a7c"/>` +
            `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? 'url(#g)' : '#2a1d40'}"/>` +
            `<path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}" stroke="#5b3a7c" stroke-width="1.6"/>` +
            `<rect x="${x - 4}" y="${y + h + 2}" width="${w + 8}" height="3" fill="#ffd6e4"/>`;
        const arch = (x, y, w, h, lit) =>
            `<path d="M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z" fill="${lit ? 'url(#g)' : '#2a1d40'}" stroke="#5b3a7c" stroke-width="2"/>`;
        let b = '<rect x="70" y="166" width="260" height="12" fill="#ee8fb5"/><rect x="70" y="178" width="260" height="3" fill="#3a2450" fill-opacity=".3"/>';
        b += '<rect x="84" y="150" width="232" height="16" fill="url(#w)"/>';
        [96, 200, 304].forEach(ux => b += `<path d="M${ux - 5} 150q5-10 10 0z" fill="#ffd6e4"/>`);
        b += '<rect x="78" y="176" width="244" height="168" fill="url(#w)"/>';
        b += '<rect x="78" y="228" width="244" height="1.5" fill="#9f86c4" fill-opacity=".5"/><rect x="78" y="290" width="244" height="1.5" fill="#9f86c4" fill-opacity=".5"/>';
        [118, 146, 254, 282].forEach(px => b += `<rect x="${px}" y="176" width="3" height="164" fill="#9f86c4" fill-opacity=".35"/>`);
        [92, 120, 276, 304].forEach((x, j) => {
            b += win(x, 196, 20, 30, (j + 1) % 3 !== 0);
            b += win(x, 244, 20, 32, j % 2 === 0);
            b += arch(x, 300, 20, 36, j !== 1);
        });
        b += '<path d="M140 152L260 152L200 116Z" fill="#f6ebf2" stroke="#ee8fb5" stroke-width="2" stroke-linejoin="round"/>';   // gable: its base sits exactly on the cornice
        b += '<rect x="130" y="160" width="140" height="8" fill="#ee8fb5"/><rect x="140" y="152" width="120" height="8" fill="#cdb4f0"/>';
        b += '<rect x="170" y="128" width="60" height="14" rx="2" fill="#3a2450" stroke="#ee8fb5" stroke-width="1"/>';
        b += bn
            ? '<text x="200" y="138.5" text-anchor="middle" font-size="9" font-family="Hind Siliguri, Noto Serif Bengali, Noto Sans Bengali, Nirmala UI, Vrinda, sans-serif" font-weight="700" fill="#ffd6e4">অর্থনীতি</text>'
            : '<text x="200" y="138" text-anchor="middle" font-size="8" font-family="Georgia, serif" font-weight="700" fill="#ffd6e4">Economics</text>';
        [148, 172, 228, 252].forEach(xc => {
            b += `<rect x="${xc - 6}" y="168" width="12" height="4" fill="#f6ebf2"/><rect x="${xc - 4}" y="172" width="8" height="118" fill="url(#c)"/><rect x="${xc - 6}" y="290" width="12" height="4" fill="#efe3fa"/>`;
        });
        b += '<rect x="140" y="294" width="120" height="6" fill="#efe3fa"/>';
        b += '<path d="M184 340V282A16 16 0 0 1 216 282V340Z" fill="url(#d)" stroke="#ee8fb5" stroke-width="2"/>';
        b += '<path d="M190 280A10 10 0 0 1 210 280Z" fill="#ffe2a8" fill-opacity=".9"/><path d="M200 272V340" stroke="#24141f" stroke-width="1.4"/>';
        b += '<rect x="158" y="335" width="84" height="5" fill="#efe3fa"/><rect x="148" y="340" width="104" height="4" fill="#cdb4f0"/>';
        const defs = '<defs>' +
            '<linearGradient id="w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cdb4f0"/><stop offset=".5" stop-color="#f6ebf2"/><stop offset="1" stop-color="#b59ad8"/></linearGradient>' +
            '<linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#efe3fa"/><stop offset="1" stop-color="#9f86c4"/></linearGradient>' +
            '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b8"/><stop offset="1" stop-color="#ff9fbf"/></linearGradient>' +
            '<linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d2f56"/><stop offset="1" stop-color="#3a1630"/></linearGradient></defs>';
        // crop: x 72..328, y 112..344 (pediment tip down to the ground line). 1 unit = 0.1 m
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="72 112 256 232" width="1024" height="928">' + defs + b + '</svg>';
    }
    function buildFacade() {
        const img = new Image();
        img.onload = () => {
            facade.width = 1024; facade.height = 928;
            const fc = facade.getContext('2d');
            fc.drawImage(img, 0, 0, 1024, 928);
            // tint the painted front to the site's plum-rose palette (multiply keeps the windows, lamps and trim)
            fc.globalCompositeOperation = 'multiply';
            fc.fillStyle = '#d7a6c6';
            fc.fillRect(0, 0, facade.width, facade.height);
            // the tint above also filled the transparent sky around the painting: keep only the painted pixels
            fc.globalCompositeOperation = 'destination-in';
            fc.drawImage(img, 0, 0, 1024, 928);
            fc.globalCompositeOperation = 'source-over';
            facadeReady = true; lastCamKey = '';
            wake();
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(facadeSVG(document.documentElement.lang === 'bn'));
    }
    buildFacade();
    new MutationObserver(buildFacade).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // ---- procedural city: a block (cell) is a pure function of its index ----
    const hash = (i, j, k) => {
        let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 2246822519);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const CB = new Float32Array(2 * 6);   // up to 2 buildings per lot: x0, x1, z0, z1, height, palette
    const CT = new Float32Array(10 * 3);  // up to 10 trees per lot: x, z, radius
    let cbN = 0, ctN = 0, lawn = false;
    function genCell(i, j) {
        const xc = i * CELL_X, zc = j * CELL_Z;
        cbN = 0; ctN = 0;
        lawn = i === 0 && zc <= 60;       // the campus green leading to the department: kept clear, like an avenue
        if (lawn) return;
        const lx = xc - LOT_X / 2, lz = zc - LOT_Z / 2, r = hash(i, j, 1);
        const pal = (u => u < 0.46 ? 0 : u < 0.72 ? 1 : u < 0.9 ? 2 : 3)(hash(i, j, 9));
        if (r < 0.16) {                    // a small park
            const n = 4 + (hash(i, j, 2) * 6 | 0);
            for (let k = 0; k < n; k++) { CT[ctN * 3] = lx + 2 + hash(i, j, 20 + k) * (LOT_X - 4); CT[ctN * 3 + 1] = lz + 3 + hash(i, j, 40 + k) * (LOT_Z - 6); CT[ctN * 3 + 2] = 2 + hash(i, j, 60 + k) * 1.4; ctN++; }
            return;
        }
        if (r < 0.7) {                     // one block, sometimes a tower
            const tower = hash(i, j, 3) < 0.11;
            const w = tower ? 11 + hash(i, j, 4) * 6 : 13 + hash(i, j, 4) * 17, d = tower ? 11 + hash(i, j, 5) * 6 : 14 + hash(i, j, 5) * 20;
            const h = tower ? 15 + hash(i, j, 6) * 9 : 6 + hash(i, j, 6) * 8;
            const x0 = lx + (LOT_X - w) * hash(i, j, 7), z0 = lz + (LOT_Z - d) * hash(i, j, 8);
            CB[0] = x0; CB[1] = x0 + w; CB[2] = z0; CB[3] = z0 + d; CB[4] = h; CB[5] = pal; cbN = 1;
        } else {                           // two smaller buildings side by side
            for (let k = 0; k < 2; k++) {
                const w = 12 + hash(i, j, 10 + k) * 3, d = 14 + hash(i, j, 12 + k) * 16, h = 5 + hash(i, j, 14 + k) * 8;
                const x0 = k ? lx + LOT_X - w : lx, z0 = lz + (LOT_Z - d) * hash(i, j, 16 + k);
                CB[k * 6] = x0; CB[k * 6 + 1] = x0 + w; CB[k * 6 + 2] = z0; CB[k * 6 + 3] = z0 + d; CB[k * 6 + 4] = h;
                CB[k * 6 + 5] = hash(i, j, 18 + k) < 0.5 ? pal : (pal + 1) % 4;
            }
            cbN = 2;
        }
        const nt = 1 + (hash(i, j, 70) * 2 | 0);   // street trees in front of the lot
        for (let k = 0; k < nt; k++) { CT[ctN * 3] = lx + 2 + hash(i, j, 71 + k) * (LOT_X - 4); CT[ctN * 3 + 1] = lz - 3.5; CT[ctN * 3 + 2] = 1.8 + hash(i, j, 75 + k) * 1; ctN++; }
    }

    // ---- camera + projection ----
    let kx = 0, ky = 0, kz = 0, ksn = 1, kcs = 0, kf = 600, khw = 0, khh = 0;   // eye, sin/cos of the pitch, focal length, half size
    let fogS = 0, fogL = 1, maxD = 1;
    let sx = 0, sy = 0;
    // view depth of a world point; sets sx, sy (screen) - the pitch rotates about the x axis, yaw is fixed (north up)
    function pj(x, y, z) {
        const vy = y - ky, vz = z - kz;
        const cz = -vy * ksn + vz * kcs;
        const k = kf / (cz > 0.001 ? cz : 0.001);
        sx = khw + (x - kx) * k;
        sy = khh - (vy * kcs + vz * ksn) * k;
        return cz;
    }
    const lvl = d => { const q = (d - fogS) / fogL; return q <= 0 ? 0 : q >= 1 ? LV - 1 : Math.round(q * (LV - 1)); };

    // polygon in world space -> camera space -> clipped against the near plane -> filled. Clipping matters: the
    // lawn under the camera on the last stretch of the approach straddles the near plane.
    const W3 = new Float32Array(36), Vc = new Float32Array(60), Vo = new Float32Array(60);
    function polyW(col, n) {
        let allIn = true;
        for (let i = 0; i < n; i++) {
            const x = W3[3 * i] - kx, y = W3[3 * i + 1] - ky, z = W3[3 * i + 2] - kz;
            Vc[3 * i] = x; Vc[3 * i + 1] = y * kcs + z * ksn; Vc[3 * i + 2] = -y * ksn + z * kcs;
            if (Vc[3 * i + 2] < NEAR) allIn = false;
        }
        let src = Vc, sn = n;
        if (!allIn) {
            sn = 0; src = Vo;
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n, a = 3 * i, b = 3 * j, az = Vc[a + 2], bz = Vc[b + 2];
                if (az >= NEAR) { Vo[3 * sn] = Vc[a]; Vo[3 * sn + 1] = Vc[a + 1]; Vo[3 * sn + 2] = az; sn++; }
                if ((az >= NEAR) !== (bz >= NEAR)) {
                    const u = (NEAR - az) / (bz - az);
                    Vo[3 * sn] = Vc[a] + (Vc[b] - Vc[a]) * u; Vo[3 * sn + 1] = Vc[a + 1] + (Vc[b + 1] - Vc[a + 1]) * u; Vo[3 * sn + 2] = NEAR; sn++;
                }
            }
            if (sn < 3) return;
        }
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        ctx.beginPath();
        for (let i = 0; i < sn; i++) {
            const k = kf / src[3 * i + 2], px = khw + src[3 * i] * k, py = khh - src[3 * i + 1] * k;
            if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        if (x1 < 0 || x0 > cW || y1 < 0 || y0 > cH) return;   // fully off screen: nothing to paint
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
    }
    const P4 = (col, ax, ay, az, bx, by, bz, cx_, cy_, cz_, dx, dy, dz) => {
        W3[0] = ax; W3[1] = ay; W3[2] = az; W3[3] = bx; W3[4] = by; W3[5] = bz;
        W3[6] = cx_; W3[7] = cy_; W3[8] = cz_; W3[9] = dx; W3[10] = dy; W3[11] = dz;
        polyW(col, 4);
    };
    const flatRect = (col, x0, z0, x1, z1) => P4(col, x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);

    // ---- objects ----
    let winBudget = 0;
    // a grid of windows on one wall: origin (ox, oz), direction (ux, uz), length, height
    function windows(ox, oz, ux, uz, len, h, L, seedv) {
        if (L > 5 || winBudget <= 0) return;
        const fl = Math.max(1, Math.round(h / 3.4)), cols = Math.max(2, Math.round(len / 3.1));
        const fh = h / fl, cw = len / cols;
        winBudget -= fl * cols;
        const a = 1 - L / (LV - 1) * 0.9;
        for (let pass = 0; pass < 2; pass++) {
            ctx.beginPath();
            for (let r = 0; r < fl; r++) for (let c = 0; c < cols; c++) {
                const lit = hash(seedv, r * 17 + c, 5) < 0.38;
                if ((pass === 1) !== lit) continue;
                const s0 = (c + 0.2) * cw, s1 = (c + 0.8) * cw, y0 = r * fh + fh * 0.25, y1 = r * fh + fh * 0.8;
                if (pj(ox + ux * s0, y0, oz + uz * s0) < NEAR) continue; const ax = sx, ay = sy;
                if (pj(ox + ux * s1, y0, oz + uz * s1) < NEAR) continue; const bx = sx, by = sy;
                if (pj(ox + ux * s1, y1, oz + uz * s1) < NEAR) continue; const cx_ = sx, cy_ = sy;
                if (pj(ox + ux * s0, y1, oz + uz * s0) < NEAR) continue;
                ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx_, cy_); ctx.lineTo(sx, sy); ctx.closePath();
            }
            ctx.globalAlpha = a * (pass ? 0.85 : 0.7);
            ctx.fillStyle = pass ? '#ffdca0' : '#1a1230';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawBuilding(x0, x1, z0, z1, h, ty, sd) {
        const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, dy = h / 2 - ky, dz = zm - kz, dx = xm - kx;
        const cz = -dy * ksn + dz * kcs;
        if (cz < NEAR) return;                                   // beside or behind the camera: nothing of it can be on screen
        const s = kf / cz, w = x1 - x0, d = z1 - z0;
        const gy = khh - (-ky * kcs + dz * ksn) * s, ry = khh - ((h - ky) * kcs + dz * ksn) * s, sxc = khw + dx * s;
        const rad = Math.max(w, d, h) * s;
        if (sxc < -rad || sxc > cW + rad || Math.max(gy, ry) < -rad * 0.2 || Math.min(gy, ry) > cH + rad * 0.2) return;   // viewport culling
        const L = lvl(Math.sqrt(dx * dx + dy * dy + dz * dz)), pal = PAL[ty][L];
        if (s * w < 3.5) {                                       // far away: a single roof-coloured block, no faces
            ctx.fillStyle = pal[4];
            const top = Math.min(gy, ry), hgt = Math.abs(gy - ry) + d * s * Math.abs(ksn);
            ctx.fillRect(sxc - w * s / 2, top - d * s * Math.abs(ksn) / 2, Math.max(1.2, w * s), Math.max(1.2, hgt));
            return;
        }
        if (kz < z0) P4(pal[0], x0, 0, z0, x1, 0, z0, x1, h, z0, x0, h, z0);
        else if (kz > z1) P4(pal[3], x0, 0, z1, x1, 0, z1, x1, h, z1, x0, h, z1);
        if (kx < x0) P4(pal[1], x0, 0, z0, x0, 0, z1, x0, h, z1, x0, h, z0);
        else if (kx > x1) P4(pal[2], x1, 0, z0, x1, 0, z1, x1, h, z1, x1, h, z0);
        if (ky > h) P4(pal[4], x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1);
        if (s * w > 9 && L < 6) {                                // close enough to read windows
            if (kz < z0) windows(x0, z0, 1, 0, w, h, L, sd);
            if (kx < x0) windows(x0, z0, 0, 1, d, h, L, sd + 1);
            else if (kx > x1) windows(x1, z0, 0, 1, d, h, L, sd + 2);
        }
    }

    function drawTree(x, z, r) {
        const dx = x - kx, dz = z - kz, cz = -(0 - ky) * ksn + dz * kcs + 0;   // depth of the trunk base
        const cy = r * 2.6;                                                      // canopy centre height
        const czc = -(cy - ky) * ksn + dz * kcs;
        if (czc < NEAR) return;
        const s = kf / czc, px = khw + dx * s, py = khh - ((cy - ky) * kcs + dz * ksn) * s, pr = r * s;
        if (px < -pr || px > cW + pr || py < -pr || py > cH + pr + cy * s) return;
        const L = lvl(Math.sqrt(dx * dx + (cy - ky) * (cy - ky) + dz * dz));
        if (pr < 1.6) { ctx.fillStyle = GC[5][L]; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2); return; }
        if (cz >= NEAR) {                                                        // trunk
            const bx = khw + dx * (kf / cz), by = khh - ((0 - ky) * kcs + dz * ksn) * (kf / cz);
            ctx.strokeStyle = GC[6][L]; ctx.lineWidth = Math.max(1, 0.34 * s); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
        }
        ctx.fillStyle = GC[5][L]; ctx.beginPath(); ctx.arc(px, py, pr, 0, 6.2832); ctx.fill();
        if (pr > 4) { ctx.fillStyle = GC[4][L]; ctx.beginPath(); ctx.arc(px - pr * 0.28, py - pr * 0.3, pr * 0.58, 0, 6.2832); ctx.fill(); }
    }

    // a realistic tree for the avenue: a tapered trunk, a canopy made of several overlapping leafy masses,
    // darker underneath and lit from the upper left, with a soft shadow on the ground. Each tree gets its own shape.
    function drawAvenueTree(x, z, r) {
        const dx = x - kx, dz = z - kz;
        const cb = -(0 - ky) * ksn + dz * kcs;                      // trunk base depth
        if (cb < NEAR) return;
        const sb = kf / cb, bx = khw + dx * sb, by = khh - ((0 - ky) * kcs + dz * ksn) * sb;
        const cy = r * 2.6;                                         // canopy centre height
        const czc = -(cy - ky) * ksn + dz * kcs;
        if (czc < NEAR) return;
        const s = kf / czc, px = khw + dx * s, py = khh - ((cy - ky) * kcs + dz * ksn) * s, pr = r * s;
        if (px < -pr * 3 || px > cW + pr * 3 || py < -pr * 3 || by < -pr * 3) return;
        const L = lvl(Math.sqrt(dx * dx + (cy - ky) * (cy - ky) + dz * dz));
        if (pr < 2.2) { ctx.fillStyle = GC[5][L]; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2); return; }
        // ground shadow, cast away from the sun (south-west light)
        ctx.globalAlpha = 0.32 * (1 - L / (LV - 1));
        ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.ellipse(bx + pr * 0.35, by, pr * 0.95, pr * 0.28, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        // trunk: narrows toward the crown
        const tw0 = Math.max(0.8, 0.22 * s * r), tw1 = tw0 * 0.55;
        ctx.fillStyle = GC[6][L];
        ctx.beginPath(); ctx.moveTo(bx - tw0, by); ctx.lineTo(px - tw1, py); ctx.lineTo(px + tw1, py); ctx.lineTo(bx + tw0, by); ctx.closePath(); ctx.fill();
        // canopy: a few leafy masses around the centre, each a little different in size and position
        const masses = [[0, 0, 1], [-0.52, 0.12, 0.72], [0.5, 0.18, 0.7], [-0.15, -0.5, 0.66], [0.22, -0.32, 0.6]];
        masses.forEach(([ox, oy, k], m) => {
            const jx = (hash(Math.round(x * 10), Math.round(z * 10), 70 + m) - 0.5) * 0.14;
            const jy = (hash(Math.round(x * 10), Math.round(z * 10), 80 + m) - 0.5) * 0.14;
            const cx = px + (ox + jx) * pr, cyy = py + (oy + jy) * pr, rad = pr * k * 0.78;
            ctx.fillStyle = GC[5][L]; ctx.beginPath(); ctx.arc(cx, cyy, rad, 0, 6.2832); ctx.fill();
            ctx.fillStyle = GC[4][L]; ctx.beginPath(); ctx.arc(cx - rad * 0.3, cyy - rad * 0.32, rad * 0.55, 0, 6.2832); ctx.fill();
        });
    }

    function drawLamp(x, z) {
        const dx = x - kx, dz = z - kz, ch = 4.6, czt = -(ch - ky) * ksn + dz * kcs;
        if (czt < NEAR) return;
        const s = kf / czt, px = khw + dx * s, py = khh - ((ch - ky) * kcs + dz * ksn) * s;
        const czb = -(0 - ky) * ksn + dz * kcs; if (czb < NEAR) return;
        const sb = kf / czb, by = khh - ((0 - ky) * kcs + dz * ksn) * sb, bx = khw + dx * sb;
        const L = lvl(Math.sqrt(dx * dx + ky * ky + dz * dz));
        ctx.strokeStyle = GC[7][L]; ctx.lineWidth = Math.max(1, 0.16 * s); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
        ctx.globalAlpha = 0.28 * (1 - L / (LV - 1)); ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.arc(px, py, Math.max(2, 1.8 * s), 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, 0.28 * s), 0, 6.2832); ctx.fill();
    }

    // the department: a real box standing on the same ground; its front is the painted facade, drawn as
    // horizontal strips so it gets the exact perspective trapezoid (a flat sprite would look front-facing
    // while the blocks around it are seen at an angle - the old problem)
    const bXL = new Float32Array(80), bXR = new Float32Array(80), bY = new Float32Array(80);
    function drawHero() {
        const x0 = -HW / 2, x1 = HW / 2, z0 = 0, z1 = HDEP, h = HHT;
        const L = lvl(Math.sqrt((kx) * (kx) + (h / 2 - ky) * (h / 2 - ky) + (HDEP / 2 - kz) * (HDEP / 2 - kz))), pal = PAL[4][L];
        if (kx < x0) P4(pal[1], x0, 0, z0, x0, 0, z1, x0, h, z1, x0, h, z0);
        else if (kx > x1) P4(pal[2], x1, 0, z0, x1, 0, z1, x1, h, z1, x1, h, z0);
        if (ky > h) {                                                              // roof with a rose rim and a skylight
            P4('rgb(238,143,181)', x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1);
            P4(pal[4], x0 + 0.7, h, z0 + 0.7, x1 - 0.7, h, z0 + 0.7, x1 - 0.7, h, z1 - 0.7, x0 + 0.7, h, z1 - 0.7);
            P4(pal[1], -5, h, 5, 5, h, 5, 5, h, 13, -5, h, 13);
        }
        if (kx < x0 || kx > x1) windows(kx < x0 ? x0 : x1, z0, 0, 1, HDEP, h, L, 91);
        if (!(kz < 0)) return;                                                     // eye behind the front plane: facade edge-on
        // facade strips. The painted front is taller than the block: the triangular pediment (and the sign) rise
        // above the roof line. The whole painting is drawn from its top edge (hF) down to the ground, and the roof
        // line sits exactly where the painting's roof row is, so the pediment is no longer cut off.
        const roofRow = facadeReady ? facade.height * (152 - 112) / 232 : 0;     // painting row that sits on the roof line
        const hF = facadeReady ? h * facade.height / (facade.height - roofRow) : h;   // full height of the painting in world units
        let ok = true;
        const approxH = Math.abs((khh - ((0 - ky) * kcs + (0 - kz) * ksn) * kf / Math.max(NEAR, -(0 - ky) * ksn + (0 - kz) * kcs)) - (khh - ((hF - ky) * kcs + (0 - kz) * ksn) * kf / Math.max(NEAR, -(hF - ky) * ksn + (0 - kz) * kcs)));
        const N = Math.max(4, Math.min(72, Math.round(approxH / 7)));   // ~7 px strips: the slanted edges stay smooth
        for (let b = 0; b <= N; b++) {
            const y = hF * (1 - b / N);
            if (pj(x0, y, 0) < NEAR) { ok = false; break; } bXL[b] = sx; bY[b] = sy;
            if (pj(x1, y, 0) < NEAR) { ok = false; break; } bXR[b] = sx;
        }
        if (ok && facadeReady) {
            // draw the whole painting, top to bottom, so the pediment and sign are visible
            const sh = facade.height / N;
            for (let s = 0; s < N; s++) {
                const xl = (bXL[s] + bXL[s + 1]) / 2, xr = (bXR[s] + bXR[s + 1]) / 2;
                ctx.drawImage(facade, 0, s * sh, facade.width, sh, xl, bY[s], xr - xl, bY[s + 1] - bY[s] + 0.8);
            }
            if (L > 0) P4(FOG_RGBA[L], x0, 0, 0, x1, 0, 0, x1, h, 0, x0, h, 0);   // fog covers the block only (a full-height fog quad would show as a flat board)
        } else {
            P4(pal[0], x0, 0, 0, x1, 0, 0, x1, h, 0, x0, h, 0);
        }
    }

    // ---- per-frame state ----
    const order = new Int32Array(2 * 4096);
    let rowN = 0, SHD = new Float32Array(12 * 4096), shN = 0;
    let lastCamKey = '', labelEl = null;

    function render3D(D, tx, tz, ps, now) {
        const f = Math.min(0.9 * cH, 0.95 * cW);
        const pitch = (90 - 86 * ps) * Math.PI / 180;
        ksn = Math.sin(pitch); kcs = Math.cos(pitch);
        kf = f; khw = cW / 2; khh = cH / 2;
        const ty = DOORY * ps;
        kx = tx; ky = ty + D * ksn; kz = tz - D * kcs;
        fogS = D * 1.15 + 15; fogL = Math.max(300, D * 2.2); maxD = fogS + fogL;
        winBudget = 520;

        // --- sky and ground: the horizon only exists once the camera has tilted down ---
        const hy = kcs > 1e-3 ? khh - f * ksn / kcs : -1e9;
        ctx.fillStyle = GC[1][0];
        ctx.fillRect(0, 0, cW, cH);
        if (hy > 0) {
            const g = ctx.createLinearGradient(0, 0, 0, hy);
            g.addColorStop(0, '#120c22'); g.addColorStop(0.55, '#3b2559'); g.addColorStop(1, 'rgb(' + FOGC + ')');
            ctx.fillStyle = g; ctx.fillRect(0, 0, cW, Math.min(cH, hy + 1));
            // haze: from the horizon down to where the fog reaches full strength on the ground
            pj(kx, 0, kz + maxD);
            const yh = Math.max(hy, Math.min(cH, sy));
            if (hy < cH) {
                ctx.fillStyle = 'rgb(' + FOGC + ')'; ctx.fillRect(0, Math.max(0, hy), cW, Math.max(0, yh - hy) + 1);
            }
        }

        // --- which cells can be seen? (ground rays through the screen's edge points, clamped to the fog distance) ---
        let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
        for (let q = 0; q < 9; q++) {
            const px = (q % 3) * cW / 2, py = (q / 3 | 0) * cH / 2;
            const ddx = px - khw, ddy = khh - py, wy = ddy * kcs - f * ksn, wz = ddy * ksn + f * kcs;
            let gx, gz;
            if (wy < -1e-6) { const tt = ky / -wy; gx = kx + ddx * tt; gz = kz + wz * tt; } else { gx = kx + ddx * 1e6; gz = kz + wz * 1e6; }
            const rx = gx - kx, rz = gz - kz, rr = Math.hypot(rx, rz);
            if (rr > maxD) { gx = kx + rx / rr * maxD; gz = kz + rz / rr * maxD; }
            if (gx < mnx) mnx = gx; if (gx > mxx) mxx = gx; if (gz < mnz) mnz = gz; if (gz > mxz) mxz = gz;
        }
        const m = 2;
        let i0 = Math.round(mnx / CELL_X) - m, i1 = Math.round(mxx / CELL_X) + m, j0 = Math.round(mnz / CELL_Z) - m, j1 = Math.round(mxz / CELL_Z) + m;
        if (i1 - i0 > 70) { const c = Math.round(kx / CELL_X); i0 = c - 35; i1 = c + 35; }
        if (j1 - j0 > 70) { const c = Math.round(kz / CELL_Z); j0 = c - 35; j1 = c + 35; }

        // --- painter's order: rows and columns far -> near (distance from the eye's ground point, both sides interleaved) ---
        const rows = [], cols = [];
        for (let j = j0; j <= j1; j++) rows.push(j);
        for (let i = i0; i <= i1; i++) cols.push(i);
        rows.sort((a, b) => Math.abs(b * CELL_Z - kz) - Math.abs(a * CELL_Z - kz));
        cols.sort((a, b) => Math.abs(b * CELL_X - kx) - Math.abs(a * CELL_X - kx));
        let n = 0;
        for (let r = 0; r < rows.length; r++) for (let c = 0; c < cols.length; c++) {
            const i = cols[c], j = rows[r], xc = i * CELL_X, zc = j * CELL_Z;
            if (Math.hypot(xc - kx, zc - kz) - 40 > maxD) continue;            // beyond the haze
            // screen bounds of the block (ground corners + roof level); skip if it cannot touch the screen
            let behind = false, a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
            for (let k = 0; k < 8; k++) {
                const cz = pj(xc + (k & 1 ? CELL_X / 2 : -CELL_X / 2), k & 4 ? 30 : 0, zc + (k & 2 ? CELL_Z / 2 : -CELL_Z / 2));
                if (cz < NEAR) { behind = true; continue; }
                if (sx < a0) a0 = sx; if (sx > a1) a1 = sx; if (sy < b0) b0 = sy; if (sy > b1) b1 = sy;
            }
            if (!behind && (a1 < -30 || a0 > cW + 30 || b1 < -30 || b0 > cH + 30)) continue;
            if (n < 4096) { order[2 * n] = i; order[2 * n + 1] = j; n++; }
        }

        // --- pass 1: the ground (lots, lawn, path), then every shadow in one batched fill ---
        shN = 0;
        for (let q = 0; q < n; q++) {
            const i = order[2 * q], j = order[2 * q + 1], xc = i * CELL_X, zc = j * CELL_Z;
            genCell(i, j);
            const L = lvl(Math.hypot(xc - kx, ky, zc - kz));
            const px = f / Math.max(NEAR, -ky * ksn + (zc - kz) * kcs);
            if (lawn) {
                flatRect(GC[2][L], xc - CELL_X / 2, zc - CELL_Z / 2, xc + CELL_X / 2, zc + CELL_Z / 2);
                flatRect(GC[3][L], -2.2, zc - CELL_Z / 2, 2.2, Math.min(zc + CELL_Z / 2, 0));
                continue;
            }
            if (px * CELL_X > 9) flatRect(GC[0][L], xc - LOT_X / 2, zc - LOT_Z / 2, xc + LOT_X / 2, zc + LOT_Z / 2);
            if (px * CELL_X < 12) continue;                                      // too small to bother with shadows
            for (let b = 0; b < cbN && shN < 4096; b++) {                        // sun low in the south-west: shadows fall north-east
                const o = b * 6, hh = CB[o + 4], ox = hh * 0.5, oz = hh * 0.36;
                const X0 = CB[o], X1 = CB[o + 1], Z0 = CB[o + 2], Z1 = CB[o + 3];
                W3[0] = X0; W3[2] = Z0; W3[3] = X1; W3[5] = Z0; W3[6] = X1 + ox; W3[8] = Z0 + oz; W3[9] = X1 + ox; W3[11] = Z1 + oz; W3[12] = X0 + ox; W3[14] = Z1 + oz; W3[15] = X0; W3[17] = Z1;
                W3[1] = W3[4] = W3[7] = W3[10] = W3[13] = W3[16] = 0;
                let ok = true;
                for (let v = 0; v < 6; v++) { if (pj(W3[3 * v], 0, W3[3 * v + 2]) < NEAR) { ok = false; break; } SHD[shN * 12 + v * 2] = sx; SHD[shN * 12 + v * 2 + 1] = sy; }
                if (ok) shN++;
            }
        }
        if (shN) {
            ctx.beginPath();
            for (let s = 0; s < shN; s++) { const o = s * 12; ctx.moveTo(SHD[o], SHD[o + 1]); for (let v = 1; v < 6; v++) ctx.lineTo(SHD[o + v * 2], SHD[o + v * 2 + 1]); ctx.closePath(); }
            ctx.fillStyle = 'rgba(8,4,16,.34)'; ctx.fill();
        }
        // road lane lines: one batched stroke, only near the camera
        ctx.beginPath();
        for (let q = 0; q < n; q++) {
            const i = order[2 * q], j = order[2 * q + 1], xc = i * CELL_X, zc = j * CELL_Z;
            if (Math.hypot(xc - kx, zc - kz) > fogS + fogL * 0.5) continue;
            const xa = xc + CELL_X / 2, za = zc - CELL_Z / 2;
            if (pj(xa, 0, za) >= NEAR) { const ax = sx, ay = sy; if (pj(xa, 0, za + CELL_Z) >= NEAR) { ctx.moveTo(ax, ay); ctx.lineTo(sx, sy); } }
            if (pj(xc - CELL_X / 2, 0, za) >= NEAR) { const ax = sx, ay = sy; if (pj(xc + CELL_X / 2, 0, za) >= NEAR) { ctx.moveTo(ax, ay); ctx.lineTo(sx, sy); } }
        }
        ctx.strokeStyle = 'rgba(255,214,228,.2)'; ctx.lineWidth = Math.max(0.6, Math.min(2, kf / Math.max(30, ky + D) * 0.25)); ctx.stroke();

        // --- pass 2: objects, far -> near. The department is drawn at its own distance from the eye ---
        const heroDist = Math.abs(HDEP / 2 - kz);
        let heroDone = false;
        const heroGroup = () => {
            heroDone = true;
            drawTree(-17, 10, 3); drawTree(17, 10, 3);                         // trees beside and behind the building
            if (kz >= 0) { drawLamp(-9, -4); drawLamp(9, -4); }               // eye north of the front: forecourt props are behind it
            drawHero();
            if (kz < 0) { drawLamp(-9, -4); drawLamp(9, -4); }                // eye south of the front: they stand in front of it
        };
        for (let q = 0; q < n; q++) {
            const i = order[2 * q], j = order[2 * q + 1], xc = i * CELL_X, zc = j * CELL_Z;
            if (!heroDone && Math.abs(zc - kz) < heroDist) heroGroup();
            genCell(i, j);
            if (lawn) {
                // the campus green: a double row of trees along the approach, every 12 m (clear of the building itself)
                const sA = Math.ceil((zc - CELL_Z / 2) / 12), sB = Math.ceil((zc + CELL_Z / 2) / 12) - 1;
                for (let s = sB; s >= sA; s--) if (s * 12 <= -8) {
                    const r = 2.6 + hash(s, 5, 3) * 0.8;
                    drawAvenueTree(-16, s * 12, r); drawAvenueTree(16, s * 12, r);
                }
                continue;
            }
            // within a block, the tree row at the front and then the buildings
            const bs = [];
            for (let b = 0; b < cbN; b++) bs.push(b);
            if (cbN === 2) bs.sort((a, b) => Math.abs((CB[b * 6] + CB[b * 6 + 1]) / 2 - kx) - Math.abs((CB[a * 6] + CB[a * 6 + 1]) / 2 - kx));
            // trees behind the eye-facing side are drawn first, trees in front after
            for (let t = 0; t < ctN; t++) if (CT[t * 3 + 1] > kz) drawTree(CT[t * 3], CT[t * 3 + 1], CT[t * 3 + 2]);
            for (let k = 0; k < bs.length; k++) { const o = bs[k] * 6; drawBuilding(CB[o], CB[o + 1], CB[o + 2], CB[o + 3], CB[o + 4], CB[o + 5] | 0, i * 131 + j * 7 + k); }
            for (let t = 0; t < ctN; t++) if (!(CT[t * 3 + 1] > kz)) drawTree(CT[t * 3], CT[t * 3 + 1], CT[t * 3 + 2]);
        }
        if (!heroDone) heroGroup();

        // --- one label that floats above the department while it is still small on screen ---
        const la = clamp((D - 16) / 30) * clamp(1 - (D - 1500) / 600);
        if (la > 0.02 && pj(0, HHT + 5, 0) >= NEAR) {
            const bn = document.documentElement.lang === 'bn';
            const txt = bn ? 'অর্থনীতি বিভাগ' : 'Economics Department';
            ctx.globalAlpha = la;
            ctx.font = '600 15px "Hind Siliguri","Noto Serif Bengali","Noto Sans Bengali","Nirmala UI","Cormorant Garamond",Georgia,sans-serif';
            ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
            ctx.strokeStyle = '#0e0a14'; ctx.strokeText(txt, sx, sy - 8);
            ctx.fillStyle = '#ffd6e4'; ctx.fillText(txt, sx, sy - 8);
            ctx.fillStyle = '#ee8fb5'; ctx.beginPath(); ctx.arc(sx, sy, 3.2, 0, 6.2832); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // ---------- frame loop ----------
    // Scroll only records "something changed" (wake). The loop then eases toward the scroll position with a
    // time-based lerp and stops by itself once it has settled, so an idle page costs nothing. Per frame, only
    // what actually changed is touched: the SVG map (stages 0-4) or the 3D canvas (stages 4-5), never both.
    const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    let lastLit = 0, svgHidden = false, lastCa = -1, svgDirty = true, lastDir = 0, lastDistOn = true, lastSvgFade = '1';

    function frame(now) {
        raf = 0;
        if (!visible) { sp = null; if (window.TaniaRoom) window.TaniaRoom.update(-1); return; }   // off screen: skip all the work
        const lead = BASE_H * 0.25;   // the map waits a moment before it starts to zoom (fixed, see BASE_H)
        const px = scrollY - trackDocTop - lead;                  // scroll distance since the zoom started (no layout read per frame)
        // piecewise: stages 0-4 over PRE_PX, then 4-7 over POST_PX; target is the position on the 0..7 timeline, as 0..1
        const tT = px <= 0 ? 0 : px <= PRE_PX ? preT(px / PRE_PX) : postT(px - PRE_PX);
        const target = clamp(tT / (STAGES.length - 1));
        const frameEx = clamp((px - PRE_PX - POST_PX) / EXTRA_PX);   // 0..1 through the frame-by-frame tail
        // ease toward the scroll position (frame-rate independent lerp), so zooming in AND out is gradual
        const dt = Math.min(64, now - lastNow || 16); lastNow = now;
        if (sp === null || reduceMotion) sp = target;
        else { sp += (target - sp) * (1 - Math.exp(-dt / 95)); if (Math.abs(target - sp) < 0.00008) sp = target; }
        const p = sp;
        const N = STAGES.length, t = p * (N - 1);
        const i = Math.min(N - 2, Math.floor(t)), f = t - i;
        // smooth start and stop between stops. The approach to the department uses a softer curve (smootherstep),
        // so the camera leaves the wider view gently and glides up to the gate instead of rushing at it
        const e = f * f * (3 - 2 * f);

        const a = view(i), b = view(i + 1);
        const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), e));   // zoom in logarithmic steps
        const cx = lerp(a.cx, b.cx, e), cy = lerp(a.cy, b.cy, e), h = w * ratio;
        const changed = Math.abs(t - lastT) > 1e-6;
        const dir = t - lastT > 1e-6 ? 1 : t - lastT < -1e-6 ? -1 : 0;
        if (dir !== 0 && dir !== lastDir) {
            // the scroll just reversed (zooming back out): forget every cached style value so each layer
            // is written again from the current position instead of trusting a stale cache
            lastDir = dir;
            lastCa = -1; lastCamKey = ''; lastCityFade = ''; lastCityShown = null;
            lastHero = ''; lastFlatten = -1; lastInside = -1; svgDirty = true; lastCityShown = null; lastSvgFade = '';
        }
        lastT = t;

        // cross-fade: the flat map hands over to the 3D city while the zoom is still in the top-down view
        const ca = clamp((t - 4.05) / 0.3) * (1 - clamp((t - 5.0) / 0.35));
        const svgOn = ca < 0.999;

        // ----- 3D city (canvas) -----
        if (ca > 0.002) {
            if (!cvOn) { cv.style.display = 'block'; cvOn = true; lastCamKey = ''; }
            const cs = ca.toFixed(3);
            if (cs !== lastCa) { cv.style.opacity = cs; lastCa = cs; }
            // only fade the flat map out on the way IN (t 4.05-4.35): on the way back toward the gate (t > 5.0)
            // the camG block below takes over the flat map's opacity on its own slower curve, and always runs
            // after this, so it wins there - this just stops the two pictures double-exposing on the way in
            if (t <= 5.0) {
                const svgFade = (1 - ca).toFixed(3);
                if (svgFade !== lastSvgFade) { svg.style.opacity = svgFade; lastSvgFade = svgFade; }
            }
            // camera distance: identical to the SVG's zoom while the two cross-fade (same ground footprint), then it
            // keeps flying in at a slower pace than the flat map did, so there is time to pass through the blocks
            const fpx = Math.min(0.9 * cH, 0.95 * cW);
            const D0 = view(4).w * K * fpx / cW, D1 = Math.max(3, view(5).w * K * fpx / cW);
            const uu = clamp(t - 4), gp = uu, g = lerp(gp, smooth(uu), smooth((uu - 0.85) / 0.15));
            const D = Math.exp(lerp(Math.log(D0), Math.log(D1), g));
            const tx = (cx - DOOR.lon) * K, tz = (-cy - DOOR.lat) * K;
            const ps = smooth((g - 0.08) / 0.82);                                 // 0 = looking straight down, 1 = eye level at the door
            const key = D.toFixed(3) + '|' + tx.toFixed(2) + '|' + tz.toFixed(2) + '|' + ps.toFixed(4) + '|' + cW + 'x' + cH + (facadeReady ? 'f' : '');
            if (key !== lastCamKey) {
                const t0 = performance.now();
                render3D(D, tx, tz, ps, now);
                lastCamKey = key;
                // adaptive resolution: a slow 3D frame draws at a lower resolution for a while (the canvas is stretched
                // to the same size, so the layout does not change); when frames are fast again, sharpness comes back
                const cost = performance.now() - t0;
                if (cost > R3_BUDGET && cvScale > 0.5) {
                    if (r3Slow) { cvScale = Math.max(0.5, cvScale - 0.125); r3Quick = 0; r3Slow = 0; applyCanvasSize(); lastCamKey = ''; }
                    else r3Slow = 1;
                } else {
                    r3Slow = 0;
                    if (cost < R3_BUDGET * 0.5 && cvScale < 1 && ++r3Quick > 30) { cvScale = Math.min(1, cvScale + 0.125); r3Quick = 0; applyCanvasSize(); lastCamKey = ''; }
                }
            }
        } else if (cvOn) { cv.style.display = 'none'; cvOn = false; lastCa = -1; if (lastSvgFade !== '1') { svg.style.opacity = ''; lastSvgFade = '1'; } }

        // ----- flat SVG map (hidden, and not updated at all, once the 3D city has fully taken over) -----
        if (svgOn) {
            if (svgHidden) { svg.style.visibility = ''; svgHidden = false; svgDirty = true; }
            if (changed || svgDirty) {
                svgDirty = false;
                svg.setAttribute('viewBox', (cx - w / 2) + ' ' + (cy - h / 2) + ' ' + w + ' ' + h);
                const u = w / pxW;   // SVG units per screen pixel: keeps names the same size on screen

                // the country fades once the zoom is inside Bogura, the district fill only lightly tints it
                countryG.setAttribute('opacity', clamp(1 - (t - 0.6) / 0.8).toFixed(3));
                const cityFade = clamp((t - 0.4) / 0.4).toFixed(3);
                if (cityFade !== lastCityFade) { cityG.style.opacity = cityFade; lastCityFade = cityFade; }
                const cityShown = t > 0.35;   // hidden (not just faded) while far out, so it costs nothing to draw
                if (cityShown !== lastCityShown) { cityG.style.display = cityShown ? '' : 'none'; lastCityShown = cityShown; }
                const distOn = t < 1.3;
                if (distOn !== lastDistOn) { distG.style.display = distOn ? '' : 'none'; lastDistOn = distOn; }
                // the college-area buildings follow the zoom itself: each one rises as the camera comes in
                // (nearer ones first). They stay standing as the camera goes on in, so they leave the screen
                // with the zoom instead of shrinking away. Driven by the scroll position, so zooming back and forth
                // shows the same picture every time.
                const cityOn = t > 0.7;
                cityBuildNear.forEach(bd => {
                    const raw = cityOn ? clamp((t - 0.7 - bd.d * 0.55) / 0.2) : 0;
                    const g = raw <= 0 ? 0 : easeBack(raw);
                    if (g === bd.g) return;
                    bd.g = g;
                    paintBuilding(bd, g);
                });
                boguraG.style.setProperty('--bf', (0.2 * clamp((t - 0.4) / 0.6) * clamp(1 - (t - 1.8) / 0.6)).toFixed(3));

                // labels: viewport-culled - a name outside the view (or invisible) is display:none and costs nothing
                const vx0 = cx - w / 2 - 230 * u, vx1 = cx + w / 2 + 230 * u, vy0 = cy - h / 2 - 60 * u, vy1 = cy + h / 2 + 60 * u;
                LABELS.forEach(l => {
                    const o = clamp(l.op(t));
                    const inView = o > 0.003 && l.lon >= vx0 && l.lon <= vx1 && -l.lat >= vy0 && -l.lat <= vy1;
                    if (!inView) {
                        if (l.shown !== false) {
                            l.shown = false;
                            l.names.forEach(el => { el.style.display = 'none'; });
                            l.descs.forEach(el => { el.style.display = 'none'; });
                            if (l.dot) l.dot.style.display = 'none';
                        }
                        return;
                    }
                    if (l.shown === false) {
                        l.shown = true;
                        l.names.forEach(el => { el.style.display = ''; });
                        l.descs.forEach(el => { el.style.display = ''; });
                        if (l.dot) l.dot.style.display = '';
                    }
                    const px = l.px(t) * (innerWidth < 760 ? 0.72 : 1);   // smaller names on phones, so they do not cover the buildings
                    const pl = POS[l.pos];
                    const x0 = l.lon, y0 = -l.lat;
                    const sizes = l.names.map(el => fitName(el, px * u, w));
                    let x = x0 + pl.dx * u;
                    const y = y0 + pl.dy * u;
                    if (pl.anchor === 'middle') {          // centred names are pulled in from the screen edges
                        const hw = Math.max(0, ...l.names.map((el, i) => (el._k || 0) * sizes[i] / 2));
                        x = Math.min(Math.max(x, cx - w / 2 + hw + 2 * u), cx + w / 2 - hw - 2 * u);
                    }
                    // thicker outline on bigger text so it keeps separating from busy buildings as it grows
                    const halo = ((1.2 + px * 0.08) * u).toFixed(4);   // same outline as before, about half as thick, grows gently with the text
                    l.names.forEach((el, i) => {
                        POS_SET(el, x, y, pl.anchor);
                        el.setAttribute('font-size', sizes[i].toFixed(4));
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

                // the plan of the department (from above) shows first, then the 3D camera takes over
                const planO = (clamp((t - 2.3) / 0.5) * (1 - clamp((t - 3.4) / 0.35))).toFixed(2);
                if (planO !== lastHero) { heroG.style.opacity = planO; lastHero = planO; }

            }
            // pins pulse every frame while visible (two circles each - trivial)
            if (t > 0.5 && t < 4.4) {
                const u = w / pxW, pulse = (Math.sin(now / 400) + 1) / 2;
                pinEls.forEach(pn => {
                    const o = clamp((t - pn.from) / 0.4) * (1 - clamp((t - 4.0) / 0.3));
                    const r = 5 * u;
                    [pn.dot, pn.ring].forEach(c => { c.setAttribute('cx', pn.lon); c.setAttribute('cy', -pn.lat); });
                    pn.dot.setAttribute('r', r.toFixed(4)); pn.dot.setAttribute('opacity', o);
                    pn.ring.setAttribute('r', (r * (2 + pulse * 1.5)).toFixed(4));
                    pn.ring.setAttribute('opacity', o * (1 - pulse) * 0.8);
                });
                // (the old window glimmer changed the window pattern 8 times a second, which repainted every window
                //  on the screen; the windows are static now)
            }
        } else if (!svgHidden) { svg.style.visibility = 'hidden'; svgHidden = true; }

        // ----- inside the gate: the view fades in, the doors open, then the camera walks through into the room.
        // This runs on every frame (not only past the gate), so scrolling back up fades everything out again. -----
        if (camG) {
            // the room is fully opaque before the doors start to open (t 5.35), so the map behind never shows through the opening
            const gIn = smooth((t - 5.1) / 0.2);
            const dP = Math.min(1, Math.max(0, (t - 5.35) / 0.45));   // raw door progress, eased inside paintDoors()
            const walk = smooth((t - 5.3) / 0.7);
            const key = Math.round(gIn * 200) + '|' + Math.round(dP * 400) + '|' + Math.round(walk * 1000);
            if (key !== lastInside) {
                lastInside = key;
                interior.style.opacity = gIn.toFixed(3);
                // the flat 2D map under the room is the green campus lawn: it must give way to the room
                // as the gate opens, otherwise its green shows through the arch as a glitch
                svg.style.opacity = (1 - smooth((t - 5.0) / 0.3)).toFixed(3);
                interior.style.visibility = gIn <= 0 ? 'hidden' : 'visible';
                camG.setAttribute('transform', `translate(500 ${(300 - 80 * walk).toFixed(2)}) scale(${(1 + 0.3 * walk).toFixed(4)}) translate(-500 -300)`);
                gateG.style.opacity = (1 - smooth((t - 5.55) / 0.35)).toFixed(3);
                paintDoors(dP);
                capEl.style.opacity = smooth((t - 5.6) / 0.35).toFixed(3);
            }
        }

        // Tania (tania.js): she lives inside #map-interior and reads the same timeline `t` the camera
        // walk-through already uses, so she is always perfectly in sync with the room, forwards and backwards.
        // This is the only touch point - if tania.js is not loaded, window.TaniaRoom is undefined and this is a no-op.
        if (window.TaniaRoom) window.TaniaRoom.update(t, frameEx);

        // keep going only while something is still moving (or the pins are pulsing)
        if (sp !== target || (svgOn && t > 0.5 && t < 4.4)) raf = requestAnimationFrame(frame);
    }

    // the gate, the doors and a decorated room, drawn in one-point perspective (vanishing point 500,300).
    // colours follow the site theme: deep plum, rose, blush, lilac and sage, lit by warm lamps.
    function buildInteriorArt() {
        if (!interiorArt) return;
        let rs = 77123;
        const rr = () => (rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296;
        const f1 = v => (+v).toFixed(1);
        const P = pts => pts.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L');
        const poly = (pts, a) => `<path d="M${P(pts)}Z" ${a}/>`;
        const line = (pts, a) => `<path d="M${P(pts)}" fill="none" ${a}/>`;
        // wall point: side -1 left / 1 right, s = depth (0 screen edge .. 1 back wall), h = height (0 floor .. 1 ceiling)
        const WP = (side, s, h) => [side < 0 ? 360 * s : 1000 - 360 * s, (600 - 190 * s) - h * (600 - 380 * s)];
        const WQ = (side, s0, s1, h0, h1, a) => poly([WP(side, s0, h0), WP(side, s1, h0), WP(side, s1, h1), WP(side, s0, h1)], a);
        const BW = (x, h) => [x, 410 - h * 220];                  // back wall point
        const FP = (s, u) => [500 + u * (500 - 360 * s), 600 - 190 * s];   // floor point (u -1 .. 1)
        const K = 300 / 110;                                       // lines through the vanishing point
        let r = '';

        // ---- shell ----
        r += '<rect x="-200" y="-200" width="1400" height="1000" fill="#0e0a14"/>';
        r += '<polygon points="0,0 1000,0 640,190 360,190" fill="url(#rm-ceil)"/>';
        r += '<polygon points="0,600 1000,600 640,410 360,410" fill="url(#rm-floor)"/>';
        r += '<polygon points="0,0 360,190 360,410 0,600" fill="url(#rm-wl)"/>';
        r += '<polygon points="1000,0 640,190 640,410 1000,600" fill="url(#rm-wr)"/>';
        r += '<rect x="360" y="190" width="280" height="220" fill="url(#rm-back)"/>';
        // ceiling beams
        for (let i = 0; i <= 4; i++) {
            const xb = 360 + 70 * i;
            r += line([[xb, 190], [500 + (xb - 500) * K, 0]], 'stroke="#140810" stroke-opacity=".55" stroke-width="7"');
        }
        [.28, .55, .8].forEach(s => { r += line([[360 * s, 190 * s], [1000 - 360 * s, 190 * s]], 'stroke="#140810" stroke-opacity=".5" stroke-width="' + (5 + 9 * (1 - s)) + '"'); });
        // floor boards
        for (let i = 0; i <= 12; i++) {
            const xb = 360 + 280 * i / 12;
            r += line([[xb, 410], [500 + (xb - 500) * K, 600]], 'stroke="#3c2639" stroke-opacity=".5" stroke-width="1.3"');
        }
        for (let k = 0; k < 7; k++) {
            const s = .12 + k * .13;
            const [x1, y] = FP(s, -1), [x2] = FP(s, 1);
            r += line([[x1, y], [x2, y]], 'stroke="#3c2639" stroke-opacity=".25" stroke-width="1"');
        }
        // wall panelling: wainscot, rail, panels, crown moulding, skirting
        [-1, 1].forEach(sd => {
            r += WQ(sd, 0, 1, 0, .27, 'fill="#4b2e49" fill-opacity=".9"');
            r += WQ(sd, 0, 1, .27, .295, 'fill="#ee8fb5" fill-opacity=".55"');
            for (let s = .06; s < .9; s += .2) r += WQ(sd, s, s + .15, .05, .23, 'fill="none" stroke="#733c67" stroke-width="1.3"');
            r += WQ(sd, 0, 1, .955, 1, 'fill="#733c67"');
            r += WQ(sd, 0, 1, 0, .035, 'fill="#16060f"');
        });
        r += poly([BW(360, 0), BW(640, 0), BW(640, .27), BW(360, .27)], 'fill="#4b2e49" fill-opacity=".9"');
        r += poly([BW(360, .27), BW(640, .27), BW(640, .295), BW(360, .295)], 'fill="#ee8fb5" fill-opacity=".55"');
        for (let i = 0; i < 5; i++) r += `<rect x="${368 + i * 56}" y="${(410 - .23 * 220).toFixed(1)}" width="48" height="${(.18 * 220).toFixed(1)}" fill="none" stroke="#733c67" stroke-width="1.2"/>`;
        r += '<rect x="360" y="190" width="280" height="9" fill="#733c67"/><rect x="360" y="199" width="280" height="2" fill="#ee8fb5" fill-opacity=".5"/>';
        r += '<rect x="360" y="402" width="280" height="8" fill="#16060f"/>';

        // ---- window with a dusk sky, curtains and a light shaft ----
        r += '<ellipse cx="500" cy="290" rx="110" ry="120" fill="url(#rm-wglow)"/>';
        r += '<path d="M453 346V262A47 47 0 0 1 547 262V346Z" fill="url(#rm-sky)"/>';
        r += '<g clip-path="url(#rm-wclip)">';
        for (let k = 0; k < 14; k++) r += `<circle cx="${f1(458 + rr() * 84)}" cy="${f1(222 + rr() * 60)}" r="${f1(.5 + rr() * .9)}" fill="#fff" fill-opacity="${f1(.4 + rr() * .5)}"/>`;
        r += '<circle cx="528" cy="244" r="8" fill="#fff4dc"/><circle cx="531" cy="242" r="7" fill="#e7a8c6" fill-opacity=".55"/>';
        let cx0 = 453;
        while (cx0 < 547) { const bw = 7 + rr() * 11, bh = 12 + rr() * 30; r += `<rect x="${f1(cx0)}" y="${f1(346 - bh)}" width="${f1(bw)}" height="${f1(bh)}" fill="#45283c"/>`; if (rr() < .6) r += `<rect x="${f1(cx0 + 2)}" y="${f1(346 - bh + 4)}" width="2" height="2.4" fill="#ffe2a8"/>`; cx0 += bw + 1; }
        r += '</g>';
        r += '<path d="M453 346V262A47 47 0 0 1 547 262V346Z" fill="none" stroke="#cdb4f0" stroke-width="5"/>';
        r += '<path d="M500 215V346M453 304H547" stroke="#ffd6e4" stroke-width="3"/>';
        r += '<rect x="445" y="346" width="110" height="8" rx="2" fill="#ffd6e4"/><rect x="445" y="354" width="110" height="3" fill="#0a0408" fill-opacity=".35"/>';
        r += '<line x1="426" y1="198" x2="574" y2="198" stroke="#ffd6e4" stroke-width="3"/><circle cx="424" cy="198" r="4" fill="#ee8fb5"/><circle cx="576" cy="198" r="4" fill="#ee8fb5"/>';
        r += '<path d="M432 199H466V392Q449 400 432 392Z" fill="url(#rm-cur)"/><path d="M534 199H568V392Q551 400 534 392Z" fill="url(#rm-cur)"/>';
        r += '<path d="M432 199H466V214Q449 222 432 214Z" fill="#0a0408" fill-opacity=".25"/><path d="M534 199H568V214Q551 222 534 214Z" fill="#0a0408" fill-opacity=".25"/>';

        // ---- back wall pictures: supply & demand chart, clock, bar chart ----
        r += '<rect x="371" y="233" width="52" height="58" fill="#3b2538" stroke="#ee8fb5" stroke-width="2.5"/>';
        r += '<path d="M380 281V245M380 281H415" stroke="#cdb4f0" stroke-width="1.4" fill="none"/>';
        r += '<path d="M382 276L412 249" stroke="#ee8fb5" stroke-width="2" fill="none"/><path d="M382 250L412 276" stroke="#cdb4f0" stroke-width="2" fill="none"/>';
        r += '<circle cx="397" cy="263" r="3" fill="#ffd6e4"/><path d="M397 263V281M397 263H380" stroke="#ffd6e4" stroke-opacity=".6" stroke-width="1" stroke-dasharray="2 2" fill="none"/>';
        r += '<circle cx="602" cy="248" r="17" fill="#d8c7d5" stroke="#cdb4f0" stroke-width="3.5"/><path d="M602 248V237M602 248L610 253" stroke="#45293e" stroke-width="2" stroke-linecap="round"/><circle cx="602" cy="248" r="1.8" fill="#ee8fb5"/>';
        for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; r += `<line x1="${f1(602 + Math.sin(a) * 13)}" y1="${f1(248 - Math.cos(a) * 13)}" x2="${f1(602 + Math.sin(a) * 15)}" y2="${f1(248 - Math.cos(a) * 15)}" stroke="#a55389" stroke-width="1"/>`; }
        r += '<rect x="578" y="278" width="50" height="46" fill="#3b2538" stroke="#cdb4f0" stroke-width="2.5"/>';
        [[584, 14, '#ee8fb5'], [594, 22, '#cdb4f0'], [604, 30, '#ffd6e4'], [614, 37, '#9bb89a']].forEach(([bx, bh, c]) => { r += `<rect x="${bx}" y="${318 - bh}" width="7" height="${bh}" fill="${c}"/>`; });
        r += '<rect x="376" y="302" width="36" height="24" fill="#4f2f49" stroke="#ee8fb5" stroke-width="2"/><path d="M382 318l8-8 6 5 9-9 6 6" stroke="#9bb89a" stroke-width="1.6" fill="none"/>';

        // ---- left wall: bookshelf ----
        r += WQ(-1, .6, .93, .05, .86, 'fill="#5c3350"');
        r += WQ(-1, .615, .915, .075, .835, 'fill="#3b2536"');
        const spineC = ['#ee8fb5', '#cdb4f0', '#ffd6e4', '#9bb89a', '#ab527e', '#d8c7d5', '#a55389', '#e7a8c6'];
        for (let row = 0; row < 4; row++) {
            const h0 = .085 + row * .19;
            r += WQ(-1, .6, .93, h0 - .012, h0 + .004, 'fill="#733c60"');
            let s = .622;
            while (s < .895) {
                const bw = .012 + rr() * .016, bh = .1 + rr() * .07;
                if (s + bw > .91) break;
                r += WQ(-1, s, s + bw, h0 + .004, h0 + .004 + bh, `fill="${spineC[Math.floor(rr() * spineC.length)]}" stroke="#3b2536" stroke-width=".4"`);
                s += bw + .002;
            }
        }
        r += WQ(-1, .6, .93, .86, .875, 'fill="#733c60"');

        // ---- right wall: chalkboard with supply & demand ----
        r += WQ(1, .38, .76, .30, .80, 'fill="#d9b06a"');
        r += WQ(1, .395, .745, .335, .785, 'fill="url(#rm-board)"');
        r += WQ(1, .37, .77, .275, .305, 'fill="#c9a24a"');
        const BP = (s, h) => WP(1, s, h);
        r += line([BP(.43, .70), BP(.43, .39), BP(.71, .39)], 'stroke="#d8c7d5" stroke-opacity=".85" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
        r += line([BP(.44, .43), BP(.70, .72)], 'stroke="#ee8fb5" stroke-width="2.6" stroke-linecap="round"');
        r += line([BP(.44, .72), BP(.70, .43)], 'stroke="#cdb4f0" stroke-width="2.6" stroke-linecap="round"');
        const E = BP(.57, .575);
        r += line([E, BP(.57, .39)], 'stroke="#ffd6e4" stroke-opacity=".7" stroke-width="1.3" stroke-dasharray="3 3"');
        r += line([E, BP(.43, .575)], 'stroke="#ffd6e4" stroke-opacity=".7" stroke-width="1.3" stroke-dasharray="3 3"');
        r += `<circle cx="${f1(E[0])}" cy="${f1(E[1])}" r="3.4" fill="#ffd6e4"/>`;
        [['P', BP(.425, .735)], ['Q', BP(.725, .385)], ['S', BP(.72, .735)], ['D', BP(.72, .425)]].forEach(([t, p]) => { r += `<text x="${f1(p[0] - 3)}" y="${f1(p[1] + 3)}" font-size="9" font-family="Cormorant Garamond, serif" font-style="italic" font-weight="700" fill="#ffd6e4">${t}</text>`; });
        r += WQ(1, .45, .52, .31, .33, 'fill="#d8c7d5" fill-opacity=".7"');

        // ---- framed pictures near the front of both walls ----
        r += WQ(-1, .12, .27, .42, .74, 'fill="#d9b06a"') + WQ(-1, .135, .255, .45, .71, 'fill="url(#rm-art1)"');
        r += WQ(1, .12, .27, .42, .74, 'fill="#d9b06a"') + WQ(1, .135, .255, .45, .71, 'fill="url(#rm-art2)"');

        // ---- rug ----
        r += poly([FP(.26, -.66), FP(.26, .66), FP(.9, .66), FP(.9, -.66)], 'fill="#502849" stroke="#ee8fb5" stroke-width="2.5"');
        r += poly([FP(.3, -.58), FP(.3, .58), FP(.86, .58), FP(.86, -.58)], 'fill="#781848"');
        r += poly([FP(.34, -.5), FP(.34, .5), FP(.82, .5), FP(.82, -.5)], 'fill="#673055" stroke="#ffd6e4" stroke-opacity=".6" stroke-width="1.4"');
        r += poly([FP(.43, 0), FP(.58, .32), FP(.73, 0), FP(.58, -.32)], 'fill="#ee8fb5" fill-opacity=".75"');
        r += poly([FP(.5, 0), FP(.58, .15), FP(.66, 0), FP(.58, -.15)], 'fill="#ffd6e4"');
        [-.4, .4].forEach(u => { [.4, .58, .76].forEach(s => { const p = FP(s, u); r += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(10 * s)}" ry="${f1(3 * s)}" fill="#cdb4f0" fill-opacity=".75"/>`; }); });
        for (let i = 0; i <= 14; i++) { const u = -.66 + i * .66 / 7; r += line([FP(.9, u), FP(.915, u)], 'stroke="#ffd6e4" stroke-opacity=".6" stroke-width="1"'); r += line([FP(.26, u), FP(.245, u)], 'stroke="#ffd6e4" stroke-opacity=".6" stroke-width="1"'); }
        // window light falling across the floor
        r += poly([FP(.93, -.3), FP(.93, .3), FP(.34, .46), FP(.34, -.46)], 'fill="url(#rm-shaft)"');

        // ---- lecture desk under the window ----
        r += '<ellipse cx="500" cy="428" rx="98" ry="9" fill="#0a0408" fill-opacity=".5"/>';
        r += '<polygon points="436,378 564,378 582,392 418,392" fill="url(#rm-wood)"/>';
        r += '<rect x="418" y="392" width="164" height="32" fill="#5a3a43"/><rect x="418" y="392" width="164" height="3" fill="#0a0408" fill-opacity=".35"/>';
        r += '<rect x="428" y="399" width="64" height="20" fill="none" stroke="#482f38" stroke-width="1.5"/><rect x="508" y="399" width="64" height="20" fill="none" stroke="#482f38" stroke-width="1.5"/>';
        r += '<circle cx="460" cy="409" r="2.6" fill="#ee8fb5"/><circle cx="540" cy="409" r="2.6" fill="#ee8fb5"/>';
        // laptop
        r += '<rect x="474" y="351" width="52" height="30" rx="2" fill="#3b2538" stroke="#673c5c" stroke-width="1.5"/><rect x="477" y="354" width="46" height="24" fill="url(#rm-screen)"/>';
        r += '<path d="M481 374l8-8 6 4 8-9 7 5 8-7" stroke="#ffd6e4" stroke-width="1.5" fill="none"/>';
        r += '<polygon points="470,381 530,381 536,387 464,387" fill="#482943"/>';
        r += '<ellipse cx="500" cy="388" rx="50" ry="6" fill="#cdb4f0" fill-opacity=".18"/>';
        // books, lamp, cup
        r += '<rect x="440" y="369" width="30" height="9" fill="#ee8fb5"/><rect x="443" y="361" width="26" height="8" fill="#cdb4f0"/><rect x="441" y="354" width="28" height="7" fill="#9bb89a"/>';
        r += '<ellipse cx="552" cy="379" rx="11" ry="3" fill="#45293e"/><path d="M552 379L546 361L536 354" stroke="#d9b06a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M526 351L548 351L542 362L530 362Z" fill="#9bb89a"/>';
        r += '<ellipse cx="536" cy="368" rx="30" ry="22" fill="url(#rm-lampglow)"/>';
        r += '<rect x="560" y="366" width="9" height="12" fill="#cdb4f0"/><path d="M563 366l-2-9M566 366l3-8" stroke="#ee8fb5" stroke-width="1.4"/>';

        // ---- globe on a stand ----
        const g = FP(.58, .78);
        r += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="26" ry="7" fill="#0a0408" fill-opacity=".5"/>`;
        r += `<path d="M${f1(g[0] - 16)} ${f1(g[1])}L${f1(g[0])} ${f1(g[1] - 46)}L${f1(g[0] + 16)} ${f1(g[1])}" stroke="#c9a24a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        r += `<circle cx="${f1(g[0])}" cy="${f1(g[1] - 76)}" r="30" fill="url(#rm-globe)"/>`;
        r += `<path d="M${f1(g[0] - 14)} ${f1(g[1] - 92)}q9-8 18 1q-2 9-10 8z M${f1(g[0] + 2)} ${f1(g[1] - 70)}q10-4 14 6q-6 9-14 2z M${f1(g[0] - 18)} ${f1(g[1] - 68)}q6-3 8 5q-5 4-8-1z" fill="#9bb89a" fill-opacity=".85"/>`;
        r += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 76)}" rx="30" ry="9" fill="none" stroke="#ffd6e4" stroke-opacity=".4" stroke-width="1"/><path d="M${f1(g[0] + 30)} ${f1(g[1] - 76)}A30 30 0 0 1 ${f1(g[0] - 22)} ${f1(g[1] - 54)}" stroke="#ffd6e4" stroke-width="3" fill="none" stroke-linecap="round"/>`;

        // ---- wall sconces and pendant lamps ----
        [-1, 1].forEach(sd => {
            const p = WP(sd, .46, .66);
            r += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="54" ry="64" fill="url(#rm-lampglow)"/>`;
            r += `<path d="M${f1(p[0] - 9)} ${f1(p[1] + 8)}L${f1(p[0] - 5)} ${f1(p[1] - 10)}H${f1(p[0] + 5)}L${f1(p[0] + 9)} ${f1(p[1] + 8)}Z" fill="#ffe2a8"/><rect x="${f1(p[0] - 3)}" y="${f1(p[1] + 8)}" width="6" height="7" fill="#d9b06a"/>`;
        });
        [[.3, 1.12], [.72, .8]].forEach(([s, sc]) => {
            const y = 190 * s, ly = y + 52 * sc;
            r += `<ellipse cx="500" cy="${f1(ly + 40 * sc)}" rx="${f1(120 * sc)}" ry="${f1(90 * sc)}" fill="url(#rm-lampglow)"/>`;
            r += `<line x1="500" y1="${f1(y)}" x2="500" y2="${f1(ly)}" stroke="#d9b06a" stroke-width="${f1(2 * sc)}"/>`;
            r += `<path d="M${f1(500 - 26 * sc)} ${f1(ly + 22 * sc)}Q500 ${f1(ly - 20 * sc)} ${f1(500 + 26 * sc)} ${f1(ly + 22 * sc)}Z" fill="#ee8fb5"/>`;
            r += `<ellipse cx="500" cy="${f1(ly + 22 * sc)}" rx="${f1(26 * sc)}" ry="${f1(5 * sc)}" fill="#fff1c4"/>`;
        });

        // ---- potted plants in the front corners ----
        [172, 828].forEach((px, ix) => {
            r += `<ellipse cx="${px}" cy="594" rx="46" ry="9" fill="#0a0408" fill-opacity=".5"/>`;
            for (let a = -70; a <= 70; a += 17) {
                const c = ['#778d76', '#9bb89a', '#607662', '#869a84'][Math.abs(a / 17 | 0) % 4];
                r += `<ellipse cx="${px}" cy="500" rx="13" ry="${44 + (ix ? 6 : 0) + (Math.abs(a) % 3) * 6}" fill="${c}" transform="rotate(${a} ${px} 560)"/>`;
            }
            r += `<path d="M${px - 36} 552L${px - 28} 594H${px + 28}L${px + 36} 552Z" fill="url(#rm-pot)"/><ellipse cx="${px}" cy="552" rx="36" ry="9" fill="#e7a8c6"/><ellipse cx="${px}" cy="552" rx="30" ry="6" fill="#453339"/>`;
        });

        // ---- key light from high on the right: matches the photo (lit from the viewer's right, above) ----
        // source S on the right wall near the ceiling; the beam lands on Tania's head (room x 500, y 300)
        const S = [700, 40], HEAD = [555, 255], HR = 100;
        r += `<ellipse cx=\"${S[0] - 30}\" cy=\"${S[1] + 20}\" rx=\"150\" ry=\"130\" fill=\"url(#rm-spill)\"/>`;
        r += `<polygon points=\"${S[0] - 6},${S[1]} ${S[0] + 6},${S[1]} 700,600 250,600\" fill=\"url(#rm-beam)\"/>`;
        r += `<ellipse cx=\"480\" cy=\"582\" rx=\"240\" ry=\"34\" fill=\"url(#rm-spill)\"/>`;
        r += `<ellipse cx=\"${HEAD[0] + 18}\" cy=\"${HEAD[1] - 6}\" rx=\"${HR}\" ry=\"${HR * 0.7}\" fill=\"url(#rm-headlight)\"/>`;
        r += `<rect x=\"${S[0] - 12}\" y=\"${S[1] - 6}\" width=\"24\" height=\"8\" rx=\"2\" fill=\"#f8c8b8\"/>`;
        // ---- warm ambient light ----
        r += '<ellipse cx="500" cy="330" rx="300" ry="200" fill="url(#rm-glow)"/>';

        // ---- gate: plum stone arch with an opening, and two wooden doors that swing out ----
        const hole = 'M300 800V300A200 200 0 0 1 700 300V800Z';
        const gate = '<g id="mi-gate"><g clip-path="url(#mi-hole)">' +
            '<g id="mi-doorL"></g><g id="mi-doorR"></g></g>' +
            `<path d="M-300 -300H1300V1100H-300Z ${hole}" fill="url(#stone)" fill-rule="evenodd"/>` +
            `<path d="${hole}" fill="none" stroke="#ee8fb5" stroke-opacity=".75" stroke-width="7"/>` +
            '<polygon points="480,122 520,122 512,80 488,80" fill="#cdb4f0"/></g>';

        const stops = (arr) => arr.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ' stop-opacity="' + op + '"' : ''}/>`).join('');
        const lg = (id, x2, y2, arr, extra) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra || ''}>${stops(arr)}</linearGradient>`;
        const rg = (id, arr, c) => `<radialGradient id="${id}" cx="${c || '50%'}" cy="${c ? '35%' : '50%'}" r="50%">${stops(arr)}</radialGradient>`;
        const s = '<defs>' +
            '<clipPath id="mi-hole"><path d="' + hole + '"/></clipPath>' +
            '<clipPath id="rm-wclip"><path d="M453 346V262A47 47 0 0 1 547 262V346Z"/></clipPath>' +
            lg('rm-ceil', 0, 1, [[0, '#392638'], [1, '#50304f']]) +
            lg('rm-floor', 0, 1, [[0, '#7e476d'], [0.35, '#673c5f'], [1, '#45293e']]) +
            lg('rm-wl', 1, 0, [[0, '#452b42'], [1, '#5c3555']]) +
            lg('rm-wr', 1, 0, [[0, '#5c3555'], [1, '#452b42']]) +
            lg('rm-back', 0, 1, [[0, '#5c3659'], [1, '#4f2f49']]) +
            lg('rm-sky', 0, 1, [[0, '#432949'], [0.5, '#781848'], [0.85, '#f898c8'], [1, '#f8c8b8']]) +
            lg('rm-cur', 0.5, 0, [[0, '#781848'], [0.3, '#f898c8'], [0.6, '#b75e94'], [1, '#f8a8d8']], ' spreadMethod="repeat"') +
            lg('rm-wood', 0, 1, [[0, '#7e4c55'], [1, '#673d46']]) +
            lg('rm-screen', 0, 1, [[0, '#cdb4f0'], [1, '#a55389']]) +
            lg('rm-board', 0, 1, [[0, '#482943'], [1, '#3b2538']]) +
            lg('rm-art1', 1, 1, [[0, '#f898c8'], [0.5, '#cdb4f0'], [1, '#781848']]) +
            lg('rm-art2', 0, 1, [[0, '#f8c8b8'], [0.55, '#f898c8'], [1, '#781848']]) +
            lg('rm-pot', 1, 0, [[0, '#f898c8'], [1, '#781848']]) +
            lg('rm-door', 0, 1, [[0, '#67425a'], [1, '#4b3548']]) +
            lg('rm-shaft', 0, 1, [[0, '#ffd6e4', 0.34], [1, '#ffd6e4', 0]]) +
            '<linearGradient id="rm-beam" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8c8b8" stop-opacity=".7"/><stop offset=".7" stop-color="#f898c8" stop-opacity=".3"/><stop offset="1" stop-color="#f898c8" stop-opacity=".2"/></linearGradient>' +
            rg('rm-spill', [[0, '#f8c8b8', 0.38], [1, '#f8c8b8', 0]]) +
            rg('rm-headlight', [[0, '#f8c8b8', 0.42], [1, '#f898c8', 0]]) +
            rg('rm-wglow', [[0, '#ffc2d6', 0.4], [1, '#ffc2d6', 0]]) +
            rg('rm-lampglow', [[0, '#ffe2a8', 0.5], [1, '#ffe2a8', 0]]) +
            rg('rm-glow', [[0, '#dec0ab', 0.3], [1, '#dec0ab', 0]]) +
            rg('rm-globe', [[0, '#f898c8'], [1, '#5a2f49']], '38%') +
            '<pattern id="stone" patternUnits="userSpaceOnUse" width="110" height="56"><rect width="110" height="56" fill="#673058"/>' +
            '<path d="M0 28H110M0 56H110M55 0V28M27 28V56M82 28V56" stroke="#45263c" stroke-width="3"/>' +
            '<path d="M2 2H53M57 30H108" stroke="#ded5de" stroke-opacity=".08" stroke-width="2"/></pattern>' +
            '</defs>';
        const scene = '<g id="mi-cam" transform="translate(500 300) scale(1) translate(-500 -300)">' + r + gate + '</g>';
        interiorArt.innerHTML = '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + s + scene + '</svg>';
        camG = interiorArt.querySelector('#mi-cam');
        gateG = interiorArt.querySelector('#mi-gate');
        doorL = interiorArt.querySelector('#mi-doorL');
        doorR = interiorArt.querySelector('#mi-doorR');
        capEl = interior.querySelector('.map-inside-cap');
    }

    // ---- the doors: each leaf swings open on its own hinge (left hinge at x 300, right at x 700),
    // projected with one-point perspective toward the vanishing point (500,300). A leaf that swings
    // into the room recedes, shrinks toward the centre and darkens a little, like a real door. ----
    const DOOR_EYE = 520;                          // perspective strength (scene units): larger = flatter
    const DOOR_MAX = 95 * Math.PI / 180;           // a real door stops at roughly 95 degrees
    const DOOR_W = 200, DOOR_TOP = 100, DOOR_BOT = 820;
    function paintDoors(p) {
        if (!doorL || !doorR) return;
        // ease in-out: the handle is pulled gently, the door gathers speed and settles without bouncing
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const a = DOOR_MAX * e, c = Math.cos(a), sn = Math.sin(a);
        const f1 = v => v.toFixed(1);
        const pathOf = pts => 'M' + pts.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L') + 'Z';
        const linePath = pts => 'M' + pts.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L');
        const leaf = (hx, dir) => {
            // u = 0 at the hinge, u = 1 at the free edge; y = height in scene units
            const P = (u, y) => {
                const x = hx + dir * DOOR_W * u * c;
                const z = DOOR_W * u * sn;                  // how far the point has moved into the room
                const k = DOOR_EYE / (DOOR_EYE + z);
                return [500 + (x - 500) * k, 300 + (y - 300) * k];
            };
            const shade = Math.min(0.6, 0.6 * sn);          // the swung leaf turns a little darker
            let h = `<path d="${pathOf([P(0, DOOR_TOP), P(1, DOOR_TOP), P(1, DOOR_BOT), P(0, DOOR_BOT)])}" fill="url(#rm-door)"/>`;
            for (let k = 1; k < 4; k++) h += `<path d="${linePath([P(k / 4, DOOR_TOP), P(k / 4, DOOR_BOT)])}" stroke="#412c3d" stroke-opacity=".7" stroke-width="2.4" fill="none"/>`;
            h += `<path d="${pathOf([P(0.11, 150), P(0.89, 150), P(0.89, 360), P(0.11, 360)])}" fill="none" stroke="#412c3d" stroke-opacity=".5" stroke-width="2.4"/>`;
            // handle on the free edge
            const hd = P(0.92, 450);
            h += `<circle cx="${f1(hd[0])}" cy="${f1(hd[1])}" r="${f1(4 * (1 - 0.4 * sn))}" fill="#ffd6e4"/>`;
            // light catching the free edge while it moves
            h += `<path d="${linePath([P(1, DOOR_TOP), P(1, DOOR_BOT)])}" stroke="#ffd6e4" stroke-opacity="${(0.4 * sn).toFixed(3)}" stroke-width="2" fill="none"/>`;
            // shadow that grows as the leaf turns away from the light
            h += `<path d="${pathOf([P(0, DOOR_TOP), P(1, DOOR_TOP), P(1, DOOR_BOT), P(0, DOOR_BOT)])}" fill="#0a0408" fill-opacity="${shade.toFixed(3)}"/>`;
            return h;
        };
        doorL.innerHTML = leaf(300, 1);
        doorR.innerHTML = leaf(700, -1);
    }
    buildInteriorArt();
    paintDoors(0);   // closed doors, ready before the gate opens

    measure();
    let lastW = innerWidth;
    addEventListener('resize', () => { const sameW = innerWidth === lastW; lastW = innerWidth; measure(sameW); wake(); });
    addEventListener('scroll', wake, { passive: true });   // the frame loop only runs while something is moving
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(track);
    wake();
})();
