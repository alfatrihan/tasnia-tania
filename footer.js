/* Scroll-driven footer.
   #footer-track is a tall block holding one sticky, full-screen panel. While the visitor scrolls through
   the track the panel stays pinned: first the thank-you words light up one by one, then the
   Developer Info button rises into view. Nothing else shares the screen meanwhile. */
(() => {
    const track = document.getElementById('footer-track');
    const words = document.getElementById('footerWords');
    const devWrap = document.getElementById('devTriggerWrap');
    if (!track || !words || !devWrap) return;

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const splitWords = () => {
        words.innerHTML = words.textContent.trim().split(/\s+/)
            .map(w => '<span class="w">' + w + ' </span>').join('');
    };
    splitWords();
    const spans = words.children;           // live list: still correct after the language switch

    const WORDS_END = 0.55;                  // the words light up over the first 55% of the scroll
    const BTN_START = 0.2;                   // the button starts rising while the words are still lighting
    const BTN_END = 0.45;                    // and is fully in place by then
    let last = -1;

    function frame() {
        const total = Math.max(1, track.offsetHeight - innerHeight);
        const p = clamp(-track.getBoundingClientRect().top / total);

        if (p !== last) {
            last = p;
            track.style.setProperty('--fp', p.toFixed(3));

            const n = spans.length * clamp(p / WORDS_END);
            for (let i = 0; i < spans.length; i++) spans[i].classList.toggle('lit', i < n);

            const bp = clamp((p - BTN_START) / (BTN_END - BTN_START));
            const e = 1 - Math.pow(1 - bp, 3);
            devWrap.style.opacity = e.toFixed(3);
            devWrap.style.transform = 'translateY(' + ((1 - e) * 22).toFixed(1) + 'px)';
            devWrap.style.pointerEvents = bp > 0.5 ? 'auto' : 'none';
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // keyboard users: tabbing onto the button jumps the footer to its end, so the button is fully visible
    devWrap.addEventListener('focusin', () => {
        const total = track.offsetHeight - innerHeight;
        const top = track.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top + total, behavior: 'smooth' });
    });
})();
