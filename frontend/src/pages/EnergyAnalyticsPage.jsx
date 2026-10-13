import React, { useState, useEffect } from 'react';
import {
  BuildingWasteChart,
  HourlyTelemetryTrendChart
} from '../components/analytics/AnalyticsCharts';
import TariffCalculator from '../components/analytics/TariffCalculator';
import MetricCard from '../components/common/MetricCard';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Zap,
  IndianRupee,
  Activity,
  Layers,
  Thermometer,
  Tv,
  Lightbulb,
  Building2,
  TrendingDown,
  Info
} from 'lucide-react';
import { formatWatts, formatKwh, formatINR } from '../utils/formatters';

export default function EnergyAnalyticsPage() {
  const { analytics, rooms, alerts, isLoading, error, loadAllData, setSelectedRoom } = useApp();

  const [roomAnalytics, setRoomAnalytics] = useState([]);
  const [buildingAnalytics, setBuildingAnalytics] = useState([]);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);

  useEffect(() => {
    async function fetchDetailedAnalytics() {
      setIsFetchingLocal(true);
      try {
        const [roomsRes, historyRes] = await Promise.all([
          api.getAnalyticsRooms().catch(() => null),
          api.getReadingsHistory().catch(() => null)
        ]);

        if (roomsRes && roomsRes.data) {
          setRoomAnalytics(roomsRes.data.rooms || []);
          setBuildingAnalytics(roomsRes.data.buildings || []);
        }
        if (historyRes && historyRes.data) {
          setTelemetryHistory(historyRes.data || []);
        }
      } catch (err) {
        console.warn('Could not fetch room-level analytics:', err);
      } finally {
        setIsFetchingLocal(false);
      }
    }

    fetchDetailedAnalytics();
  }, []);

  const totalPowerW = analytics?.total_power_w ?? rooms.reduce((sum, r) => sum + (r.power_consumption_w || 0), 0);
  const totalWastedKwh = analytics?.estimated_wasted_kwh ?? alerts.reduce(
    (sum, a) => sum + (a.status !== 'RESOLVED' ? (a.estimated_wasted_kwh || 0) : 0),
    0
  );
  const totalWastedCostINR = analytics?.estimated_wasted_cost_inr ?? Number((totalWastedKwh * 8).toFixed(2));

  const eq = analytics?.equipment_summary || {
    waste_ac_count: rooms.filter(r => r.status === 'POTENTIAL_WASTE' && r.ac_status === 'ON').length,
    waste_projector_count: rooms.filter(r => r.status === 'POTENTIAL_WASTE' && r.projector_status === 'ON').length,
    ac_on: rooms.filter(r => r.ac_status === 'ON').length,
    lights_on: rooms.filter(r => r.lights_status === 'ON').length,
  };

  if (isLoading) {
    return <LoadingSpinner message="Calculating energy analytics and tariff benchmarks..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Analytics Data Unavailable"
        message={error}
        onRetry={() => loadAllData(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Monitored Load"
          value={formatWatts(totalPowerW)}
          subtitle="All 8 classrooms combined"
          icon={Zap}
          variant="blue"
        />
        <MetricCard
          title="Active Energy Waste"
          value={formatKwh(totalWastedKwh)}
          subtitle="Cumulative unneeded draw"
          icon={TrendingDown}
          variant="red"
        />
        <MetricCard
          title="Estimated Financial Waste"
          value={formatINR(totalWastedCostINR)}
          subtitle="Standard demo tariff ₹8/kWh"
          icon={IndianRupee}
          variant="red"
        />
        <MetricCard
          title="Potential Monthly Savings"
          value={formatINR(totalWastedKwh * 8 * 25)}
          subtitle="At 25 active academic days"
          icon={Activity}
          variant="emerald"
        />
      </div>

      {/* Equipment Waste Breakdown Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Equipment Anomaly State Summary</h3>
            <p className="text-xs text-slate-500">
              Breakdown of appliances consuming electricity without scheduled occupants
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            Real-time Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-900">Phantom AC Units</span>
              <Thermometer className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-red-700 font-mono">
              {eq.waste_ac_count}
            </div>
            <p className="text-[10px] text-red-600 mt-0.5">ACs cooling empty rooms</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Idle Projectors</span>
              <Tv className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-700 font-mono">
              {eq.waste_projector_count}
            </div>
            <p className="text-[10px] text-amber-600 mt-0.5">Beams on with 0 viewers</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Total Active ACs</span>
              <Thermometer className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
              {eq.ac_on}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Across monitored halls</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Active Luminaires</span>
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
              {eq.lights_on}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Lighting zones powered</p>
          </div>
        </div>
      </div>

      {/* Hourly Trend & Building Waste Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-[340px]">
          <HourlyTelemetryTrendChart history={telemetryHistory} />
        </div>
        <div className="h-[340px]">
          <BuildingWasteChart buildings={buildingAnalytics} />
        </div>
      </div>

      {/* Institutional Savings / Tariff Calculator */}
      <TariffCalculator totalWastedKwh={totalWastedKwh} defaultRate={8} />

      {/* Room-by-room Comparative Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Room-by-Room Energy Efficiency Breakdown
          </h3>
          <p className="text-xs text-slate-500">
            Auditing total draw against estimated occupants and calculated waste loss
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Occupancy Rate</th>
                <th className="py-3 px-4 text-right">Power Draw</th>
                <th className="py-3 px-4 text-right">Est. Wasted kWh</th>
                <th className="py-3 px-4 text-right">Est. Wasted Cost</th>
                <th className="py-3 px-4 text-center">Efficiency Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomAnalytics.map((item) => {
                const isWaste = item.status === 'POTENTIAL_WASTE';
                const isOccupied = item.status === 'OCCUPIED';

                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      const r = rooms.find(x => x.id === item.id);
                      if (r) setSelectedRoom(r);
                    }}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      isWaste ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.room_code}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.building}</td>
                    <td className="py-3 px-4">
                      {item.occupancy} / {item.capacity} ({item.occupancy_pct}%)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatWatts(item.power_w)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                      {item.wasted_kwh > 0 ? formatKwh(item.wasted_kwh) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                      {item.wasted_cost_inr > 0 ? formatINR(item.wasted_cost_inr) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOccupied
                            ? 'bg-emerald-100 text-emerald-800'
                            : isWaste
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOccupied ? 'Productive Load' : isWaste ? 'Severe Waste' : 'Eco Standby'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
