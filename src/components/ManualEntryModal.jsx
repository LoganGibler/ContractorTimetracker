import { useState, useEffect } from 'react';
import { today, isoToTimeInput, toISO } from '../utils/calculations';

export default function ManualEntryModal({ entry, onSave, onClose }) {
  const [date, setDate] = useState(entry ? entry.date : today());
  const [clockInTime, setClockInTime] = useState(entry ? isoToTimeInput(entry.clockIn) : '');
  const [clockOutTime, setClockOutTime] = useState(entry ? isoToTimeInput(entry.clockOut) : '');
  const [note, setNote] = useState(entry ? entry.note || '' : '');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleSave() {
    if (!date) return setError('Date is required.');
    if (!clockInTime) return setError('Clock-in time is required.');

    const clockInISO = toISO(date, clockInTime);
    const clockOutISO = clockOutTime ? toISO(date, clockOutTime) : null;

    if (clockOutISO && clockOutISO <= clockInISO) {
      return setError('Clock-out must be after clock-in.');
    }

    setError('');
    onSave(date, clockInISO, clockOutISO, note);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {entry ? 'Edit Entry' : 'Add Manual Entry'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Clock In</label>
              <input
                type="time"
                value={clockInTime}
                onChange={e => setClockInTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Clock Out <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={clockOutTime}
                onChange={e => setClockOutTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Client call, on-call shift…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            {entry ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
