
import React, { useState, useCallback } from 'react';
import { Icon } from '../components/icons';
import { generateVirtualTourImage, TourMoveType } from '../services/geminiService';
import type { SourceImage, ImageFile } from '../types';

// --- Local Reusable Components for this Tab ---
// These mirror the functionality of the "RenderCommon" components provided in the prompt
// but use the project's existing utilities/structure where possible.

const Section: React.FC<{ title: string; children: React.ReactNode; titleExtra?: React.ReactNode }> = ({ title, children, titleExtra }) => (
  <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] shadow-2xl shadow-[var(--shadow-color)] p-6 rounded-xl mb-6">
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        {titleExtra}
    </div>
    {children}
  </div>
);

const ImageUpload: React.FC<{
  sourceImage: SourceImage | null;
  onImageUpload: (image: SourceImage) => void;
  onRemove: () => void;
  title?: string;
  heightClass?: string;
}> = ({ sourceImage, onImageUpload, onRemove, title = "Nhấp hoặc kéo tệp vào đây", heightClass = 'h-48' }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            if (base64) {
              onImageUpload({ base64, mimeType: file.type });
            }
        };
        reader.readAsDataURL(file);
    } else {
        alert("Vui lòng tải lên một tệp ảnh hợp lệ (PNG, JPG, WEBP).");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group border-2 border-dashed rounded-lg p-4 flex items-center justify-center ${heightClass} mb-4 hover:border-brand-accent transition-colors cursor-pointer ${isDraggingOver ? 'border-brand-accent bg-brand-surface' : 'border-brand-primary'}`}
        onClick={() => fileInputRef.current?.click()}
      >
        {sourceImage ? (
          <>
            <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="Source" className="max-h-full max-w-full object-contain rounded" />
            <button
                onClick={handleRemove}
                className="absolute top-1 right-1 bg-black/50 rounded-full text-white hover:bg-black/80 p-0.5 transition-colors opacity-0 group-hover:opacity-100 z-10"
                aria-label="Remove source image"
            >
                <Icon name="x-circle" className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="text-center text-brand-text-muted pointer-events-none">
            <p>{title}</p>
            <p className="text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
    </div>
  );
};

// Button điều hướng đặc thù cho Virtual Tour
const ControlButton: React.FC<{ icon: string; label: string; onClick: () => void; disabled: boolean; title: string; }> = ({ icon, label, onClick, disabled, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[var(--bg-surface-2)] rounded-lg hover:bg-brand-primary/50 text-[var(--text-primary)] hover:text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full h-full aspect-square shadow-sm hover:shadow-md border border-brand-primary/30"
        title={title}
    >
        <Icon name={icon} className="w-8 h-8"/>
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

// Modal xem ảnh full màn hình cho Virtual Tour
const VirtualTourViewer: React.FC<{ imageUrl: string; onClose: () => void; }> = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-surface-4)] border border-[var(--border-1)] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-brand-accent text-white rounded-full p-2 hover:bg-brand-accent/80 transition-transform duration-200 hover:scale-110 z-10 shadow-lg"
          aria-label="Close"
        >
          <Icon name="x-circle" className="w-6 h-6" />
        </button>
        <div className="p-2 flex-grow overflow-hidden flex items-center justify-center bg-black rounded-lg">
            <img src={imageUrl} alt="Fullscreen view" className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </div>
  );
};

interface VirtualTourTabProps {
  onEditRequest: (image: ImageFile) => void;
}

export const VirtualTourTab: React.FC<VirtualTourTabProps> = ({ onEditRequest }) => {
    const [currentImage, setCurrentImage] = useState<SourceImage | null>(null);
    const [undoStack, setUndoStack] = useState<SourceImage[]>([]);
    const [redoStack, setRedoStack] = useState<SourceImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [magnitude, setMagnitude] = useState<15 | 30 | 45>(30);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleImageUpload = (image: SourceImage) => {
        setCurrentImage(image);
        setUndoStack([]);
        setRedoStack([]);
    };

    const handleRemoveImage = () => {
        setCurrentImage(null);
        setUndoStack([]);
        setRedoStack([]);
    };

    const handleNavigate = useCallback(async (moveType: TourMoveType) => {
        if (!currentImage) {
            alert("Vui lòng tải lên ảnh để bắt đầu chuyến tham quan.");
            return;
        }

        setIsLoading(true);
        const messages: Record<TourMoveType, string> = {
            'pan-up': 'Đang nghiêng camera lên...',
            'pan-down': 'Đang nghiêng camera xuống...',
            'pan-left': 'Đang xoay camera sang trái...',
            'pan-right': 'Đang xoay camera sang phải...',
            'orbit-left': 'Đang di chuyển quanh đối tượng...',
            'orbit-right': 'Đang di chuyển quanh đối tượng...',
            'zoom-in': 'Đang phóng to...',
            'zoom-out': 'Đang thu nhỏ...'
        };
        setLoadingMessage(messages[moveType]);

        try {
            const newImageSrc = await generateVirtualTourImage(currentImage, moveType, magnitude);
            if (newImageSrc) {
                const newImage: SourceImage = {
                    base64: newImageSrc.split(',')[1],
                    mimeType: newImageSrc.match(/data:(image\/[a-z]+);/)?.[1] || 'image/png'
                };
                setUndoStack(prev => [...prev, currentImage]);
                setCurrentImage(newImage);
                setRedoStack([]); // Hành động mới sẽ xóa redo stack
            } else {
                throw new Error("AI không thể tạo ảnh cho hướng di chuyển này.");
            }
        } catch (error) {
            console.error("Virtual tour navigation failed:", error);
            alert(`Đã xảy ra lỗi: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentImage, magnitude]);
    
    const handleUndo = () => {
        if (undoStack.length > 0) {
            const newUndoStack = [...undoStack];
            const previousImage = newUndoStack.pop();
            setRedoStack(prev => [currentImage!, ...prev]);
            setCurrentImage(previousImage!);
            setUndoStack(newUndoStack);
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const newRedoStack = [...redoStack];
            const nextImage = newRedoStack.shift();
            setUndoStack(prev => [...prev, currentImage!]);
            setCurrentImage(nextImage!);
            setRedoStack(newRedoStack);
        }
    };
    
    const handleEdit = () => {
        if (currentImage) {
            const file = new File([], 'virtual_tour.png', { type: currentImage.mimeType });
            const imageFile: ImageFile = {
                file,
                base64: `data:${currentImage.mimeType};base64,${currentImage.base64}`,
                url: `data:${currentImage.mimeType};base64,${currentImage.base64}`
            };
            onEditRequest(imageFile);
        }
    };

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Input & Controls */}
            <div className="lg:col-span-1 flex flex-col gap-8">
                <Section title="1. Điểm Bắt Đầu">
                    <ImageUpload
                        sourceImage={currentImage}
                        onImageUpload={handleImageUpload}
                        onRemove={handleRemoveImage}
                        title="Tải ảnh góc nhìn đầu tiên"
                        heightClass="h-48"
                    />
                </Section>
                {currentImage && (
                    <Section title="2. Điều Khiển Camera">
                        <div className="space-y-6">
                             <div>
                                <label className="block text-sm font-medium text-brand-text-muted mb-2">Góc độ di chuyển</label>
                                <div className="flex items-center gap-2 bg-brand-bg rounded-md p-1">
                                    {(['15', '30', '45'] as const).map(angle => (
                                        <button 
                                            key={angle}
                                            onClick={() => setMagnitude(Number(angle) as 15 | 30 | 45)}
                                            className={`w-full text-sm font-semibold py-1.5 rounded-md transition-colors ${magnitude === Number(angle) ? 'bg-brand-accent text-white shadow' : 'bg-transparent text-brand-text hover:bg-brand-surface'}`}
                                        >
                                            {angle}°
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-brand-text-muted mt-1">Áp dụng cho Pan và Orbit.</p>
                            </div>

                             {/* Pan Controls */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase font-bold text-brand-text-muted tracking-wider text-center">Pan (Xoay tại chỗ)</h3>
                                <div className="grid grid-cols-3 gap-2 p-2 bg-brand-bg/30 rounded-lg border border-brand-primary/30">
                                    <div />
                                    <ControlButton icon="arrow-up-circle" label="Lên" onClick={() => handleNavigate('pan-up')} disabled={isLoading} title="Nghiêng lên" />
                                    <div />
                                    <ControlButton icon="arrow-uturn-left" label="Trái" onClick={() => handleNavigate('pan-left')} disabled={isLoading} title="Xoay trái" />
                                    <div className="flex items-center justify-center">
                                      <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center border border-brand-primary">
                                        <Icon name="mouse-pointer" className="w-6 h-6 text-brand-text-muted" />
                                      </div>
                                    </div>
                                    <ControlButton icon="arrow-uturn-left" label="Phải" onClick={() => handleNavigate('pan-right')} disabled={isLoading} title="Xoay phải" />
                                    <div />
                                    <ControlButton icon="arrow-down-circle" label="Xuống" onClick={() => handleNavigate('pan-down')} disabled={isLoading} title="Nghiêng xuống" />
                                    <div />
                                </div>
                            </div>
                            
                            {/* Orbit & Zoom Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h3 className="text-xs uppercase font-bold text-brand-text-muted tracking-wider text-center">Orbit (Quỹ đạo)</h3>
                                    <div className="grid grid-cols-2 gap-2 p-2 bg-brand-bg/30 rounded-lg border border-brand-primary/30 h-full">
                                        <ControlButton icon="arrow-uturn-left" label="Vòng Trái" onClick={() => handleNavigate('orbit-left')} disabled={isLoading} title="Đi vòng sang trái" />
                                        <ControlButton icon="arrow-uturn-left" label="Vòng Phải" onClick={() => handleNavigate('orbit-right')} disabled={isLoading} title="Đi vòng sang phải" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xs uppercase font-bold text-brand-text-muted tracking-wider text-center">Zoom</h3>
                                    <div className="grid grid-cols-2 gap-2 p-2 bg-brand-bg/30 rounded-lg border border-brand-primary/30 h-full">
                                        <ControlButton icon="plus-circle" label="Gần Lại" onClick={() => handleNavigate('zoom-in')} disabled={isLoading} title="Phóng to" />
                                        <ControlButton icon="plus-circle" label="Ra Xa" onClick={() => handleNavigate('zoom-out')} disabled={isLoading} title="Thu nhỏ" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-primary/30">
                                <button
                                    onClick={handleUndo}
                                    disabled={isLoading || undoStack.length === 0}
                                    className="w-full bg-brand-surface hover:bg-brand-primary text-white font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon name="arrow-uturn-left" className="w-4 h-4" />
                                    Hoàn Tác
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={isLoading || redoStack.length === 0}
                                    className="w-full bg-brand-surface hover:bg-brand-primary text-white font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon name="arrow-uturn-left" className="w-4 h-4 rotate-180" />
                                    Làm Lại
                                </button>
                            </div>
                        </div>
                    </Section>
                )}
            </div>

            {/* Right Column: Viewport */}
            <div className="lg:col-span-2">
                <Section title="Khung Cảnh Hiện Tại">
                    <div className="w-full aspect-video bg-black/20 rounded-lg flex items-center justify-center min-h-[400px] lg:min-h-[600px] relative overflow-hidden group border border-brand-primary/30">
                       {isLoading && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
                                <p className="font-semibold text-lg text-white animate-pulse">{loadingMessage}</p>
                            </div>
                        )}
                        {currentImage ? (
                            <>
                                <img 
                                    src={`data:${currentImage.mimeType};base64,${currentImage.base64}`} 
                                    alt="Current view" 
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                />
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                     <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-brand-surface/90 backdrop-blur-md border border-brand-primary hover:bg-brand-primary text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg"
                                        title="Xem Toàn Màn Hình"
                                    >
                                        <Icon name="arrows-pointing-out" className="w-4 h-4" />
                                        <span>Phóng To</span>
                                    </button>
                                     <button
                                        onClick={handleEdit}
                                        className="bg-brand-surface/90 backdrop-blur-md border border-brand-primary hover:bg-brand-primary text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg"
                                        title="Chỉnh Sửa Ảnh Này"
                                    >
                                        <Icon name="pencil" className="w-4 h-4" />
                                        <span>Sửa Ảnh</span>
                                    </button>
                                     <a
                                        href={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
                                        download={`nbox-ai-tour-${Date.now()}.png`}
                                        className="bg-brand-surface/90 backdrop-blur-md border border-brand-primary hover:bg-brand-primary text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg"
                                        aria-label="Tải ảnh"
                                        title="Tải ảnh về"
                                    >
                                        <Icon name="download" className="w-4 h-4" />
                                        <span>Tải Về</span>
                                    </a>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
                                    Bước: {undoStack.length + 1}
                                </div>
                            </>
                        ) : (
                             <div className="text-center text-brand-text-muted flex flex-col items-center">
                                <div className="p-4 bg-brand-bg/50 rounded-full mb-4 border border-brand-primary/30">
                                    <Icon name="mouse-pointer" className="w-12 h-12 opacity-50" />
                                </div>
                                <p className="text-lg font-medium text-brand-text-muted">Sẵn sàng khởi hành</p>
                                <p className="text-sm mt-1">Vui lòng tải ảnh ở mục bên trái để bắt đầu chuyến tham quan.</p>
                            </div>
                        )}
                    </div>
                </Section>
            </div>
        </div>
        {isModalOpen && currentImage && (
            <VirtualTourViewer
                imageUrl={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
                onClose={() => setIsModalOpen(false)}
            />
        )}
      </>
    );
};