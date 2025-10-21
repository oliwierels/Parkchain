// frontend/src/services/api.js

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Funkcje API dla parkingów
export const parkingAPI = {
  getAllParkings: async (filters = {}) => {
    try {
      const { city, lat, lng, radius } = filters;
      const params = new URLSearchParams();
      
      if (city) params.append('city', city);
      if (lat) params.append('lat', lat);
      if (lng) params.append('lng', lng);
      if (radius) params.append('radius', radius);
      
      const response = await api.get(`/lots?${params.toString()}`);
      return response.data.lots;
    } catch (error) {
      console.error('Błąd przy pobieraniu parkingów:', error);
      throw error;
    }
  },

  getParkingById: async (id) => {
    try {
      const response = await api.get(`/lots/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Błąd przy pobieraniu parkingu ${id}:`, error);
      throw error;
    }
  }
};

export default api;