import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectAPI } from '../services/api';

const initialFormState = () => ({
    clientId: '',
    title: '',
    scopeChecklist: [''],
    revisionLimit: 2,
    deadline: '',
});

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [formData, setFormData] = useState(initialFormState());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) setFormData(initialFormState());
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleChecklistChange = (index, value) => {
        const newChecklist = [...formData.scopeChecklist];
        newChecklist[index] = value;
        setFormData({ ...formData, scopeChecklist: newChecklist });
    };

    const addChecklistItem = () => {
        setFormData({ ...formData, scopeChecklist: [...formData.scopeChecklist, ''] });
    };

    const removeChecklistItem = (index) => {
        const newChecklist = formData.scopeChecklist.filter((_, i) => i !== index);
        setFormData({ ...formData, scopeChecklist: newChecklist });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clean up empty checklist items
        const cleanChecklist = formData.scopeChecklist.filter(item => item.trim() !== '');

        if (!formData.title.trim() || !formData.clientId.trim() || cleanChecklist.length === 0) {
            toast.error('Please fill in required fields and add at least one scope item');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                scopeChecklist: cleanChecklist,
                revisionLimit: Number(formData.revisionLimit)
            };
            if (!formData.deadline?.trim()) delete payload.deadline;
            else payload.deadline = new Date(formData.deadline).toISOString();

            const res = await projectAPI.createProject(payload);
            toast.success('Project created successfully!');
            onProjectCreated(res.data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}
                onClick={onClose}
            >
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card"
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        background: 'var(--bg-dark)'
                    }}
                >
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h2>Create New Project</h2>
                        <button onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem', border: 'none' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="title">Project Title</label>
                            <input
                                name="title"
                                id="title"
                                className="input-field"
                                placeholder="e.g. E-commerce Website Redesign"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="clientId">Client ID</label>
                            <input
                                name="clientId"
                                id="clientId"
                                className="input-field"
                                placeholder="6-character short ID (from Profile) or full ID"
                                value={formData.clientId}
                                onChange={handleChange}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.25rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                <AlertCircle size={12} /> Use the client&apos;s short ID from their Profile (e.g. 3d167a) or their full user ID
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="revisionLimit">Revision Limit</label>
                            <input
                                type="number"
                                name="revisionLimit"
                                id="revisionLimit"
                                className="input-field"
                                min="0"
                                value={formData.revisionLimit}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="deadline">Deadline (optional)</label>
                            <input
                                type="datetime-local"
                                name="deadline"
                                id="deadline"
                                className="input-field"
                                value={formData.deadline}
                                onChange={handleChange}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Early completion adds a trust score bonus; late completion applies a penalty.
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Scope Checklist</label>
                            {formData.scopeChecklist.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        className="input-field"
                                        placeholder={`Deliverable ${index + 1}`}
                                        value={item}
                                        onChange={(e) => handleChecklistChange(index, e.target.value)}
                                    />
                                    {formData.scopeChecklist.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeChecklistItem(index)}
                                            className="btn-secondary"
                                            style={{ padding: '0.5rem', flexShrink: 0, borderColor: 'var(--danger-bg)', color: 'var(--danger)' }}
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addChecklistItem}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', marginTop: '0.25rem', alignSelf: 'flex-start' }}
                            >
                                <Plus size={16} /> Add Deliverable
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button type="button" onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateProjectModal;
