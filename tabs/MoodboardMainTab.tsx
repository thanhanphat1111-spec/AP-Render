
import React, { useState } from 'react';
import { MoodboardCreationTab } from './MoodboardCreationTab';
import { ArchLayoutTab } from './ArchLayoutTab';
import { ImageFile } from '../types';

interface MoodboardMainTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

type Mode = 'create_moodboard' | 'arch_layout';

export const MoodboardMainTab: React.FC<MoodboardMainTabProps> = ({ onEditRequest, onVideoRequest }) => {
    const [activeMode, setActiveMode] = useState<Mode>('create_moodboard');

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('create_moodboard')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'create_moodboard'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🎨 Tạo Moodboard (AI)
                </button>
                <button
                    onClick={() => setActiveMode('arch_layout')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'arch_layout'
                            ? 'bg-brand-secondary text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    📐 Dàn Trang (Arch Layout)
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px] animate-fade-in">
                {activeMode === 'create_moodboard' && (
                    <MoodboardCreationTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest} 
                    />
                )}
                {activeMode === 'arch_layout' && (
                    <ArchLayoutTab />
                )}
            </div>
        </div>
    );
};