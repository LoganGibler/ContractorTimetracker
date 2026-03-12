import { useState, useEffect } from 'react';
import { today } from '../utils/calculations';

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hr', minutes: 60 },
];

export default function BreakModal({ onSave, onClose }) {
  const [date, setDate] = useState(today());
  const [minutes, setMinutes] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [note, setNote] = useState('Lunch');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handlePreset(m) {
    setMinutes(m);
    setUseCustom(false);
    setCustomMinutes('');
    setError('');
  }

  function handleSave() {
    const finalMinutes = useCustom ? parseInt(customMinutes, 10) : minutes;
    if (!finalMinutes || finalMinutes <= 0) return setError('Enter a valid break duration.');
    if (finalMinutes > 480) return setError('Break longer than 8 hours? Double-check this.');
    if (!date) return setError('Date is required.');
    setError('');
    onSave(date, finalMinutes, note);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Log Break</h2>
        <p className="text-sm text-gray-400 mb-5">Break time is subtracted from your worked hours.</p>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Duration presets */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Duration</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESETS.map(p => (
                <button
                  key={p.minutes}
                  onClick={() => handlePreset(p.minutes)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    !useCustom && minutes === p.minutes
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="480"
                placeholder="Custom minutes"
                value={customMinutes}
                onChange={e => {
                  setCustomMinutes(e.target.value);
                  setUseCustom(true);
                }}
                onFocus={() => setUseCustom(true)}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                  useCustom ? 'border-orange-400' : 'border-gray-300'
                }`}
              />
              <span className="text-sm text-gray-400">min</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Label</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Lunch, Coffee break, Doctor…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 bg-orange-50 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-orange-700">
            Logging <span className="font-bold">{useCustom ? (customMinutes || '?') : minutes} min</span> break
            {' '}on <span className="font-bold">{date}</span>
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Log Break
          </button>
        </div>
      </div>
    </div>
  );
}
