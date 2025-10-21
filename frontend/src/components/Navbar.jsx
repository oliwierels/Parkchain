// frontend/src/components/Navbar.jsx

import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      backgroundColor: '#6366F1',
      padding: '1rem',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
          ParkChain
        </h1>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            Strona Główna
          </Link>
          <Link to="/map" style={{ color: 'white', textDecoration: 'none' }}>
            Mapa
          </Link>
          <Link to="/add-parking" style={{ color: 'white', textDecoration: 'none' }}>
            Dodaj parking
          </Link>
          <button style={{
            backgroundColor: 'white',
            color: '#6366F1',
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