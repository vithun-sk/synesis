import { runSimulation } from '../services/simulationService.js';

export async function simulate(req, res, next) {
  try {
    const {
      roomId,
      roomIds,
      scenario,
      estimated_occupancy,
      class_scheduled,
      ac_on,
      lights_on,
      projector_on,
      power_watts
    } = req.body;

    const customData = {
      estimated_occupancy,
      class_scheduled,
      ac_on,
      lights_on,
      projector_on,
      power_watts
    };

    const result = await runSimulation({
      roomId,
      roomIds,
      scenario,
      customData
    });

    res.status(200).json({
      message: 'Simulation completed successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export default {
  simulate
};
