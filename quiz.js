/* "How well do you know her?" quiz, shown as photo-style cards.
   Pick an answer, press Submit: the card flips away and the next one comes up. Marks are counted silently
   and the result comes after the last question. Replace the placeholders in BANK. a = index of the correct option (0-3). */
(() => {
    const box = document.getElementById('quiz-box');
    if (!box) return;

    // ---------- question bank (placeholders for now) ----------
    const BANK = Array.from({ length: 15 }, (_, k) => ({
        q: { en: 'Placeholder question ' + (k + 1), bn: 'প্লেসহোল্ডার প্রশ্ন ' + (k + 1) },
        o: [
            { en: 'Option A', bn: 'অপশন ক' },
            { en: 'Option B', bn: 'অপশন খ' },
            { en: 'Option C', bn: 'অপশন গ' },
            { en: 'Option D', bn: 'অপশন ঘ' }
        ],
        a: 0
    }));
    const COUNT = 15;

    const T = {
        en: { title: 'How well do you know her?', intro: 'Answer 15 random questions and find out how well you know Tania.',
              start: 'Start', submit: 'Submit', replay: 'Play again', right: 'correct answers',
              hi: 'You really know me!',
              mid: 'You know me quite well, but there is still more to learn about me.',
              low: 'No, you do not know me that well yet!' },
        bn: { title: 'তাকে তুমি কতটা চেনো?', intro: 'এলোমেলো ১৫টি প্রশ্নের উত্তর দাও, দেখো তানিয়াকে তুমি কতটা চেনো।',
              start: 'শুরু করো', submit: 'সাবমিট', replay: 'আবার খেলো', right: 'সঠিক উত্তর',
              hi: 'তুমি সত্যিই আমাকে চেনো!',
              mid: 'তুমি আমাকে বেশ ভালো চেনো, তবে আমার সম্পর্কে আরও কিছু জানার বাকি আছে।',
              low: 'না, তুমি আমাকে এখনো ততটা চেনো না!' }
    };
    const lang = () => (document.documentElement.lang === 'bn' ? 'bn' : 'en');

    let qs = [], idx = 0, score = 0, picked = -1, view = 'intro', busy = false;

    function shuffle(a) {
        a = a.slice();
        for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; }
        return a;
    }
    function start() {
        qs = shuffle(BANK).slice(0, Math.min(COUNT, BANK.length));
        idx = 0; score = 0; picked = -1; view = 'q'; busy = false;
        render(false);
    }
    function countPct(target) {
        const el = document.getElementById('qz-pct');
        if (!el) return;
        const t0 = performance.now();
        const step = now => {
            const k = Math.min(1, (now - t0) / 1200);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // enter = true when a new question card should flip in
    function render(enter) {
        const L = T[lang()], n = qs.length;
        let card = '', hasNext = false;
        if (view === 'intro') {
            box.innerHTML = '<h2 class="qz-title">' + L.title + '</h2>' +
                '<p class="qz-intro">' + L.intro + '</p>' +
                '<div class="qz-center"><button type="button" class="qz-btn" data-act="start">' + L.start + '</button></div>';
            return;
        }
        if (view === 'q') {
            const Q = qs[idx];
            hasNext = idx + 1 < n;
            card = '<div class="qz-top"><span class="qz-count">' + (idx + 1) + ' / ' + n + '</span>' +
                '<div class="qz-bar"><i style="width:' + (idx / n * 100) + '%"></i></div></div>' +
                '<p class="qz-q">' + Q.q[lang()] + '</p>' +
                '<div class="qz-opts">' + Q.o.map((o, k) =>
                    '<button type="button" class="qz-opt' + (k === picked ? ' sel' : '') + '" data-act="pick" data-k="' + k + '">' +
                    '<span class="qz-tick"></span><span>' + o[lang()] + '</span></button>').join('') + '</div>' +
                '<div class="qz-foot"><button type="button" class="qz-btn" data-act="submit"' + (picked < 0 ? ' disabled' : '') + '>' + L.submit + '</button></div>';
        } else {
            const pct = Math.round(score / n * 100);
            const msg = pct >= 80 ? L.hi : pct >= 50 ? L.mid : L.low;
            card = '<div class="qz-end">' +
                '<div class="qz-tania"><svg viewBox="0 0 64 40" class="qz-lotus"><use href="#lotus"/></svg></div>' +
                '<div class="qz-bubble">' + msg + '</div>' +
                '<div class="qz-pct"><b id="qz-pct">0</b>%</div>' +
                '<p class="qz-sub">' + score + ' / ' + n + ' ' + L.right + '</p>' +
                '<button type="button" class="qz-btn" data-act="start">' + L.replay + '</button></div>';
        }
        box.innerHTML = '<h2 class="qz-title">' + L.title + '</h2>' +
            '<div class="qz-stack' + (hasNext ? ' more' : '') + '">' +
            '<div class="qz-card' + (enter ? ' enter' : '') + '">' + card + '</div></div>';
        if (view === 'end') countPct(Math.round(score / n * 100));
    }

    box.addEventListener('click', e => {
        const el = e.target.closest('[data-act]');
        if (!el || el.disabled || busy) return;
        const act = el.dataset.act;
        if (act === 'start') start();
        else if (act === 'pick') { picked = +el.dataset.k; render(false); }
        else if (act === 'submit') {
            if (picked < 0) return;
            busy = true;
            if (picked === qs[idx].a) score++;
            const card = box.querySelector('.qz-card');
            if (card) card.classList.add('flip-out');        // flip away, then the next page comes
            setTimeout(() => {
                busy = false;
                if (idx + 1 < qs.length) { idx++; picked = -1; render(true); }
                else { view = 'end'; render(false); }
            }, 480);
        }
    });

    // switch language with the site's EN / বাংলা button
    new MutationObserver(() => { if (view !== 'end') render(false); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render(false);
})();
