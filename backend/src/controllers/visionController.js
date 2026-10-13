import { config } from '../config/environment.js';
import { getRoomById } from '../services/roomService.js';
import { recordReading } from '../services/readingService.js';
import { evaluateReading } from '../services/wasteDetectionService.js';
import { recordAlert, getAlerts } from '../services/alertService.js';
import { logger } from '../utils/logger.js';

const ML_BASE = (config.mlServiceUrl || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Health check proxy to the Python YOLOv8 microservice
 */
export async function getVisionHealth(req, res, next) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${ML_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        available: false,
        status: `http_${response.status}`,
        message: 'Vision service responded with non-200 code'
      });
    }

    const data = await response.json();
    res.json({
      available: true,
      ...data
    });
  } catch (err) {
    res.status(503).json({
      available: false,
      status: 'unavailable',
      error: err.name === 'AbortError' ? 'Connection timeout' : err.message
    });
  }
}

/**
 * Process a webcam frame through YOLOv8
 */
export async function detectFrame(req, res, next) {
  try {
    const { image, room_id, room_code, confidence_threshold } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image frame data.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${ML_BASE}/api/vision/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, room_id, room_code, confidence_threshold }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: 'Vision detection error',
        details: errText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * Record a genuine camera occupancy telemetry reading to Supabase
 */
export async function recordCameraReading(req, res, next) {
  try {
    const { room_id, estimated_occupancy, confidence } = req.body;

    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }

    const room = await getRoomById(room_id);
    if (!room) {
      return res.status(404).json({ error: `Room '${room_id}' not found` });
    }

    // Preserve latest known electrical status or defaults
    const latest = room.latest_reading || {};
    const acOn = req.body.ac_on !== undefined ? req.body.ac_on : (latest.ac_on ?? false);
    const lightsOn = req.body.lights_on !== undefined ? req.body.lights_on : (latest.lights_on ?? true);
    const projectorOn = req.body.projector_on !== undefined ? req.body.projector_on : (latest.projector_on ?? false);
    const powerWatts = req.body.power_watts !== undefined ? req.body.power_watts : (latest.power_watts ?? 150);

    const isClassScheduled = (room.timetables || []).some((t) => {
      if (t.status !== 'scheduled') return false;
      const now = new Date();
      const start = new Date(t.start_time);
      const end = new Date(t.end_time);
      return now >= start && now <= end;
    });

    const newReading = {
      room_id,
      recorded_at: new Date().toISOString(),
      estimated_occupancy: Math.max(0, parseInt(estimated_occupancy, 10) || 0),
      class_scheduled: isClassScheduled,
      ac_on: acOn,
      lights_on: lightsOn,
      projector_on: projectorOn,
      power_watts: Number(powerWatts),
      data_source: 'sensor' // genuine camera sensor reading
    };

    const savedReading = await recordReading(newReading);

    // Evaluate waste detection rules
    const existingAlerts = await getAlerts({ roomId: room_id, status: 'open' });
    const candidateAlert = evaluateReading(savedReading, {
      timetables: room.timetables || [],
      existingOpenAlerts: existingAlerts,
      room
    });

    let createdAlert = null;
    if (candidateAlert && !candidateAlert.is_duplicate) {
      createdAlert = await recordAlert(candidateAlert);
    }

    res.status(201).json({
      message: 'Camera reading recorded successfully',
      reading: savedReading,
      alert: createdAlert
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Close active camera session for a room
 */
export async function closeSession(req, res, next) {
  try {
    const { room_id } = req.body;
    await fetch(`${ML_BASE}/api/vision/session/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: room_id || 'default' })
    }).catch(() => null);

    res.json({ success: true, message: `Session for room ${room_id} closed` });
  } catch (err) {
    next(err);
  }
}

export default {
  getVisionHealth,
  detectFrame,
  recordCameraReading,
  closeSession
};
