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
    const sizeBtns = Array.from(document.querySelectorAll('.pz-size'));
    const movesEl = document.getElementById('pz-moves-n');
    const timeEl = document.getElementById('pz-time-n');
    const scoreEl = document.getElementById('pz-score-n');
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
            hint: 'Tap or drag a piece into the gap, or use the arrow keys',
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
            piece: 'Piece',
            peek: 'Preview picture'
        },
        bn: {
            title: 'তানিয়াকে সোজা করো',
            intro: 'টুকরোগুলো আবার জায়গামতো সাজান, তাহলেই পুরো ছবিটা দেখা যাবে।',
            hint: 'টুকরোতে ট্যাপ করুন বা টেনে ফাঁকায় নিন, বা অ্যারো কী ব্যবহার করুন',
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
            piece: 'টুকরো',
            peek: 'ছবিটা একবার দেখো'
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

    // ---------- one-time picture reveal ----------
    // The eye button shows the whole picture for a few seconds. It works once per round
    // (a new round = new shuffle, Play again, or a size change), and only while the puzzle is being played.
    const PEEK_MS = 2500;
    const peekBtn = document.getElementById('pz-peek');
    const peekImg = document.createElement('img');
    peekImg.className = 'pz-peek-img';
    peekImg.alt = '';
    peekImg.draggable = false;
    let peekUsed = false, peekTimer = 0;
    peekImg.addEventListener('click', hidePeek);      // tap the picture to close it early
    if (peekBtn) peekBtn.addEventListener('click', showPeek);

    function refreshPeek() {
        if (!peekBtn) return;
        peekBtn.disabled = !(playing && !solved && !peekUsed);
        peekBtn.classList.toggle('used', peekUsed);
    }
    function showPeek() {
        if (!peekBtn || peekBtn.disabled) return;
        peekUsed = true;
        peekImg.classList.add('show');
        peekBtn.classList.add('open');
        clearTimeout(peekTimer);
        peekTimer = setTimeout(hidePeek, PEEK_MS);
        refreshPeek();
    }
    // ---------- Tania the helper: pops in on PLAY, leaves after the first move (or after HELP_MS) ----------
    const HELP_MS = 8000;
    const helpEl = document.getElementById('pz-help');
    const helpImg = document.getElementById('pz-help-img');
    let helpTimer = 0;
    if (helpImg) helpImg.addEventListener('error', () => helpImg.classList.add('missing'));   // picture not added yet -> bubble only
    function showHelp() {
        if (!helpEl) return;
        helpEl.classList.add('show');
        clearTimeout(helpTimer);
        helpTimer = setTimeout(hideHelp, HELP_MS);
    }
    function hideHelp() {
        clearTimeout(helpTimer);
        if (helpEl) helpEl.classList.remove('show');
    }

    function hidePeek() {
        clearTimeout(peekTimer);
        peekImg.classList.remove('show');
        if (peekBtn) peekBtn.classList.remove('open');
        refreshPeek();
    }

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

            b.addEventListener('click', e => { if (e.detail === 0) slideLine(id); });   // keyboard (Enter / Space)
            attachDrag(b, id);
            board.appendChild(b);
            pieces[id] = b;
        }
        peekImg.src = src;
        board.appendChild(peekImg);
    }

    function updateHud() {
        const t = TEXT[lang()];
        movesEl.textContent = moves;
        timeEl.textContent = fmt(secs);
        scoreEl.textContent = scoreNow();
        refreshPeek();
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
        }, 500);
    }

    function slide(id) {
        if (!playing || solved) return;
        const p = posOf(id), g = posOf(GAP);
        if (!isAdjacent(p, g)) return;
        swapCells(p, g);
        moves++;
        place(id);
        startTimer();
        hideHelp();                      // the helper has said her line; she steps aside once the game starts
        if (isSolved()) onSolved();
        else updateHud();
    }


    // ---------- touch / mouse: tap a piece, or drag it into the gap ----------
    // A piece next to the gap follows the finger and snaps in when pulled far enough (or on a tap).
    // Tapping a piece in the same row / column as the gap slides the whole line, like a real sliding puzzle.
    function slideLine(id) {
        if (!playing || solved) return;
        const p = posOf(id), g = posOf(GAP);
        if (isAdjacent(p, g)) { slide(id); return; }
        if (rowOf(p) === rowOf(g)) {
            const step = colOf(p) < colOf(g) ? 1 : -1;
            for (let q = g - step; ; q -= step) { slide(grid[q]); if (q === p) break; }
        } else if (colOf(p) === colOf(g)) {
            const step = rowOf(p) < rowOf(g) ? N : -N;
            for (let q = g - step; ; q -= step) { slide(grid[q]); if (q === p) break; }
        }
    }

    function attachDrag(el, id) {
        let sx = 0, sy = 0, dx = 0, dy = 0, active = false, moved = false, axis = null, dir = 0, cell = 1;
        el.addEventListener('pointerdown', e => {
            if (!playing || solved || (e.pointerType === 'mouse' && e.button !== 0)) return;
            const p = posOf(id), g = posOf(GAP);
            active = true; moved = false; dx = dy = 0; axis = null;
            sx = e.clientX; sy = e.clientY;
            cell = board.getBoundingClientRect().width / N;
            if (isAdjacent(p, g)) {
                axis = rowOf(p) === rowOf(g) ? 'x' : 'y';
                dir = axis === 'x' ? (colOf(g) - colOf(p)) : (rowOf(g) - rowOf(p));   // +1 / -1
            }
            try { el.setPointerCapture(e.pointerId); } catch (_) {}
        });
        el.addEventListener('pointermove', e => {
            if (!active) return;
            const mx = e.clientX - sx, my = e.clientY - sy;
            if (Math.abs(mx) + Math.abs(my) > 6) moved = true;
            if (!axis) return;
            let d = (axis === 'x' ? mx : my) * dir;      // only toward the gap counts
            d = Math.max(0, Math.min(cell, d));
            el.classList.add('pz-drag');
            el.style.transition = 'none';
            el.style.transform = axis === 'x' ? 'translateX(' + (d * dir) + 'px)' : 'translateY(' + (d * dir) + 'px)';
            el._d = d;
            e.preventDefault();
        });
        const end = e => {
            if (!active) return;
            active = false;
            try { el.releasePointerCapture(e.pointerId); } catch (_) {}
            const d = el._d || 0; el._d = 0;
            el.classList.remove('pz-drag');
            el.style.transition = '';
            el.style.transform = '';
            if (e.type === 'pointercancel') return;
            if (!moved) { slideLine(id); return; }                 // a tap
            if (axis && d > cell * 0.3) slide(id);                 // dragged far enough
        };
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
    }

    // a swipe anywhere on the board moves the piece that sits on the far side of the gap
    (function swipeBoard() {
        let sx = 0, sy = 0, on = false;
        board.addEventListener('pointerdown', e => { if (e.target === board) { on = true; sx = e.clientX; sy = e.clientY; } });
        board.addEventListener('pointerup', e => {
            if (!on) return; on = false;
            const mx = e.clientX - sx, my = e.clientY - sy;
            if (Math.max(Math.abs(mx), Math.abs(my)) < 24 || !playing || solved) return;
            const g = posOf(GAP); let src = -1;
            if (Math.abs(mx) > Math.abs(my)) { if (mx < 0 && colOf(g) < N - 1) src = g + 1; else if (mx > 0 && colOf(g) > 0) src = g - 1; }
            else { if (my < 0 && rowOf(g) < N - 1) src = g + N; else if (my > 0 && rowOf(g) > 0) src = g - N; }
            if (src >= 0) slide(grid[src]);
        });
    })();

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

        hidePeek();
        hideHelp();
        peekUsed = false;                // the reveal comes back for every new round
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
        if (peekBtn) { peekBtn.title = t.peek; peekBtn.setAttribute('aria-label', t.peek); }
        board.setAttribute('aria-label', t.title);
        pieces.forEach((el, id) => el.setAttribute('aria-label', t.piece + ' ' + (id + 1)));
        updateHud();
    }

    // ---------- full screen (same as Tania's Run) ----------
    // PLAY, or the Full screen button, opens the whole phone screen. Exit full screen, Escape or the
    // browser's back closes it: the page comes back where it was, and the game goes back to its start screen.
    const fsHolder = document.createElement('div');   // keeps the page the same height while the card is away
    const fsBtn = document.getElementById('pz-fs');
    const FS_TXT = { en: ['Full screen', 'Exit full screen'], bn: ['ফুল স্ক্রিন', 'ফুল স্ক্রিন থেকে বের হও'] };
    const isFull = () => card.classList.contains('pz-full');
    let savedY = 0;

    function updateFsBtn() {
        if (!fsBtn) return;
        const t = FS_TXT[lang()] || FS_TXT.en;
        const shrink = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
        const grow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
        fsBtn.innerHTML = (isFull() ? shrink : grow) + '<span class="pz-fs-txt"></span>';
        fsBtn.querySelector('.pz-fs-txt').textContent = isFull() ? t[1] : t[0];
        fsBtn.title = isFull() ? t[1] : t[0];
        fsBtn.setAttribute('aria-label', fsBtn.title);
    }

    function enterFull() {
        if (isFull()) return;
        savedY = window.scrollY;
        fsHolder.style.height = card.offsetHeight + 'px';
        card.parentNode.insertBefore(fsHolder, card);
        document.body.appendChild(card);
        card.classList.add('pz-full');
        document.body.classList.add('pz-lock');
        if (card.requestFullscreen) card.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
        updateFsBtn();
    }

    // back to the start screen: the game and its music stop, the board is shuffled and waits for PLAY
    function resetToStart() {
        clearInterval(timer);
        clearTimeout(revealTimer);
        playing = false; started = false; solved = false;
        stopMusic();
        overlay.classList.remove('hidden');
        sizesWrap.classList.add('hidden');
        sizesWrap.classList.remove('pz-appear');
        resultEl.classList.add('hidden');
        newRound();
        applyText();
    }

    function exitFull() {
        if (!isFull()) return;
        card.classList.remove('pz-full');
        document.body.classList.remove('pz-lock');
        fsHolder.parentNode.insertBefore(card, fsHolder);
        fsHolder.remove();
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
        window.scrollTo({ top: savedY, behavior: 'instant' });
        resetToStart();
        updateFsBtn();
    }

    // PLAY: the screen goes full, then the game starts (the 3x3 / 4x4 choice appears, the music starts)
    playBtn.addEventListener('click', () => {
        if (!isFull()) enterFull();   // PLAY goes full screen at once; the Exit full screen button appears at the bottom
        setTimeout(() => {
            playing = true;
            refreshPeek();
            showHelp();
            overlay.classList.add('hidden');
            sizesWrap.classList.remove('hidden');
            sizesWrap.classList.add('pz-appear');
            startMusic();
        }, 380);
    });

    if (fsBtn) fsBtn.addEventListener('click', () => (isFull() ? exitFull() : enterFull()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') exitFull(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) exitFull(); });

    sizeBtns.forEach(btn => btn.addEventListener('click', () => {
        const n = Number(btn.dataset.n);
        if (!n || n === N) return;
        N = n;
        sizeBtns.forEach(b => b.classList.toggle('on', b === btn));
        newRound();
    }));

    replayBtn.addEventListener('click', newRound);
    board.addEventListener('keydown', onKey);
    new MutationObserver(() => { applyText(); updateFsBtn(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // leaving the puzzle (scrolled away to the other game or off the section): stop its music
    const slideEl = document.getElementById('play-slide-puzzle');
    if (slideEl && 'IntersectionObserver' in window) {
        new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) stopMusic(); }), { threshold: 0.35 }).observe(slideEl);
    }

    applyText();
    updateFsBtn();
    newRound();
})();
