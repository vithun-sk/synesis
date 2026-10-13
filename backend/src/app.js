import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import healthRoutes from './routes/healthRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import readingRoutes from './routes/readingRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import visionRoutes from './routes/visionRoutes.js';

import notFoundHandler from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root welcome & API index
app.get('/', (req, res) => {
  res.json({
    service: 'Phantom Classrooms API',
    description: 'Intelligent campus energy-management backend detecting classroom electricity waste',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      rooms: ['GET /api/rooms', 'GET /api/rooms/:id'],
      readings: ['GET /api/readings', 'GET /api/readings/latest'],
      alerts: ['GET /api/alerts', 'PATCH /api/alerts/:id/status'],
      analytics: ['GET /api/analytics/overview', 'GET /api/analytics/rooms'],
      vision: ['GET /api/vision/health', 'POST /api/vision/detect', 'POST /api/vision/reading'],
      simulation: 'POST /api/simulate'
    }
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/simulate', simulationRoutes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
