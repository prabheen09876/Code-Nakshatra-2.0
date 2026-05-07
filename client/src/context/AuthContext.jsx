import React, { createContext, useState, useEffect, useContext } from 'react';
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

    // Load user data if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    // Verify token and fetch user
                    const res = await authAPI.getMe();
                    setUser(res.data);
                } catch (err) {
                    console.error("Token invalid or expired", err);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (email, password) => {
        setError(null);
        try {
            const res = await authAPI.login({ email, password });
            const { token: newToken, user: userData } = res.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const register = async (userData) => {
        setError(null);
        try {
            const res = await authAPI.register(userData);
            const { token: newToken, user: newUser } = res.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(newUser);
            return true;
        } catch (err) {
            // Handle express-validator errors array or general message
            if (err.response?.data?.errors) {
                setError(err.response.data.errors[0].message);
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
