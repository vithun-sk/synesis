import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import { memoryStore } from '../data/memoryStore.js';
import { config } from '../config/environment.js';
import { calculateAvoidablePowerWatts } from './savingsService.js';
import { isReadingStale } from '../utils/timeUtils.js';

export async function getOverview() {
  if (!isSupabaseEnabled()) {
    return memoryStore.getAnalyticsOverview();
  }

  try {
    const { data: rooms, error: roomError } = await supabase.from('rooms').select('id');
    if (roomError) throw roomError;

    const { data: readings, error: readingError } = await supabase
      .from('readings')
      .select('*')
      .order('recorded_at', { ascending: false });
    if (readingError) throw readingError;

    const { data: openAlerts, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'open');
    if (alertError) throw alertError;

    const latestByRoom = new Map();
    for (const r of readings || []) {
      if (!latestByRoom.has(r.room_id)) {
        latestByRoom.set(r.room_id, r);
      }
    }

    let occupiedRooms = 0;
    let currentPowerWatts = 0;
    for (const [_, latest] of latestByRoom) {
      if (latest.estimated_occupancy > 0) occupiedRooms += 1;
      currentPowerWatts += Number(latest.power_watts) || 0;
    }

    let totalEstimatedWastedKwh = 0;
    let totalEstimatedCostInr = 0;
    for (const a of openAlerts || []) {
      totalEstimatedWastedKwh += Number(a.estimated_wasted_kwh) || 0;
      totalEstimatedCostInr += Number(a.estimated_cost_inr) || 0;
    }

    const historicalEnergyKwh = (readings || []).reduce((sum, r) => {
      return sum + (Number(r.power_watts) * 0.25) / 1000;
    }, 0);

    return {
      total_rooms: (rooms || []).length,
      currently_occupied_rooms: occupiedRooms,
      open_waste_alerts: (openAlerts || []).length,
      current_estimated_power_watts: Number(currentPowerWatts.toFixed(2)),
      historical_energy_kwh: Number(historicalEnergyKwh.toFixed(3)),
      estimated_potential_energy_savings_kwh: Number(totalEstimatedWastedKwh.toFixed(3)),
      estimated_potential_cost_savings_inr: Number(totalEstimatedCostInr.toFixed(2)),
      electricity_tariff_inr_per_kwh: config.tariffInrPerKwh,
      campus_timezone: config.campusTimezone,
      storage_mode: 'supabase',
      measurement_notice: 'Historical consumption is measured via recorded telemetry; potential savings are estimated from active waste alerts against standby baselines.'
    };
  } catch (err) {
    return memoryStore.getAnalyticsOverview();
  }
}

export async function getRoomComparisons() {
  if (!isSupabaseEnabled()) {
    return memoryStore.getAnalyticsRooms();
  }

  try {
    const { data: rooms, error: roomError } = await supabase.from('rooms').select('*');
    if (roomError) throw roomError;

    const { data: readings, error: readingError } = await supabase
      .from('readings')
      .select('*')
      .order('recorded_at', { ascending: false });
    if (readingError) throw readingError;

    const { data: openAlerts, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'open');
    if (alertError) throw alertError;

    const latestByRoom = new Map();
    for (const r of readings || []) {
      if (!latestByRoom.has(r.room_id)) {
        latestByRoom.set(r.room_id, r);
      }
    }

    const alertsByRoom = new Map();
    for (const a of openAlerts || []) {
      if (!alertsByRoom.has(a.room_id)) {
        alertsByRoom.set(a.room_id, []);
      }
      alertsByRoom.get(a.room_id).push(a);
    }

    const result = (rooms || []).map((room) => {
      const latest = latestByRoom.get(room.id) || null;
      const roomAlerts = alertsByRoom.get(room.id) || [];

      const roomWastedKwh = roomAlerts.reduce((sum, a) => sum + (Number(a.estimated_wasted_kwh) || 0), 0);
      const roomCostInr = roomAlerts.reduce((sum, a) => sum + (Number(a.estimated_cost_inr) || 0), 0);
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
        open_alerts_count: roomAlerts.length,
        avoidable_power_watts: avoidableWatts,
        estimated_potential_wasted_kwh: Number(roomWastedKwh.toFixed(3)),
        estimated_potential_cost_inr: Number(roomCostInr.toFixed(2)),
        is_stale: latest ? isReadingStale(latest.recorded_at) : true
      };
    });

    // Rank highest avoidable power first
    return result.sort((a, b) => b.avoidable_power_watts - a.avoidable_power_watts);
  } catch (err) {
    return memoryStore.getAnalyticsRooms();
  }
}

export default {
  getOverview,
  getRoomComparisons
};
