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
  },

  // Dodaj nowy parking
  createParking: async (parkingData) => {
    try {
      const response = await api.post('/lots', parkingData);
      return response.data;
    } catch (error) {
      console.error('Błąd przy dodawaniu parkingu:', error);
      throw error;
    }
  }
};

// Funkcje API dla rezerwacji
export const reservationAPI = {
  // Utwórz rezerwację
  createReservation: async (reservationData) => {
    try {
      const response = await api.post('/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Błąd przy tworzeniu rezerwacji:', error);
      throw error;
    }
  },

  // Pobierz moje rezerwacje
  getMyReservations: async () => {
    try {
      const response = await api.get('/reservations/me');
      return response.data;
    } catch (error) {
      console.error('Błąd przy pobieraniu rezerwacji:', error);
      throw error;
    }
  }
};

export default api;