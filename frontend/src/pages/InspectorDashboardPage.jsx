import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { inspectionAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Badge,
  SkeletonCard,
  EmptyState,
  useToast,
  ToastContainer,
  ConfirmModal
} from '../components/ui';
import {
  FaClipboardCheck,
  FaParking,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaClock
} from 'react-icons/fa';

function InspectorDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, inspection: null, status: null });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'inspector') {
      addToast({ message: 'Brak uprawnień. Wymagana rola inspektora.', type: 'error' });
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
    } catch (err) {
      console.error('Błąd pobierania zgłoszeń:', err);
      addToast({ message: 'Nie udało się pobrać zgłoszeń', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (inspection, status) => {
    setConfirmModal({ isOpen: true, inspection, status });
  };

  const handleVerifyConfirm = async () => {
    const { inspection, status } = confirmModal;
    setConfirmModal({ isOpen: false, inspection: null, status: null });

    try {
      setProcessingId(inspection.id);
      await inspectionAPI.verifyInspection(inspection.id, status);
      addToast({
        message: status === 'confirmed' ? 'Zgłoszenie zatwierdzone!' : 'Zgłoszenie odrzucone',
        type: 'success'
      });
      fetchInspections();
    } catch (err) {
      console.error('Błąd weryfikacji:', err);
      addToast({ message: 'Nie udało się zweryfikować zgłoszenia', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="max-w-4xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FaClipboardCheck className="text-parkchain-500" />
            Panel Inspektora CrowdScan
          </h1>
          <p className="text-gray-400 text-sm">
            Weryfikuj zgłoszenia zajętości parkingów od użytkowników
          </p>
        </motion.div>

        {inspections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <EmptyState
              icon={<FaCheckCircle className="text-6xl text-green-500" />}
              title="Brak zgłoszeń do weryfikacji"
              description="Wszystkie zgłoszenia zostały sprawdzone. Świetna robota!"
            />
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {inspections.map((inspection, index) => (
              <motion.div
                key={inspection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card variant="glass" hoverable>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaParking className="text-parkchain-500" />
                        <h3 className="text-xl font-bold text-white">
                          {inspection.parking_name || `Parking #${inspection.lot_id}`}
                        </h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-400">
                          <strong>Parking ID:</strong> {inspection.lot_id}
                        </p>
                        <p className="text-gray-400">
                          <strong>Zgłoszona zajętość:</strong>{' '}
                          <span className="font-bold text-parkchain-500">
                            {inspection.reported_occupancy} miejsc zajętych
                          </span>
                        </p>
                        <p className="text-gray-400 flex items-center gap-2">
                          <FaUser className="text-gray-500" />
                          <strong>Zgłoszone przez:</strong> Użytkownik #{inspection.reporter_id}
                        </p>
                        <p className="text-gray-400 flex items-center gap-2">
                          <FaClock className="text-gray-500" />
                          <strong>Data zgłoszenia:</strong>{' '}
                          {new Date(inspection.created_at).toLocaleString('pl-PL')}
                        </p>
                      </div>
                    </div>

                    <Badge variant="warning" size="md">
                      Oczekuje
                    </Badge>
                  </div>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <Card variant="glass" className="bg-blue-900/20 border-blue-700 mb-4">
                      <p className="text-sm text-blue-200">
                        <strong>Instrukcja:</strong> Zweryfikuj fizycznie zajętość parkingu i zatwierdź lub odrzuć zgłoszenie.
                      </p>
                    </Card>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVerifyClick(inspection, 'confirmed')}
                        disabled={processingId === inspection.id}
                        loading={processingId === inspection.id}
                        variant="secondary"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        leftIcon={<FaCheckCircle />}
                      >
                        Zatwierdź
                      </Button>
                      <Button
                        onClick={() => handleVerifyClick(inspection, 'rejected')}
                        disabled={processingId === inspection.id}
                        loading={processingId === inspection.id}
                        variant="danger"
                        className="flex-1"
                        leftIcon={<FaTimesCircle />}
                      >
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, inspection: null, status: null })}
        onConfirm={handleVerifyConfirm}
        title={confirmModal.status === 'confirmed' ? 'Potwierdź zatwierdzenie' : 'Potwierdź odrzucenie'}
        message={`Czy na pewno chcesz ${confirmModal.status === 'confirmed' ? 'ZATWIERDZIĆ' : 'ODRZUCIĆ'} to zgłoszenie?`}
        confirmText={confirmModal.status === 'confirmed' ? 'Zatwierdź' : 'Odrzuć'}
        confirmVariant={confirmModal.status === 'confirmed' ? 'primary' : 'danger'}
      />
    </div>
  );
}

export default InspectorDashboardPage;
