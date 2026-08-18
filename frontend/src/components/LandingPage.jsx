import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Menu, Route, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const benefits = [
  ['01', 'Route planning', 'Build a trip around the stops that actually matter.'],
  ['02', 'Hours of service', 'Keep driving, break, and reset windows in view.'],
  ['03', 'Daily logs', 'Review and export a clear record for every day.']
];

export default function LandingPage() {
  useDocumentTitle('MileMint ELD');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const startPlanning = () => {
    if (isAuthenticated) navigate('/dashboard');
    else navigate('/login', { state: { from: { pathname: '/plan' } } });
  };

  return (
    <div className="minimal-landing">
      <div className="minimal-frame">
        <header className="minimal-header">
          <Link to="/" className="minimal-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="minimal-brand-mark">m</span>
            <span>milemint</span>
          </Link>

          <nav className={`minimal-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#compliance" onClick={() => setMenuOpen(false)}>Compliance</a>
            {isAuthenticated ? <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link> : <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>}
          </nav>

          <button className="minimal-header-cta" onClick={startPlanning}>
            {isAuthenticated ? `Open ${user?.name ? 'dashboard' : 'portal'}` : 'Plan a trip'} <ArrowRight size={17} />
          </button>
          <button className="minimal-menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </header>

        <main>
          <section className="minimal-hero" id="product">
            <div className="minimal-hero-copy">
              <p className="minimal-eyebrow">ELD TRIP PLANNING / MADE FOR DRIVERS</p>
              <h1>Plan the road.<br /><span>Keep the day clear.</span></h1>
              <p className="minimal-description">
                MileMint brings trip planning, hours-of-service checks, and daily logs into one calm workspace—so the next move is always obvious.
              </p>
              <div className="minimal-actions">
                <button className="minimal-primary" onClick={startPlanning}>Build a trip <ArrowRight size={18} /></button>
                <a className="minimal-text-link" href="#how-it-works">See how it works</a>
              </div>
            </div>

            <aside className="trip-brief" aria-label="Example trip summary">
              <div className="trip-brief-topline"><span>TRIP BRIEF</span><span>08 / 18 / 26</span></div>
              <div className="trip-brief-route">
                <div><i className="brief-pin start" /><span>Current location</span><b>Chicago, IL</b></div>
                <span className="brief-line" />
                <div><i className="brief-pin stop" /><span>Pickup</span><b>Indianapolis, IN</b></div>
                <span className="brief-line" />
                <div><i className="brief-pin end" /><span>Delivery</span><b>Atlanta, GA</b></div>
              </div>
              <div className="trip-brief-stats">
                <div><span>Distance</span><b>712 mi</b></div>
                <div><span>Drive window</span><b>13h 18m</b></div>
                <div><span>HOS status</span><b className="brief-ready"><Check size={14} /> Ready</b></div>
              </div>
              <div className="trip-brief-footer"><Route size={16} /> A practical plan, before you leave the yard.</div>
            </aside>
          </section>

          <section className="minimal-benefits" id="how-it-works">
            {benefits.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </section>

          <section className="minimal-compliance" id="compliance">
            <div>
              <p className="minimal-eyebrow">BUILT FOR THE REAL WORKDAY</p>
              <h2>Less paperwork.<br />More certainty.</h2>
            </div>
            <div className="compliance-copy">
              <p>MileMint accounts for the FMCSA property-carrying rules that shape a driver’s day: driving limits, duty windows, mandatory breaks, and 70-hour cycles.</p>
              <div><ShieldCheck size={18} /><span>Clear planning support for 49 CFR Part 395</span></div>
            </div>
          </section>
        </main>

        <footer className="minimal-footer">
          <span>© 2026 MileMint</span>
          <span>Built for the road ahead.</span>
          <button onClick={startPlanning}>Start planning <ArrowRight size={15} /></button>
        </footer>
      </div>
    </div>
  );
}
