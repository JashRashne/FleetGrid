import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, PackageCheck, Play, Sparkles } from 'lucide-react';

const PRESETS = [
  { label: 'Quick one-day run', current: 'Chicago, IL', pickup: 'Indianapolis, IN', dropoff: 'Columbus, OH', cycle: 15 },
  { label: 'Sample two-day trip', current: 'Chicago, IL', pickup: 'Indianapolis, IN', dropoff: 'Atlanta, GA', cycle: 24.5 },
  { label: 'Long-haul example', current: 'New York, NY', pickup: 'Chicago, IL', dropoff: 'Los Angeles, CA', cycle: 35 }
];

const STEPS = [
  { label: 'Start', icon: MapPin },
  { label: 'Pickup', icon: PackageCheck },
  { label: 'Delivery', icon: MapPin },
  { label: 'Available hours', icon: Clock3 }
];

export default function TripInputForm({ onSubmit, isLoading, initialValues }) {
  const [step, setStep] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(initialValues?.current || 'Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState(initialValues?.pickup || 'Indianapolis, IN');
  const [dropoffLocation, setDropoffLocation] = useState(initialValues?.dropoff || 'Atlanta, GA');
  const [cycleUsed, setCycleUsed] = useState(initialValues?.cycle || 24.5);

  React.useEffect(() => {
    if (initialValues) {
      if (initialValues.current) setCurrentLocation(initialValues.current);
      if (initialValues.pickup) setPickupLocation(initialValues.pickup);
      if (initialValues.dropoff) setDropoffLocation(initialValues.dropoff);
      if (initialValues.cycle !== undefined) setCycleUsed(initialValues.cycle);
    }
  }, [initialValues]);

  const applyPreset = (preset) => {
    setCurrentLocation(preset.current);
    setPickupLocation(preset.pickup);
    setDropoffLocation(preset.dropoff);
    setCycleUsed(preset.cycle);
    setStep(0);
  };

  const nextStep = () => {
    const values = [currentLocation, pickupLocation, dropoffLocation];
    if (step < 3 && values[step].trim()) setStep((value) => Math.min(value + 1, 3));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (step < 3) return nextStep();
    onSubmit({ current_location: currentLocation, pickup_location: pickupLocation, dropoff_location: dropoffLocation, current_cycle_used_hours: parseFloat(cycleUsed), departure_time: new Date().toISOString() });
  };

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  return <div className="planner-form-card">
    <div className="planner-stepper" aria-label="Trip planning progress">
      {STEPS.map((item, index) => {
        const Icon = item.icon;
        return <React.Fragment key={item.label}><button type="button" className={`planner-step-dot ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`} onClick={() => index <= step && setStep(index)} aria-current={index === step ? 'step' : undefined}>{index < step ? <Check size={14} /> : <Icon size={15} />}<span>{item.label}</span></button>{index < STEPS.length - 1 && <span className={`planner-step-line ${index < step ? 'complete' : ''}`} />}</React.Fragment>;
      })}
    </div>

    <form onSubmit={handleSubmit}>
      <div className="planner-form-heading"><span className="planner-form-icon"><StepIcon size={21} /></span><div><span>Step {step + 1} of {STEPS.length}</span><h2>{step === 0 ? 'Where are you starting?' : step === 1 ? 'Where is the pickup?' : step === 2 ? 'Where is the delivery?' : 'How much time is already used?'}</h2></div></div>
      {step === 0 && <div className="planner-field"><label htmlFor="current-location">Current location</label><p>This is where your truck is right now.</p><input id="current-location" autoFocus className="planner-input" value={currentLocation} onChange={(event) => setCurrentLocation(event.target.value)} placeholder="Example: Chicago, IL" required /></div>}
      {step === 1 && <div className="planner-field"><label htmlFor="pickup-location">Pickup location</label><p>Where will the load be collected?</p><input id="pickup-location" autoFocus className="planner-input" value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} placeholder="Example: Indianapolis, IN" required /></div>}
      {step === 2 && <div className="planner-field"><label htmlFor="dropoff-location">Delivery location</label><p>Where does the load need to arrive?</p><input id="dropoff-location" autoFocus className="planner-input" value={dropoffLocation} onChange={(event) => setDropoffLocation(event.target.value)} placeholder="Example: Atlanta, GA" required /></div>}
      {step === 3 && <div className="planner-field planner-hours-field"><div className="hours-title"><div><label htmlFor="cycle-hours">Hours used in your 70-hour cycle</label><p>Enter the on-duty hours already used in the current 8-day cycle.</p></div><strong>{Number(cycleUsed).toFixed(1)}<small> hrs</small></strong></div><input id="cycle-hours" className="planner-range" type="range" min="0" max="70" step="0.5" value={cycleUsed} onChange={(event) => setCycleUsed(event.target.value)} /><div className="range-labels"><span>0 hrs<br /><small>Fresh cycle</small></span><span>35 hrs</span><span>70 hrs<br /><small>Cycle limit</small></span></div><div className="hours-note"><Sparkles size={15} /> We’ll account for driving, breaks, fuel stops, pickup, and delivery time.</div></div>}
      <div className="planner-form-actions">{step > 0 ? <button type="button" className="planner-back" onClick={() => setStep((value) => value - 1)}><ArrowLeft size={16} /> Back</button> : <span />}<button type="submit" className="planner-next" disabled={isLoading}>{isLoading ? 'Building your plan…' : step === 3 ? <><Play size={17} /> Build my trip plan</> : <>Continue <ArrowRight size={17} /></>}</button></div>
    </form>
    <div className="planner-presets"><span><Sparkles size={14} /> Want to explore first?</span><div>{PRESETS.map((preset) => <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>{preset.label}</button>)}</div></div>
  </div>;
}
