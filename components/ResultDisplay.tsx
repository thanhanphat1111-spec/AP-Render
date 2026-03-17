
import React, { useState, useEffect } from 'react';
import { AiServiceResult, ImageFile } from '../types';
import { ImageComparator } from './ImageComparator';
import { PanoramaViewer } from './PanoramaViewer';
import { DownloadDialog } from './DownloadDialog';

// --- ICONS ---
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const ZoomIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const AngleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l3 3 12 12"/><path d="M3 12h3"/><path d="M18 21v-3"/><path d="M21 12h-3"/><path d="M18 3v3"/><path d="M12 3h-3"/><path d="M9 3a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-3"/></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const ReplaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>;
const StyleChangeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15c0-4.42-3.58-8-8-8-3.46 0-6.42 2.19-7.54 5.15"/><path d="M19.65 18.65c-1.32.8-2.93 1.3-4.65 1.3-4.42 0-8-3.58-8-8 0-.6.07-1.18.2-1.74"/><path d="M4 6h1v4"/><path d="M8 3v1m8 18v-1"/><path d="M12 3v1m-3.5 15.5L10 17"/><path d="m3 14 1.5-1.5M21 10h-1M5 10H4m9 11v-1m3.5-1.5L14 17"/></svg>;
const TopDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l10 6l-10 6l-10-6z"/><path d="M22 9l-10 6l-10-6"/><path d="M22 14l-10 6l-10-6"/></svg>;
const MaterialIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;


interface AngleOption {
    label: string;
    modifier: string;
}

const DEFAULT_ANGLE_OPTIONS: AngleOption[] = [
  { label: 'Góc rộng (Wide)', modifier: 'Chụp lại từ góc rộng (wide-angle shot), bao quát hơn không gian.' },
  { label: 'Trên cao (Bird-eye)', modifier: 'Chụp lại từ góc nhìn trên cao (bird-eye view).' },
  { label: 'Cận cảnh chi tiết (Close-up)', modifier: 'Chụp lại cận cảnh (close-up) một chi tiết kiến trúc hoặc nội thất đặc sắc.' },
  { label: 'Tầm mắt (Eye-level)', modifier: 'Chụp lại từ góc nhìn ngang tầm mắt, tạo cảm giác chân thực như đang đứng trong không gian.' },
  { label: 'Góc thấp (Low-angle)', modifier: 'Chụp lại từ một góc thấp hướng lên, nhấn mạnh sự hùng vĩ và chiều cao của công trình/trần nhà.' },
  { label: 'Góc chéo (Dutch-angle)', modifier: 'Chụp lại từ một góc chéo để tạo cảm giác năng động và nghệ thuật.' },
  { label: 'Từ cửa (Doorway view)', modifier: 'Chụp lại từ khung cửa, tạo chiều sâu và sự mời gọi vào không gian.' },
  { label: 'Qua vai (Over-the-shoulder)', modifier: 'Chụp lại qua một vật thể ở tiền cảnh (ví dụ: sofa, bàn) để tăng chiều sâu cho ảnh.' },
  { label: 'Ảnh Panorama', modifier: 'Tái tạo lại dưới dạng một ảnh panorama, kéo dài theo chiều ngang.' },
];

const AngleActions: React.FC<{ options: AngleOption[] }> = ({ options }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleActionClick = (modifier: string) => {
        document.dispatchEvent(new CustomEvent('regenerateRequest', { detail: { modifier } }));
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                title="Đổi góc chụp"
                className="p-2.5 rounded-full bg-brand-surface/80 hover:bg-brand-accent text-white transition-colors border border-white/10"
            >
                <AngleIcon />
            </button>
            {isOpen && (
                 <div className="absolute right-0 bottom-full mb-2 w-56 bg-brand-surface border border-white/10 rounded-xl shadow-2xl p-2 z-20 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md">
                    <ul className="space-y-1">
                        {options.map(opt => (
                            <li key={opt.label}>
                                <button 
                                    onClick={() => handleActionClick(opt.modifier)}
                                    className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-brand-text"
                                >
                                    {opt.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

interface ResultDisplayProps {
  result: AiServiceResult | null;
  isLoading: boolean;
  onEditRequest?: (image: ImageFile) => void;
  onVideoRequest?: (image: ImageFile) => void;
  onReplaceRequest?: (imageUrl: string) => void;
  onStyleChangeRequest?: (image: ImageFile, type: 'exterior' | 'interior') => void;
  onMaterialChangeRequest?: (image: ImageFile) => void;
  onGenerateTopDownRequest?: (image: ImageFile) => void;
  onImageChange?: (url: string, index: number) => void;
  styleChangeType?: 'exterior' | 'interior';
  comparisonImage?: string;
  showAngleActions?: boolean;
  angleOptions?: AngleOption[];
  loadingMessage?: string;
  isPanorama?: boolean;
  middleContent?: React.ReactNode;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, 
  isLoading, 
  onEditRequest, 
  onVideoRequest, 
  onReplaceRequest, 
  onStyleChangeRequest, 
  onMaterialChangeRequest, 
  onGenerateTopDownRequest, 
  onImageChange,
  styleChangeType, 
  comparisonImage, 
  showAngleActions = false, 
  angleOptions = DEFAULT_ANGLE_OPTIONS, 
  loadingMessage, 
  isPanorama = false,
  middleContent
}) => {
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  // Download Dialog State
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadImageTarget, setDownloadImageTarget] = useState<string | null>(null);

  useEffect(() => {
    if (result?.imageUrls && result.imageUrls.length > 0) {
      const url = result.imageUrls[0];
      setSelectedImageUrl(url);
      if (onImageChange) onImageChange(url, 0);
    } else {
      setSelectedImageUrl(null);
    }
  }, [result]);

  const handleDownloadClick = (dataUrl: string) => {
      setDownloadImageTarget(dataUrl);
      setIsDownloadDialogOpen(true);
  };

  const handleVideoDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ap-render-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (dataUrl: string) => {
    if (onEditRequest) {
      const file = dataURLtoFile(dataUrl, 'edit-image.png');
      const imageFile: ImageFile = { file, base64: dataUrl, url: dataUrl };
      onEditRequest(imageFile);
    }
  };
  
  const handleVideo = (dataUrl: string) => {
    if (onVideoRequest) {
      const file = dataURLtoFile(dataUrl, 'video-source.png');
      const imageFile: ImageFile = { file, base64: dataUrl, url: dataUrl };
      onVideoRequest(imageFile);
    }
  };

  const handleReplace = (dataUrl: string) => {
    if (onReplaceRequest) {
      onReplaceRequest(dataUrl);
    }
  };

  const handleStyleChange = (dataUrl: string) => {
    if (onStyleChangeRequest && styleChangeType) {
      const file = dataURLtoFile(dataUrl, 'style-change-source.png');
      const imageFile: ImageFile = { file, base64: dataUrl, url: dataUrl };
      onStyleChangeRequest(imageFile, styleChangeType);
    }
  };

  const handleMaterialChange = (dataUrl: string) => {
      if (onMaterialChangeRequest) {
          const file = dataURLtoFile(dataUrl, 'material-change-source.png');
          const imageFile: ImageFile = { file, base64: dataUrl, url: dataUrl };
          onMaterialChangeRequest(imageFile);
          setZoomedImageUrl(null);
      }
  };

  const handleTopDown = (dataUrl: string) => {
    if (onGenerateTopDownRequest) {
        const file = dataURLtoFile(dataUrl, 'topdown-source.png');
        const imageFile: ImageFile = { file, base64: dataUrl, url: dataUrl };
        onGenerateTopDownRequest(imageFile);
    }
  };

  const handleSelectImageFromGallery = (url: string, index: number) => {
      setSelectedImageUrl(url);
      if (onImageChange) onImageChange(url, index);
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-brand-text-muted">
              <div className="w-12 h-12 border-4 border-brand-primary border-t-brand-accent rounded-full animate-spin"></div>
              <p className="text-sm text-center px-4 font-medium animate-pulse">{loadingMessage || 'Đang xử lý...'}</p> 
            </div>
       );
    }
    if (!result) {
       return (
            <div className="text-center text-brand-text-muted flex flex-col items-center">
              <div className="p-4 bg-white/5 rounded-full mb-3">
                  <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <p className="text-sm">Kết Quả sẽ hiển thị ở đây</p>
            </div>
          );
    }

    if (result.videoUrl) {
        return (
             <div className="w-full h-full relative group overflow-hidden bg-black rounded-lg flex flex-col items-center justify-center border border-white/10">
                 {result.isSimulation && (
                   <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 rounded z-10 backdrop-blur-sm">
                       SIMULATION
                   </div>
                )}
                <video
                    src={result.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full object-contain"
                >
                    Your browser does not support the video tag.
                </video>
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => handleVideoDownload(result.videoUrl!)} title="Tải xuống video" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"><DownloadIcon /></button>
                </div>
             </div>
        )
    }

    if (result.batchResults && result.batchResults.length > 0) {
        return (
             <div className="w-full h-full bg-brand-bg/20 rounded-lg overflow-hidden flex flex-col">
                <div className="flex-grow overflow-y-auto p-2 space-y-4 custom-scrollbar">
                    {result.batchResults.map((item, idx) => (
                        <div key={idx} className="bg-brand-surface/50 rounded-xl p-2 border border-white/10">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs font-bold text-white truncate max-w-[70%]" title={item.label}>{item.label || `Kết quả ${idx + 1}`}</span>
                                <div className="flex gap-1">
                                     <button onClick={() => handleDownloadClick(item.resultUrl)} className="p-1.5 hover:bg-white/10 rounded-lg text-brand-text-muted hover:text-white transition-colors" title="Tải xuống"><DownloadIcon /></button>
                                     <button onClick={() => setZoomedImageUrl(item.resultUrl)} className="p-1.5 hover:bg-white/10 rounded-lg text-brand-text-muted hover:text-white transition-colors" title="Phóng to"><ZoomIcon /></button>
                                </div>
                            </div>
                            <div className="aspect-video relative rounded-lg overflow-hidden border border-white/5 h-64 shadow-lg">
                                <ImageComparator before={item.sourceUrl} after={item.resultUrl} />
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        );
    }

    if (result.imageUrls && result.imageUrls.length > 0) {
        const showComparator = comparisonImage && selectedImageUrl && !isPanorama;
        return (
            <div className="w-full h-full relative group overflow-hidden bg-black/40 rounded-lg border border-white/5">
                {result.isSimulation && (
                   <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 rounded z-10 backdrop-blur-sm">
                       SIMULATION
                   </div>
                )}
                {selectedImageUrl && (
                    <>
                       {isPanorama ? (
                            <PanoramaViewer imageUrl={selectedImageUrl} />
                        ) : showComparator ? (
                            <ImageComparator before={comparisonImage} after={selectedImageUrl} />
                        ) : (
                            <img
                                src={selectedImageUrl}
                                alt="Selected result"
                                className="object-contain w-full h-full"
                            />
                        )}
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/10">
                            <button onClick={() => setZoomedImageUrl(selectedImageUrl)} title="Phóng to" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"><ZoomIcon /></button>
                            <button onClick={() => handleDownloadClick(selectedImageUrl)} title="Tải xuống" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"><DownloadIcon /></button>
                            {onReplaceRequest && <button onClick={() => handleReplace(selectedImageUrl)} title="Thay thế ảnh gốc" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"><ReplaceIcon /></button>}
                            <button onClick={() => handleEdit(selectedImageUrl)} title="Chỉnh sửa" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white" disabled={!onEditRequest}><EditIcon /></button>
                            {onStyleChangeRequest && styleChangeType && (
                                <button onClick={() => handleStyleChange(selectedImageUrl)} title="Đổi Style" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
                                    <StyleChangeIcon />
                                </button>
                            )}
                            {onGenerateTopDownRequest && (
                                <button onClick={() => handleTopDown(selectedImageUrl)} title="Tạo phối cảnh mặt bằng" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
                                    <TopDownIcon />
                                </button>
                            )}
                            <button onClick={() => handleVideo(selectedImageUrl)} title="Tạo video" className="p-2 rounded-full hover:bg-white/20 transition-colors text-white" disabled={!onVideoRequest}><VideoIcon /></button>
                        </div>
                        {showAngleActions && (
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <AngleActions options={angleOptions} />
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }
    
    if (result.text || result.error) {
        return (
            <div className="p-6 text-left text-sm text-brand-text max-w-full overflow-auto bg-black/20 rounded-lg h-full border border-white/5">
              {result.isSimulation && <p className="font-bold text-yellow-400 mb-2 text-xs">SIMULATION MODE</p>}
              {result.error && <p className="font-bold text-red-400 mb-2 flex items-center gap-2"><span className="text-lg">⚠</span> Error</p>}
              <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed opacity-90">{result.text || result.error}</p>
            </div>
        );
    }
    return <div className="flex items-center justify-center h-full text-brand-text-muted">No result to display.</div>;
  }

  return (
    <>
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 rounded-2xl p-2 h-[480px] flex items-center justify-center ring-1 ring-white/5">
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-black/20">
         {renderContent()}
        </div>
      </div>
      
      {/* Optional middle content (Selection tool, etc) */}
      {middleContent && <div className="mt-4">{middleContent}</div>}

      {/* New Gallery Frame Below */}
      {result?.imageUrls && (result.imageUrls.length > 1 || result.batchResults) && (
        <div className="mt-4 bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-4">
            <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3">Thư viện kết quả</h4>
            <div className="flex flex-wrap gap-3">
                {/* Handle standard multi-image result */}
                {!result.batchResults && result.imageUrls.map((url, index) => (
                    <div key={index} className="w-20 h-20 flex-shrink-0 cursor-pointer group" onClick={() => handleSelectImageFromGallery(url, index)}>
                        <img 
                            src={url} 
                            alt={`Result ${index + 1}`} 
                            className={`w-full h-full object-cover rounded-lg transition-all ${selectedImageUrl === url ? 'ring-2 ring-brand-accent ring-offset-2 ring-offset-slate-900' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}
                        />
                    </div>
                ))}
                
                {/* Handle batch results (multi-view) */}
                {result.batchResults && result.batchResults.map((item, index) => (
                     <div key={index} className="w-20 h-auto flex flex-col items-center cursor-pointer group" onClick={() => {
                         setZoomedImageUrl(item.resultUrl);
                     }}>
                        <div className="w-20 h-20 mb-1 rounded-lg overflow-hidden border border-white/10">
                            <img 
                                src={item.resultUrl} 
                                alt={item.label} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                        </div>
                        <span className="text-[9px] text-brand-text-muted truncate w-full text-center group-hover:text-white">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {zoomedImageUrl && (
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            onClick={() => setZoomedImageUrl(null)}
          >
              <img 
                src={zoomedImageUrl} 
                alt="Zoomed result" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
              />
              <button 
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
                onClick={() => setZoomedImageUrl(null)}
                aria-label="Close zoomed image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              {/* Action Buttons Overlay */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  {onMaterialChangeRequest && (
                      <button 
                        onClick={() => handleMaterialChange(zoomedImageUrl)}
                        className="bg-brand-primary/90 hover:bg-brand-accent text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 backdrop-blur-md border border-white/10"
                      >
                          <MaterialIcon />
                          <span className="text-sm font-medium">Đổi Vật Liệu</span>
                      </button>
                  )}
                  <button 
                    onClick={() => handleDownloadClick(zoomedImageUrl)}
                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 backdrop-blur-md border border-white/10"
                  >
                      <DownloadIcon />
                      <span className="text-sm font-medium">Tải xuống</span>
                  </button>
              </div>
          </div>
      )}

      {/* Download Dialog */}
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
