import express from 'express';
import { listRooms, getRoom } from '../controllers/roomController.js';
import { validateRequest, uuidParamSchema } from '../middleware/validate.js';

const router = express.Router();

router.get('/', listRooms);
router.get('/:id', validateRequest({ params: uuidParamSchema }), getRoom);

export default router;
