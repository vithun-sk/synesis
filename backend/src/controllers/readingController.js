import { getReadings, getLatestReadings } from '../services/readingService.js';

export async function listReadings(req, res, next) {
  try {
    const { roomId, from, to, limit } = req.query;
    const readings = await getReadings({ roomId, from, to, limit });

    res.json({
      count: readings.length,
      filters: { roomId, from, to, limit },
      readings
    });
  } catch (err) {
    next(err);
  }
}

export async function getLatest(req, res, next) {
  try {
    const latestReadings = await getLatestReadings();

    res.json({
      count: latestReadings.length,
      latest_readings: latestReadings
    });
  } catch (err) {
    next(err);
  }
}

export default {
  listReadings,
  getLatest
};
