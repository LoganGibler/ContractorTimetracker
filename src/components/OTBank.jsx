import { useState } from 'react';
import {
  getTotalOTMinutes,
  getOTBalanceMinutes,
  formatDuration,
  formatDecimalHours,
  formatDateShort,
  COMPOFF_MINUTES,
  getUniqueWeeks,
  getWeeklyOTMinutes,
  getWeekLabel,
} from '../utils/calculations';

export default function OTBank({ entries, breaks, compoffSpends, spendCompOff, deleteCompoffSpend }) {
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [spendNote, setSpendNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const totalEarned = getTotalOTMinutes(entries, breaks);
  const balance = getOTBalanceMinutes(entries, breaks, compoffSpends);
  const totalSpent = compoffSpends.reduce((s, c) => s + c.minutes, 0);
  const canSpend = balance >= COMPOFF_MINUTES;
  const compoffDaysAvailable = Math.floor(balance / COMPOFF_MINUTES);
  const leftoverMinutes = balance % COMPOFF_MINUTES;

  // Weekly OT for the last 8 weeks
  const recentWeeks = getUniqueWeeks(entries).slice(0, 8);

  function handleSpend() {
    spendCompOff(spendNote);
    setSpendNote('');
    setShowSpendModal(false);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Balance hero */}
      <div className={`rounded-2xl p-6 text-center ${canSpend ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
        <p className="text-sm text-white/80 font-medium uppercase tracking-wide">OT Balance</p>
        <p className="text-5xl font-bold text-white mt-2">
          {formatDecimalHours(balance)}
          <span className="text-2xl font-normal ml-1">hrs</span>
        </p>
        <p className="text-sm text-white/70 mt-1">
          {formatDuration(balance)} accumulated
        </p>
        {compoffDaysAvailable > 0 && (
          <p className="text-sm text-white font-semibold mt-2 bg-white/20 rounded-full px-3 py-1 inline-block">
            {compoffDaysAvailable} CompOff day{compoffDaysAvailable !== 1 ? 's' : ''} available
            {leftoverMinutes > 0 && ` + ${formatDuration(leftoverMinutes)}`}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-green-500 font-semibold uppercase tracking-wide">Total Earned</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatDecimalHours(totalEarned)} hrs</p>
          <p className="text-xs text-green-400">{formatDuration(totalEarned)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-xs text-red-400 font-semibold uppercase tracking-wide">Total Spent</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatDecimalHours(totalSpent)} hrs</p>
          <p className="text-xs text-red-400">
            {compoffSpends.length} CompOff day{compoffSpends.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Spend CompOff button */}
      <button
        onClick={() => canSpend ? setShowSpendModal(true) : null}
        disabled={!canSpend}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
          canSpend
            ? 'bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white shadow-lg shadow-violet-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {canSpend
          ? `Spend 1 CompOff Day (−8h)`
          : `Need ${formatDuration(COMPOFF_MINUTES - balance)} more OT`}
      </button>

      {/* Weekly OT breakdown */}
      {recentWeeks.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Recent Weekly OT
          </h2>
          <div className="space-y-2">
            {recentWeeks.map(weekStart => {
              const weekOT = getWeeklyOTMinutes(entries, breaks, weekStart);
              return (
                <div key={weekStart} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">{getWeekLabel(weekStart)}</span>
                  {weekOT > 0 ? (
                    <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      +{formatDuration(weekOT)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-300">No OT</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CompOff history */}
      {compoffSpends.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            CompOff History
          </h2>
          <div className="space-y-2">
            {[...compoffSpends].reverse().map(spend => (
              <div key={spend.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{formatDateShort(spend.date)}</p>
                  <p className="text-xs text-gray-400">{spend.note}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-500">
                    −{formatDecimalHours(spend.minutes)}h
                  </span>
                  {confirmDeleteId === spend.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { deleteCompoffSpend(spend.id); setConfirmDeleteId(null); }}
                        className="text-xs text-red-500 font-medium hover:text-red-700 px-1.5"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1.5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(spend.id)}
                      className="text-gray-300 hover:text-red-400 p-1 rounded transition-colors text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spend modal */}
      {showSpendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSpendModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Spend CompOff Day</h2>
            <p className="text-sm text-gray-500 mb-4">
              This will deduct <span className="font-semibold text-violet-600">8 hours</span> from your OT balance.
              Your new balance will be <span className="font-semibold">{formatDecimalHours(balance - COMPOFF_MINUTES)} hrs</span>.
            </p>
            <label className="block text-sm font-medium text-gray-600 mb-1">Note (optional)</label>
            <input
              type="text"
              value={spendNote}
              onChange={e => setSpendNote(e.target.value)}
              placeholder="e.g. Took Monday off, sick day…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 mb-5"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSpend()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSpendModal(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSpend}
                className="flex-1 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
