import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Card,
  Button,
  Input,
  useToast,
  ToastContainer,
  EmptyState
} from '../components/ui';
import {
  FaMapMarkerAlt,
  FaParking,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaSearch
} from 'react-icons/fa';
import MapPickerModal from '../components/MapPickerModal';

function AddParkingPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price_per_hour: '',
    city: '',
    total_spots: '',
    latitude: '',
    longitude: '',
    price_per_day: '',
    price_per_week: '',
    price_per_month: ''
  });
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMapSelect = (details) => {
    setFormData({
      ...formData,
      address: details.address,
      city: details.city,
      latitude: details.latitude.toString(),
      longitude: details.longitude.toString(),
    });
    setShowMapModal(false);
    addToast({ message: 'Lokalizacja wybrana z mapy', type: 'success' });
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      addToast({ message: 'Wprowadź adres przed geokodowaniem', type: 'warning' });
      return;
    }

    setGeocoding(true);

    try {
      const response = await axios.post('http://localhost:3000/api/geocode', {
        address: formData.address
      });

      const addressParts = formData.address.split(',');
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : '';

      setFormData({
        ...formData,
        city: city,
        latitude: response.data.latitude.toString(),
        longitude: response.data.longitude.toString()
      });

      addToast({ message: 'Znaleziono współrzędne!', type: 'success' });
    } catch (err) {
      addToast({ message: 'Nie udało się znaleźć współrzędnych dla podanego adresu', type: 'error' });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Walidacja
    if (!formData.name || !formData.address || !formData.price_per_hour || !formData.total_spots) {
      addToast({ message: 'Wypełnij wszystkie wymagane pola', type: 'warning' });
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      addToast({ message: 'Użyj przycisku "Znajdź współrzędne" aby dodać lokalizację', type: 'warning' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const payload = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        price_per_hour: parseFloat(formData.price_per_hour),
        total_spots: parseInt(formData.total_spots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      // Add optional pricing if provided
      if (formData.price_per_day) payload.price_per_day = parseFloat(formData.price_per_day);
      if (formData.price_per_week) payload.price_per_week = parseFloat(formData.price_per_week);
      if (formData.price_per_month) payload.price_per_month = parseFloat(formData.price_per_month);

      await axios.post('http://localhost:3000/api/parking-lots', payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      addToast({ message: 'Parking dodany pomyślnie!', type: 'success' });
      setTimeout(() => navigate('/map'), 1500);
    } catch (err) {
      console.error('Błąd dodawania parkingu:', err);
      addToast({
        message: err.response?.data?.error || err.message || 'Błąd podczas dodawania parkingu',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <EmptyState
          icon={<FaParking className="text-6xl text-red-500" />}
          title="Musisz być zalogowany"
          description="Zaloguj się aby dodać parking do systemu"
          action={() => navigate('/login')}
          actionLabel="Przejdź do logowania"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <FaParking className="text-parkchain-500" />
            Dodaj nowy parking
          </h1>
          <p className="text-gray-400 text-sm">
            Wypełnij poniższy formularz, aby dodać swój parking do systemu
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nazwa parkingu */}
              <Input
                label="Nazwa parkingu"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="np. Parking Centrum"
                fullWidth
              />

              {/* Adres z buttonami */}
              <div>
                <label className="block mb-2 font-bold text-gray-300 text-sm">
                  Adres *
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="ul. Marszałkowska 1, Warszawa"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={geocoding}
                    variant="secondary"
                    leftIcon={<FaSearch />}
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    {geocoding ? '...' : 'Znajdź'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    variant="primary"
                    className="px-4"
                  >
                    <FaMapMarkerAlt className="text-lg" />
                  </Button>
                </div>
                <small className="text-gray-400 text-xs mt-2 block flex items-center gap-1">
                  <FaMapMarkedAlt className="text-gray-500" />
                  Wpisz adres i kliknij "Znajdź" lub wybierz lokalizację z mapy
                </small>
              </div>

              {/* Miasto */}
              <Input
                label="Miasto"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Warszawa"
                fullWidth
              />

              {/* Współrzędne */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Szerokość geograficzna"
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="52.2297"
                  readOnly
                  fullWidth
                />
                <Input
                  label="Długość geograficzna"
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="21.0122"
                  readOnly
                  fullWidth
                />
              </div>

              {/* Sekcja cen */}
              <Card variant="gradient" className="bg-blue-900/20 border-blue-700">
                <h3 className="text-lg font-bold mb-4 text-blue-300 flex items-center gap-2">
                  <FaMoneyBillWave />
                  Cennik (elastyczne taryfy)
                </h3>
                <p className="text-xs text-gray-400 mb-5">
                  Ustaw ceny dla różnych okresów wynajmu. System automatycznie wybierze najtańszą opcję dla klienta.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cena za godzinę (zł)"
                    type="number"
                    step="0.01"
                    name="price_per_hour"
                    value={formData.price_per_hour}
                    onChange={handleChange}
                    required
                    placeholder="10.00"
                    helperText="Podstawowa stawka"
                    fullWidth
                  />
                  <Input
                    label="Cena za dzień (zł)"
                    type="number"
                    step="0.01"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handleChange}
                    placeholder="60.00"
                    helperText="Opcjonalne (24h)"
                    fullWidth
                  />
                  <Input
                    label="Cena za tydzień (zł)"
                    type="number"
                    step="0.01"
                    name="price_per_week"
                    value={formData.price_per_week}
                    onChange={handleChange}
                    placeholder="350.00"
                    helperText="Opcjonalne (7 dni)"
                    fullWidth
                  />
                  <Input
                    label="Cena za miesiąc (zł)"
                    type="number"
                    step="0.01"
                    name="price_per_month"
                    value={formData.price_per_month}
                    onChange={handleChange}
                    placeholder="1200.00"
                    helperText="Opcjonalne (30 dni)"
                    fullWidth
                  />
                </div>

                <Card variant="glass" className="bg-blue-900/40 mt-4">
                  <p className="text-xs text-blue-200">
                    <strong>Wskazówka:</strong> Ustaw niższe ceny dla dłuższych okresów, aby zachęcić do długoterminowego wynajmu.
                    Np. dzień = 20h godzinowa, tydzień = 30% taniej, miesiąc = 40% taniej.
                  </p>
                </Card>
              </Card>

              {/* Liczba miejsc */}
              <Input
                label="Liczba miejsc"
                type="number"
                name="total_spots"
                value={formData.total_spots}
                onChange={handleChange}
                required
                placeholder="50"
                fullWidth
              />

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
                size="lg"
                fullWidth
              >
                {loading ? 'Dodawanie...' : 'Dodaj parking'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>

      {/* Map Picker Modal */}
      {showMapModal && (
        <MapPickerModal
          onClose={() => setShowMapModal(false)}
          onSelect={handleMapSelect}
        />
      )}
    </div>
  );
}

export default AddParkingPage;