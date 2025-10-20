function Navbar({ user, currentView, onNavigate, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('dashboard')}>
        🅿️ Parkchain
      </div>

      <div className="navbar-menu">
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-item ${currentView === 'parking' ? 'active' : ''}`}
          onClick={() => onNavigate('parking')}
        >
          Znajdź parking
        </button>
      </div>

      <div className="navbar-user">
        <span className="user-email">{user.email}</span>
        <button onClick={onLogout} className="btn-logout">
          Wyloguj
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
