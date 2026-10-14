/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ELECTRIC STORM ENGINE (LIGHT + NEON DARK EDITIONS)
 * Nest Portfolios — Atmospheric Background
 * Features:
 *   - LIGHT MODE: Pure White Canvas (#ffffff) with Electric Black & Gold lightning
 *   - DARK MODE:  Deep night-sky canvas with NEON cyan / violet / magenta lightning,
 *                 additive (glow) blending and neon ionized sparks
 *   - Fractal Branching Lightning Strikes
 *   - Ionized Sparks, Embers & Crackling Micro-Arcs
 *   - Interactive Electrostatic Attraction & Click-to-Strike Discharges
 *   - Retina / HiDPI Auto-scaling & Battery-conscious RequestAnimationFrame
 *   - Theme is read from <html data-theme="light|dark"> (see theme.js)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initializations
    if (window.__electricStormInitialized) return;
    window.__electricStormInitialized = true;

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Configuration
    const CONFIG = {
        baseBgColor: '#ffffff',
        cloudCount: 0, // Volumetric smog clouds removed for clean backdrop
        particleCount: prefersReducedMotion ? 20 : 45,
        rainStreakCount: prefersReducedMotion ? 0 : 30,
        minStrikeInterval: prefersReducedMotion ? 8000 : 3500,
        maxStrikeInterval: prefersReducedMotion ? 14000 : 7000,
        lightningColors: {
            blackCore: '#0a0b0e',
            goldGlow: '#f59e0b',
            brightGold: '#ffc72c'
        }
    };

    /**
     * Theme palettes
     *  - passes: lightning is drawn in 3 layered strokes (outer glow → mid glow → core)
     *    blur is [normal, powerful]; width() receives the segment width + isPowerful
     */
    const PALETTES = {
        light: {
            composite: 'source-over',
            rainEnabled: true,
            particleLimit: 999,
            flash: (a) => [
                [0, `rgba(255, 199, 44, ${a * 0.22})`],
                [0.45, `rgba(245, 158, 11, ${a * 0.10})`],
                [1, 'rgba(255, 255, 255, 0)']
            ],
            rain: (flash) => `rgba(15, 20, 30, ${0.035 + flash * 0.03})`,
            passes: [
                { // A: Outer Electric Gold Glow
                    shadow: 'rgba(245, 158, 11, 0.9)',
                    blur: [18, 26],
                    stroke: (a) => `rgba(245, 158, 11, ${a * 0.8})`,
                    width: (w, p) => w * (p ? 4.2 : 3.0)
                },
                { // B: Inner Plasma Core (Vibrant Gold)
                    shadow: '#ffc72c',
                    blur: [10, 10],
                    stroke: (a) => `rgba(255, 199, 44, ${a * 0.95})`,
                    width: (w) => w * 2.0
                },
                { // C: Electric Black Lightning Core
                    shadow: '#0a0b0e',
                    blur: [4, 4],
                    stroke: (a) => `rgba(10, 11, 14, ${a * 0.98})`,
                    width: (w) => Math.max(1.4, w * 1.05)
                }
            ],
            arc: (a) => `rgba(245, 158, 11, ${a})`,
            sparkA: (al) => ({ fill: `rgba(245, 158, 11, ${al})`, glow: 'rgba(245, 158, 11, 0.7)', blur: 6 }),
            sparkB: (al) => ({ fill: `rgba(15, 18, 26, ${al * 0.75})`, glow: 'rgba(15, 18, 26, 0.4)', blur: 4 }),
            cursor: (e) => [
                [0, `rgba(255, 199, 44, ${e * 0.22})`],
                [0.5, `rgba(245, 158, 11, ${e * 0.10})`],
                [1, 'rgba(255, 255, 255, 0)']
            ]
        },
        dark: {
            composite: 'source-over', // plain blending: additive 'lighter' + big blurs were too heavy
            rainEnabled: false,       // streaks skipped in dark mode for speed
            particleLimit: 24,        // fewer sparks in dark mode
            flash: (a) => [
                [0, `rgba(138, 43, 255, ${a * 0.30})`],
                [0.45, `rgba(0, 240, 255, ${a * 0.11})`],
                [1, 'rgba(0, 0, 0, 0)']
            ],
            rain: (flash) => `rgba(120, 200, 255, ${0.05 + flash * 0.05})`,
            // Glow is faked with a wide translucent stroke (no shadowBlur) = far cheaper on the GPU/CPU
            passes: [
                { // A: Outer Ultraviolet Halo (wide, faint — no blur)
                    shadow: 'rgba(0, 0, 0, 0)',
                    blur: [0, 0],
                    stroke: (a) => `rgba(176, 38, 255, ${a * 0.26})`,
                    width: (w, p) => w * (p ? 6.2 : 4.6)
                },
                { // B: Neon Cyan Plasma (small blur only)
                    shadow: '#00f0ff',
                    blur: [7, 11],
                    stroke: (a) => `rgba(0, 240, 255, ${a * 0.9})`,
                    width: (w) => w * 2.0
                },
                { // C: White-hot Core (no blur)
                    shadow: 'rgba(0, 0, 0, 0)',
                    blur: [0, 0],
                    stroke: (a) => `rgba(255, 255, 255, ${a})`,
                    width: (w) => Math.max(1.2, w * 0.95)
                }
            ],
            arc: (a) => `rgba(0, 240, 255, ${Math.min(1, a * 1.5)})`,
            // halo = cheap fake glow (a larger faint dot) instead of per-particle shadowBlur
            sparkA: (al) => ({ fill: `rgba(0, 240, 255, ${al})`, glow: 'rgba(0, 0, 0, 0)', blur: 0, halo: `rgba(0, 240, 255, ${al * 0.16})` }),
            sparkB: (al) => ({ fill: `rgba(255, 43, 214, ${al * 0.9})`, glow: 'rgba(0, 0, 0, 0)', blur: 0, halo: `rgba(255, 43, 214, ${al * 0.14})` }),
            cursor: (e) => [
                [0, `rgba(0, 240, 255, ${e * 0.26})`],
                [0.5, `rgba(176, 38, 255, ${e * 0.12})`],
                [1, 'rgba(0, 0, 0, 0)']
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
    let nextAutoStrikeTime = performance.now() + 2000;
    let darkBackdrop = null; // cached offscreen night-sky (gradients are painted once, not every frame)

    // State collections
    const clouds = [];
    const particles = [];
    const rainStreaks = [];
    const activeStrikes = [];
    let ambientFlash = 0; // 0 to 1
    let ambientFlashX = 0.5;
    let ambientFlashY = 0.2;

    // Mouse / Interaction tracking
    const mouse = {
        x: -9999,
        y: -9999,
        active: false,
        energy: 0
    };

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
        initClouds();
        initParticles();
        initRainStreaks();
        initSoundToggle();
        bindEvents();
        startLoop();
    }

    /**
     * Resize Canvas with Retina DPR
     */
    function handleResize() {
        if (!canvas) return;
        // A soft background doesn't need retina sharpness — lower DPR = far fewer pixels per frame
        dpr = Math.min(window.devicePixelRatio || 1, isDark() ? 1 : 1.5);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        darkBackdrop = null; // rebuilt lazily at the new size
    }

    /**
     * Volumetric Storm Cloud Nodes (Disabled - Smog Removed)
     */
    function initClouds() {
        clouds.length = 0;
    }

    /**
     * Ionized Static Sparks & Charged Embers
     * (colorType 'gold' / 'black' map to the two spark colours of the active theme)
     */
    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: -0.25 + (Math.random() - 0.5) * 0.6,
                vy: -0.35 - Math.random() * 0.55,
                size: 1.2 + Math.random() * 1.8,
                baseAlpha: 0.25 + Math.random() * 0.5,
                alpha: 0.5,
                twinkleSpeed: 0.002 + Math.random() * 0.003,
                twinkleOffset: Math.random() * Math.PI * 2,
                colorType: Math.random() > 0.45 ? 'gold' : 'black'
            });
        }
    }

    /**
     * Subtle Atmospheric Wind / Rain Streaks
     */
    function initRainStreaks() {
        rainStreaks.length = 0;
        for (let i = 0; i < CONFIG.rainStreakCount; i++) {
            rainStreaks.push({
                x: Math.random() * width,
                y: Math.random() * height,
                len: 18 + Math.random() * 30,
                vx: -1.2 - Math.random() * 0.8,
                vy: 14 + Math.random() * 10,
                alpha: 0.03 + Math.random() * 0.03
            });
        }
    }

    /* ═══════════════════════════════════════════════════════════
       REAL-WORLD ELECTRIC ACOUSTICS ENGINE (Web Audio API)
       Authentic physical modeling of:
         - Real electrostatic sparks & contact breakdown
         - Supersonic lightning whip-crack & tearing plasma
         - Rolling atmospheric multi-reflection thunder
         - High-voltage mains arc & transformer plasma hum
       ═══════════════════════════════════════════════════════════ */
    let audioCtx = null;
    let soundEnabled = true;
    let lastZapTime = 0;
    let lastStrikeSoundTime = 0;
    let lastAmbientSoundTime = 0;

    const realAudioBuffers = {
        zap: null,
        lightningCrack: null,
        thunderRumble: null,
        surge: null
    };

    // Load saved sound preference (default: true)
    try {
        const savedSound = localStorage.getItem('np_sound_fx');
        if (savedSound === 'false') {
            soundEnabled = false;
        }
    } catch (e) {}

    /**
     * Generate Real Electrostatic Discharge Spark Buffer
     * Models supersonic impulse pressure shockwave + 5 stochastic micro-avalanches
     */
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
                const sp = microSparks[j];
                const dt = t - sp.t;
                if (dt >= 0) {
                    const env = Math.exp(-dt / sp.decay);
                    // Bipolar spark shockwave: steep positive rise, rapid negative undershoot
                    const shock = (dt < 0.0006) ? (1 - dt / 0.0003) * 2.4 : 0;
                    const ring = Math.sin(2 * Math.PI * sp.freq * dt);
                    s += sp.amp * (shock * 0.7 + ring * 0.5) * env;
                }
            }

            // High-voltage air ionization hiss
            const hissEnv = Math.exp(-t / 0.018);
            const hiss = (Math.random() * 2 - 1) * hissEnv * 0.35;
            s += hiss;

            // Non-linear air resistance saturation (tanh clipping)
            data[i] = Math.tanh(s * 2.0) * 0.9;
        }
        return buffer;
    }

    /**
     * Generate Real Supersonic Lightning Crack & Tearing Plasma Buffer
     * Models stepped leader avalanche, explosive return stroke, and ripping canvas air tearing
     */
    function generateRealLightningCrackBuffer(ctx) {
        const sr = ctx.sampleRate;
        const duration = 0.38; // 380ms
        const numSamples = Math.floor(sr * duration);
        const buffer = ctx.createBuffer(1, numSamples, sr);
        const data = buffer.getChannelData(0);

        const strokes = [
            { t: 0.000, amp: 0.80, freq: 2600, decay: 0.025 },
            { t: 0.026, amp: 1.00, freq: 3200, decay: 0.045 },
            { t: 0.082, amp: 0.85, freq: 2100, decay: 0.035 },
            { t: 0.145, amp: 0.52, freq: 2800, decay: 0.030 }
        ];

        for (let i = 0; i < numSamples; i++) {
            const t = i / sr;
            let s = 0;

            for (let j = 0; j < strokes.length; j++) {
                const st = strokes[j];
                const dt = t - st.t;
                if (dt >= 0) {
                    const env = Math.exp(-dt / st.decay);
                    // Supersonic whip-crack blast transient
                    const shock = (dt < 0.002) ? (1 - dt / 0.001) * 3.2 : (Math.random() - 0.5) * 0.65;
                    const wave = Math.sin(2 * Math.PI * st.freq * dt);
                    s += st.amp * (shock * 0.65 + wave * 0.4) * env;
                }
            }

            // Ripping canvas plasma tearing noise (fractal air breakdown)
            if (t < 0.28) {
                const tearEnv = Math.exp(-t / 0.09);
                const tearNoise = (Math.random() * 2 - 1) * (0.8 + 0.2 * Math.sin(t * 1400));
                s += tearNoise * tearEnv * 0.55;
            }

            // High-voltage arc plasma buzz (120Hz + harmonics)
            if (t > 0.02 && t < 0.22) {
                const buzzEnv = Math.exp(-(t - 0.02) / 0.06);
                const buzz = Math.sin(2 * Math.PI * 120 * t) + 0.5 * Math.sin(2 * Math.PI * 360 * t) + 0.3 * Math.sin(2 * Math.PI * 600 * t);
                s += buzz * buzzEnv * 0.4;
            }

            data[i] = Math.tanh(s * 2.4) * 0.92;
        }
        return buffer;
    }

    /**
     * Generate Real Rolling Atmospheric Thunder Buffer
     * Models Brownian low-frequency blast dispersion & cloud/ground acoustic multi-reflections
     */
    function generateRealThunderRumbleBuffer(ctx) {
        const sr = ctx.sampleRate;
        const duration = 2.4; // 2.4 seconds
        const numSamples = Math.floor(sr * duration);
        const buffer = ctx.createBuffer(1, numSamples, sr);
        const data = buffer.getChannelData(0);

        let brown = 0;
        for (let i = 0; i < numSamples; i++) {
            const t = i / sr;
            // Brownian acoustic noise integration (true atmospheric low rumble)
            const white = Math.random() * 2 - 1;
            brown = (brown + 0.035 * white) / 1.035;

            // Natural multi-envelope peaks from tortuous lightning channel paths
            const env1 = (t < 0.06 ? t / 0.06 : Math.exp(-(t - 0.06) / 0.32)) * 0.95;
            const env2 = (t > 0.25 ? Math.exp(-Math.pow((t - 0.52) / 0.22, 2)) : 0) * 0.70;
            const env3 = (t > 0.70 ? Math.exp(-Math.pow((t - 1.18) / 0.40, 2)) : 0) * 0.50;

            const totalEnv = (env1 + env2 + env3) * Math.exp(-t / 1.35);

            // Sub-bass resonance (42Hz - 54Hz modulated)
            const subFreq = 46 + Math.sin(t * 4.2) * 8;
            const sub = Math.sin(2 * Math.PI * subFreq * t) * 0.35;

            data[i] = (brown * 0.72 + sub * 0.28) * totalEnv * 1.6;
        }
        return buffer;
    }

    /**
     * Generate Real High-Voltage Substation Arc Surge Buffer
     * Models 60Hz/120Hz AC mains power arc, chaotic arc sizzling, and transformer plasma hum
     */
    function generateRealSurgeBuffer(ctx) {
        const sr = ctx.sampleRate;
        const duration = 0.58; // 580ms
        const numSamples = Math.floor(sr * duration);
        const buffer = ctx.createBuffer(1, numSamples, sr);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sr;
            // Initial contact spark click
            const initSpark = (t < 0.004) ? (1 - t / 0.002) * (Math.random() * 2 - 1) * 2.2 : 0;

            // Intense 60Hz/120Hz high-voltage electrical substation arc buzz
            const env = Math.exp(-t / 0.28) * (1 - Math.exp(-t / 0.02));
            const f = 60;
            let buzz = Math.sin(2 * Math.PI * f * t)
                + 0.8 * Math.sin(2 * Math.PI * (f * 2) * t)
                + 0.6 * Math.sin(2 * Math.PI * (f * 3) * t)
                + 0.5 * Math.sin(2 * Math.PI * (f * 5) * t)
                + 0.4 * Math.sin(2 * Math.PI * (f * 7) * t);

            // Chaotic arc sizzling & sputtering
            const sputter = (Math.random() * 2 - 1) * (Math.sin(2 * Math.PI * 120 * t) > 0.4 ? 0.7 : 0.1);

            const total = initSpark + (buzz * 0.65 + sputter * 0.35) * env;
            data[i] = Math.tanh(total * 2.2) * 0.88;
        }
        return buffer;
    }

    function initRealAudioBuffers(ctx) {
        if (realAudioBuffers.zap) return;
        try {
            realAudioBuffers.zap = generateRealElectricZapBuffer(ctx);
            realAudioBuffers.lightningCrack = generateRealLightningCrackBuffer(ctx);
            realAudioBuffers.thunderRumble = generateRealThunderRumbleBuffer(ctx);
            realAudioBuffers.surge = generateRealSurgeBuffer(ctx);
        } catch (e) {
            console.warn('Real audio buffer initialization failed:', e);
        }
    }

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
                initRealAudioBuffers(audioCtx);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * 1. Real Electrostatic Snap (ONLY on Interactive UI Clicks)
     * True supersonic micro-spark avalanche — crisp, real, zero synth pitch-drops
     */
    function playClickZap(x) {
        if (!soundEnabled || document.hidden) return;
        const nowMs = performance.now();
        if (nowMs - lastZapTime < 45) return;
        lastZapTime = nowMs;

        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running' || !realAudioBuffers.zap) return;

        const now = ctx.currentTime;
        const source = ctx.createBufferSource();
        source.buffer = realAudioBuffers.zap;

        // Clean highpass filter to keep only razor-sharp electrostatic crackle
        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(800, now);

        const gain = ctx.createGain();
        const vol = 0.16 + (Math.random() - 0.5) * 0.04;
        gain.gain.setValueAtTime(vol, now);

        // Dynamic stereo panning based on cursor position
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

        // Slight organic pitch variation (+/- 7%) for natural spark ionization variety
        source.playbackRate.setValueAtTime(0.95 + Math.random() * 0.10, now);
        source.start(now);
    }

    /**
     * 2. Real Distant Rolling Thunder (Rare ambient storm background roll)
     * Atmospheric low-frequency pressure wave rolling across the horizon
     */
    function playDistantThunder(x) {
        if (!soundEnabled || document.hidden || !realAudioBuffers.thunderRumble) return;
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;

        const now = ctx.currentTime;
        const thunderSource = ctx.createBufferSource();
        thunderSource.buffer = realAudioBuffers.thunderRumble;
        thunderSource.playbackRate.setValueAtTime(0.85 + Math.random() * 0.10, now);

        // Distant air absorption: strict lowpass < 95Hz
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(95, now);
        lp.frequency.linearRampToValueAtTime(50, now + 2.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, now); // Soft atmospheric distant roll

        thunderSource.connect(lp);
        lp.connect(gain);

        if (ctx.createStereoPanner && typeof x === 'number' && window.innerWidth) {
            const panner = ctx.createStereoPanner();
            const pan = Math.max(-0.8, Math.min(0.8, (x / window.innerWidth) * 2 - 1));
            panner.pan.setValueAtTime(pan, now);
            gain.connect(panner);
            panner.connect(ctx.destination);
        } else {
            gain.connect(ctx.destination);
        }

        thunderSource.start(now);
    }

    /**
     * 3. Real Lightning Discharge & Thunder (Direct User Trigger / Theme Surge)
     * Supersonic whip-crack plasma tear + rolling atmospheric thunder boom
     */
    function playStrikeSound(x, options) {
        if (!soundEnabled || document.hidden) return;
        const nowMs = performance.now();
        if (nowMs - lastStrikeSoundTime < 220) return;
        lastStrikeSoundTime = nowMs;

        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;

        const isTheme = options && options.type === 'theme';
        const now = ctx.currentTime;

        let destNode = ctx.destination;
        if (ctx.createStereoPanner && typeof x === 'number' && window.innerWidth) {
            const panner = ctx.createStereoPanner();
            const pan = Math.max(-0.85, Math.min(0.85, (x / window.innerWidth) * 2 - 1));
            panner.pan.setValueAtTime(pan, now);
            panner.connect(ctx.destination);
            destNode = panner;
        }

        if (isTheme && realAudioBuffers.surge) {
            // High-voltage substation electric arc surge
            const surgeSource = ctx.createBufferSource();
            surgeSource.buffer = realAudioBuffers.surge;
            const surgeGain = ctx.createGain();
            surgeGain.gain.setValueAtTime(0.24, now);
            surgeSource.connect(surgeGain);
            surgeGain.connect(destNode);
            surgeSource.start(now);
            return;
        }

        // A. Violent Supersonic Lightning Tear & Arc Shock
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

        // B. Rolling Acoustic Atmospheric Thunder
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
            thunderSource.start(now + 0.03); // Acoustic delay
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
    function createLightningStrike(startX, startY, targetX, targetY, isPowerful = false, source = 'ambient') {
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

            // Normal displacement
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const normalX = -dy / dist;
            const normalY = dx / dist;

            const jitter = (Math.random() - 0.5) * dist * 0.35;
            const cx = midX + normalX * jitter;
            const cy = midY + normalY * jitter;

            // Recurse left and right
            buildBranch(x1, y1, cx, cy, depth + 1, maxDepth, branchAlpha);
            buildBranch(cx, cy, x2, y2, depth + 1, maxDepth, branchAlpha);

            // Probability of fork sub-branch
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

        // Multi-stroke flicker simulation
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

        // Logical Sound Dispatch:
        if (source === 'interactive') {
            // Immediate, punchy electric discharge summoned by user click
            playStrikeSound(targetX, { isPowerful: true, type: 'interactive' });
        } else if (source === 'theme') {
            // Electrifying power surge on theme transition
            playStrikeSound(targetX, { isPowerful: true, type: 'theme' });
        } else if (source === 'ambient') {
            // Ambient natural storm: only rare powerful strikes trigger distant thunder (min 28s cooldown)
            // Keeps the site peaceful, beautiful, and atmospheric without annoying random noises
            const nowMs = performance.now();
            if (isPowerful && (nowMs - lastAmbientSoundTime > 28000)) {
                lastAmbientSoundTime = nowMs;
                playDistantThunder(targetX);
            }
        }

        // Flash ambient illumination
        ambientFlash = Math.max(ambientFlash, isPowerful ? 0.85 : 0.55);
        ambientFlashX = targetX / width;
        ambientFlashY = targetY / height;
    }

    /**
     * Trigger Random Natural Lightning
     */
    function triggerRandomStrike() {
        const isSheet = Math.random() < 0.28;
        const originX = width * (0.15 + Math.random() * 0.7);
        const originY = -15;

        if (isSheet) {
            // Sheet lightning: illuminates the sky with a burst (visual only)
            ambientFlash = 0.5 + Math.random() * 0.3;
            ambientFlashX = originX / width;
            ambientFlashY = 0.15 + Math.random() * 0.25;

            if (Math.random() > 0.4) {
                const destX = originX + (Math.random() - 0.5) * (width * 0.35);
                const destY = height * (0.15 + Math.random() * 0.25);
                createLightningStrike(originX, originY, destX, destY, false, 'ambient');
            }
        } else {
            // Ground/sky lightning bolt (ambient)
            const targetX = originX + (Math.random() - 0.5) * (width * 0.45);
            const targetY = height * (0.55 + Math.random() * 0.4);
            const isPowerful = Math.random() < 0.35;
            createLightningStrike(originX, originY, targetX, targetY, isPowerful, 'ambient');
        }

        // Schedule next random strike
        const delay = CONFIG.minStrikeInterval + Math.random() * (CONFIG.maxStrikeInterval - CONFIG.minStrikeInterval);
        nextAutoStrikeTime = performance.now() + delay;
    }

    /**
     * Trigger Interactive Strike toward Cursor
     */
    function triggerInteractiveStrike(x, y) {
        const originX = x + (Math.random() - 0.5) * 200;
        const originY = -10;
        createLightningStrike(originX, originY, x, y, true, 'interactive');
    }

    /**
     * Update State per Frame
     */
    function update(dt, now) {
        // Natural strike timer
        if (now >= nextAutoStrikeTime) {
            triggerRandomStrike();
        }

        // Frame-rate independent step (1 = one 60fps frame) so the 30fps dark mode moves at the same speed
        const k = dt / 16.67;

        // Ambient flash exponential decay
        if (ambientFlash > 0.005) {
            ambientFlash *= Math.pow(0.88, k);
        } else {
            ambientFlash = 0;
        }

        // Update particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx * k;
            p.y += p.vy * k;

            // Wrap around
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Twinkle
            p.alpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(now * p.twinkleSpeed + p.twinkleOffset));
        }

        // Update rain streaks
        for (let i = 0; i < rainStreaks.length; i++) {
            const r = rainStreaks[i];
            r.x += r.vx * k;
            r.y += r.vy * k;
            if (r.y > height + r.len || r.x < -50) {
                r.y = -r.len - Math.random() * 40;
                r.x = Math.random() * (width + 100);
            }
        }

        // Update active lightning strikes
        for (let i = activeStrikes.length - 1; i >= 0; i--) {
            const strike = activeStrikes[i];
            strike.elapsed += dt;
            if (strike.elapsed >= strike.duration) {
                activeStrikes.splice(i, 1);
            }
        }

        // Mouse electrostatic energy decay
        if (mouse.energy > 0) {
            mouse.energy = Math.max(0, mouse.energy - 0.015 * k);
        }
    }

    /**
     * Build a radial gradient from a [[offset, color], ...] stop list
     * (optionally on another 2D context, used for the cached backdrop)
     */
    function radial(x, y, r, stops, target) {
        const g = (target || ctx).createRadialGradient(x, y, 0, x, y, r);
        for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
        return g;
    }

    /**
     * Render the dark night-sky ONCE into an offscreen canvas.
     * Every frame afterwards is just a single drawImage() instead of 3 full-screen gradients.
     */
    function buildDarkBackdrop() {
        const off = document.createElement('canvas');
        off.width = canvas.width;
        off.height = canvas.height;
        const g = off.getContext('2d', { alpha: false });
        g.setTransform(dpr, 0, 0, dpr, 0, 0);

        const sky = g.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#03040a');
        sky.addColorStop(1, '#0b0720');
        g.fillStyle = sky;
        g.fillRect(0, 0, width, height);

        const reach = Math.max(width, height);

        // Soft ultraviolet horizon haze (bottom-left) + cyan glow (top-right)
        g.fillStyle = radial(width * 0.12, height, reach * 0.7, [
            [0, 'rgba(138, 43, 255, 0.14)'],
            [1, 'rgba(138, 43, 255, 0)']
        ], g);
        g.fillRect(0, 0, width, height);

        g.fillStyle = radial(width * 0.92, 0, reach * 0.6, [
            [0, 'rgba(0, 240, 255, 0.08)'],
            [1, 'rgba(0, 240, 255, 0)']
        ], g);
        g.fillRect(0, 0, width, height);

        return off;
    }

    /**
     * Paint the base backdrop (white for light, cached neon night sky for dark)
     */
    function paintBackdrop(dark) {
        ctx.globalCompositeOperation = 'source-over';

        if (!dark) {
            ctx.fillStyle = CONFIG.baseBgColor;
            ctx.fillRect(0, 0, width, height);
            return;
        }

        if (!darkBackdrop) darkBackdrop = buildDarkBackdrop();
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(darkBackdrop, 0, 0);
        ctx.restore();
    }

    /**
     * Render Frame
     */
    function render(now) {
        const dark = isDark();
        const P = dark ? PALETTES.dark : PALETTES.light;

        // 1. Clear base backdrop
        paintBackdrop(dark);

        // 2. Draw Ambient Sky Flash
        if (ambientFlash > 0.02) {
            const flashX = ambientFlashX * width;
            const flashY = ambientFlashY * height;
            const flashRadius = Math.max(width, height) * 0.9;

            ctx.save();
            ctx.fillStyle = radial(flashX, flashY, flashRadius, P.flash(ambientFlash));
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // 3. Draw Atmospheric Rain / Wind Streaks
        if (P.rainEnabled && rainStreaks.length > 0) {
            ctx.save();
            ctx.strokeStyle = P.rain(ambientFlash);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < rainStreaks.length; i++) {
                const r = rainStreaks[i];
                ctx.moveTo(r.x, r.y);
                ctx.lineTo(r.x + (r.vx * 1.5), r.y + r.len);
            }
            ctx.stroke();
            ctx.restore();
        }

        // 4. Draw Active Lightning Strikes (3 layered passes per theme palette)
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

        // 5. Draw Ionized Static Sparks & Micro-Arcs
        ctx.save();
        ctx.globalCompositeOperation = P.composite;

        const sparkCount = Math.min(particles.length, P.particleLimit);

        // Draw micro-arcs between nearby particles
        for (let i = 0; i < sparkCount; i++) {
            const p1 = particles[i];
            for (let j = i + 1; j < sparkCount; j++) {
                const p2 = particles[j];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 3600) { // ~60px
                    const dist = Math.sqrt(distSq);
                    const arcAlpha = (1 - dist / 60) * 0.25;
                    ctx.strokeStyle = P.arc(arcAlpha);
                    ctx.lineWidth = 0.9;
                    ctx.beginPath();
                    const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 5;
                    const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 5;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        // Draw spark points
        for (let i = 0; i < sparkCount; i++) {
            const p = particles[i];
            const spark = p.colorType === 'gold' ? P.sparkA(p.alpha) : P.sparkB(p.alpha);
            if (spark.halo) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = spark.halo;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = spark.fill;
            ctx.shadowColor = spark.glow;
            ctx.shadowBlur = spark.blur;
            ctx.fill();
        }
        ctx.restore();

        // 6. Interactive Cursor Electrostatic Aura
        if (mouse.active && mouse.energy > 0.05) {
            ctx.save();
            ctx.globalCompositeOperation = P.composite;
            ctx.fillStyle = radial(mouse.x, mouse.y, 70 * mouse.energy, P.cursor(mouse.energy));
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 70 * mouse.energy, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Animation Loop
     */
    function loop(now) {
        animationFrameId = requestAnimationFrame(loop);

        // Dark mode renders at ~30fps (threshold a bit under 33ms to tolerate vsync jitter)
        const elapsed = now - lastTime;
        if (isDark() && elapsed < 28) return;

        const dt = Math.min(elapsed, 100);
        lastTime = now;

        update(dt, now);
        render(now);
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

        // Visibility API: Pause when tab is inactive to save battery
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopLoop();
            } else {
                lastTime = performance.now();
                startLoop();
            }
        });

        // Interactive mouse tracking
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
            mouse.energy = Math.min(1.0, mouse.energy + 0.12);
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            mouse.active = false;
        });

        // Unlock Web Audio context on first user gesture
        const unlockAudio = () => {
            getAudioContext();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });

        // Logical Click Sound Dispatcher:
        // 1. Interactive UI clicks -> crisp tactile electric micro-zap
        // 2. Canvas / Backdrop clicks -> interactive lightning strike to cursor with electric thunder discharge
        window.addEventListener('click', (e) => {
            const target = e.target;
            const interactiveEl = target && target.closest(
                'a, button, input, select, textarea, [role="button"], [role="switch"], [role="tab"], ' +
                '.topbar__link, .topbar__name, .sound-toggle, .theme-toggle, .hamburger, ' +
                '.filter-badge, .active-filter-badge__clear, .slide-btn, .slide-link, ' +
                '.floating-wa, .pricing-card__cta, .hero-btn, .ab-profile-btn, .testimonial-card, ' +
                '.card, .faq-item, .project-card, .btn, label'
            );

            if (interactiveEl) {
                // User clicked an interactive UI control -> play tactile electric feedback zap
                playClickZap(e.clientX);
                return;
            }

            // User clicked on empty canvas/background -> trigger interactive lightning bolt
            // The bolt's strike handler will play the electric discharge sound logically!
            triggerInteractiveStrike(e.clientX, e.clientY);
        }, { passive: true });

        // Theme switch: re-size the canvas for the new theme's resolution cap;
        // entering dark mode "powers up" the neon storm with a big bolt and surge sound
        window.addEventListener('themechange', (e) => {
            handleResize();
            if (prefersReducedMotion) return;
            if (e && e.detail && e.detail.theme === 'dark') {
                const x = width * (0.3 + Math.random() * 0.4);
                createLightningStrike(x, -15, x + (Math.random() - 0.5) * width * 0.2, height * 0.65, true, 'theme');
            }
        });
    }

    // Auto-boot engine
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCanvas);
    } else {
        initCanvas();
    }
})();
