import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MessageCircle, Send, User } from 'lucide-react';

const POLL_INTERVAL_MS = 4000;

const MessagesPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const withUserId = searchParams.get('with');

    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingConv, setLoadingConv] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const listEndRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const res = await conversationAPI.getConversations();
            setConversations(res.data || []);
        } catch {
            setConversations([]);
        } finally {
            setLoadingConv(false);
        }
    };

    useEffect(() => { fetchConversations(); }, []);

    useEffect(() => {
        if (!withUserId || !user?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await conversationAPI.getOrCreateConversation(withUserId);
                if (cancelled) return;
                setSelectedConv(res.data);
                setMessages([]);
                fetchConversations();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to start conversation');
            }
        })();
        return () => { cancelled = true; };
    }, [withUserId, user?.id]);

    const selectConversation = (conv) => {
        setSelectedConv(conv);
        setMessages([]);
    };

    useEffect(() => {
        if (!selectedConv?._id) return;
        setLoadingMessages(true);
        conversationAPI.getMessages(selectedConv._id)
            .then((res) => setMessages(res.data || []))
            .catch(() => setMessages([]))
            .finally(() => setLoadingMessages(false));
    }, [selectedConv?._id]);

    useEffect(() => {
        if (!selectedConv?._id) return;
        const interval = setInterval(() => {
            conversationAPI.getMessages(selectedConv._id)
                .then((res) => setMessages(res.data || []))
                .catch(() => {});
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [selectedConv?._id]);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || !selectedConv || sending) return;
        setSending(true);
        try {
            const res = await conversationAPI.sendMessage(selectedConv._id, trimmed);
            setMessages((prev) => [...prev, res.data]);
            setInput('');
            listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            fetchConversations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send');
        } finally {
            setSending(false);
        }
    };

    const otherUser = selectedConv?.otherUser || selectedConv?.participants?.find((p) => String(p._id) !== String(user?.id));
    const isMe = (senderId) => senderId && user?.id && String(senderId._id || senderId) === String(user.id);

    return (
        <div className="ind-messages-layout">
            {/* Sidebar */}
            <div className="ind-conv-sidebar">
                <div className="ind-conv-sidebar-header">
                    <MessageCircle size={16} color="#888" /> MSG_CENTER
                </div>
                <div className="ind-conv-list">
                    {loadingConv ? (
                        <div style={{ padding: '1rem', fontSize: '0.7rem', color: '#555' }}>LOADING...</div>
                    ) : conversations.length === 0 ? (
                        <div style={{ padding: '1rem', fontSize: '0.7rem', color: '#555', lineHeight: 1.6 }}>
                            NO_CONVERSATIONS.<br />Find a freelancer to start.
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const other = conv.otherUser || conv.participants?.find((p) => String(p._id) !== String(user?.id));
                            const active = selectedConv?._id === conv._id;
                            return (
                                <button
                                    type="button"
                                    key={conv._id}
                                    onClick={() => selectConversation(conv)}
                                    className={`ind-conv-item ${active ? 'active' : ''}`}
                                >
                                    <div className="ind-conv-avatar">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <div className="ind-conv-name">{other?.name || 'UNKNOWN'}</div>
                                        <div className="ind-conv-role">{other?.role === 'freelancer' ? 'FREELANCER' : 'CLIENT'}</div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Thread */}
            <div className="ind-thread">
                {!selectedConv ? (
                    <div className="ind-empty-state">
                        <MessageCircle size={48} className="ind-empty-icon" color="#888" />
                        <div className="ind-empty-title">SELECT_CONVERSATION</div>
                        <p className="ind-empty-sub">Choose a conversation or message a freelancer from find_operators.</p>
                    </div>
                ) : (
                    <>
                        <div className="ind-thread-header">
                            <div className="ind-conv-avatar">
                                <User size={16} />
                            </div>
                            <div>
                                <div className="ind-thread-name">{otherUser?.name || 'UNKNOWN_OPERATOR'}</div>
                                <div className="ind-thread-role">{otherUser?.role === 'freelancer' ? 'FREELANCER' : 'CLIENT'}</div>
                            </div>
                        </div>

                        <div className="ind-thread-messages">
                            {loadingMessages ? (
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>LOADING_MESSAGES...</div>
                            ) : messages.length === 0 ? (
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>NO_MESSAGES. Say hi!</div>
                            ) : (
                                messages.map((msg) => {
                                    const me = isMe(msg.senderId);
                                    return (
                                        <div key={msg._id} className={`ind-msg ${me ? 'ind-msg-me' : 'ind-msg-other'}`}>
                                            <div className="ind-msg-meta">
                                                {msg.senderId?.name} · {msg.senderId?.role === 'client' ? 'CLIENT' : 'FREELANCER'}
                                            </div>
                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                                            <div className="ind-msg-time">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={listEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="ind-thread-input">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message..."
                                maxLength={2000}
                            />
                            <button
                                type="submit"
                                className="ind-thread-send"
                                disabled={!input.trim() || sending}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
