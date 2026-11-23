/* Tania's Pair Hunt (Tania's Memory Match) - a photo memory game for the Play section (third game in the carousel).
   Two ways to play: Play with Friend (two players take turns on this device) and Play with Bot
   (the bot remembers revealed cards depending on the difficulty).
   Difficulty: Easy 4x3 (6 pairs), Medium 4x4 (8 pairs), Hard 6x4 (12 pairs).
   Photos come from the existing media/ folder. The list of candidates is below; a photo that is
   missing or fails to load is skipped, so only real, working pictures are used. To change the list,
   set window.MEMORY_PICTURES = ['media/photo1.webp', ...] in a script before this file.
   Nothing here plays audio, so the site music is never touched. Leaving the game (scrolling away,
   switching tabs) pauses it and clears every pending timer, and it resumes when the visitor returns. */
(() => {
    'use strict';

    const slide = document.getElementById('play-slide-memory');
    const root = document.getElementById('mm-root');
    if (!slide || !root) return;

    const $ = id => document.getElementById(id);
    const startEl = $('mm-start');
    const landingEl = $('mm-landing');
    const playEl = $('mm-play');
    const goEl = $('mm-go');
    const nameBox = $('mm-names');
    const nameEls = [$('mm-name0'), $('mm-name1')];
    const gameEl = $('mm-game');
    const boardEl = $('mm-board');
    const stageEl = $('mm-stage');
    const countEl = $('mm-count');
    const endEl = $('mm-end');
    const endTitle = $('mm-end-title');
    const endWin = $('mm-end-win');
    const endStats = $('mm-end-stats');
    const loadingEl = $('mm-loading');
    const turnEl = $('mm-turn');
    const leftEl = $('mm-left');
    const movesEl = $('mm-moves');
    const pEls = [$('mm-p0'), $('mm-p1')];
    const pNameEls = [$('mm-p0-name'), $('mm-p1-name')];
    const pScoreEls = [$('mm-p0-score'), $('mm-p1-score')];
    const diffBtns = Array.from(root.querySelectorAll('.mm-diff'));
    const modeBtns = Array.from(root.querySelectorAll('.mm-mode'));
    // Play with Bot sits above Play with Friend
    (() => {
        const box = root.querySelector('.mm-modes');
        const bot = box && box.querySelector('[data-mode="bot"]');
        if (box && bot) box.insertBefore(bot, box.firstChild);
    })();

    /* ---------- settings ---------- */
    // skill = chance the bot uses what it remembers (otherwise it guesses); recall = chance it notices a card
    const DIFFS = {
        easy:   { cols: 4, pairs: 6,  memorize: 4, recall: 0.25, skill: 0.30 },
        medium: { cols: 4, pairs: 8,  memorize: 2, recall: 0.60, skill: 0.70 },
        hard:   { cols: 6, pairs: 12, memorize: 2, recall: 0.90, skill: 0.90 }
    };

    // Tania's existing photos in media/. Anything that does not load is left out automatically.
    const CANDIDATES = [
        'media/photo1.webp', 'media/photo2.webp', 'media/photo3.webp', 'media/photo4.webp', 'media/photo5.webp',
        'media/photo6.webp', 'media/photo7.webp', 'media/photo8.webp', 'media/photo9.webp', 'media/photo10.webp',
        'media/photo11.webp', 'media/photo12.webp', 'media/photo13.webp',
        'media/fb-profile.webp', 'media/insta-profile.webp'
    ];

    const TEXT = {
        en: {
            title: "Tania's Pair Hunt",
            intro: 'Tania has so many lovely moments to remember. Flip the cards, find every matching pair and see how good your memory really is!',
            chooseDiff: 'Choose a difficulty',
            chooseMode: 'Choose how to play',
            easy: 'Easy', medium: 'Medium', hard: 'Hard',
            friend: 'Play with Friend', friendNote: 'Take turns on this device',
            bot: 'Play with Bot', botNote: 'Play against the computer',
            loading: "Gathering Tania's photos…",
            noPhotos: "Add Tania's photos to the media folder to play.",
            pairsLeft: 'Pairs left', moves: 'Moves', time: 'Time',
            p1: 'Player 1', p2: 'Player 2', you: 'You', botName: 'Bot',
            turnP1: "Player 1's turn", turnP2: "Player 2's turn", turnYou: 'Your turn', botThink: 'Bot is thinking…',
            restart: 'Restart Game', backSel: 'Back to Game Selection',
            memorize: 'Memorize!',
            hiddenCard: 'Hidden card',
            wonderful: "Wonderful! You matched all of Tania's memories!",
            winP1: 'Player 1 wins!', winP2: 'Player 2 wins!', winYou: 'You win!', winBot: 'The bot wins this time!',
            tie: "It's a tie. Lovely play!",
            finalScore: 'Final score', movesTaken: 'Moves',
            playAgain: 'Play again', changeMode: 'Change mode',
            pairsWord: 'pairs', exitFull: 'Exit game',
            play: 'PLAY', start: 'START', enterNames: 'Write your names', pressPlay: 'Press PLAY to start',
            turnOf: "{n}'s turn", winName: '{n} wins!',
            combo: 'Combo', bestCombo: 'Best combo', newBest: 'New best time!', bestTime: 'Best time'
        },
        bn: {
            title: 'তানিয়ার জোড়া খোঁজো',
            intro: 'তানিয়ার কত সুন্দর মুহূর্ত! কার্ড উল্টে একই ছবির জোড়া মেলাও, দেখি তোমার স্মৃতিশক্তি কতটা ভালো!',
            chooseDiff: 'কঠিনতা বেছে নাও',
            chooseMode: 'কীভাবে খেলবে বেছে নাও',
            easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন',
            friend: 'বন্ধুর সাথে খেলো', friendNote: 'একই ডিভাইসে পালা করে খেলো',
            bot: 'বটের সাথে খেলো', botNote: 'কম্পিউটারের বিপক্ষে খেলো',
            loading: 'তানিয়ার ছবিগুলো সাজানো হচ্ছে…',
            noPhotos: 'খেলতে হলে তানিয়ার ছবিগুলো media ফোল্ডারে যোগ করো।',
            pairsLeft: 'বাকি জোড়া', moves: 'চাল', time: 'সময়',
            p1: 'খেলোয়াড় ১', p2: 'খেলোয়াড় ২', you: 'তুমি', botName: 'বট',
            turnP1: 'খেলোয়াড় ১-এর পালা', turnP2: 'খেলোয়াড় ২-এর পালা', turnYou: 'তোমার পালা', botThink: 'বট ভাবছে…',
            restart: 'আবার শুরু করো', backSel: 'খেলার তালিকায় ফিরে যাও',
            memorize: 'মনে রাখো!',
            hiddenCard: 'লুকানো কার্ড',
            wonderful: 'দারুণ! তানিয়ার সব স্মৃতি তুমি মিলিয়ে ফেলেছ!',
            winP1: 'খেলোয়াড় ১ জিতেছে!', winP2: 'খেলোয়াড় ২ জিতেছে!', winYou: 'তুমি জিতেছ!', winBot: 'এবার বট জিতেছে!',
            tie: 'সমান সমান! চমৎকার খেলা হলো।',
            finalScore: 'চূড়ান্ত স্কোর', movesTaken: 'চাল',
            playAgain: 'আবার খেলো', changeMode: 'খেলার ধরন বদলাও',
            pairsWord: 'জোড়া', exitFull: 'গেম থেকে বের হও',
            play: 'প্লে করুন', start: 'শুরু করো', enterNames: 'বন্ধুদের নাম লেখো', pressPlay: 'খেলা শুরু করতে প্লে চাপুন',
            turnOf: '{n}-এর পালা', winName: '{n} জিতেছে!',
            combo: 'কম্বো', bestCombo: 'সেরা কম্বো', newBest: 'নতুন সেরা সময়!', bestTime: 'সেরা সময়'
        }
    };

    /* ---------- state ---------- */
    let diffKey = 'medium';
    let mode = 'bot';             // 'friend' | 'bot'  (Play with Bot is the default)
    let phase = 'menu';           // 'menu' | 'preview' | 'play' | 'done'
    let pics = [];                // picture URL per card index
    let els = [];                 // card buttons per index
    let matched = new Set();
    let open = [];                // indices of face-up, unmatched cards (max 2)
    let busy = false;             // two cards are open and being judged
    let turn = 0;                 // 0 = player 1 / you, 1 = player 2 / bot
    let scores = [0, 0];
    let moves = 0;
    let remaining = 0;
    let pendTimer = null;
    let paused = false;
    let autoPaused = false;
    let inView = false;
    let previewLeft = 0;
    let botMem = new Map();       // index -> picture the bot remembers
    let pool = null;              // verified picture URLs
    let poolP = null;
    let keepImgs = [];            // hold references so preloaded images stay cached
    let game = 0;                 // token: stale async work is ignored
    let endInfo = null;
    let typed = ['', ''];         // names typed for the two friends
    let total = 0;                // pairs in this game
    let streak = 0;               // matches in a row by the same player
    let bestStreak = 0;
    let dealUntil = 0;            // cards are being dealt: picks wait until then
    let timing = false;           // the clock has started for this game
    let tStart = 0, tAcc = 0, tInt = null;
    let lastTurnText = '';
    const phoneMQ = window.matchMedia ? window.matchMedia('(max-width: 700px), (max-width: 900px) and (pointer: coarse)') : { matches: false };
    const pTurnEls = [];
    let endMirror = null;
    const calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* ---------- helpers ---------- */
    const lang = () => (document.documentElement.lang === 'bn' ? 'bn' : 'en');
    const T = k => (TEXT[lang()][k] !== undefined ? TEXT[lang()][k] : TEXT.en[k]);
    const rnd = n => Math.floor(Math.random() * n);
    const pick = arr => arr[rnd(arr.length)];
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const rowsFor = d => (d.pairs * 2) / d.cols;
    const freeIdx = () => els.map((_, i) => i).filter(i => !matched.has(i));

    function later(fn, ms) {
        clearPend();
        pendTimer = setTimeout(() => { pendTimer = null; if (!paused) fn(); }, ms);
    }
    function clearPend() {
        if (pendTimer) { clearTimeout(pendTimer); pendTimer = null; }
    }

    // show a screen with a soft fade-and-rise
    function show(el) {
        el.classList.remove('hidden');
        el.classList.remove('mm-enter');
        void el.offsetWidth;
        el.classList.add('mm-enter');
    }

    function fmtTime(ms) {
        const s = Math.floor(ms / 1000);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    /* ---------- clock ---------- */
    const elapsed = () => tAcc + (tStart ? Date.now() - tStart : 0);
    function drawTime() { if (timeEl) timeEl.textContent = fmtTime(elapsed()); }
    function startTimer() {
        if (tStart || phase !== 'play') return;
        tStart = Date.now();
        if (!tInt) tInt = setInterval(drawTime, 250);
    }
    function stopTimer() {
        if (tStart) { tAcc += Date.now() - tStart; tStart = 0; }
        if (tInt) { clearInterval(tInt); tInt = null; }
        drawTime();
    }
    function resetTimer() { stopTimer(); tAcc = 0; timing = false; drawTime(); }


    /* ---------- falling petals: the site's own petal drift, drawn on a small canvas behind the game ---------- */
    let petalsOn = false;
    function startPetals() {
        if (root.querySelector('.mm-fx-canvas') || !window.requestAnimationFrame) return;
        const cv = document.createElement('canvas');
        cv.className = 'mm-fx-canvas';
        cv.setAttribute('aria-hidden', 'true');
        root.insertBefore(cv, root.firstChild);
        const c2 = cv.getContext('2d');
        const PAL = ['#f8bcd3', '#ee8fb5', '#ffd6e4', '#e57aa8', '#d9b8f2'];
        const PS = 10;                       // every petal has the same size, as on the site
        const pet = [];
        let W = 0, H = 0, D = 1;
        function petalPath(L, w) {
            c2.beginPath(); c2.moveTo(0, 0);
            c2.bezierCurveTo(w, -L * .3, w * .9, -L * .9, 0, -L);
            c2.bezierCurveTo(-w * .9, -L * .9, -w, -L * .3, 0, 0);
            c2.closePath();
        }
        function resize() {
            W = root.clientWidth; H = root.clientHeight;
            D = Math.min(window.devicePixelRatio || 1, W < 760 ? 1 : 1.5);
            cv.width = W * D; cv.height = H * D;
            c2.setTransform(D, 0, 0, D, 0, 0);
        }
        resize();
        for (let i = 0; i < 34; i++) {
            pet.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
                       r: Math.random() * 6.3, vr: (Math.random() - .5) * .06,
                       ph: Math.random() * 6.3, c: PAL[Math.random() * 5 | 0] });
        }
        window.addEventListener('resize', resize);
        let t = 0;
        function frame() {
            if (!petalsOn) { cv.__raf = 0; return; }
            cv.__raf = requestAnimationFrame(frame);
            if (root.clientWidth !== W || root.clientHeight !== H) resize();
            t += 16;
            c2.clearRect(0, 0, W, H);
            for (const q of pet) {
                q.vx *= .98; q.vy = q.vy * .98 + .035; if (q.vy > 1.5) q.vy = 1.5;
                q.x += q.vx + Math.sin(t * .0012 + q.ph) * .5;
                q.y += q.vy; q.r += q.vr;
                if (q.y > H + 20) { q.y = -20; q.x = Math.random() * W; }
                if (q.y < -40) q.y = H + 20;
                c2.save(); c2.translate(q.x, q.y); c2.rotate(q.r);
                c2.globalAlpha = .55; c2.fillStyle = q.c; petalPath(PS, PS * .5); c2.fill();
                c2.restore();
            }
        }
        // the petals only move while the game is on screen
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                petalsOn = entries[0].isIntersecting;
                if (petalsOn && !cv.__raf) cv.__raf = requestAnimationFrame(frame);
            }).observe(root);
        } else {
            petalsOn = true;
            cv.__raf = requestAnimationFrame(frame);
        }
    }

    /* ---------- best record (kept in this browser only) ---------- */
    function readBest() {
        try { return JSON.parse(localStorage.getItem('tania_mm_best_' + diffKey) || 'null'); } catch (e) { return null; }
    }
    function writeBest(ms) {
        try { localStorage.setItem('tania_mm_best_' + diffKey, JSON.stringify({ ms })); } catch (e) { /* ignore */ }
    }

    /* ---------- icon buttons: Restart and Back to game selection sit at the top as round icons ---------- */
    const ICON_RESTART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>';
    const ICON_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>';
    function labelIcons() {
        const r = $('mm-restart'), b = $('mm-back');
        if (r) { r.title = T('restart'); r.setAttribute('aria-label', T('restart')); }
        if (b) { b.title = T('backSel'); b.setAttribute('aria-label', T('backSel')); }
    }
    function makeIconButtons() {
        const r = $('mm-restart'), b = $('mm-back'), actions = root.querySelector('.mm-actions');
        if (!r || !b || !actions || actions.dataset.icons) return;
        actions.dataset.icons = '1';
        [r, b].forEach(x => { x.removeAttribute('data-k'); x.classList.add('mm-icon-btn'); });
        r.innerHTML = ICON_RESTART;
        b.innerHTML = ICON_BACK;
        // put the two icons in the top score strip itself, so they take no extra space
        const stats = root.querySelector('.mm-stats');
        if (stats) { stats.appendChild(r); stats.appendChild(b); }
        actions.remove();
        labelIcons();
    }

    /* ---------- little extras injected into the existing markup (index.html stays untouched) ---------- */
    let timeEl = null, progEl = null, endIcon = null, endBest = null;
    function decorate() {
        makeIconButtons();
        // no clock on screen during play
        timeEl = null;
        // canvas aurora: smooth animated blobs in the site's rose / lilac / sage palette
        if (!root.querySelector('.mm-aurora-canvas')) {
            const cv = document.createElement('canvas');
            cv.className = 'mm-aurora-canvas';
            cv.setAttribute('aria-hidden', 'true');
            root.insertBefore(cv, root.firstChild);

            const orbs = [
                { x: .18, y: .22, r: .55, speed: .00017, phase: 0,      rgb: '238,143,181', a: .36 },
                { x: .82, y: .78, r: .48, speed: .00013, phase: 2.1,    rgb: '205,180,240', a: .28 },
                { x: .52, y: .08, r: .40, speed: .00021, phase: 4.3,    rgb: '255,214,228', a: .18 },
                { x: .08, y: .88, r: .34, speed: .00009, phase: 1.5,    rgb: '155,184,154', a: .14 },
                { x: .65, y: .50, r: .30, speed: .00019, phase: 3.7,    rgb: '238,143,181', a: .10 }
            ];

            let auroraFrame = null, auroraPaused = false;
            const drawAurora = (ts) => {
                if (!cv.isConnected || auroraPaused) { auroraFrame = null; return; }
                auroraFrame = requestAnimationFrame(drawAurora);
                const W = cv.offsetWidth, H = cv.offsetHeight;
                if (!W || !H) return;
                if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
                const ctx = cv.getContext('2d');
                ctx.clearRect(0, 0, W, H);
                for (const o of orbs) {
                    const t   = ts * o.speed + o.phase;
                    const cx  = (o.x + Math.sin(t * 1.3) * .18) * W;
                    const cy  = (o.y + Math.cos(t)       * .15) * H;
                    const rad = o.r * Math.min(W, H) * (.85 + Math.sin(t * .7) * .15);
                    const g   = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
                    const pulse = o.a * (.75 + Math.sin(t * 1.9) * .25);
                    g.addColorStop(0,   `rgba(${o.rgb},${pulse.toFixed(3)})`);
                    g.addColorStop(.55, `rgba(${o.rgb},${(pulse*.4).toFixed(3)})`);
                    g.addColorStop(1,   `rgba(${o.rgb},0)`);
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, W, H);
                }
            };

            // pause when the game is paused, scrolled off screen, or the tab is hidden
            let auroraOffscreen = true;   // IntersectionObserver reports asynchronously, so start paused
            const syncAurora = () => {
                auroraPaused = auroraOffscreen || document.hidden || root.classList.contains('mm-paused');
                if (!auroraPaused && !auroraFrame) auroraFrame = requestAnimationFrame(drawAurora);
            };
            const mo = new MutationObserver(syncAurora);
            mo.observe(root, { attributes: true, attributeFilter: ['class'] });
            document.addEventListener('visibilitychange', syncAurora);
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(entries => { auroraOffscreen = !entries[0].isIntersecting; syncAurora(); }).observe(root);
            } else {
                auroraOffscreen = false; syncAurora();
            }
        }

        // two colour washes that fade in and out: rose for player 1, lilac for player 2 / the bot
        if (!root.querySelector('.mm-tint')) {
            ['p0', 'p1'].forEach(k => {
                const t = document.createElement('div');
                t.className = 'mm-tint ' + k;
                t.setAttribute('aria-hidden', 'true');
                root.insertBefore(t, root.firstChild);
            });
        }
        const hud = root.querySelector('.mm-hud');
        if (hud && !$('mm-prog')) {
            const bar = document.createElement('div');
            bar.className = 'mm-progress';
            bar.innerHTML = '<i id="mm-prog"></i>';
            hud.appendChild(bar);
        }
        progEl = $('mm-prog');
        if (!endBest) {
            endBest = document.createElement('p');
            endBest.className = 'mm-end-best';
            endEl.insertBefore(endBest, $('mm-end-stats').nextSibling);
        }
        // face-to-face play on a phone: each player's panel carries its own "your turn" line,
        // and the result is also written upside down for the person sitting opposite
        if (!pTurnEls.length) {
            pEls.forEach(el => {
                const t = document.createElement('span');
                t.className = 'mm-pturn';
                el.appendChild(t);
                pTurnEls.push(t);
            });
        }
        if (!endMirror) {
            endMirror = document.createElement('p');
            endMirror.className = 'mm-end-mirror';
            endMirror.setAttribute('aria-hidden', 'true');
            endEl.insertBefore(endMirror, endEl.firstChild);
        }
    }

        /* ---------- effects ---------- */
    const PALETTE = ['var(--rose)', 'var(--blush)', 'var(--lil)', 'var(--sage)'];

    // rich burst: inner ring of sparks + outer scatter + a rising glow ring
    function burst(i) {
        if (calm || !els[i]) return;
        const sr = stageEl.getBoundingClientRect();
        const cr = els[i].getBoundingClientRect();
        const cx = cr.left - sr.left + cr.width / 2;
        const cy = cr.top - sr.top + cr.height / 2;

        // a quick bright flash, then two rings expand and fade: the theme colour and a gold one
        const flash = document.createElement('span');
        flash.className = 'mm-flash';
        flash.style.left = cx + 'px';
        flash.style.top  = cy + 'px';
        stageEl.appendChild(flash);
        setTimeout(() => flash.remove(), 520);

        const ring = document.createElement('span');
        ring.className = 'mm-burst-ring';
        ring.style.left = cx + 'px';
        ring.style.top  = cy + 'px';
        ring.style.color = PALETTE[i % PALETTE.length];
        stageEl.appendChild(ring);
        setTimeout(() => ring.remove(), 700);

        const ringGold = document.createElement('span');
        ringGold.className = 'mm-burst-ring-gold';
        ringGold.style.left = cx + 'px';
        ringGold.style.top  = cy + 'px';
        stageEl.appendChild(ringGold);
        setTimeout(() => ringGold.remove(), 900);

        // a few gold gems scatter further out, for a richer, more premium pop
        const COUNT_GEM = 5, DIST_GEM = 58;
        for (let k = 0; k < COUNT_GEM; k++) {
            const sp = document.createElement('span');
            sp.className = 'mm-spark mm-spark-out mm-gem';
            const ang = (Math.PI * 2 * k) / COUNT_GEM + Math.random() * 0.6;
            const d   = DIST_GEM + Math.random() * 26;
            sp.style.left = cx + 'px';
            sp.style.top  = cy + 'px';
            sp.style.setProperty('--dx', (Math.cos(ang) * d).toFixed(0) + 'px');
            sp.style.setProperty('--dy', (Math.sin(ang) * d - 14).toFixed(0) + 'px');
            stageEl.appendChild(sp);
            setTimeout(() => sp.remove(), 1200);
        }
    }

    function showCombo(n) {
        if (calm) return;
        stageEl.querySelectorAll('.mm-combo').forEach(x => x.remove());
        const c = document.createElement('div');
        c.className = 'mm-combo' + (n >= 3 ? ' mm-combo-gold' : '');
        c.textContent = T('combo') + ' ×' + n + '!';
        stageEl.appendChild(c);
        setTimeout(() => c.remove(), 1200);
    }

    function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } }

    /* ---------- photos: check each one and keep the working ones ---------- */
    function loadPool() {
        if (poolP) return poolP;
        const list = Array.isArray(window.MEMORY_PICTURES) && window.MEMORY_PICTURES.length
            ? window.MEMORY_PICTURES : CANDIDATES;
        const unique = Array.from(new Set(list));
        poolP = Promise.all(unique.map(src => new Promise(resolve => {
            const im = new Image();
            let done = false;
            const finish = ok => { if (!done) { done = true; resolve(ok ? { src, im } : null); } };
            im.onload = () => finish(true);
            im.onerror = () => finish(false);
            setTimeout(() => finish(false), 12000);
            keepImgs.push(im);
            im.src = src;
        }))).then(results => {
            const loaded = results.filter(Boolean);
            // the same picture saved under two file names must not appear twice in the game
            const kept = [], hashes = [], dupes = [];
            loaded.forEach(r => {
                const h = pictureHash(r.im);
                if (h && hashes.some(x => hamming(x, h) <= DUP_DISTANCE)) { dupes.push(r.src); return; }
                if (h) hashes.push(h);
                kept.push(r.src);
            });
            pool = kept;
            const missing = unique.filter(s => !loaded.some(r => r.src === s));
            if (missing.length) console.info('Tania\'s Memory Match: skipped photos that could not be loaded:', missing);
            if (dupes.length) console.info('Tania\'s Memory Match: skipped photos that repeat another photo:', dupes);
            renderLoading();
            return pool;
        });
        return poolP;
    }

    // Fingerprint of a picture: a small grey thumbnail, one bit per pixel comparison.
    // The same photo gives the same bits even if the file is saved again or resized slightly.
    const DUP_DISTANCE = 5;     // out of 64 bits: this many differences or fewer = same picture
    function pictureHash(im) {
        try {
            const c = document.createElement('canvas');
            c.width = 9; c.height = 8;
            const ctx = c.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(im, 0, 0, 9, 8);
            const d = ctx.getImageData(0, 0, 9, 8).data;
            const g = (x, y) => { const k = (y * 9 + x) * 4; return 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]; };
            const bits = [];
            for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits.push(g(x, y) > g(x + 1, y) ? 1 : 0);
            return bits;
        } catch (e) { return null; }
    }
    function hamming(a, b) {
        let n = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
        return n;
    }

    // the start card and the setup screen show one of Tania's photos behind them, softly blurred,
    // like the scene behind the other games' PLAY screens
    function setScene() {
        if (!pool || !pool.length) return;
        root.style.setProperty('--mm-scene', 'url("' + pick(pool) + '")');
    }

    function renderLoading() {
        const ready = !!pool && pool.length >= 2;
        if (!pool) { loadingEl.textContent = T('loading'); loadingEl.classList.remove('hidden'); }
        else if (!ready) { loadingEl.textContent = T('noPhotos'); loadingEl.classList.remove('hidden'); }
        else loadingEl.classList.add('hidden');
        playEl.disabled = !ready;
        goEl.disabled = !ready;
    }

    /* ---------- board ---------- */
    // true when two cards of the same picture are side by side (left/right or up/down)
    function twinsTouch(deck, cols) {
        for (let i = 0; i < deck.length; i++) {
            const right = (i % cols !== cols - 1) ? i + 1 : -1;
            const down = i + cols;
            if (right < deck.length && deck[right] === deck[i]) return true;
            if (down < deck.length && deck[down] === deck[i]) return true;
        }
        return false;
    }

    function buildBoard() {
        const d = DIFFS[diffKey];
        const n = Math.min(d.pairs, pool.length);
        const chosen = shuffle(pool.slice()).slice(0, n);
        const cols = Math.min(d.cols, chosen.length * 2);
        let deck = null;
        for (let tries = 0; tries < 300; tries++) {
            deck = shuffle(chosen.concat(chosen));
            if (!twinsTouch(deck, cols)) break;
        }
        pics = deck;
        boardEl.textContent = '';
        boardEl.style.setProperty('--cols', String(Math.min(d.cols, pics.length)));
        total = n;
        const dealt = !calm;
        els = pics.map((src, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mm-card' + (dealt ? ' deal' : '');
            b.style.setProperty('--i', String(i));
            b.dataset.i = String(i);
            b.setAttribute('aria-label', T('hiddenCard'));
            b.innerHTML = '<span class="mm-inner"><span class="mm-face mm-back"></span>'
                + '<span class="mm-face mm-front"><img alt="" draggable="false" decoding="async"></span></span>';
            b.querySelector('img').src = src;
            boardEl.appendChild(b);
            return b;
        });
        remaining = n;
        if (dealt) {
            const span = pics.length * 30 + 600;
            dealUntil = Date.now() + span;
            setTimeout(() => els.forEach(e => e && e.classList.remove('deal')), span);
        } else dealUntil = 0;
    }

    function reveal(i) {
        open.push(i);
        els[i].classList.add('open');
        // a little lift while the card turns, like a real card being picked up
        els[i].classList.add('lift');
        if (mode === 'bot' && turn === 1) els[i].classList.add('bot-pick');
        const el = els[i];
        setTimeout(() => { if (el) el.classList.remove('lift'); }, 740);
        botLearn(i);
    }

    function close(i) {
        els[i].classList.remove('open');
        els[i].classList.remove('bot-pick');
    }

    function botLearn(i) {
        if (matched.has(i) || botMem.has(i)) return;
        if (Math.random() < DIFFS[diffKey].recall) botMem.set(i, pics[i]);
    }

    /* ---------- timer ---------- */

    /* ---------- names, scores, HUD ---------- */
    function names() {
        if (mode !== 'friend') return [T('you'), T('botName')];
        return [typed[0] || T('p1'), typed[1] || T('p2')];
    }

    function bump(el, v) {
        if (el.dataset.v !== undefined && el.dataset.v !== v) {
            el.classList.remove('mm-bump');
            void el.offsetWidth;
            el.classList.add('mm-bump');
        }
        el.dataset.v = v;
    }

    function updateHud() {
        const nm = names();
        pNameEls[0].textContent = nm[0];
        pNameEls[1].textContent = nm[1];
        pScoreEls[0].textContent = String(scores[0]);
        pScoreEls[1].textContent = String(scores[1]);
        bump(pScoreEls[0], String(scores[0]));
        bump(pScoreEls[1], String(scores[1]));
        pEls.forEach((el, i) => el.classList.toggle('on', phase === 'play' && turn === i));
        let txt = '';
        if (phase === 'preview') txt = T('memorize');
        else if (phase === 'play') {
            if (mode === 'friend') txt = T('turnOf').replace('{n}', names()[turn]);
            else txt = turn === 0 ? T('turnYou') : T('botThink');
        }
        turnEl.textContent = txt;
        turnEl.classList.toggle('thinking', phase === 'play' && mode === 'bot' && turn === 1);
        if (txt && txt !== lastTurnText) {
            turnEl.classList.remove('pop');
            void turnEl.offsetWidth;
            turnEl.classList.add('pop');
        }
        lastTurnText = txt;
        pTurnEls.forEach((el, i) => { el.textContent = (phase === 'play' && mode === 'friend' && turn === i) ? T('turnYou') : ''; });
        root.classList.toggle('mm-flip', phase === 'play' && turn === 1);   // the board turns towards player 2
        let who = -1;
        if (phase === 'play') who = turn;
        else if (phase === 'done' && endInfo && endInfo.winner !== -1) who = endInfo.winner;
        root.classList.toggle('mm-t0', who === 0);
        root.classList.toggle('mm-t1', who === 1);
        leftEl.textContent = String(remaining);
        bump(movesEl, String(moves));
        movesEl.textContent = String(moves);
        if (progEl) progEl.style.width = (total ? ((total - remaining) / total) * 100 : 0).toFixed(1) + '%';
    }

    /* ---------- preview (memorize) ---------- */
    function previewTick() {
        if (phase !== 'preview' || paused) return;
        countEl.textContent = T('memorize') + ' ' + previewLeft;
        if (previewLeft <= 0) { endPreview(); return; }
        later(() => { previewLeft--; previewTick(); }, 1000);
    }

    function endPreview() {
        phase = 'play';
        els.forEach(e => e.classList.remove('open'));
        countEl.classList.add('hidden');
        turn = 0;
        updateHud();
        announceTurn(null);
    }

    /* ---------- turn flow ---------- */
    // a big "whose turn" card shown before each turn starts; nobody can pick a card until it is gone
    let announcing = false, announceEl = null;
    function hideAnnounce() {
        announcing = false;
        if (announceEl) announceEl.classList.remove('show');
    }
    function announceTurn(then) {
        // never show the card while the game is paused, closed or not on screen
        if (paused || phase !== 'play' || !inView || !root.classList.contains('mm-full')) return;
        if (!announceEl) {
            announceEl = document.createElement('div');
            announceEl.className = 'mm-announce';
            announceEl.setAttribute('aria-live', 'polite');
            root.appendChild(announceEl);
        }
        let txt;
        if (mode === 'friend') txt = T('turnOf').replace('{n}', names()[turn]);
        else txt = turn === 0 ? T('turnYou') : T('botThink');
        announceEl.dataset.who = (mode === 'bot' && turn === 1) ? 'bot' : (turn === 0 ? 'p0' : 'p1');
        announceEl.innerHTML = '<span class="mm-ann-dot"></span><span class="mm-ann-txt"></span>';
        announceEl.querySelector('.mm-ann-txt').textContent = txt;
        announceEl.classList.remove('show');
        void announceEl.offsetWidth;
        announceEl.classList.add('show');
        announcing = true;
        later(() => {
            announcing = false;
            announceEl.classList.remove('show');
            if (then) then();
        }, 1500);
    }

    function advance(turnChanged) {
        if (paused || phase !== 'play' || busy) return;
        if (turnChanged) {
            announceTurn(() => { if (mode === 'bot' && turn === 1) later(botStep, 500 + rnd(400)); });
            return;
        }
        if (mode === 'bot' && turn === 1) later(botStep, 700 + rnd(500));
    }

    function lockAndResolve() {
        busy = true;
        moves++;
        updateHud();
        later(() => resolve(false), 600);
    }

    function resolve(immediate) {
        clearPend();
        const a = open[0], b = open[1];
        if (pics[a] === pics[b]) {
            matched.add(a); matched.add(b);
            botMem.delete(a); botMem.delete(b);
            els[a].classList.add('matched'); els[b].classList.add('matched');
            els[a].setAttribute('aria-label', T('hiddenCard'));
            scores[turn]++;
            remaining--;
            streak++;
            if (streak > bestStreak) bestStreak = streak;
            open = [];
            busy = false;
            burst(a); burst(b);
            buzz(25);
            if (streak >= 2) showCombo(streak);
            updateHud();
            if (remaining === 0) { finish(); return; }
            advance(false);                  // a match keeps the same player going
            return;
        }
        streak = 0;
        if (!immediate) {
            els[a].classList.add('shake'); els[b].classList.add('shake');
            buzz([18, 40, 18]);
        }
        const flipBack = () => {
            els[a].classList.remove('shake'); els[b].classList.remove('shake');
            close(a); close(b);
            open = [];
            busy = false;
            turn = 1 - turn;
            updateHud();
            advance(true);
        };
        if (immediate) flipBack(); else later(flipBack, 700);
    }

    function onPick(i) {
        if (phase !== 'play' || paused || busy) return;
        if (Date.now() < dealUntil) return;            // still dealing the cards
        if (mode === 'bot' && turn === 1) return;
        if (announcing) return;
        if (matched.has(i) || open.indexOf(i) !== -1) return;
        if (open.length >= 2) return;
        if (!timing) { timing = true; startTimer(); }
        reveal(i);
        if (open.length === 2) lockAndResolve();
    }

    /* ---------- bot ---------- */
    function botPickFirst() {
        const d = DIFFS[diffKey];
        const free = freeIdx();
        if (Math.random() < d.skill) {
            // 1) a pair it already knows
            const byPic = new Map();
            botMem.forEach((p, i) => {
                if (matched.has(i)) return;
                if (!byPic.has(p)) byPic.set(p, []);
                byPic.get(p).push(i);
            });
            for (const arr of byPic.values()) if (arr.length >= 2) return arr[0];
            // 2) a card it remembers: reveal it and hunt for its partner
            const known = Array.from(botMem.keys()).filter(i => !matched.has(i));
            if (known.length) return pick(known);
        }
        // otherwise explore, preferring cards it has not seen yet
        const unseen = free.filter(i => !botMem.has(i));
        const pool2 = unseen.length ? unseen : free;
        return pool2.length ? pick(pool2) : null;
    }

    function botPickSecond(a) {
        const d = DIFFS[diffKey];
        const p = pics[a];
        const candidates = freeIdx().filter(i => i !== a);
        if (!candidates.length) return null;
        if (Math.random() < d.skill) {
            for (const [i, q] of botMem) {
                if (q === p && i !== a && !matched.has(i)) return i;
            }
            const unseen = candidates.filter(i => !botMem.has(i));
            if (unseen.length) return pick(unseen);
        }
        // less skilled: a guess, which can miss the partner it remembers
        return pick(candidates);
    }

    function botStep() {
        if (phase !== 'play' || paused || busy || turn !== 1) return;
        if (open.length >= 2) return;
        const choice = open.length === 0 ? botPickFirst() : botPickSecond(open[0]);
        if (choice === null || choice === undefined) return;
        reveal(choice);
        if (open.length === 2) lockAndResolve();
        else later(botStep, 650 + rnd(350));
    }

    /* ---------- end of game ---------- */
    function finish() {
        phase = 'done';
        clearPend();
        busy = false;
        open = [];
        const s0 = scores[0], s1 = scores[1];
        const winner = s0 > s1 ? 0 : (s1 > s0 ? 1 : -1);
        const ms = elapsed();
        stopTimer();
        timing = false;
        const prev = readBest();
        const isNew = !prev || ms < prev.ms;
        if (isNew) writeBest(ms);
        endInfo = { winner, s0, s1, mv: moves, ms, best: isNew ? ms : prev.ms, isNew, combo: bestStreak };
        renderEnd();
        endEl.classList.remove('hidden');
        celebrate();
        updateHud();
    }

    function renderEnd() {
        if (!endInfo) return;
        const nm = names();
        // no "Wonderful!" title on the end screen, but the scores are followed by who actually won
        endTitle.textContent = '';
        if (endInfo.winner === -1) endWin.textContent = T('tie');
        else if (mode === 'bot') endWin.textContent = endInfo.winner === 0 ? T('winYou') : T('winBot');
        else endWin.textContent = T('winName').replace('{n}', nm[endInfo.winner]);
        endStats.textContent = T('finalScore') + ': ' + nm[0] + ' ' + endInfo.s0 + '  ·  ' + nm[1] + ' ' + endInfo.s1
            + '  ·  ' + T('movesTaken') + ' ' + endInfo.mv;
        if (endMirror) endMirror.textContent = nm[0] + ' ' + endInfo.s0 + '  ·  ' + nm[1] + ' ' + endInfo.s1;
        if (endBest) {
            let line = endInfo.combo >= 2 ? T('bestCombo') + ' ×' + endInfo.combo : '';
            endBest.textContent = line;
            endBest.classList.toggle('new', !!endInfo.isNew);
        }
    }

    function celebrate() {
        endEl.querySelectorAll('.mm-petal').forEach(n => n.remove());
        for (let i = 0; i < 40; i++) {
            const s = document.createElement('span');
            // roughly one piece in four falls as a small gold coin instead of a petal/star
            const gold = true;
            s.className = 'mm-petal' + (gold ? ' mm-petal-gold' : '');
            // randomise size, position, duration, delay so they scatter naturally
            s.style.left = (Math.random() * 100).toFixed(1) + '%';
            const size = (gold ? 8 + Math.random() * 6 : 11 + Math.random() * 12).toFixed(0);
            s.style.fontSize = size + 'px';
            if (gold) { s.style.width = size + 'px'; s.style.height = size + 'px'; }
            s.style.setProperty('--cel-rot', (Math.random() * 360).toFixed(0) + 'deg');
            s.style.setProperty('--cel-dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
            s.style.animationDuration = (2.8 + Math.random() * 2.2).toFixed(2) + 's';
            s.style.animationDelay    = (Math.random() * 1.5).toFixed(2) + 's';
            endEl.appendChild(s);
        }
    }

    /* ---------- start / restart / back ---------- */
    async function newGame(m, d) {
        const token = ++game;
        mode = m;
        diffKey = d;
        syncDuel();
        await loadPool();
        if (token !== game) return;
        renderLoading();
        if (!pool || pool.length < 2) return;

        clearPend();
        buildBoard();
        scores = [0, 0];
        moves = 0;
        open = [];
        busy = false;
        matched = new Set();
        botMem = new Map();
        turn = 0;
        paused = false;
        autoPaused = false;
        endInfo = null;
        endEl.classList.add('hidden');
        resetTimer();
        streak = 0;
        bestStreak = 0;
        lastTurnText = '';
        root.classList.remove('mm-paused');

        startEl.classList.add('hidden');
        landingEl.classList.add('hidden');
        show(gameEl);

        // the cards stay face down from the very start: no photo is shown before anyone picks a card
        phase = 'play';
        turn = 0;
        countEl.classList.add('hidden');
        updateHud();
        announceTurn(null);
    }

    function backToMenu(toLanding) {
        game++;
        clearPend();
        hideAnnounce();                       // the turn card never stays on the menu
        phase = 'menu';
        paused = false;
        autoPaused = false;
        open = [];
        busy = false;
        endEl.classList.add('hidden');
        countEl.classList.add('hidden');
        gameEl.classList.add('hidden');
        resetTimer();
        streak = 0;
        bestStreak = 0;
        root.classList.remove('mm-paused', 'mm-t0', 'mm-t1', 'mm-flip');
        startEl.classList.add('hidden');
        landingEl.classList.add('hidden');
        show(toLanding ? landingEl : startEl);
        boardEl.textContent = '';
        renderLoading();
    }

    /* ---------- mode choice and names (on the setup screen) ---------- */
    // both players now stay the same way up, side by side, instead of player 2's panel,
    // name and board being turned 180 degrees to face them from the opposite side
    function syncDuel() {
        root.classList.remove('mm-duel');
    }

    function setMode(m) {
        mode = m;
        syncDuel();
        modeBtns.forEach(b => {
            const on = b.dataset.mode === m;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        nameBox.classList.toggle('hidden', m !== 'friend');
    }

    function startGame() {
        typed = nameEls.map(el => el.value.trim().slice(0, 20));
        newGame(mode, diffKey);
    }

    /* ---------- leaving the game: pause everything, resume when back ---------- */
    function pause() {
        if (paused || phase === 'menu' || phase === 'done') return;
        paused = true;
        autoPaused = true;
        clearPend();
        hideAnnounce();                       // leaving the game cancels the turn card
        stopTimer();
        root.classList.add('mm-paused');
        if (phase === 'preview') {
            endPreview();                     // the memorize time is not kept when leaving
        } else if (open.length === 2) {
            resolve(true);                    // judge the open pair now, no pending action left
        } else if (open.length === 1) {
            close(open[0]);
            open = [];
            busy = false;
        }
        updateHud();
    }

    function resume() {
        if (!paused) return;
        paused = false;
        autoPaused = false;
        root.classList.remove('mm-paused');
        hideAnnounce();
        if (timing && phase === 'play') startTimer();
        advance();
    }

    function sync() {
        if (!inView || document.hidden) pause();
        else if (autoPaused) resume();
    }

    /* ---------- difficulty and language ---------- */
    function setDiff(k) {
        diffKey = k;
        diffBtns.forEach(b => {
            const on = b.dataset.diff === k;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderDiffInfo();
    }

    function renderDiffInfo() {
        diffBtns.forEach(b => {
            const d = DIFFS[b.dataset.diff];
            const sub = b.querySelector('.mm-diff-sub');
            if (sub) sub.textContent = d.cols + ' × ' + rowsFor(d) + ' · ' + d.pairs + ' ' + T('pairsWord');
        });
    }

    function renderAll() {
        slide.querySelectorAll('[data-k]').forEach(el => { el.textContent = T(el.dataset.k); });
        labelIcons();
        nameEls[0].placeholder = T('p1');
        nameEls[1].placeholder = T('p2');
        renderDiffInfo();
        renderLoading();
        updateHud();
        renderEnd();
    }

    /* ---------- full screen, like Tania's Run and Straighten Tania ----------
       Choosing a mode (the PLAY step) makes the card fill the whole screen; leaving the game
       (Back, Change mode, Exit, Escape or leaving full screen) brings the normal card back. */
    const exitBtn = $('mm-exit');
    if (exitBtn) exitBtn.setAttribute('aria-label', 'Exit game');
    const isFull = () => root.classList.contains('mm-full');
    let mmHolder = null, mmSavedY = 0;

    function enterFull() {
        if (isFull()) return;
        mmSavedY = window.scrollY;
        // move the game to <body>, like Tania's Run and Straighten Tania: on phones the card lives inside
        // the swipeable carousel (an overflow/scroll-snap container), and position:fixed on an element still
        // inside a scrolling ancestor can stay pinned to that ancestor instead of the real screen on mobile
        // browsers, so the game never actually fills the phone screen. Moving it out of the carousel first
        // fixes that.
        mmHolder = document.createElement('div');
        mmHolder.style.height = root.offsetHeight + 'px';
        root.parentNode.insertBefore(mmHolder, root);
        document.body.appendChild(root);
        root.classList.add('mm-full');
        document.body.classList.add('mm-lock');
        if (root.requestFullscreen) root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
    }

    function exitFull() {
        if (!isFull()) return;
        hideAnnounce();
        root.classList.remove('mm-full');
        document.body.classList.remove('mm-lock');
        if (mmHolder) { mmHolder.parentNode.insertBefore(root, mmHolder); mmHolder.remove(); mmHolder = null; }
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
        window.scrollTo({ top: mmSavedY, behavior: 'instant' });
        backToMenu(true);
    }

    /* ---------- wiring ---------- */
    diffBtns.forEach(b => b.addEventListener('click', () => setDiff(b.dataset.diff)));
    modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    playEl.addEventListener('click', () => { enterFull(); backToMenu(false); });   // PLAY opens the full-screen setup
    goEl.addEventListener('click', startGame);
    boardEl.addEventListener('click', e => {
        const card = e.target.closest ? e.target.closest('.mm-card') : null;
        if (!card || !boardEl.contains(card)) return;
        onPick(parseInt(card.dataset.i, 10));
    });
    $('mm-restart').addEventListener('click', () => newGame(mode, diffKey));
    // the menu button goes to the game's own main menu (mode, difficulty, names, PLAY),
    // and stays in full screen instead of leaving the game
    $('mm-back').addEventListener('click', () => { if (!isFull()) enterFull(); backToMenu(false); });
    exitBtn.addEventListener('click', exitFull);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') exitFull(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) exitFull(); });
    $('mm-end-again').addEventListener('click', () => newGame(mode, diffKey));
    $('mm-end-change').addEventListener('click', () => { enterFull(); backToMenu(false); });

    new MutationObserver(renderAll).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            if (inView) loadPool();          // photos are checked the first time the game is seen
            sync();
        }, { threshold: 0.2 }).observe(slide);
    } else {
        inView = true;
        loadPool();
    }
    document.addEventListener('visibilitychange', sync);

    if (phoneMQ.addEventListener) phoneMQ.addEventListener('change', syncDuel);
    decorate();
    setDiff(diffKey);
    setMode(mode);
    renderAll();
})();
