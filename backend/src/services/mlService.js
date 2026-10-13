import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

/**
 * ML Service Interface Specification
 *
 * Future Python FastAPI microservice contract:
 * POST /predict
 *
 * Expected Request Body:
 * {
 *   "room_code": "AEH-101",
 *   "power_watts": 2450.0,
 *   "ac_on": true,
 *   "lights_on": true,
 *   "projector_on": true,
 *   "sound_db": 54.2,      // optional acoustic sensor
 *   "co2_ppm": 680,        // optional indoor air quality sensor
 *   "timestamp": "2026-10-13T09:30:00.000Z"
 * }
 *
 * Expected Response Body:
 * {
 *   "estimated_occupancy": 42,
 *   "confidence": 0.94,
 *   "model_version": "v1.2.0-xgboost-occupancy",
 *   "features_used": ["power_watts", "ac_on", "lights_on", "sound_db", "co2_ppm"]
 * }
 */

/**
 * Calls the external FastAPI occupancy prediction microservice.
 * If unreachable or times out, gracefully returns clearly labeled fallback data without fabricating ML inference.
 *
 * @param {Object} sensorFeatures - Classroom sensor readings
 * @param {number} fallbackOccupancy - Default fallback occupancy value if ML service is down
 * @returns {Promise<Object>}
 */
export async function predictOccupancy(sensorFeatures, fallbackOccupancy = 0) {
  if (!config.mlServiceUrl) {
    return {
      estimated_occupancy: fallbackOccupancy,
      confidence: null,
      is_ml_prediction: false,
      ml_status: 'unconfigured',
      notice: 'ML_SERVICE_URL is not configured. Telemetry is using simulated or local sensor estimates.'
    };
  }

  const endpoint = `${config.mlServiceUrl.replace(/\/$/, '')}/predict`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(sensorFeatures),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ML service returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      estimated_occupancy: data.estimated_occupancy,
      confidence: data.confidence || null,
      model_version: data.model_version || 'external-fastapi',
      features_used: data.features_used || [],
      is_ml_prediction: true,
      ml_status: 'available'
    };
  } catch (err) {
    logger.debug('ML prediction service unavailable, using labeled fallback:', { error: err.message });
    return {
      estimated_occupancy: fallbackOccupancy,
      confidence: null,
      is_ml_prediction: false,
      ml_status: 'unavailable_fallback',
      fallback_reason: err.name === 'AbortError' ? 'timeout_exceeded' : err.message,
      notice: 'Python FastAPI occupancy service was unreachable. Using fallback demo occupancy estimate.'
    };
  }
}

/**
 * Checks connectivity and health of the external ML FastAPI service
 * @returns {Promise<{ available: boolean, url: string, status: string, error?: string }>}
 */
export async function checkMlServiceHealth() {
  if (!config.mlServiceUrl) {
    return {
      available: false,
      url: null,
      status: 'unconfigured'
    };
  }

  const endpoint = `${config.mlServiceUrl.replace(/\/$/, '')}/health`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return {
      available: response.ok,
      url: config.mlServiceUrl,
      status: response.ok ? 'connected' : `http_${response.status}`
    };
  } catch (err) {
    return {
      available: false,
      url: config.mlServiceUrl,
      status: 'unavailable',
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message
    };
  }
}

export default {
  predictOccupancy,
  checkMlServiceHealth
};
