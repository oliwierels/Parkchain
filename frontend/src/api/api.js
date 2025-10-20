import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Dodaj token do każdego requesta jeśli istnieje
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email) => api.post('/auth/login', { email });
export const register = (email, fullName, role = 'driver') =>
  api.post('/auth/register', { email, fullName, role });

// Parking Lots
export const getParkingLots = (city) => {
  const params = city ? { city } : {};
  return api.get('/lots', { params });
};
export const getParkingLot = (lotId) => api.get(`/lots/${lotId}`);
export const getOccupancy = (lotId) => api.get(`/lots/${lotId}/occupancy`);

// Reservations
export const createReservation = (lotId, startTime, endTime) =>
  api.post('/reservations', { lotId, startTime, endTime });
export const getMyReservations = () => api.get('/reservations/me');

// Rewards
export const getMyRewards = () => api.get('/rewards/me');
export const claimReward = (rewardId) => api.post(`/rewards/${rewardId}/claim`);

// Crowdscan
export const submitScan = (lotId, occupiedSpots, evidence) => {
  const formData = new FormData();
  formData.append('occupiedSpots', occupiedSpots);
  if (evidence && evidence.length > 0) {
    evidence.forEach(file => formData.append('evidence', file));
  }
  return api.post(`/lots/${lotId}/scan`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default api;
