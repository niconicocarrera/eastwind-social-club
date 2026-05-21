function cascadeDay(dayEl) {
  const isRight = dayEl.classList.contains('hours-day--right');
  const lines = [...dayEl.querySelectorAll('.hours-time, .hours-detail')];
  if (!lines.length) return;

  const step = 16;

  lines.forEach((el, i) => {
    const indent = i * step;
    // Reset any pennant styles from previous approach
    el.style.width     = '';
    el.style.textAlign = '';
    el.style.whiteSpace = 'normal';
    el.style.overflow  = '';

    if (isRight) {
      el.style.marginRight = `${indent}px`;
      el.style.paddingLeft = '';
    } else {
      el.style.paddingLeft  = `${indent}px`;
      el.style.marginRight  = '';
    }
  });
}

document.fonts.ready.then(() => {
  document.querySelectorAll('.hours-day').forEach(cascadeDay);
});
