import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import OverviewPage from './pages/OverviewPage';
import ClassroomMonitoringPage from './pages/ClassroomMonitoringPage';
import WasteAlertsPage from './pages/WasteAlertsPage';
import EnergyAnalyticsPage from './pages/EnergyAnalyticsPage';
import SystemStatusPage from './pages/SystemStatusPage';
import SimulationModal from './components/simulation/SimulationModal';
import Toast from './components/common/Toast';
import { useApp } from './context/AppContext';

function MainContent() {
  const {
    activeTab,
    simulationModalOpen,
    setSimulationModalOpen,
    toastMessage,
    setToastMessage
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Persistent / Responsive Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'rooms' && <ClassroomMonitoringPage />}
          {activeTab === 'alerts' && <WasteAlertsPage />}
          {activeTab === 'analytics' && <EnergyAnalyticsPage />}
          {activeTab === 'status' && <SystemStatusPage />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <SimulationModal
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
      />

      {toastMessage && (
        <Toast
          toast={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return <MainContent />;
}
