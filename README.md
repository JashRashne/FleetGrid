# FleetGrid — FMCSA HOS-Aware Trip Planner & ELD Log Generator

> **A production-grade full-stack application** that plans commercial truck routes in compliance with FMCSA Hours of Service federal regulations and dynamically generates pixel-perfect 24-hour Driver Daily Log Sheets as vector SVGs — the kind of output an ELD device would produce.

<br/>

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tests](https://img.shields.io/badge/Tests-12%2F12%20Passing-22C55E?style=for-the-badge&logo=pytest&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

</div>

---

## 📖 What This Is

Most trucking apps show a route on a map. This one plans the entire trip **around federal law**.

Given an origin, a pickup stop, a delivery destination, and how many hours a driver has already used in their 70-hour weekly cycle, this application:

1. **Geocodes** all addresses using OpenStreetMap Nominatim (with local cache)
2. **Calculates** real driving distances and route geometry via the OSRM road network
3. **Simulates** the entire trip minute-by-minute through an FMCSA HOS rules engine — inserting mandatory rest breaks, 10-hour sleeper resets, fuel stops, and shipper/receiver windows exactly where federal law requires them
4. **Slices** the resulting event stream across midnight boundaries and renders a **pixel-perfect 24-hour Driver Daily Log Sheet** (SVG) for each day of the trip — the exact document a driver submits as their ELD record

---

## 🏗️ System Architecture

<div align="center">
  <img src="https://res.cloudinary.com/dgbgxtsrl/image/upload/v1787170420/ChatGPT_Image_Aug_20_2026_01_43_08_AM_qv4rcl.png" alt="FleetGrid System Architecture Diagram" width="100%" />
</div>

---

## 🔄 End-to-End Data Flow

<div align="center">
  <img src="https://res.cloudinary.com/dgbgxtsrl/image/upload/v1787170510/ChatGPT_Image_Aug_20_2026_01_45_00_AM_m0yhx5.png" alt="FleetGrid End-to-End Data Flow Diagram" width="100%" />
</div>

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | SPA with fast HMR dev experience |
| **UI Design System** | Vanilla CSS (Claymorphism) | Tactile 3D cards, puffy pills, inset inputs |
| **Mapping** | Leaflet.js + React-Leaflet | Interactive route map with custom markers |
| **SVG Rendering** | React inline SVG | Pixel-perfect ELD-style log sheet generation |
| **Backend Framework** | Django 5 | Project structure, auth, ORM |
| **REST API** | Django REST Framework | Serialization, validation, viewsets |
| **HOS Engine** | Pure Python (domain logic) | Stateless integer-minute FMCSA simulation |
| **Geocoding** | OSM Nominatim | Address → coordinates with local cache |
| **Road Routing** | OSRM (open source) | Real driving distances and polyline geometry |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Trip and log persistence |
| **Testing** | Django TestCase | 12 regulatory boundary unit tests |

---

## 📜 FMCSA Regulatory Rules Implemented

The HOS engine implements **49 CFR Part 395** with integer-minute precision. Every rule below is covered by an automated test.

| Rule | Regulation | Trigger |
|---|---|---|
| **11-Hour Driving Limit** | 49 CFR § 395.3(a)(3) | Cannot drive after 11 hours of driving in a shift |
| **14-Hour Duty Window** | 49 CFR § 395.3(a)(2) | Cannot drive after 14 hours from shift start |
| **30-Minute Rest Break** | 49 CFR § 395.3(a)(3)(ii) | Required after 8 cumulative driving hours |
| **10-Hour Off-Duty Reset** | 49 CFR § 395.3(a)(1) | Resets both 11h and 14h daily clocks |
| **70-Hour / 8-Day Cycle** | 49 CFR § 395.3(b)(2) | Cannot drive once 70 cycle hours are used |
| **34-Hour Restart** | 49 CFR § 395.3(c) | Conservative restart strategy when cycle exhausted |
| **1,000-Mile Fuel Stops** | Operational best practice | Auto-inserted at ≤ 1,000-mile intervals |
| **1-Hour Shipper Window** | Operational modeling | On-Duty loading at Pickup and Dropoff |

> **Modeling Note:** The planner conservatively assumes accumulated cycle hours do not roll off during the planned trip (since day-by-day historical drop-off data is not provided). If cycle capacity is exhausted, a 34-hour restart is scheduled before further driving resumes.

---

## 📡 API Contract

### `POST /api/plan-trip/`

**Request**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location":  "Indianapolis, IN",
  "dropoff_location": "Atlanta, GA",
  "current_cycle_used_hours": 24.5,
  "departure_time": "2026-08-18T08:00:00Z"
}
```

**Response Shape**
```json
{
  "summary": {
    "total_distance_miles": 730,
    "total_drive_time_hrs": 11.2,
    "trip_duration_hrs": 28.5,
    "fuel_stops": 1,
    "rest_stops": 2,
    "cycle_hours_after_trip": 50.7
  },
  "locations": { "current": {}, "pickup": {}, "dropoff": {} },
  "route_geometry": { "type": "LineString", "coordinates": [] },
  "turn_by_turn_steps": [
    { "instruction": "Head south on I-65", "distance_miles": 4.2 }
  ],
  "events": [
    { "type": "DRIVING",   "start": "2026-08-18T08:00:00Z", "duration_min": 180 },
    { "type": "FUEL_STOP", "start": "2026-08-18T11:00:00Z", "duration_min": 30  }
  ],
  "daily_logs": [
    {
      "day": 1,
      "date": "2026-08-18",
      "status_totals": { "off_duty": 480, "sleeper_berth": 0, "driving": 660, "on_duty": 300 },
      "graph_segments": [],
      "recap_70hr": {}
    }
  ]
}
```

---

## 🧪 Automated Tests — 12 / 12 Passing ✅

```bash
cd backend
python manage.py test api
```

```
test_8hr_continuous_driving_break_inserted ............. OK
test_fuel_stop_resets_break_clock ..................... OK
test_pickup_stop_resets_break_clock ................... OK
test_11hr_driving_limit_triggers_sleeper_berth ......... OK
test_14hr_duty_window_triggers_sleeper_berth ........... OK
test_70hr_cycle_triggers_34hr_restart ................. OK
test_1000_mile_fuel_stop_scheduling ................... OK
test_daily_log_1440_min_subtotal_balance .............. OK
test_api_input_validation_cycle_range_0_to_70 ......... OK
test_api_input_validation_missing_fields .............. OK
test_multi_day_midnight_slicing_accuracy .............. OK
test_34hr_restart_resumes_correct_clocks .............. OK

Ran 12 tests in 0.847s — OK
```

---

## 🚀 Local Development Setup

### Prerequisites
- Python **3.10+**
- Node.js **18+** and npm

### 1 · Backend (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py test api       # Verify all 12 tests pass
python manage.py runserver 8000
```

> Backend API live at → `http://127.0.0.1:8000/`

### 2 · Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

> Frontend live at → `http://localhost:5173/`

### 3 · Environment Variables

```bash
# backend/.env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3   # swap for postgres://... in production
```

---

## 📁 Project Structure

```
truck_fullstack/
├── backend/
│   ├── api/
│   │   ├── services/
│   │   │   ├── hos_engine.py       # ★ FMCSA HOS rules engine — pure domain, zero framework coupling
│   │   │   ├── log_generator.py    #   Midnight slicer & stepped SVG graph plotter
│   │   │   ├── geocoding.py        #   Nominatim client with local address cache
│   │   │   └── routing.py          #   OSRM client & polyline decoder
│   │   ├── views.py                #   DRF viewsets & plan-trip orchestration
│   │   ├── serializers.py          #   Request / response schema validation
│   │   ├── models.py               #   Trip, SavedLog, User Profile
│   │   └── tests/                  #   12 regulatory boundary unit tests
│   └── manage.py
│
└── frontend/
    └── src/
        ├── components/
        │   ├── TripInputForm.jsx    #   Origin / pickup / dropoff / cycle input
        │   ├── RouteMap.jsx         #   Leaflet map + custom stop markers
        │   ├── DailyLogSheet.jsx    # ★ Vector SVG 24-hour ELD log sheet renderer
        │   ├── EventTimeline.jsx    #   Chronological HOS event display
        │   ├── PlannerExperience.jsx#   Main planner workflow state & layout
        │   ├── DashboardPage.jsx    #   Trip history and analytics
        │   └── LogsHubPage.jsx      #   Saved log management
        ├── services/api.js          #   Axios REST client
        └── index.css                #   Claymorphic design system tokens & animations
```

---

## 🎨 Design Philosophy

**Claymorphism** was chosen deliberately — it brings physicality and warmth to a compliance-heavy domain that is traditionally paper-based. The tactile 3D cards and puffy interactive elements reflect the real-world artifacts (paper log books, physical trip manifests) that this software digitizes.

The HOS engine is intentionally a **pure domain module** with zero Django or database dependencies. It is unit-testable in complete isolation, extractable into a microservice, and reusable across different transport modes. Every input and output is a plain Python dict or integer — no framework coupling, no side effects.

---

## 🚢 Deployment

| Service | Platform |
|---|---|
| **Frontend** | [Vercel](https://vercel.com) — automatic deploys from `main` |
| **Backend API** | [Render](https://render.com) — Python web service |
| **Database** | Render Managed PostgreSQL |

---

## 📋 Regulatory Modeling Notes

1. **70-Hour / 8-Day Rolling Window** — Only aggregate `current_cycle_used_hours` is provided as input; per-day historical duty records are not available. The planner conservatively treats all accumulated hours as non-expiring during the trip. A 34-hour restart is used as the planning strategy when cycle hours are exhausted.

2. **Fresh Daily Clock Assumption** — The trip is assumed to begin after a qualifying rest period (11h drive clock = 0, 14h window = 0, 8h break clock = 0). Any time prior to departure on Day 1 is represented as `OFF_DUTY` on the log sheet.

---

*Built with ⚡ by **Jash Rashne** — demonstrating full-stack engineering across a complex regulatory domain: REST API design, pure domain logic without framework coupling, real-world third-party integrations, vector graphics generation, and a production-quality UI — fully tested and deployment-ready.*

