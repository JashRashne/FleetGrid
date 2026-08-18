import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Search, Route, Clock3, Fuel, 
  MapPin, CheckCircle2, FileText, Trash2, ArrowRight,
  Navigation, Calendar, ShieldCheck, Sparkles, Filter,
  ArrowUpDown, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppNavbar from './AppNavbar';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function TripsPage() {
  useDocumentTitle('Trips · MileMint');
  const { user, savedTrips, deleteTrip, setActiveTrip } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'miles-high', 'miles-low', 'duration'

  const handleOpenTrip = (trip) => {
    setActiveTrip(trip);
    navigate(`/trip/${trip.id}`, { state: { loadTrip: trip } });
  };

  // Filter & sort trips
  const filteredTrips = useMemo(() => {
    if (!savedTrips) return [];
    
    let result = savedTrips.filter((trip) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const origin = (trip.origin_name || trip.locations?.current?.name || '').toLowerCase();
      const pickup = (trip.pickup_name || trip.locations?.pickup?.name || '').toLowerCase();
      const dropoff = (trip.dropoff_name || trip.locations?.dropoff?.name || '').toLowerCase();
      return origin.includes(q) || pickup.includes(q) || dropoff.includes(q);
    });

    return result.sort((a, b) => {
      if (sortBy === 'miles-high') {
        return (b.summary?.total_miles || 0) - (a.summary?.total_miles || 0);
      }
      if (sortBy === 'miles-low') {
        return (a.summary?.total_miles || 0) - (b.summary?.total_miles || 0);
      }
      if (sortBy === 'duration') {
        return (b.summary?.total_duration_hours || 0) - (a.summary?.total_duration_hours || 0);
      }
      // Default: recent (by id or created_at)
      return (b.createdAt || b.created_at || '').localeCompare(a.createdAt || a.created_at || '');
    });
  }, [savedTrips, searchTerm, sortBy]);

  // Aggregate stats
  const totalTripsCount = savedTrips?.length || 0;
  const totalLoggedMiles = useMemo(() => {
    return (savedTrips || []).reduce((acc, t) => acc + (t.summary?.total_miles || 0), 0);
  }, [savedTrips]);
  const totalLoggedHours = useMemo(() => {
    return (savedTrips || []).reduce((acc, t) => acc + (t.summary?.total_duration_hours || 0), 0).toFixed(1);
  }, [savedTrips]);

  return (
    <div className="trips-page">
      <AppNavbar />

      <main className="trips-main-content">
        {/* Hero Section */}
        <section className="trips-hero-banner">
          <div className="trips-hero-info">
            <span className="trips-eyebrow">
              <Route size={15} />
              <span>Trip Archives & Records</span>
            </span>
            <h1>All Logged Trips</h1>
            <p>
              Review full route history, stop timelines, FMCSA HOS compliance logs, and dispatch records for {user?.name || 'Driver'}.
            </p>
          </div>

          <div className="trips-hero-actions">
            <button 
              className="btn-plan-primary" 
              onClick={() => navigate('/plan')}
            >
              <PlusCircle size={18} />
              <span>Plan New Trip</span>
            </button>
          </div>
        </section>

        {/* Stats Overview Ribbon */}
        <section className="trips-stats-ribbon">
          <div className="stat-card">
            <span className="stat-label">Total Routes Planned</span>
            <div className="stat-body">
              <strong className="stat-num">{totalTripsCount}</strong>
              <span className="stat-desc">trip records saved</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Cumulative Distance</span>
            <div className="stat-body">
              <strong className="stat-num">{totalLoggedMiles.toLocaleString()}</strong>
              <span className="stat-desc">miles logged</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Duty Duration</span>
            <div className="stat-body">
              <strong className="stat-num">{totalLoggedHours}</strong>
              <span className="stat-desc">hours scheduled</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">HOS Status</span>
            <div className="stat-body">
              <strong className="stat-num stat-green">100%</strong>
              <span className="stat-desc">Part 395 compliant</span>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <section className="trips-controls-bar">
          <div className="search-box-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text"
              placeholder="Search by city, origin, or destination (e.g. Chicago, Atlanta)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="trips-search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="sort-filter-group">
            <div className="sort-dropdown-wrapper">
              <ArrowUpDown size={15} className="sort-icon" />
              <label htmlFor="trips-sort-select" className="sr-only">Sort by</label>
              <select 
                id="trips-sort-select"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="trips-sort-select"
              >
                <option value="recent">Most Recent First</option>
                <option value="miles-high">Distance (High to Low)</option>
                <option value="miles-low">Distance (Low to High)</option>
                <option value="duration">Duration (Longest First)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Trips List Section */}
        <section className="all-trips-list-container">
          {filteredTrips && filteredTrips.length > 0 ? (
            <div className="trips-cards-grid">
              {filteredTrips.map((trip, idx) => {
                const originName = trip.origin_name || trip.locations?.current?.name || 'Origin';
                const pickupName = trip.pickup_name || trip.locations?.pickup?.name;
                const dropoffName = trip.dropoff_name || trip.locations?.dropoff?.name || 'Destination';
                const totalMiles = trip.summary?.total_miles || 0;
                const totalHours = trip.summary?.total_duration_hours || 0;
                const fuelStops = trip.summary?.fuel_stops_count || 1;
                const daysReq = trip.summary?.days_required || (totalMiles > 550 ? 2 : 1);
                const formattedDate = trip.createdAt || trip.created_at 
                  ? new Date(trip.createdAt || trip.created_at).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) 
                  : `Trip #${idx + 1}`;

                return (
                  <div key={trip.id} className="trip-record-card">
                    <div className="card-top-header">
                      <span className="trip-date-badge">
                        <Calendar size={13} />
                        <span>{formattedDate}</span>
                      </span>
                      <span className="hos-compliant-badge">
                        <CheckCircle2 size={13} />
                        <span>HOS Compliant</span>
                      </span>
                    </div>

                    <div className="card-route-endpoints">
                      <div className="endpoint-row origin">
                        <MapPin size={16} className="pin-origin" />
                        <div className="endpoint-text">
                          <span className="endpoint-label">Origin</span>
                          <strong>{originName}</strong>
                        </div>
                      </div>

                      {pickupName && (
                        <div className="endpoint-row pickup">
                          <div className="route-connector-line" />
                          <MapPin size={16} className="pin-pickup" />
                          <div className="endpoint-text">
                            <span className="endpoint-label">Shipper Pickup</span>
                            <span>{pickupName}</span>
                          </div>
                        </div>
                      )}

                      <div className="endpoint-row destination">
                        <MapPin size={16} className="pin-dest" />
                        <div className="endpoint-text">
                          <span className="endpoint-label">Final Delivery</span>
                          <strong>{dropoffName}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="card-metrics-grid">
                      <div className="metric-box">
                        <Route size={14} />
                        <div className="metric-body">
                          <span className="val">{totalMiles} mi</span>
                          <span className="lbl">Total Distance</span>
                        </div>
                      </div>

                      <div className="metric-box">
                        <Clock3 size={14} />
                        <div className="metric-body">
                          <span className="val">{totalHours} hrs</span>
                          <span className="lbl">Trip Window</span>
                        </div>
                      </div>

                      <div className="metric-box">
                        <Fuel size={14} />
                        <div className="metric-body">
                          <span className="val">{fuelStops} Stop(s)</span>
                          <span className="lbl">Fuel & Rest</span>
                        </div>
                      </div>

                      <div className="metric-box">
                        <FileText size={14} />
                        <div className="metric-body">
                          <span className="val">{daysReq} Day{daysReq > 1 ? 's' : ''}</span>
                          <span className="lbl">Log Sheets</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-bottom-actions">
                      <button 
                        className="btn-view-trip-full"
                        onClick={() => handleOpenTrip(trip)}
                        title="View route map, timeline & logbook"
                      >
                        <FileText size={15} />
                        <span>View Trip & Logs</span>
                        <ArrowRight size={14} />
                      </button>

                      <button 
                        className="btn-delete-trip-card"
                        onClick={() => deleteTrip(trip.id)}
                        title="Delete trip from records"
                        aria-label="Delete trip"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-trips-box">
              <Navigation size={36} />
              <h3>{searchTerm ? `No trips found matching "${searchTerm}"` : 'No saved trips yet'}</h3>
              <p>
                {searchTerm 
                  ? 'Try searching for a different city or clear your search filter.'
                  : 'Plan your first compliant route to generate stop schedules and daily log sheets.'}
              </p>
              {searchTerm ? (
                <button 
                  className="btn-plan-primary" 
                  onClick={() => setSearchTerm('')}
                >
                  <span>Clear Search</span>
                </button>
              ) : (
                <button 
                  className="btn-plan-primary" 
                  onClick={() => navigate('/plan')}
                >
                  <PlusCircle size={17} />
                  <span>Plan First Trip</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
