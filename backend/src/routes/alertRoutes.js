import express from 'express';
import { listAlerts, updateStatus } from '../controllers/alertController.js';
import {
  validateRequest,
  alertsQuerySchema,
  uuidParamSchema,
  alertStatusUpdateSchema
} from '../middleware/validate.js';

const router = express.Router();

router.get('/', validateRequest({ query: alertsQuerySchema }), listAlerts);
router.patch(
  '/:id/status',
  validateRequest({ params: uuidParamSchema, body: alertStatusUpdateSchema }),
  updateStatus
);

export default router;
