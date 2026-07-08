import { useState, useEffect } from 'react';
import {
  formatDuration,
  getDurationMinutes,
  formatTime,
  today,
  formatDateLong,
  getDailyMinutes,
  getDailyBreakMinutes,
  getDailyNetMinutes,
  getWeeklyNetMinutes,
  getWeeklyOTMinutes,
  getWeekStart,
  getEntriesForDate,
  toISO,
  DEFAULT_DAY,
  WEEKLY_OT_THRESHOLD,
} from '../utils/calculations';
import ManualEntryModal from './ManualEntryModal';
import BreakModal from './BreakModal';

export default function ClockPanel({
  entries, breaks, activeSession, clockIn, clockOut,
  addManualEntry, updateEntry, deleteEntry, addBreak, deleteBreak,
}) {
  const [now, setNow] = useState(new Date());
  const [showManual, setShowManual] = useState(false);
  const [showBreak, setShowBreak] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null);
  const [confirmDeleteBreak, setConfirmDeleteBreak] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayStr = today();
  const weekStart = getWeekStart(todayStr);

  const todayEntries = getEntriesForDate(entries, todayStr)
    .sort((a, b) => new Date(a.clockIn) - new Date(b.clockIn));
  const todayBreaks = breaks.filter(b => b.date === todayStr);

  // Today net = completed clocked time + active session - breaks
  const completedMinutes = getDailyMinutes(entries, todayStr);
  const breakMinutesToday = getDailyBreakMinutes(breaks, todayStr);
  const activeMinutes = activeSession
    ? getDurationMinutes(activeSession.clockIn, now.toISOString())
    : 0;
  const todayNetMinutes = Math.max(0, completedMinutes + activeMinutes - breakMinutesToday);

  // Week stats (completed entries only, not active session - close enough for display)
  const weekNetCompleted = getWeeklyNetMinutes(entries, breaks, weekStart);
  // Add live active session to week net
  const weekNetTotal = weekNetCompleted + activeMinutes;
  const weekOTMinutes = Math.max(0, weekNetTotal - WEEKLY_OT_THRESHOLD);
  const weekRemainingToOT = Math.max(0, WEEKLY_OT_THRESHOLD - weekNetTotal);

  const weekProgressPct = Math.min(100, (weekNetTotal / WEEKLY_OT_THRESHOLD) * 100);

  function handleQuickDefaultDay() {
    const clockInISO = toISO(todayStr, DEFAULT_DAY.start);
    const clockOutISO = toISO(todayStr, DEFAULT_DAY.end);
    addManualEntry(todayStr, clockInISO, clockOutISO, '');
    addBreak(todayStr, DEFAULT_DAY.breakMinutes, DEFAULT_DAY.breakNote);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Date + clock */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-400">{formatDateLong(todayStr)}</p>
        <p className="text-4xl font-mono font-bold text-gray-800 mt-0.5 tracking-tight">
          {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">Today</p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">{formatDuration(todayNetMinutes)}</p>
          {breakMinutesToday > 0 && (
            <p className="text-xs text-orange-400 mt-0.5">−{formatDuration(breakMinutesToday)} break</p>
          )}
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">This Week</p>
          <p className="text-xl font-bold text-indigo-700 mt-0.5">{formatDuration(weekNetTotal)}</p>
          <p className="text-xs text-indigo-300 mt-0.5">{(weekNetTotal / 60).toFixed(1)}h / 40h</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${weekOTMinutes > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${weekOTMinutes > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
            {weekOTMinutes > 0 ? 'Week OT' : 'To OT'}
          </p>
          <p className={`text-xl font-bold mt-0.5 ${weekOTMinutes > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {weekOTMinutes > 0
              ? `+${formatDuration(weekOTMinutes)}`
              : formatDuration(weekRemainingToOT)}
          </p>
        </div>
      </div>

      {/* Week progress bar toward 40h */}
      <div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              weekOTMinutes > 0 ? 'bg-amber-400' : 'bg-indigo-400'
            }`}
            style={{ width: `${weekProgressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">
          Weekly progress toward 40h OT threshold
        </p>
      </div>

      {/* Active session indicator */}
      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600">
            Clocked in at <span className="font-semibold">{formatTime(activeSession.clockIn)}</span>
          </p>
          <p className="text-3xl font-mono font-bold text-green-700 mt-1">
            {formatDuration(activeMinutes)}
          </p>
          <p className="text-xs text-green-400 mt-0.5">current session</p>
        </div>
      )}

      {/* Main clock button */}
      {!activeSession ? (
        <button
          onClick={() => clockIn()}
          className="w-full py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-2xl font-bold rounded-2xl shadow-lg shadow-green-200 transition-all"
        >
          CLOCK IN
        </button>
      ) : (
        <button
          onClick={clockOut}
          className="w-full py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-2xl font-bold rounded-2xl shadow-lg shadow-red-200 transition-all"
        >
          CLOCK OUT
        </button>
      )}

      {/* Secondary action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowBreak(true)}
          className="py-3 border-2 border-dashed border-orange-200 text-orange-400 rounded-xl hover:border-orange-400 hover:text-orange-500 transition-colors font-medium text-sm"
        >
          + Log Break
        </button>
        <button
          onClick={() => { setEditEntry(null); setShowManual(true); }}
          className="py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-blue-300 hover:text-blue-500 transition-colors font-medium text-sm"
        >
          + Manual Entry
        </button>
      </div>

      {!activeSession && todayEntries.length === 0 && (
        <button
          onClick={handleQuickDefaultDay}
          className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-500 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors font-medium text-sm"
        >
          ⚡ Add Default Day (10:00 AM – 6:30 PM, 30 min break)
        </button>
      )}

      {/* Today's sessions */}
      {(todayEntries.length > 0 || todayBreaks.length > 0) && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Today&apos;s Activity
          </h2>
          <div className="space-y-2">
            {/* Work sessions */}
            {todayEntries.map(entry => {
              const dur = entry.clockOut
                ? getDurationMinutes(entry.clockIn, entry.clockOut)
                : activeMinutes;
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.clockOut ? 'bg-blue-300' : 'bg-green-400 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      {formatTime(entry.clockIn)}
                      {' → '}
                      {entry.clockOut
                        ? formatTime(entry.clockOut)
                        : <span className="text-green-500">now</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDuration(dur)}
                      {entry.isManual && (
                        <span className="ml-2 bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded text-xs">manual</span>
                      )}
                    </p>
                    {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditEntry(entry); setShowManual(true); }}
                      className="text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-xs"
                    >
                      Edit
                    </button>
                    {confirmDeleteEntry === entry.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { deleteEntry(entry.id); setConfirmDeleteEntry(null); }}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteEntry(null)}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteEntry(entry.id)}
                        className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Breaks */}
            {todayBreaks.map(brk => (
              <div
                key={brk.id}
                className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-orange-300" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-orange-700 text-sm">
                    {brk.note || 'Break'}
                    <span className="ml-2 bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded text-xs">break</span>
                  </p>
                  <p className="text-xs text-orange-400 mt-0.5">−{formatDuration(brk.minutes)}</p>
                </div>
                {confirmDeleteBreak === brk.id ? (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { deleteBreak(brk.id); setConfirmDeleteBreak(null); }}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteBreak(null)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteBreak(brk.id)}
                    className="text-orange-200 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showBreak && (
        <BreakModal
          onSave={(date, minutes, note) => {
            addBreak(date, minutes, note);
            setShowBreak(false);
          }}
          onClose={() => setShowBreak(false)}
        />
      )}

      {showManual && (
        <ManualEntryModal
          entry={editEntry}
          onSave={(date, clockInISO, clockOutISO, note, breakMinutes) => {
            if (editEntry) {
              updateEntry(editEntry.id, {
                date, clockIn: clockInISO, clockOut: clockOutISO, note, isManual: true,
              });
            } else {
              addManualEntry(date, clockInISO, clockOutISO, note);
            }
            if (breakMinutes > 0) {
              addBreak(date, breakMinutes, DEFAULT_DAY.breakNote);
            }
            setShowManual(false);
          }}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
