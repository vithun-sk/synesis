# Phantom Classrooms — Backend & Database

Intelligent campus energy-management backend that detects potential electricity waste in classrooms by cross-referencing real-time telemetry with academic timetables, equipment states, and occupancy data.

---

## Table of Contents

1. [Architecture & Overview](#architecture--overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Environment Configuration & Security](#environment-configuration--security)
5. [Database Schema & Migrations](#database-schema--migrations)
6. [Dual-Mode Persistence (In-Memory Demo & Live Supabase)](#dual-mode-persistence)
7. [Waste-Detection Intelligence](#waste-detection-intelligence)
8. [Savings & Financial Cost Formulas](#savings--financial-cost-formulas)
9. [Future Python FastAPI ML Integration](#future-python-fastapi-ml-integration)
10. [REST API Documentation & curl Examples](#rest-api-documentation--curl-examples)
11. [Running Tests](#running-tests)
12. [Testing & Verification Matrix](#testing--verification-matrix)
13. [Troubleshooting Guide](#troubleshooting-guide)

---

## Architecture & Overview

Phantom Classrooms addresses the common campus problem of "phantom" energy consumption: classrooms left fully air-conditioned and illuminated when vacant or when classes have been cancelled.

The system performs:
- **Telemetry Ingestion**: Gathers classroom power draw (Watts), HVAC status, lighting, projector state, and estimated occupancy.
- **Timetable Contextualization**: Matches current campus local time against scheduled academic courses.
- **Waste Intelligence**: Evaluates equipment load against occupancy, scheduled classes, and legitimate HVAC pre-cooling windows.
- **Deduplicated Alert Generation**: Automatically issues categorized waste alerts without spamming duplicates.
- **Financial & Environmental Impact Estimation**: Estimates avoidable kilowatt-hours (kWh) and cost in INR (₹) based on configurable tariff baselines.

---

## Technology Stack

- **Runtime**: Node.js (`>=18.0.0`, tested on `v24.14.1`)
- **Framework**: Express.js (`4.x`, JavaScript ES Modules)
- **Database**: Supabase PostgreSQL (`@supabase/supabase-js 2.x`)
- **Security**: `helmet`, `cors`
- **Validation**: `zod`
- **Testing**: `vitest`, `supertest`
- **Environment**: `dotenv`

---

## Project Structure

```text
Phantom_class/
├── backend/
│   ├── src/
│   │   ├── app.js                      # Express application assembly
│   │   ├── server.js                   # HTTP server entry point & graceful shutdown
│   │   ├── config/
│   │   │   ├── environment.js          # Environment variable parser & Zod validation
│   │   │   └── supabase.js             # Supabase client & connectivity health check
│   │   ├── controllers/
│   │   │   ├── alertController.js       # Alert querying & status transition
│   │   │   ├── analyticsController.js   # Campus overview & room rankings
│   │   │   ├── healthController.js      # System health, DB & ML service probe
│   │   │   ├── readingController.js    # Telemetry ingestion & latest status
│   │   │   ├── roomController.js       # Classroom catalog & detailed view
│   │   │   └── simulationController.js  # Realistic scenario simulation
│   │   ├── data/
│   │   │   ├── memoryStore.js          # High-fidelity in-memory repository
│   │   │   └── seedData.js             # 8 realistic classrooms & scenario seeds
│   │   ├── middleware/
│   │   │   ├── errorHandler.js         # Centralized error handler
│   │   │   ├── notFound.js             # JSON 404 handler
│   │   │   └── validate.js             # Zod request validation middleware
│   │   ├── routes/
│   │   │   ├── alertRoutes.js          # /api/alerts
│   │   │   ├── analyticsRoutes.js      # /api/analytics
│   │   │   ├── healthRoutes.js         # /api/health
│   │   │   ├── readingRoutes.js        # /api/readings
│   │   │   ├── roomRoutes.js           # /api/rooms
│   │   │   └── simulationRoutes.js     # /api/simulate
│   │   ├── services/
│   │   │   ├── alertService.js         # Alert business logic & transitions
│   │   │   ├── analyticsService.js     # Campus metrics aggregator & ranking
│   │   │   ├── mlService.js            # Python FastAPI occupancy integration
│   │   │   ├── readingService.js       # Reading queries & storage
│   │   │   ├── roomService.js          # Room data & operational status
│   │   │   ├── savingsService.js       # Avoidable energy & cost formulas
│   │   │   ├── simulationService.js    # Multi-room simulation generator
│   │   │   └── wasteDetectionService.js # Core waste detection intelligence
│   │   └── utils/
│   │       ├── logger.js               # Structured logger
│   │       └── timeUtils.js            # UTC, staleness & grace-period helpers
│   ├── tests/
│   │   ├── api.test.js                 # Complete API integration test suite
│   │   ├── savingsService.test.js      # Unit tests for savings & cost formulas
│   │   └── wasteDetectionService.test.js # Unit tests for detection & deduplication
│   ├── .env.example
│   └── package.json
├── supabase/
│   ├── schema.sql                      # PostgreSQL schema, indexes, RLS policies
│   └── seed.sql                        # 8 classrooms with repeatable scenario seeds
├── .env.example
├── .gitignore
├── package.json                        # Root npm delegation scripts
└── README.md
```

---

## Environment Configuration & Security

Create a `.env` file in the project root or inside `backend/.env`:

```bash
cp .env.example backend/.env
```

### Configuration Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` | Port for the Express HTTP server |
| `NODE_ENV` | Optional | `development` | Environment mode (`development`, `test`, `production`) |
| `CAMPUS_TIMEZONE` | Optional | `Asia/Kolkata` | Campus local timezone for evaluation |
| `ELECTRICITY_TARIFF_INR_PER_KWH` | Optional | `8` | Configurable demo electricity tariff in INR per kWh |
| `SUPABASE_URL` | Optional | *(empty)* | Supabase project URL (`https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | *(empty)* | Supabase Service Role Secret Key (Backend ONLY) |
| `ML_SERVICE_URL` | Optional | `http://localhost:8000` | URL for external Python FastAPI ML occupancy service |

### Security & Row Level Security (RLS)

- **Backend Role Only**: The `SUPABASE_SERVICE_ROLE_KEY` is strictly used server-side to access and mutate database records. It is never exposed in public responses or client bundles.
- **RLS Enabled by Default**: All four tables (`rooms`, `timetables`, `readings`, `alerts`) have Row Level Security enabled:
  - Anon and authenticated users are granted read-only (`SELECT`) access.
  - Authenticated staff can update alert status to `'acknowledged'` or `'resolved'`.
  - Backend operations bypass RLS via the Supabase Service Role without disabling RLS globally.

---

## Database Schema & Migrations

The database consists of 4 interconnected relational tables in PostgreSQL:

1. **`rooms`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `room_code TEXT NOT NULL UNIQUE`
   - `building TEXT NOT NULL`
   - `floor INTEGER NOT NULL`
   - `capacity INTEGER NOT NULL CHECK (capacity > 0)`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

2. **`timetables`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE`
   - `class_name TEXT NOT NULL`
   - `start_time TIMESTAMPTZ NOT NULL`
   - `end_time TIMESTAMPTZ NOT NULL`
   - `status TEXT NOT NULL CHECK (status IN ('scheduled', 'cancelled', 'completed'))`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

3. **`readings`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE`
   - `recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `estimated_occupancy INTEGER NOT NULL CHECK (estimated_occupancy >= 0)`
   - `class_scheduled BOOLEAN NOT NULL DEFAULT FALSE`
   - `ac_on BOOLEAN NOT NULL DEFAULT FALSE`
   - `lights_on BOOLEAN NOT NULL DEFAULT FALSE`
   - `projector_on BOOLEAN NOT NULL DEFAULT FALSE`
   - `power_watts NUMERIC(10, 2) NOT NULL CHECK (power_watts >= 0)`
   - `data_source TEXT NOT NULL CHECK (data_source IN ('simulated', 'sensor'))`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

4. **`alerts`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE`
   - `reading_id UUID REFERENCES readings(id) ON DELETE SET NULL`
   - `severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high'))`
   - `alert_type TEXT NOT NULL`
   - `title TEXT NOT NULL`
   - `explanation TEXT NOT NULL`
   - `recommendation TEXT NOT NULL`
   - `estimated_wasted_kwh NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (estimated_wasted_kwh >= 0)`
   - `estimated_cost_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (estimated_cost_inr >= 0)`
   - `status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved'))`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### Applying Database Schema & Seed Data

In Supabase SQL Editor or via `psql`:

```sql
-- 1. Run schema migration
\i supabase/schema.sql

-- 2. Run initial demo seed
\i supabase/seed.sql
```

The seed script loads 8 realistic classrooms across 4 campus buildings illustrating:
- Occupied room with active scheduled class (`AEH-101`)
- Empty room with AC and lights running after a cancelled class (`AEH-204`) — High Waste Alert
- Empty room with all equipment off (`STC-102`) — Normal Standby
- Room with lights left on but AC off (`STC-305`) — Low Waste Alert
- Room with stale sensor telemetry (> 3.5 hours old) (`RCC-201`) — Stale Warning
- Room with no class scheduled today (`RCC-105`) — Normal Standby
- Room with class starting in 10 minutes (`NHB-101`) — Legitimate HVAC Pre-cooling
- Room with AC, lights, and projector left running after class ended (`NHB-202`) — Critical Waste Alert

---

## Dual-Mode Persistence

If Supabase credentials are missing or invalid, Phantom Classrooms automatically boots into an **In-Memory Demo Mode**:
- Loads all 8 realistic classrooms, timetables, readings, and initial alerts into memory.
- Fully supports all filtering, simulation, reading ingestion, alert status transitions, and analytics.
- **Honest Labeling**: Responses explicitly include `"storage_mode": "in-memory (demo mode)"` and clearly note that demo data resets on server restart and is not persistent database storage.
- `GET /api/health` indicates `database.connected: false` with explanatory mode diagnostics.

---

## Waste-Detection Intelligence

Waste detection logic is isolated in [`src/services/wasteDetectionService.js`](file:///c:/Users/Vithun/OneDrive/Desktop/Phantom_class/backend/src/services/wasteDetectionService.js):

1. **Telemetry Staleness Check**:
   - If telemetry timestamp is older than 120 minutes, an alert of type `STALE_SENSOR_DATA` (severity `medium`) is triggered.
   - Phantom load calculation is suspended because stale sensors cannot reliably reflect live room state.
2. **Occupancy & Timetable Rules**:
   - If `estimated_occupancy > 0`: Legitimate classroom usage; no waste alert.
   - If timetable indicates a class is scheduled and actively running: Usage permitted; no alert.
   - If a class starts within the **20-minute pre-cooling window**: HVAC activation is permitted for student comfort; no false alert.
3. **Empty Room Waste Rules**:
   - **Critical Waste** (`ALL_EQUIPMENT_ACTIVE_EMPTY_ROOM`, High): AC, Lights, and Projector all active with 0 occupants (~2400W–2800W).
   - **High Waste** (`AC_AND_LIGHTS_EMPTY_ROOM`, High): AC and Lights active in vacant room (~1800W–2200W).
   - **Medium Waste** (`AC_EMPTY_ROOM`, Medium): AC left on alone (~1500W–1800W).
   - **Medium Waste** (`PROJECTOR_EMPTY_ROOM`, Medium): AV Projector left illuminated (~250W–350W).
   - **Low Waste** (`LIGHTS_EMPTY_ROOM`, Low): Lights left on alone (~200W–300W).
   - **Normal Standby**: All devices off (~25W–40W); no alert.
4. **Deduplication Engine**:
   - Prevents spamming duplicate alerts on subsequent readings for the same room and waste condition. Suppressed duplicates retain the existing open alert ID.

---

## Savings & Financial Cost Formulas

Formulas implemented in [`src/services/savingsService.js`](file:///c:/Users/Vithun/OneDrive/Desktop/Phantom_class/backend/src/services/savingsService.js):

$$\text{energy\_kwh} = \frac{\text{avoidable\_power\_watts} \times \text{duration\_hours}}{1000}$$

$$\text{estimated\_cost\_inr} = \text{energy\_kwh} \times \text{electricity\_tariff\_inr\_per\_kwh}$$

### Operational Assumptions
1. **Avoidable vs. Total Load**:
   A room naturally draws ~35W of continuous baseline load (sensors, access controllers, router standby). Avoidable power is computed as:
   $$\text{avoidable\_power\_watts} = \max(0, \text{power\_watts} - 35.0)$$
   Potential savings are computed strictly on avoidable waste, preserving scientific integrity.
2. **Estimated vs. Measured**:
   Calculations are documented as **estimated potential savings**, not measured historical savings, unless measured across real duration intervals.

---

## Future Python FastAPI ML Integration

The Node.js backend is pre-wired to communicate with an external Python FastAPI occupancy microservice via `ML_SERVICE_URL`.

### Microservice Contract

**Endpoint**: `POST /predict`

**Request Payload**:
```json
{
  "room_code": "AEH-101",
  "power_watts": 2450.0,
  "ac_on": true,
  "lights_on": true,
  "projector_on": true,
  "sound_db": 54.2,
  "co2_ppm": 680,
  "timestamp": "2026-10-13T09:30:00.000Z"
}
```

**Expected Response**:
```json
{
  "estimated_occupancy": 42,
  "confidence": 0.94,
  "model_version": "v1.2.0-xgboost-occupancy",
  "features_used": ["power_watts", "ac_on", "lights_on", "sound_db", "co2_ppm"]
}
```

### Resilient Fallback Handling
- Implemented with an `AbortController` timeout (2 seconds).
- If the Python microservice is offline or unconfigured, the backend does **not** fabricate ML confidence scores.
- Instead, it returns clearly labeled demo estimates with `"is_ml_prediction": false` and `"ml_status": "unavailable_fallback"`.

---

## REST API Documentation & curl Examples

### 1. Health & System Probe
```bash
curl -X GET http://localhost:5000/api/health
```
**Response**:
```json
{
  "status": "ok",
  "service": "Phantom Classrooms Backend",
  "timestamp": "2026-10-13T04:43:43.662Z",
  "uptime_seconds": 120,
  "database": {
    "connected": false,
    "mode": "in-memory (demo mode)",
    "message": "Running in in-memory demo mode. Supabase credentials are not provided or incomplete."
  },
  "ml_service": {
    "available": false,
    "url": "http://localhost:8000",
    "status": "unavailable"
  },
  "campus_timezone": "Asia/Kolkata",
  "tariff_inr_per_kwh": 8
}
```

### 2. List All Rooms
```bash
curl -X GET http://localhost:5000/api/rooms
```
Returns all rooms with their latest reading, open alert count, and current status (`OCCUPIED`, `VACANT_NORMAL`, `POTENTIAL_WASTE`, `DATA_STALE`).

### 3. Get Room Details by ID
```bash
curl -X GET http://localhost:5000/api/rooms/11111111-1111-4111-a111-111111111102
```
Returns classroom details, latest reading, day timetable, and open alerts.

### 4. Query Telemetry Readings
```bash
# Filter by roomId and limit
curl -X GET "http://localhost:5000/api/readings?roomId=11111111-1111-4111-a111-111111111101&limit=5"

# Filter by time range
curl -X GET "http://localhost:5000/api/readings?from=2026-10-13T00:00:00Z&to=2026-10-13T23:59:59Z"
```

### 5. Get Latest Reading for Each Room
```bash
curl -X GET http://localhost:5000/api/readings/latest
```

### 6. Query Waste Alerts
```bash
# Filter by status and severity
curl -X GET "http://localhost:5000/api/alerts?status=open&severity=high"
```

### 7. Transition Alert Status
```bash
# Transition to acknowledged
curl -X PATCH http://localhost:5000/api/alerts/44444444-4444-4444-a444-444444444401/status \
  -H "Content-Type: application/json" \
  -d '{"status": "acknowledged"}'

# Transition to resolved
curl -X PATCH http://localhost:5000/api/alerts/44444444-4444-4444-a444-444444444401/status \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

### 8. Campus Energy Overview Analytics
```bash
curl -X GET http://localhost:5000/api/analytics/overview
```
**Response**:
```json
{
  "total_rooms": 8,
  "currently_occupied_rooms": 2,
  "open_waste_alerts": 3,
  "current_estimated_power_watts": 10740,
  "historical_energy_kwh": 2.685,
  "estimated_potential_energy_savings_kwh": 2.89,
  "estimated_potential_cost_savings_inr": 23.12,
  "electricity_tariff_inr_per_kwh": 8,
  "campus_timezone": "Asia/Kolkata",
  "storage_mode": "in-memory (demo mode)"
}
```

### 9. Room-Level Energy Waste Rankings
```bash
curl -X GET http://localhost:5000/api/analytics/rooms
```
Returns all classrooms ranked in descending order by avoidable power waste.

### 10. Run Telemetry Simulation
```bash
# Simulate a waste scenario for a specific room
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "11111111-1111-4111-a111-111111111103",
    "scenario": "empty_waste"
  }'

# Simulate with custom values
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "11111111-1111-4111-a111-111111111106",
    "scenario": "custom",
    "estimated_occupancy": 0,
    "ac_on": false,
    "lights_on": true,
    "projector_on": false,
    "power_watts": 280
  }'
```

---

## Running Tests

Automated test suites are powered by **Vitest** and **Supertest**:

```bash
# Run all tests once
npm test

# Run tests directly in backend directory
cd backend
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Summary
- **Unit Tests (`savingsService.test.js`)**: 10 tests covering kWh formulas, tariff multiplications, baseline subtraction, and error boundaries.
- **Unit Tests (`wasteDetectionService.test.js`)**: 8 tests covering HVAC waste, critical multi-device waste, lighting waste, pre-cooling exemption, stale sensor detection, and alert deduplication.
- **Integration Tests (`api.test.js`)**: 24 tests validating all 10 API endpoints, status code contracts (200, 400, 404), schema validations, and state changes.

Total: **42 automated tests passing**.

---

## Testing & Verification Matrix

| Area | Automated Tests (In-Memory) | Live Supabase Required |
| :--- | :---: | :---: |
| Unit: Savings calculations & formulas | Tested & Passing | No |
| Unit: Waste detection logic & deduplication | Tested & Passing | No |
| Unit: Stale telemetry & pre-cool exemptions | Tested & Passing | No |
| Integration: Health endpoint (`GET /api/health`) | Tested & Passing | No |
| Integration: Rooms list & details (`GET /api/rooms`) | Tested & Passing | No |
| Integration: Readings queries & filters (`GET /api/readings`) | Tested & Passing | No |
| Integration: Alerts filters & transitions (`PATCH /api/alerts/:id/status`) | Tested & Passing | No |
| Integration: Analytics overview & rankings (`GET /api/analytics/...`) | Tested & Passing | No |
| Integration: Simulation pipeline (`POST /api/simulate`) | Tested & Passing | No |
| Integration: Zod invalid requests & 400/404 handling | Tested & Passing | No |
| Live cloud database connection & latency | N/A (Tested fallback mode) | Yes (requires Supabase project) |
| Live PostgreSQL RLS security policy enforcement | Verified SQL in `schema.sql` | Yes (requires Supabase project) |

---

## Troubleshooting Guide

### 1. Server Starts in In-Memory Demo Mode
- **Cause**: `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is empty, missing, or malformed in `.env`.
- **Resolution**: This is the intended fallback. If you want to connect to a live Supabase project, supply valid credentials in `backend/.env`.

### 2. Port 5000 Already in Use
- **Resolution**: Set `PORT=5001` or any available port in `.env`.

### 3. Curl Command Fails with Quotes on Windows PowerShell
- **Cause**: PowerShell handles double-quoted strings differently in native `curl.exe`.
- **Resolution**: Use PowerShell's `Invoke-RestMethod` or escape double quotes:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/health"
  # or
  curl.exe -s -X POST http://localhost:5000/api/simulate -H "Content-Type: application/json" -d "{\`"scenario\`":\`"empty_waste\`"}"
  ```
