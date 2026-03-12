import { useState, useMemo } from 'react';
import {
  getDailyMinutes,
  getDailyNetMinutes,
  getDurationMinutes,
  formatDuration,
  formatDecimalHours,
  formatTime,
  formatDateShort,
  getUniqueMonths,
  getMonthLabel,
  getWeekStart,
  getWeeklyOTMinutes,
  getUniqueWeeks,
  today,
} from '../utils/calculations';
import { exportToExcel } from '../utils/excelExport';
import ManualEntryModal from './ManualEntryModal';

export default function History({
  entries, breaks, compoffSpends, addManualEntry, updateEntry, deleteEntry, deleteBreak,
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => today().slice(0, 7));
  const [showManual, setShowManual] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null);
  const [confirmDeleteBreak, setConfirmDeleteBreak] = useState(null);

  const months = useMemo(() => getUniqueMonths(entries), [entries]);
  const currentMonth = today().slice(0, 7);
  const allMonths = months.includes(currentMonth) ? months : [currentMonth, ...months];

  const monthEntries = useMemo(
    () => entries.filter(e => e.date.startsWith(selectedMonth) && e.clockOut),
    [entries, selectedMonth]
  );
  const monthBreaks = useMemo(
    () => breaks.filter(b => b.date.startsWith(selectedMonth)),
    [breaks, selectedMonth]
  );

  const allDates = useMemo(() => {
    const entryDates = monthEntries.map(e => e.date);
    const breakDates = monthBreaks.map(b => b.date);
    return [...new Set([...entryDates, ...breakDates])].sort().reverse();
  }, [monthEntries, monthBreaks]);

  const monthlyNet = useMemo(
    () => allDates.reduce((s, d) => s + getDailyNetMinutes(monthEntries, monthBreaks, d), 0),
    [allDates, monthEntries, monthBreaks]
  );

  // Monthly OT = sum of weekly OTs for weeks whose start falls in this month
  const monthlyOT = useMemo(() => {
    const weeks = getUniqueWeeks(entries);
    return weeks
      .filter(w => w.startsWith(selectedMonth))
      .reduce((s, w) => s + getWeeklyOTMinutes(entries, breaks, w), 0);
  }, [entries, breaks, selectedMonth]);

  function toggleDate(date) {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  }

  function handleExport() {
    const start = selectedMonth + '-01';
    const end = selectedMonth + '-31';
    exportToExcel(entries, breaks, compoffSpends, { start, end });
  }

  function handleExportAll() {
    exportToExcel(entries, breaks, compoffSpends);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Month selector */}
      <div className="flex items-center gap-2">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {allMonths.map(m => (
            <option key={m} value={m}>{getMonthLabel(m)}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditEntry(null); setShowManual(true); }}
          className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      {/* Month summary */}
      {allDates.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">Net Hrs</p>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">{formatDecimalHours(monthlyNet)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${monthlyOT > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${monthlyOT > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
              OT
            </p>
            <p className={`text-lg font-bold mt-0.5 ${monthlyOT > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
              {monthlyOT > 0 ? `+${formatDecimalHours(monthlyOT)}` : '0.00'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Days</p>
            <p className="text-lg font-bold text-gray-600 mt-0.5">{allDates.length}</p>
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 py-2.5 text-sm font-medium border border-green-300 text-green-600 rounded-xl hover:bg-green-50 transition-colors"
        >
          Export Month
        </button>
        <button
          onClick={handleExportAll}
          className="flex-1 py-2.5 text-sm font-medium border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
        >
          Export All
        </button>
      </div>

      {/* Entries list */}
      {allDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400 font-medium">No entries for {getMonthLabel(selectedMonth)}</p>
          <p className="text-sm text-gray-300 mt-1">Use Clock In or Add Manual Entry to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allDates.map(date => {
            const dayEntries = monthEntries
              .filter(e => e.date === date)
              .sort((a, b) => new Date(a.clockIn) - new Date(b.clockIn));
            const dayBreaks = monthBreaks.filter(b => b.date === date);
            const dailyNet = getDailyNetMinutes(monthEntries, monthBreaks, date);
            const breakTotal = dayBreaks.reduce((s, b) => s + b.minutes, 0);
            const isExpanded = expandedDates[date] !== false;

            return (
              <div key={date} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {/* Day header */}
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{formatDateShort(date)}</span>
                    <span className="text-xs text-gray-400">
                      {dayEntries.length} session{dayEntries.length !== 1 ? 's' : ''}
                      {dayBreaks.length > 0 && ` · ${dayBreaks.length} break${dayBreaks.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {breakTotal > 0 && (
                      <span className="text-xs text-orange-400">−{formatDuration(breakTotal)}</span>
                    )}
                    <span className="text-sm font-bold text-gray-700">
                      {formatDuration(dailyNet)}
                    </span>
                    <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {/* Sessions */}
                    {dayEntries.map(entry => {
                      const dur = getDurationMinutes(entry.clockIn, entry.clockOut);
                      return (
                        <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">
                              {formatTime(entry.clockIn)} → {formatTime(entry.clockOut)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDuration(dur)}
                              {entry.isManual && (
                                <span className="ml-1.5 bg-blue-100 text-blue-500 px-1 py-0.5 rounded text-xs">manual</span>
                              )}
                              {entry.note && ` · ${entry.note}`}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => { setEditEntry(entry); setShowManual(true); }}
                              className="text-blue-400 hover:text-blue-600 text-xs px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </button>
                            {confirmDeleteEntry === entry.id ? (
                              <>
                                <button
                                  onClick={() => { deleteEntry(entry.id); setConfirmDeleteEntry(null); }}
                                  className="text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                >
                                  Del
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteEntry(null)}
                                  className="text-gray-400 text-xs px-1 py-1"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteEntry(entry.id)}
                                className="text-gray-300 hover:text-red-400 text-xs px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Breaks */}
                    {dayBreaks.map(brk => (
                      <div key={brk.id} className="flex items-center gap-3 px-4 py-2.5 bg-orange-50/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-orange-700">
                            {brk.note || 'Break'}
                            <span className="ml-1.5 bg-orange-100 text-orange-500 px-1 py-0.5 rounded text-xs">break</span>
                          </p>
                          <p className="text-xs text-orange-400">−{formatDuration(brk.minutes)}</p>
                        </div>
                        {confirmDeleteBreak === brk.id ? (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => { deleteBreak(brk.id); setConfirmDeleteBreak(null); }}
                              className="text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors font-medium"
                            >
                              Del
                            </button>
                            <button
                              onClick={() => setConfirmDeleteBreak(null)}
                              className="text-gray-400 text-xs px-1 py-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteBreak(brk.id)}
                            className="text-orange-200 hover:text-red-400 text-xs px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showManual && (
        <ManualEntryModal
          entry={editEntry}
          onSave={(date, clockInISO, clockOutISO, note) => {
            if (editEntry) {
              updateEntry(editEntry.id, {
                date, clockIn: clockInISO, clockOut: clockOutISO, note, isManual: true,
              });
            } else {
              addManualEntry(date, clockInISO, clockOutISO, note);
            }
            setShowManual(false);
          }}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
