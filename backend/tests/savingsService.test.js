import { describe, it, expect } from 'vitest';
import {
  calculateEnergyKwh,
  calculateCostInr,
  calculateAvoidablePowerWatts,
  calculatePotentialSavings,
  STANDBY_BASELINE_WATTS
} from '../src/services/savingsService.js';

describe('SavingsService', () => {
  describe('calculateEnergyKwh', () => {
    it('calculates energy in kWh correctly for 1 hour', () => {
      // 1000W for 1 hour = 1.0 kWh
      expect(calculateEnergyKwh(1000, 1.0)).toBe(1.0);
      // 2000W for 1 hour = 2.0 kWh
      expect(calculateEnergyKwh(2000, 1.0)).toBe(2.0);
      // 250W for 1 hour = 0.25 kWh
      expect(calculateEnergyKwh(250, 1.0)).toBe(0.25);
    });

    it('calculates energy in kWh correctly for custom durations', () => {
      // 2000W for 0.5 hours = 1.0 kWh
      expect(calculateEnergyKwh(2000, 0.5)).toBe(1.0);
      // 1500W for 2 hours = 3.0 kWh
      expect(calculateEnergyKwh(1500, 2.0)).toBe(3.0);
    });

    it('throws an error for negative power or duration', () => {
      expect(() => calculateEnergyKwh(-500, 1.0)).toThrow('powerWatts must be a non-negative number');
      expect(() => calculateEnergyKwh(1000, -1.0)).toThrow('durationHours must be a non-negative number');
    });

    it('handles zero power gracefully', () => {
      expect(calculateEnergyKwh(0, 1.0)).toBe(0);
    });
  });

  describe('calculateCostInr', () => {
    it('computes financial cost in INR correctly with default and custom tariff', () => {
      // 2 kWh at ₹8/kWh = ₹16.00
      expect(calculateCostInr(2.0, 8)).toBe(16.0);
      // 1.5 kWh at ₹10/kWh = ₹15.00
      expect(calculateCostInr(1.5, 10)).toBe(15.0);
    });

    it('throws an error for negative energy', () => {
      expect(() => calculateCostInr(-2.0, 8)).toThrow('energyKwh must be a non-negative number');
    });
  });

  describe('calculateAvoidablePowerWatts', () => {
    it('returns 0 if operation is legitimate (occupied or scheduled class)', () => {
      const reading = { power_watts: 2500, ac_on: true, lights_on: true };
      expect(calculateAvoidablePowerWatts(reading, true)).toBe(0);
    });

    it('returns 0 if power is at or below standby baseline', () => {
      const reading = { power_watts: 30, ac_on: false, lights_on: false, projector_on: false };
      expect(calculateAvoidablePowerWatts(reading, false)).toBe(0);
    });

    it('deducts baseline standby load to isolate avoidable waste when equipment is left on', () => {
      // Total 1950W, baseline 35W -> Avoidable = 1915W
      const reading = { power_watts: 1950, ac_on: true, lights_on: true, projector_on: false };
      const avoidable = calculateAvoidablePowerWatts(reading, false);
      expect(avoidable).toBe(1950 - STANDBY_BASELINE_WATTS);
    });
  });

  describe('calculatePotentialSavings', () => {
    it('returns structured potential savings object marked as estimated', () => {
      const savings = calculatePotentialSavings(1000, 1.0, 8);
      expect(savings.avoidable_power_watts).toBe(1000);
      expect(savings.duration_hours).toBe(1.0);
      expect(savings.estimated_wasted_kwh).toBe(1.0);
      expect(savings.estimated_cost_inr).toBe(8.0);
      expect(savings.is_estimated).toBe(true);
      expect(savings.measurement_type).toBe('ESTIMATED_AVOIDABLE_WASTE');
      expect(savings.assumptions_note).toContain('₹8/kWh');
    });
  });
});
