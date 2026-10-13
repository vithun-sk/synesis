import React from 'react';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';

export default function RoomFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  buildingFilter,
  onBuildingChange,
  floorFilter,
  onFloorChange,
  equipmentFilter,
  onEquipmentChange,
  viewMode,
  onViewModeChange,
  buildings = [],
  floors = []
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3.5">
      {/* Search Input & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by room code (e.g. CR-101), name, or building..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* View Switcher: Grid vs Table */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 self-end sm:self-auto">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Grid</span>
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Filter Selects */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="POTENTIAL_WASTE">Potential Waste</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT_NORMAL">Vacant — Normal</option>
            <option value="STALE_DATA">Stale Telemetry</option>
          </select>
        </div>

        {/* Building Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Building
          </label>
          <select
            value={buildingFilter}
            onChange={(e) => onBuildingChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">All Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Floor
          </label>
          <select
            value={floorFilter}
            onChange={(e) => onFloorChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Equipment Filter
          </label>
          <select
            value={equipmentFilter}
            onChange={(e) => onEquipmentChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">Any Equipment</option>
            <option value="AC_ON">AC is ON</option>
            <option value="LIGHTS_ON">Lights are ON</option>
            <option value="PROJECTOR_ON">Projector is ON</option>
          </select>
        </div>
      </div>
    </div>
  );
}
