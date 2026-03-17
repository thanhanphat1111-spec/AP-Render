
import React, { useState } from 'react';
import { MoodboardTab } from './MoodboardTab';
import { InsertBuildingTab } from './InsertBuildingTab';
import { ImageFile, RenderHistoryItem, SourceImage } from '../types';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { LOCAL_STORAGE_HISTORY_KEY } from '../constants';

interface ReUpTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialData?: { image: ImageFile; mode: 'moodboard' | 'insert' } | null;
  onClearInitialData?: () => void;
}

type ReUpMode = 'moodboard' | 'insert';

export const ReUpTab: React.FC<ReUpTabProps> = ({ 
    onEditRequest, 
    onVideoRequest,
    initialData,
    onClearInitialData
}) => {
    const [activeMode, setActiveMode] = useState<ReUpMode>('moodboard');
    const [history, setHistory] = useSessionStorage<RenderHistoryItem[]>(`${LOCAL_STORAGE_HISTORY_KEY}_embed_building`, []);

    // Handlers for InsertBuildingTab
    const handleHistoryClear = () => setHistory([]);
    
    const handleGenerationComplete = (prompt: string, images: string[]) => {
        const newItem: RenderHistoryItem = {
            id: Date.now().toString(),
            prompt,
            images,
            timestamp: Date.now().toString(),
        };
        setHistory(prev => [newItem, ...prev].slice(0, 20));
    };

    const handleEditRequestFromInsert = (sourceImage: SourceImage) => {
        const file = sourceImage.file || new File([], 'edit.png', { type: sourceImage.mimeType });
        const imageFile: ImageFile = {
            file,
            base64: `data:${sourceImage.mimeType};base64,${sourceImage.base64}`,
            url: `data:${sourceImage.mimeType};base64,${sourceImage.base64}`
        };
        onEditRequest(imageFile);
    };

    // Start new render flow basically sends it to Exterior Render Tab?
    // For now, let's map it to Edit Request as a placeholder or send to Exterior Render if supported.
    // Since onEditRequest handles generic image transfer, we use that.
    const handleStartNewRenderFlow = (sourceImage: SourceImage) => {
         handleEditRequestFromInsert(sourceImage);
    };

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('moodboard')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'moodboard'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🎨 Tạo 3D từ Moodboard
                </button>
                <button
                    onClick={() => setActiveMode('insert')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'insert'
                            ? 'bg-brand-secondary text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🏗️ Chèn Công Trình
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px] animate-fade-in">
                {activeMode === 'moodboard' && (
                    <MoodboardTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest} 
                    />
                )}
                {activeMode === 'insert' && (
                    <InsertBuildingTab 
                        history={history}
                        onClearHistory={handleHistoryClear}
                        onGenerationComplete={handleGenerationComplete}
                        onEditRequest={handleEditRequestFromInsert}
                        onStartNewRenderFlow={handleStartNewRenderFlow}
                    />
                )}
            </div>
        </div>
    );
};
