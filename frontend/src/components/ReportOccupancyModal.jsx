import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inspectionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ReportOccupancyModal({ parking, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [occupancy, setOccupancy] = useState(parking.total_spots - parking.available_spots);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError(t('messages.mustBeLoggedInToReport'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await inspectionAPI.createInspection({
        lot_id: parking.id,
        reported_occupancy: parseInt(occupancy)
      });

      alert(t('messages.reportSentSuccess'));
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error(t('console.reportingError'), err);
      setError(err.response?.data?.error || t('messages.reportSendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
            {t('crowdscan.reportOccupancy')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937' }}>
            {parking.name}
          </h3>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
            {parking.address}
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            {t('crowdscan.systemAvailability')}: <strong>{parking.available_spots}/{parking.total_spots}</strong> {t('parking.availableSpots').toLowerCase()}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              {t('crowdscan.howManyOccupied')} *
            </label>
            <input
              type="number"
              min="0"
              max={parking.total_spots}
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              {t('crowdscan.availableSpots')}: {parking.total_spots - occupancy}
            </p>
          </div>

          <div style={{
            backgroundColor: '#eff6ff',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#1e40af'
          }}>
            <strong>CrowdScan:</strong> {t('crowdscan.helpOthers')}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: loading ? '#9ca3af' : '#6366F1',
                color: 'white',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? t('common.loading') : t('crowdscan.sendReport')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportOccupancyModal;
