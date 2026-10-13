/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HERO 3D SEQUENCE ANIMATION ENGINE
 * Abdul Wahab Portfolio — Hero Section Dynamic Background
 * Features:
 *   - 100-frame high-fidelity 3D isometric tech sequence from assets/home/
 *   - Hardware-accelerated HTML5 Canvas with HiDPI / Retina auto-scaling
 *   - Aspect-ratio cover math tuned to focus on the 3D screens on the right
 *   - Progressive asynchronous preloader with instant first-frame render
 *   - Smooth ping-pong (breathing forward & reverse) playback
 *   - Battery & GPU conscious: pauses via IntersectionObserver when offscreen
 *   - Tab-visibility detection (pauses when tab is inactive)
 *   - Graceful fallback with cross-fade from static poster
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    var TOTAL_FRAMES = 100;
    var FPS = 24;
    var FRAME_INTERVAL = 1000 / FPS;
    var PAUSE_AT_ENDS_FRAMES = 8; // Brief breathing pause at frame 1 and 100

    var canvas = document.getElementById('heroSequenceCanvas');
    if (!canvas) return;

    var backdrop = canvas.closest('.about-hero-bg-backdrop') || canvas.parentElement;
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Check prefers-reduced-motion
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Frame cache
    var frames = new Array(TOTAL_FRAMES + 1);
    var loadedCount = 0;
    var currentFrame = 1;
    var direction = 1; // 1 = forward, -1 = reverse
    var pauseCounter = 0;
    var isPlaying = false;
    var isVisible = true;
    var isFirstFrameDrawn = false;
    var lastTimestamp = 0;
    var accumulatedTime = 0;

    function getFramePath(index) {
        var str = String(index);
        while (str.length < 3) str = '0' + str;
        return 'assets/home/ezgif-frame-' + str + '.jpg';
    }

    /**
     * Resize canvas with Retina / HiDPI support and cover dimensions
     */
    var canvasWidth = 0;
    var canvasHeight = 0;
    var dpr = 1;

    function resizeCanvas() {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasWidth = Math.round(rect.width * dpr);
        canvasHeight = Math.round(rect.height * dpr);

        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            if (isFirstFrameDrawn && frames[currentFrame]) {
                drawFrame(currentFrame);
            }
        }
    }

    /**
     * Draw frame onto canvas using cover algorithm
     * Aligns slightly to the right (82%) so the 3D pedestals remain focal
     */
    function drawFrame(frameIdx) {
        var img = frames[frameIdx];
        if (!img || !img.complete || img.naturalWidth === 0) {
            // Find closest available loaded frame if current isn't loaded yet
            img = findClosestLoadedFrame(frameIdx);
            if (!img) return;
        }

        var iw = img.naturalWidth;
        var ih = img.naturalHeight;
        var cw = canvas.width;
        var ch = canvas.height;

        var scale = Math.max(cw / iw, ch / ih);
        var rw = iw * scale;
        var rh = ih * scale;

        // Alignment: 0.85 horizontally (right-weighted), 0.5 vertically (center)
        // On very narrow mobile screens, use 0.78 for balanced pedestal visibility
        var isMobile = window.innerWidth <= 768;
        var alignX = isMobile ? 0.78 : 0.86;
        var alignY = 0.5;

        var rx = (cw - rw) * alignX;
        var ry = (ch - rh) * alignY;

        ctx.drawImage(img, rx, ry, rw, rh);

        if (!isFirstFrameDrawn) {
            isFirstFrameDrawn = true;
            canvas.classList.add('is-ready');
            if (backdrop) backdrop.classList.add('has-canvas-ready');
        }
    }

    function findClosestLoadedFrame(targetIdx) {
        // Look backwards first, then forwards
        for (var i = targetIdx; i >= 1; i--) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) return frames[i];
        }
        for (var j = targetIdx + 1; j <= TOTAL_FRAMES; j++) {
            if (frames[j] && frames[j].complete && frames[j].naturalWidth > 0) return frames[j];
        }
        return null;
    }

    /**
     * Preloading pipeline:
     * 1. Load frame 1 immediately and display it.
     * 2. Load frames in batches in the background.
     */
    function loadSingleImage(idx, onComplete) {
        var img = new Image();
        img.onload = function () {
            frames[idx] = img;
            loadedCount++;
            if (onComplete) onComplete(img);
        };
        img.onerror = function () {
            if (onComplete) onComplete(null);
        };
        img.src = getFramePath(idx);
    }

    function initPreload() {
        // Load initial frame first
        loadSingleImage(1, function (img1) {
            if (img1) {
                resizeCanvas();
                drawFrame(1);
            }
            if (!prefersReducedMotion) {
                startBackgroundPreload();
            }
        });
    }

    function startBackgroundPreload() {
        var queue = [];
        for (var i = 2; i <= TOTAL_FRAMES; i++) {
            queue.push(i);
        }

        var CONCURRENCY = 6;
        var activeLoads = 0;

        function next() {
            while (activeLoads < CONCURRENCY && queue.length > 0) {
                var frameIdx = queue.shift();
                activeLoads++;
                loadSingleImage(frameIdx, function () {
                    activeLoads--;
                    // Start playback as soon as first 12 frames are ready
                    if (!isPlaying && loadedCount >= 12 && isVisible) {
                        startAnimation();
                    }
                    next();
                });
            }
        }

        next();
    }

    /**
     * Animation Loop (Ping-Pong / Breathing)
     */
    function tick(timestamp) {
        if (!isPlaying) return;

        if (!lastTimestamp) lastTimestamp = timestamp;
        var delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // Cap delta to prevent huge jumps when switching tabs
        if (delta > 200) delta = FRAME_INTERVAL;
        accumulatedTime += delta;

        while (accumulatedTime >= FRAME_INTERVAL) {
            accumulatedTime -= FRAME_INTERVAL;
            advanceFrame();
        }

        requestAnimationFrame(tick);
    }

    function advanceFrame() {
        if (pauseCounter > 0) {
            pauseCounter--;
            return;
        }

        var nextFrame = currentFrame + direction;

        if (nextFrame > TOTAL_FRAMES) {
            direction = -1;
            nextFrame = TOTAL_FRAMES - 1;
            pauseCounter = PAUSE_AT_ENDS_FRAMES;
        } else if (nextFrame < 1) {
            direction = 1;
            nextFrame = 2;
            pauseCounter = PAUSE_AT_ENDS_FRAMES;
        }

        currentFrame = nextFrame;
        drawFrame(currentFrame);
    }

    function startAnimation() {
        if (isPlaying || prefersReducedMotion || !isVisible) return;
        isPlaying = true;
        lastTimestamp = performance.now();
        accumulatedTime = 0;
        requestAnimationFrame(tick);
    }

    function stopAnimation() {
        isPlaying = false;
    }

    /**
     * Visibility Observer (Pause when scrolled away)
     */
    if ('IntersectionObserver' in window) {
        var heroEl = canvas.closest('.about-page-hero') || backdrop;
        if (heroEl) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    isVisible = entry.isIntersecting;
                    if (isVisible) {
                        if (loadedCount >= 8) startAnimation();
                    } else {
                        stopAnimation();
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(heroEl);
        }
    }

    /**
     * Tab visibility
     */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stopAnimation();
        } else if (isVisible && loadedCount >= 8) {
            startAnimation();
        }
    });

    /**
     * Resize handling
     */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 100);
    }, { passive: true });

    // Initial setup
    resizeCanvas();
    initPreload();

})();
