import React, { useState, useMemo } from 'react';
import RoomCard from '../components/rooms/RoomCard';
import RoomFilters from '../components/rooms/RoomFilters';
import RoomDetailModal from '../components/rooms/RoomDetailModal';
import { RoomStatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { formatWatts, formatRelativeTime } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { ExternalLink, BellRing, DoorClosed } from 'lucide-react';

export default function ClassroomMonitoringPage() {
  const {
    rooms,
    isLoading,
    error,
    loadAllData,
    selectedRoom,
    setSelectedRoom,
    setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Extract unique buildings and floors for filter dropdowns
  const buildings = useMemo(() => {
    return Array.from(new Set(rooms.map(r => r.building))).filter(Boolean);
  }, [rooms]);

  const floors = useMemo(() => {
    return Array.from(new Set(rooms.map(r => r.floor))).filter(Boolean);
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = r.room_code?.toLowerCase().includes(query);
        const matchesName = r.name?.toLowerCase().includes(query);
        const matchesBuilding = r.building?.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesBuilding) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

      // Building
      if (buildingFilter !== 'ALL' && r.building !== buildingFilter) return false;

      // Floor
      if (floorFilter !== 'ALL' && r.floor !== floorFilter) return false;

      // Equipment
      if (equipmentFilter === 'AC_ON' && r.ac_status !== 'ON') return false;
      if (equipmentFilter === 'LIGHTS_ON' && r.lights_status !== 'ON') return false;
      if (equipmentFilter === 'PROJECTOR_ON' && r.projector_status !== 'ON') return false;

      return true;
    });
  }, [rooms, searchQuery, statusFilter, buildingFilter, floorFilter, equipmentFilter]);

  if (isLoading) {
    return <LoadingSpinner message="Scanning classroom nodes and vision gateways..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Classroom Monitoring Unavailable"
        message={error}
        onRetry={() => loadAllData(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <RoomFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        buildingFilter={buildingFilter}
        onBuildingChange={setBuildingFilter}
        floorFilter={floorFilter}
        onFloorChange={setFloorFilter}
        equipmentFilter={equipmentFilter}
        onEquipmentChange={setEquipmentFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        buildings={buildings}
        floors={floors}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{filteredRooms.length}</strong> of <strong>{rooms.length}</strong> classrooms
        </span>
        {(searchQuery || statusFilter !== 'ALL' || buildingFilter !== 'ALL' || floorFilter !== 'ALL' || equipmentFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setBuildingFilter('ALL');
              setFloorFilter('ALL');
              setEquipmentFilter('ALL');
            }}
            className="text-emerald-700 hover:underline font-semibold"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          title="No classrooms match your filter criteria"
          message="Try clearing your search query or setting the status to 'All Statuses'."
          icon={DoorClosed}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onInspect={() => setSelectedRoom(room)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4">AC</th>
                  <th className="py-3 px-4">Lights</th>
                  <th className="py-3 px-4">Projector</th>
                  <th className="py-3 px-4 text-right">Power</th>
                  <th className="py-3 px-4 text-center">Alerts</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{room.room_code}</div>
                      <div className="text-[11px] text-slate-500">
                        {room.name} • {room.building}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RoomStatusBadge status={room.status} />
                    </td>
                    <td className="py-3 px-4">
                      {room.estimated_occupancy} / {room.capacity}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-semibold ${room.ac_status === 'ON' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                        {room.ac_status} {room.ac_temp ? `(${room.ac_temp}°)` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-semibold ${room.lights_status === 'ON' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                        {room.lights_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-semibold ${room.projector_status === 'ON' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                        {room.projector_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatWatts(room.power_consumption_w)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {room.open_alerts_count > 0 ? (
                        <button
                          onClick={() => setActiveTab('alerts')}
                          className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold"
                        >
                          {room.open_alerts_count}
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="px-2.5 py-1 text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg font-medium transition-colors border border-slate-200"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
