/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEST PORTFOLIOS — INTERACTIVE STORM SPARK ENGINE (PURE WHITE / PURE BLACK)
 * 
 * Features:
 *   - LIGHT MODE: Pure Solid White (#ffffff) canvas background
 *   - DARK MODE:  Pure Solid Black (#000000) canvas background
 *   - ZERO DISTRACTING AMBIENT ANIMATIONS: No ambient flash overlays, no rain,
 *     no drifting particles or micro-arcs that could obscure text or details.
 *   - INTERACTIVE STORM SPARK: User click summons a brilliant fractal lightning
 *     bolt directly to the cursor with authentic supersonic plasma acoustics.
 *   - TACTILE CLICK ZAP: Interactive buttons & links trigger a crisp micro-zap.
 *   - IDLE SLEEP: Canvas animation loop sleeps when no spark is active (0% CPU/GPU).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    if (window.__electricStormInitialized) return;
    window.__electricStormInitialized = true;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Theme palettes for the interactive lightning spark passes
    const PALETTES = {
        light: {
            composite: 'source-over',
            passes: [
                { // Outer Electric Gold Glow
                    shadow: 'rgba(245, 158, 11, 0.9)',
                    blur: [16, 24],
                    stroke: (a) => `rgba(245, 158, 11, ${a * 0.85})`,
                    width: (w, p) => w * (p ? 4.0 : 2.8)
                },
                { // Inner Plasma Core (Vibrant Gold)
                    shadow: '#ffc72c',
                    blur: [8, 10],
                    stroke: (a) => `rgba(255, 199, 44, ${a * 0.95})`,
                    width: (w) => w * 2.0
                },
                { // Electric Black Core (Razor-sharp high contrast)
                    shadow: '#000000',
                    blur: [2, 3],
                    stroke: (a) => `rgba(0, 0, 0, ${a * 0.98})`,
                    width: (w) => Math.max(1.5, w * 1.1)
                }
            ]
        },
        dark: {
            composite: 'source-over',
            passes: [
                { // Outer Ultraviolet Glow
                    shadow: 'rgba(176, 38, 255, 0.7)',
                    blur: [14, 22],
                    stroke: (a) => `rgba(176, 38, 255, ${a * 0.75})`,
                    width: (w, p) => w * (p ? 5.0 : 3.8)
                },
                { // Neon Cyan Plasma Core
                    shadow: '#00f0ff',
                    blur: [8, 12],
                    stroke: (a) => `rgba(0, 240, 255, ${a * 0.95})`,
                    width: (w) => w * 2.2
                },
                { // White-Hot Lightning Core
                    shadow: '#ffffff',
                    blur: [3, 5],
                    stroke: (a) => `rgba(255, 255, 255, ${a})`,
                    width: (w) => Math.max(1.4, w * 1.0)
                }
            ]
        }
    };

    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    let canvas, ctx;
    let width = 0, height = 0, dpr = 1;
    let animationFrameId = null;
    let lastTime = performance.now();
    const activeStrikes = [];

    /**
     * Initialize Canvas and Mount to DOM
     */
    function initCanvas() {
        canvas = document.getElementById('electricStormCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'electricStormCanvas';
            canvas.setAttribute('aria-hidden', 'true');
            if (document.body) {
                document.body.prepend(canvas);
            } else {
                window.addEventListener('DOMContentLoaded', () => document.body.prepend(canvas));
            }
        }
        ctx = canvas.getContext('2d', { alpha: false });
        handleResize();
        initSoundToggle();
        bindEvents();
        // Render initial solid backdrop
        render(performance.now());
    }

    /**
     * Resize Canvas with Retina DPR
     */
    function handleResize() {
        if (!canvas) return;
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render(performance.now());
    }

    /* ═══════════════════════════════════════════════════════════
       REAL-WORLD ELECTRIC ACOUSTICS ENGINE (Web Audio API)
       Pure procedural synthesis:
         - Authentic contact breakdown micro-zap
         - Supersonic lightning whip-crack & tearing plasma
         - Rolling atmospheric thunder boom
       ═══════════════════════════════════════════════════════════ */
    let audioCtx = null;
    let soundEnabled = true;
    let lastZapTime = 0;
    let lastStrikeSoundTime = 0;

    const realAudioBuffers = {
        zap: null,
        lightningCrack: null,
        thunderRumble: null,
        surge: null
    };

    try {
        const savedSound = localStorage.getItem('np_sound_fx');
        if (savedSound === 'false') {
            soundEnabled = false;
        }
    } catch (e) {}

    function generateRealElectricZapBuffer(ctx) {
        const sr = ctx.sampleRate;
        const duration = 0.048; // 48ms
        const numSamples = Math.floor(sr * duration);
        const buffer = ctx.createBuffer(1, numSamples, sr);
        const data = buffer.getChannelData(0);

        const microSparks = [
            { t: 0.0000, amp: 1.00, freq: 5200, decay: 0.0028 },
            { t: 0.0028, amp: 0.65, freq: 4400, decay: 0.0025 },
            { t: 0.0074, amp: 0.88, freq: 5800, decay: 0.0032 },
            { t: 0.0135, amp: 0.42, freq: 3900, decay: 0.0030 },
            { t: 0.0210, amp: 0.28, freq: 4900, decay: 0.0040 }
        ];

        for (let i = 0; i < numSamples; i++) {
            const t = i / sr;
            let s = 0;

            for (let j = 0; j < microSparks.length; j++) {
                const spk = microSparks[j];
                const dt = t - spk.t;
                if (dt >= 0) {
                    const env = Math.exp(-dt / spk.decay);
                    const osc = Math.sin(2 * Math.PI * spk.freq * dt);
                    const noise = (Math.random() * 2 - 1) * 0.45;
                    s += (osc * 0.55 + noise) * env * spk.amp;
                }
            }

            s = Math.max(-1, Math.min(1, s));
            data[i] = s;
        }
        return buffer;
    }

    function generateRealLightningCrackBuffer(ctx) {
        const sr = ctx.sampleRate;
        const duration = 0.65;
        const numSamples = Math.floor(sr * duration);
        const buffer = ctx.createBuffer(1, numSamples, sr);
        const data = buffer.getChannelData(0);

        const returnStrokes = [
            { t: 0.000, amp: 1.00, tau: 0.018 },
            { t: 0.038, amp: 0.72, tau: 0.022 },
            { t: 0.082, amp: 0.48, tau: 0.026 },
            { t: 0.140, amp: 0.32, tau: 0.035 }
        ];

        let lcg = 123456789;
        function rnd() {
            lcg = (1103515245 * lcg + 12345) & 0x7fffffff;
            return (lcg / 0x7fffffff) * 2 - 1;
        }

        for (let i = 0; i < numSamples; i++) {
            const t = i / sr;
            let sample = 0;

            for (let s = 0; s < returnStrokes.length; s++) {
                const r = returnStrokes[s];
                const dt = t - r.t;
                if (dt >= 0) {
                    const env = Math.exp(-dt / r.tau);
                    const w = (1 - dt / r.tau);
                    const shock = w * Math.exp(-((dt * 1800) ** 2)) * 1.5;
                    const hiss = rnd() * env;
                    sample += (shock + hiss * 0.8) * r.amp;
                }
            }

            sample = Math.max(-1, Math.min(1, sample));
            data[i] = sample;
        }
        return buffer;
    }

    function generateRealThunderRumbleBuffer(ctx) {
        const sr = ctx.sampleRate;
        const duration = 2.4;
        const numSamples = Math.floor(sr * duration);
        const buffer = ctx.createBuffer(1, numSamples, sr);
        const data = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0;
        let lcg = 987654321;
        function rnd() {
            lcg = (1103515245 * lcg + 12345) & 0x7fffffff;
            return (lcg / 0x7fffffff) * 2 - 1;
        }

        const rumbleEvents = [
            { t: 0.05, amp: 1.00, dur: 0.85 },
            { t: 0.32, amp: 0.85, dur: 1.10 },
            { t: 0.78, amp: 0.62, dur: 1.30 },
            { t: 1.35, amp: 0.38, dur: 0.95 }
        ];

        for (let i = 0; i < numSamples; i++) {
            const t = i / sr;
            const white = rnd();
            b0 = 0.992 * b0 + white * 0.055;
            b1 = 0.985 * b1 + white * 0.075;
            b2 = 0.950 * b2 + white * 0.120;
            const brownNoise = (b0 + b1 + b2) * 0.4;

            let envelope = 0;
            for (let e = 0; e < rumbleEvents.length; e++) {
                const ev = rumbleEvents[e];
                const dt = t - ev.t;
                if (dt >= 0 && dt < ev.dur) {
                    const norm = dt / ev.dur;
                    const shape = Math.sin(norm * Math.PI) * (1 - norm * 0.4);
                    envelope += shape * ev.amp;
                }
            }

            const subInfra = Math.sin(2 * Math.PI * 42 * t + brownNoise * 3) * 0.35 * envelope;
            let sample = (brownNoise * 0.8 + subInfra) * envelope;
            data[i] = Math.max(-1, Math.min(1, sample * 0.9));
        }
        return buffer;
    }

    function initAudioEngine() {
        if (audioCtx) return audioCtx;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;

        try {
            audioCtx = new AudioContextClass();
            realAudioBuffers.zap = generateRealElectricZapBuffer(audioCtx);
            realAudioBuffers.lightningCrack = generateRealLightningCrackBuffer(audioCtx);
            realAudioBuffers.thunderRumble = generateRealThunderRumbleBuffer(audioCtx);
        } catch (e) {
            audioCtx = null;
        }
        return audioCtx;
    }

    function getAudioContext() {
        const ctx = initAudioEngine();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function playClickZap(x) {
        if (!soundEnabled || document.hidden || !realAudioBuffers.zap) return;
        const nowMs = performance.now();
        if (nowMs - lastZapTime < 45) return;
        lastZapTime = nowMs;

        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;

        const now = ctx.currentTime;
        const source = ctx.createBufferSource();
        source.buffer = realAudioBuffers.zap;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(1400, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);

        if (ctx.createStereoPanner && typeof x === 'number' && window.innerWidth) {
            const panner = ctx.createStereoPanner();
            const pan = Math.max(-0.85, Math.min(0.85, (x / window.innerWidth) * 2 - 1));
            panner.pan.setValueAtTime(pan, now);
            source.connect(hpFilter);
            hpFilter.connect(gain);
            gain.connect(panner);
            panner.connect(ctx.destination);
        } else {
            source.connect(hpFilter);
            hpFilter.connect(gain);
            gain.connect(ctx.destination);
        }

        source.playbackRate.setValueAtTime(0.95 + Math.random() * 0.10, now);
        source.start(now);
    }

    function playStrikeSound(x) {
        if (!soundEnabled || document.hidden) return;
        const nowMs = performance.now();
        if (nowMs - lastStrikeSoundTime < 220) return;
        lastStrikeSoundTime = nowMs;

        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;

        const now = ctx.currentTime;
        let destNode = ctx.destination;

        if (ctx.createStereoPanner && typeof x === 'number' && window.innerWidth) {
            const panner = ctx.createStereoPanner();
            const pan = Math.max(-0.85, Math.min(0.85, (x / window.innerWidth) * 2 - 1));
            panner.pan.setValueAtTime(pan, now);
            panner.connect(ctx.destination);
            destNode = panner;
        }

        // Supersonic Lightning Whip-Crack
        if (realAudioBuffers.lightningCrack) {
            const crackSource = ctx.createBufferSource();
            crackSource.buffer = realAudioBuffers.lightningCrack;
            crackSource.playbackRate.setValueAtTime(0.96 + Math.random() * 0.08, now);

            const crackGain = ctx.createGain();
            crackGain.gain.setValueAtTime(0.26, now);

            crackSource.connect(crackGain);
            crackGain.connect(destNode);
            crackSource.start(now);
        }

        // Rolling Acoustic Thunder
        if (realAudioBuffers.thunderRumble) {
            const thunderSource = ctx.createBufferSource();
            thunderSource.buffer = realAudioBuffers.thunderRumble;
            thunderSource.playbackRate.setValueAtTime(0.92 + Math.random() * 0.14, now);

            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(140, now);
            lp.frequency.linearRampToValueAtTime(70, now + 2.0);

            const thunderGain = ctx.createGain();
            thunderGain.gain.setValueAtTime(0.32, now);

            thunderSource.connect(lp);
            lp.connect(thunderGain);
            thunderGain.connect(destNode);
            thunderSource.start(now + 0.03);
        }
    }

    function syncSoundToggleUI() {
        const toggles = document.querySelectorAll('.sound-toggle');
        toggles.forEach(btn => {
            btn.classList.toggle('muted', !soundEnabled);
            btn.setAttribute('aria-checked', String(soundEnabled));
            btn.setAttribute('aria-label', soundEnabled ? 'Mute electric sound FX' : 'Unmute electric sound FX');
            btn.setAttribute('title', soundEnabled ? 'Electric Sound FX: Active (Click to mute)' : 'Electric Sound FX: Muted (Click to enable)');
        });
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        try {
            localStorage.setItem('np_sound_fx', String(soundEnabled));
        } catch (e) {}
        syncSoundToggleUI();
        if (soundEnabled) {
            getAudioContext();
            playClickZap(window.innerWidth / 2);
        }
    }

    function initSoundToggle() {
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn && !document.getElementById('soundToggle')) {
            const btn = document.createElement('button');
            btn.className = 'sound-toggle';
            btn.id = 'soundToggle';
            btn.type = 'button';
            btn.role = 'switch';
            btn.setAttribute('aria-checked', String(soundEnabled));
            btn.setAttribute('aria-label', soundEnabled ? 'Mute electric sound FX' : 'Unmute electric sound FX');
            btn.setAttribute('title', soundEnabled ? 'Electric Sound FX: Active (Click to mute)' : 'Electric Sound FX: Muted (Click to enable)');
            btn.innerHTML = `
                <svg class="sound-icon sound-icon--on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <svg class="sound-icon sound-icon--off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
            `;
            themeBtn.parentElement.insertBefore(btn, themeBtn);
        }

        document.querySelectorAll('.sound-toggle').forEach(btn => {
            btn.removeEventListener('click', toggleSound);
            btn.addEventListener('click', toggleSound);
        });
        syncSoundToggleUI();
    }

    /**
     * Generate Fractal Branching Lightning
     */
    function createLightningStrike(startX, startY, targetX, targetY, isPowerful = true) {
        const segments = [];

        function buildBranch(x1, y1, x2, y2, depth, maxDepth, branchAlpha) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.hypot(dx, dy);
            if (dist < 12 || depth >= maxDepth) {
                segments.push({
                    x1, y1, x2, y2,
                    alpha: branchAlpha,
                    width: Math.max(0.7, (maxDepth - depth + 1) * 0.7)
                });
                return;
            }

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const normalX = -dy / dist;
            const normalY = dx / dist;

            const jitter = (Math.random() - 0.5) * dist * 0.35;
            const cx = midX + normalX * jitter;
            const cy = midY + normalY * jitter;

            buildBranch(x1, y1, cx, cy, depth + 1, maxDepth, branchAlpha);
            buildBranch(cx, cy, x2, y2, depth + 1, maxDepth, branchAlpha);

            if (depth >= 1 && depth <= maxDepth - 2 && Math.random() < 0.38) {
                const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.45);
                const forkLen = dist * (0.35 + Math.random() * 0.35);
                const forkEndX = cx + Math.cos(angle) * forkLen;
                const forkEndY = cy + Math.sin(angle) * forkLen;
                buildBranch(cx, cy, forkEndX, forkEndY, depth + 1, maxDepth, branchAlpha * 0.75);
            }
        }

        const maxDepth = isPowerful ? 6 : 5;
        buildBranch(startX, startY, targetX, targetY, 0, maxDepth, 1.0);

        const flashPattern = isPowerful
            ? [1.0, 0.35, 0.9, 0.2, 0.6, 0.15]
            : [1.0, 0.4, 0.75, 0.15];

        const strike = {
            segments,
            duration: isPowerful ? 420 : 300,
            elapsed: 0,
            flashPattern,
            isPowerful,
            originX: startX,
            originY: startY
        };

        activeStrikes.push(strike);
        playStrikeSound(targetX);
        startLoop();
    }

    /**
     * Trigger Interactive Strike toward Cursor
     */
    function triggerInteractiveStrike(x, y) {
        const originX = x + (Math.random() - 0.5) * 200;
        const originY = -10;
        createLightningStrike(originX, originY, x, y, true);
    }

    /**
     * Paint Solid Backdrop
     * LIGHT MODE: Solid #ffffff (Pure White)
     * DARK MODE:  Solid #000000 (Pure Black)
     */
    function paintBackdrop(dark) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = dark ? '#000000' : '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Render Frame
     */
    function render(now) {
        const dark = isDark();
        const P = dark ? PALETTES.dark : PALETTES.light;

        // 1. Solid pure background (White for light mode, Black for dark mode)
        paintBackdrop(dark);

        // 2. Draw Active Lightning Strikes (User click spark only)
        if (activeStrikes.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = P.composite;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'miter';

            for (let s = 0; s < activeStrikes.length; s++) {
                const strike = activeStrikes[s];
                const progress = strike.elapsed / strike.duration;

                const pattern = strike.flashPattern;
                const patternIdx = Math.min(Math.floor(progress * pattern.length), pattern.length - 1);
                const flickerVal = pattern[patternIdx];
                const strikeAlpha = flickerVal * (1 - progress * 0.85);

                if (strikeAlpha <= 0.01) continue;

                for (let k = 0; k < P.passes.length; k++) {
                    const pass = P.passes[k];
                    ctx.shadowColor = pass.shadow;
                    ctx.shadowBlur = strike.isPowerful ? pass.blur[1] : pass.blur[0];
                    ctx.strokeStyle = pass.stroke(strikeAlpha);

                    ctx.beginPath();
                    for (let i = 0; i < strike.segments.length; i++) {
                        const seg = strike.segments[i];
                        ctx.lineWidth = pass.width(seg.width, strike.isPowerful);
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(seg.x2, seg.y2);
                    }
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    }

    /**
     * Update State per Frame
     */
    function update(dt) {
        for (let i = activeStrikes.length - 1; i >= 0; i--) {
            const strike = activeStrikes[i];
            strike.elapsed += dt;
            if (strike.elapsed >= strike.duration) {
                activeStrikes.splice(i, 1);
            }
        }
    }

    /**
     * Animation Loop (Sleeps when no strikes are active to preserve 100% battery & CPU)
     */
    function loop(now) {
        const elapsed = now - lastTime;
        const dt = Math.min(elapsed, 100);
        lastTime = now;

        update(dt);
        render(now);

        if (activeStrikes.length > 0) {
            animationFrameId = requestAnimationFrame(loop);
        } else {
            // All strikes completed: paint clean solid backdrop once and pause loop
            stopLoop();
            render(now);
        }
    }

    function startLoop() {
        if (!animationFrameId) {
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(loop);
        }
    }

    function stopLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    /**
     * Event Listeners
     */
    function bindEvents() {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 100);
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopLoop();
            } else {
                render(performance.now());
            }
        });

        // Unlock Web Audio context on first user gesture
        const unlockAudio = () => {
            getAudioContext();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });

        // Logical Click Dispatcher:
        // 1. Interactive UI controls -> tactile electric micro-zap
        // 2. Background / canvas / text areas -> storm spark lightning bolt striking down to cursor
        window.addEventListener('click', (e) => {
            const target = e.target;
            const interactiveEl = target && target.closest(
                'a, button, input, select, textarea, [role="button"], [role="switch"], [role="tab"], ' +
                '.topbar__link, .topbar__name, .sound-toggle, .theme-toggle, .hamburger, ' +
                '.filter-badge, .active-filter-badge__clear, .slide-btn, .slide-link, ' +
                '.floating-wa, .pricing-card__cta, .hero-btn, .ab-profile-btn, label'
            );

            if (interactiveEl) {
                playClickZap(e.clientX);
                return;
            }

            // Summon storm spark to click coordinates
            triggerInteractiveStrike(e.clientX, e.clientY);
        }, { passive: true });

        // Theme switch: immediately repaint canvas to pure white or pure black
        window.addEventListener('themechange', () => {
            handleResize();
            render(performance.now());
        });
    }

    // Auto-boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCanvas);
    } else {
        initCanvas();
    }
})();
