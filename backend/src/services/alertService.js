import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import { memoryStore } from '../data/memoryStore.js';

export const VALID_TARGET_STATUSES = ['acknowledged', 'resolved'];

export async function getAlerts({ roomId, severity, status, limit = 50 } = {}) {
  if (!isSupabaseEnabled()) {
    return memoryStore.getAlerts({ roomId, severity, status, limit });
  }

  try {
    let query = supabase
      .from('alerts')
      .select('*, rooms(room_code, building, floor)')
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 50);

    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    if (severity) {
      query = query.eq('severity', severity.toLowerCase());
    }
    if (status) {
      query = query.eq('status', status.toLowerCase());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    return memoryStore.getAlerts({ roomId, severity, status, limit });
  }
}

export async function getAlertById(id) {
  if (!isSupabaseEnabled()) {
    return memoryStore.getAlertById(id);
  }

  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    return memoryStore.getAlertById(id);
  }
}

export async function updateAlertStatus(id, newStatus) {
  const normalizedStatus = (newStatus || '').toLowerCase();
  if (!VALID_TARGET_STATUSES.includes(normalizedStatus)) {
    throw new Error(`Invalid alert status '${newStatus}'. Allowed target statuses are: ${VALID_TARGET_STATUSES.join(', ')}`);
  }

  if (!isSupabaseEnabled()) {
    const existing = memoryStore.getAlertById(id);
    if (!existing) return null;
    return memoryStore.updateAlertStatus(id, normalizedStatus);
  }

  try {
    const { data: existing, error: checkError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!existing) return null;

    const { data, error } = await supabase
      .from('alerts')
      .update({ status: normalizedStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return memoryStore.updateAlertStatus(id, normalizedStatus);
  }
}

export async function recordAlert(alertData) {
  if (!isSupabaseEnabled()) {
    return memoryStore.addAlert(alertData);
  }

  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return memoryStore.addAlert(alertData);
  }
}

export default {
  getAlerts,
  getAlertById,
  updateAlertStatus,
  recordAlert,
  VALID_TARGET_STATUSES
};
