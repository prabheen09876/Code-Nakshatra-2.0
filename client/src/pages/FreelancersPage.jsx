import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, User, Shield, MessageCircle, ArrowRight } from 'lucide-react';

const FreelancersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const fetchFreelancers = async () => {
            setLoading(true);
            try {
                const res = await usersAPI.getFreelancers(debouncedQuery);
                setFreelancers(res.data || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load freelancers');
                setFreelancers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchFreelancers();
    }, [debouncedQuery]);

    return (
        <div className="ind-page">
            <div className="ind-page-inner">
                <div className="ind-page-header">
                    <div>
                        <div className="ind-page-sys-label">SYS_NETWORK // OPERATOR_DIRECTORY</div>
                        <h1 className="ind-page-title">FIND_FREELANCERS</h1>
                        <p className="ind-page-sub">Browse verified operators. View trust scores and message directly.</p>
                    </div>
                </div>

                {/* Search */}
                <div className="ind-search-wrap">
                    <Search size={16} className="ind-search-icon" />
                    <input
                        type="text"
                        className="ind-search-input"
                        placeholder="Search by operator name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="ind-empty-state">
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>LOADING_OPERATORS...</div>
                    </div>
                ) : freelancers.length === 0 ? (
                    <div className="ind-empty-state" style={{ background: '#fff', border: '1px solid #CCC', padding: '3rem' }}>
                        <User size={48} className="ind-empty-icon" color="#CCC" />
                        <div className="ind-empty-title">NO_OPERATORS_FOUND</div>
                        <p className="ind-empty-sub">Try a different search term.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {freelancers.map((f, i) => (
                            <motion.div
                                key={f._id ?? f.id}
                                className="ind-freelancer-row"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="ind-conv-avatar">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#111', marginBottom: '0.25rem' }}>{f.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={12} />
                                            TRUST: <span style={{ color: '#FF7A00', fontWeight: 700 }}>{f.trustScore ?? '—'}</span>
                                            &nbsp;·&nbsp;
                                            SCOPE: <span style={{ color: '#111', fontWeight: 700 }}>{f.scopeDiscipline ?? '—'}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Link to={`/freelancers/${f._id ?? f.id}`} className="ind-btn ind-btn-outline">
                                        PROFILE <ArrowRight size={14} />
                                    </Link>
                                    <button
                                        type="button"
                                        className="ind-btn ind-btn-black"
                                        onClick={() => navigate(`/messages?with=${f._id ?? f.id}`)}
                                    >
                                        <MessageCircle size={14} /> MESSAGE
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreelancersPage;
