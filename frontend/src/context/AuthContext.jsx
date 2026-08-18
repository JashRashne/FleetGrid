import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchTrips, deleteTripApi } from '../services/api';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 'usr_demo_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@mintfleet.com',
  role: 'Long-Haul Driver (CDL-A)',
  carrier: 'MileMint Logistics LLC',
  dotNumber: 'USDOT 3849201',
  truckId: 'TRK-9042',
  trailerId: 'TLR-5510',
  homeTerminal: 'Chicago, IL',
  cycleHoursUsed: 26.5,
  cycleLimit: 70.0,
  driveTimeRemaining: 8.7,
  shiftTimeRemaining: 11.2,
};

const SAMPLE_EVENTS_1 = [
  {
    event_id: 'evt_sample_01',
    event_type: 'START',
    duty_status: 'ON_DUTY_NOT_DRIVING',
    start_minutes: 0,
    end_minutes: 60,
    duration_minutes: 60,
    latitude: 41.8781,
    longitude: -87.6298,
    location_name: 'Chicago, IL',
    remark: 'Pre-trip inspection & departure prep',
    counts_toward_drive: false,
    counts_toward_shift: true,
    counts_toward_cycle: true
  },
  {
    event_id: 'evt_sample_02',
    event_type: 'DRIVE_SEGMENT',
    duty_status: 'DRIVING',
    start_minutes: 60,
    end_minutes: 270,
    duration_minutes: 210,
    route_distance_miles: 182.4,
    latitude: 39.7684,
    longitude: -86.1581,
    location_name: 'Chicago, IL to Indianapolis, IN',
    remark: 'Driving (182 mi)',
    counts_toward_drive: true,
    counts_toward_shift: true,
    counts_toward_cycle: true
  },
  {
    event_id: 'evt_sample_03',
    event_type: 'PICKUP_UNLOAD',
    duty_status: 'ON_DUTY_NOT_DRIVING',
    start_minutes: 270,
    end_minutes: 330,
    duration_minutes: 60,
    latitude: 39.7684,
    longitude: -86.1581,
    location_name: 'Indianapolis, IN',
    remark: 'Shipper Loading & Bill of Lading check',
    counts_toward_drive: false,
    counts_toward_shift: true,
    counts_toward_cycle: true
  },
  {
    event_id: 'evt_sample_04',
    event_type: 'REST_BREAK_30',
    duty_status: 'OFF_DUTY',
    start_minutes: 330,
    end_minutes: 360,
    duration_minutes: 30,
    latitude: 39.3556,
    longitude: -85.9667,
    location_name: 'Edinburgh, IN (Rest Area)',
    remark: 'Mandatory 30-Minute Rest Break',
    counts_toward_drive: false,
    counts_toward_shift: false,
    counts_toward_cycle: false
  },
  {
    event_id: 'evt_sample_05',
    event_type: 'DRIVE_SEGMENT',
    duty_status: 'DRIVING',
    start_minutes: 360,
    end_minutes: 720,
    duration_minutes: 360,
    route_distance_miles: 330.1,
    latitude: 36.1627,
    longitude: -86.7816,
    location_name: 'Indianapolis, IN to Nashville, TN',
    remark: 'Driving (330 mi)',
    counts_toward_drive: true,
    counts_toward_shift: true,
    counts_toward_cycle: true
  },
  {
    event_id: 'evt_sample_06',
    event_type: 'SLEEPER_RESET_10',
    duty_status: 'SLEEPER_BERTH',
    start_minutes: 720,
    end_minutes: 1320,
    duration_minutes: 600,
    latitude: 36.1627,
    longitude: -86.7816,
    location_name: 'Nashville, TN (Pilot Flying J)',
    remark: '10-Hour Sleeper Berth Rest Reset',
    counts_toward_drive: false,
    counts_toward_shift: false,
    counts_toward_cycle: false
  },
  {
    event_id: 'evt_sample_07',
    event_type: 'DRIVE_SEGMENT',
    duty_status: 'DRIVING',
    start_minutes: 1320,
    end_minutes: 1560,
    duration_minutes: 240,
    route_distance_miles: 199.5,
    latitude: 33.7490,
    longitude: -84.3880,
    location_name: 'Nashville, TN to Atlanta, GA',
    remark: 'Driving (200 mi)',
    counts_toward_drive: true,
    counts_toward_shift: true,
    counts_toward_cycle: true
  },
  {
    event_id: 'evt_sample_08',
    event_type: 'DROPOFF_UNLOAD',
    duty_status: 'ON_DUTY_NOT_DRIVING',
    start_minutes: 1560,
    end_minutes: 1620,
    duration_minutes: 60,
    latitude: 33.7490,
    longitude: -84.3880,
    location_name: 'Atlanta, GA',
    remark: 'Receiver Delivery & Unload',
    counts_toward_drive: false,
    counts_toward_shift: true,
    counts_toward_cycle: true
  }
];

const SAMPLE_LOGS_1 = [
  {
    day_number: 1,
    date: '2026-08-18',
    driver_name: 'Alex Morgan (CDL-A)',
    carrier_name: 'MileMint Logistics LLC',
    truck_number: 'TRK-9042',
    trailer_number: 'TLR-5510',
    total_miles_driving_today: 512.5,
    main_office_address: '100 Logistics Blvd, Suite 400, Chicago, IL',
    home_terminal_address: '770 Freight Way, Chicago, IL',
    totals_hours: { off_duty: 10.5, sleeper_berth: 0.0, driving: 9.5, on_duty_not_driving: 4.0, total: 24.0 },
    segments: [
      { start_hour: 0, end_hour: 6.0, duty_status: 'OFF_DUTY', remark: 'Off Duty Prior to Dispatch', location: 'Chicago, IL' },
      { start_hour: 6.0, end_hour: 7.0, duty_status: 'ON_DUTY_NOT_DRIVING', remark: 'Pre-trip inspection', location: 'Chicago, IL' },
      { start_hour: 7.0, end_hour: 10.5, duty_status: 'DRIVING', remark: 'Driving to Shipper', location: 'Indianapolis, IN' },
      { start_hour: 10.5, end_hour: 11.5, duty_status: 'ON_DUTY_NOT_DRIVING', remark: 'Shipper Loading', location: 'Indianapolis, IN' },
      { start_hour: 11.5, end_hour: 12.0, duty_status: 'OFF_DUTY', remark: '30-min Rest Break', location: 'Edinburgh, IN' },
      { start_hour: 12.0, end_hour: 18.0, duty_status: 'DRIVING', remark: 'Driving to Nashville', location: 'Nashville, TN' },
      { start_hour: 18.0, end_hour: 24.0, duty_status: 'OFF_DUTY', remark: '10-Hour Off-Duty Sleeper Reset', location: 'Nashville, TN' }
    ],
    remarks: [
      { time_hour: 6.0, location: 'Chicago, IL', text: 'Pre-trip inspection' },
      { time_hour: 10.5, location: 'Indianapolis, IN', text: 'Shipper Loading' },
      { time_hour: 11.5, location: 'Edinburgh, IN', text: '30-min Rest Break' },
      { time_hour: 18.0, location: 'Nashville, TN', text: '10-Hour Sleeper Reset' }
    ],
    recap: { on_duty_today_hours: 13.5, cycle_hours_at_start: 24.5, cycle_hours_cumulative: 38.0, cycle_hours_remaining: 32.0 }
  },
  {
    day_number: 2,
    date: '2026-08-19',
    driver_name: 'Alex Morgan (CDL-A)',
    carrier_name: 'MileMint Logistics LLC',
    truck_number: 'TRK-9042',
    trailer_number: 'TLR-5510',
    total_miles_driving_today: 199.5,
    main_office_address: '100 Logistics Blvd, Suite 400, Chicago, IL',
    home_terminal_address: '770 Freight Way, Chicago, IL',
    totals_hours: { off_duty: 19.0, sleeper_berth: 0.0, driving: 4.0, on_duty_not_driving: 1.0, total: 24.0 },
    segments: [
      { start_hour: 0, end_hour: 4.0, duty_status: 'OFF_DUTY', remark: 'Completing 10-Hour Reset', location: 'Nashville, TN' },
      { start_hour: 4.0, end_hour: 8.0, duty_status: 'DRIVING', remark: 'Driving to Atlanta Receiver', location: 'Atlanta, GA' },
      { start_hour: 8.0, end_hour: 9.0, duty_status: 'ON_DUTY_NOT_DRIVING', remark: 'Receiver Unloading', location: 'Atlanta, GA' },
      { start_hour: 9.0, end_hour: 24.0, duty_status: 'OFF_DUTY', remark: 'Off Duty Post-Trip', location: 'Atlanta, GA' }
    ],
    remarks: [
      { time_hour: 4.0, location: 'Nashville, TN', text: 'Departing after reset' },
      { time_hour: 8.0, location: 'Atlanta, GA', text: 'Receiver Unloading' },
      { time_hour: 9.0, location: 'Atlanta, GA', text: 'Trip Completed' }
    ],
    recap: { on_duty_today_hours: 5.0, cycle_hours_at_start: 38.0, cycle_hours_cumulative: 43.0, cycle_hours_remaining: 27.0 }
  }
];

const DEFAULT_SAMPLE_TRIPS = [
  {
    id: 'trip_sample_1',
    created_at: '2026-08-18T10:00:00Z',
    origin_name: 'Chicago, IL',
    pickup_name: 'Indianapolis, IN',
    dropoff_name: 'Atlanta, GA',
    locations: {
      current: { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
      pickup: { name: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581 },
      dropoff: { name: 'Atlanta, GA', lat: 33.7490, lng: -84.3880 }
    },
    summary: {
      total_miles: 712,
      total_duration_hours: 14.8,
      total_drive_time_hours: 9.5,
      driving_hours: 9.5,
      days_required: 2,
      fuel_stops_count: 1,
      is_compliant: true
    },
    events: SAMPLE_EVENTS_1,
    daily_logs: SAMPLE_LOGS_1,
    route_geometry: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-87.6298, 41.8781],
          [-86.1581, 39.7684],
          [-85.7585, 38.2527],
          [-86.7816, 36.1627],
          [-85.3097, 35.0456],
          [-84.3880, 33.7490]
        ]
      }
    },
    turn_by_turn_steps: [
      { instruction: 'Start from Chicago, IL on I-90 E / I-94 E', distance_miles: 18.2, duration_minutes: 22, name: 'I-90 E' },
      { instruction: 'Merge onto I-65 S toward Indianapolis', distance_miles: 164.2, duration_minutes: 188, name: 'I-65 S' },
      { instruction: 'Arrive at Shipper in Indianapolis, IN for Loading', distance_miles: 0, duration_minutes: 60, name: 'Indianapolis Terminal' },
      { instruction: 'Continue on I-65 S toward Louisville, KY', distance_miles: 114.5, duration_minutes: 120, name: 'I-65 S' },
      { instruction: 'Merge onto I-24 E toward Chattanooga / Atlanta', distance_miles: 135.0, duration_minutes: 145, name: 'I-24 E' },
      { instruction: 'Merge onto I-75 S into Atlanta, GA', distance_miles: 118.0, duration_minutes: 125, name: 'I-75 S' },
      { instruction: 'Arrive at Receiver in Atlanta, GA', distance_miles: 0, duration_minutes: 60, name: 'Atlanta Receiver' }
    ],
    disclaimers: [
      'Calculated in accordance with FMCSA 49 CFR Part 395 rules for property-carrying vehicles.',
      'Includes mandatory 30-minute rest breaks and 10-hour sleeper berth off-duty periods.'
    ]
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('milemint_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('milemint_trips');
      return (saved && JSON.parse(saved).length > 0) ? JSON.parse(saved) : DEFAULT_SAMPLE_TRIPS;
    } catch {
      return DEFAULT_SAMPLE_TRIPS;
    }
  });

  const [activeTrip, setActiveTrip] = useState(() => {
    try {
      const savedActive = localStorage.getItem('milemint_active_trip');
      return savedActive ? JSON.parse(savedActive) : null;
    } catch {
      return null;
    }
  });

  // Fetch backend trips on load and merge complete payloads
  useEffect(() => {
    async function loadBackendTrips() {
      try {
        const backendTrips = await fetchTrips();
        if (backendTrips && backendTrips.length > 0) {
          const formatted = backendTrips.map(t => ({
            ...t,
            id: String(t.id),
            createdAt: t.created_at || t.createdAt,
            origin_name: t.origin_name || t.locations?.current?.name || 'Origin',
            pickup_name: t.pickup_name || t.locations?.pickup?.name || 'Pickup',
            dropoff_name: t.dropoff_name || t.locations?.dropoff?.name || 'Dropoff',
            locations: t.locations || t.locations_json || {
              current: { name: t.origin_name || 'Start' },
              pickup: { name: t.pickup_name || 'Pickup' },
              dropoff: { name: t.dropoff_name || 'Dropoff' }
            },
            summary: t.summary || t.summary_json || {
              total_miles: t.total_distance_miles || 712,
              total_duration_hours: t.total_trip_duration_hours || 14.8,
              driving_hours: t.total_drive_time_hours || 9.5,
              days_required: t.days_required || 2,
              fuel_stops_count: t.fuel_stops_count || 1,
              is_compliant: true
            },
            events: t.events || t.events_json || [],
            route_geometry: t.route_geometry || t.route_geometry_json,
            turn_by_turn_steps: t.turn_by_turn_steps || t.turn_by_turn_steps_json || [],
            daily_logs: t.daily_logs || [],
            disclaimers: t.disclaimers || t.disclaimers_json || []
          }));
          setSavedTrips(formatted);
        }
      } catch (err) {
        console.warn("Could not sync trips from backend:", err);
      }
    }
    loadBackendTrips();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('milemint_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('milemint_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('milemint_trips', JSON.stringify(savedTrips));
  }, [savedTrips]);

  useEffect(() => {
    if (activeTrip) {
      localStorage.setItem('milemint_active_trip', JSON.stringify(activeTrip));
    } else {
      localStorage.removeItem('milemint_active_trip');
    }
  }, [activeTrip]);

  const login = (email, name = 'Alex Morgan') => {
    const newUser = {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
      name: name || DEMO_USER.name
    };
    setUser(newUser);
    return newUser;
  };

  const loginDemo = () => {
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const logout = () => {
    setUser(null);
  };

  const saveTrip = (tripData) => {
    const newTrip = {
      ...tripData,
      id: String(tripData.id || `trip_${Date.now()}`),
      createdAt: tripData.created_at || new Date().toISOString()
    };
    setSavedTrips(prev => [newTrip, ...prev.filter(t => t.id !== newTrip.id)]);
    setActiveTrip(newTrip);
    return newTrip;
  };

  const deleteTrip = async (tripId) => {
    setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    if (activeTrip?.id === tripId) {
      setActiveTrip(null);
    }
    try {
      await deleteTripApi(tripId);
    } catch (e) {
      console.warn("Delete API failed:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginDemo,
        logout,
        savedTrips,
        saveTrip,
        deleteTrip,
        activeTrip,
        setActiveTrip
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
