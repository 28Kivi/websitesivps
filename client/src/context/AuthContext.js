import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { logger } from '../utils/logger';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios default ayarları
axios.defaults.timeout = 30000; // 30 saniye timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor - timeout'u request bazında da ayarla
axios.interceptors.request.use(
  (config) => {
    if (!config.timeout) {
      config.timeout = 30000;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      logger.error('Error fetching user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    try {
      logger.log('Login attempt for:', email);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      logger.log('Login response received');

      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Giriş başarılı!');
        return { success: true };
      }
    } catch (error) {
      logger.error('Login error:', error);
      
      let message = 'Giriş başarısız';
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        message = 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        message = 'Sunucuya bağlanılamıyor. Backend çalışıyor mu kontrol edin.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      return { success: false, message };
    }
  }, [API_URL]);

  const register = useCallback(async (username, email, password) => {
    try {
      logger.log('Register attempt for:', username, email);
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });

      logger.log('Register response received');

      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Kayıt başarılı!');
        return { success: true };
      }
    } catch (error) {
      logger.error('Register error:', error);
      
      let message = 'Kayıt başarısız';
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        message = 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        message = 'Sunucuya bağlanılamıyor. Backend çalışıyor mu kontrol edin.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      return { success: false, message };
    }
  }, [API_URL]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Çıkış yapıldı');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

