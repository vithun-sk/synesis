import { z } from 'zod';

/**
 * Express middleware generator that validates request parts using Zod schemas
 * @param {Object} schemas - { body?: z.ZodSchema, query?: z.ZodSchema, params?: z.ZodSchema }
 */
export function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (body) {
        req.body = body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

// -----------------------------------------------------------------------------
// REUSABLE SCHEMAS
// -----------------------------------------------------------------------------

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format for ID parameter' })
});

export const readingsQuerySchema = z.object({
  roomId: z.string().uuid({ message: 'roomId must be a valid UUID' }).optional(),
  from: z.string().datetime({ message: 'from must be an ISO 8601 timestamp' }).optional(),
  to: z.string().datetime({ message: 'to must be an ISO 8601 timestamp' }).optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: 'limit must be an integer between 1 and 100'
    })
});

export const alertsQuerySchema = z.object({
  roomId: z.string().uuid({ message: 'roomId must be a valid UUID' }).optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['open', 'acknowledged', 'resolved']).optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: 'limit must be an integer between 1 and 100'
    })
});

export const alertStatusUpdateSchema = z.object({
  status: z.enum(['acknowledged', 'resolved'], {
    errorMap: () => ({ message: "Status must be either 'acknowledged' or 'resolved'" })
  })
});

export const simulationBodySchema = z.object({
  roomId: z.string().uuid({ message: 'roomId must be a valid UUID' }).optional(),
  roomIds: z.array(z.string().uuid({ message: 'roomIds must be valid UUIDs' })).optional(),
  scenario: z
    .enum(['occupied', 'empty_waste', 'empty_normal', 'lights_only', 'custom'], {
      errorMap: () => ({
        message: "Scenario must be one of: 'occupied', 'empty_waste', 'empty_normal', 'lights_only', 'custom'"
      })
    })
    .default('empty_waste'),
  estimated_occupancy: z
    .number()
    .int({ message: 'estimated_occupancy must be an integer' })
    .min(0, { message: 'estimated_occupancy cannot be negative' })
    .optional(),
  class_scheduled: z.boolean().optional(),
  ac_on: z.boolean().optional(),
  lights_on: z.boolean().optional(),
  projector_on: z.boolean().optional(),
  power_watts: z
    .number()
    .min(0, { message: 'power_watts cannot be negative' })
    .optional()
});
