import { FaMapMarkerAlt } from 'react-icons/fa';
import MapPickerModal from '../components/MapPickerModal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function AddParkingPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price_per_hour: '',
      city: '', // DODAJ TO
    total_spots: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
// Ta funkcja otrzyma dane z naszego modala
const handleMapSelect = (details) => {
  setFormData({
    ...formData,
    address: details.address, // Ustawiamy adres z pinezki
    city: details.city,         // Ustawiamy miasto z pinezki
    latitude: details.latitude.toString(),
    longitude: details.longitude.toString(),
  });
  setShowMapModal(false); // Zamykamy modal
};
  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      setError('Wprowadź adres przed geokodowaniem');
      return;
    }

    setGeocoding(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/geocode', {
        address: formData.address
      });

     // Spróbujmy wyciągnąć miasto z wpisanego adresu
      const addressParts = formData.address.split(',');
      // Bierzemy ostatni człon adresu, zakładając, że to miasto (np. "ul. Marszałkowska 1, Warszawa")
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : '';

      setFormData({
        ...formData,
        city: city, // <-- DODANA LINIA
        latitude: response.data.latitude.toString(),
        longitude: response.data.longitude.toString()
      });
      
      alert('✅ Znaleziono współrzędne!');
    } catch (err) {
      setError('Nie udało się znaleźć współrzędnych dla podanego adresu');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Walidacja
    if (!formData.name || !formData.address || !formData.price_per_hour || !formData.total_spots) {
      setError('Wypełnij wszystkie wymagane pola');
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Użyj przycisku "Znajdź współrzędne" aby dodać lokalizację');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      console.log('🔄 Wysyłam parking do API:', {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        price_per_hour: parseFloat(formData.price_per_hour),
        total_spots: parseInt(formData.total_spots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });

      const response = await axios.post('http://localhost:3000/api/parking-lots', {
        name: formData.name,
        address: formData.address,
          city: formData.city,  // <-- DODAJ TĘ LINIĘ
        price_per_hour: parseFloat(formData.price_per_hour),
        total_spots: parseInt(formData.total_spots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Parking dodany:', response.data);
      alert('✅ Parking dodany pomyślnie!');
      navigate('/map');
    } catch (err) {
      console.error('❌ Błąd dodawania parkingu:', err);
      console.error('❌ Response:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Message:', err.message);
      setError(err.response?.data?.error || err.message || 'Błąd podczas dodawania parkingu');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center p-5 bg-gray-900">
        <div className="bg-red-800 text-red-100 p-5 rounded-lg text-center">
          Musisz być zalogowany aby dodać parking
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-3">
          Dodaj nowy parking
        </h1>

        <p className="text-gray-400 mb-8 text-sm">
          Wypełnij poniższy formularz, aby dodać swój parking do systemu
        </p>

        {error && (
          <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <div className="mb-5">
            <label className="block mb-2 font-bold text-gray-300 text-sm">
              Nazwa parkingu *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="np. Parking Centrum"
              className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-bold text-gray-300 text-sm">
              Adres *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="ul. Marszałkowska 1, Warszawa"
                className="flex-1 p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={geocoding}
                title="Znajdź współrzędne na podstawie adresu"
                className={`py-3 px-5 rounded-lg font-bold text-white whitespace-nowrap transition-colors ${
                  geocoding
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                }`}
              >
                {geocoding ? '...' : 'Znajdź'}
              </button>

              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                title="Wybierz lokalizację z mapy"
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer text-lg transition-colors"
              >
                <FaMapMarkerAlt />
              </button>
            </div>
            <small className="text-gray-400 text-xs mt-2 block">
              Wpisz adres i kliknij "Znajdź" lub wybierz lokalizację z mapy <FaMapMarkerAlt className="inline mx-0.5"/>
            </small>
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-bold text-gray-300 text-sm">
              Miasto *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="Warszawa"
              className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block mb-2 font-bold text-gray-300 text-sm">
                Szerokość geograficzna
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="52.2297"
                className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-gray-400"
                readOnly
              />
            </div>

            <div>
              <label className="block mb-2 font-bold text-gray-300 text-sm">
                Długość geograficzna
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="21.0122"
                className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-gray-400"
                readOnly
              />
            </div>
          </div>

          {/* Sekcja cen */}
          <div className="bg-blue-900 bg-opacity-30 p-5 rounded-xl mb-5 border-2 border-blue-700">
            <h3 className="text-lg font-bold mb-4 text-blue-300">
              💰 Cennik (elastyczne taryfy)
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Ustaw ceny dla różnych okresów wynajmu. System automatycznie wybierze najtańszą opcję dla klienta.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-bold text-gray-300 text-sm">
                  Cena za godzinę (zł) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  required
                  placeholder="10.00"
                  className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <small className="text-xs text-gray-400 mt-1 block">
                  Podstawowa stawka
                </small>
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-300 text-sm">
                  Cena za dzień (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleChange}
                  placeholder="60.00"
                  className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <small className="text-xs text-gray-400 mt-1 block">
                  Opcjonalne (24h)
                </small>
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-300 text-sm">
                  Cena za tydzień (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_week"
                  value={formData.price_per_week}
                  onChange={handleChange}
                  placeholder="350.00"
                  className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <small className="text-xs text-gray-400 mt-1 block">
                  Opcjonalne (7 dni)
                </small>
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-300 text-sm">
                  Cena za miesiąc (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_month"
                  value={formData.price_per_month}
                  onChange={handleChange}
                  placeholder="1200.00"
                  className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <small className="text-xs text-gray-400 mt-1 block">
                  Opcjonalne (30 dni)
                </small>
              </div>
            </div>

            <div className="bg-blue-900 bg-opacity-40 p-3 rounded-lg mt-4 text-xs text-blue-200">
              <strong>Wskazówka:</strong> Ustaw niższe ceny dla dłuższych okresów, aby zachęcić do długoterminowego wynajmu.
              Np. dzień = 20h godzinowa, tydzień = 30% taniej, miesiąc = 40% taniej.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block mb-2 font-bold text-gray-300 text-sm">
                Liczba miejsc *
              </label>
              <input
                type="number"
                name="total_spots"
                value={formData.total_spots}
                onChange={handleChange}
                required
                placeholder="50"
                className="w-full p-3 border-2 border-gray-600 rounded-lg text-base bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 text-base font-bold text-white border-none rounded-lg mt-3 transition-colors ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            }`}
          >
            {loading ? 'Dodawanie...' : '✅ Dodaj parking'}
          </button>
        </form>
      </div>
      {/* === TUTAJ WKLEJ TEN KOD === */}
      {showMapModal && (
        <MapPickerModal
          onClose={() => setShowMapModal(false)}
          onSelect={handleMapSelect}
        />
      )}
      {/* === KONIEC WKLEJANIA === */}
    </div>
  );
}

export default AddParkingPage;