document.addEventListener('DOMContentLoaded', () => {

  // ---- Sticky nav (appears after scrolling past hero) ----
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');

  const navObserver = new IntersectionObserver(
    ([entry]) => {
      nav.classList.toggle('visible', !entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
  );
  navObserver.observe(hero);

  // ---- Mobile menu ----
  const toggle = document.querySelector('.nav-toggle');
  toggle.addEventListener('click', () => {
    nav.classList.toggle('menu-open');
  });

  // Close mobile menu on link click
  document.querySelectorAll('.nav-mobile a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('menu-open'));
  });

  // ---- Scroll reveal ----
  const reveals = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
  );

  reveals.forEach(el => revealObserver.observe(el));

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Contact form ----
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const btn = form.querySelector('.btn-submit');
      const btnSpan = btn.querySelector('span');
      const originalText = btnSpan.textContent;
      btnSpan.textContent = 'Sending...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(response => {
          if (response.ok) {
            btnSpan.textContent = 'Thank you — his family reads every message';
            btn.style.background = '#4a7c59';
            btn.style.opacity = '1';
            form.reset();
            if (typeof turnstile !== 'undefined') turnstile.reset();
            setTimeout(() => {
              btnSpan.textContent = originalText;
              btn.style.background = '';
              btn.disabled = false;
            }, 4000);
          } else {
            throw new Error('Failed');
          }
        })
        .catch(() => {
          btnSpan.textContent = 'Error — Please Try Again';
          btn.style.background = '#a04040';
          btn.style.opacity = '1';
          btn.disabled = false;
          setTimeout(() => {
            btnSpan.textContent = originalText;
            btn.style.background = '';
          }, 4000);
        });
    });
  }

  // ---- Parallax glow effect on hero ----
  const glows = document.querySelectorAll('.hero-glow');
  let ticking = false;

  window.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      glows.forEach((glow, i) => {
        const factor = (i + 1) * 0.6;
        glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
      ticking = false;
    });
  });

});
