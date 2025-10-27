// frontend/src/components/ChargingSessionQRModal.jsx

import { FaTimes, FaChargingStation, FaBolt, FaPlug, FaClock, FaCalendar } from 'react-icons/fa';
import QRCodeGenerator from './QRCodeGenerator';

/**
 * Modal displaying QR code for a charging session
 */
function ChargingSessionQRModal({ session, onClose }) {
  if (!session) return null;

  // Generate QR code data
  const qrData = JSON.stringify({
    type: 'charging_session',
    id: session.id,
    userId: session.user_id,
    stationId: session.station_id,
    startTime: session.start_time,
    status: session.status,
    timestamp: new Date().toISOString()
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', color: 'bg-green-500', icon: '⚡' },
      completed: { text: 'Completed', color: 'bg-blue-500', icon: '✓' },
      pending_verification: { text: 'Pending', color: 'bg-yellow-500', icon: '⏳' },
      cancelled: { text: 'Cancelled', color: 'bg-red-500', icon: '✗' }
    };
    return badges[status] || badges.active;
  };

  const statusBadge = getStatusBadge(session.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaChargingStation />
              Charging Session QR
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>
          <p className="text-yellow-100 text-sm">
            Scan to start/stop charging session
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
              downloadFilename={`charging-session-${session.id}.svg`}
            />
          </div>

          {/* Session Details */}
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-gray-800">Session Details</h3>
              <span className={`px-3 py-1 rounded-full text-xs text-white ${statusBadge.color} flex items-center gap-1`}>
                <span>{statusBadge.icon}</span>
                {statusBadge.text}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaChargingStation className="text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Charging Station</p>
                  <p className="font-medium text-gray-800">
                    {session.station_name || `Station #${session.station_id}`}
                  </p>
                </div>
              </div>

              {session.connector_type && (
                <div className="flex items-start gap-3">
                  <FaPlug className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Connector Type</p>
                    <p className="font-medium text-gray-800 uppercase">{session.connector_type}</p>
                  </div>
                </div>
              )}

              {session.power_output_kw && (
                <div className="flex items-start gap-3">
                  <FaBolt className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Power Output</p>
                    <p className="font-medium text-gray-800">{session.power_output_kw} kW</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <FaCalendar className="text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-medium text-gray-800">{formatDate(session.start_time)}</p>
                </div>
              </div>

              {session.end_time && (
                <div className="flex items-start gap-3">
                  <FaCalendar className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">End Time</p>
                    <p className="font-medium text-gray-800">{formatDate(session.end_time)}</p>
                  </div>
                </div>
              )}

              {session.energy_delivered_kwh && (
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 mt-1 flex-shrink-0">⚡</div>
                  <div>
                    <p className="text-sm text-gray-600">Energy Delivered</p>
                    <p className="font-medium text-gray-800">{session.energy_delivered_kwh} kWh</p>
                  </div>
                </div>
              )}

              {session.charging_duration_minutes && (
                <div className="flex items-start gap-3">
                  <FaClock className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-800">{session.charging_duration_minutes} minutes</p>
                  </div>
                </div>
              )}

              {session.points_earned && (
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 mt-1 flex-shrink-0">🏆</div>
                  <div>
                    <p className="text-sm text-gray-600">DCP Points Earned</p>
                    <p className="font-medium text-gray-800">{session.points_earned} DCP</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="text-yellow-600 mt-1 flex-shrink-0">#</div>
                <div>
                  <p className="text-sm text-gray-600">Session ID</p>
                  <p className="font-mono text-xs text-gray-800">{session.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions based on status */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              {session.status === 'active' ? 'Active Session' : 'How to use:'}
            </h4>
            {session.status === 'active' ? (
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Your charging session is currently active</li>
                <li>Show this QR to stop the session</li>
                <li>You'll earn 1 DCP point per kWh charged</li>
                <li>Points will be awarded after verification</li>
              </ul>
            ) : (
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Go to the charging station</li>
                <li>Scan this QR code at the station</li>
                <li>Connect your EV and start charging</li>
                <li>Scan again when done to stop the session</li>
              </ol>
            )}
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

export default ChargingSessionQRModal;
