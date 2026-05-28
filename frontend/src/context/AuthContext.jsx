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

  const sendOtp = async (data) => {
    const res = await axios.post('http://localhost:5000/api/auth/send-otp', data);
    return res.data;
  };

  const verifyOtp = async (data) => {
    const res = await axios.post('http://localhost:5000/api/auth/verify-otp', data);
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
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
