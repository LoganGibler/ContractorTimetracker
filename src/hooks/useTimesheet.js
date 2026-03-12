import { useState, useEffect, useCallback } from 'react';
import { generateId, today } from '../utils/calculations';

const KEYS = {
  entries: 'ts_entries',
  compoffSpends: 'ts_compoff_spends',
  activeSession: 'ts_active_session',
  breaks: 'ts_breaks',
};

function load(key, def) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : def;
  } catch {
    return def;
  }
}

export function useTimesheet() {
  const [entries, setEntries] = useState(() => load(KEYS.entries, []));
  const [compoffSpends, setCompoffSpends] = useState(() => load(KEYS.compoffSpends, []));
  const [activeSession, setActiveSession] = useState(() => load(KEYS.activeSession, null));
  const [breaks, setBreaks] = useState(() => load(KEYS.breaks, []));

  useEffect(() => { localStorage.setItem(KEYS.entries, JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem(KEYS.compoffSpends, JSON.stringify(compoffSpends)); }, [compoffSpends]);
  useEffect(() => { localStorage.setItem(KEYS.activeSession, JSON.stringify(activeSession)); }, [activeSession]);
  useEffect(() => { localStorage.setItem(KEYS.breaks, JSON.stringify(breaks)); }, [breaks]);

  const clockIn = useCallback((note = '') => {
    setActiveSession({
      id: generateId(),
      date: today(),
      clockIn: new Date().toISOString(),
      clockOut: null,
      note,
    });
  }, []);

  const clockOut = useCallback(() => {
    setActiveSession(prev => {
      if (!prev) return null;
      const completed = { ...prev, clockOut: new Date().toISOString() };
      setEntries(e => [...e, completed]);
      return null;
    });
  }, []);

  const addManualEntry = useCallback((date, clockInISO, clockOutISO, note = '') => {
    const entry = {
      id: generateId(),
      date,
      clockIn: clockInISO,
      clockOut: clockOutISO || null,
      note,
      isManual: true,
    };
    setEntries(prev =>
      [...prev, entry].sort((a, b) => new Date(a.clockIn) - new Date(b.clockIn))
    );
  }, []);

  const updateEntry = useCallback((id, updates) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const addBreak = useCallback((date, minutes, note = 'Lunch') => {
    setBreaks(prev => [
      ...prev,
      { id: generateId(), date, minutes, note },
    ]);
  }, []);

  const deleteBreak = useCallback((id) => {
    setBreaks(prev => prev.filter(b => b.id !== id));
  }, []);

  const spendCompOff = useCallback((note = '') => {
    setCompoffSpends(prev => [
      ...prev,
      {
        id: generateId(),
        date: today(),
        minutes: 8 * 60,
        note: note || 'CompOff day taken',
      },
    ]);
  }, []);

  const deleteCompoffSpend = useCallback((id) => {
    setCompoffSpends(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    entries,
    compoffSpends,
    activeSession,
    breaks,
    clockIn,
    clockOut,
    addManualEntry,
    updateEntry,
    deleteEntry,
    addBreak,
    deleteBreak,
    spendCompOff,
    deleteCompoffSpend,
  };
}
