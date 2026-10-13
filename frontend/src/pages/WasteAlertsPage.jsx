import React, { useState, useMemo } from 'react';
import AlertCard from '../components/alerts/AlertCard';
import ResolveAlertModal from '../components/alerts/ResolveAlertModal';
import RoomDetailModal from '../components/rooms/RoomDetailModal';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { useApp } from '../context/AppContext';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Zap,
  IndianRupee
} from 'lucide-react';
import { formatKwh, formatINR } from '../utils/formatters';

export default function WasteAlertsPage() {
  const {
    alerts,
    rooms,
    isLoading,
    error,
    loadAllData,
    handleUpdateAlertStatus,
    selectedRoom,
    setSelectedRoom
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'severity' | 'waste'

  const [alertToResolve, setAlertToResolve] = useState(null);

  // Filtered and sorted alerts
  const processedAlerts = useMemo(() => {
    let list = alerts.filter((a) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title?.toLowerCase().includes(query);
        const matchesRoom = a.room_code?.toLowerCase().includes(query);
        const matchesExpl = a.explanation?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesRoom && !matchesExpl) return false;
      }

      // Severity
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityRank = { CRITICAL: 3, WARNING: 2, INFO: 1 };
        const rankDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        if (rankDiff !== 0) return rankDiff;
      }
      if (sortBy === 'waste') {
        return (b.estimated_wasted_kwh || 0) - (a.estimated_wasted_kwh || 0);
      }
      // Default: newest first
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [alerts, searchQuery, severityFilter, statusFilter, sortBy]);

  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
  const totalOpenWastedKwh = alerts
    .filter((a) => a.status !== 'RESOLVED')
    .reduce((sum, a) => sum + (a.estimated_wasted_kwh || 0), 0);

  if (isLoading) {
    return <LoadingSpinner message="Auditing active energy waste alerts..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Alert Management Offline"
        message={error}
        onRetry={() => loadAllData(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Summary Header Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-100 text-red-600">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Anomaly Alerts
            </span>
            <div className="text-xl font-extrabold text-slate-900">{openCount} Active</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Critical Severity
            </span>
            <div className="text-xl font-extrabold text-red-600">{criticalCount} Urgent</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Wasted Energy
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              {formatKwh(totalOpenWastedKwh)}{' '}
              <span className="text-xs text-slate-500 font-normal">
                (~{formatINR(totalOpenWastedKwh * 8)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by room (e.g. CR-101), title, or keywords..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="severity">Sort: Highest Severity</option>
              <option value="waste">Sort: Highest Waste kWh</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold mr-1 text-[11px] uppercase tracking-wider">
            Severity:
          </span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev === 'ALL' ? 'All Severities' : sev}
            </button>
          ))}

          <span className="text-slate-400 font-semibold mx-1 text-[11px] uppercase tracking-wider ml-auto">
            Status:
          </span>
          {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {processedAlerts.length === 0 ? (
        <EmptyState
          title="No alerts match your filter settings"
          message="There are currently no active alerts matching these filters."
          icon={CheckCircle2}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={(a) => setAlertToResolve(a)}
              onInspectRoom={(roomCode) => {
                const r = rooms.find((x) => x.room_code === roomCode);
                if (r) setSelectedRoom(r);
              }}
            />
          ))}
        </div>
      )}

      {/* Confirmation & Resolve Modal */}
      {alertToResolve && (
        <ResolveAlertModal
          alert={alertToResolve}
          onClose={() => setAlertToResolve(null)}
          onConfirm={handleUpdateAlertStatus}
        />
      )}

      {/* Room Detail Modal if user inspected from alert */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
