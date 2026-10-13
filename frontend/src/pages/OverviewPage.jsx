import React from 'react';
import OverviewKPIs from '../components/overview/OverviewKPIs';
import {
  OccupancyDistributionChart,
  ClassroomPowerUsageChart,
  EnergyWasteByRoomChart,
  AlertSeverityDistributionChart
} from '../components/overview/OverviewCharts';
import LiveRoomSummaryTable from '../components/overview/LiveRoomSummaryTable';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldAlert, Cpu } from 'lucide-react';

export default function OverviewPage() {
  const { isLoading, error, loadAllData, setSimulationModalOpen } = useApp();

  if (isLoading) {
    return <LoadingSpinner message="Loading Phantom Classrooms intelligence stream..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Telemetry Stream Offline"
        message={error}
        onRetry={() => loadAllData(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hackathon Prototype Banner */}
      {/* <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Edge Vision & Smart Energy Telemetry Active
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
              Camera feeds calculate real-time human presence using edge object detection. Cross-referencing timetable schedules with power draw reveals phantom energy waste in vacant classrooms.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setSimulationModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Simulate Waste Events</span>
          </button>
        </div>
      </div> */}

      {/* KPI Cards */}
      <OverviewKPIs />

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-[320px]">
          <ClassroomPowerUsageChart />
        </div>
        <div className="h-[320px]">
          <EnergyWasteByRoomChart />
        </div>
      </div>

      {/* Secondary Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-[300px]">
          <OccupancyDistributionChart />
        </div>
        <div className="h-[300px]">
          <AlertSeverityDistributionChart />
        </div>
      </div>

      {/* Live Classroom Priority Table */}
      <LiveRoomSummaryTable />
    </div>
  );
}
