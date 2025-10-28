import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaParking, FaBolt, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import axios from 'axios';
import RatingStars from '../components/RatingStars';

const FavoritesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFavorites();
  }, [filter]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const params = filter !== 'all' ? { target_type: filter } : {};
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/favorites`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId) => {
    if (!confirm(t('messages.confirmRemoveFavorite'))) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/favorites/${favoriteId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert(t('messages.favoriteRemoveError'));
    }
  };

  const handleCardClick = (favorite) => {
    if (favorite.target_type === 'parking_lot') {
      navigate('/map', { state: { selectedLotId: favorite.target_id } });
    } else {
      navigate('/charging-map', { state: { selectedChargerId: favorite.target_id } });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredCount = favorites.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaHeart className="text-4xl text-red-500" />
              <h1 className="text-4xl font-bold">{t('favorites.myFavorites')}</h1>
            </div>
            <p className="text-gray-600">
              {t('favorites.subtitle')}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('common.all')} ({favorites.length})
              </button>
              <button
                onClick={() => setFilter('parking_lot')}
                className={`px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                  filter === 'parking_lot'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaParking />
                {t('favorites.parkings')}
              </button>
              <button
                onClick={() => setFilter('ev_charger')}
                className={`px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                  filter === 'ev_charger'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaBolt />
                {t('favorites.chargers')}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('favorites.loading')}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && favorites.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{t('favorites.noFavorites')}</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? t('favorites.noFavoritesDescription')
                  : filter === 'parking_lot'
                  ? t('favorites.noParkings')
                  : t('favorites.noChargers')}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/map')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                >
                  <FaParking />
                  {t('favorites.findParking')}
                </button>
                <button
                  onClick={() => navigate('/charging-map')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                >
                  <FaBolt />
                  {t('favorites.findCharger')}
                </button>
              </div>
            </div>
          )}

          {/* Favorites Grid */}
          {!loading && favorites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => {
                const target = favorite.target;
                const isParkingLot = favorite.target_type === 'parking_lot';

                return (
                  <div
                    key={favorite.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => handleCardClick(favorite)}
                  >
                    <div className={`p-4 ${isParkingLot ? 'bg-blue-500' : 'bg-green-500'}`}>
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          {isParkingLot ? (
                            <FaParking className="text-2xl" />
                          ) : (
                            <FaBolt className="text-2xl" />
                          )}
                          <span className="font-semibold">
                            {isParkingLot ? t('parking.parking') : t('charging.charger')}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(favorite.id);
                          }}
                          className="text-white hover:text-red-200 transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition">
                        {target?.name || target?.address || 'Bez nazwy'}
                      </h3>

                      <div className="flex items-start gap-2 text-gray-600 text-sm mb-3">
                        <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                        <span>{target?.address || 'Brak adresu'}</span>
                      </div>

                      {target?.average_rating > 0 && (
                        <div className="mb-3">
                          <RatingStars rating={target.average_rating} size="sm" />
                          <span className="text-xs text-gray-500 ml-2">
                            ({target.total_reviews || 0} opinii)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm mb-3">
                        {isParkingLot ? (
                          <span className="text-gray-600">
                            {t('parking.price')}: <span className="font-semibold">{target?.price_per_hour || 0} PLN/h</span>
                          </span>
                        ) : (
                          <span className="text-gray-600">
                            {t('charging.power')}: <span className="font-semibold">{target?.power_kw || 0} kW</span>
                          </span>
                        )}
                      </div>

                      {favorite.notes && (
                        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400 mb-3">
                          <p className="text-sm text-gray-700">{favorite.notes}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-3 border-t">
                        {t('favorites.addedOn')}: {formatDate(favorite.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
