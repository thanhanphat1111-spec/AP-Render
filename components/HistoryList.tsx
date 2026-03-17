
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onItemSelect: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onItemSelect }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Lịch sử gần đây
      </h4>
      <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {history.map((item) => {
            // Prepare list of images to show in the strip
            const displayImages = item.imageUrls && item.imageUrls.length > 0 
                ? item.imageUrls 
                : [item.thumbnail || item.fullImage];

            return (
              <div 
                key={item.id} 
                className="bg-brand-surface/50 border border-brand-primary/30 p-3 rounded-lg hover:bg-brand-surface hover:border-brand-accent/50 transition-all cursor-pointer group"
                onClick={() => onItemSelect(item)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-grow min-w-0 mr-2">
                    <p className="font-semibold text-sm text-white truncate" title={item.prompt}>
                        {item.prompt || "Không có mô tả"}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                        {item.imageCount || displayImages.length} ảnh • {TAB_KEYS_MAP[item.category || ''] || 'Kết quả'}
                    </p>
                  </div>
                  <p className="text-[10px] text-brand-text-muted/70 whitespace-nowrap pt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar-horizontal">
                  {displayImages.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 w-16 h-16 bg-black/20 rounded overflow-hidden border border-brand-primary/20">
                        <img 
                            src={img} 
                            alt={`History thumbnail ${idx + 1}`} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                        />
                      </div>
                  ))}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

// Map generic category keys to readable labels if needed, fallback to display as is
const TAB_KEYS_MAP: Record<string, string> = {
    'exterior': 'Ngoại thất',
    'interior': 'Nội thất',
    'floorplan_interior': 'Nội thất từ 2D',
    'floorplan_coloring': '3D Nhà',
    'masterplan': 'Quy hoạch',
    'editing': 'Chỉnh sửa',
    'moodboard': 'Moodboard',
    'video': 'Video',
    'canva_mix': 'Input EX',
    'canva_mix_interior': 'Input IN',
    'embed_building': 'Chèn CT',
    'style_transfer': 'Đổi Style',
    'lighting_setup': 'Ánh sáng'
};
