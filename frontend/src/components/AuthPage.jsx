import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Truck, ArrowRight, ShieldCheck, CheckCircle2, 
  Lock, Mail, User, Sparkles, ArrowLeft
} from 'lucide-react';
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

  // If already authenticated, allow instant redirect
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, driverName);
    navigate(from, { replace: true });
  };

  const handleDemoLogin = () => {
    loginDemo();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="auth-logo">
          <span className="logo-mark"><Truck size={20} /></span>
          <span>mile<span>mint</span></span>
        </Link>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-top">
            <div className="auth-badge">
              <Sparkles size={14} />
              <span>Driver Portal</span>
            </div>
            <h1>{isRegister ? 'Create driver account' : 'Welcome back, driver'}</h1>
            <p>Access your ELD trip planner, compliant stop schedules, and daily logbooks.</p>
          </div>

          <div className="demo-login-box">
            <div className="demo-box-info">
              <b>⚡ Quick Access (Evaluation Mode)</b>
              <span>Test with pre-configured CDL-A driver profile & sample routes</span>
            </div>
            <button 
              type="button" 
              className="demo-login-btn"
              onClick={handleDemoLogin}
            >
              <span>Continue as Demo Driver</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label htmlFor="driverName">Full Name</label>
                <div className="input-with-icon">
                  <User size={17} className="input-icon" />
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

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@fleet.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              {isRegister ? 'Create Account' : 'Sign In'}
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-switch">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsRegister(false)}>
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New driver or fleet?{' '}
                <button type="button" onClick={() => setIsRegister(true)}>
                  Create an account
                </button>
              </span>
            )}
          </div>

          <div className="auth-compliance-footer">
            <ShieldCheck size={16} />
            <span>FMCSA 49 CFR Part 395 compliant calculations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
