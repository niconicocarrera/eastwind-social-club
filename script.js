// Scroll fade-in + hours cascade
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      if (entry.target.classList.contains('hours')) {
        const lines = entry.target.querySelectorAll('.hours-day-name, .hours-time, .hours-detail');
        lines.forEach((el, i) => {
          el.style.animationDelay = `${i * 55}ms`;
        });
        entry.target.classList.add('cascaded');
      }

      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

