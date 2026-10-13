import { checkDatabaseHealth } from '../config/supabase.js';
import { checkMlServiceHealth } from '../services/mlService.js';
import { config } from '../config/environment.js';

export async function getHealth(req, res, next) {
  try {
    const dbStatus = await checkDatabaseHealth();
    const mlStatus = await checkMlServiceHealth();

    res.json({
      status: 'ok',
      service: 'Phantom Classrooms Backend',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      database: dbStatus,
      ml_service: mlStatus,
      campus_timezone: config.campusTimezone,
      tariff_inr_per_kwh: config.tariffInrPerKwh
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getHealth
};
