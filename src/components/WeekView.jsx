import { useState } from 'react';
import {
  getWeekStart,
  getWeekDates,
  getDailyMinutes,
  getDailyBreakMinutes,
  getDailyNetMinutes,
  getWeeklyNetMinutes,
  getWeeklyOTMinutes,
  formatDuration,
  addDays,
  getWeekLabel,
  today,
  WEEKLY_OT_THRESHOLD,
} from '../utils/calculations';

export default function WeekView({ entries, breaks }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today()));

  const todayStr = today();
  const weekDates = getWeekDates(weekStart);
  const weeklyNet = getWeeklyNetMinutes(entries, breaks, weekStart);
  const weeklyOT = getWeeklyOTMinutes(entries, breaks, weekStart);
  const isCurrentWeek = weekStart === getWeekStart(todayStr);
  const weekProgressPct = Math.min(100, (weeklyNet / WEEKLY_OT_THRESHOLD) * 100);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(prev => addDays(prev, -7))}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{getWeekLabel(weekStart)}</p>
          {isCurrentWeek && (
            <span className="text-xs text-blue-500 font-medium">Current Week</span>
          )}
        </div>
        <button
          onClick={() => setWeekStart(prev => addDays(prev, 7))}
          disabled={isCurrentWeek}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Week summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">Net Hours</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{formatDuration(weeklyNet)}</p>
          <p className="text-xs text-indigo-400 mt-0.5">{(weeklyNet / 60).toFixed(1)}h of 40h</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${weeklyOT > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${weeklyOT > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
            Week OT
          </p>
          <p className={`text-2xl font-bold mt-1 ${weeklyOT > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
            {weeklyOT > 0 ? `+${formatDuration(weeklyOT)}` : '--'}
          </p>
          <p className={`text-xs mt-0.5 ${weeklyOT > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
            {weeklyOT > 0 ? `${(weeklyOT / 60).toFixed(2)} OT hrs` : 'Need 40h+ for OT'}
          </p>
        </div>
      </div>

      {/* 40h week progress bar */}
      <div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${weeklyOT > 0 ? 'bg-amber-400' : 'bg-indigo-400'}`}
            style={{ width: `${weekProgressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0h</span>
          <span className={weeklyOT > 0 ? 'text-amber-500 font-medium' : ''}>
            {weeklyOT > 0
              ? `OT: +${(weeklyOT / 60).toFixed(2)}h`
              : `${((WEEKLY_OT_THRESHOLD - weeklyNet) / 60).toFixed(1)}h to OT`}
          </span>
          <span>40h</span>
        </div>
      </div>

      {/* Day-by-day breakdown */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daily Breakdown</h2>
        {weekDates.map((date, i) => {
          const grossMin = getDailyMinutes(entries, date);
          const breakMin = getDailyBreakMinutes(breaks, date);
          const netMin = getDailyNetMinutes(entries, breaks, date);
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          const sessionsCount = entries.filter(e => e.date === date && e.clockOut).length;
          const breakCount = breaks.filter(b => b.date === date).length;
          // Progress bar: day's net hours as fraction of 8h (informational only, not OT)
          const dayPct = Math.min(100, (netMin / (8 * 60)) * 100);

          return (
            <div
              key={date}
              className={`rounded-xl border p-3 transition-colors ${
                isToday
                  ? 'border-blue-200 bg-blue-50/50'
                  : isFuture
                  ? 'border-gray-100 bg-gray-50/30 opacity-50'
                  : netMin > 0
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                    {dayNames[i]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {isToday && (
                    <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">today</span>
                  )}
                </div>
                <div className="text-right">
                  {netMin > 0 ? (
                    <div className="flex items-center gap-2">
                      {breakMin > 0 && (
                        <span className="text-xs text-orange-400">−{formatDuration(breakMin)}</span>
                      )}
                      <span className="text-sm font-bold text-gray-700">
                        {formatDuration(netMin)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300">{isFuture ? '' : '—'}</span>
                  )}
                </div>
              </div>

              {!isFuture && netMin > 0 && (
                <div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-indigo-300"
                      style={{ width: `${dayPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {sessionsCount} session{sessionsCount !== 1 ? 's' : ''}
                    {breakCount > 0 && ` · ${breakCount} break${breakCount !== 1 ? 's' : ''}`}
                    {grossMin !== netMin && ` · ${(grossMin / 60).toFixed(2)}h gross`}
                    {' · '}{(netMin / 60).toFixed(2)}h net
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isCurrentWeek && (
        <button
          onClick={() => setWeekStart(getWeekStart(todayStr))}
          className="w-full py-2.5 text-sm text-blue-500 font-medium border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
        >
          Jump to Current Week
        </button>
      )}
    </div>
  );
}
