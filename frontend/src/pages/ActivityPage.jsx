import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHistory, FaParking, FaBolt, FaStar, FaHeart, FaTrophy } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import axios from 'axios';

const ActivityPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
    fetchStats();
  }, []);

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/activity`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100 }
        }
      );

      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/activity/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'reservation_created':
      case 'reservation_cancelled':
        return <FaParking className="text-blue-500" />;
      case 'charging_session_started':
      case 'charging_session_ended':
        return <FaBolt className="text-green-500" />;
      case 'review_posted':
        return <FaStar className="text-yellow-500" />;
      case 'favorite_added':
        return <FaHeart className="text-red-500" />;
      case 'badge_unlocked':
      case 'points_earned':
        return <FaTrophy className="text-purple-500" />;
      default:
        return <FaHistory className="text-gray-500" />;
    }
  };

  const getActivityText = (type) => {
    return t(`activity.types.${type}`) || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaHistory className="text-4xl text-blue-600" />
              <h1 className="text-4xl font-bold">{t('activity.title')}</h1>
            </div>
            <p className="text-gray-600">{t('activity.historyDescription')}</p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('activity.stats.totalActivity')}</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('activity.stats.reservations')}</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {(stats.byType?.reservation_created || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('activity.stats.chargingSessions')}</h3>
                <p className="text-3xl font-bold text-green-600">
                  {(stats.byType?.charging_session_started || 0)}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{t('activity.noActivity')}</h3>
              <p className="text-gray-600">{t('activity.startUsing')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{t('activity.recentActivity')}</h2>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="mt-1">{getActivityIcon(activity.activity_type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{getActivityText(activity.activity_type)}</p>
                        {activity.activity_data && (
                          <p className="text-sm text-gray-600">{JSON.stringify(activity.activity_data)}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString('pl-PL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
