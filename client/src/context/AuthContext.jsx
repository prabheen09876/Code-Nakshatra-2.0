import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const t = localStorage.getItem('token');
        if (!t) return null;
        try {
            const res = await authAPI.getMe();
            setUser(res.data);
            return res.data;
        } catch {
            return null;
        }
    }, []);

    // Load user data if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await authAPI.getMe();
                    setUser(res.data);
                } catch (err) {
                    console.error('Token invalid or expired', err);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token, logout]);

    const login = async (email, password) => {
        setError(null);
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const res = await authAPI.login({ email: normalizedEmail, password });
            const { token: newToken, user: userData } = res.data || {};

            if (!newToken || !userData) {
                setError('Invalid login response. Please try again.');
                return false;
            }

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            return true;
        } catch (err) {
            if (!err.response) {
                setError('Cannot reach API server. Start backend on port 8788 and try again.');
            } else {
                setError(err.response?.data?.message || 'Login failed');
            }
            return false;
        }
    };

    const register = async (userData) => {
        setError(null);
        try {
            const payload = {
                ...userData,
                name: userData.name?.trim(),
                email: userData.email?.trim().toLowerCase(),
                role: userData.role?.trim().toLowerCase(),
            };
            const res = await authAPI.register(payload);
            const { token: newToken, user: newUser } = res.data || {};

            if (!newToken || !newUser) {
                setError('Invalid registration response. Please try again.');
                return false;
            }

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(newUser);
            return true;
        } catch (err) {
            if (!err.response) {
                setError('Cannot reach API server. Start backend on port 8788 and try again.');
                return false;
            }
            // Handle express-validator errors array or general message
            if (err.response?.data?.errors) {
                setError(err.response.data.errors[0].message);
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
            return false;
        }
    };

    const value = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
