import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText,
  LayoutDashboard, ListChecks, Map, MapPinned, Navigation, Route, ShieldCheck, Sparkles, Truck, PlusCircle, Loader2
} from 'lucide-react';
import TripInputForm from './TripInputForm';
import TripSummary from './TripSummary';
import RouteMap from './RouteMap';
import EventTimeline from './EventTimeline';
import RouteDirections from './RouteDirections';
import LogSheetViewer from './LogSheetViewer';
import AppNavbar from './AppNavbar';
import { planTrip, fetchTripById } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
      setPrefill(location.state.prefill);
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
          <p>Loading your saved route and logbooks...</p>
        </div>
      )}

      {!normalizedTrip ? (
        <div className="planner-page">
          <main className="planner-onboarding">
            <section className="planner-welcome">
              <div className="planner-welcome-copy">
                <span className="planner-eyebrow">
                  <Sparkles size={15} /> A simple plan for every mile
                </span>
                <h1>Let’s build your<br /><em>next safe trip.</em></h1>
                <p>
                  Answer four short questions. We’ll turn them into a route, a clear stop schedule, and the daily ELD log sheets you need.
                </p>
                <div className="planner-promise">
                  <span><CheckCircle2 size={17} /> Map your route</span>
                  <span><CheckCircle2 size={17} /> Plan required stops</span>
                  <span><CheckCircle2 size={17} /> Create daily logs</span>
                </div>
              </div>
              <div className="planner-route-mark" aria-hidden="true">
                <span>Chicago</span><i /><span>Indianapolis</span><i /><span>Atlanta</span>
                <b>712 mi</b>
              </div>
            </section>

            <section className="planner-form-wrap">
              <TripInputForm 
                onSubmit={handlePlanTrip} 
                isLoading={isLoading} 
                initialValues={prefill}
              />
            </section>

            {error && (
              <div className="planner-error">
                <AlertCircle size={20} />
                <div>
                  <b>Let’s try that again</b>
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}

            <aside className="planner-assumptions">
              <ShieldCheck size={19} />
              <div>
                <b>What this planner includes</b>
                <span>Property-carrying rules, 70 hours in 8 days, one hour each for pickup and delivery, and a fuel stop at least every 1,000 miles.</span>
              </div>
            </aside>
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

            <section className="plan-ready-banner">
              <div>
                <span className="plan-ready-mark"><CheckCircle2 size={21} /></span>
                <div>
                  <span>Your trip is ready</span>
                  <h1>{normalizedTrip.locations?.current?.name} <Route size={22} /> {normalizedTrip.locations?.dropoff?.name}</h1>
                  <p>Pickup at {normalizedTrip.locations?.pickup?.name}. Your plan accounts for the required driving, service, fuel, and rest time.</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('logs')}>
                <FileText size={16} /> View daily logs
              </button>
            </section>

            <TripSummary summary={normalizedTrip.summary} />

            <div className="planner-tabs" role="tablist" aria-label="Trip plan views">
              {RESULT_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id} 
                    className={activeTab === tab.id ? 'active' : ''} 
                    role="tab" 
                    aria-selected={activeTab === tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={17} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <section className="planner-tab-panel" aria-label={RESULT_TABS.find((tab) => tab.id === activeTab)?.label}>
              {activeTab === 'overview' && (
                <div className="planner-overview">
                  <RouteMap 
                    locations={normalizedTrip.locations} 
                    routeGeometry={normalizedTrip.route_geometry} 
                    events={normalizedTrip.events} 
                  />
                  <aside className="plan-next-card">
                    <span className="next-card-icon"><Clock3 size={19} /></span>
                    <span className="next-card-label">First planned activity</span>
                    <h2>{((normalizedTrip.events || []).find((event) => event.duty_status !== 'OFF_DUTY') || normalizedTrip.events?.[0])?.remark || 'Route begins'}</h2>
                    <p>
                      {((normalizedTrip.events || []).find((event) => event.duty_status !== 'OFF_DUTY') || normalizedTrip.events?.[0]) 
                        ? `${((normalizedTrip.events || []).find((event) => event.duty_status !== 'OFF_DUTY') || normalizedTrip.events?.[0]).duration_minutes} minutes · ${((normalizedTrip.events || []).find((event) => event.duty_status !== 'OFF_DUTY') || normalizedTrip.events?.[0]).location_name}`
                        : 'Your route details will appear here.'}
                    </p>
                    <div className="plan-check-list">
                      <span><CheckCircle2 size={15} /> Pickup and delivery time included</span>
                      <span><CheckCircle2 size={15} /> Fuel stops planned at 1,000-mile intervals</span>
                      <span><CheckCircle2 size={15} /> Required breaks and resets scheduled</span>
                    </div>
                  </aside>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="planner-single-panel">
                  <div className="panel-intro">
                    <span>Stop-by-stop plan</span>
                    <h2>Here’s what happens, in order.</h2>
                    <p>Each card shows where you’ll be, how long the activity takes, and whether it counts as driving or on-duty time.</p>
                  </div>
                  <EventTimeline events={normalizedTrip.events} />
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="planner-single-panel">
                  <div className="panel-intro">
                    <span>Ready to review or print</span>
                    <h2>Your daily ELD log sheets.</h2>
                    <p>Select any day below. Each sheet covers a complete 24-hour grid and is filled from your planned schedule.</p>
                  </div>
                  <LogSheetViewer dailyLogs={normalizedTrip.daily_logs} />
                </div>
              )}

              {activeTab === 'directions' && (
                <div className="planner-single-panel">
                  <div className="panel-intro">
                    <span>Road-by-road guidance</span>
                    <h2>Simple directions for your route.</h2>
                    <p>Review the route one segment at a time before you head out.</p>
                  </div>
                  <RouteDirections steps={normalizedTrip.turn_by_turn_steps} />
                </div>
              )}
            </section>

            {normalizedTrip.disclaimers && normalizedTrip.disclaimers.length > 0 && (
              <footer className="planner-disclaimers">
                {normalizedTrip.disclaimers.map((note, index) => (
                  <p key={index}>{typeof note === 'string' ? note : JSON.stringify(note)}</p>
                ))}
              </footer>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
