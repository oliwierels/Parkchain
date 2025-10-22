import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { inspectionAPI } from '../services/api';

function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [reputation, setReputation] = useState(null);
  const [loadingReputation, setLoadingReputation] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReputation();
    }
  }, [isAuthenticated]);

  const fetchReputation = async () => {
    try {
      setLoadingReputation(true);
      const data = await inspectionAPI.getMyReputation();
      setReputation(data);
    } catch (err) {
      console.error('Błąd pobierania reputacji:', err);
    } finally {
      setLoadingReputation(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Ładowanie...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '30px',
          color: '#1f2937'
        }}>
          Mój Profil
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#6b7280',
            marginBottom: '5px'
          }}>
            Imię i nazwisko
          </label>
          <p style={{ fontSize: '18px', color: '#1f2937' }}>
            {user.full_name}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#6b7280',
            marginBottom: '5px'
          }}>
            Email
          </label>
          <p style={{ fontSize: '18px', color: '#1f2937' }}>
            {user.email}
          </p>
        </div>

        {user.phone && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#6b7280',
              marginBottom: '5px'
            }}>
              Telefon
            </label>
            <p style={{ fontSize: '18px', color: '#1f2937' }}>
              {user.phone}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#6b7280',
            marginBottom: '5px'
          }}>
            Rola
          </label>
          <p style={{ fontSize: '18px', color: '#1f2937' }}>
            {user.role === 'driver' ? '🚗 Kierowca' : user.role}
          </p>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            ℹ️ Zarządzanie rezerwacjami i historia będą dostępne wkrótce!
          </p>
        </div>
      </div>

      {/* Sekcja CrowdScan Reputacji */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📊 CrowdScan - Twoja Reputacja
        </h2>

        {loadingReputation ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            Ładowanie statystyk...
          </div>
        ) : reputation ? (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb' }}>
                  {reputation.score || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                  Punkty Reputacji
                </div>
              </div>

              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#16a34a' }}>
                  {reputation.reports_confirmed || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                  Zatwierdzone
                </div>
              </div>

              <div style={{
                backgroundColor: '#fef2f2',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }}>
                  {reputation.reports_rejected || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                  Odrzucone
                </div>
              </div>

              <div style={{
                backgroundColor: '#fef9c3',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ca8a04' }}>
                  {reputation.reports_total || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                  Razem zgłoszeń
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <strong style={{ color: '#1f2937' }}>Jak to działa?</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Zgłaszaj zajętość parkingów na mapie (przycisk CrowdScan)</li>
                <li>Inspektorzy weryfikują Twoje zgłoszenia</li>
                <li>Za potwierdzone zgłoszenia otrzymujesz punkty i nagrody (5 PLN)</li>
                <li>Buduj swoją reputację i pomagaj społeczności!</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#6b7280'
          }}>
            Brak danych o reputacji. Zacznij zgłaszać zajętość parkingów na mapie!
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;