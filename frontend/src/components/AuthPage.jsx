import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Truck, ArrowRight, ShieldCheck, CheckCircle2, 
  Lock, Mail, User, Sparkles, ArrowLeft,
  Check, Star
} from 'lucide-react';
import plannerOnboardingClay from '../assets/planner-onboarding-clay.png';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('alex.morgan@mintfleet.com');
  const [password, setPassword] = useState('••••••••');
  const [driverName, setDriverName] = useState('Alex Morgan');
  const [isRegister, setIsRegister] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, driverName);
    navigate(from, { replace: true });
  };

  const handleDemoLogin = () => {
    loginDemo();
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Showcase Side (Desktop / Laptop) */}
      <aside className="auth-showcase-panel">
        <div className="showcase-header">
          <Link to="/" className="showcase-brand">
            <span className="showcase-logo-mark"><Truck size={20} /></span>
            <span className="showcase-brand-text">mile<span>mint</span></span>
            <span className="showcase-badge">ELD</span>
          </Link>
          <span className="showcase-tag">
            <Sparkles size={13} />
            <span>Built for Drivers</span>
          </span>
        </div>

        <div className="showcase-content">
          <h1 className="showcase-heading">
            Compliant routes,<br />
            calm hours, and<br />
            <em>ready logs.</em>
          </h1>

          <p className="showcase-sub">
            The modern ELD trip planner designed around 49 CFR Part 395 rules. Plan your driving windows, breaks, and fuel stops in seconds.
          </p>

          <div className="showcase-highlights">
            <div className="highlight-item">
              <span className="hl-icon"><Check size={13} /></span>
              <span>70-Hour / 8-Day property rules calculated automatically</span>
            </div>
            <div className="highlight-item">
              <span className="hl-icon"><Check size={13} /></span>
              <span>30-min breaks & 10-hr sleeper berth resets scheduled</span>
            </div>
            <div className="highlight-item">
              <span className="hl-icon"><Check size={13} /></span>
              <span>24-Hour FMCSA daily logbook sheets with print export</span>
            </div>
          </div>

          <div className="showcase-visual">
            <img 
              src={plannerOnboardingClay} 
              alt="MileMint ELD Planning Platform" 
              className="showcase-art" 
            />
          </div>
        </div>

        <div className="showcase-footer">
          <div className="showcase-testimonial-compact">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <span>"Takes the guesswork out of my log clock calculations." — <b>Alex M., CDL-A</b></span>
          </div>
          <small>© 2026 MileMint Technologies</small>
        </div>
      </aside>

      {/* Right Form Side */}
      <main className="auth-form-panel">
        <div className="auth-form-top-nav">
          <Link to="/" className="auth-nav-back">
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
          <span className="auth-nav-badge">
            <ShieldCheck size={13} /> FMCSA 49 CFR § 395
          </span>
        </div>

        <div className="auth-form-card-wrapper">
          <div className="auth-card-header">
            <span className="card-badge">
              <Sparkles size={12} />
              <span>Driver Portal</span>
            </span>
            <h2>{isRegister ? 'Create driver account' : 'Welcome back, driver'}</h2>
            <p>Access your ELD trip planner, stop schedules, and daily logbook sheets.</p>
          </div>

          {/* Quick Demo Login Option */}
          <div className="demo-driver-callout">
            <div className="demo-callout-header">
              <div className="demo-icon-wrap">
                <Truck size={15} />
              </div>
              <div>
                <b>Instant Demo Access</b>
                <span>Jump straight into a pre-configured CDL-A driver profile</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-demo-quick"
              onClick={handleDemoLogin}
            >
              <span>Continue as Demo Driver (Alex Morgan)</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="auth-separator">
            <span>or sign in with email</span>
          </div>

          {/* Regular Login Form */}
          <form className="auth-fields-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="field-block">
                <label htmlFor="driverName">Full Name</label>
                <div className="field-input-wrap">
                  <User size={15} className="field-icon" />
                  <input
                    id="driverName"
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                  />
                </div>
              </div>
            )}

            <div className="field-block">
              <label htmlFor="email">Email Address</label>
              <div className="field-input-wrap">
                <Mail size={15} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@mintfleet.com"
                />
              </div>
            </div>

            <div className="field-block">
              <div className="label-row">
                <label htmlFor="password">Password</label>
              </div>
              <div className="field-input-wrap">
                <Lock size={15} className="field-icon" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button type="submit" className="btn-auth-submit">
              <span>{isRegister ? 'Create Driver Account' : 'Sign In to Portal'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="auth-footer-toggle">
            {isRegister ? (
              <span>
                Already registered?{' '}
                <button type="button" onClick={() => setIsRegister(false)}>
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New driver or carrier?{' '}
                <button type="button" onClick={() => setIsRegister(true)}>
                  Create an account
                </button>
              </span>
            )}
          </div>

          <div className="auth-guarantee-note">
            <ShieldCheck size={14} />
            <span>Compliant calculations matching official USDOT/FMCSA rulebooks</span>
          </div>
        </div>
      </main>
    </div>
  );
}
