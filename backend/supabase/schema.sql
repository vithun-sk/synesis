-- Re-exporting from root supabase/schema.sql for convenience
-- ==============================================================================
-- Phantom Classrooms: Supabase PostgreSQL Schema
-- All timestamps are stored in UTC (TIMESTAMPTZ).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL UNIQUE,
    building TEXT NOT NULL,
    floor INTEGER NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);

CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_timetable_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_timetables_room_time ON timetables(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timetables_status ON timetables(status);

CREATE TABLE IF NOT EXISTS readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    estimated_occupancy INTEGER NOT NULL CHECK (estimated_occupancy >= 0),
    class_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    ac_on BOOLEAN NOT NULL DEFAULT FALSE,
    lights_on BOOLEAN NOT NULL DEFAULT FALSE,
    projector_on BOOLEAN NOT NULL DEFAULT FALSE,
    power_watts NUMERIC(10, 2) NOT NULL CHECK (power_watts >= 0),
    data_source TEXT NOT NULL CHECK (data_source IN ('simulated', 'sensor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_readings_room_recorded_at ON readings(room_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_recorded_at ON readings(recorded_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    reading_id UUID REFERENCES readings(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    estimated_wasted_kwh NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (estimated_wasted_kwh >= 0),
    estimated_cost_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (estimated_cost_inr >= 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alerts_room_status ON alerts(room_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_status_created ON alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to rooms"
    ON rooms FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to timetables"
    ON timetables FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to readings"
    ON readings FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to alerts"
    ON alerts FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow authenticated staff to update alert status"
    ON alerts FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (status IN ('acknowledged', 'resolved'));
