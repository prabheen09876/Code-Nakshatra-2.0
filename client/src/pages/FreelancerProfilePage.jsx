import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Shield, TrendingUp, AlertTriangle, MessageCircle, FolderOpen } from 'lucide-react';

const FreelancerProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await usersAPI.getUserProfile(id);
                setProfile(res.data);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load profile');
                navigate('/freelancers');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    useEffect(() => {
        if (!id || user?.role !== 'client') return;
        usersAPI.getFreelancerProjects(id)
            .then((res) => setProjects(res.data || []))
            .catch(() => setProjects([]));
    }, [id, user?.role]);

    const handleMessage = () => {
        navigate(`/messages?with=${id}`);
    };

    if (loading) {
        return (
            <div className="ind-page">
                <div className="ind-page-inner ind-empty-state">
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>LOADING_OPERATOR_PROFILE...</div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const shortId = profile._id ? String(profile._id).slice(-6) : '';

    return (
        <div className="ind-page">
            <div className="ind-page-inner" style={{ maxWidth: 720 }}>
                {/* Back button */}
                <button
                    onClick={() => navigate('/freelancers')}
                    className="ind-btn ind-btn-outline"
                    style={{ marginBottom: '1.5rem', gap: '0.5rem' }}
                >
                    <ArrowLeft size={14} /> BACK_TO_DIRECTORY
                </button>

                {/* Profile card */}
                <div className="ind-page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
                        <div style={{ width: 72, height: 72, background: '#111', border: '2px solid #333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={32} color="#888" />
                        </div>
                        <div>
                            <div className="ind-page-sys-label">SYS_OPERATOR // FREELANCER_PROFILE</div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111', marginBottom: '0.25rem' }}>{profile.name}</h1>
                            <div style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.1em' }}>
                                FREELANCER · ID_{shortId}
                            </div>
                        </div>
                    </div>
                    {user?.role === 'client' && (
                        <button
                            type="button"
                            className="ind-btn ind-btn-black"
                            onClick={handleMessage}
                        >
                            <MessageCircle size={16} /> MESSAGE_OPERATOR
                        </button>
                    )}
                </div>

                {/* Metrics */}
                <div style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>// TRUST_METRICS</div>
                <div className="ind-metric-cards">
                    <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="ind-metric-label"><Shield size={10} style={{ display: 'inline', marginRight: 4 }} />TRUST_SCORE</div>
                        <div className="ind-metric-value ind-metric-value-orange">{profile.trustScore ?? '—'}</div>
                        <div className="ind-metric-sub">BEHAVIORAL_CREDIBILITY</div>
                    </motion.div>
                    <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="ind-metric-label"><TrendingUp size={10} style={{ display: 'inline', marginRight: 4 }} />SCOPE_DISCIPLINE</div>
                        <div className="ind-metric-value ind-metric-value-green">{profile.scopeDiscipline ?? '—'}%</div>
                        <div className="ind-metric-sub">SCOPE_ADHERENCE</div>
                    </motion.div>
                    <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="ind-metric-label"><AlertTriangle size={10} style={{ display: 'inline', marginRight: 4 }} />SCOPE_CREEP_INDEX</div>
                        <div className="ind-metric-value">{profile.scopeCreepIndex ?? '—'}</div>
                        <div className="ind-metric-sub">HISTORICAL_SHIFTS</div>
                    </motion.div>
                </div>

                {user?.role === 'client' && projects.length > 0 && (
                    <>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.85rem' }}>Projects with this freelancer</h2>
                        <div className="flux-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.75rem' }}>Ongoing</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                {projects.filter((p) => p.status === 'active').length === 0 ? (
                                    <li style={{ color: 'var(--flux-text-muted)', fontSize: '0.9375rem' }}>No active projects</li>
                                ) : (
                                    projects.filter((p) => p.status === 'active').map((p) => (
                                        <li key={p._id} style={{ marginBottom: '0.5rem' }}>
                                            <Link to={`/projects/${p._id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
                                                <FolderOpen size={18} style={{ flexShrink: 0 }} /> {p.title} · Active
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.75rem' }}>Past projects</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {projects.filter((p) => p.status !== 'active').length === 0 ? (
                                    <li style={{ color: 'var(--flux-text-muted)', fontSize: '0.9375rem' }}>No past projects</li>
                                ) : (
                                    projects.filter((p) => p.status !== 'active').map((p) => (
                                        <li key={p._id} style={{ marginBottom: '0.5rem' }}>
                                            <Link to={`/projects/${p._id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
                                                <FolderOpen size={18} style={{ flexShrink: 0 }} /> {p.title} · {p.status}
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FreelancerProfilePage;
