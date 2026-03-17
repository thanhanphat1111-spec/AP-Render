
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ImageFile } from '../types';
import { WatermarkRemovalTab } from './WatermarkRemovalTab';
import { VirtualTourTab } from './VirtualTourTab';

type Utility = 'watermark' | 'virtual_tour';

interface UtilitiesTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialUtility: { image: ImageFile; utility: string } | null;
  onClearInitialUtility: () => void;
}

const UTILITIES_CONFIG = [
    { id: 'virtual_tour', label: 'Tham quan ảo 360', component: VirtualTourTab as React.FC<any>, isReady: true },
    { id: 'watermark', label: 'Xoá Watermark', component: WatermarkRemovalTab as React.FC<any>, isReady: true },
];


export const UtilitiesTab: React.FC<UtilitiesTabProps> = ({ onEditRequest, onVideoRequest, initialUtility, onClearInitialUtility }) => {
    const [activeUtility, setActiveUtility] = useState<Utility | null>(null);

    useEffect(() => {
        if (initialUtility) {
            setActiveUtility(initialUtility.utility as Utility);
        }
    }, [initialUtility]);

    const handleUtilitySelect = (utility: Utility, isReady: boolean) => {
        if (isReady) {
            setActiveUtility(utility);
        } else {
            alert(`Tính năng "${UTILITIES_CONFIG.find(u => u.id === utility)?.label}" đang được phát triển.`);
        }
    };
    
    if (activeUtility) {
        const selectedUtility = UTILITIES_CONFIG.find(u => u.id === activeUtility);
        const Component = selectedUtility?.component;

        if (Component) {
            return (
                <div>
                    <button 
                        onClick={() => setActiveUtility(null)}
                        className="mb-4 text-sm font-medium transition-colors text-brand-text-muted hover:text-brand-accent flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                        Quay lại Tiện ích khác
                    </button>
                    <Component 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest}
                        initialImage={initialUtility && initialUtility.utility === activeUtility ? initialUtility.image : null}
                        onClearInitialImage={onClearInitialUtility}
                     />
                </div>
            );
        }
    }


    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Tiện Ích Khác">
                <p className="text-center mb-6 text-brand-text-muted">
                    Các công cụ hỗ trợ chuyên sâu cho kiến trúc sư & nhà thiết kế.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {UTILITIES_CONFIG.map(util => (
                        <button 
                            key={util.id}
                            onClick={() => handleUtilitySelect(util.id as Utility, util.isReady)}
                            className="w-full h-full p-4 bg-brand-primary hover:bg-brand-accent/80 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center text-center aspect-video disabled:opacity-50 disabled:cursor-not-allowed flex-col gap-2"
                        >
                           {util.label}
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
};