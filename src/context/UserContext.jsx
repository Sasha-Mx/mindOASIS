import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loadingAuth, setLoading] = useState(true);

  const applyPreferences = (userData) => {
    if (!userData || !userData.preferences) return;
    
    const { theme, accentColor } = userData.preferences;
    
    // Apply accent color
    const colors = {
      purple: '#7C3AED',
      teal:   '#0F9488',
      amber:  '#BA7517',
      pink:   '#D4537E'
    };
    
    document.documentElement.style.setProperty('--accent', colors[accentColor] || colors.purple);
    
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    /* 
    if (user) {
      applyPreferences(user);
    }
    */
  }, [user]);

  // On app load — check if token exists and is valid
  useEffect(() => {
    const token = localStorage.getItem('mentra_token');
    if (!token) { setLoading(false); return; }

    api.get('/profile/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      // Calculate onboardingDone dynamically based on whether roadmap exists
      const userData = { ...res.data, onboardingDone: !!res.data.roadmap };
      setUser(userData);
      setProfile(res.data.roadmap);
    })
    .catch(() => {
      // Token expired or invalid — clear it
      localStorage.removeItem('mentra_token');
    })
    .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('mentra_token', token);
    setUser({ ...userData, onboardingDone: !!userData.roadmap });
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    login(res.data.token, res.data.user);
  };

  const loginWithCredentials = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    login(res.data.token, res.data.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('mentra_token');
    setUser(null);
    setProfile(null);
  };

  const updateProfileAndRoadmap = (newProfile, newRoadmap, confidenceScore) => {
    setProfile(newRoadmap);
    if (user) {
      setUser({
        ...user,
        profile: newProfile,
        roadmap: newRoadmap,
        confidenceScore: confidenceScore,
        onboardingDone: true
      });
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, profile, setProfile, loadingAuth, login, register, loginWithCredentials, logout, updateProfileAndRoadmap }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
