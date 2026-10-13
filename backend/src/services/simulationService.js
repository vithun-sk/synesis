import { getRoomById, getAllRooms } from './roomService.js';
import { recordReading } from './readingService.js';
import { recordAlert, getAlerts } from './alertService.js';
import { evaluateReading } from './wasteDetectionService.js';
import { memoryStore } from '../data/memoryStore.js';
import { isSupabaseEnabled } from '../config/supabase.js';

/**
 * Generates realistic simulation readings and triggers the waste detection pipeline.
 *
 * @param {Object} options
 * @param {string} [options.roomId] - Specific room UUID
 * @param {string[]} [options.roomIds] - Multiple room UUIDs
 * @param {string} [options.scenario='empty_waste'] - Preset scenario
 * @param {Object} [options.customData] - Custom telemetry overrides
 * @returns {Promise<{ readings: Array, alerts: Array, updated_rooms: Array }>}
 */
export async function runSimulation({
  roomId,
  roomIds,
  scenario = 'empty_waste',
  customData = {}
} = {}) {
  // Determine target rooms
  let targetRooms = [];

  if (roomId) {
    const room = await getRoomById(roomId);
    if (!room) {
      const err = new Error(`Room with ID '${roomId}' does not exist.`);
      err.statusCode = 404;
      err.code = 'ROOM_NOT_FOUND';
      throw err;
    }
    targetRooms = [room];
  } else if (Array.isArray(roomIds) && roomIds.length > 0) {
    for (const id of roomIds) {
      const room = await getRoomById(id);
      if (!room) {
        const err = new Error(`Room with ID '${id}' does not exist.`);
        err.statusCode = 404;
        err.code = 'ROOM_NOT_FOUND';
        throw err;
      }
      targetRooms.push(room);
    }
  } else {
    // Default: simulate for all rooms
    targetRooms = await getAllRooms();
  }

  const generatedReadings = [];
  const triggeredAlerts = [];
  const updatedRooms = [];

  for (const room of targetRooms) {
    const timetables = room.timetables || (isSupabaseEnabled() ? [] : memoryStore.getTimetablesForRoom(room.id));
    const existingOpenAlerts = await getAlerts({ roomId: room.id, status: 'open' });

    // Build reading based on scenario or custom data
    let estimatedOccupancy = 0;
    let classScheduled = false;
    let acOn = false;
    let lightsOn = false;
    let projectorOn = false;
    let powerWatts = 35.0;

    if (scenario === 'occupied') {
      estimatedOccupancy = Math.min(room.capacity || 50, Math.floor((room.capacity || 50) * 0.75));
      classScheduled = true;
      acOn = true;
      lightsOn = true;
      projectorOn = true;
      powerWatts = 2450.0;
    } else if (scenario === 'empty_waste') {
      estimatedOccupancy = 0;
      classScheduled = false;
      acOn = true;
      lightsOn = true;
      projectorOn = false;
      powerWatts = 1950.0;
    } else if (scenario === 'empty_normal') {
      estimatedOccupancy = 0;
      classScheduled = false;
      acOn = false;
      lightsOn = false;
      projectorOn = false;
      powerWatts = 35.0;
    } else if (scenario === 'lights_only') {
      estimatedOccupancy = 0;
      classScheduled = false;
      acOn = false;
      lightsOn = true;
      projectorOn = false;
      powerWatts = 260.0;
    } else if (scenario === 'custom') {
      estimatedOccupancy = customData.estimated_occupancy !== undefined ? Number(customData.estimated_occupancy) : 0;
      classScheduled = customData.class_scheduled !== undefined ? Boolean(customData.class_scheduled) : false;
      acOn = customData.ac_on !== undefined ? Boolean(customData.ac_on) : false;
      lightsOn = customData.lights_on !== undefined ? Boolean(customData.lights_on) : false;
      projectorOn = customData.projector_on !== undefined ? Boolean(customData.projector_on) : false;

      if (customData.power_watts !== undefined) {
        powerWatts = Number(customData.power_watts);
      } else {
        // Calculate plausible power from active devices + standby
        let calcPower = 35.0;
        if (acOn) calcPower += 1800.0;
        if (lightsOn) calcPower += 250.0;
        if (projectorOn) calcPower += 320.0;
        powerWatts = calcPower;
      }
    }

    // Safety checks
    if (powerWatts < 0) {
      const err = new Error('Power reading cannot be negative.');
      err.statusCode = 400;
      throw err;
    }
    if (estimatedOccupancy < 0) {
      const err = new Error('Occupancy count cannot be negative.');
      err.statusCode = 400;
      throw err;
    }

    const readingPayload = {
      room_id: room.id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: estimatedOccupancy,
      class_scheduled: classScheduled,
      ac_on: acOn,
      lights_on: lightsOn,
      projector_on: projectorOn,
      power_watts: Number(powerWatts.toFixed(2)),
      data_source: 'simulated',
      created_at: new Date().toISOString()
    };

    // 1. Record the simulated reading
    const savedReading = await recordReading(readingPayload);
    generatedReadings.push(savedReading);

    // 2. Run waste detection engine
    const evaluation = evaluateReading(savedReading, {
      timetables,
      existingOpenAlerts,
      room
    });

    if (evaluation && !evaluation.is_duplicate) {
      evaluation.reading_id = savedReading.id;
      const savedAlert = await recordAlert(evaluation);
      triggeredAlerts.push(savedAlert);
    }

    // 3. Collect updated room state
    const refreshedRoom = await getRoomById(room.id);
    if (refreshedRoom) {
      updatedRooms.push(refreshedRoom);
    }
  }

  return {
    scenario,
    simulated_count: targetRooms.length,
    readings: generatedReadings,
    new_alerts: triggeredAlerts,
    updated_rooms: updatedRooms,
    storage_mode: isSupabaseEnabled() ? 'supabase' : 'in-memory (demo mode)'
  };
}

export default {
  runSimulation
};
