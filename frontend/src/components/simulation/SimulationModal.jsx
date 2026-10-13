import React, { useState } from 'react';
import {
  X,
  Play,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Clock,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SimulationModal({ isOpen, onClose }) {
  const { handleRunSimulation } = useApp();
  const [selectedScenario, setSelectedScenario] = useState('peak_waste');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'peak_waste',
      title: 'Simulate Sudden Ghost Load Event',
      badge: 'Escalate Anomaly',
      badgeColor: 'bg-red-100 text-red-700',
      description:
        'Simulates an unscheduled lecture ending in CR-202 (Physics Hall) where occupants vacated but twin 1.5-ton split ACs and display projector remain active. Triggers a new CRITICAL alert on the backend.',
      icon: Flame,
    },
    {
      id: 'all_resolved',
      title: 'Simulate Automated Smart Eco-Setback',
      badge: 'Remediate Waste',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      description:
        'Dispatches automated IoT turn-off relay signals to all vacant classrooms with running HVAC or AV. Resolves open alerts and drops power consumption to standby levels.',
      icon: CheckCircle2,
    },
    {
      id: 'telemetry_tick',
      title: 'Live Telemetry Refresh (Tick)',
      badge: 'Sensor Loop',
      badgeColor: 'bg-blue-100 text-blue-700',
      description:
        'Generates standard live sensor fluctuations (±20W electrical jitter) and updates timestamp across all 8 classroom nodes.',
      icon: Zap,
    },
  ];

  const handleExecute = async () => {
    setIsRunning(true);
    setSimulationResult(null);

    try {
      const result = await handleRunSimulation(selectedScenario);
      setSimulationResult(result);
    } catch (err) {
      setSimulationResult({ success: false, message: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Run Telemetry Simulation</h3>
              <p className="text-xs text-slate-500">Live hackathon demo scenario generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Select a live scenario to test how Phantom Classrooms responds to sudden occupancy shifts and automated remediation in real-time.
          </p>

          <div className="space-y-2.5">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedScenario === sc.id;

              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900">{sc.title}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed pl-6">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Result banner if executed */}
          {simulationResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                simulationResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {simulationResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">Backend Response: </span>
                <span>{simulationResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            {simulationResult ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleExecute}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Simulation...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Apply Scenario</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
