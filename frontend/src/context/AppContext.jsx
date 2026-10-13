import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../services/api";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, rooms, alerts, analytics, status
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Modals & inspect state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    setError(null);

    try {
      // Fetch in parallel
      const [healthRes, roomsRes, alertsRes, analyticsRes] = await Promise.all([
        api.getHealth().catch((err) => {
          console.warn("Health check failed:", err);
          return null;
        }),
        api.getRooms(),
        api.getAlerts(),
        api.getAnalyticsOverview(),
      ]);
      console.log("HEALTH RESPONSE:", healthRes);
      console.log("ROOMS RESPONSE:", roomsRes);
      console.log("ALERTS RESPONSE:", alertsRes);
      console.log("ANALYTICS RESPONSE:", analyticsRes);

      if (healthRes) {
        setHealth(healthRes);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }

      // Support direct arrays and { data: [...] } responses.
      // Extract arrays from the actual backend response shapes
      const roomsData = Array.isArray(roomsRes)
        ? roomsRes
        : (roomsRes?.rooms ?? roomsRes?.data);

      const alertsData = Array.isArray(alertsRes)
        ? alertsRes
        : (alertsRes?.alerts ?? alertsRes?.data);

      const analyticsData = analyticsRes?.data ?? analyticsRes;

      // Update state only when the response contains the expected data
      if (Array.isArray(roomsData)) {
        setRooms(roomsData);
      } else {
        console.error("Unexpected rooms API response:", roomsRes);
      }

      if (Array.isArray(alertsData)) {
        setAlerts(alertsData);
      } else {
        console.error("Unexpected alerts API response:", alertsRes);
      }

      if (analyticsData && typeof analyticsData === "object") {
        setAnalytics(analyticsData);
      } else {
        console.error("Unexpected analytics API response:", analyticsRes);
      }

      if (Array.isArray(roomsData)) {
        setRooms(roomsData);
      } else {
        console.error("Unexpected rooms API response:", roomsRes);
      }

      if (Array.isArray(alertsData)) {
        setAlerts(alertsData);
      } else {
        console.error("Unexpected alerts API response:", alertsRes);
      }

      if (analyticsData && typeof analyticsData === "object") {
        setAnalytics(analyticsData);
      } else {
        console.error("Unexpected analytics API response:", analyticsRes);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setIsConnected(false);
      setError(err.message || "Unable to connect to backend service.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Modest polling interval (every 30 seconds for live telemetry updates)
    const interval = setInterval(() => {
      loadAllData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  // Alert status update handler
  const handleUpdateAlertStatus = async (
    alertId,
    newStatus,
    resolutionNote = "",
  ) => {
    try {
      const result = await api.updateAlertStatus(
        alertId,
        newStatus,
        resolutionNote,
      );
      showToast(`Alert ${alertId} updated to ${newStatus}`, "success");
      await loadAllData(true);
      return result;
    } catch (err) {
      showToast(`Failed to update alert: ${err.message}`, "error");
      throw err;
    }
  };

  // Run simulation handler
  const handleRunSimulation = async (scenario) => {
    try {
      const result = await api.runSimulation(scenario);
      showToast(
        result.message || "Simulation applied successfully!",
        "success",
      );
      await loadAllData(true);
      return result;
    } catch (err) {
      showToast(`Simulation failed: ${err.message}`, "error");
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        rooms,
        alerts,
        analytics,
        health,
        isConnected,
        isLoading,
        isRefreshing,
        error,
        lastUpdated,
        loadAllData,
        selectedRoom,
        setSelectedRoom,
        simulationModalOpen,
        setSimulationModalOpen,
        handleUpdateAlertStatus,
        handleRunSimulation,
        toastMessage,
        setToastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
