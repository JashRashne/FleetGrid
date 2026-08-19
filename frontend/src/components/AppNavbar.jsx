import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, FileText, 
  LogOut, ShieldCheck, User, Sparkles, Route, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan', label: 'Plan a Trip', icon: PlusCircle },
    { to: '/trips', label: 'Trips', icon: Route },
    { to: '/logs', label: 'Daily Logs', icon: FileText },
  ];

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="minimal-brand navbar-brand">
          <span className="minimal-brand-mark">m</span>
          <span>milemint</span>
        </Link>

        <nav className={`navbar-links ${isMobileMenuOpen ? 'is-open' : ''}`} aria-label="Driver portal navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="navbar-right">
          <div className="compliance-tag" title="70-hour / 8-day rule active">
            <ShieldCheck size={15} />
            <span>FMCSA 70h/8d</span>
          </div>

          {user ? (
            <div className="user-profile-menu">
              <div className="driver-pill" title={`${user.name} - ${user.carrier}`}>
                <div className="avatar-circle">
                  <User size={15} />
                </div>
                <div className="driver-info">
                  <span className="driver-name">{user.name}</span>
                  <span className="driver-truck">{user.truckId}</span>
                </div>
              </div>

              <button 
                className="logout-btn" 
                onClick={handleLogout}
                title="Sign out to landing page"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="nav-login-btn">
              Sign In
            </Link>
          )}
        </div>

        <button
          className="navbar-mobile-toggle"
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X size={19} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
