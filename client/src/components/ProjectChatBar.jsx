import React, { useState, useEffect, useRef } from 'react';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MessageCircle, Send } from 'lucide-react';

const POLL_INTERVAL_MS = 4000;

export default function ProjectChatBar({ projectId, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const listEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const fetchMessages = async () => {
        if (!projectId) return;
        try {
            const res = await projectAPI.getProjectMessages(projectId);
            setMessages(res.data || []);
        } catch (err) {
            if (messages.length === 0) setMessages([]);
            // Don't toast on poll errors to avoid noise
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [projectId]);

    useEffect(() => {
        const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [projectId]);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        setSending(true);
        try {
            const res = await projectAPI.sendProjectMessage(projectId, trimmed);
            setMessages((prev) => [...prev, res.data]);
            setInput('');
            listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const isMe = (senderId) => {
        const id = senderId?._id || senderId;
        return id && currentUser?.id && String(id) === String(currentUser.id);
    };

    return (
        <div
            className="project-chat-bar"
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '320px',
                maxWidth: '100vw',
                height: '100vh',
                background: 'var(--flux-card-bg)',
                borderLeft: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
                zIndex: 40,
            }}
        >
            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--flux-main-bg)',
                }}
            >
                <MessageCircle size={22} color="var(--flux-text-muted)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--flux-text)' }}>
                    Project chat
                </h3>
            </div>

            <div
                ref={scrollContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
            >
                {loading ? (
                    <div style={{ color: 'var(--flux-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                        Loading messages…
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ color: 'var(--flux-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                        No messages yet. Say hi to decide scope and next steps.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const me = isMe(msg.senderId);
                        return (
                            <div
                                key={msg._id}
                                style={{
                                    alignSelf: me ? 'flex-end' : 'flex-start',
                                    maxWidth: '90%',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 'var(--flux-radius-sm)',
                                    background: me ? 'var(--primary)' : 'var(--flux-main-bg)',
                                    color: me ? '#fff' : 'var(--flux-text)',
                                    border: me ? 'none' : '1px solid #e2e8f0',
                                }}
                            >
                                <div style={{ fontSize: '0.7rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                                    {msg.senderId?.name || 'Unknown'} · {msg.senderId?.role === 'client' ? 'Client' : 'Freelancer'}
                                </div>
                                <div style={{ fontSize: '0.9375rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {msg.content}
                                </div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={listEndRef} />
            </div>

            <form
                onSubmit={handleSend}
                style={{
                    padding: '1rem',
                    borderTop: '1px solid #e2e8f0',
                    background: 'var(--flux-card-bg)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-end',
                }}
            >
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    rows={1}
                    maxLength={2000}
                    style={{
                        flex: 1,
                        resize: 'none',
                        minHeight: '40px',
                        maxHeight: '120px',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--flux-radius-sm)',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        color: 'var(--flux-text)',
                        background: 'var(--flux-main-bg)',
                    }}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!input.trim() || sending}
                    style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
