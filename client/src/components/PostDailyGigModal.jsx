import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { gigsAPI } from '../services/api';
import { Radio, X as XIcon } from 'lucide-react';

/** Client / recruiter: broadcast an instant gig to Daily Gig freelancers */
const PostDailyGigModal = ({ isOpen, onClose, onPosted }) => {
    const [title, setTitle] = useState('');
    const [budget, setBudget] = useState('');
    const [duration, setDuration] = useState('');
    const [skillsRaw, setSkillsRaw] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const submit = async (e) => {
        e.preventDefault();
        const requiredSkills = skillsRaw
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        setSaving(true);
        try {
            const res = await gigsAPI.postGig({
                title: title.trim(),
                budget: budget.trim(),
                duration: duration.trim(),
                requiredSkills,
                description: description.trim(),
            });
            if (!res.success) throw new Error(res.message || 'Failed');
            const dispatched = res.data?.recruiterNotifiedFreelancers ?? 0;
            const listening = res.data?.freelancersListeningNow ?? 0;
            if (dispatched > 0) {
                toast.success(`Gig dispatched to ${dispatched} online operator(s) (skill match).`);
            } else if (listening === 0) {
                toast.error(
                    'No freelancers are listening: turn on Daily Gig Mode in the nav on the freelancer side, then post again.',
                );
            } else {
                toast.error(
                    `${listening} freelancer(s) are listening but none matched your required skills — align tags on Profile or try broader keywords.`,
                );
            }
            onPosted?.(res.data);
            onClose();
            setTitle('');
            setBudget('');
            setDuration('');
            setSkillsRaw('');
            setDescription('');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Could not post gig');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2100,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
        >
            <div
                style={{
                    width: 'min(480px,100%)',
                    background: 'var(--bg-card,#111)',
                    border: '1px solid var(--border,#333)',
                    borderRadius: 12,
                    padding: '1.25rem',
                    color: 'var(--text-main,#e2e2e2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                        <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: '#f97316' }}>
                            <Radio size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                            DAILY_GIG_BROADCAST
                        </div>
                        <h2 style={{ fontSize: '1.05rem', margin: '0.4rem 0 0' }}>Post instant gig</h2>
                    </div>
                    <button type="button" aria-label="Close" onClick={() => !saving && onClose()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <XIcon size={20} />
                    </button>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: '#888' }}>TITLE</label>
                        <input required className="ind-search-input" style={{ width: '100%', marginTop: 4 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fix Next.js checkout bug" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: '#888' }}>BUDGET</label>
                            <input required className="ind-search-input" style={{ width: '100%', marginTop: 4 }} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$300" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: '#888' }}>DURATION</label>
                            <input required className="ind-search-input" style={{ width: '100%', marginTop: 4 }} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2 days" />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: '#888' }}>REQUIRED_SKILLS (comma-separated)</label>
                        <input required className="ind-search-input" style={{ width: '100%', marginTop: 4 }} value={skillsRaw} onChange={(e) => setSkillsRaw(e.target.value)} placeholder="React, TypeScript, Stripe" />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: '#888' }}>NOTES (optional)</label>
                        <textarea className="ind-search-input" style={{ width: '100%', marginTop: 4, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <button type="submit" className="ind-btn ind-btn-orange" disabled={saving} style={{ marginTop: '0.25rem' }}>
                        {saving ? 'Broadcasting…' : 'Notify active freelancers'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PostDailyGigModal;
