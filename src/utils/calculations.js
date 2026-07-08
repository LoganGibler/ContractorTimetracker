export const REGULAR_MINUTES = 8 * 60;         // 8h/day (used for daily progress bar only)
export const WEEKLY_OT_THRESHOLD = 40 * 60;    // 40h/week — Florida rule
export const COMPOFF_MINUTES = 8 * 60;         // 8h = 1 compoff day

export const DEFAULT_DAY = {
  start: '10:00',
  end: '18:30',
  breakMinutes: 30,
  breakNote: 'Lunch',
};

export function getDurationMinutes(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  return Math.max(0, (new Date(clockOut) - new Date(clockIn)) / 60000);
}

export function formatDuration(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0h 0m';
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDecimalHours(minutes) {
  return (minutes / 60).toFixed(2);
}

export function getEntriesForDate(entries, date) {
  return entries.filter(e => e.date === date);
}

// Raw clocked-in minutes for a date (no break subtraction)
export function getDailyMinutes(entries, date) {
  return getEntriesForDate(entries, date)
    .filter(e => e.clockOut)
    .reduce((sum, e) => sum + getDurationMinutes(e.clockIn, e.clockOut), 0);
}

// Total break minutes logged for a date
export function getDailyBreakMinutes(breaks, date) {
  return breaks.filter(b => b.date === date).reduce((s, b) => s + b.minutes, 0);
}

// Net worked minutes for a date (clocked time minus breaks)
export function getDailyNetMinutes(entries, breaks, date) {
  return Math.max(0, getDailyMinutes(entries, date) - getDailyBreakMinutes(breaks, date));
}

// Monday of the week for a given date string
export function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Total net worked minutes for a week (breaks subtracted)
export function getWeeklyNetMinutes(entries, breaks, weekStart) {
  return getWeekDates(weekStart).reduce(
    (sum, date) => sum + getDailyNetMinutes(entries, breaks, date),
    0
  );
}

// Weekly OT = anything over 40h net (Florida rule)
export function getWeeklyOTMinutes(entries, breaks, weekStart) {
  return Math.max(0, getWeeklyNetMinutes(entries, breaks, weekStart) - WEEKLY_OT_THRESHOLD);
}

// Total OT earned across all weeks (sum of weekly OTs)
export function getTotalOTMinutes(entries, breaks) {
  const weeks = getUniqueWeeks(entries);
  return weeks.reduce((sum, week) => sum + getWeeklyOTMinutes(entries, breaks, week), 0);
}

export function getOTBalanceMinutes(entries, breaks, compoffSpends) {
  const earned = getTotalOTMinutes(entries, breaks);
  const spent = compoffSpends.reduce((sum, c) => sum + c.minutes, 0);
  return earned - spent;
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export function formatTime(isoString) {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function isoToTimeInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function toISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, mo, day] = dateStr.split('-').map(Number);
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(y, mo - 1, day, h, m, 0, 0).toISOString();
}

export function getUniqueMonths(entries) {
  const months = new Set(entries.map(e => e.date.slice(0, 7)));
  return Array.from(months).sort().reverse();
}

export function getUniqueWeeks(entries) {
  const weeks = new Set(entries.filter(e => e.clockOut).map(e => getWeekStart(e.date)));
  return Array.from(weeks).sort().reverse();
}

export function getMonthLabel(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getWeekLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const s = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}
