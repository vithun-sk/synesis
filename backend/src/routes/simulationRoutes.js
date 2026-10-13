import express from 'express';
import { simulate } from '../controllers/simulationController.js';
import { validateRequest, simulationBodySchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/', validateRequest({ body: simulationBodySchema }), simulate);

export default router;
