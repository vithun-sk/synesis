import React, { useState } from 'react';
import { IndianRupee, Sparkles, TrendingUp, Calculator, ShieldCheck } from 'lucide-react';
import { formatINR, formatKwh } from '../../utils/formatters';

export default function TariffCalculator({ totalWastedKwh = 15.47, defaultRate = 8 }) {
  const [tariffRate, setTariffRate] = useState(defaultRate);

  // Daily waste in kWh
  const dailyWastedKwh = totalWastedKwh;
  const monthlyWastedKwh = dailyWastedKwh * 25; // 25 academic days/month
  const annualWastedKwh = dailyWastedKwh * 220; // 220 active academic days/year

  const dailySavings = dailyWastedKwh * tariffRate;
  const monthlySavings = monthlyWastedKwh * tariffRate;
  const annualSavings = annualWastedKwh * tariffRate;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Institutional Savings Calculator</h3>
            <p className="text-xs text-slate-500">Projected savings if Phantom Classrooms shuts off ghost loads</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-700">
          ₹{tariffRate}/kWh
        </span>
      </div>

      {/* Slider */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Electricity Tariff Rate:</span>
          <span className="font-bold text-emerald-700">₹{tariffRate} per kWh</span>
        </div>
        <input
          type="range"
          min="4"
          max="16"
          step="0.5"
          value={tariffRate}
          onChange={(e) => setTariffRate(parseFloat(e.target.value))}
          className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>₹4/kWh (Subsidized)</span>
          <span>₹8/kWh (Standard Commercial)</span>
          <span>₹16/kWh (Peak Surcharge)</span>
        </div>
      </div>

      {/* Projections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Daily Potential Savings
          </span>
          <span className="text-base font-extrabold text-slate-900 block font-mono">
            {formatINR(dailySavings)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Based on {formatKwh(dailyWastedKwh)}/day
          </span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
            Monthly Savings (25 Days)
          </span>
          <span className="text-base font-extrabold text-emerald-700 block font-mono">
            {formatINR(monthlySavings)}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">
            {formatKwh(monthlyWastedKwh)} eliminated
          </span>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block mb-1">
            Annual Campus Savings (220 Days)
          </span>
          <span className="text-base font-extrabold text-white block font-mono">
            {formatINR(annualSavings)}
          </span>
          <span className="text-[10px] text-emerald-100 block mt-0.5">
            ROI achieved within 4 months
          </span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Energy formula: Energy (kWh) = Power (W) × Duration (hours) / 1000</span>
      </div>
    </div>
  );
}
