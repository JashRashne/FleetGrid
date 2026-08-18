import React from 'react';
import { Truck, ShieldCheck, FileText, Navigation } from 'lucide-react';

export default function Header() {
  return (
    <header className="app-header clay-card">
      <div className="brand-section">
        <div className="brand-icon">
          <Truck size={26} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="brand-title">FMCSA ELD Trip Planner</h1>
          <p className="brand-subtitle">Automated 70-Hour / 8-Day HOS Compliance & Daily Log Sheet Generator</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span className="clay-pill clay-pill-blue">
          <ShieldCheck size={14} />
          49 CFR § 395 Compliant
        </span>
        <span className="clay-pill clay-pill-green">
          <FileText size={14} />
          24-Hour Grid Vector SVG
        </span>
      </div>
    </header>
  );
}
