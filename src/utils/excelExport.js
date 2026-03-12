import * as XLSX from 'xlsx';
import {
  getDurationMinutes,
  getDailyMinutes,
  getDailyBreakMinutes,
  getDailyNetMinutes,
  getWeekStart,
  getWeeklyNetMinutes,
  getWeeklyOTMinutes,
  getUniqueWeeks,
  getUniqueMonths,
  formatDecimalHours,
  getWeekLabel,
  getMonthLabel,
  getTotalOTMinutes,
} from './calculations';

function formatTimeCell(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDateCell(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function exportToExcel(entries, breaks, compoffSpends, dateRange = null) {
  const wb = XLSX.utils.book_new();

  const filtered = dateRange
    ? entries.filter(e => e.date >= dateRange.start && e.date <= dateRange.end)
    : entries;
  const filteredBreaks = dateRange
    ? breaks.filter(b => b.date >= dateRange.start && b.date <= dateRange.end)
    : breaks;

  const completedEntries = filtered
    .filter(e => e.clockOut)
    .sort((a, b) => new Date(a.clockIn) - new Date(b.clockIn));

  // --- Sheet 1: All Time Entries ---
  const entriesData = [
    ['Date', 'Day', 'Clock In', 'Clock Out', 'Duration (hrs)', 'Break (hrs)', 'Net (hrs)', 'Note'],
  ];

  const allDates = [...new Set(completedEntries.map(e => e.date))].sort();
  allDates.forEach(date => {
    const dayEntries = completedEntries.filter(e => e.date === date);
    const gross = getDailyMinutes(completedEntries, date);
    const breakMin = getDailyBreakMinutes(filteredBreaks, date);
    const net = getDailyNetMinutes(completedEntries, filteredBreaks, date);
    const dayBreaks = filteredBreaks.filter(b => b.date === date);

    dayEntries.forEach((entry, idx) => {
      const dur = getDurationMinutes(entry.clockIn, entry.clockOut);
      entriesData.push([
        idx === 0 ? formatDateCell(date) : '',
        idx === 0 ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }) : '',
        formatTimeCell(entry.clockIn),
        formatTimeCell(entry.clockOut),
        parseFloat(formatDecimalHours(dur)),
        '',
        '',
        entry.note || '',
      ]);
    });

    // Break rows
    dayBreaks.forEach(brk => {
      entriesData.push([
        '', '', '', `Break: ${brk.note || 'Break'}`,
        '',
        parseFloat(formatDecimalHours(brk.minutes)),
        '',
        '',
      ]);
    });

    // Day subtotal
    entriesData.push([
      '', '', '', 'Day Total:',
      parseFloat(formatDecimalHours(gross)),
      parseFloat(formatDecimalHours(breakMin)),
      parseFloat(formatDecimalHours(net)),
      '',
    ]);
    entriesData.push(['']);
  });

  const wsEntries = XLSX.utils.aoa_to_sheet(entriesData);
  wsEntries['!cols'] = [
    { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsEntries, 'Time Entries');

  // --- Sheet 2: Weekly Summary (40h OT rule) ---
  const weeks = getUniqueWeeks(filtered).reverse();
  const weeklyData = [
    ['Week', 'Days Worked', 'Gross Hours', 'Break Hours', 'Net Hours', 'OT Hours (>40h/wk)'],
  ];
  weeks.forEach(weekStart => {
    const weekDates = filtered
      .filter(e => e.clockOut && getWeekStart(e.date) === weekStart)
      .map(e => e.date);
    const daysWorked = new Set(weekDates).size;
    const netMin = getWeeklyNetMinutes(filtered, filteredBreaks, weekStart);
    const grossMin = weekDates.reduce(
      (s, d) => s + getDailyMinutes(filtered.filter(e => getWeekStart(e.date) === weekStart), d), 0
    );
    const breakMin = weekDates.reduce(
      (s, d) => s + getDailyBreakMinutes(filteredBreaks, d), 0
    );
    const otMin = getWeeklyOTMinutes(filtered, filteredBreaks, weekStart);
    weeklyData.push([
      getWeekLabel(weekStart),
      daysWorked,
      parseFloat(formatDecimalHours(grossMin)),
      parseFloat(formatDecimalHours(breakMin)),
      parseFloat(formatDecimalHours(netMin)),
      otMin > 0 ? parseFloat(formatDecimalHours(otMin)) : 0,
    ]);
  });
  const wsWeekly = XLSX.utils.aoa_to_sheet(weeklyData);
  wsWeekly['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Weekly Summary');

  // --- Sheet 3: Monthly Summary ---
  const months = getUniqueMonths(filtered).reverse();
  const monthlyData = [
    ['Month', 'Days Worked', 'Net Hours', 'OT Hours'],
  ];
  months.forEach(ym => {
    const monthEntries = filtered.filter(e => e.clockOut && e.date.startsWith(ym));
    const monthBreaksList = filteredBreaks.filter(b => b.date.startsWith(ym));
    const dates = [...new Set(monthEntries.map(e => e.date))];
    const net = dates.reduce((s, d) => s + getDailyNetMinutes(monthEntries, monthBreaksList, d), 0);
    // Monthly OT = sum of weekly OTs for weeks starting in this month
    const weeksInMonth = getUniqueWeeks(monthEntries).filter(w => w.startsWith(ym));
    const ot = weeksInMonth.reduce((s, w) => s + getWeeklyOTMinutes(filtered, filteredBreaks, w), 0);
    monthlyData.push([
      getMonthLabel(ym),
      dates.length,
      parseFloat(formatDecimalHours(net)),
      parseFloat(formatDecimalHours(ot)),
    ]);
  });
  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
  wsMonthly['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Summary');

  // --- Sheet 4: CompOff Log ---
  const totalOTEarned = getTotalOTMinutes(entries, breaks);
  const compoffData = [
    ['Date', 'Type', 'Hours', 'Note', 'Running OT Balance (hrs)'],
  ];
  let runningBalance = parseFloat(formatDecimalHours(totalOTEarned));
  compoffData.push(['—', 'OT Earned (all time)', parseFloat(formatDecimalHours(totalOTEarned)), '', runningBalance]);
  const sortedSpends = [...compoffSpends].sort((a, b) => a.date.localeCompare(b.date));
  sortedSpends.forEach(spend => {
    const hrs = parseFloat(formatDecimalHours(spend.minutes));
    runningBalance = parseFloat((runningBalance - hrs).toFixed(2));
    compoffData.push([
      formatDateCell(spend.date),
      'CompOff Spent',
      -hrs,
      spend.note || '',
      runningBalance,
    ]);
  });
  const wsCompoff = XLSX.utils.aoa_to_sheet(compoffData);
  wsCompoff['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 30 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsCompoff, 'CompOff Log');

  // --- Download ---
  const now = new Date();
  const fileName = `Timesheet_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
