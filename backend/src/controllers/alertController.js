import { getAlerts, getAlertById, updateAlertStatus } from '../services/alertService.js';

export async function listAlerts(req, res, next) {
  try {
    const { roomId, severity, status, limit } = req.query;
    const alerts = await getAlerts({ roomId, severity, status, limit });

    res.json({
      count: alerts.length,
      filters: { roomId, severity, status, limit },
      alerts
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedAlert = await updateAlertStatus(id, status);

    if (!updatedAlert) {
      return res.status(404).json({
        error: 'Alert Not Found',
        message: `No waste alert found with ID '${id}'`
      });
    }

    res.json({
      message: `Alert status successfully transitioned to '${status}'`,
      alert: updatedAlert
    });
  } catch (err) {
    next(err);
  }
}

export default {
  listAlerts,
  updateStatus
};
