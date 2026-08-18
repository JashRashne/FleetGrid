import React, { useState } from 'react';
import DailyLogSheet from './DailyLogSheet';
import { FileText, Printer, Calendar } from 'lucide-react';

export default function LogSheetViewer({ dailyLogs }) {
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  if (!dailyLogs || dailyLogs.length === 0) return null;

  const currentLog = dailyLogs[activeDayIdx] || dailyLogs[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="log-viewer-card log-sheet-viewer">
      <div className="log-sheet-viewer-header">
        <div className="log-sheet-viewer-title">
          <FileText size={20} />
          <h3>
            FMCSA Driver's Daily Log Sheets ({dailyLogs.length} Day{dailyLogs.length > 1 ? 's' : ''})
          </h3>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="log-sheet-print-button"
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
              <Calendar size={14} />
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
