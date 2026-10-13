import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { formatWatts, formatKwh, formatINR } from '../../utils/formatters';

export function BuildingWasteChart({ buildings = [] }) {
  const data = buildings.map((b) => ({
    building: b.building,
    wasted_kwh: b.total_wasted_kwh,
    wasted_cost: b.total_wasted_cost_inr,
    power_w: b.total_power_w,
    room_count: b.room_count,
    waste_rooms: b.waste_room_count,
  }));

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Waste Comparison by Building</h3>
          <p className="text-xs text-slate-500">Cumulative unneeded kWh load by campus zone</p>
        </div>
      </div>
      <div className="flex-1 min-h-[240px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No building records available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="building" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val, name, item) => [
                  `${formatKwh(val)} (~${formatINR(item.payload.wasted_cost)})`,
                  'Estimated Waste'
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="wasted_kwh" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function HourlyTelemetryTrendChart({ history = [] }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Campus Power vs. Waste Anomaly Profile</h3>
          <p className="text-xs text-slate-500">Hourly snapshot showing surge in unutilized load post-dismissal</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Total Power (kW)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Wasted Load (kW)
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="totalPowerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(val) => [`${val} kW`]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="total_power_kw"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#totalPowerGrad)"
              name="Total Campus Load"
            />
            <Area
              type="monotone"
              dataKey="estimated_waste_kw"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#wasteGrad)"
              name="Estimated Ghost Load"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
