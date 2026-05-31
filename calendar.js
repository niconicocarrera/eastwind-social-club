class EastWindCalendar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.today     = new Date();
    this.current   = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.events    = [];
    this.loading   = true;
    this._docListener = null;
    this.render();
    this.loadEvents();
  }

  async loadEvents() {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const url = isLocal
      ? 'https://eastwind-social-club.pages.dev/events'
      : '/events';
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
    this.closePanel();
    this.current = new Date(this.current.getFullYear(), this.current.getMonth() + dir, 1);
    this.render();
  }

  togglePanel(eventEl, idx) {
    const existing = this.container.querySelector('.cal-event-panel');
    if (existing) {
      const existingIdx = +existing.dataset.for;
      this.closePanel();
      if (existingIdx === idx) return;
    }
    this.openPanel(eventEl, idx);
  }

  openPanel(eventEl, idx) {
    const event = this.events[idx];
    if (!event) return;

    const cell = eventEl.closest('.cal-cell');

    const panel = document.createElement('div');
    panel.className = 'cal-event-panel';
    panel.dataset.for = idx;

    // Flip panel left if cell is in the right half of the calendar
    const cellRect = cell.getBoundingClientRect();
    const calRect  = this.container.getBoundingClientRect();
    if (cellRect.left > calRect.left + calRect.width / 2) {
      panel.classList.add('cal-event-panel--flip');
    }

    panel.innerHTML = `
      <p class="cal-panel-name">${event.name}</p>
      ${event.time ? `<p class="cal-panel-time">${event.time}</p>` : ''}
      ${event.price ? `<p class="cal-panel-price">${event.price}</p>` : ''}
      ${event.url
        ? `<a class="cal-panel-btn" href="${event.url}" target="_blank" rel="noopener noreferrer">GET TICKETS</a>`
        : `<p class="cal-panel-free">FREE ENTRY</p>`}
    `;

    cell.appendChild(panel);
    eventEl.setAttribute('aria-expanded', 'true');
  }

  closePanel() {
    const panel = this.container.querySelector('.cal-event-panel');
    if (panel) panel.remove();
    this.container.querySelectorAll('[aria-expanded="true"]')
      .forEach(el => el.setAttribute('aria-expanded', 'false'));
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
      const ds      = this.dateStr(year, month, day);
      const evts    = this.eventsFor(ds);
      const isToday = ds === todayStr;

      html += `<div class="cal-cell${isToday ? ' cal-cell--today' : ''}">
        <span class="cal-day-num">${day}</span>
        ${this.loading ? '' : evts.map(e => {
          const idx = this.events.indexOf(e);
          return `
            <div class="cal-event" data-idx="${idx}" role="button" tabindex="0" aria-expanded="false">
              ${e.time ? `<span class="cal-event-time">${e.time}</span>` : ''}
              <span class="cal-event-name">${e.name}</span>
            </div>`;
        }).join('')}
      </div>`;
    }

    html += `</div>`;
    if (this.loading) html += `<div class="cal-loading">LOADING EVENTS...</div>`;

    this.container.innerHTML = html;

    // Nav buttons
    this.container.querySelectorAll('.cal-nav').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(+btn.dataset.dir));
    });

    // Event click — open panel
    this.container.querySelectorAll('.cal-event').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.togglePanel(el, +el.dataset.idx);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.togglePanel(el, +el.dataset.idx);
        }
      });
    });

    // Close panel on outside click
    if (this._docListener) document.removeEventListener('click', this._docListener);
    this._docListener = e => {
      if (!this.container.contains(e.target)) this.closePanel();
    };
    document.addEventListener('click', this._docListener);
  }
}

window.eastWindCal = new EastWindCalendar('calendar');
