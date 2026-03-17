
import React, { useEffect, useState } from 'react';
import { Icon } from './icons';

interface FeatureNotificationProps {
    message: string;
    visible: boolean;
    onClick: () => void;
    onClose: () => void;
}

export const FeatureNotification: React.FC<FeatureNotificationProps> = ({ message, visible, onClick, onClose }) => {
    const [isVisible, setIsVisible] = useState(visible);

    useEffect(() => {
        setIsVisible(visible);
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 6000); // Auto hide after 6s
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[55] w-80 animate-slide-up">
            <div className="bg-brand-surface/90 backdrop-blur-xl border border-brand-accent/30 rounded-xl p-4 shadow-2xl relative group cursor-pointer hover:border-brand-accent transition-colors" onClick={onClick}>
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-2 right-2 text-brand-text-muted hover:text-white p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-accent to-brand-secondary flex items-center justify-center text-white">
                        <Icon name="sparkles" className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Gợi ý tính năng</h4>
                        <p className="text-xs text-brand-text-muted line-clamp-3 leading-relaxed">
                            {message}
                        </p>
                        <div className="mt-2 text-xs font-semibold text-brand-accent flex items-center gap-1 group-hover:underline">
                            Chat để tìm hiểu thêm <Icon name="arrow-uturn-left" className="w-3 h-3 rotate-180"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
