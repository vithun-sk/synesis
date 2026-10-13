import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import { memoryStore } from '../data/memoryStore.js';
import { isReadingStale } from '../utils/timeUtils.js';

export async function getAllRooms() {
  if (!isSupabaseEnabled()) {
    return memoryStore.getAllRooms();
  }

  try {
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .order('room_code', { ascending: true });

    if (roomError) throw roomError;

    // Fetch latest readings and open alerts for all rooms
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

    // Group latest reading by room
    const latestReadingMap = new Map();
    for (const r of readings || []) {
      if (!latestReadingMap.has(r.room_id)) {
        latestReadingMap.set(r.room_id, r);
      }
    }

    // Group open alerts by room
    const alertsMap = new Map();
    for (const a of openAlerts || []) {
      if (!alertsMap.has(a.room_id)) {
        alertsMap.set(a.room_id, []);
      }
      alertsMap.get(a.room_id).push(a);
    }

    return rooms.map((room) => {
      const latest = latestReadingMap.get(room.id) || null;
      const roomAlerts = alertsMap.get(room.id) || [];

      let currentStatus = 'VACANT_NORMAL';
      if (!latest) {
        currentStatus = 'NO_DATA';
      } else if (isReadingStale(latest.recorded_at)) {
        currentStatus = 'DATA_STALE';
      } else if (roomAlerts.length > 0) {
        currentStatus = 'POTENTIAL_WASTE';
      } else if (latest.estimated_occupancy > 0) {
        currentStatus = 'OCCUPIED';
      } else if (latest.ac_on || latest.lights_on || latest.projector_on) {
        currentStatus = 'STANDBY_ACTIVE';
      }

      return {
        ...room,
        latest_reading: latest,
        open_alerts_count: roomAlerts.length,
        current_status: currentStatus
      };
    });
  } catch (err) {
    // If Supabase query fails, fall back to in-memory store
    return memoryStore.getAllRooms();
  }
}

export async function getRoomById(id) {
  if (!isSupabaseEnabled()) {
    return memoryStore.getRoomById(id);
  }

  try {
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (roomError) throw roomError;
    if (!room) return null;

    const { data: latestReading } = await supabase
      .from('readings')
      .select('*')
      .eq('room_id', id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: timetables } = await supabase
      .from('timetables')
      .select('*')
      .eq('room_id', id)
      .order('start_time', { ascending: true });

    const { data: openAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('room_id', id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    let currentStatus = 'VACANT_NORMAL';
    if (!latestReading) {
      currentStatus = 'NO_DATA';
    } else if (isReadingStale(latestReading.recorded_at)) {
      currentStatus = 'DATA_STALE';
    } else if (openAlerts && openAlerts.length > 0) {
      currentStatus = 'POTENTIAL_WASTE';
    } else if (latestReading.estimated_occupancy > 0) {
      currentStatus = 'OCCUPIED';
    } else if (latestReading.ac_on || latestReading.lights_on || latestReading.projector_on) {
      currentStatus = 'STANDBY_ACTIVE';
    }

    return {
      ...room,
      latest_reading: latestReading || null,
      timetables: timetables || [],
      open_alerts: openAlerts || [],
      current_status: currentStatus
    };
  } catch (err) {
    return memoryStore.getRoomById(id);
  }
}

export default {
  getAllRooms,
  getRoomById
};
