/**
 * Nest Portfolios — Hero 3D Platform Canvas Animation Engine (v2.0)
 * Ultra-optimized WebP frame-sequence player with intelligent buffer protection,
 * non-blocking async image decoding, ping-pong levitation loop, cover aspect-ratio
 * rendering & smooth mouse parallax.
 */
(function () {
    'use strict';

    var TOTAL_FRAMES = 41;
    var TARGET_FPS = 20;
    var FRAME_INTERVAL = 1000 / TARGET_FPS;
    var IMG_NATIVE_WIDTH = 1280;
    var IMG_NATIVE_HEIGHT = 720;
    var BUFFER_THRESHOLD = 18; // Safe buffer before starting playback

    var canvas = document.getElementById('heroAnimCanvas');
    var poster = document.getElementById('heroStaticPoster');
    var heroSection = document.getElementById('heroSection') || document.querySelector('.about-page-hero--has-bg');

    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d');
    if (!ctx) return;

    // Cache of loaded Image elements: frame index (0..40) -> Image object
    var frames = new Array(TOTAL_FRAMES);
    var loadedCount = 0;
    var isPlaying = false;
    var currentFrame = 0;
    var direction = 1; // 1 = forward, -1 = reverse
    var lastFrameTime = 0;
    var dwellUntil = 0;
    var loopStarted = false;

    // Mouse parallax tracking
    var mouseTargetX = 0;
    var mouseTargetY = 0;
    var mouseCurrentX = 0;
    var mouseCurrentY = 0;

    function getFrameUrl(idx) {
        var num = String(idx + 1).padStart(3, '0');
        return 'assets/hero_anim/frame_' + num + '.webp';
    }

    // Resize canvas resolution to device pixel ratio
    function resizeCanvas() {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var newWidth = Math.round(rect.width * dpr);
        var newHeight = Math.round(rect.height * dpr);

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
        }

        renderCurrentFrame();
    }

    // Draw the image with cover scaling and right-anchoring for the 3D screens
    function drawCover(img) {
        if (!img || !img.complete || img.naturalWidth === 0) return;

        var cWidth = canvas.width;
        var cHeight = canvas.height;
        var cRatio = cWidth / cHeight;
        var iRatio = IMG_NATIVE_WIDTH / IMG_NATIVE_HEIGHT;

        var renderW, renderH, offsetX, offsetY;

        if (cRatio > iRatio) {
            renderW = cWidth;
            renderH = cWidth / iRatio;
            offsetX = 0;
            offsetY = (cHeight - renderH) * 0.5;
        } else {
            renderH = cHeight;
            renderW = cHeight * iRatio;
            // Anchor 78% towards the right to prioritize the 3D floating screens
            offsetX = (cWidth - renderW) * 0.78;
            offsetY = (cHeight - renderH) * 0.5;
        }

        // Apply smooth lerped mouse parallax
        var pxDpr = Math.min(window.devicePixelRatio || 1, 2);
        offsetX += mouseCurrentX * pxDpr;
        offsetY += mouseCurrentY * pxDpr;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    }

    function renderCurrentFrame() {
        var img = frames[currentFrame];
        if (img && img.complete && img.naturalWidth > 0) {
            drawCover(img);
        }
    }

    var animId = null;

    // Main animation loop
    function loop(now) {
        if (!isPlaying) return;

        animId = requestAnimationFrame(loop);

        // Smooth mouse parallax lerp
        mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.08;
        mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.08;

        // Check dwell pause at apex or rest
        if (now < dwellUntil) {
            renderCurrentFrame();
            return;
        }

        var elapsed = now - lastFrameTime;
        if (elapsed > 1000) {
            lastFrameTime = now;
            elapsed = 0;
        }
        if (elapsed < FRAME_INTERVAL) {
            renderCurrentFrame();
            return;
        }

        lastFrameTime = now - (elapsed % FRAME_INTERVAL);

        // Calculate next frame in current direction
        var nextFrame = currentFrame + direction;

        if (nextFrame >= TOTAL_FRAMES) {
            // Apex reached (fully elevated & glowing): dwell for 380ms then reverse
            currentFrame = TOTAL_FRAMES - 1;
            direction = -1;
            dwellUntil = now + 380;
        } else if (nextFrame < 0) {
            // Base reached (grounded state): dwell for 260ms then rise again
            currentFrame = 0;
            direction = 1;
            dwellUntil = now + 260;
        } else {
            // Safe buffer check: only advance if the next frame is ready
            if (frames[nextFrame] && frames[nextFrame].complete) {
                currentFrame = nextFrame;
            } else {
                // Buffer protection: if the next frame isn't ready yet,
                // seamlessly reverse direction within loaded frames rather than freezing!
                if (direction === 1 && currentFrame > 2) {
                    direction = -1;
                }
            }
        }

        renderCurrentFrame();
    }

    function startLoop() {
        if (!isPlaying) {
            isPlaying = true;
            lastFrameTime = performance.now();
            animId = requestAnimationFrame(loop);
        }
    }

    function stopLoop() {
        isPlaying = false;
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }

    // Helper: Async load an image with off-main-thread decode when supported
    function loadSingleFrame(idx, onDone) {
        var img = new Image();
        function handleSuccess() {
            frames[idx] = img;
            loadedCount++;
            if (onDone) onDone(true);
        }
        function handleFail() {
            if (onDone) onDone(false);
        }

        img.onload = function () {
            if ('decode' in img) {
                img.decode().then(handleSuccess).catch(handleSuccess);
            } else {
                handleSuccess();
            }
        };
        img.onerror = handleFail;
        img.src = getFrameUrl(idx);
    }

    // Progressive asynchronous loader with buffer protection
    function preloadFrames() {
        // Priority 1: Load frame 0 first for instant canvas readiness
        loadSingleFrame(0, function () {
            resizeCanvas();
            renderCurrentFrame();

            // Priority 2: Preload initial buffer batch (frames 1..BUFFER_THRESHOLD) in parallel
            var initialNeeded = BUFFER_THRESHOLD;
            var initialLoaded = 0;

            function checkBuffer() {
                initialLoaded++;
                if (initialLoaded >= initialNeeded && !loopStarted) {
                    loopStarted = true;
                    // Reveal canvas smoothly over static poster now that safe buffer is in memory
                    canvas.classList.add('is-active');
                    if (poster) {
                        poster.style.opacity = '0';
                    }
                    startLoop();
                    // Priority 3: Stream the remaining frames in background
                    loadRemainingFrames();
                }
            }

            for (var i = 1; i <= BUFFER_THRESHOLD && i < TOTAL_FRAMES; i++) {
                loadSingleFrame(i, checkBuffer);
            }
        });
    }

    // Stream remaining frames (BUFFER_THRESHOLD + 1 to TOTAL_FRAMES - 1)
    function loadRemainingFrames() {
        var nextIdx = BUFFER_THRESHOLD + 1;
        var MAX_CONCURRENT = 3;
        var activeWorkers = 0;

        function pump() {
            while (activeWorkers < MAX_CONCURRENT && nextIdx < TOTAL_FRAMES) {
                (function (i) {
                    activeWorkers++;
                    loadSingleFrame(i, function () {
                        activeWorkers--;
                        pump();
                    });
                })(nextIdx++);
            }
        }
        pump();
    }

    // Mouse movement parallax listeners
    if (heroSection) {
        heroSection.addEventListener('mousemove', function (e) {
            var rect = heroSection.getBoundingClientRect();
            var relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
            var relY = (e.clientY - rect.top) / rect.height - 0.5;
            mouseTargetX = -relX * 16; // ±8px shift
            mouseTargetY = -relY * 12; // ±6px shift
        }, { passive: true });

        heroSection.addEventListener('mouseleave', function () {
            mouseTargetX = 0;
            mouseTargetY = 0;
        }, { passive: true });
    }

    // Tab visibility handling: pause only when browser tab is hidden to conserve power
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stopLoop();
        } else if (loopStarted) {
            startLoop();
        }
    });

    // Window resize handler with debounce
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeCanvas();
            if (loopStarted) startLoop();
        }, 60);
    }, { passive: true });

    // Initialize once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            resizeCanvas();
            preloadFrames();
        });
    } else {
        resizeCanvas();
        preloadFrames();
    }
})();
