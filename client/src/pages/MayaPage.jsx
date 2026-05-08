import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Sparkles,
    Send,
    Mic,
    MicOff,
    Users,
    FileText,
    ListOrdered,
    ClipboardList,
    ShieldAlert,
    Scale,
    Briefcase,
    Layers,
    Coins,
    ScrollText,
    MessageSquare,
} from 'lucide-react';
import { mayaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AI_ASSISTANT_BRAND } from '../assistantBrand';

const MODE_OPTIONS = [
    { id: 'chat', label: 'Hiring chat', Icon: MessageSquare, hint: 'Describe the work naturally' },
    { id: 'scope', label: 'Project scope', Icon: FileText, hint: 'Idea → structured JSON scope' },
    { id: 'job_post', label: 'Job post', Icon: ClipboardList, hint: 'Rough notes → job listing' },
    { id: 'milestones', label: 'Milestones', Icon: ListOrdered, hint: 'Break work into phases' },
    { id: 'interview', label: 'Interview Qs', Icon: Sparkles, hint: 'Questions for candidates' },
    { id: 'proposal', label: 'Proposal', Icon: Briefcase, hint: 'Freelancer proposal draft' },
    { id: 'summarize', label: 'Summarize', Icon: Layers, hint: 'Turn notes into action items' },
    { id: 'contract', label: 'Contract outline', Icon: Scale, hint: 'From chat terms → outline' },
    { id: 'fraud', label: 'Risk scan', Icon: ShieldAlert, hint: 'Red flags in post or message' },
    { id: 'career', label: 'Career coach', Icon: Sparkles, hint: 'Skills & portfolio tips' },
    { id: 'team', label: 'Team builder', Icon: Users, hint: 'Roles for a larger build' },
    { id: 'budget', label: 'Budget guess', Icon: Coins, hint: 'Ballpark cost & timeline' },
    { id: 'nda', label: 'NDA outline', Icon: ScrollText, hint: 'Short mutual NDA draft' },
];

function StructuredPreview({ structured }) {
    if (!structured || typeof structured !== 'object') return null;
    return (
        <pre
            style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-muted, rgba(255,255,255,0.03))',
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '260px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}
        >
            {JSON.stringify(structured, null, 2)}
        </pre>
    );
}

const MayaPage = () => {
    const { user } = useAuth();
    const [mode, setMode] = useState('chat');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [matchBrief, setMatchBrief] = useState('');
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchResult, setMatchResult] = useState(null);
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
        if (!SR) return;
        const r = new SR();
        r.continuous = false;
        r.interimResults = false;
        r.lang = 'en-US';
        r.onresult = (ev) => {
            const text = ev.results[0]?.[0]?.transcript?.trim();
            if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
            setListening(false);
        };
        r.onerror = () => {
            setListening(false);
            toast.error('Voice input failed or was denied');
        };
        r.onend = () => setListening(false);
        recognitionRef.current = r;
        return () => {
            try {
                r.abort();
            } catch {
                /* ignore */
            }
        };
    }, []);

    const toggleMic = () => {
        const r = recognitionRef.current;
        if (!r) {
            toast.error('Voice input is not supported in this browser');
            return;
        }
        if (listening) {
            try {
                r.stop();
            } catch {
                /* ignore */
            }
            setListening(false);
            return;
        }
        setListening(true);
        try {
            r.start();
        } catch {
            setListening(false);
            toast.error('Could not start microphone');
        }
    };

    const sendChat = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const nextMessages = [...messages, { role: 'user', content: trimmed }];
        setMessages(nextMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await mayaAPI.chat({
                mode,
                messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            });

            if (!res.success) {
                toast.error(res.message || 'Maya request failed');
                return;
            }

            const replyText = res.data?.reply ?? '';
            const structured = res.data?.structured ?? null;

            const assistantContent =
                mode !== 'chat' && structured
                    ? 'Structured result — review the fields below. Send a follow-up in the same mode to refine.'
                    : replyText;

            setMessages([
                ...nextMessages,
                {
                    role: 'assistant',
                    content: assistantContent,
                    structured: structured || undefined,
                },
            ]);

            if (mode !== 'chat' && !structured) {
                toast('Maya replied, but structured JSON did not parse. Raw model output is shown in the thread.', {
                    icon: '⚠️',
                });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const runMatch = async () => {
        const brief = matchBrief.trim();
        if (!brief || matchLoading) return;
        setMatchLoading(true);
        setMatchResult(null);
        try {
            const res = await mayaAPI.match({ brief });
            if (!res.success) {
                toast.error(res.message || 'Match failed');
                return;
            }
            setMatchResult(res.data?.structured ?? null);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setMatchLoading(false);
        }
    };

    const clearThread = () => {
        setMessages([]);
        toast.success('Chat cleared');
    };

    const isStructuredMode = mode !== 'chat';

    return (
        <div className="ind-page">
            <div className="ind-page-inner">
                <div className="ind-page-header">
                    <div>
                        <div className="ind-page-sys-label">{`SYS_${AI_ASSISTANT_BRAND} // GEMINI_AI`}</div>
                        <h1 className="ind-page-title">{AI_ASSISTANT_BRAND}</h1>
                        <p className="ind-page-sub">
                            Hiring assistant powered by Gemini. Pick a mode, describe your goal, send — or match against
                            real freelancers from the directory. Local setup: put <code>GEMINI_API_KEY</code> in{' '}
                            <code style={{ wordBreak: 'break-all' }}>client/.dev.vars</code> (not repo-root{' '}
                            <code>.env</code>), then restart the API (<code>npm run dev:api</code>) or run{' '}
                            <code>npm run dev:all</code>.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button type="button" className="ind-btn ind-btn-outline" onClick={clearThread}>
                            Clear chat
                        </button>
                        <Link to="/freelancers" className="ind-btn ind-btn-orange" style={{ textDecoration: 'none' }}>
                            <Users size={16} /> Freelancers
                        </Link>
                    </div>
                </div>

                {/* Mode picker */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.45rem',
                        marginBottom: '1rem',
                    }}
                >
                    {MODE_OPTIONS.map((opt) => {
                        const ModeIcon = opt.Icon;
                        return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMode(opt.id)}
                            className={mode === opt.id ? 'ind-btn ind-btn-orange' : 'ind-btn ind-btn-outline'}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', gap: '0.35rem' }}
                        >
                            <ModeIcon size={14} /> {opt.label}
                        </button>
                        );
                    })}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Signed in as <strong>{user?.name}</strong> ({user?.role}). Voice works in Chromium-based browsers.
                </p>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr minmax(280px, 360px)',
                        gap: '1.25rem',
                        alignItems: 'start',
                    }}
                    className="maya-grid"
                >
                    {/* Chat column */}
                    <div
                        style={{
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1rem',
                            minHeight: '420px',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--bg-card)',
                        }}
                    >
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.75rem', maxHeight: 'min(52vh, 520px)' }}>
                            {messages.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {MODE_OPTIONS.find((m) => m.id === mode)?.hint ?? 'Type below to start.'}
                                </p>
                            )}
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    style={{
                                        marginBottom: '0.85rem',
                                        textAlign: m.role === 'user' ? 'right' : 'left',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--text-muted)',
                                            display: 'block',
                                            marginBottom: '0.2rem',
                                        }}
                                    >
                                        {m.role === 'user' ? 'YOU' : AI_ASSISTANT_BRAND}
                                    </span>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            textAlign: 'left',
                                            maxWidth: '95%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '10px',
                                            border:
                                                m.role === 'user'
                                                    ? '1px solid rgba(249,115,22,0.45)'
                                                    : '1px solid var(--border)',
                                            background:
                                                m.role === 'user'
                                                    ? 'rgba(249,115,22,0.08)'
                                                    : 'rgba(255,255,255,0.02)',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {m.content}
                                        {m.structured && (
                                            <StructuredPreview structured={m.structured} />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {AI_ASSISTANT_BRAND} is thinking…
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendChat();
                                    }
                                }}
                                placeholder={
                                    isStructuredMode
                                        ? 'Paste detail for this mode (requirements, pasted chat, brief, …)'
                                        : 'Describe your project or what you want to hire for…'
                                }
                                rows={3}
                                style={{
                                    flex: 1,
                                    resize: 'vertical',
                                    minHeight: '72px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-shell)',
                                    color: 'var(--text-main)',
                                    padding: '0.6rem 0.75rem',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <button
                                    type="button"
                                    className="ind-btn ind-btn-outline"
                                    onClick={toggleMic}
                                    title="Voice input"
                                    style={{ padding: '0.5rem' }}
                                >
                                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                                <button
                                    type="button"
                                    className="ind-btn ind-btn-orange"
                                    onClick={sendChat}
                                    disabled={loading}
                                    style={{ padding: '0.5rem' }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Match column */}
                    <div
                        style={{
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1rem',
                            background: 'var(--bg-card)',
                        }}
                    >
                        <h2 style={{ fontSize: '1rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Users size={18} /> Matchmaking
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
                            Uses Gemini on your roster: trust scores and scope metrics from the database.
                        </p>
                        <textarea
                            value={matchBrief}
                            onChange={(e) => setMatchBrief(e.target.value)}
                            placeholder="Paste project brief (skills, stack, timeline, budget hints)..."
                            rows={6}
                            style={{
                                width: '100%',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-shell)',
                                color: 'var(--text-main)',
                                padding: '0.6rem 0.75rem',
                                fontFamily: 'inherit',
                                marginBottom: '0.6rem',
                            }}
                        />
                        <button
                            type="button"
                            className="ind-btn ind-btn-orange"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={runMatch}
                            disabled={matchLoading}
                        >
                            {matchLoading ? 'Matching…' : 'Run freelancer match'}
                        </button>

                        {matchResult?.matches?.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                                {matchResult.matches.map((row, idx) => (
                                    <li
                                        key={row.freelancer?.id ?? idx}
                                        style={{
                                            border: '1px solid var(--border)',
                                            borderRadius: '10px',
                                            padding: '0.65rem 0.75rem',
                                            marginBottom: '0.5rem',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        <div style={{ fontWeight: 600 }}>{row.freelancer?.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            Trust {row.freelancer?.trustScore ?? '–'} · Score {row.score ?? '–'}
                                        </div>
                                        {row.summary && <p style={{ marginTop: '0.35rem' }}>{row.summary}</p>}
                                        <Link
                                            to={`/freelancers/${row.freelancer?.id}`}
                                            style={{
                                                marginTop: '0.35rem',
                                                display: 'inline-block',
                                                fontSize: '0.8rem',
                                                color: 'var(--primary)',
                                            }}
                                        >
                                            View profile →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {matchResult && (!matchResult.matches || matchResult.matches.length === 0) && (
                            <p style={{ marginTop: '0.85rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No scored matches returned. Try a richer brief or add freelancers to your workspace.
                            </p>
                        )}
                    </div>
                </div>
                <style>{`
                  @media (max-width: 900px) {
                    .maya-grid { grid-template-columns: 1fr !important; }
                  }
                `}</style>
            </div>
        </div>
    );
};

export default MayaPage;
