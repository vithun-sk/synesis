import { getOverview, getRoomComparisons } from '../services/analyticsService.js';

export async function getAnalyticsOverview(req, res, next) {
  try {
    const overview = await getOverview();
    res.json(overview);
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsRooms(req, res, next) {
  try {
    const rooms = await getRoomComparisons();
    res.json({
      count: rooms.length,
      ranking_criteria: 'Ranked by potential avoidable power waste (highest avoidable load first)',
      rooms
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getAnalyticsOverview,
  getAnalyticsRooms
};
