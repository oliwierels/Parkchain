import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inspectionAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function InspectorDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'inspector') {
      alert('Brak uprawnień. Wymagana rola inspektora.');
      navigate('/');
      return;
    }

    fetchInspections();
  }, [isAuthenticated, user, navigate]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await inspectionAPI.getQueuedInspections();
      setInspections(data);
      setError(null);
    } catch (err) {
      console.error('Błąd pobierania zgłoszeń:', err);
      setError('Nie udało się pobrać zgłoszeń');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (inspectionId, status) => {
    if (!window.confirm(`Czy na pewno chcesz ${status === 'confirmed' ? 'ZATWIERDZIĆ' : 'ODRZUCIĆ'} to zgłoszenie?`)) {
      return;
    }

    try {
      setProcessingId(inspectionId);
      await inspectionAPI.verifyInspection(inspectionId, status);
      alert(status === 'confirmed' ? 'Zgłoszenie zatwierdzone!' : 'Zgłoszenie odrzucone');
      // Odśwież listę
      fetchInspections();
    } catch (err) {
      console.error('Błąd weryfikacji:', err);
      alert('Nie udało się zweryfikować zgłoszenia');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-indigo-600">Ładowanie zgłoszeń...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel Inspektora CrowdScan
        </h1>
        <p className="text-gray-600">
          Weryfikuj zgłoszenia zajętości parkingów od użytkowników
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {inspections.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Brak zgłoszeń do weryfikacji
          </h2>
          <p className="text-gray-600">
            Wszystkie zgłoszenia zostały sprawdzone. Świetna robota!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {inspection.parking_name || `Parking #${inspection.lot_id}`}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Parking ID:</strong> {inspection.lot_id}
                    </p>
                    <p>
                      <strong>Zgłoszona zajętość:</strong>{' '}
                      <span className="font-bold text-indigo-600">
                        {inspection.reported_occupancy} miejsc zajętych
                      </span>
                    </p>
                    <p>
                      <strong>Zgłoszone przez:</strong> Użytkownik #{inspection.reporter_id}
                    </p>
                    <p>
                      <strong>Data zgłoszenia:</strong>{' '}
                      {new Date(inspection.created_at).toLocaleString('pl-PL')}
                    </p>
                  </div>
                </div>

                <div className="ml-4">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    Oczekuje
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                  <strong>Instrukcja:</strong> Zweryfikuj fizycznie zajętość parkingu i zatwierdź lub odrzuć zgłoszenie.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(inspection.id, 'confirmed')}
                    disabled={processingId === inspection.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    {processingId === inspection.id ? 'Przetwarzanie...' : '✓ Zatwierdź'}
                  </button>
                  <button
                    onClick={() => handleVerify(inspection.id, 'rejected')}
                    disabled={processingId === inspection.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    {processingId === inspection.id ? 'Przetwarzanie...' : '✗ Odrzuć'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InspectorDashboardPage;
