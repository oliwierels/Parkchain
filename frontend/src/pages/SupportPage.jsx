import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaPlus, FaCheckCircle, FaClock, FaExclamationCircle } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import axios from 'axios';

const SupportPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/support/tickets`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/support/tickets`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setFormData({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'medium'
      });
      setShowNewTicket(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Nie udało się utworzyć zgłoszenia');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FaClock className="text-blue-500" />;
      case 'resolved':
        return <FaCheckCircle className="text-green-500" />;
      case 'closed':
        return <FaCheckCircle className="text-gray-500" />;
      default:
        return <FaExclamationCircle className="text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      open: 'Otwarte',
      in_progress: 'W trakcie',
      waiting: 'Oczekuje',
      resolved: 'Rozwiązane',
      closed: 'Zamknięte'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FaTicketAlt className="text-4xl text-blue-600" />
                  <h1 className="text-4xl font-bold">Centrum Wsparcia</h1>
                </div>
                <p className="text-gray-600">Zarządzaj swoimi zgłoszeniami i uzyskaj pomoc</p>
              </div>
              <button
                onClick={() => setShowNewTicket(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
              >
                <FaPlus />
                Nowe zgłoszenie
              </button>
            </div>
          </div>

          {showNewTicket && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Nowe zgłoszenie</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Temat *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    maxLength={200}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Krótko opisz problem"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Kategoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="technical">Techniczne</option>
                    <option value="billing">Płatności</option>
                    <option value="parking">Parking</option>
                    <option value="charging">Ładowanie</option>
                    <option value="account">Konto</option>
                    <option value="other">Inne</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Priorytet</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                    <option value="urgent">Pilny</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Opis *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="6"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Opisz szczegółowo swój problem lub pytanie"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Wyślij zgłoszenie
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaTicketAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Brak zgłoszeń</h3>
              <p className="text-gray-600 mb-6">Nie masz jeszcze żadnych zgłoszeń wsparcia</p>
              <button
                onClick={() => setShowNewTicket(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Utwórz pierwsze zgłoszenie
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="font-bold text-lg">{ticket.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Status: <strong>{getStatusText(ticket.status)}</strong></span>
                        <span>Kategoria: <strong>{ticket.category}</strong></span>
                        <span>{new Date(ticket.created_at).toLocaleDateString('pl-PL')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
