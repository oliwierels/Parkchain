// frontend/src/components/ReservationQRModal.jsx

import { FaTimes, FaParking, FaMapMarkerAlt, FaClock, FaCalendar } from 'react-icons/fa';
import QRCodeGenerator from './QRCodeGenerator';

/**
 * Modal displaying QR code for a parking reservation
 */
function ReservationQRModal({ reservation, onClose }) {
  if (!reservation) return null;

  // Generate QR code data
  const qrData = JSON.stringify({
    type: 'parking_reservation',
    id: reservation.id,
    userId: reservation.user_id,
    parkingLotId: reservation.parking_lot_id,
    startTime: reservation.start_time,
    endTime: reservation.end_time,
    status: reservation.status,
    timestamp: new Date().toISOString()
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = () => {
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    const hours = Math.round((end - start) / (1000 * 60 * 60));
    return hours;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaParking />
              Reservation QR Code
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>
          <p className="text-indigo-100 text-sm">
            Show this QR code at parking entrance
          </p>
        </div>

        <div className="p-6">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <QRCodeGenerator
              value={qrData}
              size={250}
              level="H"
              title=""
              downloadable={true}
              downloadFilename={`reservation-${reservation.id}.svg`}
            />
          </div>

          {/* Reservation Details */}
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Reservation Details</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaParking className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Parking Lot</p>
                  <p className="font-medium text-gray-800">
                    {reservation.parking_lot_name || `Lot #${reservation.parking_lot_id}`}
                  </p>
                </div>
              </div>

              {reservation.address && (
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-800">{reservation.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <FaCalendar className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-medium text-gray-800">{formatDate(reservation.start_time)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaCalendar className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">End Time</p>
                  <p className="font-medium text-gray-800">{formatDate(reservation.end_time)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaClock className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium text-gray-800">{calculateDuration()} hours</p>
                </div>
              </div>

              {reservation.price && (
                <div className="flex items-start gap-3">
                  <div className="text-indigo-600 mt-1 flex-shrink-0">💰</div>
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="font-medium text-gray-800">{reservation.price} PLN</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  {reservation.status === 'confirmed' && <span className="text-green-600">✓</span>}
                  {reservation.status === 'pending' && <span className="text-yellow-600">⏳</span>}
                  {reservation.status === 'cancelled' && <span className="text-red-600">✗</span>}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-800 capitalize">{reservation.status}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-indigo-600 mt-1 flex-shrink-0">#</div>
                <div>
                  <p className="text-sm text-gray-600">Reservation ID</p>
                  <p className="font-mono text-xs text-gray-800">{reservation.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Show this QR code at the parking entrance</li>
              <li>The inspector will scan it to verify your reservation</li>
              <li>You can also download the QR code for offline use</li>
              <li>Keep this reservation active until you leave</li>
            </ol>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationQRModal;
