import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [chatOpen, setChatOpen] = useState(true);

    const toggleChat = () => setChatOpen((prev) => !prev);

    return (
        <ChatContext.Provider value={{ chatOpen, setChatOpen, toggleChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within ChatProvider');
    return ctx;
}
