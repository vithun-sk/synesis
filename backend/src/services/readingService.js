import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import { memoryStore } from '../data/memoryStore.js';

export async function getReadings({ roomId, from, to, limit = 20 } = {}) {
  if (!isSupabaseEnabled()) {
    return memoryStore.getReadings({ roomId, from, to, limit });
  }

  try {
    let query = supabase
      .from('readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(Number(limit) || 20);

    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    if (from) {
      query = query.gte('recorded_at', from);
    }
    if (to) {
      query = query.lte('recorded_at', to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    return memoryStore.getReadings({ roomId, from, to, limit });
  }
}

export async function getLatestReadings() {
  if (!isSupabaseEnabled()) {
    return memoryStore.getLatestReadings();
  }

  try {
    // Get rooms and readings
    const { data: rooms, error: roomError } = await supabase.from('rooms').select('*');
    if (roomError) throw roomError;

    const { data: readings, error: readingError } = await supabase
      .from('readings')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (readingError) throw readingError;

    const latestByRoom = new Map();
    for (const r of readings || []) {
      if (!latestByRoom.has(r.room_id)) {
        const room = (rooms || []).find((rm) => rm.id === r.room_id);
        latestByRoom.set(r.room_id, {
          ...r,
          room_code: room ? room.room_code : null,
          building: room ? room.building : null,
          floor: room ? room.floor : null
        });
      }
    }

    return Array.from(latestByRoom.values());
  } catch (err) {
    return memoryStore.getLatestReadings();
  }
}

export async function recordReading(readingData) {
  if (!isSupabaseEnabled()) {
    return memoryStore.addReading(readingData);
  }

  try {
    const { data, error } = await supabase
      .from('readings')
      .insert([readingData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return memoryStore.addReading(readingData);
  }
}

export default {
  getReadings,
  getLatestReadings,
  recordReading
};
