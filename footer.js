/* Footer: the thank-you words light up one by one as the footer comes into view,
   then the Developer Info button rises in. The footer sits in normal page flow and
   scrolls with the rest of the site (no pinned screen). */
(() => {
    const track = document.getElementById('footer-track');
    const words = document.getElementById('footerWords');
    const devWrap = document.getElementById('devTriggerWrap');
    if (!track || !words || !devWrap) return;

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    words.innerHTML = words.textContent.trim().split(/\s+/)
        .map(w => '<span class="w">' + w + ' </span>').join('');
    const spans = words.children;           // live list: still correct after the language switch

    let lastE = -1;

    function frame() {
        // 0 when the footer is just reaching the bottom of the screen, 1 once it is well up the screen
        const top = track.getBoundingClientRect().top;
        const vis = clamp((innerHeight - top) / (innerHeight * 0.9));

        // updated every frame: the Bangla version replaces the word spans on a language switch,
        // so the lit state must not be cached
        const n = Math.round(spans.length * vis);
        for (let i = 0; i < spans.length; i++) spans[i].classList.toggle('lit', i < n);

        // the button rises in after the words have started to light
        const bp = clamp((vis - 0.45) / 0.4);
        const e = 1 - Math.pow(1 - bp, 3);
        if (e !== lastE) {
            lastE = e;
            devWrap.style.opacity = e.toFixed(3);
            devWrap.style.transform = 'translateY(' + ((1 - e) * 22).toFixed(1) + 'px)';
            devWrap.style.pointerEvents = bp > 0.5 ? 'auto' : 'none';
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
