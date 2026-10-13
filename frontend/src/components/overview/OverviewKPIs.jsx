import React from 'react';
import {
  DoorClosed,
  Users,
  Moon,
  AlertTriangle,
  BellRing,
  Zap,
  IndianRupee
} from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { formatWatts, formatKwh, formatINR } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export default function OverviewKPIs() {
  const { analytics, rooms, alerts, setActiveTab } = useApp();

  // Calculate fallbacks cleanly if analytics endpoint hasn't arrived
  const totalClassrooms = analytics?.total_classrooms ?? rooms.length;
  const occupiedCount = analytics?.occupied_classrooms ?? rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantNormalCount = analytics?.vacant_classrooms ?? rooms.filter(r => r.status === 'VACANT_NORMAL').length;
  const wasteCount = analytics?.potential_waste_classrooms ?? rooms.filter(r => r.status === 'POTENTIAL_WASTE').length;
  const openAlertsCount = analytics?.open_alerts_count ?? alerts.filter(a => a.status === 'OPEN').length;

  const totalWastedKwh = analytics?.estimated_wasted_kwh ?? alerts.reduce(
    (sum, a) => sum + (a.status !== 'RESOLVED' ? (a.estimated_wasted_kwh || 0) : 0),
    0
  );

  const totalWastedCostINR = analytics?.estimated_wasted_cost_inr ?? Number(
    (totalWastedKwh * 8.0).toFixed(2)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <MetricCard
        title="Total Classrooms"
        value={totalClassrooms}
        subtitle="Monitored smart halls"
        icon={DoorClosed}
        variant="neutral"
        onClick={() => setActiveTab('rooms')}
      />
      <MetricCard
        title="Occupied"
        value={occupiedCount}
        subtitle="Lectures in progress"
        icon={Users}
        variant="emerald"
        onClick={() => setActiveTab('rooms')}
      />
      <MetricCard
        title="Vacant (Normal)"
        value={vacantNormalCount}
        subtitle="Off-grid / eco standby"
        icon={Moon}
        variant="neutral"
        onClick={() => setActiveTab('rooms')}
      />
      <MetricCard
        title="Potential Waste"
        value={wasteCount}
        subtitle="Unoccupied with loads"
        icon={AlertTriangle}
        variant="red"
        badge={wasteCount > 0 ? 'Requires Action' : 'Optimal'}
        onClick={() => setActiveTab('rooms')}
      />
      <MetricCard
        title="Open Alerts"
        value={openAlertsCount}
        subtitle="Anomalies detected"
        icon={BellRing}
        variant="amber"
        onClick={() => setActiveTab('alerts')}
      />
      <MetricCard
        title="Est. Wasted Energy"
        value={formatKwh(totalWastedKwh)}
        subtitle="Active unneeded draw"
        icon={Zap}
        variant="red"
        onClick={() => setActiveTab('analytics')}
      />
      <MetricCard
        title="Est. Wasted Cost"
        value={formatINR(totalWastedCostINR)}
        subtitle="At demo tariff ₹8/kWh"
        icon={IndianRupee}
        variant="red"
        onClick={() => setActiveTab('analytics')}
      />
    </div>
  );
}
