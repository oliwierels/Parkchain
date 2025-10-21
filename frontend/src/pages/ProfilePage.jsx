import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();

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
    </div>
  );
}

export default ProfilePage;