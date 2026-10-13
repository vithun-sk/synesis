import React from 'react';
import {
  Users,
  Zap,
  Clock,
  Video,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Thermometer
} from 'lucide-react';
import { RoomStatusBadge, EquipmentIndicator } from '../common/StatusBadge';
import { formatWatts, formatRelativeTime } from '../../utils/formatters';

export default function RoomCard({ room, onInspect }) {
  const isWaste = room.status === 'POTENTIAL_WASTE';
  const occupancyPct = Math.round(((room.estimated_occupancy || 0) / (room.capacity || 1)) * 100);

  return (
    <div
      onClick={onInspect}
      className={`group relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isWaste
          ? 'border-red-300 ring-1 ring-red-200/50 hover:border-red-400'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Meta: Room Code, Building, Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                {room.room_code}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {room.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {room.building} • {room.floor}
            </p>
          </div>
          <RoomStatusBadge status={room.status} />
        </div>

        {/* Occupancy Indicator & Progress Bar */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 my-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Occupancy:
            </span>
            <span className="font-bold text-slate-800">
              {room.estimated_occupancy} / {room.capacity} ({occupancyPct}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isWaste
                  ? 'bg-red-500'
                  : occupancyPct > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, occupancyPct))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {room.is_scheduled ? 'Class Scheduled' : 'No Class Scheduled'}
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3 text-slate-400" />
              Camera conf: {Math.round((room.occupancy_confidence || 0.9) * 100)}%
            </span>
          </div>
        </div>

        {/* Equipment Status Badges */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <EquipmentIndicator
            label="AC"
            status={room.ac_status}
            detail={room.ac_temp ? `${room.ac_temp}°C` : undefined}
          />
          <EquipmentIndicator label="Lights" status={room.lights_status} />
          <EquipmentIndicator label="Projector" status={room.projector_status} />
        </div>
      </div>

      {/* Bottom Footer: Power Consumption & Inspect Trigger */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Power Draw
          </div>
          <div
            className={`font-mono text-sm font-extrabold flex items-center gap-1 ${
              isWaste ? 'text-red-600' : 'text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {formatWatts(room.power_consumption_w)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {room.open_alerts_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3" />
              {room.open_alerts_count}
            </span>
          )}
          <span className="text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center">
            Inspect <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
