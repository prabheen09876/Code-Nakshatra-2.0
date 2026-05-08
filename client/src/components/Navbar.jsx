import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, LogOut, User, ChevronDown, UserCircle, MessageCircle, Users, Sparkles, Zap } from 'lucide-react';
import { AI_ASSISTANT_BRAND } from '../assistantBrand';

const Navbar = () => {
    const { user, logout, isAuthenticated, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dailyGigToggling, setDailyGigToggling] = useState(false);
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

    const toggleDailyGigMode = async () => {
        if (user?.role !== 'freelancer' || dailyGigToggling) return;
        const turningOn = !user?.dailyGigMode;
        if (turningOn && !(Array.isArray(user?.skills) && user.skills.length)) {
            toast('Add skill tags on your Profile so recruiters can match you to gigs.', {
                duration: 5000,
                icon: '⚠️',
            });
        }
        setDailyGigToggling(true);
        try {
            const res = await usersAPI.patchMe({ dailyGigMode: turningOn });
            if (!res.success) throw new Error(res.message || 'Update failed');
            await refreshUser();
            toast.success(
                turningOn
                    ? 'Daily Gig Mode on — profile shows Available Now. Listening for gigs.'
                    : 'Daily Gig Mode off — instant gig notifications paused.',
            );
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Could not update');
        } finally {
            setDailyGigToggling(false);
        }
    };

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
                    <Link to="/maya" className="ind-nav-link">
                        <Sparkles size={16} /> {AI_ASSISTANT_BRAND}
                    </Link>
                    <Link to="/dashboard" className="ind-nav-link">
                        Dashboard
                    </Link>

                    <div className="ind-nav-user-wrap" ref={dropdownRef}>
                        <button type="button" className="ind-nav-user-btn" onClick={() => setDropdownOpen((o) => !o)}>
                            <div className="ind-nav-avatar">
                                <User size={14} color="#888" />
                            </div>
                            {user.dailyGigMode && user.role === 'freelancer' && (
                                <span
                                    title="Daily Gig Mode: Available Now"
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#22c55e',
                                        flexShrink: 0,
                                        boxShadow: '0 0 8px #22c55e',
                                        marginRight: 2,
                                    }}
                                />
                            )}
                            {user.name}
                            <ChevronDown
                                size={14}
                                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                            />
                        </button>

                        {dropdownOpen && (
                            <div className="ind-nav-dropdown">
                                <div className="ind-nav-dropdown-id">
                                    ID: {shortId} · {user.role}
                                    {user.role === 'freelancer' &&
                                        (user.dailyGigMode ? (
                                            <span style={{ color: '#22c55e', marginLeft: 8 }}>
                                                ● AVAILABLE_NOW
                                            </span>
                                        ) : (
                                            <span style={{ color: '#777', marginLeft: 8 }}>offline</span>
                                        ))}
                                </div>

                                {user.role === 'freelancer' && (
                                    <>
                                        <div className="ind-nav-dropdown-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
                                            <label
                                                htmlFor="daily-gig-toggle"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 10,
                                                    marginBottom: 6,
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <Zap size={15} strokeWidth={2.5} color="#f97316" />
                                                    Daily Gig Mode
                                                </span>
                                                <input
                                                    id="daily-gig-toggle"
                                                    type="checkbox"
                                                    checked={!!user.dailyGigMode}
                                                    disabled={dailyGigToggling}
                                                    onChange={() => toggleDailyGigMode()}
                                                />
                                            </label>
                                            <div style={{ fontSize: '0.62rem', color: '#777', letterSpacing: '0.06em', lineHeight: 1.4 }}>
                                                When enabled, you receive live instant gigs that match skills you list on Profile.
                                                First accept locks the gig and opens recruiter chat.
                                            </div>
                                        </div>
                                        <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '0 0 0 0' }} />
                                    </>
                                )}

                                <Link to="/profile" className="ind-nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <UserCircle size={16} /> Profile
                                </Link>
                                <button type="button" className="ind-nav-dropdown-item ind-nav-dropdown-logout" onClick={handleLogout}>
                                    <LogOut size={16} /> Log out
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to="/login" className="ind-btn ind-btn-outline" style={{ border: '1px solid #444', color: '#E2E2E2' }}>
                        Login
                    </Link>
                    <Link to="/register" className="ind-btn ind-btn-orange">
                        Sign up
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
