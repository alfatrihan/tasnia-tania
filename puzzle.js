/* Straighten Tania (তানিয়াকে সোজা করো) - a sliding picture puzzle.
   Flow: PLAY makes the card full screen, then the game starts and the 3x3 / 4x4 choice appears.
   Every round uses a random picture from window.PUZZLE_PICTURES (media/puzzle/pictures.js) and a
   random legal shuffle, so each round can be solved. Score is based on the time taken:
   (time limit - seconds) x 10. When solved, the score shows first and the result is revealed after it,
   with a Play again button. Music: a random song from window.PUZZLE_SONGS (audio/puzzle/songs.js)
   plays from PLAY and stops when the visitor leaves the puzzle. Text follows the EN / BN button. */
(() => {
    const board = document.getElementById('pz-board');
    if (!board) return;
    const card = document.getElementById('pz-card');
    const overlay = document.getElementById('pz-overlay');
    const playBtn = document.getElementById('pz-play');
    const ovTitle = document.getElementById('pz-ov-title');
    const ovSub = document.getElementById('pz-ov-sub');
    const sizesWrap = document.getElementById('pz-sizes');
    const exitBtn = document.getElementById('pz-exit');
    const sizeBtns = Array.from(document.querySelectorAll('.pz-size'));
    const movesEl = document.getElementById('pz-moves');
    const timeEl = document.getElementById('pz-time');
    const scoreEl = document.getElementById('pz-score');
    const resultEl = document.getElementById('pz-result');
    const resLabel = document.getElementById('pz-res-label');
    const resGrade = document.getElementById('pz-res-grade');
    const resDetail = document.getElementById('pz-res-detail');
    const replayBtn = document.getElementById('pz-replay');
    const titleEl = document.getElementById('puzzle-title');
    const introEl = document.getElementById('puzzle-intro');
    const hintEl = document.getElementById('pz-hint');

    const PICS = (window.PUZZLE_PICTURES && window.PUZZLE_PICTURES.length)
        ? window.PUZZLE_PICTURES
        : ['media/Avater/tania_circular_3d_logo.png'];
    const SHUFFLE_STEPS = 500;
    const TIME_LIMIT = { 3: 180, 4: 420 };    // seconds: a solve at the limit scores 0

    const TEXT = {
        en: {
            title: 'Straighten Tania',
            intro: 'Slide the pieces back into place to see the whole picture.',
            hint: 'Click a piece next to the gap, or use the arrow keys',
            ovSub: 'Press PLAY to start',
            play: 'PLAY',
            moves: 'Moves',
            time: 'Time',
            score: 'Score',
            result: 'Result',
            gExcellent: 'Excellent!',
            gGood: 'Good job!',
            gTry: 'Keep trying',
            replay: 'Play again',
            piece: 'Piece'
        },
        bn: {
            title: 'তানিয়াকে সোজা করো',
            intro: 'টুকরোগুলো আবার জায়গামতো সাজান, তাহলেই পুরো ছবিটা দেখা যাবে।',
            hint: 'ফাঁকার পাশের টুকরোতে ক্লিক করুন, বা অ্যারো কী ব্যবহার করুন',
            ovSub: 'খেলা শুরু করতে প্লে চাপুন',
            play: 'প্লে করুন',
            moves: 'চাল',
            time: 'সময়',
            score: 'স্কোর',
            result: 'রেজাল্ট',
            gExcellent: 'অসাধারণ!',
            gGood: 'ভালো হয়েছে!',
            gTry: 'আরেকবার চেষ্টা করো',
            replay: 'আবার খেলো',
            piece: 'টুকরো'
        }
    };
    const lang = () => (document.documentElement.lang === 'bn' ? 'bn' : 'en');
    const fmt = s => Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);

    let N = 3;               // pieces per row and column
    let GAP = 8;             // id of the empty square, always N * N - 1
    let grid = [];           // grid[position] = piece id, or GAP for the empty square
    let pieces = [];         // pieces[id] = button element
    let picIndex = -1;       // which picture of PICS this round uses
    let moves = 0, secs = 0, timer = 0, started = false, solved = false, playing = false;
    let revealTimer = 0;

    const rowOf = p => Math.floor(p / N);
    const colOf = p => p % N;
    const posOf = id => grid.indexOf(id);
    const isAdjacent = (a, b) =>
        (rowOf(a) === rowOf(b) && Math.abs(colOf(a) - colOf(b)) === 1) ||
        (colOf(a) === colOf(b) && Math.abs(rowOf(a) - rowOf(b)) === 1);
    const isSolved = () => grid.every((id, p) => id === p);
    const swapCells = (a, b) => { const t = grid[a]; grid[a] = grid[b]; grid[b] = t; };

    const scoreNow = () => Math.max(0, TIME_LIMIT[N] - secs) * 10;
    const maxScore = () => TIME_LIMIT[N] * 10;

    function neighbours(p) {
        const out = [];
        const r = rowOf(p), c = colOf(p);
        if (r > 0) out.push(p - N);
        if (r < N - 1) out.push(p + N);
        if (c > 0) out.push(p - 1);
        if (c < N - 1) out.push(p + 1);
        return out;
    }

    function pickPicture() {
        if (PICS.length === 1) return 0;
        let i;
        do { i = Math.floor(Math.random() * PICS.length); } while (i === picIndex);
        return i;
    }

    // ---------- music: a random song from audio/puzzle/songs.js loops while the puzzle is open ----------
    const SONGS = (window.PUZZLE_SONGS && window.PUZZLE_SONGS.length) ? window.PUZZLE_SONGS : [];
    let music = null;
    let musicFromSite = false;   // true when this game paused the site's music, so it comes back afterwards

    function startMusic() {
        if (!SONGS.length || music) return;
        if (window.siteMusic) { window.siteMusic.pause(); musicFromSite = true; }
        const src = SONGS[Math.floor(Math.random() * SONGS.length)];
        const a = new Audio(src);
        a.loop = true;
        a.volume = 0.2;
        a.onerror = () => stopMusic();     // file not added yet -> stay quiet, bring the site music back
        music = a;
        a.play().catch(() => stopMusic());
    }

    function stopMusic() {
        if (music) { music.pause(); music.onerror = null; music = null; }
        if (musicFromSite && window.siteMusic) window.siteMusic.resume();
        musicFromSite = false;
    }

    function place(id) {
        const p = posOf(id);
        const el = pieces[id];
        el.style.left = (colOf(p) * 100 / N) + '%';
        el.style.top = (rowOf(p) * 100 / N) + '%';
    }

    function renderAll() {
        for (let id = 0; id < GAP; id++) place(id);
    }

    // one button per piece; each holds the whole picture enlarged, so only its own square shows
    function build() {
        GAP = N * N - 1;
        board.innerHTML = '';
        pieces = [];
        const src = PICS[picIndex];
        const t = TEXT[lang()];
        for (let id = 0; id < GAP; id++) {
            const sr = rowOf(id), sc = colOf(id);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pz-tile';
            b.style.width = (100 / N) + '%';
            b.style.height = (100 / N) + '%';
            b.setAttribute('aria-label', t.piece + ' ' + (id + 1));

            const img = document.createElement('img');
            img.className = 'pz-img';
            img.src = src;
            img.alt = '';
            img.draggable = false;
            img.style.width = (N * 100) + '%';
            img.style.height = (N * 100) + '%';
            img.style.left = (-sc * 100) + '%';
            img.style.top = (-sr * 100) + '%';
            b.appendChild(img);

            b.addEventListener('click', () => slide(id));
            board.appendChild(b);
            pieces[id] = b;
        }
    }

    function updateHud() {
        const t = TEXT[lang()];
        movesEl.textContent = t.moves + ': ' + moves;
        timeEl.textContent = fmt(secs);
        scoreEl.textContent = t.score + ': ' + (solved ? scoreNow() : scoreNow());
    }

    function startTimer() {
        if (started) return;
        started = true;
        timer = setInterval(() => { secs++; updateHud(); }, 1000);
    }

    // solved: the score shows at once, then the result is revealed, then Play again appears with it
    function onSolved() {
        solved = true;
        clearInterval(timer);
        board.classList.add('pz-done');
        updateHud();

        const t = TEXT[lang()];
        const sc = scoreNow();
        const ratio = sc / maxScore();
        const grade = ratio >= 0.7 ? t.gExcellent : ratio >= 0.4 ? t.gGood : t.gTry;
        resLabel.textContent = t.result;
        resGrade.textContent = grade;
        resDetail.textContent = t.time + ': ' + fmt(secs) + '  ·  ' + t.moves + ': ' + moves + '  ·  ' + t.score + ': ' + sc;
        replayBtn.textContent = t.replay;

        clearTimeout(revealTimer);
        revealTimer = setTimeout(() => {
            resultEl.classList.remove('hidden');
        }, 1400);
    }

    function slide(id) {
        if (!playing || solved) return;
        const p = posOf(id), g = posOf(GAP);
        if (!isAdjacent(p, g)) return;
        swapCells(p, g);
        moves++;
        place(id);
        startTimer();
        if (isSolved()) onSolved();
        else updateHud();
    }

    // a new round: random picture, fresh pieces, random legal shuffle
    function newRound() {
        clearInterval(timer);
        clearTimeout(revealTimer);
        started = false;
        solved = false;
        moves = 0;
        secs = 0;
        board.classList.remove('pz-done');
        resultEl.classList.add('hidden');

        picIndex = pickPicture();
        build();

        do {
            grid = Array.from({ length: N * N }, (_, i) => i);
            let g = GAP, prev = -1;
            for (let k = 0; k < SHUFFLE_STEPS; k++) {
                const options = neighbours(g).filter(p => p !== prev);
                const next = options[Math.floor(Math.random() * options.length)];
                swapCells(g, next);
                prev = g;
                g = next;
            }
        } while (isSolved());

        renderAll();
        updateHud();
    }

    function onKey(e) {
        if (!playing) return;
        const g = posOf(GAP);
        let src = -1;
        if (e.key === 'ArrowUp' && rowOf(g) < N - 1) src = g + N;
        else if (e.key === 'ArrowDown' && rowOf(g) > 0) src = g - N;
        else if (e.key === 'ArrowLeft' && colOf(g) < N - 1) src = g + 1;
        else if (e.key === 'ArrowRight' && colOf(g) > 0) src = g - 1;
        else return;
        e.preventDefault();
        slide(grid[src]);
    }

    function applyText() {
        const t = TEXT[lang()];
        titleEl.textContent = t.title;
        introEl.textContent = t.intro;
        hintEl.textContent = t.hint;
        ovTitle.textContent = t.title;
        ovSub.textContent = t.ovSub;
        playBtn.textContent = t.play;
        resLabel.textContent = t.result;
        replayBtn.textContent = t.replay;
        board.setAttribute('aria-label', t.title);
        pieces.forEach((el, id) => el.setAttribute('aria-label', t.piece + ' ' + (id + 1)));
        updateHud();
    }

    // ---------- full screen (like Tania's Run on the phone): the card covers the whole screen ----------
    const fsHolder = document.createElement('div');   // keeps the page the same height while the card is away

    function enterFull() {
        if (card.classList.contains('pz-full')) return;
        fsHolder.style.height = card.offsetHeight + 'px';
        card.parentNode.insertBefore(fsHolder, card);
        document.body.appendChild(card);
        card.classList.add('pz-full');
        document.body.classList.add('pz-lock');
    }

    function exitFull() {
        if (!card.classList.contains('pz-full')) return;
        card.classList.remove('pz-full');
        document.body.classList.remove('pz-lock');
        fsHolder.parentNode.insertBefore(card, fsHolder);
        fsHolder.remove();
    }

    // PLAY: the screen goes full, then the game starts (the 3x3 / 4x4 choice appears, the music starts)
    playBtn.addEventListener('click', () => {
        enterFull();
        setTimeout(() => {
            playing = true;
            overlay.classList.add('hidden');
            sizesWrap.classList.remove('hidden');
            sizesWrap.classList.add('pz-appear');
            startMusic();
        }, 380);
    });

    exitBtn.addEventListener('click', exitFull);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') exitFull(); });

    sizeBtns.forEach(btn => btn.addEventListener('click', () => {
        const n = Number(btn.dataset.n);
        if (!n || n === N) return;
        N = n;
        sizeBtns.forEach(b => b.classList.toggle('on', b === btn));
        newRound();
    }));

    replayBtn.addEventListener('click', newRound);
    board.addEventListener('keydown', onKey);
    new MutationObserver(applyText).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // leaving the puzzle (scrolled away to the other game or off the section): stop its music
    const slideEl = document.getElementById('play-slide-puzzle');
    if (slideEl && 'IntersectionObserver' in window) {
        new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) stopMusic(); }), { threshold: 0.35 }).observe(slideEl);
    }

    applyText();
    newRound();
})();
