import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import truckHeroClay from '../assets/truck-hero-clay.png';
import featureRouteClay from '../assets/feature-route-clay.png';
import featureHoursClay from '../assets/feature-hours-clay.png';
import featureLogsClay from '../assets/feature-logs-clay.png';
import workflowStopsClay from '../assets/workflow-stops-clay.png';
import workflowPlanClay from '../assets/workflow-plan-clay.png';
import workflowDriveClay from '../assets/workflow-drive-clay.png';
import {
  ArrowRight, Check, ChevronRight, Clock3, FileCheck2, MapPinned,
  Menu, Play, Route, ShieldCheck, Sparkles, Truck, X, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: <Route size={22} />,
    title: 'Routes that respect real life',
    text: 'Build efficient trips around fuel, pickup windows, and compliant breaks.',
    art: featureRouteClay
  },
  {
    icon: <Clock3 size={22} />,
    title: 'Hours, made crystal clear',
    text: 'See driving windows, reset time, and every mandatory pause in one view.',
    art: featureHoursClay
  },
  {
    icon: <FileCheck2 size={22} />,
    title: 'Logs ready when you are',
    text: 'Turn a planned route into clear daily log sheets in just a few clicks.',
    art: featureLogsClay
  }
];

const workflowSteps = [
  {
    number: '01',
    label: 'Add your stops',
    kicker: 'Step 01 · Set the route',
    title: <>Your route,<br /><em>all in one place.</em></>,
    text: 'Add where you are, where the load begins, and where it needs to go. We turn those details into a route that is ready to plan.',
    detail: 'Start, pickup, and delivery',
    art: workflowStopsClay,
    alt: 'Clay route map with pickup and delivery pins'
  },
  {
    number: '02',
    label: 'Get a compliant plan',
    kicker: 'Step 02 · Protect your hours',
    title: <>A schedule that<br /><em>works with your clock.</em></>,
    text: 'MileMint lays out your driving windows, planned breaks, fuel stops, and resets so every mile fits within your available hours.',
    detail: 'Driving, breaks, fuel, and reset time',
    art: workflowPlanClay,
    alt: 'Clay compliance schedule with clock, fuel stop, and shield'
  },
  {
    number: '03',
    label: 'Hit the road',
    kicker: 'Step 03 · Drive with confidence',
    title: <>See the plan.<br /><em>Enjoy the drive.</em></>,
    text: 'Follow one clear trip view while your daily log is ready in the background. Less second-guessing, more road ahead.',
    detail: 'A route and log you can trust',
    art: workflowDriveClay,
    alt: 'Clay delivery truck driving toward a destination'
  }
];

function ClayTruck({ className = '' }) {
  return (
    <div className={`hero-truck ${className}`} aria-label="Animated delivery truck">
      <span className="truck-shine" />
      <div className="truck-trailer"><span className="trailer-mark">M</span></div>
      <div className="truck-cab">
        <span className="cab-window" />
        <span className="headlight" />
      </div>
      <span className="truck-wheel wheel-one" /><span className="truck-wheel wheel-two" />
    </div>
  );
}

export default function LandingPage() {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const currentWorkflowStep = workflowSteps[activeWorkflowStep];
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/plan');
    }
  };

  const handleOpenLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link to="/" className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-mark"><Truck size={20} /></span>
          <span>mile<span>mint</span></span>
        </Link>
        <div className="landing-links">
          <a href="#why">Why MileMint</a>
          <a href="#how-it-works">How it works</a>
          <a href="#built-for">Built for drivers</a>
        </div>
        <div className="nav-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="nav-login">
              <User size={15} /> Dashboard ({user?.name?.split(' ')[0]})
            </Link>
          ) : (
            <button className="nav-login" onClick={handleOpenLogin}>Driver Sign In</button>
          )}
          <button className="nav-cta" onClick={handleGetStarted}>Plan a trip <ArrowRight size={16} /></button>
        </div>
        <button className="mobile-menu" aria-label="Open menu"><Menu size={21} /></button>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Your calm co-pilot for every mile</div>
            <h1>Good trips<br />start <em>here.</em></h1>
            <p className="hero-description">Plan compliant routes, protect your hours, and keep your wheels moving with an ELD planner that feels refreshingly simple.</p>
            <div className="hero-actions">
              <button className="hero-primary" onClick={handleGetStarted}>Start planning <ArrowRight size={18} /></button>
              <button className="hero-watch" onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}><span><Play size={14} fill="currentColor" /></span> See how it works</button>
            </div>
            <div className="hero-proof"><span className="proof-check"><Check size={15} /></span> Built around FMCSA property-carrying rules</div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="sun-orb" />
            <div className="cloud cloud-one" /><div className="cloud cloud-two" />
            <img className="generated-hero-truck" src={truckHeroClay} alt="" />
            <div className="location-card pickup-card"><span className="card-pin pin-green" /><div><small>Pickup</small><b>Chicago, IL</b></div><span className="card-time">08:30</span></div>
            <div className="location-card drop-card"><span className="card-pin pin-orange" /><div><small>Delivery</small><b>Atlanta, GA</b></div><span className="card-time">Tomorrow</span></div>
            <div className="map-route"><span className="route-dot route-start" /><span className="route-dot route-end" /><span className="route-pulse" /></div>
            <div className="hill hill-back" /><div className="hill hill-front" />
            <div className="road"><span className="road-line line-a" /><span className="road-line line-b" /><span className="road-line line-c" /></div>
            <ClayTruck />
            <ClayTruck className="hero-truck-small" />
            <div className="hours-bubble"><span className="bubble-icon"><Clock3 size={19} /></span><div><small>Drive time left</small><strong>8h 42m</strong></div><i>Safe</i></div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Product benefits">
          <div><ShieldCheck size={21} /><span><b>Compliant by design</b><small>FMCSA-ready planning</small></span></div>
          <div><MapPinned size={21} /><span><b>Smarter route timing</b><small>Stops where they matter</small></span></div>
          <div><FileCheck2 size={21} /><span><b>Cleaner daily logs</b><small>Export-ready schedules</small></span></div>
        </section>

        <section className="features-section" id="why">
          <div className="section-intro"><span className="section-kicker">Less stress. More road.</span><h2>Everything you need,<br />without the <em>noise.</em></h2></div>
          <div className="feature-grid">
            {features.map((feature, index) => <article className={`feature-card feature-${index + 1}`} key={feature.title}>
              <span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p><button onClick={handleGetStarted}>Explore <ChevronRight size={16} /></button>
              <img className="feature-art" src={feature.art} alt="" />
            </article>)}
          </div>
        </section>

        <section className="workflow-section" id="how-it-works">
          <div className="workflow-topline"><span className="section-kicker">A smoother trip, in minutes</span><span className="workflow-hint">Choose a step to explore</span></div>
          <div className="workflow-layout">
            <div className="workflow-visual">
              <div className="workflow-glow" />
              <img key={currentWorkflowStep.number} className="workflow-art" src={currentWorkflowStep.art} alt={currentWorkflowStep.alt} />
              <div className="workflow-status"><span><Check size={14} /></span>{currentWorkflowStep.detail}</div>
            </div>
            <div className="workflow-content">
              <div className="workflow-steps" role="tablist" aria-label="How it works steps">
                {workflowSteps.map((step, index) => <button key={step.number} className={`workflow-step ${activeWorkflowStep === index ? 'active' : ''}`} role="tab" aria-selected={activeWorkflowStep === index} onClick={() => setActiveWorkflowStep(index)}>
                  <span>{step.number}</span><b>{step.label}</b><ChevronRight size={16} />
                </button>)}
              </div>
              <div className="workflow-copy" role="tabpanel">
                <span className="workflow-step-kicker">{currentWorkflowStep.kicker}</span>
                <h2>{currentWorkflowStep.title}</h2>
                <p>{currentWorkflowStep.text}</p>
                <div className="workflow-footer">
                  <div className="workflow-progress" aria-label={`Step ${activeWorkflowStep + 1} of 3`}><span style={{ width: `${((activeWorkflowStep + 1) / workflowSteps.length) * 100}%` }} /></div>
                  {activeWorkflowStep < workflowSteps.length - 1 ? <button className="workflow-next" onClick={() => setActiveWorkflowStep(activeWorkflowStep + 1)}>Next step <ArrowRight size={16} /></button> : <button className="text-link" onClick={handleGetStarted}>Build your first route <ArrowRight size={17} /></button>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="closing-section" id="built-for"><div><span className="section-kicker">Made for the long haul</span><h2>Your next good<br />trip is waiting.</h2><p>Take the guesswork out of your next route.</p></div><button className="hero-primary" onClick={handleGetStarted}>Open trip planner <ArrowRight size={18} /></button></section>
      </main>
      <footer className="landing-footer"><span className="landing-logo"><span className="logo-mark"><Truck size={17} /></span> mile<span>mint</span></span><small>© 2026 MileMint. Designed for the road ahead.</small><div><a href="#why">Features</a><a href="#how-it-works">How it works</a><button onClick={handleGetStarted}>Planner</button></div></footer>
    </div>
  );
}
