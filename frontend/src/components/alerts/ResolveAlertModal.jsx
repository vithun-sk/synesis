import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { formatKwh, formatINR } from '../../utils/formatters';

export default function ResolveAlertModal({ alert, onClose, onConfirm }) {
  const [resolutionNote, setResolutionNote] = useState('Equipment powered down manually via smart relay command');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!alert) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(alert.id, 'RESOLVED', resolutionNote);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update alert on backend.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Resolve Energy Waste Alert</h3>
              <p className="text-xs text-slate-500">Confirm remediation action for {alert.room_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <div className="font-bold text-slate-800 text-sm mb-1">{alert.title}</div>
            <p className="text-slate-600 leading-relaxed mb-2">{alert.explanation}</p>
            <div className="flex items-center gap-4 text-slate-500 font-mono">
              <span>Wasted: <strong>{formatKwh(alert.estimated_wasted_kwh)}</strong></span>
              <span>Cost: <strong>{formatINR(alert.estimated_wasted_cost_inr)}</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Resolution Note / Action Taken
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="E.g., Switched off AC and projector via floor control or manual inspection..."
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Backend...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Mark Resolved</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
