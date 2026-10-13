import express from 'express';
import { listReadings, getLatest } from '../controllers/readingController.js';
import { validateRequest, readingsQuerySchema } from '../middleware/validate.js';

const router = express.Router();

router.get('/latest', getLatest);
router.get('/', validateRequest({ query: readingsQuerySchema }), listReadings);

export default router;
