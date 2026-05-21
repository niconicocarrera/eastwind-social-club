const ICAL_URL =
  'https://calendar.google.com/calendar/ical/' +
  '9824d663530cee14087bd4ec2988edf7fb442abfbeaf0031137ca6f99461802b%40group.calendar.google.com' +
  '/public/basic.ics';

function unfold(text) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function parseDateTime(rawLine, value) {
  const m = value.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
  if (!m) return null;
  const [, yr, mo, dy, hr = '00', mi = '00'] = m;

  if (value.endsWith('Z')) {
    // UTC — convert to Chicago local time
    const d = new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:00Z`);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    const p = Object.fromEntries(fmt.formatToParts(d).map(x => [x.type, x.value]));
    const date = `${p.year}-${p.month}-${p.day}`;
    const time = `${p.hour}${p.minute === '00' ? '' : `:${p.minute}`}${p.dayPeriod.toLowerCase()}`;
    return { date, time };
  } else {
    // Already local (TZID=America/Chicago) or all-day (no time component)
    const date = `${yr}-${mo}-${dy}`;
    let h = parseInt(hr, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    const time = hr === '00' && mi === '00' ? '' : `${h}${mi === '00' ? '' : `:${mi}`}${ampm}`;
    return { date, time };
  }
}

function parseICal(text) {
  const events = [];
  const blocks = unfold(text).split('BEGIN:VEVENT').slice(1);

  for (const block of blocks) {
    const content = block.substring(0, block.indexOf('END:VEVENT'));
    const props = {};
    const rawKeys = {};

    for (const line of content.split(/\r?\n/)) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const fullKey = line.substring(0, colon).trim();
      const key     = fullKey.split(';')[0].trim();
      const value   = line.substring(colon + 1).trim();
      props[key]    = value;
      rawKeys[key]  = fullKey;
    }

    if (!props.DTSTART || !props.SUMMARY) continue;

    const dt = parseDateTime(rawKeys.DTSTART || 'DTSTART', props.DTSTART);
    if (!dt) continue;

    const name = props.SUMMARY
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/gi, ' ');

    events.push({ date: dt.date, time: dt.time, name });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export default async function handler(req, context) {
  try {
    const res = await fetch(ICAL_URL);
    if (!res.ok) throw new Error(`iCal fetch failed: ${res.status}`);

    const events = parseICal(await res.text());

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
