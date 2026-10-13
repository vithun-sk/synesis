import React from 'react';
import { ExternalLink, BellRing, ArrowRight, Video } from 'lucide-react';
import { RoomStatusBadge } from '../common/StatusBadge';
import { formatWatts, formatRelativeTime } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export default function LiveRoomSummaryTable() {
  const { rooms, setSelectedRoom, setActiveTab } = useApp();

  // Sort by potential waste first, then by power consumption
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.status === 'POTENTIAL_WASTE' && b.status !== 'POTENTIAL_WASTE') return -1;
    if (b.status === 'POTENTIAL_WASTE' && a.status !== 'POTENTIAL_WASTE') return 1;
    return (b.power_consumption_w || 0) - (a.power_consumption_w || 0);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Live Classroom Waste Prioritization
          </h3>
          <p className="text-xs text-slate-500">
            Real-time optical occupancy estimates paired with active electrical telemetry
          </p>
        </div>
        <button
          onClick={() => setActiveTab('rooms')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors self-start sm:self-auto"
        >
          View all 8 classrooms
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Room & Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Occupancy / Timetable</th>
              <th className="py-3 px-4">Active Equipment</th>
              <th className="py-3 px-4 text-right">Power Draw</th>
              <th className="py-3 px-4 text-center">Alerts</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRooms.map((room) => {
              const isWaste = room.status === 'POTENTIAL_WASTE';

              return (
                <tr
                  key={room.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isWaste ? 'bg-red-50/30' : ''
                  }`}
                >
                  {/* Room & Building */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isWaste
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {room.room_code.replace('CR-', '')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{room.room_code}</span>
                          <span className="font-normal text-slate-500 text-[11px] truncate max-w-[120px]">
                            ({room.name})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {room.building} • {room.floor}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RoomStatusBadge status={room.status} />
                  </td>

                  {/* Occupancy / Timetable */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">
                      {room.estimated_occupancy} / {room.capacity} seats
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          room.is_scheduled ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                      />
                      {room.is_scheduled ? 'Scheduled Lecture' : 'Unscheduled'}
                    </div>
                  </td>

                  {/* Equipment States */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          room.ac_status === 'ON'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                        title={`AC: ${room.ac_status} ${room.ac_temp ? `(${room.ac_temp}°C)` : ''}`}
                      >
                        AC: {room.ac_status}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          room.lights_status === 'ON'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                        title={`Lights: ${room.lights_status}`}
                      >
                        LT: {room.lights_status}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          room.projector_status === 'ON'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                        title={`Projector: ${room.projector_status}`}
                      >
                        PRJ: {room.projector_status}
                      </span>
                    </div>
                  </td>

                  {/* Power Draw */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-mono font-bold ${
                        isWaste ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {formatWatts(room.power_consumption_w)}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {formatRelativeTime(room.last_reading_time)}
                    </div>
                  </td>

                  {/* Open Alert Count */}
                  <td className="py-3.5 px-4 text-center">
                    {room.open_alerts_count > 0 ? (
                      <button
                        onClick={() => setActiveTab('alerts')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors"
                      >
                        <BellRing className="w-3 h-3" />
                        {room.open_alerts_count}
                      </button>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg font-medium transition-colors border border-slate-200 hover:border-emerald-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
