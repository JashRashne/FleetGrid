import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, Truck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function AuthPage() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [email, setEmail] = useState('alex.morgan@mintfleet.com');
  const [password, setPassword] = useState('••••••••');
  const [driverName, setDriverName] = useState('Alex Morgan');
  const [isRegister, setIsRegister] = useState(false);

  useDocumentTitle(isRegister ? 'Register · MileMint' : 'Sign In · MileMint');

  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const submit = (event) => {
    event.preventDefault();
    login(email, driverName);
    navigate(from, { replace: true });
  };

  const demo = () => {
    loginDemo();
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-minimal-page">
      <header className="auth-minimal-header">
        <Link to="/" className="minimal-brand"><span className="minimal-brand-mark">m</span><span>milemint</span></Link>
        <Link className="auth-minimal-back" to="/"><ArrowLeft size={15} /> Back to home</Link>
      </header>

      <main className="auth-minimal-main">
        <section className="auth-minimal-intro">
          <p className="minimal-eyebrow">DRIVER PORTAL</p>
          <h1>{isRegister ? 'Create your driver account.' : 'A clear start to every trip.'}</h1>
          <p>Plan routes, review hours, and keep your daily logs in one place.</p>
          <ul>
            <li><ShieldCheck size={16} /> FMCSA-aware trip planning</li>
            <li><Truck size={16} /> Built for property-carrying drivers</li>
          </ul>
        </section>

        <section className="auth-minimal-card">
          <div className="auth-minimal-card-heading">
            <span>{isRegister ? 'NEW ACCOUNT' : 'SIGN IN'}</span>
            <h2>{isRegister ? 'Your details' : 'Welcome back'}</h2>
            <p>{isRegister ? 'Set up a profile to start planning.' : 'Use the demo profile or sign in below.'}</p>
          </div>

          <button type="button" className="auth-demo-button" onClick={demo}>Continue as demo driver <ArrowRight size={16} /></button>
          <div className="auth-minimal-divider"><span>or continue with email</span></div>

          <form className="auth-minimal-form" onSubmit={submit}>
            {isRegister && <label>Full name<span className="auth-input"><User size={16} /><input required value={driverName} onChange={(event) => setDriverName(event.target.value)} /></span></label>}
            <label>Email address<span className="auth-input"><Mail size={16} /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></span></label>
            <label>Password<span className="auth-input"><Lock size={16} /><input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></span></label>
            <button type="submit" className="auth-submit-button">{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
          </form>

          <p className="auth-minimal-switch">{isRegister ? 'Already have an account?' : 'New to MileMint?'} <button type="button" onClick={() => setIsRegister((value) => !value)}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
        </section>
      </main>
      <footer className="auth-minimal-footer">Planning support for 49 CFR Part 395.</footer>
    </div>
  );
}
