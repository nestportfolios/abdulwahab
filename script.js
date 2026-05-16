/* ============================================
   ABDUL WAHAB — PORTFOLIO SCRIPTS
   Spotlight cursor, nav highlighting, scroll reveal
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Preloader ───
    const preloader = document.getElementById('preloader');
    const minPreloadTime = 2000; // Show for at least 2 seconds for the aesthetic effect
    const startTime = Date.now();

    window.addEventListener('load', () => {
        const elapsedTime = Date.now() - startTime;
        const delay = Math.max(minPreloadTime - elapsedTime, 0);
        
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                document.body.classList.remove('loading');
            }, 800); // match CSS transition duration
        }, delay);
    });

    // ─── Cursor Spotlight ───
    const spotlight = document.getElementById('spotlight');

    document.addEventListener('mousemove', (e) => {
        spotlight.style.left = e.clientX + 'px';
        spotlight.style.top = e.clientY + 'px';
    });

    // ─── Scroll Spy for Navigation ───
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        let current = '';
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        sections.forEach((section) => {
            const sectionTop = section.offsetTop - 200;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        // If near the bottom of the page, activate the last section
        if (scrollY + windowHeight >= documentHeight - 100) {
            const lastSection = sections[sections.length - 1];
            if (lastSection) {
                current = lastSection.getAttribute('id');
            }
        }

        navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

    // ─── Scroll Reveal for Sections ───
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach((section) => {
        observer.observe(section);
    });

    // ─── Smooth scroll for nav links ───
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ─── Project card focus ring for accessibility ───
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card) => {
        card.addEventListener('focus', () => {
            card.style.outline = '2px solid var(--teal)';
            card.style.outlineOffset = '4px';
        });
        card.addEventListener('blur', () => {
            card.style.outline = 'none';
        });
    });

});
