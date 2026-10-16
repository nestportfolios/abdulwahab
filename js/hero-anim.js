/**
 * Nest Portfolios — Hero 3D Platform Canvas Animation Engine
 * Progressive, high-efficiency frame-sequence animation player with
 * ping-pong levitation loop, cover aspect-ratio rendering & mouse parallax.
 */
(function () {
    'use strict';

    var TOTAL_FRAMES = 82;
    var TARGET_FPS = 24;
    var FRAME_INTERVAL = 1000 / TARGET_FPS;
    var IMG_NATIVE_WIDTH = 1920;
    var IMG_NATIVE_HEIGHT = 1080;

    var canvas = document.getElementById('heroAnimCanvas');
    var poster = document.getElementById('heroStaticPoster');
    var heroSection = document.getElementById('heroSection') || document.querySelector('.about-page-hero--has-bg');

    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Cache of loaded Image elements: frame index (0..81) -> Image object
    var frames = new Array(TOTAL_FRAMES);
    var loadedCount = 0;
    var isPlaying = false;
    var isVisible = true;
    var currentFrame = 0;
    var direction = 1; // 1 = forward, -1 = reverse
    var lastFrameTime = 0;
    var dwellUntil = 0;

    // Mouse parallax tracking
    var mouseTargetX = 0;
    var mouseTargetY = 0;
    var mouseCurrentX = 0;
    var mouseCurrentY = 0;

    function getFrameUrl(idx) {
        var num = String(idx + 1).padStart(3, '0');
        return 'assets/hero_anim/frame_' + num + '.jpg';
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

    // Main animation loop
    function loop(now) {
        if (!isPlaying || !isVisible) return;

        requestAnimationFrame(loop);

        // Smooth mouse parallax lerp
        mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.08;
        mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.08;

        // Check dwell pause at apex or rest
        if (now < dwellUntil) {
            renderCurrentFrame();
            return;
        }

        var elapsed = now - lastFrameTime;
        if (elapsed < FRAME_INTERVAL) {
            renderCurrentFrame();
            return;
        }

        lastFrameTime = now - (elapsed % FRAME_INTERVAL);

        // Find next loaded frame in the current direction
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
            // Only advance if next frame is ready; otherwise hold
            if (frames[nextFrame] && frames[nextFrame].complete) {
                currentFrame = nextFrame;
            }
        }

        renderCurrentFrame();
    }

    // Progressive asynchronous loader
    function preloadFrames() {
        // Priority 1: Load frame 0 immediately
        var img0 = new Image();
        img0.onload = function () {
            frames[0] = img0;
            loadedCount++;
            resizeCanvas();
            renderCurrentFrame();

            // Reveal canvas smoothly over static poster
            canvas.classList.add('is-active');
            if (poster) {
                poster.style.opacity = '0';
            }

            // Priority 2: Load next initial chunk of frames (1..10)
            loadChunk(1, 10, function () {
                // Start animation once initial batch is ready
                if (!isPlaying) {
                    isPlaying = true;
                    requestAnimationFrame(loop);
                }
                // Priority 3: Stream the remaining frames in the background
                loadRemaining();
            });
        };
        img0.src = getFrameUrl(0);
    }

    function loadChunk(start, end, onDone) {
        var needed = end - start + 1;
        var loadedInChunk = 0;

        for (var i = start; i <= end && i < TOTAL_FRAMES; i++) {
            (function (idx) {
                var img = new Image();
                img.onload = function () {
                    frames[idx] = img;
                    loadedCount++;
                    loadedInChunk++;
                    if (loadedInChunk >= needed && onDone) {
                        onDone();
                    }
                };
                img.onerror = function () {
                    loadedInChunk++;
                    if (loadedInChunk >= needed && onDone) {
                        onDone();
                    }
                };
                img.src = getFrameUrl(idx);
            })(i);
        }
    }

    function loadRemaining() {
        // Background stream remaining frames sequentially
        var nextToLoad = 11;
        function loadNext() {
            if (nextToLoad >= TOTAL_FRAMES) return;
            var idx = nextToLoad++;
            var img = new Image();
            img.onload = function () {
                frames[idx] = img;
                loadedCount++;
                loadNext();
            };
            img.onerror = function () {
                loadNext();
            };
            img.src = getFrameUrl(idx);
        }

        // Run 2 parallel concurrent streams to quickly fill cache without locking network
        loadNext();
        loadNext();
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

    // Performance: Pause when offscreen using IntersectionObserver
    if ('IntersectionObserver' in window && heroSection) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                isVisible = entry.isIntersecting;
                if (isVisible && !isPlaying && loadedCount > 4) {
                    isPlaying = true;
                    lastFrameTime = performance.now();
                    requestAnimationFrame(loop);
                }
            });
        }, { threshold: 0.05 });

        observer.observe(heroSection);
    }

    // Performance: Pause when tab is hidden
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            isVisible = false;
        } else {
            isVisible = true;
            if (heroSection) {
                var rect = heroSection.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    if (!isPlaying && loadedCount > 4) {
                        isPlaying = true;
                        lastFrameTime = performance.now();
                        requestAnimationFrame(loop);
                    }
                }
            }
        }
    });

    // Window resize handler with debounce
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 60);
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
