import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText,
  LayoutDashboard, ListChecks, Map, MapPinned, Navigation, Route, ShieldCheck, 
  Sparkles, Truck, PlusCircle, Loader2, PackageCheck, MapPin, ArrowRight
} from 'lucide-react';
import TripInputForm, { TRIP_PRESETS } from './TripInputForm';
import TripSummary from './TripSummary';
import RouteMap from './RouteMap';
import EventTimeline from './EventTimeline';
import RouteDirections from './RouteDirections';
import LogSheetViewer from './LogSheetViewer';
import AppNavbar from './AppNavbar';
import { planTrip, fetchTripById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const RESULT_TABS = [
  { id: 'overview', label: 'Your route', icon: Map },
  { id: 'schedule', label: 'Schedule & stops', icon: CalendarDays },
  { id: 'logs', label: 'Daily log sheets', icon: FileText },
  { id: 'directions', label: 'Directions', icon: Navigation }
];

export default function PlannerExperience() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { saveTrip, setActiveTrip } = useAuth();

  const [tripData, setTripData] = useState(() => {
    return location.state?.loadTrip || null;
  });
  const [prefill, setPrefill] = useState(() => {
    return location.state?.prefill || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Live input states for real-time manifest preview
  const [currentLocation, setCurrentLocation] = useState('Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState('Indianapolis, IN');
  const [dropoffLocation, setDropoffLocation] = useState('Atlanta, GA');
  const [cycleUsed, setCycleUsed] = useState(24.5);

  useDocumentTitle(tripId ? 'Trip · MileMint' : 'Plan · MileMint');

  useEffect(() => {
    if (tripId) {
      const stateTrip = location.state?.loadTrip;
      if (stateTrip && stateTrip.events && stateTrip.events.length > 0 && stateTrip.daily_logs && stateTrip.daily_logs.length > 0) {
        setTripData(stateTrip);
        setActiveTrip(stateTrip);
        setActiveTab('overview');
      } else {
        setIsLoading(true);
        fetchTripById(tripId).then(data => {
          if (data) {
            setTripData(data);
            setActiveTrip(data);
            setActiveTab('overview');
          }
        }).catch(err => {
          console.error("Failed to load trip by id:", err);
        }).finally(() => {
          setIsLoading(false);
        });
      }
    } else if (location.state?.loadTrip) {
      setTripData(location.state.loadTrip);
      setActiveTab('overview');
    } else {
      setTripData(null);
    }

    if (location.state?.prefill) {
      const pf = location.state.prefill;
      setPrefill(pf);
      if (pf.current) setCurrentLocation(pf.current);
      if (pf.pickup) setPickupLocation(pf.pickup);
      if (pf.dropoff) setDropoffLocation(pf.dropoff);
      if (pf.cycle !== undefined) setCycleUsed(pf.cycle);
    }
  }, [location.state, tripId]);

  const handlePlanTrip = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await planTrip(formData);
      setTripData(result);
      setActiveTab('overview');
      saveTrip(result);
      if (result?.id) {
        navigate(`/trip/${result.id}`, { replace: true, state: { loadTrip: result } });
      }
    } catch (err) {
      setError(err.message || 'We could not build this trip. Please double-check each location and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewTrip = () => {
    setTripData(null);
    setPrefill(null);
    setError(null);
    navigate('/plan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getArraySafe = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    if (typeof val === 'object') return Object.values(val);
    return [String(val)];
  };

  const normalizedTrip = tripData ? {
    ...tripData,
    summary: tripData.summary || tripData.summary_json || {},
    locations: tripData.locations || tripData.locations_json || {},
    route_geometry: tripData.route_geometry || tripData.route_geometry_json,
    turn_by_turn_steps: getArraySafe(tripData.turn_by_turn_steps || tripData.turn_by_turn_steps_json),
    events: getArraySafe(tripData.events || tripData.events_json),
    daily_logs: getArraySafe(tripData.daily_logs),
    disclaimers: getArraySafe(tripData.disclaimers || tripData.disclaimers_json)
  } : null;

  return (
    <div className="planner-page-wrapper">
      <AppNavbar />

      {isLoading && !normalizedTrip && (
        <div className="planner-loading-overlay">
          <Loader2 size={36} className="spinner" />
          <p>Calculating compliant route, rest breaks, and ELD log sheets…</p>
        </div>
      )}

      {!normalizedTrip ? (
        <div className="planner-page">
          <main className="planner-main-container">
            {/* Hero Top Banner matching Dashboard / Trips page */}
            <section className="planner-hero-banner">
              <div className="banner-driver-details">
                <span className="driver-greeting-badge">
                  <Sparkles size={14} />
                  <span>FMCSA 70h / 8-Day Compliant Dispatcher</span>
                </span>
                <h1>Plan Commercial Trip</h1>
                <p>
                  Configure your starting point, pickup shipper, and delivery destination. We’ll generate your full route schedule, mandatory 30-minute breaks, 10-hour sleeper resets, and 24-hour daily ELD log sheets.
                </p>
              </div>

              <div className="banner-regulations-tag">
                <ShieldCheck size={16} />
                <span>49 CFR Part 395 Ready</span>
              </div>
            </section>

            {error && (
              <div className="planner-error-banner">
                <AlertCircle size={20} />
                <div className="error-text">
                  <strong>Unable to build trip plan</strong>
                  <span>{error}</span>
                </div>
                <button type="button" onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}

            {/* 2-Column Unified Planning Layout */}
            <div className="planner-workspace-grid">
              {/* Left Column: Unified Configuration Form */}
              <div className="planner-form-column">
                <TripInputForm
                  onSubmit={handlePlanTrip}
                  isLoading={isLoading}
                  initialValues={prefill}
                  currentLocation={currentLocation}
                  setCurrentLocation={setCurrentLocation}
                  pickupLocation={pickupLocation}
                  setPickupLocation={setPickupLocation}
                  dropoffLocation={dropoffLocation}
                  setDropoffLocation={setDropoffLocation}
                  cycleUsed={cycleUsed}
                  setCycleUsed={setCycleUsed}
                />
              </div>

              {/* Right Column: Live Route Manifest Preview & Guardrails */}
              <div className="planner-preview-column">
                {/* Live Manifest Stepper Card */}
                <div className="manifest-preview-card">
                  <div className="manifest-header">
                    <div className="manifest-title-group">
                      <span className="manifest-kicker">LIVE MANIFEST PREVIEW</span>
                      <h3>Dispatch Sequence</h3>
                    </div>
                    <span className="manifest-status-chip">
                      <CheckCircle2 size={13} /> Active Sequence
                    </span>
                  </div>

                  {/* Vertical Aligned Waypoint Progression */}
                  <div className="manifest-waypoints-timeline">
                    {/* Node 1: Current Yard */}
                    <div className="manifest-waypoint-item">
                      <div className="waypoint-node-indicator node-start">
                        <MapPin size={15} />
                      </div>
                      <div className="waypoint-content">
                        <div className="waypoint-tag">01 · ORIGIN</div>
                        <h4 className="waypoint-location">{currentLocation || 'Starting Yard'}</h4>
                        <p className="waypoint-meta">Pre-trip inspection (15 min) · Shift departure</p>
                      </div>
                    </div>

                    {/* Connector Line 1 */}
                    <div className="manifest-connector">
                      <div className="connector-line" />
                      <div className="connector-pill">
                        <Route size={12} />
                        <span>Leg 1: En Route to Shipper</span>
                      </div>
                    </div>

                    {/* Node 2: Shipper Pickup */}
                    <div className="manifest-waypoint-item">
                      <div className="waypoint-node-indicator node-pickup">
                        <PackageCheck size={15} />
                      </div>
                      <div className="waypoint-content">
                        <div className="waypoint-tag">02 · PICKUP</div>
                        <h4 className="waypoint-location">{pickupLocation || 'Shipper Facility'}</h4>
                        <p className="waypoint-meta">1.0 hr on-duty · Loading & cargo securement check</p>
                      </div>
                    </div>

                    {/* Connector Line 2 */}
                    <div className="manifest-connector">
                      <div className="connector-line" />
                      <div className="connector-pill">
                        <Route size={12} />
                        <span>Leg 2: En Route to Delivery</span>
                      </div>
                    </div>

                    {/* Node 3: Consignee Delivery */}
                    <div className="manifest-waypoint-item">
                      <div className="waypoint-node-indicator node-dropoff">
                        <Navigation size={15} />
                      </div>
                      <div className="waypoint-content">
                        <div className="waypoint-tag">03 · DELIVERY</div>
                        <h4 className="waypoint-location">{dropoffLocation || 'Consignee Receiver'}</h4>
                        <p className="waypoint-meta">1.0 hr on-duty · Unloading & post-trip inspection</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="manifest-footer-summary">
                    <div className="summary-stat">
                      <span className="stat-label">HOS Cycle Start</span>
                      <strong className="stat-value">{Number(cycleUsed || 0).toFixed(1)} hrs</strong>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Cycle Remaining</span>
                      <strong className="stat-value text-green">{(70.0 - Number(cycleUsed || 0)).toFixed(1)} hrs</strong>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Safety Status</span>
                      <strong className="stat-value text-safe">
                        <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        FMCSA Ready
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Compliance Engine Guardrails Card */}
                <div className="compliance-guardrails-card">
                  <div className="guardrails-header">
                    <ShieldCheck size={18} />
                    <h4>Automated HOS Compliance Engine</h4>
                  </div>
                  <ul className="guardrails-list">
                    <li>
                      <CheckCircle2 size={14} className="check-icon" />
                      <span><strong>11-Hour Drive Cap:</strong> Max 11 cumulative hours driving per shift.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={14} className="check-icon" />
                      <span><strong>14-Hour Duty Window:</strong> 14 consecutive hours from shift start.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={14} className="check-icon" />
                      <span><strong>30-Min Rest Break:</strong> Scheduled before 8 hours of driving.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={14} className="check-icon" />
                      <span><strong>10-Hour Sleeper Reset:</strong> Injected when duty limit is reached.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={14} className="check-icon" />
                      <span><strong>Fuel Stops:</strong> Auto-injected at least every 1,000 driving miles.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className="planner-page planner-results-page">
          <main className="planner-results">
            <div className="planner-results-topbar">
              <button 
                className="btn-back-dashboard" 
                onClick={() => navigate('/dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>Back to Dashboard</span>
              </button>

              <button 
                className="btn-plan-another" 
                onClick={startNewTrip}
              >
                <PlusCircle size={16} />
                <span>Plan Another Trip</span>
              </button>
            </div>

            {/* Aesthetic & Minimal Trip Itinerary Ready Banner */}
            <div className="plan-ready-banner">
              <div className="banner-left-content">
                <div className="banner-top-badge-row">
                  <span className="banner-status-pill">
                    <span className="status-live-dot" />
                    TRIP ITINERARY READY
                  </span>
                  <span className="banner-compliance-chip">
                    <ShieldCheck size={13} />
                    FMCSA 70h / 8-Day Compliant
                  </span>
                </div>

                <h1 className="banner-route-title">
                  <span className="route-city">{normalizedTrip.origin_name || normalizedTrip.locations?.current?.name || 'Origin'}</span>
                  <ArrowRight size={17} className="route-arrow-icon" />
                  <span className="route-city">{normalizedTrip.pickup_name || normalizedTrip.locations?.pickup?.name || 'Pickup'}</span>
                  <ArrowRight size={17} className="route-arrow-icon" />
                  <span className="route-city">{normalizedTrip.dropoff_name || normalizedTrip.locations?.dropoff?.name || 'Destination'}</span>
                </h1>

                <p className="banner-meta-desc">
                  Full FMCSA certified schedule with <strong>{normalizedTrip.daily_logs?.length || 1} generated 24-hour log sheet{(normalizedTrip.daily_logs?.length || 1) > 1 ? 's' : ''}</strong> ready for driver dispatch.
                </p>
              </div>

              <div className="banner-right-actions">
                <button onClick={() => setActiveTab('logs')} className="btn-view-logs-cta">
                  <FileText size={15} />
                  <span>View Daily Logs</span>
                  <span className="logs-count-chip">{normalizedTrip.daily_logs?.length || 1}</span>
                </button>
              </div>
            </div>

            {/* Results Tab Navigation */}
            <nav className="planner-tabs" aria-label="Trip result tabs">
              {RESULT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`planner-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {tab.id === 'logs' && normalizedTrip.daily_logs?.length > 0 && (
                      <span className={`tab-count-badge ${isActive ? 'badge-active' : ''}`}>
                        {normalizedTrip.daily_logs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Tab 1: Route Overview */}
            {activeTab === 'overview' && (
              <div className="planner-tab-panel">
                <TripSummary summary={normalizedTrip.summary} trip={normalizedTrip} />
                <div className="planner-overview" style={{ marginTop: '20px' }}>
                  <RouteMap 
                    locations={normalizedTrip.locations} 
                    routeGeometry={normalizedTrip.route_geometry} 
                    events={normalizedTrip.events} 
                    trip={normalizedTrip}
                  />
                  <aside className="plan-next-card">
                    <span className="next-card-icon"><Sparkles size={20} /></span>
                    <span className="next-card-label">Dispatch Summary</span>
                    <h2>Trip Ready for Yard Departure</h2>
                    <p>Your routes and hours have been mapped against federal property-carrying HOS regulations.</p>
                    <div className="plan-check-list">
                      <span><CheckCircle2 size={15} /> All rest stops compliant</span>
                      <span><CheckCircle2 size={15} /> Fuel stops accounted for</span>
                      <span><CheckCircle2 size={15} /> Vector log sheets ready</span>
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {/* Tab 2: Schedule & Stops Timeline */}
            {activeTab === 'schedule' && (
              <div className="planner-tab-panel">
                <EventTimeline events={normalizedTrip.events} />
              </div>
            )}

            {/* Tab 3: Daily Log Sheets */}
            {activeTab === 'logs' && (
              <div className="planner-tab-panel">
                <LogSheetViewer dailyLogs={normalizedTrip.daily_logs} />
              </div>
            )}

            {/* Tab 4: Directions */}
            {activeTab === 'directions' && (
              <div className="planner-tab-panel">
                <RouteDirections 
                  steps={normalizedTrip.turn_by_turn_steps} 
                  locations={normalizedTrip.locations} 
                />
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
