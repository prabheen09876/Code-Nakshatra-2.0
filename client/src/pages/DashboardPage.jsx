import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import { Plus, FolderOpen, Shield, TrendingUp, AlertTriangle, ArrowRight, Radio } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';
import PostDailyGigModal from '../components/PostDailyGigModal';

const DashboardPage = () => {
    const { user } = useAuth();
    const isFreelancer = user.role === 'freelancer';
    const isClient = user.role === 'client';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postGigOpen, setPostGigOpen] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) {
                setProjects([]);
                setLoading(false);
                return;
            }
            try {
                const res = await projectAPI.getUserProjects();
                if (res.success && res.data) {
                    setProjects(res.data);
                } else if (Array.isArray(res.data)) {
                    setProjects(res.data);
                } else {
                    setProjects([]);
                }
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error('Failed to fetch projects', err);
                }
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [user]);

    const handleProjectCreated = (newProject) => {
        setProjects([newProject, ...projects]);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="ind-badge ind-badge-active">ACTIVE</span>;
            case 'completed': return <span className="ind-badge ind-badge-completed">COMPLETE</span>;
            case 'draft': return <span className="ind-badge ind-badge-draft">DRAFT</span>;
            default: return null;
        }
    };

    return (
        <div className="ind-page">
            <div className="ind-page-inner">
                {/* Header */}
                <div className="ind-page-header">
                    <div>
                        <div className="ind-page-sys-label">
                            SYS_DASHBOARD // {user.role.toUpperCase()}_VIEW
                        </div>
                        <h1 className="ind-page-title">DASHBOARD</h1>
                        <p className="ind-page-sub">Take control of your projects and trust metrics.</p>
                    </div>
                    {isFreelancer && (
                        <button className="ind-btn ind-btn-orange" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} /> NEW_PROJECT
                        </button>
                    )}
                    {isClient && (
                        <button
                            type="button"
                            className="ind-btn ind-btn-black"
                            onClick={() => setPostGigOpen(true)}
                            style={{ gap: 8 }}
                        >
                            <Radio size={16} /> POST_INSTANT_GIG
                        </button>
                    )}
                </div>

                {/* Metric Cards */}
                <div className="ind-metric-cards">
                    <motion.div
                        className="ind-metric-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="ind-metric-label">
                            <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                            TRUST_SCORE
                        </div>
                        <div className="ind-metric-value ind-metric-value-orange">{user.trustScore ?? '—'}</div>
                        <div className="ind-metric-sub">BEHAVIORAL_CREDIBILITY</div>
                    </motion.div>

                    {isFreelancer && (
                        <motion.div
                            className="ind-metric-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <div className="ind-metric-label">
                                <TrendingUp size={10} style={{ display: 'inline', marginRight: 4 }} />
                                SCOPE_DISCIPLINE
                            </div>
                            <div className="ind-metric-value ind-metric-value-green">{user.scopeDiscipline ?? '—'}%</div>
                            <div className="ind-metric-sub">ADHERENCE_TO_SCOPE</div>
                        </motion.div>
                    )}

                    <motion.div
                        className="ind-metric-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="ind-metric-label">
                            <AlertTriangle size={10} style={{ display: 'inline', marginRight: 4 }} />
                            SCOPE_CREEP_INDEX
                        </div>
                        <div className="ind-metric-value">{user.scopeCreepIndex ?? '—'}</div>
                        <div className="ind-metric-sub">HISTORICAL_SCOPE_SHIFTS</div>
                    </motion.div>

                    <motion.div
                        className="ind-metric-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{ borderTop: '3px solid #FF7A00' }}
                    >
                        <div className="ind-metric-label">TOTAL_PROJECTS</div>
                        <div className="ind-metric-value">{projects.length}</div>
                        <div className="ind-metric-sub">ALL_TIME_CONTRACTS</div>
                    </motion.div>
                </div>

                {/* Projects Section */}
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', color: '#555' }}>
                        {isFreelancer ? '// YOUR_PROJECTS' : '// PROJECTS_TO_REVIEW'}
                    </h2>
                    <span style={{ fontSize: '0.65rem', color: '#888' }}>{projects.length} TOTAL</span>
                </div>

                {loading ? (
                    <div className="ind-empty-state">
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>LOADING_PROJECTS...</div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="ind-empty-state" style={{ background: '#fff', border: '1px solid #CCC', padding: '3rem' }}>
                        <FolderOpen size={48} className="ind-empty-icon" color="#CCC" />
                        <div className="ind-empty-title">NO_PROJECTS_FOUND</div>
                        <p className="ind-empty-sub">
                            {isFreelancer
                                ? 'You haven\'t created any projects. Start a new scope agreement.'
                                : 'No assigned projects yet. A freelancer will create one for you.'}
                        </p>
                        {isFreelancer && (
                            <button
                                className="ind-btn ind-btn-orange"
                                onClick={() => setIsModalOpen(true)}
                                style={{ marginTop: '0.5rem' }}
                            >
                                <Plus size={16} /> NEW_PROJECT
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="ind-grid-2">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                className="ind-project-card"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    {getStatusBadge(project.status)}
                                    <span style={{ fontSize: '0.6rem', color: '#888' }}>
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="ind-project-title">{project.title}</div>
                                <div className="ind-project-meta">
                                    DELIVERABLES: {project.scopeChecklist?.length || 0} ITEMS
                                    &nbsp;·&nbsp;
                                    REVISIONS: {project.revisionsUsed}/{project.revisionLimit}
                                </div>
                                <Link
                                    to={`/projects/${project._id}`}
                                    className="ind-btn ind-btn-black"
                                    style={{ marginTop: 'auto' }}
                                >
                                    VIEW_DETAILS <ArrowRight size={14} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={handleProjectCreated} />
                <PostDailyGigModal isOpen={postGigOpen} onClose={() => setPostGigOpen(false)} />
            </div>
        </div>
    );
};

export default DashboardPage;
