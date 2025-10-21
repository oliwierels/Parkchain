// frontend/src/components/Navbar.jsx

import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      backgroundColor: 'white',
      color: 'white',
      height: '70px', // Stała wysokość zostaje
      paddingLeft: '1rem', 
      paddingRight: '1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto', // To znów będzie działać poprawnie
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%' // <-- TO JEST KLUCZOWA ZMIANA
      }}>
      <img 
            src="/Parkchain-logo.png" 
            alt="Parkchain Logo"
            style={{ height: '200px', marginRight: '10px' }} // <-- TUTAJ JEST PROBLEM
          />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'black', textDecoration: 'none' }}>
            Strona Główna
          </Link>
          <Link to="/map" style={{ color: 'black', textDecoration: 'none' }}>
            Mapa
          </Link>
          <Link to="/add-parking" style={{ color: 'black', textDecoration: 'none' }}>
            Dodaj parking
          </Link>
          <button style={{
            backgroundColor: '#6366F1',
            color: 'black',
            padding: '8px 20px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Zaloguj się
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;