/* ============================================
   ABDUL WAHAB — PORTFOLIO
   Full-viewport slideshow
   robin-noguier.com style interactions
   ============================================ */
(function () {
    'use strict';

    /* ── DOM refs ── */
    var preloader     = document.getElementById('preloader');
    var preloaderBar  = document.getElementById('preloaderBar');
    var counter       = document.getElementById('counter');
    var slidesLayer   = document.getElementById('slidesLayer');
    var slider        = document.getElementById('slider');
    var track         = document.getElementById('track');
    var slides        = Array.from(track.querySelectorAll('.slide'));
    var dotsWrap      = document.getElementById('dots');
    var bgPanels      = document.querySelectorAll('.bg-panel');
    var aboutBtn      = document.getElementById('aboutBtn');
    var aboutOverlay  = document.getElementById('aboutOverlay');
    var aboutClose    = document.getElementById('aboutClose');
    var hamburger     = document.getElementById('hamburger');
    var logoBtn       = document.getElementById('logoBtn');

    var TOTAL   = slides.length;
    var current = 0;
    var ty      = 0;       // current translateY
    var prevTy  = 0;       // translateY at drag start
    var dragging = false;
    var startY   = 0;
    var lastY    = 0;
    var lastT    = 0;
    var vel      = 0;
    var wheelLock = false;

    /* ══════════════════════════════════════
       1. PRELOADER
       ══════════════════════════════════════ */
    var t0 = Date.now();
    var LOAD_MS = 2200;

    function tickLoader() {
        var elapsed = Date.now() - t0;
        var t = Math.min(elapsed / LOAD_MS, 1);
        var val = Math.floor((1 - Math.pow(1 - t, 3)) * 100);
        counter.textContent = val;
        preloaderBar.style.height = val + '%';
        if (t < 1) requestAnimationFrame(tickLoader);
    }
    requestAnimationFrame(tickLoader);

    function dismiss() {
        var elapsed = Date.now() - t0;
        var wait = Math.max(LOAD_MS - elapsed, 0);
        setTimeout(function () {
            counter.textContent = '100';
            preloaderBar.style.height = '100%';
            setTimeout(function () {
                preloader.classList.add('done');
                setTimeout(revealHome, 500);
            }, 350);
        }, wait);
    }

    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss);

    /* ══════════════════════════════════════
       2. REVEAL HOME
       ══════════════════════════════════════ */
    function revealHome() {
        slidesLayer.classList.add('revealed');
        setTimeout(function() {
            slides[0].classList.add('active');
        }, 300);
    }

    /* ══════════════════════════════════════
       3. PAGINATION DOTS (with text labels)
       ══════════════════════════════════════ */
    (function buildDots() {
        for (var i = 0; i < TOTAL; i++) {
            // Get the project short name from the slide title
            var titleEl = slides[i].querySelector('.slide-title');
            var shortName = titleEl ? titleEl.textContent : 'Project ' + (i + 1);

            var wrapper = document.createElement('div');
            wrapper.className = 'dot-wrapper' + (i === 0 ? ' active' : '');

            var label = document.createElement('span');
            label.className = 'dot-label';
            label.textContent = shortName;

            var dot = document.createElement('button');
            dot.className = 'dot';
            dot.setAttribute('aria-label', 'Go to ' + shortName);

            wrapper.appendChild(label);
            wrapper.appendChild(dot);

            (function (idx) {
                wrapper.addEventListener('click', function () { goTo(idx); });
            })(i);

            dotsWrap.appendChild(wrapper);
        }
    })();

    /* ══════════════════════════════════════
       4. SLIDER CORE (VERTICAL)
       ══════════════════════════════════════ */
    // Slide step is 100vh (full screen)
    function vh() { return window.innerHeight; }

    function maxTy() { return -(TOTAL - 1) * vh(); }

    function setTrack(y, animate) {
        if (animate) {
            track.style.transition = 'transform 0.6s cubic-bezier(0.77, 0, 0.175, 1)';
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = 'translate3d(0,' + y + 'px,0)';
    }

    function goTo(idx) {
        idx = Math.max(0, Math.min(idx, TOTAL - 1));
        current = idx;
        ty = -idx * vh();
        prevTy = ty;
        setTrack(ty, true);
        syncUI(idx);
    }

    function syncUI(idx) {
        // dots
        var dotWrappers = dotsWrap.querySelectorAll('.dot-wrapper');
        for (var i = 0; i < dotWrappers.length; i++) {
            dotWrappers[i].classList.toggle('active', i === idx);
        }
        // bg panels
        for (var j = 0; j < bgPanels.length; j++) {
            bgPanels[j].classList.toggle('active', j === idx);
        }
        // slides (triggers text animations and peek effect scaling)
        for (var k = 0; k < slides.length; k++) {
            slides[k].classList.toggle('active', k === idx);
        }
    }

    /* ══════════════════════════════════════
       5. DRAG / TOUCH (VERTICAL)
       ══════════════════════════════════════ */
    function gy(e) {
        return e.type.indexOf('touch') !== -1 ? e.touches[0].clientY : e.clientY;
    }

    function onDown(e) {
        dragging = true;
        startY = gy(e);
        lastY  = startY;
        lastT  = Date.now();
        vel    = 0;
        slider.classList.add('dragging');
        track.style.transition = 'none';
    }

    function onMove(e) {
        if (!dragging) return;
        var y   = gy(e);
        var now = Date.now();
        var dt  = now - lastT;
        if (dt > 0) vel = (y - lastY) / dt;
        lastY = y;
        lastT = now;

        var diff = y - startY;
        var ny   = prevTy + diff;
        var my   = maxTy();

        // rubber band
        if (ny > 0)  ny *= 0.25;
        if (ny < my) ny = my + (ny - my) * 0.25;

        ty = ny;
        setTrack(ny, false);

        // live update during drag
        var nearIdx = Math.round(Math.abs(ny) / vh());
        nearIdx = Math.max(0, Math.min(nearIdx, TOTAL - 1));
        if (nearIdx !== current) { current = nearIdx; syncUI(nearIdx); }
    }

    function onUp() {
        if (!dragging) return;
        dragging = false;
        slider.classList.remove('dragging');

        var momentum  = vel * 200;
        var projected = ty + momentum;
        var target    = Math.round(Math.abs(projected) / vh());
        target = Math.max(0, Math.min(target, TOTAL - 1));

        prevTy = ty;
        goTo(target);
    }

    /* Attach drag events */
    slider.addEventListener('mousedown', function (e) {
        // Prevent default only if not clicking a link
        if (e.target.tagName.toLowerCase() !== 'a' && e.target.tagName.toLowerCase() !== 'svg') {
            e.preventDefault();
        }
        onDown(e);
    });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    slider.addEventListener('touchstart', onDown, { passive: true });
    slider.addEventListener('touchmove', onMove, { passive: false });
    slider.addEventListener('touchend', onUp);

    /* Prevent accidental link clicks during drag */
    slider.addEventListener('click', function (e) {
        if (Math.abs(ty - prevTy) > 8) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    /* ══════════════════════════════════════
       6. MOUSE WHEEL / TRACKPAD SCROLL
       ══════════════════════════════════════ */
    var wheelAccum = 0;
    var wheelTimer = null;
    var WHEEL_THRESHOLD = 60;

    window.addEventListener('wheel', function (e) {
        // Don't intercept if about overlay is open
        if (aboutOverlay.classList.contains('open')) return;

        e.preventDefault();

        // Use deltaY (vertical scroll) OR deltaX (horizontal scroll)
        var delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

        wheelAccum += delta;

        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () { wheelAccum = 0; }, 200);

        if (wheelLock) return;

        if (wheelAccum > WHEEL_THRESHOLD) {
            wheelLock = true;
            wheelAccum = 0;
            goTo(current + 1);
            setTimeout(function () { wheelLock = false; }, 700);
        } else if (wheelAccum < -WHEEL_THRESHOLD) {
            wheelLock = true;
            wheelAccum = 0;
            goTo(current - 1);
            setTimeout(function () { wheelLock = false; }, 700);
        }
    }, { passive: false });

    /* ══════════════════════════════════════
       7. KEYBOARD
       ══════════════════════════════════════ */
    document.addEventListener('keydown', function (e) {
        if (aboutOverlay.classList.contains('open')) {
            if (e.key === 'Escape') aboutOverlay.classList.remove('open');
            return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(current - 1);
    });

    /* ══════════════════════════════════════
       8. RESIZE
       ══════════════════════════════════════ */
    var rAF;
    window.addEventListener('resize', function () {
        cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(function () { goTo(current); });
    });

    /* ══════════════════════════════════════
       9. ABOUT OVERLAY
       ══════════════════════════════════════ */
    aboutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        aboutOverlay.classList.add('open');
    });

    aboutClose.addEventListener('click', function () {
        aboutOverlay.classList.remove('open');
    });

    /* ══════════════════════════════════════
       10. HAMBURGER (mobile)
       ══════════════════════════════════════ */
    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('open');
        if (hamburger.classList.contains('open')) {
            aboutOverlay.classList.add('open');
        } else {
            aboutOverlay.classList.remove('open');
        }
    });

    /* ══════════════════════════════════════
       11. LOGO → first slide
       ══════════════════════════════════════ */
    logoBtn.addEventListener('click', function (e) {
        e.preventDefault();
        aboutOverlay.classList.remove('open');
        hamburger.classList.remove('open');
        goTo(0);
    });

})();
