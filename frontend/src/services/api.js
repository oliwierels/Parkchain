import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// WAŻNE: Interceptor - dodaj token do każdego żądania
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Reszta kodu...

// Funkcje API dla parkingów
// Wklej to do /src/services/api.js

// Funkcje API dla rezerwacji
export const reservationAPI = {
  // Funkcja do obliczania ceny na backendzie
  calculatePrice: async (priceData) => {
    try {
      // priceData powinno zawierać np. { lotId, startTime, endTime }
      const response = await api.post('/reservations/calculate', priceData);
      // Zakładam, że backend zwraca { calculatedPrice: 15.50 }
      return response.data;
    } catch (error) {
      console.error('Błąd przy obliczaniu ceny:', error);
      throw error;
    }
  },

  // Funkcja do tworzenia rezerwacji
  createReservation: async (reservationData) => {
    try {
      const response = await api.post('/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Błąd przy tworzeniu rezerwacji:', error);
      throw error;
    }
  },

  // Funkcja do pobierania rezerwacji użytkownika
  getMyReservations: async () => {
     try {
       const response = await api.get('/reservations/my');
       // Upewnij się, że backend zwraca listę rezerwacji
       return response.data.reservations; 
     } catch (error) {
       console.error('Błąd przy pobieraniu moich rezerwacji:', error);
       throw error;
     }
  }
};

// Reszta kodu (np. userAPI) leci poniżej...
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
      console.log('🔍 API Response:', response.data);
      console.log('🔍 Parking lots array:', response.data.lots);

      if (!response.data.lots) {
        console.error('❌ Backend nie zwrócił właściwości "lots":', response.data);
        return [];
      }

      return response.data.lots;
    } catch (error) {
      console.error('❌ Błąd przy pobieraniu parkingów:', error);
      console.error('❌ Error details:', error.response?.data);
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
// Funkcje API dla statystyk użytkownika
export const userAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/users/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Błąd przy pobieraniu statystyk:', error);
      throw error;
    }
  }
};
export default api;