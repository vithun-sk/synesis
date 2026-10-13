import React from 'react';
import {
  AlertTriangle,
  Zap,
  IndianRupee,
  Clock,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Building2,
  ExternalLink
} from 'lucide-react';
import { AlertSeverityBadge, AlertStatusBadge } from '../common/StatusBadge';
import { formatKwh, formatINR, formatRelativeTime } from '../../utils/formatters';

export default function AlertCard({ alert, onResolve, onInspectRoom }) {
  const isCritical = alert.severity === 'CRITICAL';
  const isOpen = alert.status === 'OPEN';

  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
        isCritical
          ? 'border-l-4 border-l-red-500 border-slate-200 hover:border-red-300'
          : 'border-l-4 border-l-amber-500 border-slate-200 hover:border-amber-300'
      }`}
    >
      <div>
        {/* Header: Badges & Room */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <AlertSeverityBadge severity={alert.severity} />
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              {alert.room_code}
            </span>
            <span className="text-xs text-slate-500">
              {alert.building} • {alert.floor}
            </span>
          </div>
          <AlertStatusBadge status={alert.status} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {alert.title}
        </h3>

        {/* Explanation & Telemetry reason */}
        <div className="my-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              {alert.explanation}
            </p>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="mb-4 flex items-start gap-2 bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100/80">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900">
            <span className="font-bold">Recommended Action: </span>
            <span>{alert.recommended_action}</span>
          </div>
        </div>

        {/* Wasted kWh & Cost metrics */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Est. Wasted Energy
            </span>
            <span className="font-mono text-sm font-extrabold text-red-600 flex items-center gap-1 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
              {formatKwh(alert.estimated_wasted_kwh)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Est. Wasted Cost (₹8/kWh)
            </span>
            <span className="font-mono text-sm font-extrabold text-red-600 flex items-center gap-1 mt-0.5">
              <IndianRupee className="w-3.5 h-3.5" />
              {formatINR(alert.estimated_wasted_cost_inr)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Timestamp & Action Buttons */}
      <div className="pt-3 flex flex-wrap items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Reported {formatRelativeTime(alert.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          {onInspectRoom && (
            <button
              onClick={() => onInspectRoom(alert.room_code)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Inspect Room
            </button>
          )}

          {isOpen ? (
            <button
              onClick={() => onResolve(alert)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve Alert
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
