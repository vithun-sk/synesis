import crypto from 'crypto';
import { getInitialSeedData } from './seedData.js';
import { config } from '../config/environment.js';
import { calculateAvoidablePowerWatts, calculatePotentialSavings } from '../services/savingsService.js';
import { isReadingStale } from '../utils/timeUtils.js';

class MemoryStore {
  constructor() {
    this.reset();
  }

  /**
   * Resets all in-memory collections back to fresh initial seed data
   */
  reset() {
    const seed = getInitialSeedData();
    this.rooms = [...seed.rooms];
    this.timetables = [...seed.timetables];
    this.readings = [...seed.readings];
    this.alerts = [...seed.alerts];
  }

  // ---------------------------------------------------------------------------
  // ROOMS
  // ---------------------------------------------------------------------------
  getAllRooms() {
    return this.rooms.map((room) => {
      const latestReading = this.getLatestReadingForRoom(room.id);
      const openAlerts = this.alerts.filter(
        (a) => a.room_id === room.id && a.status === 'open'
      );
      const roomStatus = this.determineRoomOperationalStatus(latestReading, openAlerts);

      return {
        ...room,
        latest_reading: latestReading || null,
        open_alerts_count: openAlerts.length,
        current_status: roomStatus
      };
    });
  }

  getRoomById(id) {
    const room = this.rooms.find((r) => r.id === id);
    if (!room) return null;

    const latestReading = this.getLatestReadingForRoom(room.id);
    const roomTimetables = this.timetables
      .filter((t) => t.room_id === room.id)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const openAlerts = this.alerts
      .filter((a) => a.room_id === room.id && a.status === 'open')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const roomStatus = this.determineRoomOperationalStatus(latestReading, openAlerts);

    return {
      ...room,
      latest_reading: latestReading || null,
      timetables: roomTimetables,
      open_alerts: openAlerts,
      current_status: roomStatus
    };
  }

  determineRoomOperationalStatus(reading, openAlerts) {
    if (!reading) return 'NO_DATA';
    if (isReadingStale(reading.recorded_at)) return 'DATA_STALE';
    if (openAlerts && openAlerts.length > 0) return 'POTENTIAL_WASTE';
    if (reading.estimated_occupancy > 0) return 'OCCUPIED';
    const anyActive = reading.ac_on || reading.lights_on || reading.projector_on;
    if (anyActive) return 'STANDBY_ACTIVE';
    return 'VACANT_NORMAL';
  }

  // ---------------------------------------------------------------------------
  // READINGS
  // ---------------------------------------------------------------------------
  getReadings({ roomId, from, to, limit = 20 } = {}) {
    let result = [...this.readings];

    if (roomId) {
      result = result.filter((r) => r.room_id === roomId);
    }
    if (from) {
      const fromTime = new Date(from).getTime();
      result = result.filter((r) => new Date(r.recorded_at).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime();
      result = result.filter((r) => new Date(r.recorded_at).getTime() <= toTime);
    }

    result.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    return result.slice(0, Number(limit) || 20);
  }

  getLatestReadings() {
    const latestMap = new Map();
    // Sort chronological first
    const sorted = [...this.readings].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    for (const r of sorted) {
      latestMap.set(r.room_id, r);
    }

    // Return as array of rooms with room_code and details
    return Array.from(latestMap.values()).map((reading) => {
      const room = this.rooms.find((r) => r.id === reading.room_id);
      return {
        ...reading,
        room_code: room ? room.room_code : null,
        building: room ? room.building : null,
        floor: room ? room.floor : null
      };
    });
  }

  getLatestReadingForRoom(roomId) {
    const roomReadings = this.readings
      .filter((r) => r.room_id === roomId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    return roomReadings[0] || null;
  }

  addReading(readingData) {
    const newReading = {
      id: readingData.id || crypto.randomUUID(),
      room_id: readingData.room_id,
      recorded_at: readingData.recorded_at || new Date().toISOString(),
      estimated_occupancy: Number(readingData.estimated_occupancy) || 0,
      class_scheduled: Boolean(readingData.class_scheduled),
      ac_on: Boolean(readingData.ac_on),
      lights_on: Boolean(readingData.lights_on),
      projector_on: Boolean(readingData.projector_on),
      power_watts: Number(readingData.power_watts) || 0,
      data_source: readingData.data_source || 'simulated',
      created_at: readingData.created_at || new Date().toISOString()
    };

    this.readings.unshift(newReading);
    return newReading;
  }

  // ---------------------------------------------------------------------------
  // TIMETABLES
  // ---------------------------------------------------------------------------
  getTimetablesForRoom(roomId) {
    return this.timetables
      .filter((t) => t.room_id === roomId)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  // ---------------------------------------------------------------------------
  // ALERTS
  // ---------------------------------------------------------------------------
  getAlerts({ roomId, severity, status, limit = 50 } = {}) {
    let result = [...this.alerts];

    if (roomId) {
      result = result.filter((a) => a.room_id === roomId);
    }
    if (severity) {
      result = result.filter((a) => a.severity.toLowerCase() === severity.toLowerCase());
    }
    if (status) {
      result = result.filter((a) => a.status.toLowerCase() === status.toLowerCase());
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result.slice(0, Number(limit) || 50);
  }

  getAlertById(id) {
    return this.alerts.find((a) => a.id === id) || null;
  }

  findOpenAlertForRoomAndType(roomId, alertType) {
    return this.alerts.find(
      (a) => a.room_id === roomId && a.alert_type === alertType && a.status === 'open'
    ) || null;
  }

  addAlert(alertData) {
    const newAlert = {
      id: alertData.id || crypto.randomUUID(),
      room_id: alertData.room_id,
      reading_id: alertData.reading_id || null,
      severity: alertData.severity,
      alert_type: alertData.alert_type,
      title: alertData.title,
      explanation: alertData.explanation,
      recommendation: alertData.recommendation,
      estimated_wasted_kwh: Number(alertData.estimated_wasted_kwh) || 0,
      estimated_cost_inr: Number(alertData.estimated_cost_inr) || 0,
      status: alertData.status || 'open',
      created_at: alertData.created_at || new Date().toISOString()
    };

    this.alerts.unshift(newAlert);
    return newAlert;
  }

  updateAlertStatus(id, newStatus) {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;

    alert.status = newStatus;
    alert.updated_at = new Date().toISOString();
    return alert;
  }

  // ---------------------------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------------------------
  getAnalyticsOverview() {
    const totalRooms = this.rooms.length;
    let occupiedRooms = 0;
    let currentPowerWatts = 0;

    for (const room of this.rooms) {
      const latest = this.getLatestReadingForRoom(room.id);
      if (latest) {
        if (latest.estimated_occupancy > 0) {
          occupiedRooms += 1;
        }
        currentPowerWatts += Number(latest.power_watts) || 0;
      }
    }

    const openAlerts = this.alerts.filter((a) => a.status === 'open');
    const openWasteAlertsCount = openAlerts.length;

    // Sum open alerts potential waste
    let totalEstimatedWastedKwh = 0;
    let totalEstimatedCostInr = 0;

    for (const alert of openAlerts) {
      totalEstimatedWastedKwh += Number(alert.estimated_wasted_kwh) || 0;
      totalEstimatedCostInr += Number(alert.estimated_cost_inr) || 0;
    }

    // Historical energy estimation across all recorded readings
    // Assuming each reading represents a 0.25h (15-min) window or direct power integration
    const historicalEnergyKwh = this.readings.reduce((sum, r) => {
      return sum + (Number(r.power_watts) * 0.25) / 1000;
    }, 0);

    return {
      total_rooms: totalRooms,
      currently_occupied_rooms: occupiedRooms,
      open_waste_alerts: openWasteAlertsCount,
      current_estimated_power_watts: Number(currentPowerWatts.toFixed(2)),
      historical_energy_kwh: Number(historicalEnergyKwh.toFixed(3)),
      estimated_potential_energy_savings_kwh: Number(totalEstimatedWastedKwh.toFixed(3)),
      estimated_potential_cost_savings_inr: Number(totalEstimatedCostInr.toFixed(2)),
      electricity_tariff_inr_per_kwh: config.tariffInrPerKwh,
      campus_timezone: config.campusTimezone,
      storage_mode: 'in-memory (demo mode)',
      storage_notice: 'In-memory demo store is active. Telemetry and alerts reset upon server restart and are not persistent database storage.'
    };
  }

  getAnalyticsRooms() {
    return this.rooms.map((room) => {
      const latest = this.getLatestReadingForRoom(room.id);
      const openAlerts = this.alerts.filter((a) => a.room_id === room.id && a.status === 'open');

      const roomWastedKwh = openAlerts.reduce((sum, a) => sum + (Number(a.estimated_wasted_kwh) || 0), 0);
      const roomCostInr = openAlerts.reduce((sum, a) => sum + (Number(a.estimated_cost_inr) || 0), 0);
      const avoidableWatts = calculateAvoidablePowerWatts(
        latest,
        latest ? latest.estimated_occupancy > 0 || latest.class_scheduled : false
      );

      return {
        room_id: room.id,
        room_code: room.room_code,
        building: room.building,
        floor: room.floor,
        capacity: room.capacity,
        current_power_watts: latest ? Number(latest.power_watts) : 0,
        current_occupancy: latest ? Number(latest.estimated_occupancy) : 0,
        class_scheduled: latest ? Boolean(latest.class_scheduled) : false,
        open_alerts_count: openAlerts.length,
        avoidable_power_watts: avoidableWatts,
        estimated_potential_wasted_kwh: Number(roomWastedKwh.toFixed(3)),
        estimated_potential_cost_inr: Number(roomCostInr.toFixed(2)),
        is_stale: latest ? isReadingStale(latest.recorded_at) : true
      };
    }).sort((a, b) => b.avoidable_power_watts - a.avoidable_power_watts); // Rank highest potential waste first
  }
}

// Singleton in-memory store
export const memoryStore = new MemoryStore();
