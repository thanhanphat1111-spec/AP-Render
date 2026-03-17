
import React, { useState, useRef } from 'react';
import { Icon } from '../components/icons';
import type { SourceImage, RenderHistoryItem } from '../types';
import { generateImage, upscaleImage } from '../services/geminiService'; // Map to existing services
import { NumberSelector } from '../components/NumberSelector';

// --- Adapters for Service Calls ---
const generateImages = async (
    background: SourceImage, 
    prompt: string, 
    type: string, 
    count: number, 
    ratio: string, 
    building: SourceImage, 
    refMode: boolean, 
    insertMode: boolean
) => {
    // Construct payload for existing geminiService.generateImage
    // We must construct full data URIs because the base64 stored in SourceImage (from the new logic) is raw.
    const imagesToSend = [{
        base64: `data:${background.mimeType};base64,${background.base64}`,
        file: new File([], 'bg', { type: background.mimeType }),
        url: ''
    }];
    
    if (building) {
        imagesToSend.push({
            base64: `data:${building.mimeType};base64,${building.base64}`,
            file: new File([], 'fg', { type: building.mimeType }),
            url: ''
        });
    }

    const res = await generateImage(prompt, imagesToSend, count);
    return res.imageUrls || [];
};

const upscaleImageAdapter = async (source: SourceImage, target: '2k' | '4k') => {
    const res = await upscaleImage({
        base64: `data:${source.mimeType};base64,${source.base64}`,
        file: new File([], 'src', { type: source.mimeType }),
        url: ''
    }, target);
    return res.imageUrls?.[0] || null;
};


// --- Reusable Components (Local copies for self-containment) ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] shadow-2xl shadow-[var(--shadow-color)] p-6 rounded-xl">
    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{title}</h2>
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

const HistoryPanel: React.FC<{ 
    history: RenderHistoryItem[]; 
    onClear: () => void; 
    onSelect: (item: RenderHistoryItem) => void;
}> = ({ history, onClear, onSelect }) => {
  return (
    <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] shadow-2xl shadow-[var(--shadow-color)] p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Icon name="clock" className="w-5 h-5" />
          Lịch Sử Ghép Ảnh
        </h2>
        {history.length > 0 &&
            <button onClick={onClear} className="text-red-400 hover:text-red-500 text-sm font-semibold flex items-center gap-1">
                <Icon name="trash" className="w-4 h-4" />
                Xóa
            </button>
        }
      </div>
      {history.length > 0 ? (
        <ul className="space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2 custom-scrollbar">
          {history.map((item) => (
            <li key={item.id} 
                className="bg-brand-surface/50 border border-brand-primary/30 p-3 rounded-lg hover:bg-brand-surface cursor-pointer transition-all"
                onClick={() => onSelect(item)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-grow min-w-0 mr-2">
                  <p className="font-semibold text-sm truncate text-white" title={item.prompt}>{item.prompt}</p>
                  <p className="text-xs text-brand-text-muted">{item.images.length} ảnh</p>
                </div>
                <p className="text-xs text-brand-text-muted self-start flex-shrink-0">{new Date(parseInt(item.timestamp)).toLocaleTimeString()}</p>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar-horizontal">
                {item.images.map((image, index) => (
                    <div key={index} className="flex-shrink-0 w-16 h-16 bg-black/20 rounded overflow-hidden border border-brand-primary/20">
                        <img 
                            src={image} 
                            alt={`History thumbnail ${index + 1}`} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-text-muted text-center py-4">Chưa có lịch sử.</p>
      )}
    </div>
  );
};

interface InsertBuildingTabProps {
    history: RenderHistoryItem[];
    onClearHistory: () => void;
    onGenerationComplete: (prompt: string, images: string[]) => void;
    onEditRequest: (image: SourceImage) => void;
    onStartNewRenderFlow: (image: SourceImage) => void;
}

export const InsertBuildingTab: React.FC<InsertBuildingTabProps> = ({
    history,
    onClearHistory,
    onGenerationComplete,
    onEditRequest,
    onStartNewRenderFlow
}) => {
    const [backgroundImage, setBackgroundImage] = useState<SourceImage | null>(null);
    const [buildingImage, setBuildingImage] = useState<SourceImage | null>(null);
    const [prompt, setPrompt] = useState('Đặt công trình vào khu đất, điều chỉnh ánh sáng và bóng đổ cho ăn nhập với bối cảnh.');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [upscaling, setUpscaling] = useState(false);
    const [numberOfImages, setNumberOfImages] = useState(1);

    const handleGenerate = async () => {
        if (!backgroundImage || !buildingImage) {
            alert("Vui lòng tải lên cả ảnh hiện trạng và ảnh công trình.");
            return;
        }

        setIsLoading(true);
        setGeneratedImage(null);

        try {
            const engineeredPrompt = `You are an expert architectural visualizer and photo editor. The user has provided two images. The first image is a photo of the existing site/location. The second image is an architectural building, likely with a plain background. Your task is to seamlessly photoshop the building from the second image into the site from the first image. Pay close attention to scale, perspective, lighting, and shadows to make the composition look photorealistic. The user's specific instructions are: "${prompt}".`;

            // We use generateImages adapter with the selected count
            const images = await generateImages(backgroundImage, engineeredPrompt, 'exterior', numberOfImages, 'Auto', buildingImage, false, true);

            if (images && images.length > 0) {
                setGeneratedImage(images[0]);
                onGenerationComplete(prompt, images);
            }
        } catch (error) {
            console.error("Failed to insert building:", error);
            alert("Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpscale = async (target: '2k' | '4k') => {
        if (!generatedImage) return;
        const match = generatedImage.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!match) return;

        setUpscaling(true);
        try {
            const source: SourceImage = { mimeType: match[1], base64: match[2] };
            const upscaled = await upscaleImageAdapter(source, target);
            if (upscaled) {
                setGeneratedImage(upscaled);
            }
        } catch (error) {
            console.error(error);
            alert("Upscale thất bại.");
        } finally {
            setUpscaling(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Section title="1. Đầu Vào">
                    <div className="space-y-4">
                        <ImageUpload 
                            sourceImage={backgroundImage} 
                            onImageUpload={setBackgroundImage} 
                            onRemove={() => setBackgroundImage(null)} 
                            title="Tải Ảnh Hiện Trạng / Khu Đất"
                            heightClass="h-40"
                        />
                        <ImageUpload 
                            sourceImage={buildingImage} 
                            onImageUpload={setBuildingImage} 
                            onRemove={() => setBuildingImage(null)} 
                            title="Tải Ảnh Công Trình (Nền trắng/trong suốt)"
                            heightClass="h-40"
                        />
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-2">Mô tả yêu cầu ghép</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-primary rounded-md p-2 h-24 resize-none text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                placeholder="Ví dụ: xoay công trình sang trái một chút, thêm cây xanh xung quanh..."
                            />
                        </div>
                        
                        <NumberSelector 
                            label="Số lượng kết quả"
                            value={numberOfImages}
                            onChange={setNumberOfImages}
                            min={1}
                            max={4}
                        />

                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !backgroundImage || !buildingImage} 
                            className="w-full bg-brand-accent hover:bg-brand-accent/80 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Icon name={isLoading ? "arrow-path" : "sparkles"} className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /> 
                            {isLoading ? "Đang xử lý..." : "Ghép Công Trình"}
                        </button>
                    </div>
                </Section>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
                <Section title="2. Kết Quả">
                    <div className="w-full aspect-video bg-black/20 rounded-lg flex items-center justify-center min-h-[400px] lg:min-h-[500px] relative group">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-100"></div>
                                <p className="mt-3 font-semibold text-sm text-white">AI đang ghép ảnh...</p>
                            </div>
                        ) : generatedImage ? (
                            <>
                                <img src={generatedImage} alt="Result" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
                                {upscaling && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <a href={generatedImage} download={`nbox-insert-${Date.now()}.png`} className="bg-brand-surface/80 backdrop-blur-sm border border-brand-primary hover:bg-brand-accent text-white font-bold text-xs px-3 py-2 rounded-md transition-colors flex items-center gap-1.5" title="Tải ảnh">
                                        <Icon name="download" className="w-4 h-4" /> <span>Tải</span>
                                    </a>
                                    <button onClick={() => {
                                        const match = generatedImage.match(/^data:(image\/[a-z]+);base64,(.+)$/);
                                        if (match) onEditRequest({ mimeType: match[1], base64: match[2] });
                                    }} className="bg-brand-surface/80 backdrop-blur-sm border border-brand-primary hover:bg-brand-accent text-white font-bold text-xs px-3 py-2 rounded-md transition-colors flex items-center gap-1.5" title="Sửa">
                                        <Icon name="pencil" className="w-4 h-4" /> <span>Sửa</span>
                                    </button>
                                     <button onClick={() => {
                                        const match = generatedImage.match(/^data:(image\/[a-z]+);base64,(.+)$/);
                                        if (match) onStartNewRenderFlow({ mimeType: match[1], base64: match[2] });
                                    }} className="bg-brand-surface/80 backdrop-blur-sm border border-brand-primary hover:bg-brand-accent text-white font-bold text-xs px-3 py-2 rounded-md transition-colors flex items-center gap-1.5" title="Render Mới">
                                        <Icon name="photo" className="w-4 h-4" /> <span>Render</span>
                                    </button>
                                </div>
                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <button onClick={() => handleUpscale('2k')} className="bg-brand-surface/80 backdrop-blur-sm border border-brand-primary hover:bg-brand-primary text-white font-bold text-xs px-2 py-1 rounded-md transition-colors">Upscale 2K</button>
                                    <button onClick={() => handleUpscale('4k')} className="bg-brand-surface/80 backdrop-blur-sm border border-brand-primary hover:bg-brand-primary text-white font-bold text-xs px-2 py-1 rounded-md transition-colors">Upscale 4K</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-brand-text-muted">
                                <Icon name="photo" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Kết quả ghép ảnh sẽ xuất hiện ở đây.</p>
                            </div>
                        )}
                    </div>
                </Section>
                <HistoryPanel history={history} onClear={onClearHistory} onSelect={(item) => {
                    if(item.images.length > 0) setGeneratedImage(item.images[0]);
                }} />
            </div>
        </div>
    );
};
