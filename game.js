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
    const hiEl = document.getElementById('runner-hi');
    const sectionTitle = document.getElementById('game-title');
    const hintEl = document.getElementById('runner-hint');
    const voiceBtn = document.getElementById('runner-voice');
    const voiceTxt = document.getElementById('runner-voice-txt');

    // ---------- settings you can change ----------
    
    const VOICE_FILE = { en: 'audio/game-voice-en.mp3', bn: 'audio/game-voice-bn.mp3' };
    const THREE_MISSING = { en: 'The 3D game could not load. Check your internet connection.', bn: '3D গেমটি লোড হয়নি। ইন্টারনেট সংযোগ দেখুন।' };

    const TEXT = {
        en: { title: "Tania's Run", hint: 'Tap, click or press Space to jump', start: 'Press PLAY to start', play: 'PLAY', over: 'Game over', again: 'tap or press Space to try again', best: 'BEST', listen: 'Listen', full: 'Full screen', exit: 'Exit full screen', rotate: 'Turn your phone sideways for the best view' },
        bn: { title: 'তানিয়ার দৌড়', hint: 'লাফ দিতে ট্যাপ, ক্লিক বা স্পেস চাপুন', start: 'খেলা শুরু করতে প্লে চাপুন', play: 'প্লে করুন', over: 'খেলা শেষ', again: 'আবার খেলতে ট্যাপ করুন বা স্পেস চাপুন', best: 'সেরা', listen: 'শুনুন', full: 'ফুল স্ক্রিন', exit: 'ছোট করুন', rotate: 'ফোনটি পাশে ঘুরিয়ে খেলুন' }
    };
    const lang = () => (document.documentElement.lang === 'bn' ? 'bn' : 'en');

    // speed (world units per frame): starts slow, speeds up gradually
    const SPEED0 = 0.15, SPEED_MAX = 0.32, RAMP = 0.00014;
    const GRAV = 0.011, JUMP = 0.23;
    const HERO_Z = 0;
    const SPAWN_D = 42, KILL_D = 5, FIRST_D = 16;   // distance along the road where obstacles appear / disappear
    const WRAP = 112;                  // road lines repeat every WRAP units

    const clamp01 = (x, lo) => Math.min(1, Math.max(lo, x));
    let state = 'ready';               // ready | running | over
    let v = SPEED0, distance = 0, score = 0, cooldown = 0, overAt = 0;
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

// ---------- materials ----------
    const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, flatShading: true }, extra || {}));
    const smooth = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, flatShading: false });
    const M = {
        road: std(0x3a2d45, { roughness: 1 }), grass: std(0x2f4a3a, { roughness: 1 }), grassA: std(0x4f7a4c), grassB: std(0x3e6a4a),
        bushA: std(0x3e6a4a), bushB: std(0x557f57), rockM: std(0x5b4d6b), lilac: std(0xcdb4f0), cloud: std(0xf6d7e6, { emissive: 0x2a1530 }),
        line: new THREE.MeshBasicMaterial({ color: 0xee8fb5, transparent: true, opacity: 0.55 }),
        skin: smooth(0xe2b38f), hair: smooth(0x1a1020), lip: smooth(0xb86a7a), coat: std(0x3a2146), coatDark: std(0x241833),
        rose: std(0xee8fb5, { emissive: 0x3a1024 }), pants: std(0x1c1226), boot: std(0x2e2339),
        cape: std(0x181221), scarf: std(0x2b1830), eye: std(0x0e0a14),
        stone: std(0x4a3360, { emissive: 0x1a1024 }), moss: std(0x9bb89a),
        bark: std(0x5a3d2b), barkTop: std(0xc9a27a), wood: std(0x7a5536), woodDark: std(0x4a3322),
        pine1: std(0x4d7552), pine2: std(0x6f9a6c), blossom1: std(0xee8fb5), blossom2: std(0xffd6e4), blossom3: std(0xe57aa8),
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
    for (let i = 0; i < 9; i++) {
        const r = 6 + Math.random() * 4, h = 8 + Math.random() * 8;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), i % 2 ? M.mountain1 : M.mountain2);
        cone.position.set(30 + Math.random() * 10, h / 2 - 0.2, -100 + i * 25 + Math.random() * 6);
        scene.add(cone);
    }
    for (let i = 0; i < 7; i++) {
        const hill = new THREE.Mesh(new THREE.SphereGeometry(9, 12, 8), M.hill);
        hill.scale.set(1, 0.35, 1);
        hill.position.set(20 + Math.random() * 4, 0, -90 + i * 30);
        scene.add(hill);
    }

    // trees on the far side of the road (move with the road)
    function makeTree(kind, s) {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.4 * s, 6), M.bark);
        trunk.position.y = 0.7 * s; g.add(trunk);
        if (kind === 'pine') {
            for (let k = 0; k < 3; k++) {
                const c = new THREE.Mesh(new THREE.ConeGeometry((1.5 - k * 0.35) * s, 1.6 * s, 7), k % 2 ? M.pine2 : M.pine1);
                c.position.y = (1.6 + k * 0.9) * s; g.add(c);
            }
        } else {
            const mats = [M.blossom1, M.blossom2, M.blossom3];
            for (let k = 0; k < 3; k++) {
                const f = new THREE.Mesh(new THREE.IcosahedronGeometry((0.9 - k * 0.15) * s, 1), mats[k]);
                f.position.set((k - 1) * 0.4 * s, (2.1 + (k % 2) * 0.5) * s, (k % 2 ? 0.2 : -0.2) * s);
                g.add(f);
            }
        }
        return g;
    }
    for (let i = 0; i < 24; i++) {
        const kind = i % 3 === 0 ? 'blossom' : 'pine';
        const g = makeTree(kind, 0.9 + Math.random() * 0.6);
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
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 * s, 0), M.rockM);
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
        // braid: a chain of pivots, so it bends and swings like real hair
        const braid = []; let bp = root;
        for (let k = 0; k < 4; k++) {
            const pv = new THREE.Group(); pv.position.set(0, k ? -0.2 : 2.2, k ? 0 : -0.17); bp.add(pv);
            add(new THREE.SphereGeometry(0.075 - k * 0.01, 12, 10), mHair, 0, -0.08, 0, pv).scale.set(1, 1.5, 0.9);
            bp = pv; braid.push(pv);
        }
        add(new THREE.SphereGeometry(0.04, 8, 8), mRose, 0, -0.2, 0, braid[3]);

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
        return { root, legL: leg(-0.12), legR: leg(0.12), armL: arm(-0.31), armR: arm(0.31), capePivot, cape, capeBase, braid };
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
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.stone);
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

    function spawn(dist) {
        const early = distance < 150;                       // easy start: only low, simple obstacles
        const r = Math.random();
        const kind = early ? (r < 0.6 ? 'stone' : 'stump') : (r < 0.4 ? 'stone' : r < 0.7 ? 'stump' : 'crate');
        const tall = !early && Math.random() < 0.25;
        let g, w, h, d;
        if (kind === 'stone') {
            w = 0.9 + Math.random() * 0.5; d = 0.9;
            h = tall ? 1.7 + Math.random() * 0.3 : 0.7 + Math.random() * 0.5;
            g = makeStone(w, h, d);
        } else if (kind === 'stump') {
            w = d = 0.8; h = 0.7 + Math.random() * 0.3;
            g = makeStump(0.4, h);
        } else {
            w = d = 0.9; h = tall ? 1.8 : 0.8 + Math.random() * 0.2;
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
        else { W = Math.max(280, Math.floor(wrap.clientWidth)); H = Math.round(Math.min(360, Math.max(230, W * 0.62))); }
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
    }
    function reset() {
        state = 'running'; v = SPEED0; distance = 0; score = 0;
        clearObstacles();
        hero.y = 0; hero.vy = 0; hero.onGround = true; hero.holding = false;
        overlay.classList.add('hidden');
        spawn(FIRST_D);                  // first obstacle is already on the road: it reaches her in about 1.5 s
        cooldown = 0.001;                // the next one follows right behind it
    }
    function jump() {
        if (hero.onGround) { hero.vy = JUMP; hero.onGround = false; hero.holding = true; }
    }
    function release() { hero.holding = false; }
    function startGame() {
        if (state !== 'ready' && state !== 'over') return;
        setFull(true);                       // open the game on the whole phone screen
        reset();
    }
    function startOrJump() {
        if (state === 'ready') return;       // the game starts from the PLAY button
        if (state === 'running') { jump(); return; }
        if (state === 'over' && performance.now() - overAt > 500) { reset(); jump(); }
    }
    function gameOver() {
        state = 'over'; overAt = performance.now();
        const best = Math.floor(score);
        if (best > hi) {
            hi = best;
            try { localStorage.setItem('tania-runner-hi', String(hi)); } catch (e) { /* storage blocked */ }
        }
        updateTexts();
        overlay.classList.remove('hidden');
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
            score = Math.floor(distance * 2);
            v = Math.min(SPEED_MAX, SPEED0 + distance * RAMP);
            const mv = v * dt;
            for (const o of obstacles) o.g.position.z += DIR * mv;
            for (let i = obstacles.length - 1; i >= 0; i--) {
                if (DIR * obstacles[i].g.position.z > KILL_D) {
                    scene.remove(obstacles[i].g);
                    disposeGroup(obstacles[i].g);
                    obstacles.splice(i, 1);
                }
            }
            cooldown -= mv;
            if (cooldown <= 0) spawn();
            for (const o of obstacles) o.g.scale.setScalar(clamp01((SPAWN_D + 2 - Math.abs(o.g.position.z)) / 8, 0.15));
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
        // braid and cape trail behind her and ripple
        const back = 0.12 + sp * 1.3 + (hero.onGround ? 0 : 0.3);
        tania.braid.forEach((b, i) => { b.rotation.x = back * (i ? 0.45 : 0.7) + Math.sin(t * 0.012 - i * 0.9) * 0.16 * (0.4 + sp * 3); });
        tania.capePivot.rotation.x = 0.05 + sp * 0.5 + Math.sin(t * 0.004) * 0.04 + (hero.onGround ? 0 : 0.25);
        animateCape(t, sp);

        shadow.position.set(0, 0.01, HERO_Z);
        const sw = 0.9 * (1 - air * 0.5);
        shadow.scale.set(sw, sw * 0.5, 1);
        shadow.material.opacity = 0.4 * (1 - air * 0.6);

        // side camera with a gentle sway
        camera.position.set(-2.2 + Math.sin(t * 0.0005) * 0.15, 3.2 + bounce * 0.4, 6.5);
        camera.lookAt(0, 1.0, -4);

        renderer.render(scene, camera);
    }

    // ---------- score display ----------
    function refreshHi() {
        hiEl.textContent = TEXT[lang()].best + ' ' + String(Math.floor(hi)).padStart(5, '0');
    }
    function updateHud() {
        const s = String(Math.floor(score)).padStart(5, '0');
        if (scoreEl.textContent !== s) scoreEl.textContent = s;
    }

    // ---------- language (follows the site's EN / BN button) ----------
    function updateTexts() {
        const L = TEXT[lang()];
        if (sectionTitle) sectionTitle.textContent = L.title;
        if (hintEl) hintEl.textContent = L.hint;
        if (voiceTxt) voiceTxt.textContent = L.listen;
        if (fullBtn) fullBtn.textContent = isFull() ? L.exit : L.full;
        if (playBtn) playBtn.textContent = L.play;
        if (rotateHint) rotateHint.textContent = L.rotate;
        refreshHi();
        if (state === 'over') {
            titleEl.textContent = L.over;
            subEl.textContent = (lang() === 'bn' ? 'স্কোর ' : 'Score ') + Math.floor(score) + ' · ' + L.again;
        } else {
            titleEl.textContent = L.title;
            subEl.textContent = L.start;
        }
    }

    // ---------- voice ----------
    function speakFallback(l) {
        if (!('speechSynthesis' in window)) return;
        const u = new SpeechSynthesisUtterance(TEXT[l].start);
        u.lang = l === 'bn' ? 'bn-BD' : 'en-US';
        u.rate = 0.9;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
    }
    function playVoice() {
        const l = lang();
        const a = new Audio(VOICE_FILE[l]);
        let done = false;
        const fallback = () => { if (!done) { done = true; speakFallback(l); } };
        a.onerror = fallback;                  // file not added yet -> use the browser voice
        a.play().catch(fallback);
    }
    voiceBtn.addEventListener('pointerdown', e => e.stopPropagation());
    voiceBtn.addEventListener('click', e => { e.stopPropagation(); playVoice(); });

    // ---------- full screen (phones: whole screen, sideways) ----------
    const fullBtn = document.getElementById('runner-full');
    const playBtn = document.getElementById('runner-play');
    playBtn.addEventListener('pointerdown', e => e.stopPropagation());
    playBtn.addEventListener('click', e => { e.stopPropagation(); startGame(); });
    const rotateHint = document.getElementById('runner-rotate');
    let holder = null;
    function setFull(on) {
        if (on !== isFull()) {
            if (on) {
                // move the game to <body>: inside <main> the footer is painted above it (same z-index)
                holder = document.createElement('div');
                holder.style.height = wrap.offsetHeight + 'px';
                wrap.parentNode.insertBefore(holder, wrap);
                document.body.appendChild(wrap);
            } else {
                if (holder) { holder.parentNode.insertBefore(wrap, holder); holder.remove(); holder = null; }
                if (state === 'running') { state = 'ready'; clearObstacles(); overlay.classList.remove('hidden'); }
            }
            wrap.classList.toggle('fake-full', on);
            document.body.classList.toggle('runner-lock', on);
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
        if (!inView) return;
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (!e.repeat) { if (state === 'ready') startGame(); else startOrJump(); }
        }
    });
    document.addEventListener('keyup', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') release();
    });
    new IntersectionObserver(es => es.forEach(en => { inView = en.isIntersecting; }), { threshold: 0.5 }).observe(wrap);
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
