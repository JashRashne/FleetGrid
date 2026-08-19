import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Navigation } from 'lucide-react';

// Custom Map Bounds Auto-fitter
function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch (err) {
        console.warn('Map bounds fit error:', err);
      }
    }
  }, [bounds, map]);
  return null;
}

// Create custom HTML marker icons
function createCustomIcon(symbol, bgColor, borderColor) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid ${borderColor};
        cursor: pointer;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
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

export default function RouteMap(props) {
  const trip = props.trip || {};
  const locations = props.locations || trip.locations || trip.locations_json;
  const routeGeometry = props.routeGeometry || props.route_geometry || trip.route_geometry || trip.route_geometry_json;
  const events = props.events || trip.events || trip.events_json || [];

  if (!locations || (!locations.current && !locations.pickup && !locations.dropoff)) {
    return (
      <div className="map-card" style={{ padding: '30px', textAlign: 'center', background: '#fff', border: '1px solid #dedede' }}>
        <p style={{ color: '#777' }}>Map coordinates are loading or unavailable for this route.</p>
      </div>
    );
  }

  const currentLoc = locations.current || {};
  const pickupLoc = locations.pickup || {};
  const dropoffLoc = locations.dropoff || {};

  const getLat = (loc) => parseFloat(loc.lat ?? loc.latitude ?? 0);
  const getLng = (loc) => parseFloat(loc.lng ?? loc.longitude ?? loc.lon ?? 0);

  // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
  const rawCoords = routeGeometry?.coordinates || (Array.isArray(routeGeometry) ? routeGeometry : []);
  const polylinePositions = rawCoords.map(coord => [coord[1], coord[0]]).filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]));

  // Collect key stop events for map markers
  const stopMarkers = [];

  // Start Marker
  if (getLat(currentLoc) && getLng(currentLoc)) {
    stopMarkers.push({
      id: 'start',
      pos: [getLat(currentLoc), getLng(currentLoc)],
      icon: ICONS.start,
      title: `Start: ${currentLoc.name || trip.origin_name || 'Origin'}`,
      desc: 'Trip Origin / Pre-trip Inspection'
    });
  }

  // Pickup Marker
  if (getLat(pickupLoc) && getLng(pickupLoc)) {
    stopMarkers.push({
      id: 'pickup',
      pos: [getLat(pickupLoc), getLng(pickupLoc)],
      icon: ICONS.pickup,
      title: `Pickup: ${pickupLoc.name || trip.pickup_name || 'Shipper'}`,
      desc: 'Shipper Loading (1 Hour On-Duty)'
    });
  }

  // Dropoff Marker
  if (getLat(dropoffLoc) && getLng(dropoffLoc)) {
    stopMarkers.push({
      id: 'dropoff',
      pos: [getLat(dropoffLoc), getLng(dropoffLoc)],
      icon: ICONS.dropoff,
      title: `Dropoff: ${dropoffLoc.name || trip.dropoff_name || 'Receiver'}`,
      desc: 'Receiver Unloading (1 Hour On-Duty)'
    });
  }

  // En-Route HOS Stop Markers
  (events || []).forEach((evt, idx) => {
    const lat = parseFloat(evt.latitude);
    const lon = parseFloat(evt.longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
      if (evt.event_type === 'FUEL_STOP') {
        stopMarkers.push({
          id: evt.event_id || `fuel-${idx}`,
          pos: [lat, lon],
          icon: ICONS.fuel,
          title: `Fuel Stop (${evt.route_distance_miles || evt.distance_miles || 0} mi)`,
          desc: `${evt.location_name || 'En route'} — 30m On-Duty Fueling`
        });
      } else if (evt.event_type === 'REST_BREAK_30') {
        stopMarkers.push({
          id: evt.event_id || `rest-${idx}`,
          pos: [lat, lon],
          icon: ICONS.rest,
          title: `30-Min Rest Break (${evt.route_distance_miles || evt.distance_miles || 0} mi)`,
          desc: `${evt.location_name || 'En route'} — Mandatory HOS Break`
        });
      } else if (evt.event_type === 'SLEEPER_RESET_10') {
        stopMarkers.push({
          id: evt.event_id || `sleeper-${idx}`,
          pos: [lat, lon],
          icon: ICONS.sleeper,
          title: `10-Hour Sleeper Reset (${evt.route_distance_miles || evt.distance_miles || 0} mi)`,
          desc: `${evt.location_name || 'En route'} — 10h Consecutive Rest`
        });
      } else if (evt.event_type === 'CYCLE_RESTART_34') {
        stopMarkers.push({
          id: evt.event_id || `restart-${idx}`,
          pos: [lat, lon],
          icon: ICONS.restart,
          title: `34-Hour Restart (${evt.route_distance_miles || evt.distance_miles || 0} mi)`,
          desc: `${evt.location_name || 'En route'} — Full 70h Cycle Reset`
        });
      }
    }
  });

  const allBounds = stopMarkers.map(m => m.pos);
  if (polylinePositions.length > 0) {
    allBounds.push(...polylinePositions);
  }

  const defaultCenter = stopMarkers.length > 0 
    ? stopMarkers[0].pos 
    : (polylinePositions.length > 0 ? polylinePositions[0] : [39.8283, -98.5795]);

  return (
    <div className="map-card" style={{ background: '#fff', border: '1px solid #dedede', padding: '20px' }}>
      <div className="map-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapIcon size={18} color="#202020" />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111', margin: 0 }}>Interactive Route & Stop Map</h3>
        </div>
        <div style={{ fontSize: '12px', color: '#777', fontWeight: 500 }}>
          OSRM Route • {stopMarkers.length} Marked Waypoints
        </div>
      </div>

      <div style={{ height: '440px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', borderRadius: '0' }}
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
                  <strong style={{ fontSize: '13px', color: '#111', display: 'block' }}>{marker.title}</strong>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '3px', margin: 0 }}>{marker.desc}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {allBounds.length > 0 && <MapBoundsUpdater bounds={allBounds} />}
        </MapContainer>
      </div>
    </div>
  );
}
