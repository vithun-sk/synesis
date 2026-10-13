import express from 'express';
import {
  getAnalyticsOverview,
  getAnalyticsRooms
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', getAnalyticsOverview);
router.get('/rooms', getAnalyticsRooms);

export default router;
