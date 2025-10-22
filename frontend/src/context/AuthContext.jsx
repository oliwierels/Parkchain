import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Skonfiguruj axios z tokenem
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Pobierz dane użytkownika
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/auth/me');
    setUser(response.data); // ZMIANA: usuń .user
  } catch (error) {
    console.error('Błąd pobierania użytkownika:', error);
    logout();
  } finally {
    setLoading(false);
  }
};

 const register = async (email, password, full_name, phone) => {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/register', {
      email,
      password,
      full_name
      // Usuń phone - backend go nie przyjmuje
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    
    return { success: true };
  } catch (error) {
    console.error('Register error:', error); // Dodaj console.log
    return { 
      success: false, 
      message: error.response?.data?.error || 'Błąd rejestracji' // ZMIANA: .error zamiast .message
    };
  }
};

const login = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    
    return { success: true };
  } catch (error) {
    console.error('Login error:', error); // Dodaj console.log
    return { 
      success: false, 
      message: error.response?.data?.error || 'Błąd logowania' // ZMIANA: .error
    };
  }
};

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  return context;
};