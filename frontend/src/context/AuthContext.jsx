import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchCurrentUser, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('packflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('packflow_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token)
        .then((userData) => {
          if (userData.status === 'REJECTED') {
            setToken(null);
            setUser(null);
            localStorage.removeItem('packflow_token');
            localStorage.removeItem('packflow_user');
          } else {
            setUser(userData);
            localStorage.setItem('packflow_user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('packflow_token');
          localStorage.removeItem('packflow_user');
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('packflow_token', data.token);
    localStorage.setItem('packflow_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (fullName, email, mobileNumber, password, confirmPassword) => {
    return await registerUser(fullName, email, mobileNumber, password, confirmPassword);
  };

  const logout = async () => {
    if (token) {
      await logoutUser(token);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('packflow_token');
    localStorage.removeItem('packflow_user');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const newObj = { ...prev, ...updatedData };
      localStorage.setItem('packflow_user', JSON.stringify(newObj));
      return newObj;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
