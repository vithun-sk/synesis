import React, { useState, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  Play,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header({ onToggleSidebar }) {
  const {
    activeTab,
    isConnected,
    isRefreshing,
    loadAllData,
    lastUpdated,
    setSimulationModalOpen
  } = useApp();

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const titles = {
    overview: {
      title: 'Energy Intelligence Overview',
      subtitle: 'Real-time campus occupancy & power anomaly monitoring',
    },
    rooms: {
      title: 'Classroom Monitoring',
      subtitle: '8 active smart classrooms with camera vision telemetry',
    },
    alerts: {
      title: 'Energy Waste Alerts',
      subtitle: 'Automated detections of unoccupied HVAC & projector usage',
    },
    analytics: {
      title: 'Energy Analytics & Savings',
      subtitle: 'Power consumption benchmarks, building loads, and tariff impact',
    },
    status: {
      title: 'System Status & Architecture',
      subtitle: 'API health, camera inference pipeline, and Supabase telemetry',
    },
  };

  const currentMeta = titles[activeTab] || titles.overview;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {currentMeta.title}
              {/* <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Live Prototype
              </span> */}
            </h1>
            <p className="text-xs text-slate-500 hidden md:block">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date/Time, Connection Status, Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Clock Display */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              • {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Connection Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Backend Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Disconnected</span>
              </>
            )}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => loadAllData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh all telemetry data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Run Simulation Button */}
          {/* <button
            onClick={() => setSimulationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Simulation</span>
          </button> */}
        </div>
      </div>
    </header>
  );
}
