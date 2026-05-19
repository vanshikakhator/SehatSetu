import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', { phone, password });
    if (res.data) {
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    }
  };

  const signup = async (userData) => {
    const res = await axios.post('http://localhost:5000/api/auth/signup', userData);
    if (res.data) {
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
