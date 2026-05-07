import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        setIsSubmitting(true);
        const success = await login(email, password);
        setIsSubmitting(false);
        if (success) {
            toast.success('Successfully logged in!');
            navigate('/dashboard');
        }
    };

    return (
        <div className="ind-auth-page">
            {/* Noise overlay */}
            <div className="ind-noise-overlay" />

            {/* Top bar */}
            <div className="ind-auth-topbar">
                <Link to="/" className="ind-auth-brand">
                    <Shield size={18} /> ACCREDIFY
                </Link>
                <span className="ind-auth-sys-label">SYS_AUTH // LOGIN_v2.0</span>
            </div>

            <motion.div
                className="ind-auth-panel"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Panel header */}
                <div className="ind-panel-header">
                    <div className="ind-panel-index">01</div>
                    <h1 className="ind-panel-title">AUTHENTICATE</h1>
                    <p className="ind-panel-sub">Enter credentials to access the trust network.</p>
                </div>

                {error && (
                    <div className="ind-error-block">
                        <span className="ind-error-tag">ERR</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="ind-form">
                    <div className="ind-field">
                        <label className="ind-label" htmlFor="email">
                            <span className="ind-label-index">01</span> EMAIL_ADDRESS
                        </label>
                        <div className="ind-input-wrap">
                            <Mail size={16} className="ind-input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="ind-input"
                                placeholder="operator@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="ind-field">
                        <label className="ind-label" htmlFor="password">
                            <span className="ind-label-index">02</span> ACCESS_KEY
                        </label>
                        <div className="ind-input-wrap">
                            <Lock size={16} className="ind-input-icon" />
                            <input
                                id="password"
                                type="password"
                                className="ind-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                            <>INITIALIZE SESSION <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>

                <div className="ind-panel-footer">
                    NO ACCOUNT? <Link to="/register">REGISTER_OPERATOR →</Link>
                </div>
            </motion.div>

            {/* Status bar */}
            <div className="ind-auth-statusbar">
                <span>BEHAVIORAL TRUST PROTOCOL</span>
                <span className="ind-status-online">● ONLINE</span>
            </div>
        </div>
    );
};

export default LoginPage;
