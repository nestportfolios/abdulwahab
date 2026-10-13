/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THEME CONTROLLER — Light / Dark mode
 * Abdul Wahab Portfolio
 *   - Loaded in <head> so the saved theme is applied BEFORE first paint (no flash)
 *   - Light is the default; the choice is remembered in localStorage
 *   - Dark mode switches the storm canvas to its neon palette (see storm.js)
 *   - Any element with the .theme-toggle class becomes a switch
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'aw-theme';
    var root = document.documentElement;

    function readSaved() {
        try {
            var saved = window.localStorage.getItem(STORAGE_KEY);
            return saved === 'dark' ? 'dark' : 'light';
        } catch (e) {
            return 'light';
        }
    }

    function save(theme) {
        try { window.localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* storage unavailable */ }
    }

    function syncToggles(theme) {
        var isDark = theme === 'dark';
        var toggles = document.querySelectorAll('.theme-toggle');
        for (var i = 0; i < toggles.length; i++) {
            var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
            toggles[i].setAttribute('aria-checked', String(isDark));
            toggles[i].setAttribute('aria-label', label);
            toggles[i].setAttribute('title', label);
        }
    }

    function applyTheme(theme, announce) {
        root.setAttribute('data-theme', theme);
        syncToggles(theme);
        if (announce) {
            try {
                window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
            } catch (e) { /* CustomEvent unsupported */ }
        }
    }

    function toggleTheme() {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

        // Smooth colour cross-fade for the switch only (removed right after)
        root.classList.add('theme-switching');
        window.setTimeout(function () { root.classList.remove('theme-switching'); }, 500);

        applyTheme(next, true);
        save(next);
    }

    // 1. Apply immediately (script runs in <head>)
    applyTheme(readSaved(), false);

    // 2. Wire the toggle(s) once the DOM exists
    function bind() {
        syncToggles(root.getAttribute('data-theme') || 'light');
        var toggles = document.querySelectorAll('.theme-toggle');
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].addEventListener('click', toggleTheme);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    // 3. Keep multiple open tabs in sync
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) {
            applyTheme(e.newValue === 'dark' ? 'dark' : 'light', true);
        }
    });
})();
