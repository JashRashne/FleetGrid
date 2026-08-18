import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Truck, LayoutDashboard, PlusCircle, FileText, 
  LogOut, ShieldCheck, User, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan', label: 'Plan a Trip', icon: PlusCircle },
    { to: '/logs', label: 'Daily Logs', icon: FileText },
  ];

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon"><Truck size={20} /></span>
          <span className="brand-text">mile<span>mint</span></span>
          <span className="brand-badge">ELD</span>
        </Link>

        <nav className="navbar-links">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-link ${isActive ? 'active' : ''}`}
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
      </div>
    </header>
  );
}
