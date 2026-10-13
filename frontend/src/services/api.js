/**
 * Phantom Classrooms Centralized API Client
 * Base URL configurable via import.meta.env.VITE_API_BASE_URL (defaults to http://localhost:5000)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.isConnected = false;
    this.lastHealthCheck = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP Error ${response.status}: ${response.statusText}` };
        }
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      this.isConnected = true;
      return await response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        this.isConnected = false;
        const netErr = new Error(`Cannot reach backend server at ${this.baseUrl}. Please ensure backend is running.`);
        netErr.isNetworkError = true;
        throw netErr;
      }
      throw err;
    }
  }

  // 1. Health check
  async getHealth() {
    try {
      const res = await this.request('/api/health');
      this.isConnected = true;
      this.lastHealthCheck = res;
      return res;
    } catch (err) {
      this.isConnected = false;
      throw err;
    }
  }

  // 2. Classrooms
  async getRooms(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.building && filters.building !== 'ALL') params.append('building', filters.building);
    if (filters.floor && filters.floor !== 'ALL') params.append('floor', filters.floor);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/api/rooms${queryString}`);
  }

  async getRoomById(id) {
    return await this.request(`/api/rooms/${id}`);
  }

  // 3. Telemetry readings
  async getLatestReadings() {
    return await this.request('/api/readings/latest');
  }

  async getReadingsHistory() {
    return await this.request('/api/readings');
  }

  // 4. Alerts
  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.room_code && filters.room_code !== 'ALL') params.append('room_code', filters.room_code);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/api/alerts${queryString}`);
  }

  async updateAlertStatus(alertId, status, resolutionNote = '') {
    return await this.request(`/api/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        resolution_note: resolutionNote,
      }),
    });
  }

  // 5. Analytics
  async getAnalyticsOverview() {
    return await this.request('/api/analytics/overview');
  }

  async getAnalyticsRooms() {
    return await this.request('/api/analytics/rooms');
  }

  // 6. Vision & Camera AI Telemetry
  async getVisionHealth() {
    return await this.request('/api/vision/health');
  }

  async detectVisionFrame({ image, room_id, room_code, confidence_threshold }) {
    return await this.request('/api/vision/detect', {
      method: 'POST',
      body: JSON.stringify({
        image,
        room_id,
        room_code,
        confidence_threshold,
      }),
    });
  }

  async recordVisionReading({ room_id, estimated_occupancy, confidence, power_watts, ac_on, lights_on, projector_on }) {
    return await this.request('/api/vision/reading', {
      method: 'POST',
      body: JSON.stringify({
        room_id,
        estimated_occupancy,
        confidence,
        power_watts,
        ac_on,
        lights_on,
        projector_on,
      }),
    });
  }

  async closeVisionSession(room_id) {
    return await this.request('/api/vision/session/close', {
      method: 'POST',
      body: JSON.stringify({ room_id }),
    });
  }

  // 7. Simulation (preserved backend endpoint)
  async runSimulation(scenario = 'telemetry_tick') {
    return await this.request('/api/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  }

  // 8. Reset data
  async resetDemoData() {
    return await this.request('/api/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export { API_BASE_URL };
