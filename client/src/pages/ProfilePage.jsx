import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import { Shield, TrendingUp, AlertTriangle, User, FolderOpen, ArrowRight } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const shortId = user?.id ? String(user.id).slice(-6) : '';

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectAPI.getUserProjects();
                if (res.success && res.data) setProjects(res.data);
                else if (Array.isArray(res.data)) setProjects(res.data);
                else setProjects([]);
            } catch {
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const ongoingProjects = projects.filter((p) => p.status === 'active');

    return (
        <div className="ind-page">
            <div className="ind-page-inner" style={{ maxWidth: 960 }}>
                <div className="ind-page-header">
                    <div>
                        <div className="ind-page-sys-label">SYS_IDENTITY // OPERATOR_PROFILE</div>
                        <h1 className="ind-page-title">PROFILE</h1>
                        <p className="ind-page-sub">Your operator identity and behavioral performance metrics.</p>
                    </div>
                </div>

                {/* Identity card */}
                <div style={{ background: '#111', border: '1px solid #333', padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ width: 64, height: 64, background: '#222', border: '1px solid #444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={28} color="#888" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E2E2E2', marginBottom: '0.25rem' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.1em' }}>
                            <span style={{ color: '#FF7A00' }}>{user?.role?.toUpperCase()}</span> · ID_{shortId}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.1rem' }}>{user?.email}</div>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#555', borderLeft: '1px solid #333', paddingLeft: '1.5rem' }}>
                        <div>BEHAVIORAL_TRUST_PROTOCOL</div>
                        <div style={{ color: '#00FF66', marginTop: '0.25rem' }}>● STATUS: VERIFIED</div>
                    </div>
                </div>

                {/* Scores */}
                <div style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>// PERFORMANCE_METRICS</div>
                <div className="ind-metric-cards" style={{ marginBottom: '2rem' }}>
                    <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="ind-metric-label"><Shield size={10} style={{ display: 'inline', marginRight: 4 }} />TRUST_SCORE</div>
                        <div className="ind-metric-value ind-metric-value-orange">{user?.trustScore ?? '—'}</div>
                        <div className="ind-metric-sub">BEHAVIORAL_CREDIBILITY</div>
                    </motion.div>
                    <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="ind-metric-label"><TrendingUp size={10} style={{ display: 'inline', marginRight: 4 }} />SCOPE_DISCIPLINE</div>
                        <div className="ind-metric-value ind-metric-value-green">{user?.scopeDiscipline ?? '—'}%</div>
                        <div className="ind-metric-sub">SCOPE_ADHERENCE</div>
                    </motion.div>
                    <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="ind-metric-label"><AlertTriangle size={10} style={{ display: 'inline', marginRight: 4 }} />SCOPE_CREEP_INDEX</div>
                        <div className="ind-metric-value">{user?.scopeCreepIndex ?? '—'}</div>
                        <div className="ind-metric-sub">HISTORICAL_SHIFTS</div>
                    </motion.div>
                    {user?.disputeRatio != null && (
                        <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                            <div className="ind-metric-label">DISPUTE_RATIO</div>
                            <div className="ind-metric-value">{user.disputeRatio}</div>
                            <div className="ind-metric-sub">ALL_TIME_DISPUTES</div>
                        </motion.div>
                    )}
                    {user?.trustVelocity != null && (
                        <motion.div className="ind-metric-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <div className="ind-metric-label">TRUST_VELOCITY</div>
                            <div className="ind-metric-value ind-metric-value-green">{user.trustVelocity}</div>
                            <div className="ind-metric-sub">TREND_TRAJECTORY</div>
                        </motion.div>
                    )}
                </div>

                {/* Active Projects */}
                <div style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>// ACTIVE_CONTRACTS</div>
                {loading ? (
                    <div className="ind-empty-state"><div style={{ fontSize: '0.75rem', color: '#888' }}>LOADING...</div></div>
                ) : ongoingProjects.length === 0 ? (
                    <div className="ind-empty-state" style={{ background: '#fff', border: '1px solid #CCC', padding: '2.5rem' }}>
                        <FolderOpen size={40} className="ind-empty-icon" color="#CCC" />
                        <div className="ind-empty-title">NO_ACTIVE_CONTRACTS</div>
                        <Link to="/dashboard" className="ind-btn ind-btn-orange" style={{ marginTop: '0.5rem' }}>GOTO_DASHBOARD <ArrowRight size={14} /></Link>
                    </div>
                ) : (
                    <div className="ind-grid-2">
                        {ongoingProjects.map((project, index) => (
                            <motion.div key={project._id} className="ind-project-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                <span className="ind-badge ind-badge-active">ACTIVE</span>
                                <div className="ind-project-title">{project.title}</div>
                                <div className="ind-project-meta">REVISIONS: {project.revisionsUsed}/{project.revisionLimit}</div>
                                <Link to={`/projects/${project._id}`} className="ind-btn ind-btn-black" style={{ marginTop: 'auto' }}>
                                    VIEW_CONTRACT <ArrowRight size={14} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
