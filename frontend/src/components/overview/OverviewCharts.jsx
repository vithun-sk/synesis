import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatWatts, formatKwh, formatINR } from '../../utils/formatters';

export function OccupancyDistributionChart() {
  const { rooms } = useApp();

  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantNormal = rooms.filter(r => r.status === 'VACANT_NORMAL').length;
  const potentialWaste = rooms.filter(r => r.status === 'POTENTIAL_WASTE').length;
  const staleData = rooms.filter(r => r.status === 'STALE_DATA').length;

  const data = [
    { name: 'Occupied', value: occupied, color: '#10b981' },
    { name: 'Vacant (Normal)', value: vacantNormal, color: '#94a3b8' },
    { name: 'Potential Waste', value: potentialWaste, color: '#ef4444' },
    { name: 'Stale Telemetry', value: staleData, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Room Occupancy Distribution</h3>
          <p className="text-xs text-slate-500">Live breakdown across {rooms.length} monitored rooms</p>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name) => [`${val} rooms`, name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ClassroomPowerUsageChart() {
  const { rooms, setSelectedRoom } = useApp();

  const chartData = rooms.map(r => ({
    room: r.room_code,
    power: r.power_consumption_w,
    status: r.status,
    occupancy: r.estimated_occupancy,
    raw: r
  }));

  const getBarColor = (status) => {
    switch (status) {
      case 'POTENTIAL_WASTE': return '#ef4444'; // Red
      case 'OCCUPIED': return '#10b981'; // Emerald
      case 'STALE_DATA': return '#f59e0b'; // Amber
      default: return '#94a3b8'; // Slate
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Power Consumption by Classroom (Watts)</h3>
          <p className="text-xs text-slate-500">Red highlights ghost power in unoccupied rooms</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Occupied
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Waste Load
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Normal
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="room" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name, item) => [
                formatWatts(value),
                `Power (${item.payload.status.replace('_', ' ')})`
              ]}
              labelFormatter={(label) => `Classroom: ${label}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Bar
              dataKey="power"
              radius={[6, 6, 0, 0]}
              onClick={(entry) => setSelectedRoom(entry.raw)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={getBarColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EnergyWasteByRoomChart() {
  const { alerts, rooms, setSelectedRoom } = useApp();

  // Aggregate estimated wasted kWh per room from alerts
  const wasteByRoomMap = {};
  alerts.forEach(a => {
    if (a.status !== 'RESOLVED') {
      const code = a.room_code;
      wasteByRoomMap[code] = (wasteByRoomMap[code] || 0) + (a.estimated_wasted_kwh || 0);
    }
  });

  const chartData = Object.entries(wasteByRoomMap)
    .map(([roomCode, wastedKwh]) => {
      const room = rooms.find(r => r.room_code === roomCode);
      return {
        room: roomCode,
        wasted_kwh: Number(wastedKwh.toFixed(2)),
        wasted_cost: Number((wastedKwh * 8.0).toFixed(2)),
        roomData: room
      };
    })
    .sort((a, b) => b.wasted_kwh - a.wasted_kwh);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Estimated Energy Waste by Room (kWh)</h3>
          <p className="text-xs text-slate-500">Cumulative unneeded consumption in open alerts</p>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No active energy waste detected across rooms!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="room"
                type="category"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(val, name, item) => [
                  `${formatKwh(val)} (~${formatINR(item.payload.wasted_cost)})`,
                  'Estimated Waste'
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar
                dataKey="wasted_kwh"
                fill="#f43f5e"
                radius={[0, 6, 6, 0]}
                onClick={(entry) => entry.roomData && setSelectedRoom(entry.roomData)}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function AlertSeverityDistributionChart() {
  const { alerts } = useApp();

  const openAlerts = alerts.filter(a => a.status !== 'RESOLVED');
  const critical = openAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warning = openAlerts.filter(a => a.severity === 'WARNING').length;
  const info = openAlerts.filter(a => a.severity === 'INFO').length;

  const data = [
    { name: 'Critical', value: critical, color: '#ef4444' },
    { name: 'Warning', value: warning, color: '#f59e0b' },
    { name: 'Info / Low', value: info, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Alert Severity Distribution</h3>
          <p className="text-xs text-slate-500">{openAlerts.length} unresolved alerts</p>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-emerald-600 font-medium">
            ✓ All energy waste alerts resolved!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${val} alerts`, name]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
