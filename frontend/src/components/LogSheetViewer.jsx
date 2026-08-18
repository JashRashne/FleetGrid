import React, { useState } from 'react';
import DailyLogSheet from './DailyLogSheet';
import { FileText, Printer, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function LogSheetViewer({ dailyLogs }) {
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  if (!dailyLogs || dailyLogs.length === 0) return null;

  const currentLog = dailyLogs[activeDayIdx] || dailyLogs[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="clay-card log-viewer-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={20} color="#2563eb" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
            FMCSA Driver's Daily Log Sheets ({dailyLogs.length} Day{dailyLogs.length > 1 ? 's' : ''})
          </h3>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="clay-btn"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Printer size={16} />
          Print / PDF Export
        </button>
      </div>

      {/* Day Selector Tabs */}
      {dailyLogs.length > 1 && (
        <div className="log-day-tabs">
          {dailyLogs.map((log, idx) => (
            <button
              key={idx}
              type="button"
              className={`day-tab-btn ${activeDayIdx === idx ? 'active' : ''}`}
              onClick={() => setActiveDayIdx(idx)}
            >
              <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Day {log.day_number} ({log.date})
            </button>
          ))}
        </div>
      )}

      {/* Daily Log Sheet Rendered SVG */}
      <DailyLogSheet
        logData={currentLog}
        dayIndex={activeDayIdx}
        totalDays={dailyLogs.length}
      />
    </div>
  );
}
