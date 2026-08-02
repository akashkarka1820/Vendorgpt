import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('vendorgpt_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Failed to restore session", err);
          localStorage.removeItem('vendorgpt_token');
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (emailOrPhone, password) => {
    const res = await api.post('/auth/login', { email_or_phone: emailOrPhone, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('vendorgpt_token', access_token);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('vendorgpt_token', access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('vendorgpt_token');
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    const res = await api.put('/auth/me', updatedData);
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
