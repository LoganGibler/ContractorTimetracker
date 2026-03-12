import { useState } from 'react';
import { useTimesheet } from './hooks/useTimesheet';
import ClockPanel from './components/ClockPanel';
import WeekView from './components/WeekView';
import OTBank from './components/OTBank';
import History from './components/History';
import {
  getOTBalanceMinutes,
  formatDecimalHours,
  COMPOFF_MINUTES,
} from './utils/calculations';

const TABS = [
  { id: 'today', label: 'Today', icon: '⏱' },
  { id: 'week', label: 'Week', icon: '📅' },
  { id: 'ot', label: 'OT Bank', icon: '💼' },
  { id: 'history', label: 'History', icon: '📋' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const {
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
  } = useTimesheet();

  const otBalance = getOTBalanceMinutes(entries, breaks, compoffSpends);
  const canSpend = otBalance >= COMPOFF_MINUTES;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeSession && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
            <h1 className="text-base font-bold text-gray-800 tracking-tight">Timesheet</h1>
          </div>
          {/* OT balance pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              canSpend
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                : otBalance > 0
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'bg-gray-100 text-gray-400'
            }`}
            onClick={() => setActiveTab('ot')}
            title="View OT Bank"
          >
            <span>{canSpend ? '💼' : '⏱'}</span>
            <span>{formatDecimalHours(otBalance)}h OT</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-lg mx-auto px-4 pb-0 flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-6">
        {activeTab === 'today' && (
          <ClockPanel
            entries={entries}
            breaks={breaks}
            activeSession={activeSession}
            clockIn={clockIn}
            clockOut={clockOut}
            addManualEntry={addManualEntry}
            updateEntry={updateEntry}
            deleteEntry={deleteEntry}
            addBreak={addBreak}
            deleteBreak={deleteBreak}
          />
        )}
        {activeTab === 'week' && (
          <WeekView
            entries={entries}
            breaks={breaks}
          />
        )}
        {activeTab === 'ot' && (
          <OTBank
            entries={entries}
            breaks={breaks}
            compoffSpends={compoffSpends}
            spendCompOff={spendCompOff}
            deleteCompoffSpend={deleteCompoffSpend}
          />
        )}
        {activeTab === 'history' && (
          <History
            entries={entries}
            breaks={breaks}
            compoffSpends={compoffSpends}
            addManualEntry={addManualEntry}
            updateEntry={updateEntry}
            deleteEntry={deleteEntry}
            deleteBreak={deleteBreak}
          />
        )}
      </main>
    </div>
  );
}
