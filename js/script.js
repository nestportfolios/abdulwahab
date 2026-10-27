/* ============================================
   NEST PORTFOLIOS
   Full-viewport slideshow
   robin-noguier.com style interactions
   With Category Filtering & Contact Arrow Engine
   ============================================ */
(function () {
    'use strict';

    /* ── DOM refs ── */
    var preloader       = document.getElementById('preloader');
    var preloaderBar    = document.getElementById('preloaderBar');
    var counter         = document.getElementById('counter');
    var slidesLayer     = document.getElementById('slidesLayer');
    var slider          = document.getElementById('slider');
    var track           = document.getElementById('track');
    var allSlides       = Array.from(track.querySelectorAll('.slide'));
    var dotsWrap        = document.getElementById('dots');
    var allBgPanels     = Array.from(document.querySelectorAll('.bg-panel'));
    var hamburger       = document.getElementById('hamburger');
    var mobileNavDrawer = document.getElementById('mobileNavDrawer');
    var logoBtn         = document.getElementById('logoBtn');
    var activeFilterBadge = document.getElementById('activeFilterBadge');
    var activeFilterName  = document.getElementById('activeFilterName');
    var clearFilterBtn   = document.getElementById('clearFilterBtn');
    var flipMockups     = Array.from(document.querySelectorAll('.mockup.has-flip'));

    /* ── Category Filtering State ── */
    var activeCategory  = 'all';
    var visibleSlides   = allSlides.slice();
    var visibleBgPanels = allBgPanels.slice();
    var TOTAL           = visibleSlides.length;
    var current         = 0;
    var ty              = 0;       // current translateY
    var prevTy          = 0;       // translateY at drag start
    var dragging        = false;
    var startY          = 0;
    var lastY           = 0;
    var lastT           = 0;
    var vel             = 0;
    var wheelLock       = false;

    /* ══════════════════════════════════════
       0. CSS VARIABLE SYNC
       ══════════════════════════════════════ */
    function setVh() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    setVh();
    window.addEventListener('resize', setVh);

    /* ══════════════════════════════════════
       1. PRELOADER
       ══════════════════════════════════════ */
    if (!preloader) {
        revealHome();
    } else {
        var t0 = Date.now();
        var LOAD_MS = 650;

        function tickLoader() {
            var elapsed = Date.now() - t0;
            var t = Math.min(elapsed / LOAD_MS, 1);
            var val = Math.floor((1 - Math.pow(1 - t, 3)) * 100);
            if (counter) counter.textContent = val + '%';
            if (preloaderBar) preloaderBar.style.width = val + '%';
            if (t < 1) requestAnimationFrame(tickLoader);
        }
        requestAnimationFrame(tickLoader);

        function dismiss() {
            var elapsed = Date.now() - t0;
            var wait = Math.max(LOAD_MS - elapsed, 0);
            setTimeout(function () {
                if (counter) counter.textContent = '100%';
                if (preloaderBar) preloaderBar.style.width = '100%';
                setTimeout(function () {
                    preloader.classList.add('done');
                    setTimeout(revealHome, 400);
                }, 120);
            }, wait);
        }

        if (document.readyState === 'complete') dismiss();
        else window.addEventListener('load', dismiss);
    }

    /* ══════════════════════════════════════
       2. REVEAL HOME
       ══════════════════════════════════════ */
    function revealHome() {
        slidesLayer.classList.add('revealed');
        setTimeout(function () {
            if (visibleSlides[0]) visibleSlides[0].classList.add('active');
        }, 300);
    }

    /* ══════════════════════════════════════
       3. PAGINATION DOTS (with text labels)
       ══════════════════════════════════════ */
    function buildDots() {
        dotsWrap.innerHTML = '';
        for (var i = 0; i < TOTAL; i++) {
            var titleEl = visibleSlides[i].querySelector('.slide-title');
            var shortName = titleEl ? titleEl.textContent.trim() : 'Project ' + (i + 1);

            var wrapper = document.createElement('div');
            wrapper.className = 'dot-wrapper' + (i === current ? ' active' : '');

            var label = document.createElement('span');
            label.className = 'dot-label';
            label.textContent = shortName;

            var dot = document.createElement('button');
            dot.className = 'dot';
            dot.setAttribute('aria-label', 'Go to ' + shortName);

            wrapper.appendChild(label);
            wrapper.appendChild(dot);

            (function (targetIdx) {
                wrapper.addEventListener('click', function () { goTo(targetIdx); });
            })(i);

            dotsWrap.appendChild(wrapper);
        }
    }
    buildDots();

    /* ══════════════════════════════════════
       4. SLIDER CORE (VERTICAL)
       ══════════════════════════════════════ */
    function vh() {
        if (window.matchMedia('(max-width: 480px)').matches) {
            return window.innerHeight * 0.50;
        } else if (window.matchMedia('(max-width: 768px)').matches) {
            return window.innerHeight * 0.52;
        } else {
            return window.innerHeight * 0.70;
        }
    }

    function maxTy() {
        return TOTAL > 0 ? -(TOTAL - 1) * vh() : 0;
    }

    function setTrack(y, animate) {
        if (animate) {
            track.style.transition = 'transform 0.6s cubic-bezier(0.77, 0, 0.175, 1)';
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = 'translate3d(0,' + y + 'px,0)';
    }

    function goTo(idx) {
        if (TOTAL === 0) return;
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
        for (var j = 0; j < visibleBgPanels.length; j++) {
            visibleBgPanels[j].classList.toggle('active', j === idx);
        }
        // slides (triggers text animations and peek effect scaling)
        for (var k = 0; k < visibleSlides.length; k++) {
            visibleSlides[k].classList.toggle('active', k === idx);
        }
        // reset card flips when slide changes
        for (var f = 0; f < flipMockups.length; f++) {
            flipMockups[f].classList.remove('is-flipped');
        }
    }

    /* ══════════════════════════════════════
       5. CATEGORY FILTERING ENGINE
       ══════════════════════════════════════ */
    var catLabels = {
        'all': 'All Work',
        'personal': 'Personal Ready (1)',
        'job-ready': 'Job Ready (5)',
        'business-ready': 'Business Ready (6)',
        'high-paid': 'High Paid (1)'
    };

    function filterCategory(targetCat) {
        if (targetCat === activeCategory && targetCat !== 'all') {
            // Toggling active category resets back to all
            targetCat = 'all';
        }
        activeCategory = targetCat;

        // 1. Sync About overlay category cards & chips
        var aboutCards = document.querySelectorAll('.about-cat-card[data-filter], .about-chip[data-filter]');
        aboutCards.forEach(function (card) {
            card.classList.toggle('active', card.getAttribute('data-filter') === activeCategory);
        });

        // 2. Sync Active Filter Badge in Top Bar
        if (activeFilterBadge && activeFilterName) {
            if (activeCategory === 'all') {
                activeFilterBadge.style.display = 'none';
            } else {
                activeFilterName.textContent = catLabels[activeCategory] || activeCategory;
                activeFilterBadge.style.display = 'inline-flex';
            }
        }

        // 3. Filter visible slides and bg panels
        if (activeCategory === 'all') {
            visibleSlides = allSlides.slice();
            visibleBgPanels = allBgPanels.slice();
        } else {
            visibleSlides = allSlides.filter(function (slide) {
                var catAttr = slide.getAttribute('data-category') || '';
                return catAttr.indexOf(activeCategory) !== -1;
            });
            visibleBgPanels = allBgPanels.filter(function (panel) {
                var catAttr = panel.getAttribute('data-category') || '';
                return catAttr.indexOf(activeCategory) !== -1;
            });
        }

        // 4. Update slide elements visibility in DOM
        allSlides.forEach(function (slide) {
            var isVisible = visibleSlides.indexOf(slide) !== -1;
            slide.classList.toggle('slide--filtered-out', !isVisible);
        });

        // 5. Update background panels visibility in DOM
        allBgPanels.forEach(function (panel) {
            var isVisible = visibleBgPanels.indexOf(panel) !== -1;
            panel.classList.toggle('bg--filtered-out', !isVisible);
        });

        // 6. Update TOTAL and pagination dots
        TOTAL = visibleSlides.length;
        buildDots();

        // 7. Reset slider position to first visible project with smooth transition
        goTo(0);
    }

    // Check URL query parameters (e.g. index.html?filter=job-ready from About page)
    try {
        var urlParams = new URLSearchParams(window.location.search);
        var initialFilter = urlParams.get('filter');
        if (initialFilter && catLabels[initialFilter]) {
            filterCategory(initialFilter);
        }
    } catch (err) { /* ignore */ }

    // Clear filter button in top bar badge
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            filterCategory('all');
        });
    }

    /* ══════════════════════════════════════
       6. DRAG / TOUCH (VERTICAL)
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
        if (e.cancelable) e.preventDefault();

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

        var diff = lastY - startY;
        var step = vh();
        var target = current;

        // Intuitive swipe threshold: 40px drag or velocity flick
        if (diff < -40 || vel < -0.25) {
            target = current + 1;
        } else if (diff > 40 || vel > 0.25) {
            target = current - 1;
        } else {
            var momentum  = vel * 150;
            var projected = ty + momentum;
            target = Math.round(Math.abs(projected) / step);
        }

        target = Math.max(0, Math.min(target, TOTAL - 1));
        goTo(target);
    }

    /* Attach drag events */
    slider.addEventListener('mousedown', function (e) {
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
       7. MOUSE WHEEL / TRACKPAD SCROLL
       ══════════════════════════════════════ */
    var wheelAccum = 0;
    var wheelTimer = null;
    var WHEEL_THRESHOLD = 60;

    window.addEventListener('wheel', function (e) {
        // Don't intercept if mobile nav drawer is open
        if (mobileNavDrawer && mobileNavDrawer.classList.contains('open')) return;

        e.preventDefault();

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
       8. KEYBOARD
       ══════════════════════════════════════ */
    document.addEventListener('keydown', function (e) {
        if (mobileNavDrawer && mobileNavDrawer.classList.contains('open')) {
            if (e.key === 'Escape') {
                mobileNavDrawer.classList.remove('open');
                if (hamburger) hamburger.classList.remove('open');
            }
            return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(current - 1);
    });

    /* ══════════════════════════════════════
       9. RESIZE
       ══════════════════════════════════════ */
    var rAF;
    window.addEventListener('resize', function () {
        cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(function () {
            goTo(current);
            if (arrowAnimActive) updateArrowPathGeometry();
        });
    });

    /* ══════════════════════════════════════
       10. MOBILE NAV DRAWER
       ══════════════════════════════════════ */
    if (hamburger && mobileNavDrawer) {
        hamburger.addEventListener('click', function () {
            var isOpen = hamburger.classList.toggle('open');
            mobileNavDrawer.classList.toggle('open', isOpen);
            mobileNavDrawer.setAttribute('aria-hidden', !isOpen);
        });

        mobileNavDrawer.addEventListener('click', function (e) {
            if (e.target.tagName.toLowerCase() === 'a') {
                hamburger.classList.remove('open');
                mobileNavDrawer.classList.remove('open');
            }
        });
    }

    /* ══════════════════════════════════════
       11. LOGO → reset to all + first slide
       ══════════════════════════════════════ */
    if (logoBtn) {
        logoBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
            if (hamburger) hamburger.classList.remove('open');
            filterCategory('all');
            goTo(0);
        });
    }

    /* ══════════════════════════════════════
       13. CARD FLIP (TOUCH / CLICK TOGGLE)
       ══════════════════════════════════════ */
    flipMockups.forEach(function (m) {
        m.addEventListener('click', function (e) {
            // Ignore if user was dragging the slider
            if (Math.abs(ty - prevTy) > 8) return;
            m.classList.toggle('is-flipped');
        });
    });



})();
