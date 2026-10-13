import { getAllRooms, getRoomById } from '../services/roomService.js';

export async function listRooms(req, res, next) {
  try {
    const rooms = await getAllRooms();
    res.json({
      count: rooms.length,
      rooms
    });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const { id } = req.params;
    const room = await getRoomById(id);

    if (!room) {
      return res.status(404).json({
        error: 'Room Not Found',
        message: `No classroom exists with ID '${id}'`
      });
    }

    res.json(room);
  } catch (err) {
    next(err);
  }
}

export default {
  listRooms,
  getRoom
};
