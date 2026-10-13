import React from 'react';
import {
  Zap,
  LayoutDashboard,
  DoorClosed,
  AlertTriangle,
  BarChart3,
  Activity,
  Play,
  Database,
  Radio
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { activeTab, setActiveTab, alerts, isConnected, setSimulationModalOpen } = useApp();

  const openAlertsCount = alerts.filter(a => a.status === 'OPEN').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rooms', label: 'Classroom Monitoring', icon: DoorClosed },
    {
      id: 'alerts',
      label: 'Waste Alerts',
      icon: AlertTriangle,
      badge: openAlertsCount > 0 ? openAlertsCount : null,
      badgeColor: 'bg-red-500 text-white',
    },
    { id: 'analytics', label: 'Energy Analytics', icon: BarChart3 },
    { id: 'status', label: 'About / System Status', icon: Activity },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-slate-950 text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-sm text-white">PHANTOM</span>
                <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CLASSROOMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">
                See the waste. Save the energy.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Status Pill */}
        <div className="px-5 py-3 border-b border-slate-900 bg-slate-900/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-300 font-medium">
                {isConnected ? 'Backend Online' : 'Backend Offline'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">PORT 5000</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Intelligence Console
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Simulation Trigger */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/80">
          <button
            onClick={() => setSimulationModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-950 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Telemetry / Waste</span>
          </button>

          <div className="mt-3.5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-slate-400" />
              Supabase DB
            </span>
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              YOLOv8 Edge
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
