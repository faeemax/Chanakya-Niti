import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      const { username } = JSON.parse(savedUser);
      fetchUser(username);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (username) => {
    try {
      const snapshot = await get(ref(db, `users/${username}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUser(userData);
        localStorage.setItem('current_user', JSON.stringify({ username }));
      } else {
        localStorage.removeItem('current_user');
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const snapshot = await get(ref(db, `users/${username}`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.password === password) {
        setUser(userData);
        localStorage.setItem('current_user', JSON.stringify({ username }));
        localStorage.setItem('has_account', 'true');
        return { success: true };
      }
      return { success: false, message: "Wrong password" };
    }
    return { success: false, message: "User not found" };
  };

  const signup = async (username, password) => {
    if (localStorage.getItem('has_account') === 'true') {
      return { success: false, message: "Device already has an account" };
    }
    
    const snapshot = await get(ref(db, `users/${username}`));
    if (snapshot.exists()) {
      return { success: false, message: "Username already exists" };
    }

    const newUser = {
      username,
      password,
      party: 'None',
      balance: 100000,
      inventory: {},
      businesses: {},
      ministryTitle: null,
      mlaTitle: null,
      positions: [],
      lastSalary: 0,
      lastIllegal: 0,
      brokerTag: null,
      votes: 0
    };

    try {
      await set(ref(db, `users/${username}`), newUser);
      setUser(newUser);
      localStorage.setItem('current_user', JSON.stringify({ username }));
      localStorage.setItem('has_account', 'true');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const refreshUser = () => {
    if (user) fetchUser(user.username);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
