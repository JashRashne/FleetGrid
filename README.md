# 🚛 FMCSA HOS-Aware Trip Planner & Daily Log Generator

A full-stack web application built with **Django (Backend)** and **React (Frontend)** that provides commercial truck routing and planning logic modeled on Federal Motor Carrier Safety Administration (FMCSA) **Hours of Service (HOS) 70-Hour / 8-Day rules** and dynamically generates high-fidelity **24-Hour Driver's Daily Log Sheets (Vector SVG)**.

---

## 🌟 Key Features

* **🎨 Claymorphism UI / UX**: Tactile 3D cards, puffy interactive pills, inset inputs, and responsive layouts.
* **⏱️ Integer-Minute HOS Precision**: HOS trip-planning logic operating in integer minutes across:
  * **11-Hour Driving Limit** (49 CFR § 395.3(a)(3))
  * **14-Hour Duty Window** (49 CFR § 395.3(a)(2))
  * **30-Minute Rest Break** required after 8 cumulative driving hours (49 CFR § 395.3(a)(3)(ii)) — *satisfied by non-driving fuel/pickup*
  * **10-Hour Sleeper Berth / Off-Duty Reset** (49 CFR § 395.3(a)(1))
  * **70-Hour / 8-Day Cycle Rule** with conservative **34-Hour Restart** planning strategy (49 CFR § 395.3(b)(2) & (c))
* **🛢️ 1,000-Mile Fuel Scheduling**: Automatic stop generation at $\le 1,000\text{ miles}$ intervals.
* **📦 1-Hour Shipper / Receiver Windows**: 1-hour On-Duty loading at pickup and 1-hour unloading at drop-off.
* **🗺️ Interactive Route Map**: Leaflet map with OSRM driving geometry and custom markers for Start, Pickup, Dropoff, Fuel, Breaks, and 10h Resets.
* **📄 Vector SVG ELD-Style Daily Log Sheets**: Pixel-perfect vector reproduction of standard 24-hour log sheets (`blank-paper-log.png`) with continuous stepped line plotting, subtotal validation summing to $24.00\text{ hrs}$, remarks drop lines, and 70-hour recap table.
* **🖨️ Multi-Day Pagination & Print/PDF Export**: Dedicated day navigation tabs for multi-day trips and print stylesheets.

---

## 📋 Assessment Assumptions & Regulatory Modeling

1. **Current Cycle Used Limitation (70-Hour / 8-Day Rolling Window)**:
   * The assessment input supplies only aggregate `current_cycle_used_hours` and does not provide the driver's previous 8 days of timestamped duty history.
   * Therefore, a true rolling 70-hour/8-day window calculation cannot be reconstructed from historical day-by-day drop-offs.
   * Our planner conservatively assumes previously accumulated cycle hours do not roll off during the planned trip. If no driving capacity remains, it utilizes a 34-hour restart as a conservative planning strategy before further driving.
   * A 34-hour restart is an operational planning strategy in this model and is not described as universally legally mandatory.

2. **Fresh Daily HOS Clock Assumption**:
   * The assessment does not provide the driver's current daily duty-shift history immediately preceding dispatch.
   * Therefore, the planner assumes the trip begins after a qualifying daily rest period with fresh daily clocks:
     * 11-hour driving clock = 0 used (11.0h remaining)
     * 14-hour duty window = 0 elapsed (14.0h remaining)
     * 8-hour cumulative-driving break clock = 0 elapsed (8.0h remaining)
   * The generated first-day log represents any time prior to departure on Day 1 as `OFF_DUTY`.

---

## 🏗️ Architecture & Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│                   React 18 + Vite Frontend               │
│  - Claymorphic Design System (index.css)                 │
│  - Leaflet Map & Custom Stop Markers                     │
│  - Vector SVG 24-Hour Daily Log Sheet Generator          │
│  - Turn-by-Turn Directions & Chronological Timeline      │
└────────────────────────────┬─────────────────────────────┘
                             │ JSON REST API
┌────────────────────────────▼─────────────────────────────┐
│                   Django 5 + DRF Backend                 │
│  - Pure Domain HOS Engine (hos_engine.py)                │
│  - OSRM Road Network Routing & Geometry Interpolation    │
│  - OpenStreetMap Nominatim Geocoding with Caching        │
│  - 24-Hour Midnight Day Slicer (log_generator.py)        │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Local Development

### 1. Prerequisites
* Python 3.10+
* Node.js 18+ and npm

### 2. Backend Setup (Django)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py test api  # Run automated test suite
python manage.py runserver 8000
```
Backend API will be live at: `http://127.0.0.1:8000/`

### 3. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: `http://localhost:5173/`

---

## 🧪 Automated Testing

The backend includes a comprehensive unit test suite covering regulatory boundary conditions:
```bash
cd backend
./venv/bin/python manage.py test api
```
* **Tests Passed (12/12)**:
  * 8-Hour continuous driving break insertion
  * Pickup and fuel stop break clock resets
  * 11-Hour driving limit 10-hour sleeper trigger
  * 14-Hour duty window 10-hour sleeper trigger
  * 70-Hour cycle 34-hour restart trigger
  * 1,000-mile fuel stop scheduling
  * Daily 24-hour log sheet 1,440-minute day slicer
  * API input validation (0 to 70 hours cycle range)

---

## 📡 API Contract (`POST /api/plan-trip/`)

### Request
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Atlanta, GA",
  "current_cycle_used_hours": 24.5,
  "departure_time": "2026-08-18T08:00:00Z"
}
```

### Response
* `summary`: Aggregate distance, drive time, trip duration, stop counts, and cycle recap.
* `locations`: Geocoded coordinates for Current, Pickup, Dropoff.
* `route_geometry`: Full GeoJSON LineString coordinates for map polyline.
* `turn_by_turn_steps`: Step-by-step navigation instructions.
* `events`: Chronological list of all generated HOS events.
* `daily_logs`: Array of 24-hour log sheet datasets (Day 1, Day 2, etc.) for SVG rendering.

---

## 📹 3–5 Minute Loom Video Walkthrough Structure

1. **0:00 – 0:45 | Overview**: Problem statement, FMCSA 70hr/8day HOS rules, and Claymorphic UI tour.
2. **0:45 – 2:00 | Live Demo**:
   * Inputting Origin, Shipper, Receiver, and Cycle Used (or using quick presets).
   * Reviewing the Leaflet route map with fuel and rest pins.
   * Exploring the high-fidelity SVG Driver's Daily Log sheets (Days 1 & 2), stepped duty graph, 24.0h balance, and recap table.
3. **2:00 – 3:30 | Architecture & HOS Engine Code Tour**:
   * `hos_engine.py` integer-minute math and boundary rules.
   * `log_generator.py` midnight day-slicing logic.
   * `DailyLogSheet.jsx` SVG vector rendering.
4. **3:30 – 4:30 | Automated Tests & Live Deployment**:
   * Demonstration of `python manage.py test api` passing all 12 tests.
   * Live deployment setup on Vercel & Render.
