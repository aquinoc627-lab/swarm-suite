import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (username, password) =>
  api.post('/api/auth/login', new URLSearchParams({ username, password }));
export const register = (data) => api.post('/api/auth/register', data);
export const getMe = () => api.get('/api/auth/me');
export const logout = () => {
  localStorage.removeItem('access_token');
  window.location.reload();
};

// Agents
export const getAgents = () => api.get('/api/agents');
export const createAgent = (data) => api.post('/api/agents', data);
export const updateAgent = (id, data) => api.patch(`/api/agents/${id}`, data);

// Missions
export const getMissions = () => api.get('/api/missions');
export const createMission = (data) => api.post('/api/missions', data);
export const getMission = (id) => api.get(`/api/missions/${id}`);

// Banter
export const getBanter = () => api.get('/api/banter');
export const postBanter = (data) => api.post('/api/banter', data);

// Tools
export const getTools = () => api.get('/api/tools');
export const getTool = (id) => api.get(`/api/tools/${id}`);

// Scans
export const getScans = (params) => api.get('/api/scans', { params });
export const launchScan = (data) => api.post('/api/scans', data);
export const getScan = (id) => api.get(`/api/scans/${id}`);
export const deleteScan = (id) => api.delete(`/api/scans/${id}`);
export const getScanFindings = (id) => api.get(`/api/scans/${id}/findings`);

// Findings
export const getFindings = (params) => api.get('/api/findings', { params });
export const getFindingsSummary = () => api.get('/api/findings/summary');
export const getFinding = (id) => api.get(`/api/findings/${id}`);
export const updateFinding = (id, data) => api.patch(`/api/findings/${id}`, data);

export default api;
