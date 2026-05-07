import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Lock, Briefcase, UserCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'client'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password, role } = formData;
        if (!name || !email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setIsSubmitting(true);
        const success = await register({ name, email, password, role });
        setIsSubmitting(false);
        if (success) {
            toast.success('Account created successfully!');
            navigate('/');
        }
    };

    return (
        <div className="ind-auth-page">
            <div className="ind-noise-overlay" />

            <div className="ind-auth-topbar">
                <Link to="/" className="ind-auth-brand">
                    <Shield size={18} /> ACCREDIFY
                </Link>
                <span className="ind-auth-sys-label">SYS_AUTH // REGISTER_v1.0</span>
            </div>

            <motion.div
                className="ind-auth-panel ind-auth-panel-wide"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="ind-panel-header">
                    <div className="ind-panel-index">00</div>
                    <h1 className="ind-panel-title">REGISTER_OPERATOR</h1>
                    <p className="ind-panel-sub">Initialize a new identity on the trust network.</p>
                </div>

                {error && (
                    <div className="ind-error-block">
                        <span className="ind-error-tag">ERR</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="ind-form">
                    {/* Role selector */}
                    <div className="ind-field">
                        <label className="ind-label">
                            <span className="ind-label-index">01</span> OPERATOR_TYPE
                        </label>
                        <div className="ind-role-grid">
                            <button
                                type="button"
                                className={`ind-role-card ${formData.role === 'client' ? 'ind-role-active-orange' : ''}`}
                                onClick={() => handleRoleSelect('client')}
                            >
                                <Briefcase size={24} />
                                <span className="ind-role-label">CLIENT</span>
                                <span className="ind-role-desc">Hire talent &amp; lock scope</span>
                            </button>
                            <button
                                type="button"
                                className={`ind-role-card ${formData.role === 'freelancer' ? 'ind-role-active-green' : ''}`}
                                onClick={() => handleRoleSelect('freelancer')}
                            >
                                <UserCheck size={24} />
                                <span className="ind-role-label">FREELANCER</span>
                                <span className="ind-role-desc">Deliver &amp; build trust score</span>
                            </button>
                        </div>
                    </div>

                    <div className="ind-field">
                        <label className="ind-label" htmlFor="name">
                            <span className="ind-label-index">02</span> DISPLAY_NAME
                        </label>
                        <div className="ind-input-wrap">
                            <User size={16} className="ind-input-icon" />
                            <input
                                id="name"
                                type="text"
                                className="ind-input"
                                placeholder="Your full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="ind-field">
                        <label className="ind-label" htmlFor="email">
                            <span className="ind-label-index">03</span> EMAIL_ADDRESS
                        </label>
                        <div className="ind-input-wrap">
                            <Mail size={16} className="ind-input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="ind-input"
                                placeholder="operator@domain.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="ind-field">
                        <label className="ind-label" htmlFor="password">
                            <span className="ind-label-index">04</span> ACCESS_KEY
                        </label>
                        <div className="ind-input-wrap">
                            <Lock size={16} className="ind-input-icon" />
                            <input
                                id="password"
                                type="password"
                                className="ind-input"
                                placeholder="Min. 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="ind-btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="ind-spinner" />
                        ) : (
                            <>INITIALIZE OPERATOR <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>

                <div className="ind-panel-footer">
                    ALREADY REGISTERED? <Link to="/login">AUTHENTICATE →</Link>
                </div>
            </motion.div>

            <div className="ind-auth-statusbar">
                <span>BEHAVIORAL TRUST PROTOCOL</span>
                <span className="ind-status-online">● ONLINE</span>
            </div>
        </div>
    );
};

export default RegisterPage;
