
import React, { useState } from 'react';
import { ThreeDToTwoDTab } from './ThreeDToTwoDTab';
import { FurnitureDetailingTab } from './FurnitureDetailingTab';
import { ImageFile } from '../types';

interface BV2DTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

type Mode = '3d_to_2d' | 'furniture';

export const BV2DTab: React.FC<BV2DTabProps> = ({ onEditRequest, onVideoRequest }) => {
    const [activeMode, setActiveMode] = useState<Mode>('3d_to_2d');

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('3d_to_2d')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === '3d_to_2d'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    📐 Biến 3D → 2D Kỹ thuật
                </button>
                <button
                    onClick={() => setActiveMode('furniture')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'furniture'
                            ? 'bg-brand-secondary text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🪑 Triển khai sản phẩm nội thất
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px] animate-fade-in">
                {activeMode === '3d_to_2d' && (
                    <ThreeDToTwoDTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest} 
                    />
                )}
                {activeMode === 'furniture' && (
                    <FurnitureDetailingTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest}
                    />
                )}
            </div>
        </div>
    );
};
