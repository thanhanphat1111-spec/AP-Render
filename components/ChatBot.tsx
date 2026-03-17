
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icons';
import { generateText } from '../services/aiService';
import { ActiveTab } from '../types';
import { FEATURE_DESCRIPTIONS, TABS } from '../constants';

interface ChatBotProps {
    isOpen: boolean;
    onToggle: () => void;
    activeTab: ActiveTab;
}

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle, activeTab }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'bot', text: 'Xin chào! Tôi là trợ lý AI của AP Render. Tôi có thể giúp gì cho bạn về tính năng này?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Send context-aware greeting when tab changes
    useEffect(() => {
        const featureName = TABS.find(t => t.id === activeTab)?.label || 'Ứng dụng';
        setMessages(prev => [
            ...prev,
            { 
                id: `context-${Date.now()}`, 
                role: 'bot', 
                text: `Bạn đang ở mục "${featureName}". ${FEATURE_DESCRIPTIONS[activeTab] || ''} Bạn cần hướng dẫn chi tiết không?` 
            }
        ]);
    }, [activeTab]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const currentFeatureName = TABS.find(t => t.id === activeTab)?.label;
        const currentFeatureDesc = FEATURE_DESCRIPTIONS[activeTab];

        const systemPrompt = `Bạn là trợ lý ảo chuyên gia của ứng dụng "AP Render" - một ứng dụng kiến trúc AI.
        Người dùng đang ở chức năng: "${currentFeatureName}".
        Mô tả chức năng này: "${currentFeatureDesc}".
        
        Nhiệm vụ của bạn:
        1. Giải đáp thắc mắc về cách sử dụng chức năng hiện tại.
        2. Gợi ý các mẹo (tips) để có kết quả render đẹp nhất.
        3. Nếu người dùng hỏi về chức năng khác, hãy chỉ dẫn họ sang tab tương ứng.
        4. Trả lời ngắn gọn, thân thiện, dùng tiếng Việt.`;

        try {
            const response = await generateText(input, systemPrompt);
            const botMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'bot', 
                text: response.text || 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại.' 
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: 'Có lỗi xảy ra. Vui lòng kiểm tra API Key.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`fixed bottom-6 right-6 z-[60] flex flex-col items-end transition-all duration-300 ${isOpen ? 'w-80 sm:w-96' : 'w-auto'}`}>
            {/* Chat Window */}
            {isOpen && (
                <div className="w-full bg-[var(--bg-surface-1)] backdrop-blur-xl border border-[var(--border-1)] rounded-2xl shadow-2xl mb-4 overflow-hidden flex flex-col h-[500px] animate-slide-down origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-accent to-brand-secondary p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h3 className="text-white font-bold text-sm">Trợ lý AP Render</h3>
                        </div>
                        <button onClick={onToggle} className="text-white/80 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-brand-accent text-white rounded-br-none' 
                                        : 'bg-brand-surface text-brand-text border border-white/10 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-brand-surface p-3 rounded-xl rounded-bl-none border border-white/10">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-brand-text-muted rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-brand-text-muted rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-brand-text-muted rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-brand-surface/50 border-t border-white/10">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi về chức năng này..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-accent hover:text-white disabled:opacity-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button 
                onClick={onToggle}
                className={`w-14 h-14 rounded-full shadow-lg shadow-brand-accent/30 flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-white/20 ${isOpen ? 'bg-brand-surface text-brand-text' : 'bg-gradient-to-br from-brand-accent to-brand-secondary text-white'}`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <Icon name="sparkles" className="w-7 h-7" />
                )}
            </button>
        </div>
    );
};
