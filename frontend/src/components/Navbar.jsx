// frontend/src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  // --- CAŁA TWOJA LOGIKA ZOSTAJE ---
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    // --- STYL PASKA NAWIGACJI OD KOLEGI ---
    <nav style={{
      backgroundColor: 'white',
      color: 'white',
      height: '100px',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      borderBottom: '1px solid #e5e7eb' // Dodałem delikatną granicę
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%'
      }}>

        {/* --- LOGO OD KOLEGI (Z POPRAWIONĄ WYSOKOŚCIĄ) --- */}
        <Link to="/">
          <img
            src="/Parkchain-logo.png"
            alt="Parkchain Logo"
            style={{
              height: '200px', // <-- POPRAWKA (było 200px)
              marginRight: '10px',
              display: 'block' // Dla pewności
            }}
          />
        </Link>

        {/* --- KONTENER NA LINKI OD KOLEGI --- */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

          {/* --- Linki statyczne ze stylami (kolor 'black') od kolegi --- */}
          <Link to="/" style={{ color: 'black', textDecoration: 'none' }}>
            Strona Główna
          </Link>
          <Link to="/map" style={{ color: 'black', textDecoration: 'none' }}>
            Mapa
          </Link>
          <Link to="/add-parking" style={{ color: 'black', textDecoration: 'none' }}>
            Dodaj parking
          </Link>

          {/* --- TWOJA LOGIKA POKAZYWANIA LINKÓW I PRZYCISKÓW --- */}
          {isAuthenticated ? (
            <>
              {/* Linki dla zalogowanego, ze stylami od kolegi */}
              <Link to="/my-reservations" style={{ color: 'black', textDecoration: 'none' }}>
                📋 Moje Rezerwacje
              </Link>
              <Link to="/profile" style={{ color: 'black', textDecoration: 'none' }}>
                👤 {user?.full_name}
              </Link>

              {/* Przycisk Wyloguj z Twoją logiką, ale stylem od kolegi */}
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#6366F1', // Styl kolegi
                  color: 'white',            // Zmieniono na biały dla kontrastu
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Wyloguj
              </button>
            </>
          ) : (
            // Przycisk Zaloguj z Twoją logiką (Link), ale stylem od kolegi
            <Link to="/login">
              <button style={{
                backgroundColor: '#6366F1', // Styl kolegi
                color: 'white',            // Zmieniono na biały dla kontrastu
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Zaloguj się
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;