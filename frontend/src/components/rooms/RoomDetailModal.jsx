import React from 'react';
import {
  X,
  Users,
  Zap,
  Clock,
  Video,
  Calendar,
  Thermometer,
  Lightbulb,
  Tv,
  AlertTriangle,
  Building2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { RoomStatusBadge, AlertSeverityBadge, AlertStatusBadge } from '../common/StatusBadge';
import { formatWatts, formatRelativeTime, formatINR, formatKwh } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export default function RoomDetailModal({ room, onClose }) {
  const { alerts, handleUpdateAlertStatus, setActiveTab } = useApp();

  if (!room) return null;

  const roomAlerts = alerts.filter(
    (a) => a.room_id === room.id || a.room_code === room.room_code
  );
  const isWaste = room.status === 'POTENTIAL_WASTE';
  const occupancyPct = Math.round(((room.estimated_occupancy || 0) / (room.capacity || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-extrabold flex items-center justify-center text-sm shadow">
              {room.room_code.replace('CR-', '')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{room.room_code}</h3>
                <span className="text-xs text-slate-500 font-medium">({room.name})</span>
                <RoomStatusBadge status={room.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                {room.building} • {room.floor} • Capacity: {room.capacity} students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Potential Waste Callout */}
          {isWaste && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 text-sm">Potential Energy Waste In Progress</h4>
                <p className="text-red-700 mt-0.5 leading-relaxed">
                  Optical sensors detect <strong>0 occupants</strong> for{' '}
                  <strong>{room.waste_duration_minutes || 60} minutes</strong> while electrical draw is{' '}
                  <strong>{formatWatts(room.power_consumption_w)}</strong>. No lecture is currently scheduled in the campus timetable.
                </p>
              </div>
            </div>
          )}

          {/* Grid of Key Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Power
              </span>
              <span className={`text-base font-bold font-mono ${isWaste ? 'text-red-600' : 'text-slate-900'}`}>
                {formatWatts(room.power_consumption_w)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Live draw</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Estimated Occupants
              </span>
              <span className="text-base font-bold text-slate-900">
                {room.estimated_occupancy} <span className="text-xs font-normal text-slate-400">/ {room.capacity}</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{occupancyPct}% utilized</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Camera Conf.
              </span>
              <span className="text-base font-bold text-emerald-700">
                {Math.round((room.occupancy_confidence || 0.94) * 100)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{room.camera_id || 'CAM-EDGE-01'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Timetable State
              </span>
              <span className={`text-xs font-bold ${room.is_scheduled ? 'text-blue-700' : 'text-slate-600'}`}>
                {room.is_scheduled ? 'Scheduled Class' : 'Unscheduled'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Campus ERP sync</span>
            </div>
          </div>

          {/* Equipment Status Telemetry */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5">
              Equipment Telemetry
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="font-semibold text-slate-700">Air Conditioner</span>
                    <p className="text-[10px] text-slate-400">{room.ac_temp ? `Target: ${room.ac_temp}°C` : 'Off'}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    room.ac_status === 'ON' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {room.ac_status}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="font-semibold text-slate-700">Lighting Circuit</span>
                    <p className="text-[10px] text-slate-400">Ceiling Luminaires</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    room.lights_status === 'ON' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {room.lights_status}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-500" />
                  <div>
                    <span className="font-semibold text-slate-700">Laser Projector</span>
                    <p className="text-[10px] text-slate-400">HDMI/AV Display</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    room.projector_status === 'ON' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {room.projector_status}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Alerts */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Active Alerts for this Classroom ({roomAlerts.length})
              </h4>
            </div>

            {roomAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No active energy waste alerts for {room.room_code}.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {roomAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertSeverityBadge severity={alert.severity} />
                        <span className="font-bold text-slate-900">{alert.title}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {alert.explanation}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                        <span>Wasted: <strong>{formatKwh(alert.estimated_wasted_kwh)}</strong></span>
                        <span>Cost: <strong>{formatINR(alert.estimated_wasted_cost_inr)}</strong></span>
                        <span>Reported: {formatRelativeTime(alert.created_at)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                      <AlertStatusBadge status={alert.status} />
                      {alert.status === 'OPEN' && (
                        <button
                          onClick={async () => {
                            await handleUpdateAlertStatus(alert.id, 'RESOLVED', 'Resolved via Room Inspector modal');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prototype Disclosure */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Occupancy count is an estimate generated by computer vision object detection. No raw camera images or video streams are stored to maintain student and faculty privacy.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Last reading: {formatRelativeTime(room.last_reading_time)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
