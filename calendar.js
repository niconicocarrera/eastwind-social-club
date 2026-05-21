class EastWindCalendar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.today     = new Date();
    this.current   = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.events    = [];
    this.loading   = true;
    this.render();
    this.loadEvents();
  }

  async loadEvents() {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const url = isLocal
      ? 'https://eastwind-social-club.netlify.app/.netlify/functions/events'
      : '/.netlify/functions/events';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      this.events = await res.json();
    } catch {
      this.events = typeof EASTWIND_EVENTS !== 'undefined' ? EASTWIND_EVENTS : [];
    }
    this.loading = false;
    this.render();
  }

  dateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  eventsFor(dateStr) {
    return this.events.filter(e => e.date === dateStr);
  }

  navigate(dir) {
    this.current = new Date(this.current.getFullYear(), this.current.getMonth() + dir, 1);
    this.render();
  }

  render() {
    const year  = this.current.getFullYear();
    const month = this.current.getMonth();

    const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                    'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr    = this.dateStr(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());

    let html = `
      <div class="cal-header">
        <button class="cal-nav" data-dir="-1" aria-label="Previous month">&#8249;</button>
        <span class="cal-title">${MONTHS[month]} ${year}</span>
        <button class="cal-nav" data-dir="1" aria-label="Next month">&#8250;</button>
      </div>
      <div class="cal-weekdays">
        ${DAYS.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">
    `;

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-cell cal-cell--empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const ds     = this.dateStr(year, month, day);
      const evts   = this.eventsFor(ds);
      const isToday = ds === todayStr;

      html += `<div class="cal-cell${isToday ? ' cal-cell--today' : ''}">
        <span class="cal-day-num">${day}</span>
        ${this.loading ? '' : evts.map(e => `
          <div class="cal-event">
            ${e.time ? `<span class="cal-event-time">${e.time} —</span>` : ''}
            <span class="cal-event-name">${e.name}</span>
          </div>`).join('')}
      </div>`;
    }

    html += `</div>`;
    if (this.loading) html += `<div class="cal-loading">LOADING EVENTS...</div>`;

    this.container.innerHTML = html;

    this.container.querySelectorAll('.cal-nav').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(+btn.dataset.dir));
    });
  }
}

window.eastWindCal = new EastWindCalendar('calendar');
