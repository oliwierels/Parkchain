import { useState } from 'react';
import { login, register } from '../api/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isRegister) {
        response = await register(email, fullName);
      } else {
        response = await login(email);
      }

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🅿️ Parkchain</h1>
        <h2>{isRegister ? 'Rejestracja' : 'Logowanie'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Imię i nazwisko</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Kowalski"
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Ładowanie...' : isRegister ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </form>

        <p className="toggle-auth">
          {isRegister ? 'Masz już konto?' : 'Nie masz konta?'}
          <button onClick={() => setIsRegister(!isRegister)} className="link-button">
            {isRegister ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
