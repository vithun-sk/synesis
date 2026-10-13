import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { memoryStore } from '../src/data/memoryStore.js';

describe('Phantom Classrooms API Integration Tests', () => {
  beforeEach(() => {
    // Reset in-memory database back to clean seed data before each test
    memoryStore.reset();
  });

  // ---------------------------------------------------------------------------
  // 1. ROOT & HEALTH
  // ---------------------------------------------------------------------------
  describe('GET / and GET /api/health', () => {
    it('GET / returns API index and documentation endpoints', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('Phantom Classrooms API');
      expect(res.body.endpoints).toBeDefined();
    });

    it('GET /api/health returns server status, database mode, and ML status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBeDefined();
      expect(res.body.database.mode).toBeDefined();
      expect(res.body.ml_service).toBeDefined();
      expect(res.body.campus_timezone).toBe('Asia/Kolkata');
      expect(res.body.tariff_inr_per_kwh).toBe(8);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ROOMS ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('Rooms API', () => {
    it('GET /api/rooms returns all 8 seeded classrooms with latest readings and current status', async () => {
      const res = await request(app).get('/api/rooms');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(8);
      expect(Array.isArray(res.body.rooms)).toBe(true);

      const firstRoom = res.body.rooms[0];
      expect(firstRoom.room_code).toBeDefined();
      expect(firstRoom.building).toBeDefined();
      expect(firstRoom.latest_reading).toBeDefined();
      expect(firstRoom.current_status).toBeDefined();
    });

    it('GET /api/rooms/:id returns room details, timetables, and open alerts', async () => {
      // AEH-204 (Room 2) has open waste alert
      const roomId = '11111111-1111-4111-a111-111111111102';
      const res = await request(app).get(`/api/rooms/${roomId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(roomId);
      expect(res.body.room_code).toBe('AEH-204');
      expect(res.body.latest_reading).toBeDefined();
      expect(Array.isArray(res.body.timetables)).toBe(true);
      expect(Array.isArray(res.body.open_alerts)).toBe(true);
      expect(res.body.open_alerts.length).toBeGreaterThan(0);
    });

    it('GET /api/rooms/:id returns 404 for unknown room UUID', async () => {
      const nonExistentUuid = '99999999-9999-4999-a999-999999999999';
      const res = await request(app).get(`/api/rooms/${nonExistentUuid}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Room Not Found');
    });

    it('GET /api/rooms/:id returns 400 for malformed UUID format', async () => {
      const res = await request(app).get('/api/rooms/not-a-valid-uuid');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. READINGS ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('Readings API', () => {
    it('GET /api/readings returns telemetry list', async () => {
      const res = await request(app).get('/api/readings');
      expect(res.status).toBe(200);
      expect(res.body.readings).toBeDefined();
      expect(res.body.count).toBeGreaterThan(0);
    });

    it('GET /api/readings filters by roomId and limit', async () => {
      const roomId = '11111111-1111-4111-a111-111111111101';
      const res = await request(app).get(`/api/readings?roomId=${roomId}&limit=1`);

      expect(res.status).toBe(200);
      expect(res.body.readings.length).toBe(1);
      expect(res.body.readings[0].room_id).toBe(roomId);
    });

    it('GET /api/readings returns 400 on invalid query parameter', async () => {
      const res = await request(app).get('/api/readings?limit=500'); // exceeds max 100
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('GET /api/readings/latest returns latest reading projection for each room', async () => {
      const res = await request(app).get('/api/readings/latest');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(8);
      expect(Array.isArray(res.body.latest_readings)).toBe(true);

      const item = res.body.latest_readings[0];
      expect(item.room_code).toBeDefined();
      expect(item.power_watts).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. ALERTS ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('Alerts API', () => {
    it('GET /api/alerts returns all alerts with default filters', async () => {
      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });

    it('GET /api/alerts filters by severity and status', async () => {
      const res = await request(app).get('/api/alerts?severity=high&status=open');
      expect(res.status).toBe(200);
      expect(res.body.alerts.length).toBeGreaterThan(0);
      for (const alert of res.body.alerts) {
        expect(alert.severity).toBe('high');
        expect(alert.status).toBe('open');
      }
    });

    it('PATCH /api/alerts/:id/status successfully transitions status to acknowledged', async () => {
      const alertId = '44444444-4444-4444-a444-444444444401';
      const res = await request(app)
        .patch(`/api/alerts/${alertId}/status`)
        .send({ status: 'acknowledged' });

      expect(res.status).toBe(200);
      expect(res.body.alert.status).toBe('acknowledged');

      // Verify persistence in memoryStore
      const checkRes = await request(app).get(`/api/alerts?status=acknowledged`);
      expect(checkRes.body.alerts.some((a) => a.id === alertId)).toBe(true);
    });

    it('PATCH /api/alerts/:id/status successfully transitions status to resolved', async () => {
      const alertId = '44444444-4444-4444-a444-444444444402';
      const res = await request(app)
        .patch(`/api/alerts/${alertId}/status`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.alert.status).toBe('resolved');
    });

    it('PATCH /api/alerts/:id/status returns 400 for invalid status', async () => {
      const alertId = '44444444-4444-4444-a444-444444444401';
      const res = await request(app)
        .patch(`/api/alerts/${alertId}/status`)
        .send({ status: 'in_progress' }); // Not acknowledged or resolved

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('PATCH /api/alerts/:id/status returns 404 for unknown alert ID', async () => {
      const unknownAlertId = '88888888-8888-4888-a888-888888888888';
      const res = await request(app)
        .patch(`/api/alerts/${unknownAlertId}/status`)
        .send({ status: 'acknowledged' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Alert Not Found');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. ANALYTICS ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('Analytics API', () => {
    it('GET /api/analytics/overview returns aggregate campus energy metrics', async () => {
      const res = await request(app).get('/api/analytics/overview');
      expect(res.status).toBe(200);
      expect(res.body.total_rooms).toBe(8);
      expect(res.body.currently_occupied_rooms).toBeGreaterThan(0);
      expect(res.body.open_waste_alerts).toBeGreaterThan(0);
      expect(res.body.current_estimated_power_watts).toBeGreaterThan(0);
      expect(res.body.historical_energy_kwh).toBeGreaterThanOrEqual(0);
      expect(res.body.estimated_potential_energy_savings_kwh).toBeGreaterThan(0);
      expect(res.body.estimated_potential_cost_savings_inr).toBeGreaterThan(0);
      expect(res.body.electricity_tariff_inr_per_kwh).toBe(8);
    });

    it('GET /api/analytics/rooms returns room rankings sorted by potential waste', async () => {
      const res = await request(app).get('/api/analytics/rooms');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(8);
      expect(Array.isArray(res.body.rooms)).toBe(true);

      // Verify descending order of avoidable power watts
      const rooms = res.body.rooms;
      for (let i = 0; i < rooms.length - 1; i++) {
        expect(rooms[i].avoidable_power_watts).toBeGreaterThanOrEqual(
          rooms[i + 1].avoidable_power_watts
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 6. SIMULATION ENDPOINT
  // ---------------------------------------------------------------------------
  describe('POST /api/simulate', () => {
    it('generates simulated reading and creates alert for empty_waste scenario', async () => {
      // Room 3 (STC-102) was previously empty with equipment off
      const roomId = '11111111-1111-4111-a111-111111111103';

      const res = await request(app)
        .post('/api/simulate')
        .send({
          roomId,
          scenario: 'empty_waste'
        });

      expect(res.status).toBe(200);
      expect(res.body.simulated_count).toBe(1);
      expect(res.body.readings.length).toBe(1);
      expect(res.body.readings[0].ac_on).toBe(true);
      expect(res.body.readings[0].lights_on).toBe(true);
      expect(res.body.readings[0].power_watts).toBe(1950);
      expect(res.body.new_alerts.length).toBe(1);
      expect(res.body.new_alerts[0].severity).toBe('high');
    });

    it('simulates custom telemetry inputs accurately', async () => {
      const roomId = '11111111-1111-4111-a111-111111111106'; // RCC-105

      const res = await request(app)
        .post('/api/simulate')
        .send({
          roomId,
          scenario: 'custom',
          estimated_occupancy: 0,
          ac_on: false,
          lights_on: true,
          projector_on: false,
          power_watts: 275.5
        });

      expect(res.status).toBe(200);
      expect(res.body.readings[0].power_watts).toBe(275.5);
      expect(res.body.readings[0].lights_on).toBe(true);
      expect(res.body.readings[0].ac_on).toBe(false);
      // Lights only in empty room should trigger low waste alert
      expect(res.body.new_alerts.length).toBe(1);
      expect(res.body.new_alerts[0].severity).toBe('low');
    });

    it('rejects negative power readings with 400', async () => {
      const roomId = '11111111-1111-4111-a111-111111111101';
      const res = await request(app)
        .post('/api/simulate')
        .send({
          roomId,
          scenario: 'custom',
          power_watts: -500
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('rejects negative occupancy count with 400', async () => {
      const roomId = '11111111-1111-4111-a111-111111111101';
      const res = await request(app)
        .post('/api/simulate')
        .send({
          roomId,
          scenario: 'custom',
          estimated_occupancy: -10
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 404 when simulating an unknown room ID', async () => {
      const unknownRoomId = '77777777-7777-4777-a777-777777777777';
      const res = await request(app)
        .post('/api/simulate')
        .send({
          roomId: unknownRoomId,
          scenario: 'occupied'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('does not exist');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. 404 HANDLER
  // ---------------------------------------------------------------------------
  describe('Not Found Handler', () => {
    it('returns 404 JSON for non-existent route', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });
});
