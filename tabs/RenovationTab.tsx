
import React, { useState, useEffect } from 'react';
import { MoodboardTab } from './MoodboardTab';
import { InsertBuildingTab } from './InsertBuildingTab';
import { MaterialChangeTab } from './MaterialChangeTab';
import { FurnitureArrangementTab } from './FurnitureArrangementTab';
import { ImageFile, RenderHistoryItem, SourceImage } from '../types';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { LOCAL_STORAGE_HISTORY_KEY } from '../constants';

interface RenovationTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  // This prop handles image transfer specifically for material change
  initialMaterialImage?: ImageFile | null;
  onClearInitialMaterialImage?: () => void;
}

type RenovationMode = 'moodboard' | 'insert' | 'material' | 'furniture';

export const RenovationTab: React.FC<RenovationTabProps> = ({ 
    onEditRequest, 
    onVideoRequest,
    initialMaterialImage,
    onClearInitialMaterialImage
}) => {
    const [activeMode, setActiveMode] = useState<RenovationMode>('moodboard');
    // We lift the history for InsertBuildingTab here similar to ReUpTab
    const [insertHistory, setInsertHistory] = useSessionStorage<RenderHistoryItem[]>(`${LOCAL_STORAGE_HISTORY_KEY}_embed_building`, []);

    useEffect(() => {
        if (initialMaterialImage) {
            setActiveMode('material');
        }
    }, [initialMaterialImage]);

    // Handlers for InsertBuildingTab
    const handleInsertHistoryClear = () => setInsertHistory([]);
    
    const handleInsertGenerationComplete = (prompt: string, images: string[]) => {
        const newItem: RenderHistoryItem = {
            id: Date.now().toString(),
            prompt,
            images,
            timestamp: Date.now().toString(),
        };
        setInsertHistory(prev => [newItem, ...prev].slice(0, 20));
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

    const handleStartNewRenderFlow = (sourceImage: SourceImage) => {
         handleEditRequestFromInsert(sourceImage);
    };

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('moodboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'moodboard'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🎨 Tạo 3D từ Moodboard
                </button>
                <button
                    onClick={() => setActiveMode('insert')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'insert'
                            ? 'bg-brand-secondary text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🏗️ Chèn Công Trình
                </button>
                <button
                    onClick={() => setActiveMode('material')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'material'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🧱 Thay Đổi Vật Liệu
                </button>
                <button
                    onClick={() => setActiveMode('furniture')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'furniture'
                            ? 'bg-brand-secondary text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🛋️ Sắp Đặt Nội Thất
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
                        history={insertHistory}
                        onClearHistory={handleInsertHistoryClear}
                        onGenerationComplete={handleInsertGenerationComplete}
                        onEditRequest={handleEditRequestFromInsert}
                        onStartNewRenderFlow={handleStartNewRenderFlow}
                    />
                )}
                {activeMode === 'material' && (
                    <MaterialChangeTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest}
                        initialImage={initialMaterialImage || null}
                        onClearInitialImage={onClearInitialMaterialImage || (() => {})}
                    />
                )}
                {activeMode === 'furniture' && (
                    <FurnitureArrangementTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest}
                    />
                )}
            </div>
        </div>
    );
};
