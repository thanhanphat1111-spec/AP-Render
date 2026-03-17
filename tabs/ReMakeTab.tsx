
import React, { useState, useEffect } from 'react';
import { InteriorStyleChangeTab } from './InteriorStyleChangeTab';
import { StyleTransferTab } from './StyleTransferTab';
import { LightingSetupTab } from './LightingSetupTab';
import { ImageFile } from '../types';

interface ReMakeTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  // initialData handles incoming requests from other tabs (e.g. "Đổi Style")
  initialData: { image: ImageFile; mode: 'interior' | 'exterior' | 'lighting' } | null;
  onClearInitialData: () => void;
}

type ReMakeMode = 'interior' | 'exterior' | 'lighting';

export const ReMakeTab: React.FC<ReMakeTabProps> = ({ 
    onEditRequest, 
    onVideoRequest, 
    initialData, 
    onClearInitialData 
}) => {
    const [activeMode, setActiveMode] = useState<ReMakeMode>('interior');
    const [passedImage, setPassedImage] = useState<ImageFile | null>(null);

    // Handle incoming data from other tabs
    useEffect(() => {
        if (initialData) {
            setActiveMode(initialData.mode);
            setPassedImage(initialData.image);
        }
    }, [initialData]);

    // Wrapper to clear the passed image after the sub-component consumes it
    const handleClearImage = () => {
        setPassedImage(null);
        onClearInitialData();
    };

    return (
        <div className="space-y-6">
            {/* Sub-navigation for ReMake Modes */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('interior')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'interior'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🛋️ Đổi Style Nội Thất
                </button>
                <button
                    onClick={() => setActiveMode('exterior')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'exterior'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🏛️ Đổi Style Công Trình
                </button>
                <button
                    onClick={() => setActiveMode('lighting')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'lighting'
                            ? 'bg-brand-secondary text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    💡 Thiết lập Ánh Sáng
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px] animate-fade-in">
                {activeMode === 'interior' && (
                    <InteriorStyleChangeTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest} 
                        initialImage={passedImage}
                        onClearInitialImage={handleClearImage}
                    />
                )}
                {activeMode === 'exterior' && (
                    <StyleTransferTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest}
                        initialImage={passedImage}
                        onClearInitialImage={handleClearImage}
                    />
                )}
                {activeMode === 'lighting' && (
                    <LightingSetupTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest}
                        initialImage={passedImage}
                        onClearInitialImage={handleClearImage}
                    />
                )}
            </div>
        </div>
    );
};
