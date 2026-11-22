/* Tania's Memory Match - a photo memory game for the Play section (third game in the carousel).
   Two ways to play: Play with Friend (two players take turns on this device) and Play with Bot
   (the bot remembers revealed cards depending on the difficulty).
   Difficulty: Easy 4x3 (6 pairs), Medium 4x4 (8 pairs), Hard 6x4 (12 pairs).
   Photos come from the existing media/ folder. The list of candidates is below; a photo that is
   missing or fails to load is skipped, so only real, working pictures are used. To change the list,
   set window.MEMORY_PICTURES = ['media/photo1.jpg', ...] in a script before this file.
   Nothing here plays audio, so the site music is never touched. Leaving the game (scrolling away,
   switching tabs) pauses it and clears every pending timer, and it resumes when the visitor returns. */
(() => {
    'use strict';

    const slide = document.getElementById('play-slide-memory');
    const root = document.getElementById('mm-root');
    if (!slide || !root) return;

    const $ = id => document.getElementById(id);
    const startEl = $('mm-start');
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

    /* ---------- settings ---------- */
    // skill = chance the bot uses what it remembers (otherwise it guesses); recall = chance it notices a card
    const DIFFS = {
        easy:   { cols: 4, pairs: 6,  memorize: 4, recall: 0.25, skill: 0.30 },
        medium: { cols: 4, pairs: 8,  memorize: 2, recall: 0.60, skill: 0.70 },
        hard:   { cols: 6, pairs: 12, memorize: 2, recall: 0.90, skill: 0.90 }
    };

    // Tania's existing photos in media/. Anything that does not load is left out automatically.
    const CANDIDATES = [
        'media/photo1.jpg', 'media/photo2.jpg', 'media/photo3.jpg', 'media/photo4.jpg', 'media/photo5.jpg',
        'media/photo6.jpg', 'media/photo7.jpg', 'media/photo8.jpg', 'media/photo9.jpg', 'media/photo10.jpg',
        'media/main.jpg',
        'media/post1.jpg', 'media/post2.jpg', 'media/post3.jpg', 'media/post4.jpg', 'media/post5.jpg', 'media/post6.jpg'
    ];

    const TEXT = {
        en: {
            title: "Tania's Memory Match",
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
            pairsWord: 'pairs'
        },
        bn: {
            title: 'তানিয়ার স্মৃতি মেলাও',
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
            pairsWord: 'জোড়া'
        }
    };

    /* ---------- state ---------- */
    let diffKey = 'medium';
    let mode = 'friend';          // 'friend' | 'bot'
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

    function renderLoading() {
        const ready = !!pool && pool.length >= 2;
        if (!pool) { loadingEl.textContent = T('loading'); loadingEl.classList.remove('hidden'); }
        else if (!ready) { loadingEl.textContent = T('noPhotos'); loadingEl.classList.remove('hidden'); }
        else loadingEl.classList.add('hidden');
        modeBtns.forEach(b => { b.disabled = !ready; });
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
        els = pics.map((src, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mm-card';
            b.dataset.i = String(i);
            b.setAttribute('aria-label', T('hiddenCard'));
            b.innerHTML = '<span class="mm-inner"><span class="mm-face mm-back"></span>'
                + '<span class="mm-face mm-front"><img alt="" draggable="false" decoding="async"></span></span>';
            b.querySelector('img').src = src;
            boardEl.appendChild(b);
            return b;
        });
        remaining = n;
    }

    function reveal(i) {
        open.push(i);
        els[i].classList.add('open');
        botLearn(i);
    }

    function close(i) {
        els[i].classList.remove('open');
    }

    function botLearn(i) {
        if (matched.has(i) || botMem.has(i)) return;
        if (Math.random() < DIFFS[diffKey].recall) botMem.set(i, pics[i]);
    }

    /* ---------- timer ---------- */

    /* ---------- names, scores, HUD ---------- */
    function names() {
        return mode === 'friend' ? [T('p1'), T('p2')] : [T('you'), T('botName')];
    }

    function updateHud() {
        const nm = names();
        pNameEls[0].textContent = nm[0];
        pNameEls[1].textContent = nm[1];
        pScoreEls[0].textContent = String(scores[0]);
        pScoreEls[1].textContent = String(scores[1]);
        pEls.forEach((el, i) => el.classList.toggle('on', phase === 'play' && turn === i));
        if (phase === 'preview') turnEl.textContent = T('memorize');
        else if (phase === 'play') {
            if (mode === 'friend') turnEl.textContent = turn === 0 ? T('turnP1') : T('turnP2');
            else turnEl.textContent = turn === 0 ? T('turnYou') : T('botThink');
        } else turnEl.textContent = '';
        leftEl.textContent = String(remaining);
        movesEl.textContent = String(moves);
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
    }

    /* ---------- turn flow ---------- */
    function advance() {
        if (paused || phase !== 'play' || busy) return;
        if (mode === 'bot' && turn === 1) later(botStep, 700 + rnd(500));
    }

    function lockAndResolve() {
        busy = true;
        moves++;
        updateHud();
        later(() => resolve(false), 850);
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
            open = [];
            busy = false;
            updateHud();
            if (remaining === 0) { finish(); return; }
            advance();                       // a match keeps the same player going
            return;
        }
        const flipBack = () => {
            close(a); close(b);
            open = [];
            busy = false;
            turn = 1 - turn;
            updateHud();
            advance();
        };
        if (immediate) flipBack(); else later(flipBack, 950);
    }

    function onPick(i) {
        if (phase !== 'play' || paused || busy) return;
        if (mode === 'bot' && turn === 1) return;
        if (matched.has(i) || open.indexOf(i) !== -1) return;
        if (open.length >= 2) return;
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
        let winKey;
        if (mode === 'friend') winKey = s0 > s1 ? 'winP1' : (s1 > s0 ? 'winP2' : 'tie');
        else winKey = s0 > s1 ? 'winYou' : (s1 > s0 ? 'winBot' : 'tie');
        endInfo = { winKey, s0, s1, mv: moves };
        renderEnd();
        endEl.classList.remove('hidden');
        celebrate();
        updateHud();
    }

    function renderEnd() {
        if (!endInfo) return;
        const nm = names();
        endTitle.textContent = T('wonderful');
        endWin.textContent = T(endInfo.winKey);
        endStats.textContent = T('finalScore') + ': ' + nm[0] + ' ' + endInfo.s0 + '  ·  ' + nm[1] + ' ' + endInfo.s1
            + '  ·  ' + T('movesTaken') + ' ' + endInfo.mv;
    }

    function celebrate() {
        endEl.querySelectorAll('.mm-petal').forEach(n => n.remove());
        const glyphs = ['♥', '✿', '❀', '♥', '✿'];
        for (let i = 0; i < 16; i++) {
            const s = document.createElement('span');
            s.className = 'mm-petal';
            s.textContent = glyphs[i % glyphs.length];
            s.style.left = (Math.random() * 100).toFixed(1) + '%';
            s.style.fontSize = (12 + Math.random() * 10).toFixed(0) + 'px';
            s.style.animationDuration = (3.2 + Math.random() * 1.8).toFixed(2) + 's';
            s.style.animationDelay = (Math.random() * 1.2).toFixed(2) + 's';
            endEl.appendChild(s);
        }
    }

    /* ---------- start / restart / back ---------- */
    async function newGame(m, d) {
        const token = ++game;
        mode = m;
        diffKey = d;
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

        startEl.classList.add('hidden');
        gameEl.classList.remove('hidden');

        phase = 'preview';
        previewLeft = DIFFS[diffKey].memorize;
        els.forEach(e => e.classList.add('open'));
        pics.forEach((_, i) => botLearn(i));
        countEl.classList.remove('hidden');
        updateHud();
        previewTick();
    }

    function backToMenu() {
        game++;
        clearPend();
        phase = 'menu';
        paused = false;
        autoPaused = false;
        open = [];
        busy = false;
        endEl.classList.add('hidden');
        countEl.classList.add('hidden');
        gameEl.classList.add('hidden');
        startEl.classList.remove('hidden');
        boardEl.textContent = '';
        renderLoading();
    }

    /* ---------- leaving the game: pause everything, resume when back ---------- */
    function pause() {
        if (paused || phase === 'menu' || phase === 'done') return;
        paused = true;
        autoPaused = true;
        clearPend();
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
        root.querySelectorAll('[data-k]').forEach(el => { el.textContent = T(el.dataset.k); });
        renderDiffInfo();
        renderLoading();
        updateHud();
        renderEnd();
    }

    /* ---------- wiring ---------- */
    diffBtns.forEach(b => b.addEventListener('click', () => setDiff(b.dataset.diff)));
    modeBtns.forEach(b => b.addEventListener('click', () => newGame(b.dataset.mode, diffKey)));
    boardEl.addEventListener('click', e => {
        const card = e.target.closest ? e.target.closest('.mm-card') : null;
        if (!card || !boardEl.contains(card)) return;
        onPick(parseInt(card.dataset.i, 10));
    });
    $('mm-restart').addEventListener('click', () => newGame(mode, diffKey));
    $('mm-back').addEventListener('click', backToMenu);
    $('mm-end-again').addEventListener('click', () => newGame(mode, diffKey));
    $('mm-end-change').addEventListener('click', backToMenu);

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

    setDiff(diffKey);
    renderAll();
})();
