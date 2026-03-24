import React, { useState } from 'react';
import { AiServiceResult, ImageFile } from '../types';
import { ImageComparator } from './ImageComparator';
import { PanoramaViewer } from './PanoramaViewer';
import { DownloadDialog } from './DownloadDialog';

// --- ICONS ---
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const MaterialIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;

interface ResultDisplayProps {
  result: AiServiceResult | null;
  onEditRequest?: (image: ImageFile) => void;
  onMaterialChangeRequest?: (image: ImageFile) => void;
  originalImage?: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onEditRequest, onMaterialChangeRequest, originalImage }) => {
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadImageTarget, setDownloadImageTarget] = useState<string | null>(null);

  if (!result || !result.imageUrls || result.imageUrls.length === 0) return null;

  const imageUrl = result.imageUrls[0];

  const handleDownloadClick = (url: string) => {
      setDownloadImageTarget(url);
      setIsDownloadDialogOpen(true);
  };

  // HÀM CHUYỂN ĐỔI URL THÀNH IMAGE FILE ĐỂ TRUYỀN CHO CÁC TAB KHÁC
  const executeActionWithImageFile = async (action: (img: ImageFile) => void, url: string) => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], `render_result_${Date.now()}.png`, { type: blob.type });
          
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => {
              const base64data = (reader.result as string).split(',')[1];
              action({
                  file: file,
                  base64: base64data,
                  url: url
              });
          };
      } catch (error) {
          console.error("Lỗi khi chuyển đổi ảnh:", error);
          alert("Không thể tải ảnh để chỉnh sửa. Vui lòng thử lại.");
      }
  };

  return (
    <>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 group">
          {originalImage ? (
              <ImageComparator before={originalImage} after={imageUrl} />
          ) : (
              <img src={imageUrl} alt="Render Result" className="w-full h-full object-contain" />
          )}

          {/* Dàn nút chức năng nổi lên khi hover */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
              {onEditRequest && (
                  <button 
                    onClick={() => executeActionWithImageFile(onEditRequest, imageUrl)}
                    className="bg-brand-secondary/90 hover:bg-brand-accent text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 backdrop-blur-md border border-white/10"
                  >
                      <EditIcon />
                      <span className="text-sm font-medium">Chỉnh sửa</span>
                  </button>
              )}
              {onMaterialChangeRequest && (
                  <button 
                    onClick={() => executeActionWithImageFile(onMaterialChangeRequest, imageUrl)}
                    className="bg-brand-primary/90 hover:bg-brand-accent text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 backdrop-blur-md border border-white/10"
                  >
                      <MaterialIcon />
                      <span className="text-sm font-medium">Đổi Vật Liệu</span>
                  </button>
              )}
              <button 
                onClick={() => handleDownloadClick(imageUrl)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 backdrop-blur-md border border-white/10"
              >
                  <DownloadIcon />
                  <span className="text-sm font-medium">Tải xuống</span>
              </button>
          </div>
      </div>

      {isDownloadDialogOpen && downloadImageTarget && (
          <DownloadDialog 
            isOpen={isDownloadDialogOpen}
            imageUrl={downloadImageTarget}
            onClose={() => setIsDownloadDialogOpen(false)}
          />
      )}
    </>
  );
};
