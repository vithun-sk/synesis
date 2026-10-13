import express from 'express';
import {
  getVisionHealth,
  detectFrame,
  recordCameraReading,
  closeSession
} from '../controllers/visionController.js';

const router = express.Router();

router.get('/health', getVisionHealth);
router.post('/detect', detectFrame);
router.post('/reading', recordCameraReading);
router.post('/session/close', closeSession);

export default router;
