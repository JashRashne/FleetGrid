import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Menu, Route, ShieldCheck, X, FileText, LayoutDashboard, PlusCircle, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const quickWays = [
  {
    number: '01',
    title: 'Trip Planner',
    text: 'Calculate compliant routes, mandatory breaks, and fuel stops with FMCSA HOS checks.',
    to: '/plan',
    cta: 'Open Planner'
  },
  {
    number: '02',
    title: 'Trip Archive',
    text: 'Browse your saved routes, trip metrics, and delivery timelines.',
    to: '/trips',
    cta: 'View Trips'
  },
  {
    number: '03',
    title: 'Daily ELD Logs',
    text: 'Inspect and print generated 24-hour grid log sheets for roadside inspection.',
    to: '/logs',
    cta: 'View Logs'
  }
];

export default function NotFoundPage() {
  useDocumentTitle('404 Not Found');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="minimal-landing">
      <div className="minimal-frame">
        {/* Standard MileMint Header */}
        <header className="minimal-header">
          <Link to="/" className="minimal-brand">
            <span className="minimal-brand-mark">m</span>
            <span>milemint</span>
          </Link>

          <nav className={`minimal-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/plan" onClick={() => setMenuOpen(false)}>Plan Trip</Link>
                <Link to="/trips" onClick={() => setMenuOpen(false)}>Trips</Link>
                <Link to="/logs" onClick={() => setMenuOpen(false)}>Logs</Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </nav>

          <button className="minimal-header-cta" onClick={handlePrimaryAction}>
            {isAuthenticated ? 'Open dashboard' : 'Return home'} <ArrowRight size={17} />
          </button>
          <button
            className="minimal-menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </header>

        {/* 404 Hero Section matching Landing Page Layout */}
        <main>
          <section className="minimal-hero">
            <div className="minimal-hero-copy">
              <p className="minimal-eyebrow">ERROR 404 / WAYPOINT NOT FOUND</p>
              <h1>Off the route.<br /><span>Waypoint missing.</span></h1>
              <p className="minimal-description">
                The requested URL path does not exist in the dispatch manifest. Head back to your active route or jump into the dashboard.
              </p>
              <div className="minimal-actions">
                <button className="minimal-primary" onClick={handlePrimaryAction}>
                  {isAuthenticated ? 'Back to dashboard' : 'Back to home'} <ArrowRight size={18} />
                </button>
                <button 
                  className="minimal-text-link" 
                  onClick={() => navigate(-1)}
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid #202020', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <ArrowLeft size={16} style={{ display: 'inline', marginRight: '6px' }} /> Go back
                </button>
              </div>
            </div>

            {/* Manifest Card styled exactly like landing page trip-brief */}
            <aside className="trip-brief" aria-label="Route diagnostic summary">
              <div className="trip-brief-topline">
                <span>DISPATCH DIAGNOSTIC</span>
                <span style={{ color: '#d9534f' }}>STATUS 404</span>
              </div>
              <div className="trip-brief-route">
                <div>
                  <i className="brief-pin start" />
                  <span>Requested path</span>
                  <b style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
                    {location.pathname || '/unknown'}
                  </b>
                </div>
                <span className="brief-line" />
                <div>
                  <i className="brief-pin stop" />
                  <span>Status</span>
                  <b style={{ color: '#c0392b' }}>Unmapped waypoint</b>
                </div>
                <span className="brief-line" />
                <div>
                  <i className="brief-pin end" />
                  <span>Suggested detour</span>
                  <b>{isAuthenticated ? 'Driver Dashboard' : 'Public Portal'}</b>
                </div>
              </div>
              <div className="trip-brief-stats">
                <div>
                  <span>Signal</span>
                  <b>Off-grid</b>
                </div>
                <div>
                  <span>Action</span>
                  <b>Detour</b>
                </div>
                <div>
                  <span>HOS status</span>
                  <b className="brief-ready"><Check size={14} /> Ready</b>
                </div>
              </div>
              <div className="trip-brief-footer">
                <Route size={16} /> Choose a destination below to continue.
              </div>
            </aside>
          </section>

          {/* Quick navigation cards matching .minimal-benefits */}
          <section className="minimal-benefits">
            {quickWays.map((item) => (
              <article key={item.number} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span>{item.number}</span>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <Link 
                    to={item.to} 
                    className="minimal-text-link" 
                    style={{ height: 'auto', paddingBottom: '4px', fontSize: '13px', fontWeight: 500 }}
                  >
                    {item.cta} <ArrowRight size={14} style={{ marginLeft: '6px' }} />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </main>

        {/* Standard MileMint Footer */}
        <footer className="minimal-footer">
          <span>© 2026 MileMint</span>
          <span>Planning support for 49 CFR Part 395.</span>
          <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
            {isAuthenticated ? 'Open dashboard' : 'Return home'} <ArrowRight size={15} />
          </button>
        </footer>
      </div>
    </div>
  );
}
