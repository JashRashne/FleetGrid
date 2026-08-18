import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Navigation } from 'lucide-react';

// Custom Map Bounds Auto-fitter
function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

// Create custom clay-styled HTML marker icons
function createCustomIcon(symbol, bgColor, borderColor) {
  return L.divIcon({
    className: 'custom-clay-pin',
    html: `
      <div style="
        background: ${bgColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.6);
        border: 2.5px solid ${borderColor};
        cursor: pointer;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

const ICONS = {
  start: createCustomIcon('🟢', '#ffffff', '#10b981'),
  pickup: createCustomIcon('📦', '#dbeafe', '#2563eb'),
  dropoff: createCustomIcon('🏁', '#fee2e2', '#ef4444'),
  fuel: createCustomIcon('🛢️', '#fef3c7', '#f59e0b'),
  rest: createCustomIcon('🛑', '#f1f5f9', '#64748b'),
  sleeper: createCustomIcon('🛌', '#ede9fe', '#8b5cf6'),
  restart: createCustomIcon('🔄', '#fdf2f8', '#ec4899'),
};

export default function RouteMap({ locations, routeGeometry, events }) {
  if (!locations || !locations.current) return null;

  // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
  const polylinePositions = (routeGeometry?.coordinates || []).map(coord => [coord[1], coord[0]]);

  // Collect key stop events for map markers
  const stopMarkers = [];

  // Start Marker
  stopMarkers.push({
    id: 'start',
    pos: [locations.current.lat, locations.current.lng],
    icon: ICONS.start,
    title: `Start: ${locations.current.name}`,
    desc: 'Trip Origin / Pre-trip'
  });

  // Pickup Marker
  stopMarkers.push({
    id: 'pickup',
    pos: [locations.pickup.lat, locations.pickup.lng],
    icon: ICONS.pickup,
    title: `Pickup: ${locations.pickup.name}`,
    desc: 'Shipper Loading (1 Hour On-Duty)'
  });

  // Dropoff Marker
  stopMarkers.push({
    id: 'dropoff',
    pos: [locations.dropoff.lat, locations.dropoff.lng],
    icon: ICONS.dropoff,
    title: `Dropoff: ${locations.dropoff.name}`,
    desc: 'Receiver Unloading (1 Hour On-Duty)'
  });

  // En-Route HOS Stop Markers
  (events || []).forEach((evt) => {
    if (evt.latitude && evt.longitude && evt.latitude !== 0) {
      if (evt.event_type === 'FUEL_STOP') {
        stopMarkers.push({
          id: evt.event_id,
          pos: [evt.latitude, evt.longitude],
          icon: ICONS.fuel,
          title: `Fuel Stop (${evt.route_distance_miles} mi)`,
          desc: `${evt.location_name} — 30m On-Duty Fueling`
        });
      } else if (evt.event_type === 'REST_BREAK_30') {
        stopMarkers.push({
          id: evt.event_id,
          pos: [evt.latitude, evt.longitude],
          icon: ICONS.rest,
          title: `30-Min Rest Break (${evt.route_distance_miles} mi)`,
          desc: `${evt.location_name} — Mandatory HOS Break`
        });
      } else if (evt.event_type === 'SLEEPER_RESET_10') {
        stopMarkers.push({
          id: evt.event_id,
          pos: [evt.latitude, evt.longitude],
          icon: ICONS.sleeper,
          title: `10-Hour Sleeper Reset (${evt.route_distance_miles} mi)`,
          desc: `${evt.location_name} — 10h Consecutive Rest`
        });
      } else if (evt.event_type === 'CYCLE_RESTART_34') {
        stopMarkers.push({
          id: evt.event_id,
          pos: [evt.latitude, evt.longitude],
          icon: ICONS.restart,
          title: `34-Hour Restart (${evt.route_distance_miles} mi)`,
          desc: `${evt.location_name} — Full 70h Cycle Reset`
        });
      }
    }
  });

  const allBounds = stopMarkers.map(m => m.pos);
  if (polylinePositions.length > 0) {
    allBounds.push(...polylinePositions);
  }

  const defaultCenter = [locations.current.lat, locations.current.lng];

  return (
    <div className="clay-card map-card">
      <div className="map-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapIcon size={18} color="#3b82f6" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Interactive Route & Stop Map</h3>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          OSRM Route • {stopMarkers.length} Marked Waypoints
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={false}
        className="leaflet-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#2563eb',
              weight: 5,
              opacity: 0.85,
              lineJoin: 'round',
            }}
          />
        )}

        {stopMarkers.map((marker) => (
          <Marker key={marker.id} position={marker.pos} icon={marker.icon}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>{marker.title}</strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{marker.desc}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapBoundsUpdater bounds={allBounds} />
      </MapContainer>
    </div>
  );
}
