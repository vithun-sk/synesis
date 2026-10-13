import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'neutral', // emerald, red, amber, blue, neutral
  badge,
  onClick
}) {
  const variantStyles = {
    neutral: {
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-600',
      valueColor: 'text-slate-800',
    },
    emerald: {
      border: 'border-emerald-200/80 hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50/30',
      iconBg: 'bg-emerald-100 text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    red: {
      border: 'border-red-200/80 hover:border-red-300 bg-gradient-to-br from-white to-red-50/30',
      iconBg: 'bg-red-100 text-red-600',
      valueColor: 'text-red-700',
    },
    amber: {
      border: 'border-amber-200/80 hover:border-amber-300 bg-gradient-to-br from-white to-amber-50/30',
      iconBg: 'bg-amber-100 text-amber-600',
      valueColor: 'text-amber-700',
    },
    blue: {
      border: 'border-blue-200/80 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30',
      iconBg: 'bg-blue-100 text-blue-600',
      valueColor: 'text-blue-700',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 border shadow-sm transition-all duration-200 ${style.border} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${style.valueColor}`}>
              {value}
            </span>
            {badge && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${style.iconBg} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
