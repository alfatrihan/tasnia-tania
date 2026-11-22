/* Birthday countdown for Tania: every 14 February, counted on the visitor's own clock.

   - The target is local midnight at the start of 14 February. Once the local date is 15 February
     or later, the target moves to 14 February of the next year.
   - On 14 February (local date) the card is replaced by the birthday message, with a short confetti burst.
   - Dates are built with new Date(year, month, day), so leap years (29 Feb) need no special code.
   - One timer, once a second. Nothing is created per frame. Confetti is removed after it falls. */
(() => {
    'use strict';

    const section = document.getElementById('birthday');
    if (!section) return;

    const $ = id => document.getElementById(id);
    const el = {
        days: $('bd-days'),
        hours: $('bd-hours'),
        mins: $('bd-mins'),
        secs: $('bd-secs'),
        card: $('bd-card'),
        cele: $('bd-celebrate'),
        dateEn: $('bd-date-en'),
        dateBn: $('bd-date-bn'),
        confetti: $('bd-confetti')
    };

    const FEB = 1;            // JavaScript months start at 0, so February is 1
    const BDAY = 14;
    const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR;
    const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* the next 14 February from `now` (local midnight). On 15 February or later, it is next year's. */
    function nextBirthday(now) {
        const y = now.getFullYear();
        return now < new Date(y, FEB, BDAY + 1) ? new Date(y, FEB, BDAY) : new Date(y + 1, FEB, BDAY);
    }

    const isBirthdayToday = now => now.getMonth() === FEB && now.getDate() === BDAY;

    /* Bangla version of the page: write the digits as Bangla digits (০-৯) */
    const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const isBn = () => document.documentElement.lang === 'bn';
    const digits = s => (isBn() ? s.replace(/[0-9]/g, d => BN_DIGITS[d]) : s);

    /* only write a number when it changed, and restart its small ease-in animation */
    const shown = {};
    function setNum(key, raw) {
        const text = digits(raw);
        if (shown[key] === text) return;
        shown[key] = text;
        const node = el[key];
        if (!node) return;
        node.textContent = text;
        node.classList.remove('bd-tick');
        void node.offsetWidth;              // restart the animation
        node.classList.add('bd-tick');
    }

    let mode = null;                        // 'count' or 'today'
    let target = 0;                         // timestamp of the date the date line shows
    let inView = false;
    let lastBurst = 0;
    let dateDirty = false;

    /* ----- confetti ----- */
    const COLORS = ['#ee8fb5', '#ffd6e4', '#cdb4f0', '#9bb89a', '#f6b3d0', '#ffffff'];
    function burst() {
        if (reduceMotion || !el.confetti) return;
        const now = Date.now();
        if (now - lastBurst < 8000) return;  // a fresh burst at most every 8 seconds
        lastBurst = now;
        el.confetti.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 70; i++) {
            const p = document.createElement('i');
            p.className = 'bd-piece';
            p.style.left = (Math.random() * 100).toFixed(1) + '%';
            p.style.background = COLORS[i % COLORS.length];
            p.style.width = (6 + Math.random() * 5).toFixed(1) + 'px';
            p.style.height = (9 + Math.random() * 7).toFixed(1) + 'px';
            p.style.animationDelay = (Math.random() * 1.8).toFixed(2) + 's';
            p.style.animationDuration = (3 + Math.random() * 2.4).toFixed(2) + 's';
            p.style.setProperty('--dx', ((Math.random() - 0.5) * 140).toFixed(0) + 'px');
            p.style.setProperty('--rot', ((Math.random() - 0.5) * 900).toFixed(0) + 'deg');
            frag.appendChild(p);
        }
        el.confetti.appendChild(frag);
        setTimeout(() => { el.confetti.innerHTML = ''; }, 6000);
    }

    /* ----- date line, shown in the visitor's own timezone ----- */
    function updateDateLine(t) {
        if (t.getTime() === target && !dateDirty) return;
        dateDirty = false;
        target = t.getTime();
        const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        el.dateEn.textContent = 'Next birthday: ' + t.toLocaleDateString('en-GB', opts);
        // Bangla date built from Bangla names only, so no English word can slip into the Bangla line
        // (some browsers do not have Bangla date names and fall back to English)
        const BN_WEEK = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        const BN_MONTH = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
        const bnDate = BN_WEEK[t.getDay()] + ', ' + digits(String(t.getDate())) + ' ' + BN_MONTH[t.getMonth()] + ' ' + digits(String(t.getFullYear()));
        el.dateBn.textContent = 'পরবর্তী জন্মদিন: ' + bnDate;
    }

    function tick() {
        const now = new Date();

        if (isBirthdayToday(now)) {
            if (mode !== 'today') {
                mode = 'today';
                el.card.hidden = true;
                el.cele.hidden = false;
                if (inView) burst();
            }
            return;
        }

        if (mode !== 'count') {
            mode = 'count';
            el.cele.hidden = true;
            el.card.hidden = false;
            el.confetti.innerHTML = '';
        }

        const t = nextBirthday(now);
        updateDateLine(t);

        const ms = Math.max(0, t - now);
        setNum('days', String(Math.floor(ms / DAY)));
        setNum('hours', pad(Math.floor((ms % DAY) / HOUR)));
        setNum('mins', pad(Math.floor((ms % HOUR) / MIN)));
        setNum('secs', pad(Math.floor((ms % MIN) / SEC)));
    }

    const pad = n => (n < 10 ? '0' : '') + n;

    /* confetti only when the section is actually on screen */
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            entries.forEach(e => {
                inView = e.isIntersecting;
                if (inView && mode === 'today') burst();
            });
        }, { threshold: 0.25 }).observe(section);
    }

    /* ----- blur-to-reveal: one tap or click reveals the whole countdown (and the birthday message) ----- */
    const reveal = $('bd-reveal');
    if (reveal) {
        const open = () => {
            if (reveal.classList.contains('revealed')) return;
            reveal.classList.add('revealed');
            reveal.removeAttribute('role');
            reveal.removeAttribute('tabindex');
        };
        reveal.addEventListener('click', open);
        reveal.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });

    }

    /* switching English / Bangla: redraw the numbers in the new digits straight away */
    new MutationObserver(() => {
        Object.keys(shown).forEach(k => delete shown[k]);
        dateDirty = true;
        tick();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    tick();
    setInterval(tick, 1000);
})();
