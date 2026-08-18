import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Clock3, ShieldCheck, MapPin, 
  Route, Calendar, ArrowRight, Trash2, CheckCircle2, 
  FileText, Fuel, ExternalLink, Sparkles, Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppNavbar from './AppNavbar';

export default function DashboardPage() {
  const { user, savedTrips, deleteTrip, setActiveTrip } = useAuth();
  const navigate = useNavigate();

  const handleOpenTrip = (trip) => {
    setActiveTrip(trip);
    navigate(`/trip/${trip.id}`, { state: { loadTrip: trip } });
  };

  const handleQuickRoute = (current, pickup, dropoff) => {
    navigate('/plan', { state: { prefill: { current, pickup, dropoff } } });
  };

  const cycleUsed = user?.cycleHoursUsed || 26.5;
  const cycleLimit = user?.cycleLimit || 70.0;
  const cycleLeft = (cycleLimit - cycleUsed).toFixed(1);
  const cyclePct = Math.round((cycleUsed / cycleLimit) * 100);

  return (
    <div className="dashboard-page">
      <AppNavbar />

      <main className="dashboard-main">
        {/* Top Header Profile Banner */}
        <section className="dashboard-hero-banner">
          <div className="banner-driver-details">
            <span className="driver-greeting-badge">
              <Sparkles size={14} />
              <span>Active Duty Session</span>
            </span>
            <h1>Welcome, {user?.name || 'Driver'}</h1>
            <p>
              {user?.carrier || 'MileMint Logistics'} · Truck <b>{user?.truckId || 'TRK-9042'}</b> · DOT <b>{user?.dotNumber || '3849201'}</b>
            </p>
          </div>

          <div className="banner-actions">
            <button 
              className="btn-plan-primary" 
              onClick={() => navigate('/plan')}
            >
              <PlusCircle size={18} />
              <span>Plan New Trip</span>
            </button>
          </div>
        </section>

        {/* HOS Compliance Cards */}
        <section className="hos-clocks-grid">
          <div className="hos-clock-card primary-clock">
            <div className="clock-header">
              <span className="clock-icon"><Clock3 size={18} /></span>
              <span className="clock-title">70h / 8-Day Cycle</span>
            </div>
            <div className="clock-numbers">
              <strong className="clock-value">{cycleLeft}h</strong>
              <span className="clock-sub">remaining of {cycleLimit}h</span>
            </div>
            <div className="clock-progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${cyclePct}%` }}
              />
            </div>
            <div className="clock-footer">
              <span>{cycleUsed}h used in current cycle</span>
              <span className="badge-safe">Compliant</span>
            </div>
          </div>

          <div className="hos-clock-card">
            <div className="clock-header">
              <span className="clock-icon"><Route size={18} /></span>
              <span className="clock-title">11-Hour Driving Clock</span>
            </div>
            <div className="clock-numbers">
              <strong className="clock-value">8.7h</strong>
              <span className="clock-sub">available before 10h break</span>
            </div>
            <div className="clock-progress-bar">
              <div className="progress-fill fill-green" style={{ width: '79%' }} />
            </div>
            <div className="clock-footer">
              <span>2.3h driven today</span>
              <span className="badge-safe">Ready</span>
            </div>
          </div>

          <div className="hos-clock-card">
            <div className="clock-header">
              <span className="clock-icon"><ShieldCheck size={18} /></span>
              <span className="clock-title">14-Hour Shift Window</span>
            </div>
            <div className="clock-numbers">
              <strong className="clock-value">11.2h</strong>
              <span className="clock-sub">remaining in active shift</span>
            </div>
            <div className="clock-progress-bar">
              <div className="progress-fill fill-orange" style={{ width: '80%' }} />
            </div>
            <div className="clock-footer">
              <span>Shift started: 06:00 AM</span>
              <span className="badge-safe">Active</span>
            </div>
          </div>

          <div className="hos-clock-card">
            <div className="clock-header">
              <span className="clock-icon"><Calendar size={18} /></span>
              <span className="clock-title">Next 34-Hour Restart</span>
            </div>
            <div className="clock-numbers">
              <strong className="clock-value">In 4 Days</strong>
              <span className="clock-sub">or after 70h cycle reaches limit</span>
            </div>
            <div className="clock-progress-bar">
              <div className="progress-fill fill-blue" style={{ width: '50%' }} />
            </div>
            <div className="clock-footer">
              <span>34 consecutive hours off-duty</span>
              <span className="badge-info">Scheduled</span>
            </div>
          </div>
        </section>

        {/* Quick Launch & Recent Trips Row */}
        <div className="dashboard-grid-layout">
          {/* Recent Trips Section */}
          <section className="dashboard-section recent-trips-panel">
            <div className="section-header">
              <div>
                <h2>Your Saved & Recent Trips</h2>
                <p>Select any route to review stops, map geometry, or view 24-hour logbooks.</p>
              </div>
              <button 
                className="btn-text-action" 
                onClick={() => navigate('/plan')}
              >
                <span>New trip</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {savedTrips && savedTrips.length > 0 ? (
              <div className="trips-list">
                {savedTrips.map((trip) => (
                  <div key={trip.id} className="trip-item-card">
                    <div className="trip-route-info">
                      <div className="route-endpoints">
                        <span className="route-origin">
                          <MapPin size={15} className="pin-origin" />
                          <b>{trip.locations?.current?.name || 'Start'}</b>
                        </span>
                        <ArrowRight size={14} className="route-arrow" />
                        <span className="route-dest">
                          <MapPin size={15} className="pin-dest" />
                          <b>{trip.locations?.dropoff?.name || 'Destination'}</b>
                        </span>
                      </div>
                      {trip.locations?.pickup?.name && (
                        <span className="route-pickup-tag">
                          Pickup: {trip.locations.pickup.name}
                        </span>
                      )}
                    </div>

                    <div className="trip-stats-inline">
                      <div className="stat-pill">
                        <Route size={14} />
                        <span>{trip.summary?.total_miles || 0} mi</span>
                      </div>
                      <div className="stat-pill">
                        <Clock3 size={14} />
                        <span>{trip.summary?.total_duration_hours || 0} hrs</span>
                      </div>
                      <div className="stat-pill">
                        <Fuel size={14} />
                        <span>{trip.summary?.fuel_stops_count || 1} stop(s)</span>
                      </div>
                      <div className="stat-pill status-compliant">
                        <CheckCircle2 size={14} />
                        <span>HOS Compliant</span>
                      </div>
                    </div>

                    <div className="trip-card-actions">
                      <button 
                        className="btn-open-trip"
                        onClick={() => handleOpenTrip(trip)}
                        title="View route map, stops & daily logs"
                      >
                        <FileText size={15} />
                        <span>View Trip & Logs</span>
                      </button>
                      <button 
                        className="btn-delete-trip"
                        onClick={() => deleteTrip(trip.id)}
                        title="Delete from saved"
                        aria-label="Delete trip"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-trips-box">
                <Navigation size={32} />
                <h3>No saved trips yet</h3>
                <p>Plan your first compliant route to generate stop schedules and daily log sheets.</p>
                <button 
                  className="btn-plan-primary" 
                  onClick={() => navigate('/plan')}
                >
                  <PlusCircle size={17} />
                  <span>Plan First Trip</span>
                </button>
              </div>
            )}
          </section>

          {/* Quick Route Templates Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="sidebar-card quick-routes-card">
              <div className="sidebar-card-header">
                <Sparkles size={17} />
                <h3>Quick Freight Corridors</h3>
              </div>
              <p className="sidebar-hint">Test common multi-state runs with preloaded cities:</p>
              
              <div className="quick-route-buttons">
                <button 
                  className="quick-route-btn"
                  onClick={() => handleQuickRoute('Chicago, IL', 'Indianapolis, IN', 'Atlanta, GA')}
                >
                  <div className="qr-top">
                    <b>Midwest to Southeast</b>
                    <span>712 mi</span>
                  </div>
                  <span className="qr-path">Chicago, IL → Indianapolis → Atlanta, GA</span>
                </button>

                <button 
                  className="quick-route-btn"
                  onClick={() => handleQuickRoute('Dallas, TX', 'Memphis, TN', 'Nashville, TN')}
                >
                  <div className="qr-top">
                    <b>South Central Corridor</b>
                    <span>680 mi</span>
                  </div>
                  <span className="qr-path">Dallas, TX → Memphis → Nashville, TN</span>
                </button>

                <button 
                  className="quick-route-btn"
                  onClick={() => handleQuickRoute('Los Angeles, CA', 'Phoenix, AZ', 'Dallas, TX')}
                >
                  <div className="qr-top">
                    <b>Cross-Country I-10</b>
                    <span>1,435 mi</span>
                  </div>
                  <span className="qr-path">Los Angeles, CA → Phoenix → Dallas, TX</span>
                </button>
              </div>
            </div>

            <div className="sidebar-card rules-card">
              <div className="sidebar-card-header">
                <ShieldCheck size={17} />
                <h3>FMCSA Rules Applied</h3>
              </div>
              <ul className="rules-checklist">
                <li>
                  <CheckCircle2 size={15} />
                  <span><b>11-Hour Driving Rule:</b> Max 11h driving after 10 consecutive hours off.</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span><b>14-Hour Window:</b> Duty day cannot exceed 14 consecutive hours.</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span><b>30-Minute Rest Break:</b> Required after 8 cumulative driving hours.</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span><b>Fuel Intervals:</b> Fuel stops automatically scheduled every 1,000 miles.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
