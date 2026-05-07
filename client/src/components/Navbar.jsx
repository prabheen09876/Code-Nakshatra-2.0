import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, ChevronDown, UserCircle, MessageCircle, Users } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setDropdownOpen(false);
        logout();
        navigate('/login');
    };

    const shortId = user?.id ? String(user.id).slice(-6) : '';

    // Don't show on landing page (it has its own navbar)
    if (location.pathname === '/') return null;

    return (
        <nav className="ind-navbar">
            <Link to="/" className="ind-navbar-brand">
                <div className="ind-navbar-brand-dot" />
                <Shield size={16} strokeWidth={2.5} />
                ACCREDIFY
            </Link>

            <div className="ind-navbar-spacer" />

            {isAuthenticated ? (
                <>
                    {user?.role === 'client' && (
                        <Link to="/freelancers" className="ind-nav-link">
                            <Users size={16} /> Freelancers
                        </Link>
                    )}
                    <Link to="/messages" className="ind-nav-link">
                        <MessageCircle size={16} /> Messages
                    </Link>
                    <Link to="/dashboard" className="ind-nav-link">
                        Dashboard
                    </Link>

                    <div className="ind-nav-user-wrap" ref={dropdownRef}>
                        <button
                            type="button"
                            className="ind-nav-user-btn"
                            onClick={() => setDropdownOpen(o => !o)}
                        >
                            <div className="ind-nav-avatar">
                                <User size={14} color="#888" />
                            </div>
                            {user.name}
                            <ChevronDown
                                size={14}
                                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                            />
                        </button>

                        {dropdownOpen && (
                            <div className="ind-nav-dropdown">
                                <div className="ind-nav-dropdown-id">ID: {shortId} · {user.role}</div>
                                <Link
                                    to="/profile"
                                    className="ind-nav-dropdown-item"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <UserCircle size={16} /> Profile
                                </Link>
                                <button
                                    type="button"
                                    className="ind-nav-dropdown-item ind-nav-dropdown-logout"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} /> Log out
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to="/login" className="ind-btn ind-btn-outline" style={{ border: '1px solid #444', color: '#E2E2E2' }}>Login</Link>
                    <Link to="/register" className="ind-btn ind-btn-orange">Sign up</Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
