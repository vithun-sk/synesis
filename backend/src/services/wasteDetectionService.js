import { calculateAvoidablePowerWatts, calculatePotentialSavings } from './savingsService.js';
import { isReadingStale, isClassStartingSoon, isClassCurrentlyActive } from '../utils/timeUtils.js';

/**
 * WasteDetectionService
 * Domain intelligence engine that analyzes telemetry readings, timetable schedules,
 * and equipment power metrics to identify avoidable electricity waste.
 */

export const ALERT_TYPES = {
  ALL_EQUIPMENT: 'ALL_EQUIPMENT_ACTIVE_EMPTY_ROOM',
  AC_AND_LIGHTS: 'AC_AND_LIGHTS_EMPTY_ROOM',
  AC_ONLY: 'AC_EMPTY_ROOM',
  PROJECTOR_ONLY: 'PROJECTOR_EMPTY_ROOM',
  LIGHTS_ONLY: 'LIGHTS_EMPTY_ROOM',
  STALE_SENSOR: 'STALE_SENSOR_DATA'
};

/**
 * Evaluates a single telemetry reading against room timetables and operational rules.
 *
 * @param {Object} reading - The incoming reading object
 * @param {Object} options - Evaluation options
 * @param {Array} [options.timetables=[]] - Scheduled timetable entries for the room
 * @param {Array} [options.existingOpenAlerts=[]] - Currently open alerts for this room
 * @param {Object} [options.room={}] - Room metadata (room_code, building, floor)
 * @returns {Object|null} Candidate alert object or null if normal operation
 */
export function evaluateReading(reading, options = {}) {
  const { timetables = [], existingOpenAlerts = [], room = {} } = options;
  const roomCode = room.room_code || 'Classroom';

  // Rule 1: Sensor Staleness Check
  if (isReadingStale(reading.recorded_at)) {
    const existingStaleAlert = existingOpenAlerts.find(
      (a) => a.alert_type === ALERT_TYPES.STALE_SENSOR && a.status === 'open'
    );

    if (existingStaleAlert) {
      return {
        ...existingStaleAlert,
        is_duplicate: true,
        action: 'SUPPRESSED_DUPLICATE'
      };
    }

    return {
      room_id: reading.room_id,
      reading_id: reading.id || null,
      severity: 'medium',
      alert_type: ALERT_TYPES.STALE_SENSOR,
      title: `Stale Sensor Telemetry in ${roomCode}`,
      explanation: `Telemetry data from ${roomCode} has not been updated recently (recorded at ${reading.recorded_at}). Real-time waste detection is temporarily suspended until fresh telemetry is received.`,
      recommendation: 'Inspect sensor battery levels, wireless transceiver, and campus IoT gateway connectivity.',
      estimated_wasted_kwh: 0,
      estimated_cost_inr: 0,
      status: 'open',
      data_source: reading.data_source,
      is_stale_warning: true
    };
  }

  // Rule 2: Occupancy & Class Schedule Verification
  const isOccupied = Number(reading.estimated_occupancy) > 0;
  const isScheduleActive = Boolean(reading.class_scheduled) || isClassCurrentlyActive(timetables);
  const isPreCooling = isClassStartingSoon(timetables, 20);

  // If room is occupied, usage is legitimate
  if (isOccupied) {
    return null;
  }

  // If a class is scheduled and actively running, equipment is permitted
  // (e.g. instructor setting up or short recess)
  if (isScheduleActive) {
    return null;
  }

  // If a scheduled class begins within pre-cooling window (e.g. 20m), HVAC is permitted
  if (isPreCooling && reading.ac_on) {
    // Legitimate pre-cooling; do not flag as waste
    return null;
  }

  // Rule 3: Waste Detection when Occupancy is 0, No Schedule, and Equipment Running
  const acOn = Boolean(reading.ac_on);
  const lightsOn = Boolean(reading.lights_on);
  const projectorOn = Boolean(reading.projector_on);

  if (!acOn && !lightsOn && !projectorOn) {
    // Normal vacant state with all primary equipment off; no waste
    return null;
  }

  let alertType;
  let severity;
  let title;
  let explanation;
  let recommendation;

  if (acOn && lightsOn && projectorOn) {
    alertType = ALERT_TYPES.ALL_EQUIPMENT;
    severity = 'high';
    title = `Critical Waste: All Equipment Running in Vacant ${roomCode}`;
    explanation = `Estimated occupancy is 0 with no active class scheduled, yet HVAC, overhead lighting, and high-wattage projector are all powered on drawing ~${reading.power_watts} Watts.`;
    recommendation = `Immediately dispatch remote shutdown command to turn off HVAC, lighting, and projector circuits.`;
  } else if (acOn && lightsOn) {
    alertType = ALERT_TYPES.AC_AND_LIGHTS;
    severity = 'high';
    title = `High Waste: HVAC and Lighting Active in Empty ${roomCode}`;
    explanation = `Classroom is vacant with 0 occupants and no scheduled timetable, but HVAC and lighting are drawing ~${reading.power_watts} Watts.`;
    recommendation = `Turn off classroom HVAC and lighting remotely or alert facility custodians.`;
  } else if (acOn) {
    alertType = ALERT_TYPES.AC_ONLY;
    severity = 'medium';
    title = `HVAC Running in Vacant ${roomCode}`;
    explanation = `Air conditioning is operating in an empty classroom without a scheduled class (~${reading.power_watts} Watts).`;
    recommendation = `Switch off AC unit or enable setback temperature mode.`;
  } else if (projectorOn) {
    alertType = ALERT_TYPES.PROJECTOR_ONLY;
    severity = 'medium';
    title = `AV Projector Left On in Vacant ${roomCode}`;
    explanation = `Classroom projector is illuminated without an active class or occupants.`;
    recommendation = `Power down projector to prevent unnecessary lamp degradation and power draw.`;
  } else if (lightsOn) {
    alertType = ALERT_TYPES.LIGHTS_ONLY;
    severity = 'low';
    title = `Lighting Left On in Unoccupied ${roomCode}`;
    explanation = `Classroom lights are drawing ~${reading.power_watts} Watts while the room is unoccupied and unscheduled.`;
    recommendation = `Turn off lighting fixtures or inspect the occupancy sensor timeout interval.`;
  }

  // Compute estimated avoidable waste
  const avoidableWatts = calculateAvoidablePowerWatts(reading, false);
  const savings = calculatePotentialSavings(avoidableWatts, 1.0);

  const candidateAlert = {
    room_id: reading.room_id,
    reading_id: reading.id || null,
    severity,
    alert_type: alertType,
    title,
    explanation,
    recommendation,
    estimated_wasted_kwh: savings.estimated_wasted_kwh,
    estimated_cost_inr: savings.estimated_cost_inr,
    status: 'open',
    data_source: reading.data_source
  };

  // Rule 4: Deduplication Check
  // Prevent spamming identical open alerts for the same room and waste condition
  const existingDuplicate = existingOpenAlerts.find(
    (a) => a.alert_type === alertType && a.status === 'open'
  );

  if (existingDuplicate) {
    return {
      ...existingDuplicate,
      is_duplicate: true,
      action: 'SUPPRESSED_DUPLICATE'
    };
  }

  return candidateAlert;
}

export default {
  evaluateReading,
  ALERT_TYPES
};
