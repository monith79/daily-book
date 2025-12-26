import { API_BASE_URL } from '../apiConfig';
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/status`, { withCredentials: true });
        if (response.data.is_authenticated) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to check login status:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
