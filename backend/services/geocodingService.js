// backend/services/geocodingService.js

import axios from 'axios';

// Używamy Nominatim (darmowe OpenStreetMap geocoding)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(address) {
  try {
    console.log(`🌍 Geokodowanie adresu: ${address}`);
    
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        countrycodes: 'pl' // Tylko Polska
      },
      headers: {
        'User-Agent': 'ParkChain/1.0' // Wymagane przez Nominatim
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      
      console.log(`✅ Znaleziono współrzędne: ${latitude}, ${longitude}`);
      
      return {
        latitude,
        longitude
      };
    } else {
      console.log('❌ Nie znaleziono adresu');
      return null;
    }
  } catch (error) {
    console.error('❌ Błąd geokodowania:', error.message);
    return null;
  }
}