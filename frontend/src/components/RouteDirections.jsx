import React, { useState } from 'react';
import { Navigation, ChevronDown, ChevronUp } from 'lucide-react';

export default function RouteDirections({ steps }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="clay-card timeline-card">
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Navigation size={18} color="#10b981" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            Turn-by-Turn Route Instructions ({steps.length} Segments)
          </h3>
        </div>
        <button type="button" className="clay-pill" style={{ border: 'none', cursor: 'pointer' }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="timeline-list">
          {steps.map((step, idx) => (
            <div key={idx} className="timeline-item" style={{ padding: '10px 14px' }}>
              <div style={{ fontWeight: 700, color: '#3b82f6', minWidth: '24px', fontSize: '13px' }}>
                {idx + 1}.
              </div>
              <div style={{ flex: 1, fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{step.instruction}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {step.distance_miles} miles • {step.duration_minutes} mins
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
