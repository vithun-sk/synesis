import { config } from '../config/environment.js';

/**
 * SavingsService
 * Calculates estimated avoidable energy (kWh) and associated financial cost (INR).
 *
 * Operational Assumptions:
 * 1. Baseline Standby Load: ~35 Watts
 *    Even when unoccupied with all primary equipment off, room sensors, IoT switches,
 *    and network points draw continuous phantom load. This baseline is NOT avoidable.
 * 2. Equipment Typical Active Ratings:
 *    - HVAC (Split/Cassette AC): 1,500W - 2,200W
 *    - Overhead Class Lighting: 200W - 400W
 *    - High-Lumen Laser/Lamp Projector: 250W - 350W
 * 3. Avoidable Energy vs Total Energy:
 *    Calculations isolate avoidable energy (power wasted by inactive rooms) rather than total
 *    measured electricity, preserving analytical honesty.
 * 4. Duration:
 *    Estimated waste duration defaults to 1.0 hour per detection window unless exact telemetry
 *    duration is provided.
 */

export const STANDBY_BASELINE_WATTS = 35.0;

/**
 * Calculates electricity consumption in kilowatt-hours (kWh)
 * @param {number} powerWatts
 * @param {number} durationHours
 * @returns {number}
 */
export function calculateEnergyKwh(powerWatts, durationHours = 1.0) {
  if (typeof powerWatts !== 'number' || powerWatts < 0 || isNaN(powerWatts)) {
    throw new Error('powerWatts must be a non-negative number');
  }
  if (typeof durationHours !== 'number' || durationHours < 0 || isNaN(durationHours)) {
    throw new Error('durationHours must be a non-negative number');
  }
  return Number(((powerWatts * durationHours) / 1000).toFixed(3));
}

/**
 * Calculates estimated cost in INR from energy consumption (kWh)
 * @param {number} energyKwh
 * @param {number} tariffInrPerKwh
 * @returns {number}
 */
export function calculateCostInr(energyKwh, tariffInrPerKwh = config.tariffInrPerKwh) {
  if (typeof energyKwh !== 'number' || energyKwh < 0 || isNaN(energyKwh)) {
    throw new Error('energyKwh must be a non-negative number');
  }
  const tariff = typeof tariffInrPerKwh === 'number' && tariffInrPerKwh >= 0
    ? tariffInrPerKwh
    : config.tariffInrPerKwh;

  return Number((energyKwh * tariff).toFixed(2));
}

/**
 * Determines estimated avoidable power in Watts from a classroom reading.
 * Avoidable power represents unnecessary active load above the unavoidable standby baseline.
 *
 * @param {Object} reading - Telemetry reading
 * @param {boolean} isLegitimateOperation - True if room is occupied or class is active
 * @returns {number} Avoidable power in Watts
 */
export function calculateAvoidablePowerWatts(reading, isLegitimateOperation = false) {
  if (!reading || isLegitimateOperation) {
    return 0;
  }

  const measuredPower = Number(reading.power_watts) || 0;
  if (measuredPower <= STANDBY_BASELINE_WATTS) {
    return 0;
  }

  // If reading has active equipment turned on in an empty room
  const anyEquipmentRunning = reading.ac_on || reading.lights_on || reading.projector_on;
  if (!anyEquipmentRunning && measuredPower <= STANDBY_BASELINE_WATTS * 2) {
    // Normal residual standby; not avoidable waste
    return 0;
  }

  // Avoidable waste is the power above the baseline standby load
  const avoidable = measuredPower - STANDBY_BASELINE_WATTS;
  return Math.max(0, Number(avoidable.toFixed(2)));
}

/**
 * Full potential savings estimation package for waste alerts and analytics.
 * Clearly labels outputs as estimated potential savings rather than measured actual savings.
 *
 * @param {number} avoidableWatts
 * @param {number} durationHours
 * @param {number} [customTariff]
 * @returns {Object}
 */
export function calculatePotentialSavings(avoidableWatts, durationHours = 1.0, customTariff = undefined) {
  const tariff = customTariff !== undefined ? customTariff : config.tariffInrPerKwh;
  const energyKwh = calculateEnergyKwh(avoidableWatts, durationHours);
  const costInr = calculateCostInr(energyKwh, tariff);

  return {
    avoidable_power_watts: avoidableWatts,
    duration_hours: durationHours,
    estimated_wasted_kwh: energyKwh,
    estimated_cost_inr: costInr,
    electricity_tariff_inr_per_kwh: tariff,
    is_estimated: true,
    measurement_type: 'ESTIMATED_AVOIDABLE_WASTE',
    assumptions_note: `Calculated at ₹${tariff}/kWh over ${durationHours} hr evaluation window against a ${STANDBY_BASELINE_WATTS}W baseline standby load.`
  };
}

export default {
  calculateEnergyKwh,
  calculateCostInr,
  calculateAvoidablePowerWatts,
  calculatePotentialSavings,
  STANDBY_BASELINE_WATTS
};
