
import React, { useState, useEffect } from 'react';
import { VideoTab } from './VideoTab';
import { MultiVideoTab } from './MultiVideoTab';
import { InteriorConstructionVideoTab } from './InteriorConstructionVideoTab';
import { ImageFile } from '../types';

interface MovieTabProps {
  onEditRequest: (image: ImageFile) => void;
  initialImage: ImageFile | null;
  onClearInitialImage: () => void;
}

type VideoMode = 'single' | 'multi' | 'construction';

export const MovieTab: React.FC<MovieTabProps> = ({ onEditRequest, initialImage, onClearInitialImage }) => {
  const [mode, setMode] = useState<VideoMode>('single');

  // If an initial image is passed (e.g., from another tab), default to Single Video mode
  // as it is the direct workflow for "Create Video" from an image.
  useEffect(() => {
    if (initialImage) {
      setMode('single');
    }
  }, [initialImage]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation for Video Modes */}
      <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
        <button
          onClick={() => setMode('single')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            mode === 'single'
              ? 'bg-brand-accent text-white shadow-lg scale-105'
              : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
          }`}
        >
          🎥 Tạo Video Đơn
        </button>
        <button
          onClick={() => setMode('multi')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            mode === 'multi'
              ? 'bg-brand-accent text-white shadow-lg scale-105'
              : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
          }`}
        >
          🎬 Tạo Nhiều Video (Story)
        </button>
        <button
          onClick={() => setMode('construction')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            mode === 'construction'
              ? 'bg-brand-secondary text-white shadow-lg scale-105'
              : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
          }`}
        >
          🏗️ Video Dựng Nội Thất
        </button>
      </div>

      {/* Render Active Component */}
      <div className="min-h-[600px]">
        {mode === 'single' && (
          <VideoTab 
            onEditRequest={onEditRequest} 
            initialImage={initialImage} 
            onClearInitialImage={onClearInitialImage} 
          />
        )}
        {mode === 'multi' && (
          <MultiVideoTab />
        )}
        {mode === 'construction' && (
            <InteriorConstructionVideoTab />
        )}
      </div>
    </div>
  );
};
