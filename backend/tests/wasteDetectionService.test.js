import { describe, it, expect } from 'vitest';
import { evaluateReading, ALERT_TYPES } from '../src/services/wasteDetectionService.js';

describe('WasteDetectionService', () => {
  const dummyRoom = {
    id: '11111111-1111-4111-a111-111111111102',
    room_code: 'AEH-204',
    building: 'Aryabhata Engineering Hall',
    floor: 2,
    capacity: 45
  };

  it('detects high-severity waste when empty room has AC and lights running', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: true,
      projector_on: false,
      power_watts: 1950,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom });

    expect(alert).not.toBeNull();
    expect(alert.severity).toBe('high');
    expect(alert.alert_type).toBe(ALERT_TYPES.AC_AND_LIGHTS);
    expect(alert.title).toContain('AEH-204');
    expect(alert.estimated_wasted_kwh).toBeGreaterThan(0);
    expect(alert.estimated_cost_inr).toBeGreaterThan(0);
    expect(alert.status).toBe('open');
  });

  it('detects critical waste when all equipment (AC, lights, projector) is running in vacant room', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: true,
      projector_on: true,
      power_watts: 2600,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom });

    expect(alert).not.toBeNull();
    expect(alert.severity).toBe('high');
    expect(alert.alert_type).toBe(ALERT_TYPES.ALL_EQUIPMENT);
    expect(alert.title).toContain('All Equipment Running');
  });

  it('detects low-severity waste when only lighting is active in empty room', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: false,
      lights_on: true,
      projector_on: false,
      power_watts: 280,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom });

    expect(alert).not.toBeNull();
    expect(alert.severity).toBe('low');
    expect(alert.alert_type).toBe(ALERT_TYPES.LIGHTS_ONLY);
  });

  it('does NOT trigger alert when room is occupied', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 35,
      class_scheduled: true,
      ac_on: true,
      lights_on: true,
      projector_on: true,
      power_watts: 2400,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom });
    expect(alert).toBeNull();
  });

  it('does NOT trigger alert when empty room has all equipment turned off', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: false,
      lights_on: false,
      projector_on: false,
      power_watts: 35,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom });
    expect(alert).toBeNull();
  });

  it('allows HVAC pre-cooling when a scheduled class starts within the grace period (20m)', () => {
    const classSoon = {
      id: 'mock-1',
      room_id: dummyRoom.id,
      class_name: 'Upcoming Lab',
      start_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // starts in 10m
      end_time: new Date(Date.now() + 70 * 60 * 1000).toISOString(),
      status: 'scheduled'
    };

    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: false,
      projector_on: false,
      power_watts: 1800,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom, timetables: [classSoon] });
    expect(alert).toBeNull(); // HVAC pre-cooling is legitimately recognized!
  });

  it('flags stale sensor data (> 120 minutes) and suppresses phantom waste calculations', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(), // 2.5 hours ago
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: true,
      projector_on: false,
      power_watts: 1950,
      data_source: 'sensor'
    };

    const alert = evaluateReading(reading, { room: dummyRoom });

    expect(alert).not.toBeNull();
    expect(alert.alert_type).toBe(ALERT_TYPES.STALE_SENSOR);
    expect(alert.severity).toBe('medium');
    expect(alert.estimated_wasted_kwh).toBe(0); // Suspends phantom waste computation while stale
  });

  it('prevents generating duplicate open alerts for the same room and waste condition', () => {
    const reading = {
      room_id: dummyRoom.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: true,
      projector_on: false,
      power_watts: 1950,
      data_source: 'sensor'
    };

    const existingOpenAlert = {
      id: 'existing-alert-uuid',
      room_id: dummyRoom.id,
      alert_type: ALERT_TYPES.AC_AND_LIGHTS,
      status: 'open'
    };

    const alert = evaluateReading(reading, {
      room: dummyRoom,
      existingOpenAlerts: [existingOpenAlert]
    });

    expect(alert).not.toBeNull();
    expect(alert.is_duplicate).toBe(true);
    expect(alert.action).toBe('SUPPRESSED_DUPLICATE');
  });
});
