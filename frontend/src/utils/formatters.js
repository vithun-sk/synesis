/**
 * Formatting utilities for energy, currency, and timestamps
 */

export function formatWatts(watts) {
  if (watts === null || watts === undefined || isNaN(watts)) return '0 W';
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${Math.round(watts)} W`;
}

export function formatKwh(kwh) {
  if (kwh === null || kwh === undefined || isNaN(kwh)) return '0.00 kWh';
  return `${Number(kwh).toFixed(2)} kWh`;
}

export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  } catch {
    return dateString;
  }
}

export function formatTime(dateString) {
  if (!dateString) return '--:--';
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function getRoomStatusMeta(status) {
  switch (status) {
    case 'OCCUPIED':
      return {
        label: 'Occupied',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        badgeBg: 'bg-emerald-500 text-white',
      };
    case 'VACANT_NORMAL':
      return {
        label: 'Vacant — Normal',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        badgeBg: 'bg-slate-600 text-white',
      };
    case 'POTENTIAL_WASTE':
      return {
        label: 'Potential Waste',
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500 animate-pulse',
        badgeBg: 'bg-red-500 text-white',
      };
    case 'STALE_DATA':
      return {
        label: 'Stale Data',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        badgeBg: 'bg-amber-500 text-white',
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-gray-100 text-gray-700 border-gray-200',
        dot: 'bg-gray-400',
        badgeBg: 'bg-gray-600 text-white',
      };
  }
}

export function getAlertSeverityMeta(severity) {
  switch (severity) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        badge: 'bg-red-100 text-red-800 border-red-200',
        border: 'border-l-red-500',
        pill: 'bg-red-500 text-white',
      };
    case 'WARNING':
      return {
        label: 'Warning',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        border: 'border-l-amber-500',
        pill: 'bg-amber-500 text-white',
      };
    case 'INFO':
    default:
      return {
        label: 'Info',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        border: 'border-l-blue-500',
        pill: 'bg-blue-500 text-white',
      };
  }
}

export function getAlertStatusMeta(status) {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Active Open',
        badge: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'INVESTIGATING':
      return {
        label: 'Investigating',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'RESOLVED':
      return {
        label: 'Resolved',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'DISMISSED':
      return {
        label: 'Dismissed',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    default:
      return {
        label: status || 'Unknown',
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
      };
  }
}
