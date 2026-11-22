/* Tania's Run - 3D endless runner (Three.js / WebGL)
   Jump: Space / Arrow Up / tap / click (hold for a higher jump).
   Starts slow and gets faster gradually. Text follows the site's EN / BN button.
   Voice: plays audio/game-voice-en.mp3 or audio/game-voice-bn.mp3 if the file exists,
   otherwise the browser reads the start text aloud. */
(() => {
    const wrap = document.getElementById('runner-wrap');
    const canvas = document.getElementById('runner-canvas');
    if (!wrap || !canvas) return;
    const overlay = document.getElementById('runner-overlay');
    const titleEl = document.getElementById('runner-title');
    const subEl = document.getElementById('runner-sub');
    const scoreEl = document.getElementById('runner-score');
    const coinNEl = document.getElementById('runner-coin-n');
    const hiEl = document.getElementById('runner-hi');
    const sectionTitle = document.getElementById('game-title');
    const hintEl = document.getElementById('runner-hint');
    const bubble = document.getElementById('runner-bubble');

    // ---------- settings you can change ----------
    
    // ---- audio paths: put your files here ----
    // greeting voice, played when PLAY is pressed (English or Bangla, by the site's language button)
    const VOICE_FILE = { en: 'audio/game-voice-en.mp3', bn: 'audio/game-voice-bn.mp3' };
    // the game's background music: starts after the greeting voice ends, loops while the game is open
    const GAME_MUSIC = 'audio/game-music.mp3';
    const THREE_MISSING = { en: 'The 3D game could not load. Check your internet connection.', bn: '3D গেমটি লোড হয়নি। ইন্টারনেট সংযোগ দেখুন।' };

    const TEXT = {
        en: { title: "Tania's Run", hint: 'Tap, click or press Space to jump', start: 'Press PLAY to start', play: 'PLAY', over: 'Game over', again: 'tap or press Space to try again', best: 'BEST', greet: 'Hi, I am Tania. Tap me to play!', full: 'Full screen', exit: 'Exit game', rotate: 'Turn your phone sideways for the best view', score: 'Score', high: 'Highest', newBest: 'New best!', coins: 'Coins' },
        bn: { title: 'তানিয়ার দৌড়', hint: 'লাফ দিতে ট্যাপ, ক্লিক বা স্পেস চাপুন', start: 'খেলা শুরু করতে প্লে চাপুন', play: 'প্লে করুন', over: 'খেলা শেষ', again: 'আবার খেলতে ট্যাপ করুন বা স্পেস চাপুন', best: 'সেরা', greet: 'হ্যালো, আমি তানিয়া। খেলতে আমাকে ট্যাপ করো!', full: 'ফুল স্ক্রিন', exit: 'গেম থেকে বের হও', rotate: 'ফোনটি পাশে ঘুরিয়ে খেলুন', score: 'স্কোর', high: 'সর্বোচ্চ', newBest: 'নতুন সেরা!', coins: 'কয়েন' }
    };
    const lang = () => (document.documentElement.lang === 'bn' ? 'bn' : 'en');

    // speed (world units per frame): starts slow, speeds up gradually
    const SPEED0 = 0.15, SPEED_MAX = 0.32, RAMP = 0.00014;
    const GRAV = 0.011, JUMP = 0.27;   // a little higher jump, so the high coins can be reached
    const HERO_Z = 0;
    const SPAWN_D = 42, KILL_D = 5, FIRST_D = 9;    // distance along the road where obstacles appear / disappear
    const WRAP = 112;                  // road lines repeat every WRAP units

    const clamp01 = (x, lo) => Math.min(1, Math.max(lo, x));
    let state = 'ready';               // ready | intro | running | over
    let v = SPEED0, distance = 0, score = 0, cooldown = 0, overAt = 0;
    let bonus = 0, coins = 0, coinCool = 3, finalScore = 0, finalCoins = 0, isNewBest = false, countRaf = 0;
    let inView = false;
    let hi = 0;
    try { hi = Number(localStorage.getItem('tania-runner-hi')) || 0; } catch (e) { hi = 0; }

    const hero = { y: 0, vy: 0, onGround: true, holding: false, run: 0, phase: 0, squash: 0 };
    let obstacles = [], roadLines = [], trees = [], petalPos, petalGeo, PETAL_N = 90;
    let W = 0, H = 0, DIR = 1;

    // ---------- Three.js (needs the three.js script loaded first) ----------
    const THREE = window.THREE;
    if (!THREE) {
        subEl.textContent = THREE_MISSING[lang()];
        titleEl.textContent = TEXT[lang()].title;
        return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setClearColor(0x140e1f, 1);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140e1f);
    scene.fog = new THREE.Fog(0x5a3562, 30, 115);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);

    // side camera: stands to the side of the runner, so the obstacles read as clear shapes
    camera.position.set(-2.2, 3.2, 6.5);
    camera.lookAt(0, 1.0, -4);
    camera.updateMatrixWorld(true);
    // work out which way is "screen right" from the camera itself, so stones always come from the left
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    const screenRight = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    DIR = 1;                           // obstacles come toward the camera, Tania runs away from it

    // position along the road for something that repeats every WRAP units
    function roadZ(base, dist, period, offset) {
        const p = ((base + dist) % period + period) % period;
        return DIR * (p + offset);
    }

    scene.add(new THREE.HemisphereLight(0xffd6e4, 0x2f4a3a, 0.85));
    scene.add(new THREE.AmbientLight(0xffe6f0, 0.3));
    const sun = new THREE.DirectionalLight(0xffc9a8, 0.9);
    sun.position.set(-6, 8, -4);
    scene.add(sun);

    // small helpers: soft round dots and tiling noise textures
    function dotTex(color) {
        const c = document.createElement('canvas'); c.width = c.height = 32;
        const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(c);
    }
    function noiseTex(base, specks, rx, ry, n) {
        const c = document.createElement('canvas'); c.width = c.height = 256;
        const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 256, 256);
        for (let i = 0; i < n; i++) {
            x.fillStyle = specks[i % specks.length];
            const sz = 1 + Math.random() * 3, px = Math.random() * 256, py = Math.random() * 256;
            for (const dx of [0, -256]) for (const dy of [0, -256]) x.fillRect(px + dx, py + dy, sz, sz * 2.2);
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
        return t;
    }

    // rough, uneven surface for rocks and stones
    function roughen(geo, amt) {
        const p = geo.attributes.position, seen = new Map();
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
            const key = Math.round(x * 1000) + ',' + Math.round(y * 1000) + ',' + Math.round(z * 1000);
            let o = seen.get(key);
            if (!o) { o = [(Math.random() - 0.5) * amt, (Math.random() - 0.5) * amt, (Math.random() - 0.5) * amt]; seen.set(key, o); }
            p.setXYZ(i, x + o[0], y + o[1], z + o[2]);
        }
        geo.computeVertexNormals();
        return geo;
    }

// ---------- materials ----------
    const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, flatShading: true }, extra || {}));
    const smooth = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, flatShading: false });
    // soft (smooth-shaded) material for leaves, blossoms and clouds
    const soft = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, flatShading: false }, extra || {}));
    const M = {
        road: std(0x3a2d45, { roughness: 1 }), grass: std(0x2f4a3a, { roughness: 1 }), grassA: soft(0x4f7a4c), grassB: soft(0x3e6a4a),
        bushA: soft(0x3e6a4a), bushB: soft(0x557f57), rockM: std(0x5b4d6b), lilac: soft(0xcdb4f0), cloud: soft(0xf6d7e6, { emissive: 0x2a1530 }),
        line: new THREE.MeshBasicMaterial({ color: 0xee8fb5, transparent: true, opacity: 0.55 }),
        skin: smooth(0xe2b38f), hair: smooth(0x1a1020), lip: smooth(0xb86a7a), coat: std(0x3a2146), coatDark: std(0x241833),
        rose: std(0xee8fb5, { emissive: 0x3a1024 }), pants: std(0x1c1226), boot: std(0x2e2339),
        cape: std(0x181221), scarf: std(0x2b1830), eye: std(0x0e0a14),
        stone: std(0x4a3360, { emissive: 0x1a1024 }), moss: std(0x9bb89a),
        bark: std(0x5a3d2b), barkTop: std(0xc9a27a), wood: std(0x7a5536), woodDark: std(0x4a3322),
        pine1: soft(0x3a5a42, { roughness: 0.95 }), pine2: soft(0x4f7258, { roughness: 0.95 }), blossom1: soft(0xd98aa8, { roughness: 0.95 }), blossom2: soft(0xf0c4d4, { roughness: 0.95 }), blossom3: soft(0xc46d93, { roughness: 0.95 }),
        mountain1: std(0x2a1d3d), mountain2: std(0x3d2a4f), hill: std(0x2b2040)
    };

    // ---------- world ----------
    const grassTex = noiseTex('#2f4a3a', ['#3b5e45', '#27402f', '#486f4e', '#35553f'], 18, 52, 1800);
    const pathTex = noiseTex('#4a3a52', ['#55455f', '#2f2339', '#6a5878', '#3c2f48'], 1, 52, 900);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 260), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -85);
    scene.add(ground);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 260), new THREE.MeshStandardMaterial({ map: pathTex, roughness: 1 }));
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.004, -85); scene.add(path);
    [-2.42, 2.42].forEach(x => {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 260), std(0x2a2036));
        edge.position.set(x, 0.03, -85); scene.add(edge);
    });

    // road lines (they show the speed)
    const lineGeo = new THREE.BoxGeometry(0.07, 0.02, 1.6);
    for (let i = 0; i < 14; i++) {
        const m = new THREE.Mesh(lineGeo, M.line);
        scene.add(m); roadLines.push({ m, base: i * 8 });
    }

    // background: mountains and hills (fixed, far away, faded by fog)
    // deterministic "noise" from a position, so duplicated seam vertices stay in place (no cracks)
    const hash3 = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
    // rocky mountain: a faceted, uneven ridge with a darker base and lighter, rosy-lilac peaks
    function ridgedMountain(r, h, base) {
        const geo = new THREE.ConeGeometry(r, h, 16, 10, false);
        const p = geo.attributes.position, cols = [];
        const cBase = new THREE.Color(base), cPeak = new THREE.Color(0x7a6290), cRock = new THREE.Color(0x4a3a60);
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
            const t = (y + h / 2) / h;                          // 0 at the base, 1 at the peak
            const a = Math.atan2(z, x);
            // broad ridges around the mountain, plus small rough noise, stronger toward the top
            const ridge = Math.sin(a * 5 + h) * 0.09 + Math.sin(a * 11 + r) * 0.04;
            const rough = (hash3(x, y, z) - 0.5) * 0.12;
            const k = 1 + (ridge + rough) * (0.4 + t * 0.9);
            p.setX(i, x * k); p.setZ(i, z * k);
            p.setY(i, y + (hash3(z, x, y) - 0.5) * 0.35 * t);
            // colour: darker rock at the bottom, lighter ridges and peak, a little variation per facet
            const c = cBase.clone().lerp(cPeak, Math.pow(t, 1.6));
            c.lerp(cRock, (hash3(x * 3, y, z * 3) > 0.7 ? 0.35 : 0));
            c.multiplyScalar(0.9 + hash3(x, z, y) * 0.2);
            cols.push(c.r, c.g, c.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
        return new THREE.Mesh(geo, mat);
    }
    for (let i = 0; i < 9; i++) {
        const r = 6 + Math.random() * 4, h = 8 + Math.random() * 8;
        const x = 30 + Math.random() * 10, z = -100 + i * 25 + Math.random() * 6;
        const main = ridgedMountain(r, h, i % 2 ? 0x2a1d3d : 0x3d2a4f);
        main.position.set(x, h / 2 - 0.2, z);
        scene.add(main);
        if (i % 3 === 0) {
            const peak = ridgedMountain(r * 0.55, h * 0.6, i % 2 ? 0x3d2a4f : 0x2a1d3d);
            peak.position.set(x - r * 0.9, h * 0.3 - 0.2, z + 2);
            scene.add(peak);
        }
    }
    // rolling hills: low, lumpy, overlapping; the same deterministic noise keeps the seams closed
    for (let i = 0; i < 7; i++) {
        const base = new THREE.SphereGeometry(9, 16, 12);
        const p = base.attributes.position;
        for (let v = 0; v < p.count; v++) {
            const x = p.getX(v), y = p.getY(v), z = p.getZ(v);
            const k = 1 + (hash3(x, y, z) - 0.5) * 0.14 + Math.sin(Math.atan2(z, x) * 3 + i) * 0.04;
            p.setXYZ(v, x * k, y * (1 + (hash3(z, y, x) - 0.5) * 0.12), z * k);
        }
        base.computeVertexNormals();
        const hill = new THREE.Mesh(base, M.hill);
        hill.scale.set(1, 0.35, 1);
        hill.position.set(20 + Math.random() * 4, 0, -90 + i * 30);
        scene.add(hill);
        const lump = new THREE.Mesh(new THREE.SphereGeometry(5 + Math.random() * 2, 14, 10), M.hill);
        lump.scale.set(1, 0.3, 1);
        lump.position.set(hill.position.x - 4 + Math.random() * 3, 0, hill.position.z + 5);
        scene.add(lump);
    }

    // trees on the far side of the road (move with the road)
    // rougher, more natural silhouettes: uneven foliage edges, tapered trunks, slightly lean trunks
    function roughenTree(geo, amt) {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
            const k = 1 + (Math.random() - 0.5) * amt;
            p.setXYZ(i, p.getX(i) * k, p.getY(i) * (1 + (Math.random() - 0.5) * amt * 0.5), p.getZ(i) * k);
        }
        geo.computeVertexNormals();
        return geo;
    }
    function makeTree(kind, s) {
        const g = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.07 * s, 0.14 * s, 1.5 * s, 8);
        const trunk = new THREE.Mesh(trunkGeo, M.bark);
        trunk.position.y = 0.75 * s; trunk.rotation.z = (Math.random() - 0.5) * 0.08; g.add(trunk);
        if (kind === 'pine') {
            // layered, drooping branches: wider and irregular at the bottom, narrow at the top
            for (let k = 0; k < 4; k++) {
                const r = (1.25 - k * 0.28) * s, h = (1.5 - k * 0.12) * s;
                const geo = roughenTree(new THREE.ConeGeometry(r, h, 9, 2), 0.22);
                const c = new THREE.Mesh(geo, k % 2 ? M.pine2 : M.pine1);
                c.position.set((Math.random() - 0.5) * 0.08 * s, (1.35 + k * 0.78) * s, (Math.random() - 0.5) * 0.08 * s);
                c.rotation.y = Math.random() * 6;
                g.add(c);
            }
        } else {
            // blossom tree: a crown of soft, uneven clumps
            const mats = [M.blossom1, M.blossom2, M.blossom3];
            // a solid core keeps the inside filled, then overlapping clumps form the outer crown
            const core = roughenTree(new THREE.IcosahedronGeometry(0.75 * s, 2), 0.2);
            const cm = new THREE.Mesh(core, M.blossom1); cm.position.set(0, 2.2 * s, 0); g.add(cm);
            const clumps = [
                [-0.5, 2.0, -0.2, 0.55], [0.5, 2.1, 0.1, 0.58], [0, 2.7, 0, 0.6], [-0.2, 1.8, 0.45, 0.5],
                [0.35, 1.85, -0.45, 0.5], [-0.45, 2.6, 0.3, 0.5], [0.45, 2.55, -0.3, 0.5], [0.05, 2.25, 0.5, 0.5],
                [-0.1, 2.35, -0.5, 0.5], [0.2, 3.0, 0.1, 0.45], [-0.3, 3.0, -0.1, 0.42]
            ];
            clumps.forEach(([x, y, z, r], k) => {
                const geo = roughenTree(new THREE.IcosahedronGeometry(r * s, 2), 0.3);
                const f = new THREE.Mesh(geo, mats[k % 3]);
                f.position.set(x * s, y * s, z * s);
                g.add(f);
            });
        }
        return g;
    }
    for (let i = 0; i < 24; i++) {
        const kind = i % 3 === 0 ? 'blossom' : 'pine';
        const g = makeTree(kind, 0.7 + Math.random() * 0.4);
        g.scale.y = 0.9 + Math.random() * 0.2;
        g.position.x = i % 2 ? 5.2 + Math.random() * 4.5 : -(6 + Math.random() * 5);
        g.rotation.y = Math.random() * 6;
        scene.add(g);
        trees.push({ g, base: i * 9 });
    }

    // ---------- natural surroundings ----------
    {
        // dusk sky dome
        const skyGeo = new THREE.SphereGeometry(180, 24, 16);
        const pos = skyGeo.attributes.position, cols = [];
        const top = new THREE.Color(0x1a1030), mid = new THREE.Color(0x3b2450), low = new THREE.Color(0x8a4a6e);
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i) / 180;
            const c = y > 0 ? mid.clone().lerp(top, Math.min(1, y * 1.3)) : low.clone().lerp(mid, Math.min(1, (y + 0.3) * 2));
            cols.push(c.r, c.g, c.b);
        }
        skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
    }
    const clouds = [];
    for (let i = 0; i < 8; i++) {
        const cloud = new THREE.Group();
        for (let k = 0; k < 4; k++) {
            const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 8, 6), M.cloud);
            puff.position.set(k * 1.4 - 2, Math.random() * 0.4, Math.random() * 0.6);
            puff.scale.y = 0.55; cloud.add(puff);
        }
        cloud.position.set(20 + Math.random() * 30, 13 + Math.random() * 7, -110 + i * 28);
        scene.add(cloud); clouds.push(cloud);
    }
    function makeBush(s) {
        const g = new THREE.Group();
        [[0, 0.4, 0, M.bushA], [0.35, 0.3, 0.15, M.bushB], [-0.3, 0.28, -0.1, M.bushB], [0.05, 0.6, -0.1, M.bushA]].forEach(([x, y, z, m]) => {
            const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 0), m);
            b.position.set(x * s, y * s, z * s); g.add(b);
        });
        return g;
    }
    function makeGrass(s) {
        const g = new THREE.Group();
        for (let k = 0; k < 6; k++) {
            const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.5 * s, 4), k % 2 ? M.grassA : M.grassB);
            blade.position.set((Math.random() - 0.5) * 0.4 * s, 0.25 * s, (Math.random() - 0.5) * 0.4 * s);
            blade.rotation.z = (Math.random() - 0.5) * 0.5;
            g.add(blade);
        }
        return g;
    }
    function makeFlowers(s) {
        const g = new THREE.Group(), heads = [M.blossom1, M.blossom2, M.lilac];
        for (let k = 0; k < 5; k++) {
            const x = (Math.random() - 0.5) * 0.7 * s, z = (Math.random() - 0.5) * 0.7 * s, h = (0.3 + Math.random() * 0.25) * s;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, h, 4), M.grassB);
            stem.position.set(x, h / 2, z); g.add(stem);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 6, 5), heads[k % 3]);
            head.position.set(x, h + 0.02, z); g.add(head);
        }
        return g;
    }
    function makeRock(s) {
        const r = new THREE.Mesh(roughen(new THREE.DodecahedronGeometry(0.4 * s, 0), 0.12 * s), M.rockM);
        r.scale.set(1, 0.6, 0.85); r.position.y = 0.12 * s; return r;
    }
    const flora = [];
    const kinds = ['bush', 'grass', 'flowers', 'rock', 'bush', 'flowers', 'grass', 'rock'];
    for (let i = 0; i < 24; i++) {
        const kind = kinds[i % kinds.length];
        const s = 0.8 + Math.random() * 0.6;
        const g = kind === 'bush' ? makeBush(s) : kind === 'grass' ? makeGrass(s) : kind === 'flowers' ? makeFlowers(s) : makeRock(s);
        // grass and flowers stay low on the near side; bushes and rocks are on the far side
        if (kind === 'grass' || kind === 'flowers') g.position.x = -(2.9 + Math.random() * 1.8);
        else if (kind === 'rock') g.position.x = -(4.5 + Math.random() * 2);
        else g.position.x = 4.5 + Math.random() * 3;
        scene.add(g);
        flora.push({ g, base: i * 9 });
    }

    // stars and moon (not affected by fog)
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 160;
        starPos[i * 3 + 1] = 8 + Math.random() * 40;
        starPos[i * 3 + 2] = -150 + Math.random() * 180;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcdb4f0, size: 0.35, transparent: true, opacity: 0.75, fog: false })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffd6e4, fog: false }));
    moon.position.set(14, 22, -120);
    scene.add(moon);
    const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 24), new THREE.MeshBasicMaterial({ color: 0xee8fb5, transparent: true, opacity: 0.12, fog: false }));
    moonGlow.position.copy(moon.position);
    scene.add(moonGlow);

    // falling petals
    petalPos = new Float32Array(PETAL_N * 3);
    function resetPetal(i, anywhere) {
        petalPos[i * 3] = (Math.random() - 0.5) * 16;
        petalPos[i * 3 + 1] = anywhere ? Math.random() * 7 : 6;
        petalPos[i * 3 + 2] = DIR * (anywhere ? -40 + Math.random() * 44 : -40);
    }
    for (let i = 0; i < PETAL_N; i++) resetPetal(i, true);
    petalGeo = new THREE.BufferGeometry();
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
    scene.add(new THREE.Points(petalGeo, new THREE.PointsMaterial({ map: dotTex('#ffb6d0'), size: 0.3, transparent: true, opacity: 0.85, depthWrite: false })));
    const FF_N = 40, ffBase = new Float32Array(FF_N * 3), ffPos = new Float32Array(FF_N * 3);
    for (let i = 0; i < FF_N; i++) { ffBase[i * 3] = (Math.random() - 0.5) * 16; ffBase[i * 3 + 1] = 0.5 + Math.random() * 2.2; ffBase[i * 3 + 2] = -30 + Math.random() * 34; }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    scene.add(new THREE.Points(ffGeo, new THREE.PointsMaterial({ map: dotTex('#fff1b0'), size: 0.4, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })));

    // ---------- Tania (smooth 3D character: swaying braid, flowing cape, bending run) ----------
    function buildTania() {
        const root = new THREE.Group();
        const S = (c, e) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, flatShading: false }, e || {}));
        const mCoat = S(0x3a2146, { side: THREE.DoubleSide }), mCoatD = S(0x241833), mRose = S(0xee8fb5, { emissive: 0x3a1024 });
        const mSkin = S(0xe2b38f, { roughness: 0.55 }), mHair = S(0x1a1020, { roughness: 0.4 }), mPants = S(0x1c1226), mBoot = S(0x2e2339);
        const mCape = S(0x2a1a3a, { side: THREE.DoubleSide }), mScarf = S(0x5a3268), mEye = S(0x0e0a14), mLip = S(0xb86a7a);
        const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || root).add(m); return m; };

        // coat, belts, chest, scarf
        add(new THREE.LatheGeometry([new THREE.Vector2(0.22, 1.56), new THREE.Vector2(0.25, 1.4), new THREE.Vector2(0.27, 1.1), new THREE.Vector2(0.33, 0.88), new THREE.Vector2(0.4, 0.78)], 28), mCoat, 0, 0, 0);
        add(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 20), mRose, 0, 1.1, 0);
        add(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20), mRose, 0, 0.79, 0);
        add(new THREE.CylinderGeometry(0.21, 0.25, 0.5, 20), mCoat, 0, 1.8, 0);
        add(new THREE.BoxGeometry(0.06, 0.5, 0.02), mRose, 0, 1.75, 0.25);
        const scarf = add(new THREE.TorusGeometry(0.17, 0.065, 10, 22), mScarf, 0, 2.04, 0); scarf.rotation.x = Math.PI / 2;
        // neck, head, face
        add(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10), mSkin, 0, 2.12, 0);
        add(new THREE.SphereGeometry(0.17, 28, 20), mSkin, 0, 2.28, 0).scale.set(0.92, 1.06, 0.95);
        add(new THREE.SphereGeometry(0.03, 8, 8), mEye, -0.06, 2.3, 0.15);
        add(new THREE.SphereGeometry(0.03, 8, 8), mEye, 0.06, 2.3, 0.15);
        add(new THREE.BoxGeometry(0.07, 0.015, 0.02), mHair, -0.06, 2.37, 0.15);
        add(new THREE.BoxGeometry(0.07, 0.015, 0.02), mHair, 0.06, 2.37, 0.15);
        add(new THREE.BoxGeometry(0.07, 0.02, 0.02), mLip, 0, 2.2, 0.16);
        // hair: top cap, soft back, rose clip
        add(new THREE.SphereGeometry(0.19, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.58), mHair, 0, 2.31, -0.015).scale.set(1.04, 1.08, 1.02);
        add(new THREE.SphereGeometry(0.17, 20, 16), mHair, 0, 2.25, -0.09).scale.set(1, 1.15, 0.8);
        add(new THREE.SphereGeometry(0.045, 10, 10), mRose, 0.14, 2.4, 0.06);
        // open hair: three long strands falling down the back and shoulders; each is a chain of pivots,
        // so it bends and sways like real loose hair (see the animation in update)
        const braid = [];
        // strand length: HAIR_SEGS pivots per strand, each SEG_LEN long and SEG_GAP apart (tips reach about waist height)
        const HAIR_SEGS = 6, SEG_LEN = 0.26, SEG_GAP = 0.22;
        [[0, -0.13], [-0.07, -0.13], [0.07, -0.13], [-0.13, -0.1], [0.13, -0.1], [-0.2, -0.05], [0.2, -0.05]].forEach(([sx, sz], i) => {
            let parent = root;
            for (let k = 0; k < HAIR_SEGS; k++) {
                const pv = new THREE.Group();
                pv.position.set(k ? 0 : sx, k ? -SEG_GAP : 2.2, k ? 0 : sz);
                pv.userData = { i, k, side: sx };
                parent.add(pv);
                const len = SEG_LEN, r0 = 0.078 - k * 0.007, r1 = 0.066 - k * 0.006;
                const geo = new THREE.CylinderGeometry(r1, r0, len, 10);
                geo.translate(0, -len / 2, 0);
                const seg = new THREE.Mesh(geo, mHair);
                pv.add(seg);
                braid.push(pv);
                parent = pv;
            }
        });

        // cape: a segmented cloth that ripples (see animateCape)
        const capePivot = new THREE.Group(); capePivot.position.set(0, 1.95, -0.2); root.add(capePivot);
        const capeGeo = new THREE.PlaneGeometry(0.5, 1.25, 4, 10); capeGeo.translate(0, -0.625, 0);
        const cape = new THREE.Mesh(capeGeo, mCape); capePivot.add(cape);
        const capeBase = Float32Array.from(capeGeo.attributes.position.array);

        // legs and arms (pivot at hip / shoulder), with rounded joints
        function limb(x, y, parts) {
            const pivot = new THREE.Group(); pivot.position.set(x, y, 0); root.add(pivot);
            parts.forEach(p => { const m = new THREE.Mesh(p.geo, p.mat); m.position.set(p.x || 0, p.y || 0, p.z || 0); if (p.sc) m.scale.set(p.sc[0], p.sc[1], p.sc[2]); pivot.add(m); });
            return pivot;
        }
        const leg = x => limb(x, 0.85, [
            { geo: new THREE.SphereGeometry(0.09, 10, 8), mat: mPants },
            { geo: new THREE.CylinderGeometry(0.085, 0.07, 0.85, 12), mat: mPants, y: -0.42 },
            { geo: new THREE.SphereGeometry(0.075, 10, 8), mat: mPants, y: -0.84 },
            { geo: new THREE.SphereGeometry(0.11, 12, 10), mat: mBoot, y: -0.9, z: 0.06, sc: [1, 0.7, 1.7] }
        ]);
        const arm = x => limb(x, 1.95, [
            { geo: new THREE.SphereGeometry(0.085, 10, 8), mat: mCoat },
            { geo: new THREE.CylinderGeometry(0.07, 0.06, 0.55, 12), mat: mCoat, y: -0.28 },
            { geo: new THREE.CylinderGeometry(0.068, 0.068, 0.04, 12), mat: mRose, y: -0.52 },
            { geo: new THREE.SphereGeometry(0.065, 10, 8), mat: mSkin, y: -0.6 }
        ]);
        return { root, legL: leg(-0.12), legR: leg(0.12), armL: arm(-0.31), armR: arm(0.31), capePivot, cape, capeBase, braid, hairSegs: HAIR_SEGS };
    }
    const tania = buildTania();
    scene.add(tania.root);

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);

    // ---------- obstacles ----------
    function disposeGroup(g) { g.traverse(c => { if (c.geometry) c.geometry.dispose(); }); }

    function makeStone(w, h, d) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(roughen(new THREE.BoxGeometry(w, h, d, 2, 2, 2), 0.1), M.stone);
        body.position.y = h / 2; g.add(body);
        const moss = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.1, d * 0.9), M.moss);
        moss.position.y = h + 0.02; g.add(moss);
        return g;
    }
    function makeStump(r, h) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 10), M.bark);
        body.position.y = h / 2; g.add(body);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.03, 10), M.barkTop);
        top.position.y = h + 0.01; g.add(top);
        return g;
    }
    function makeCrate(w, h, d) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.wood);
        body.position.y = h / 2; g.add(body);
        [0.3, 0.66].forEach(f => {
            const band = new THREE.Mesh(new THREE.BoxGeometry(w * 1.03, 0.06, d * 1.03), M.woodDark);
            band.position.y = h * f; g.add(band);
        });
        return g;
    }

    // ---------- coins ----------
    const pad = n => String(Math.floor(n));
    const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20);
    coinGeo.rotateZ(Math.PI / 2);                 // the coin stands up, facing the camera side
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0x7a5200, metalness: 0.6, roughness: 0.3 });
    const coinList = [];
    // a short line of 5 coins on the road: low (walk through) or high (jump for it)
    function spawnCoins() {
        const z0 = -DIR * SPAWN_D;
        if (obstacles.some(o => Math.abs(o.g.position.z - z0) < 5)) return false;   // not right on top of an obstacle
        // low coins: walk through them; high coins: sit above Tania's whole height, so she has to jump up for them
        const y = Math.random() < 0.5 ? 0.45 : 2.85;
        for (let k = 0; k < 5; k++) {
            const m = new THREE.Mesh(coinGeo, coinMat);
            m.position.set(0, y, z0 - DIR * k * 0.85);
            scene.add(m);
            coinList.push({ m, y, passed: false });
        }
        return true;
    }
    const plusEl = document.getElementById('runner-plus');
    const scoreWrap = document.getElementById('runner-score-wrap');
    // angry face above Tania: shown after 5 coins in a row were missed
    const angryEl = document.getElementById('runner-angry');
    let coinMisses = 0, angryTimer = 0;
    // 3D angry face: a little rose-coloured face with plum eyes and brows, built once and shown above Tania
    let angryGroup = null, angryStart = 0;
    function buildAngry() {
        if (angryGroup) return;
        angryGroup = new THREE.Group();
        const skin = new THREE.MeshStandardMaterial({ color: 0xee8fb5, emissive: 0x3a1430, roughness: 0.35, metalness: 0.05 });
        const plum = new THREE.MeshStandardMaterial({ color: 0x171020, roughness: 0.5 });
        const blush = new THREE.MeshStandardMaterial({ color: 0xffd6e4, emissive: 0x5a2a40, roughness: 0.4 });
        const lilac = new THREE.MeshStandardMaterial({ color: 0xcdb4f0, emissive: 0x3a2050, roughness: 0.4 });
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 8, 40), new THREE.MeshBasicMaterial({ color: 0xcdb4f0, transparent: true, opacity: 0.45 }));
        halo.position.set(0, 0, -0.05); angryGroup.add(halo);
        const gloss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
        gloss.position.set(-0.14, 0.2, 0.34); angryGroup.add(gloss);
        angryGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 28, 20), skin));
        for (const sx of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), plum);
            eye.position.set(sx * 0.14, 0.05, 0.31); angryGroup.add(eye);
            const brow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), plum);
            brow.position.set(sx * 0.14, 0.15, 0.33); brow.rotation.z = -sx * 0.5;   // angry: brows slope in
            angryGroup.add(brow);
            const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), blush);
            cheek.position.set(sx * 0.24, -0.06, 0.28); angryGroup.add(cheek);
        }
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.028, 8, 16, Math.PI), plum);   // frown arc
        mouth.position.set(0, -0.17, 0.33); angryGroup.add(mouth);
        // anger veins: small crosses floating at the top-right of the face
        for (const [x, y] of [[0.42, 0.36], [0.2, 0.52]]) {
            const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), lilac);
            const b = a.clone(); b.rotation.z = Math.PI / 2;
            a.position.set(x, y, 0.1); b.position.set(x, y, 0.1);
            a.rotation.z = Math.PI / 4; b.rotation.z = Math.PI / 4 + Math.PI / 2;
            angryGroup.add(a, b);
        }
        angryGroup.visible = false;
        scene.add(angryGroup);
    }
    function showAngry() {
        if (!angryEl) return;
        buildAngry();
        angryStart = performance.now();
        angryGroup.visible = true;
        angryGroup.scale.setScalar(0.01);
        angryEl.classList.remove('show'); void angryEl.offsetWidth; angryEl.classList.add('show');
        clearTimeout(angryTimer);
        angryTimer = setTimeout(hideAngry, 1800);
    }
    function hideAngry() {
        clearTimeout(angryTimer);
        if (angryGroup) angryGroup.visible = false;
        if (angryEl) angryEl.classList.remove('show');
    }
    function collectPop() {
        scoreWrap.classList.remove('pop'); void scoreWrap.offsetWidth; scoreWrap.classList.add('pop');
        plusEl.classList.remove('go'); void plusEl.offsetWidth; plusEl.classList.add('go');
    }

    function spawn(dist) {
        const early = distance < 150;                       // easy start: only low, simple obstacles
        const r = Math.random();
        const kind = early ? (r < 0.6 ? 'stone' : 'stump') : (r < 0.4 ? 'stone' : r < 0.7 ? 'stump' : 'crate');
        const tall = !early && Math.random() < 0.25;
        let g, w, h, d;
        if (kind === 'stone') {
            w = 0.9 + Math.random() * 0.5; d = 0.9;
            h = tall ? 1.0 + Math.random() * 0.2 : 0.7 + Math.random() * 0.3;   // always lower than Tania, so a jump clears it
            g = makeStone(w, h, d);
        } else if (kind === 'stump') {
            w = d = 0.8; h = 0.7 + Math.random() * 0.3;
            g = makeStump(0.4, h);
        } else {
            w = d = 0.9; h = tall ? 1.2 : 0.8 + Math.random() * 0.2;   // lower than Tania (about 2.4 tall)
            g = makeCrate(w, h, d);
        }
        g.position.set(0, 0, -DIR * (dist || SPAWN_D));
        scene.add(g);
        obstacles.push({ g, w, h, d });
        // distance between obstacles: more room at the start, always enough to land and jump again
        const frames = early ? 70 + Math.random() * 20 : 46 + Math.random() * 26;
        cooldown = v * frames;
    }

    // ---------- layout ----------
    const isFull = () => wrap.classList.contains('fake-full');
    function layout() {
        if (isFull()) { W = Math.floor(wrap.clientWidth || window.innerWidth); H = Math.floor(wrap.clientHeight || window.innerHeight); }
        else { W = Math.max(280, Math.floor(wrap.clientWidth)); const tall = window.matchMedia('(max-width: 700px)').matches; H = Math.round(Math.max(230, W * (tall ? 1.4 : 0.625))); /* phone: tall (portrait); desktop: 16:10 */ }
        if (!W || !H) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(W, H, false);
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        camera.aspect = W / H;
        camera.fov = W < H ? 68 : 52;
        camera.updateProjectionMatrix();
    }

    // ---------- game flow ----------
    function clearObstacles() {
        for (const o of obstacles) { scene.remove(o.g); disposeGroup(o.g); }
        obstacles = [];
        for (const c of coinList) scene.remove(c.m);
        coinList.length = 0;
    }
    function reset() {
        state = 'running'; v = SPEED0; distance = 0; score = 0; bonus = 0; coins = 0; coinCool = 2; coinMisses = 0; hideAngry();
        clearObstacles();
        hero.y = 0; hero.vy = 0; hero.onGround = true; hero.holding = false;
        overlay.classList.add('hidden');
        bubble.classList.remove('show');
        stopGreeting();                      // first tap: the greeting voice stops ...
        startGameMusic();                    // ... and the game music starts straight away
        spawn(FIRST_D);                  // first obstacle is already on the road: it reaches her in about 1 s
        cooldown = 0.001;                // the next one follows right behind it
    }
    function jump() {
        if (hero.onGround) { hero.vy = JUMP; hero.onGround = false; hero.holding = true; }
    }
    function release() { hero.holding = false; }
    // PLAY: open the whole phone screen and show Tania's greeting. The run starts on the first tap.
    // the greeting (voice + bubble) plays only on the first PLAY of this page visit
    let greetedOnce = false;
    function startGame() {
        if (state !== 'ready' && state !== 'over') return;
        setFull(true);                       // open the game on the whole phone screen
        if (!greetedOnce) {
            // first PLAY: greeting voice and bubble, the run starts on the first tap
            greetedOnce = true;
            enterGameAudio();
            state = 'intro';
            clearObstacles();
            hero.y = 0; hero.vy = 0; hero.onGround = true; hero.holding = false;
            v = SPEED0; distance = 0; score = 0; bonus = 0; coins = 0; coinCool = 2; coinMisses = 0; hideAngry();
            overlay.classList.add('hidden');
            setTip('save');
            bubble.classList.add('show');
        } else {
            // every later PLAY (replay): no voice, no bubble. Tania stands still and the run
            // starts only on the first tap, the same as the first time
            if (window.siteMusic) window.siteMusic.pause();
            state = 'intro';
            clearObstacles();
            hero.y = 0; hero.vy = 0; hero.onGround = true; hero.holding = false;
            v = SPEED0; distance = 0; score = 0; bonus = 0; coins = 0; coinCool = 2; coinMisses = 0; hideAngry();
            overlay.classList.add('hidden');
            bubble.classList.remove('show');
        }
    }
    function startOrJump() {
        if (state === 'ready') return;       // the game starts from the PLAY button
        if (state === 'intro') { reset(); return; }   // first tap starts the run
        if (state === 'running') { jump(); return; }
        if (state === 'over' && performance.now() - overAt > 500 && (inView || isFull())) { reset(); jump(); }
    }
    function gameOver() {
        state = 'over'; overAt = performance.now();
        if (gameMusic) { gameMusic.pause(); gameMusic.currentTime = 0; }   // the run's music stops on the game over screen
        const best = Math.floor(score);
        finalScore = best; finalCoins = coins;
        isNewBest = best > hi && best > 0;
        if (best > hi) {
            hi = best;
            try { localStorage.setItem('tania-runner-hi', String(hi)); } catch (e) { /* storage blocked */ }
        }
        renderResult('0');                 // fresh scoreboard, so the entrance animation plays every time
        updateTexts();
        overlay.classList.remove('hidden');
        countUp(best);
    }

    // ---------- update (dt = frames since last update) ----------
    function update(dt, t) {
        const tt = t * 0.001;
        for (const c of clouds) { c.position.z += 0.012 * dt; if (c.position.z > 90) c.position.z = -130; }
        trees.forEach((tr, i) => { tr.g.rotation.z = Math.sin(tt * 1.2 + i) * 0.014; });
        for (let i = 0; i < FF_N; i++) {
            ffPos[i * 3] = ffBase[i * 3] + Math.sin(tt * 0.7 + i) * 0.6;
            ffPos[i * 3 + 1] = ffBase[i * 3 + 1] + Math.sin(tt * 1.1 + i * 2) * 0.25;
            ffPos[i * 3 + 2] = ffBase[i * 3 + 2] + Math.cos(tt * 0.5 + i) * 0.6;
        }
        ffGeo.attributes.position.needsUpdate = true;
        if (state === 'running') {
            distance += v * dt;
            score = Math.floor(distance * 2) + bonus;
            v = Math.min(SPEED_MAX, SPEED0 + distance * RAMP);
            const mv = v * dt;
            for (const o of obstacles) o.g.position.z += DIR * mv;
            for (const c of coinList) c.m.position.z += DIR * mv;
            for (const c of coinList) {
                // a coin that Tania has run past without collecting counts as a miss
                if (!c.passed && DIR * (c.m.position.z - HERO_Z) > 0.55) {
                    c.passed = true;
                    if (++coinMisses >= 5) { coinMisses = 0; showAngry(); }
                }
            }
            for (let i = coinList.length - 1; i >= 0; i--) {
                if (DIR * coinList[i].m.position.z > KILL_D) { scene.remove(coinList[i].m); coinList.splice(i, 1); }
            }
            for (let i = obstacles.length - 1; i >= 0; i--) {
                if (DIR * obstacles[i].g.position.z > KILL_D) {
                    scene.remove(obstacles[i].g);
                    disposeGroup(obstacles[i].g);
                    obstacles.splice(i, 1);
                }
            }
            cooldown -= mv;
            if (cooldown <= 0) spawn();
            coinCool -= mv;
            if (coinCool <= 0) coinCool = spawnCoins() ? 18 + Math.random() * 16 : 2;
            for (const o of obstacles) {
                const dz = DIR * o.g.position.z;
                const near = clamp01((SPAWN_D + 2 - Math.abs(o.g.position.z)) / 8, 0.15);
                // after she has run past, the obstacle shrinks away near the camera instead of popping out
                const gone = dz > 2 ? clamp01((KILL_D - dz) / 3, 0) : 1;
                o.g.scale.setScalar(near * gone);
            }
            grassTex.offset.y = pathTex.offset.y = (distance / 5) % 1;

            for (const l of roadLines) l.m.position.set(0, 0.01, roadZ(l.base, distance, WRAP, -100));
            for (const tr of trees) tr.g.position.z = roadZ(tr.base, distance, 216, -100);
            for (const f of flora) f.g.position.z = roadZ(f.base, distance, 216, -100);
        }

        hero.run += dt * (state === 'running' ? 0.2 + v * 2 : 0.05);
        if (state === 'running' && hero.onGround) hero.phase += dt * (0.16 + v * 0.35);

        if (!hero.onGround) {
            // released early = shorter jump (falls faster while rising)
            hero.vy -= GRAV * dt * ((hero.holding || hero.vy < 0) ? 1 : 2.2);
            hero.y += hero.vy * dt;
            if (hero.y <= 0) { hero.y = 0; hero.vy = 0; hero.onGround = true; hero.squash = 1; }
        }
        hero.squash = Math.max(0, hero.squash - 0.06 * dt);

        // coins: spin, and collect the ones Tania runs or jumps through
        for (const c of coinList) c.m.rotation.y = tt * 3;
        if (state === 'running') {
            for (let i = coinList.length - 1; i >= 0; i--) {
                const c = coinList[i];
                if (Math.abs(c.m.position.z - HERO_Z) < 0.55 && Math.abs(hero.y - c.y) < 0.8) {
                    scene.remove(c.m); coinList.splice(i, 1);
                    coins++; bonus += 5; collectPop(); coinMisses = 0;
                }
            }
        }

        if (state === 'running') {
            for (const o of obstacles) {
                const zMin = o.g.position.z - o.d / 2, zMax = o.g.position.z + o.d / 2;
                const overlapZ = zMax > HERO_Z - 0.45 && zMin < HERO_Z + 0.45;
                if (overlapZ && hero.y < o.h * 0.92) { gameOver(); break; }
            }
        }

        for (let i = 0; i < PETAL_N; i++) {
            petalPos[i * 3 + 1] -= 0.012 * dt;
            petalPos[i * 3] += Math.sin(t * 0.001 + i) * 0.004 * dt;
            petalPos[i * 3 + 2] += DIR * (state === 'running' ? v * 0.7 : 0.02) * dt;
            if (petalPos[i * 3 + 1] < 0 || DIR * petalPos[i * 3 + 2] > 6) resetPetal(i, false);
        }
        petalGeo.attributes.position.needsUpdate = true;
    }

    function animateCape(t, sp) {
        const g = tania.cape.geometry, p = g.attributes.position, b = tania.capeBase;
        for (let i = 0; i < p.count; i++) {
            const y = b[i * 3 + 1], k = -y / 1.25;
            p.setZ(i, -k * (0.05 + sp * 0.9) + Math.sin(t * 0.012 + y * 6) * 0.04 * k * (0.4 + sp * 3));
            p.setX(i, b[i * 3] * (1 - 0.25 * k));
        }
        p.needsUpdate = true; g.computeVertexNormals();
    }

    // ---------- render ----------
    function render(t) {
        const air = hero.onGround ? 0 : Math.min(1, hero.y / 2.4);
        const running = state === 'running' && hero.onGround;
        const bounce = running ? Math.abs(Math.sin(hero.phase * 2)) * 0.035 : 0;
        const sq = hero.squash;

        // Tania: faces the way she runs (opposite to the obstacles' direction)
        tania.root.position.set(0, hero.y + bounce, HERO_Z);
        tania.root.rotation.y = Math.PI;   // she faces away from the camera, into the road
        tania.root.scale.set(1 + sq * 0.05, 1 - sq * 0.06, 1 + sq * 0.05);

        const s = Math.sin(hero.phase), sp = state === 'running' ? v : 0;
        if (running) {
            tania.legL.rotation.x = s * 0.7;
            tania.legR.rotation.x = -s * 0.7;
            tania.armL.rotation.x = -s * 0.6 - 0.25;
            tania.armR.rotation.x = s * 0.6 - 0.25;
        } else if (!hero.onGround) {
            tania.legL.rotation.x = 0.7;
            tania.legR.rotation.x = -0.35;
            tania.armL.rotation.x = -2.0;
            tania.armR.rotation.x = -2.3;
        } else {
            const idle = Math.sin(hero.run * 3) * 0.05;
            tania.legL.rotation.x = idle; tania.legR.rotation.x = -idle;
            tania.armL.rotation.x = idle; tania.armR.rotation.x = -idle;
        }
        tania.root.rotation.x = -(running ? 0.08 + sp * 0.35 : (hero.onGround ? 0 : 0.1));
        tania.root.rotation.z = running ? Math.sin(hero.phase * 2) * 0.025 : 0;
        // braid and cape trail behind her and ripple
        const back = 0.12 + sp * 1.3 + (hero.onGround ? 0 : 0.3);
        // hair: the bend builds up gradually from the roots to the tips, with a soft wave running down
        // each strand; the tips lag behind and splay outward a little, like real hair in the wind
        tania.braid.forEach((b) => {
            const { i, k, side } = b.userData;
            const N = tania.hairSegs;
            const lift = back * 0.2 * (1 + k * 0.12);
            const wave = Math.sin(t * 0.004 - k * 0.8 - i * 0.6) * 0.05 * (0.3 + sp * 2) * (k + 1) / N;
            b.rotation.x = 0.07 + lift + wave;   // gentle rest bend: the hair falls back, clear of the coat's back
            b.rotation.z = side * 0.035 * (k + 1) / N + Math.sin(t * 0.0025 + i * 1.1 + k * 0.5) * 0.03 * (k + 1) / N;
        });
        tania.capePivot.rotation.x = 0.05 + sp * 0.5 + Math.sin(t * 0.004) * 0.04 + (hero.onGround ? 0 : 0.25);
        animateCape(t, sp);

        shadow.position.set(0, 0.01, HERO_Z);
        const sw = 0.9 * (1 - air * 0.5);
        shadow.scale.set(sw, sw * 0.5, 1);
        shadow.material.opacity = 0.4 * (1 - air * 0.6);

        // side camera with a gentle sway
        camera.position.set(-2.2 + Math.sin(t * 0.0005) * 0.15, 3.2 + bounce * 0.4, 6.5);
        camera.lookAt(0, 1.0, -4);

        if (angryGroup && angryGroup.visible) {
            const k = Math.min(1, (performance.now() - angryStart) / 450);
            const pop = 1 - Math.pow(1 - k, 3);                     // springs in
            angryGroup.scale.setScalar(pop * 0.42);                 // small, so it never covers the track
            angryGroup.position.set(0.85, hero.y + 2.95 + Math.sin(t * 0.004) * 0.05, HERO_Z);  // beside her head
            angryGroup.rotation.z = Math.sin(t * 0.004) * 0.05 * pop;
        }
        renderer.render(scene, camera);

        // keep the greeting bubble above Tania's head while the intro is shown
        if (state === 'intro' || state === 'ready') {
            const head = new THREE.Vector3(0, hero.y + 2.7, HERO_Z).project(camera);
            bubble.style.left = ((head.x + 1) / 2 * W) + 'px';
            bubble.style.top = ((1 - head.y) / 2 * H - 16) + 'px';
        }
    }

    // ---------- score display ----------
    function refreshHi() {
        hiEl.textContent = TEXT[lang()].best + ' ' + pad(hi);
    }
    function updateHud() {
        const s = pad(score);
        if (scoreEl.textContent !== s) scoreEl.textContent = s;
        const c = String(coins);
        if (coinNEl.textContent !== c) coinNEl.textContent = c;
    }

    // ---------- result screen (scoreboard): built once per game over ----------
    let resultLang = null;
    function renderResult(numText) {
        const L = TEXT[lang()];
        subEl.innerHTML =
            '<span class="sb">' +
              '<span class="sb-label">' + L.score + '</span>' +
              '<span class="sb-num" id="res-num">' + numText + '</span>' +
              '<span class="sb-grid">' +
                '<span class="sb-cell"><small>' + L.high + '</small><b>' + pad(hi) + '</b></span>' +
                '<span class="sb-cell"><small>' + L.coins + '</small><b><i class="coin-ico"></i>' + finalCoins + '</b></span>' +
              '</span>' +
              (isNewBest ? '<span class="sb-new">' + L.newBest + '</span>' : '') +
              '<span class="sb-again">' + L.again + '</span>' +
            '</span>';
        resultLang = lang();
    }
    function countUp(target) {
        cancelAnimationFrame(countRaf);
        const el = document.getElementById('res-num');
        if (!el) return;
        const t0 = performance.now(), dur = 1200;
        const step = now => {
            const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            el.textContent = String(Math.round(target * e));
            if (k < 1) countRaf = requestAnimationFrame(step);
        };
        el.textContent = '0';
        countRaf = requestAnimationFrame(step);
    }

    // ---------- language (follows the site's EN / BN button) ----------
    function updateTexts() {
        const L = TEXT[lang()];
        if (sectionTitle) sectionTitle.textContent = L.title;
        if (hintEl) hintEl.textContent = L.hint;
        if (fullBtn) fullBtn.textContent = isFull() ? L.exit : L.full;
        if (playBtn) playBtn.textContent = L.play;
        if (rotateHint) rotateHint.textContent = L.rotate;
        refreshHi();
        if (state === 'over') {
            titleEl.textContent = L.over;
            if (resultLang !== lang()) renderResult(String(finalScore));   // only when the language changes
        } else {
            titleEl.textContent = L.title;
            subEl.textContent = L.start;
        }
    }

    // second line of the bubble: 'tap me to save' during the start, 'tap me to play' on the start screen
    const TIP = { save: { en: 'Tap me to save!', bn: 'আমাকে বাঁচাতে ট্যাপ করো!' }, play: { en: 'Tap me to play!', bn: 'আমাকে খেলতে ট্যাপ করো!' } };
    function setTip(k) {
        const en = document.getElementById('runner-tip-en'), bn = document.getElementById('runner-tip-bn');
        if (en) en.innerHTML = '<br>' + TIP[k].en;
        if (bn) bn.innerHTML = '<br>' + TIP[k].bn;
    }

    // ---------- greeting voice and game music ----------
    let greetAudio = null, gameMusic = null, greetDone = null;

    function speakFallback(l, onEnd) {
        if (!('speechSynthesis' in window)) { onEnd(); return; }
        const u = new SpeechSynthesisUtterance(TEXT[l].greet);
        u.lang = l === 'bn' ? 'bn-BD' : 'en-US';
        u.rate = 0.9;
        u.onend = u.onerror = onEnd;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
    }
    // PLAY: the greeting in the site's language, then the game music starts
    function playGreeting() {
        const l = lang();      // the greeting follows the site's language: Bangla when Bangla is on, English otherwise
        let done = false;
        const finish = () => { if (!done) { done = true; greetDone = null; startGameMusic(); } };
        greetDone = finish;
        const a = new Audio(VOICE_FILE[l]);
        greetAudio = a;
        a.onended = finish;
        a.onerror = () => { greetAudio = null; speakFallback(l, finish); };   // file not added yet -> browser voice
        a.play().catch(() => { greetAudio = null; speakFallback(l, finish); });
    }
    function startGameMusic() {
        if (state !== 'intro' && state !== 'running' && state !== 'over') return;   // the game was closed meanwhile
        if (!inView && !isFull()) return;                                            // game not on screen: no music
        if (!gameMusic) {
            gameMusic = new Audio(GAME_MUSIC);
            gameMusic.loop = true;
            gameMusic.volume = 0.2;   // half the earlier loudness
            gameMusic.onerror = () => { gameMusic = null; };   // file not added yet -> stay silent
        }
        gameMusic.play().catch(() => {});
    }
    // stop only the greeting voice (used when the first tap starts the run)
    function stopGreeting() {
        if (greetAudio) { greetAudio.pause(); greetAudio = null; }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        greetDone = null;
    }
    // leaving the game (screen made small): stop the greeting and the game music, bring the site music back
    function leaveGameAudio() {
        if (greetAudio) { greetAudio.pause(); greetAudio = null; }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        greetDone = null;
        if (gameMusic) { gameMusic.pause(); gameMusic.currentTime = 0; }
        if (window.siteMusic) window.siteMusic.resume();
    }
    // entering the game: the site music stops, the greeting plays
    function enterGameAudio() {
        if (window.siteMusic) window.siteMusic.pause();
        playGreeting();
    }

    // ---------- full screen (phones: whole screen, sideways) ----------
    const fullBtn = document.getElementById('runner-full');
    const playBtn = document.getElementById('runner-play');
    playBtn.addEventListener('pointerdown', e => e.stopPropagation());
    playBtn.addEventListener('click', e => { e.stopPropagation(); startGame(); });
    const rotateHint = document.getElementById('runner-rotate');
    let holder = null, savedY = 0;
    function setFull(on) {
        if (on !== isFull()) {
            if (on) {
                savedY = window.scrollY;
                // move the game to <body>: inside <main> the footer is painted above it (same z-index)
                holder = document.createElement('div');
                holder.style.height = wrap.offsetHeight + 'px';
                wrap.parentNode.insertBefore(holder, wrap);
                document.body.appendChild(wrap);
            } else {
                greetedOnce = false;     // left full screen: the next PLAY greets again (voice + bubble)
                leaveGameAudio();
                if (holder) { holder.parentNode.insertBefore(wrap, holder); holder.remove(); holder = null; }
                if (state === 'running' || state === 'intro') {
                state = 'ready'; clearObstacles();
                overlay.classList.remove('hidden');
                bubble.classList.remove('show');
            }
            if (state === 'ready') { setTip('play'); bubble.classList.add('show'); }   // start screen: hello, tap me to play
            }
            wrap.classList.toggle('fake-full', on);
            document.body.classList.toggle('runner-lock', on);
            if (!on) window.scrollTo({ top: savedY, behavior: 'instant' });   // back to where the player was
            if (on) {
                if (wrap.requestFullscreen) wrap.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
                if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
            } else {
                if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
                if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
            }
        }
        layout(); updateTexts();
    }
    fullBtn.addEventListener('pointerdown', e => e.stopPropagation());
    fullBtn.addEventListener('click', e => { e.stopPropagation(); setFull(!isFull()); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) setFull(false); });

    // ---------- input ----------
    wrap.addEventListener('pointerdown', e => { if (!isFull()) return; e.preventDefault(); startOrJump(); }, { passive: false });
    wrap.addEventListener('touchmove', e => { if (isFull()) e.preventDefault(); }, { passive: false });
    wrap.addEventListener('pointerup', release);
    wrap.addEventListener('pointercancel', release);
    wrap.addEventListener('pointerleave', release);
    document.addEventListener('keydown', e => {
        if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
        if (!isFull() && !wrap.contains(document.activeElement)) return;   // page keeps normal scrolling
        e.preventDefault();
        if (e.repeat) return;
        if (state === 'ready') startGame(); else startOrJump();
    });
    document.addEventListener('keyup', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') release();
    });
    new IntersectionObserver(es => es.forEach(en => {
        inView = en.isIntersecting;
        if (!en.isIntersecting && (greetAudio || (gameMusic && !gameMusic.paused))) leaveGameAudio();   // scrolled away: game music stops
    }), { threshold: 0.5 }).observe(wrap);
    new MutationObserver(updateTexts).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', () => setTimeout(layout, 250));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
    if (window.ResizeObserver) new ResizeObserver(layout).observe(wrap);

    // ---------- loop ----------
    let last = performance.now();
    function frame(now) {
        const dt = Math.min(2.5, (now - last) / 16.667);   // frames; clamped so a hidden tab does not jump
        last = now;
        update(dt, now);
        render(now);
        updateHud();
        requestAnimationFrame(frame);
    }

    layout();
    updateTexts();
    requestAnimationFrame(frame);
})();

/* ===== Swipe dots under the games: right / left swipe moves between games ===== */
(() => {
    const track = document.getElementById('play-track');
    const dotsEl = document.getElementById('play-dots');
    if (!track || !dotsEl) return;
    const slides = Array.from(track.querySelectorAll('.play-slide'));
    slides.forEach((s, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Game ' + (i + 1));
        b.onclick = () => track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' });
        dotsEl.appendChild(b);
    });
    const dots = Array.from(dotsEl.children);
    function update() {
        const mid = track.getBoundingClientRect();
        const c = mid.left + mid.width / 2;
        let best = 0, bd = Infinity;
        slides.forEach((s, i) => {
            const r = s.getBoundingClientRect();
            const d = Math.abs((r.left + r.right) / 2 - c);
            if (d < bd) { bd = d; best = i; }
        });
        dots.forEach((d, i) => d.classList.toggle('on', i === best));
    }
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

/* ===== Theme petals behind the games (the same falling petals as the rest of the site) ===== */
(() => {
    const layer = document.getElementById('play-petals');
    if (!layer) return;
    const n = window.innerWidth < 700 ? 14 : 24;
    for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'play-petal';
        p.style.left = (Math.random() * 100) + '%';
        p.style.width = (8 + Math.random() * 8) + 'px';
        p.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
        p.style.setProperty('--dx', (Math.random() * 40 - 20) + 'vw');
        p.style.animationDuration = (9 + Math.random() * 12).toFixed(1) + 's';
        p.style.animationDelay = (-Math.random() * 20).toFixed(1) + 's';
        layer.appendChild(p);
    }
})();

/* ===== Petals inside the Straighten Tania card (the card background moves like the site) ===== */
(() => {
    const card = document.getElementById('pz-card');
    if (!card) return;
    const layer = document.createElement('div');
    layer.className = 'card-petals';
    layer.setAttribute('aria-hidden', 'true');
    const n = window.innerWidth < 700 ? 8 : 12;
    for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'card-petal';
        p.style.left = (Math.random() * 100) + '%';
        p.style.width = (7 + Math.random() * 6) + 'px';
        p.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
        p.style.setProperty('--dx', (Math.random() * 30 - 15) + 'vw');
        p.style.animationDuration = (10 + Math.random() * 10).toFixed(1) + 's';
        p.style.animationDelay = (-Math.random() * 16).toFixed(1) + 's';
        layer.appendChild(p);
    }
    card.insertBefore(layer, card.firstChild);
})();
