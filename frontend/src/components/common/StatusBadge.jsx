import React from 'react';
import { getRoomStatusMeta, getAlertSeverityMeta, getAlertStatusMeta } from '../../utils/formatters';

export function RoomStatusBadge({ status, size = 'sm' }) {
  const meta = getRoomStatusMeta(status);
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${meta.bg} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function AlertSeverityBadge({ severity, size = 'sm' }) {
  const meta = getAlertSeverityMeta(severity);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded border ${meta.badge} ${sizeClasses}`}>
      {meta.label}
    </span>
  );
}

export function AlertStatusBadge({ status, size = 'sm' }) {
  const meta = getAlertStatusMeta(status);
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${meta.badge} ${sizeClasses}`}>
      {meta.label}
    </span>
  );
}

export function EquipmentIndicator({ label, status, detail }) {
  const isOn = status === 'ON';
  const isUnknown = status === 'UNKNOWN';

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium border ${
        isOn
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : isUnknown
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-slate-50 text-slate-500 border-slate-200'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isOn ? 'bg-emerald-500 animate-pulse' : isUnknown ? 'bg-amber-500' : 'bg-slate-300'
          }`}
        />
        <span>{label}</span>
      </div>
      <span className="font-semibold">{detail || (isOn ? 'ON' : isUnknown ? '?' : 'OFF')}</span>
    </div>
  );
}
