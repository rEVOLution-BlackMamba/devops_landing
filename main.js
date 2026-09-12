'use strict';

/* ── CONSOLE EASTER EGG ──────────────────────────────────── */
/* jshint ignore:start */
console.log(
  '%c$ whoami\n%cluisangel — DevOps engineer who reads the browser console.\n\n' +
  '%c$ cat .contact\n%cemail:  luis.bastida@proton.me\n' +
  'github: github.com/rEVOLution-BlackMamba\n\n' +
  '%c$ echo "Nice catch."',
  'color:#60a5fa;font-family:monospace;font-size:13px',
  'color:#8b949e;font-family:monospace;font-size:13px',
  'color:#60a5fa;font-family:monospace;font-size:13px',
  'color:#8b949e;font-family:monospace;font-size:13px',
  'color:#28c840;font-family:monospace;font-size:13px'
);
/* jshint ignore:end */

/* ── FOOTER YEAR ─────────────────────────────────────────── */
(function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ── NAVBAR scroll state ─────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ── MOBILE NAV ──────────────────────────────────────────── */
(function initMobileNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (!hamburger || !mobileNav) return;

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileNav();
  });
})();

/* ── THEME SWITCHER ──────────────────────────────────────── */
(function initTheme() {
  const btns = document.querySelectorAll('.theme-btn');
  if (!btns.length) return;

  function getStored() { return localStorage.getItem('theme') || 'system'; }

  function apply(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
    btns.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
  }

  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.theme)));
  apply(getStored());
})();

/* ── SCROLL PROGRESS BAR ─────────────────────────────────── */
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = scrollable > 0 ? `${(window.scrollY / scrollable) * 100}%` : '0%';
  }, { passive: true });
})();

/* ── BACK TO TOP ─────────────────────────────────────────── */
(function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── SCROLL SPY (active nav link) ───────────────────────── */
(function initScrollSpy() {
  const sections  = document.querySelectorAll('section[id], footer[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => obs.observe(s));
})();

/* ── COPY EMAIL ──────────────────────────────────────────── */
(function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.copy).then(() => {
        btn.classList.add('copied');
        btn.setAttribute('aria-label', 'Copied!');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.setAttribute('aria-label', 'Copy email address');
        }, 2000);
      });
    });
  });
})();

/* ── AUTO EXPERIENCE DURATIONS ───────────────────────────── */
(function initDurations() {
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function parseYM(str) {
    const [y, m] = str.split('-').map(Number);
    return { y, m };
  }

  function diffMonths(from, to) {
    return (to.y - from.y) * 12 + (to.m - from.m);
  }

  function formatDuration(months) {
    if (months < 1) return '< 1 mo';
    const yrs = Math.floor(months / 12);
    const mo  = months % 12;
    if (yrs === 0) return `${mo} mo`;
    if (mo  === 0) return `${yrs} yr`;
    return `${yrs} yr ${mo} mo`;
  }

  const now = new Date();
  const nowYM = { y: now.getFullYear(), m: now.getMonth() + 1 };

  document.querySelectorAll('.timeline-date[data-start]').forEach(el => {
    const from = parseYM(el.dataset.start);
    const to   = el.dataset.end === 'present' ? nowYM : parseYM(el.dataset.end);
    const dur  = diffMonths(from, to);
    if (dur > 0) {
      el.insertAdjacentHTML('afterend', `<span class="timeline-duration">· ${formatDuration(dur)}</span>`);
    }
  });
})();

/* ── TERMINAL TYPING ANIMATION ───────────────────────────── */
(function initTerminal() {
  const output = document.getElementById('terminal-output');
  if (!output) return;

  const lines = [
    { type: 'cmd', text: '$ whoami' },
    { type: 'out', text: 'Luis Angel' },
    { type: 'cmd', text: '$ cat role.txt' },
    { type: 'out', text: 'DevOps Engineer | Cloud Architect | GitOps Specialist' },
    { type: 'cmd', text: '$ echo $EXPERTISE' },
    { type: 'out', text: 'AWS · Azure · GCP · Hetzner · Scaleway · Kubernetes' },
    { type: 'cmd', text: '$ echo $STATUS' },
    { type: 'out', text: 'Open to new opportunities ✓' },
  ];

  let lineIndex = 0;
  let charIndex = 0;

  function tick() {
    if (lineIndex >= lines.length) return;
    const line = lines[lineIndex];

    if (charIndex === 0) {
      const span = document.createElement('span');
      span.className = 'line ' + line.type;
      span.id = 'tl-' + lineIndex;
      output.appendChild(span);
    }

    const span = document.getElementById('tl-' + lineIndex);
    const full  = line.text;

    if (charIndex < full.length) {
      span.textContent += full[charIndex];
      charIndex++;
      setTimeout(tick, line.type === 'cmd' ? 55 : 28);
    } else {
      span.insertAdjacentHTML('afterend', '<br>');
      charIndex = 0;
      lineIndex++;
      setTimeout(tick, line.type === 'cmd' ? 130 : 380);
    }
  }

  setTimeout(tick, 700);
})();

/* ── COUNTER ANIMATION ───────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  function animate(el) {
    if (el.dataset.text !== undefined) {
      el.textContent = el.dataset.text;
      return;
    }
    const target   = parseInt(el.dataset.target, 10);
    const suffix   = el.dataset.suffix || '';
    const duration = 1400;
    const start    = performance.now();

    function step(now) {
      const elapsed  = Math.min(now - start, duration);
      const progress = ease(elapsed / duration);
      el.textContent = Math.round(progress * target) + suffix;
      if (elapsed < duration) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => obs.observe(el));
})();

/* ── SCROLL REVEAL ───────────────────────────────────────── */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => obs.observe(el));
})();
