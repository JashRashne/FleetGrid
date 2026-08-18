import React, { createContext, useContext, useState, useEffect } from 'react';

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

const DEFAULT_SAMPLE_TRIPS = [
  {
    id: 'trip_sample_1',
    createdAt: '2026-08-16T14:20:00Z',
    locations: {
      current: { name: 'Chicago, IL' },
      pickup: { name: 'Indianapolis, IN' },
      dropoff: { name: 'Atlanta, GA' }
    },
    summary: {
      total_miles: 712,
      total_duration_hours: 14.8,
      driving_hours: 12.2,
      rest_hours: 10.0,
      days_required: 2,
      fuel_stops_count: 1,
      estimated_fuel_gallons: 109.5,
      estimated_fuel_cost: 416.10,
      is_compliant: true
    }
  },
  {
    id: 'trip_sample_2',
    createdAt: '2026-08-12T09:00:00Z',
    locations: {
      current: { name: 'Dallas, TX' },
      pickup: { name: 'Memphis, TN' },
      dropoff: { name: 'Nashville, TN' }
    },
    summary: {
      total_miles: 680,
      total_duration_hours: 13.5,
      driving_hours: 11.4,
      rest_hours: 10.0,
      days_required: 2,
      fuel_stops_count: 1,
      estimated_fuel_gallons: 104.6,
      estimated_fuel_cost: 397.48,
      is_compliant: true
    }
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
      return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_TRIPS;
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
      id: `trip_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...tripData
    };
    setSavedTrips(prev => [newTrip, ...prev]);
    setActiveTrip(newTrip);
    return newTrip;
  };

  const deleteTrip = (tripId) => {
    setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    if (activeTrip?.id === tripId) {
      setActiveTrip(null);
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
