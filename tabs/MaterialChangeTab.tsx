
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../components/Card';
import { MaskingCanvas } from '../components/MaskingCanvas';
import { MaterialPlacementCanvas } from '../components/MaterialPlacementCanvas';
import { changeMaterial } from '../services/aiService';
import { AiServiceResult, HistoryItem, ImageFile, ObjectTransform } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { ImageUploader } from '../components/ImageUploader';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { LOCAL_STORAGE_HISTORY_KEY } from '../constants';
import { ResultDisplay } from '../components/ResultDisplay';
import { HistoryList } from '../components/HistoryList';
import { Icon } from '../components/icons';

interface MaterialChangeTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialImage: ImageFile | null;
  onClearInitialImage: () => void;
}

const MATERIAL_CHANGE_OPTIONS = [
    { value: 'Thay thế vật liệu sàn bằng gỗ sồi tự nhiên, vân rõ nét.', display: 'Sàn: Gỗ sồi tự nhiên' },
    { value: 'Thay thế sàn bằng đá Marble trắng vân mây (Carrara).', display: 'Sàn: Đá Marble trắng' },
    { value: 'Đổi tường thành bê tông hiệu ứng (concrete finish).', display: 'Tường: Bê tông hiệu ứng' },
    { value: 'Thay bề mặt tủ bếp bằng vật liệu Acrylic bóng gương màu trắng.', display: 'Tủ bếp: Acrylic trắng bóng' },
    { value: 'Thay thế thảm trải sàn bằng thảm lông cừu màu xám.', display: 'Thảm: Lông cừu xám' },
    { value: 'Ốp tường bằng lam gỗ composite màu nâu trầm.', display: 'Tường: Lam gỗ nâu' },
];

const PRESET_MATERIALS: Record<string, { name: string; url: string }[]> = {
    'Gỗ (Wood)': [
        { name: 'Sàn gỗ Sồi', url: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=200&q=80' },
        { name: 'Gỗ Óc chó', url: 'https://images.unsplash.com/photo-1610505466019-207232e4a334?auto=format&fit=crop&w=200&q=80' },
        { name: 'Gỗ Tần bì', url: 'https://images.unsplash.com/photo-1585567981400-364422991621?auto=format&fit=crop&w=200&q=80' },
    ],
    'Đá (Stone)': [
        { name: 'Marble Trắng', url: 'https://images.unsplash.com/photo-1599939337975-107df63a8331?auto=format&fit=crop&w=200&q=80' },
        { name: 'Bê tông', url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=200&q=80' },
        { name: 'Terrazzo', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=200&q=80' },
    ],
    'Vải (Fabric)': [
        { name: 'Vải Linen', url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=200&q=80' },
        { name: 'Nhung Xanh', url: 'https://images.unsplash.com/photo-1552326690-4a7ae79422b6?auto=format&fit=crop&w=200&q=80' },
        { name: 'Da Bò', url: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=200&q=80' },
    ]
};

// Helper functions
const createThumbnail = (base64Image: string, size: number = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            const aspectRatio = img.width / img.height;
            let newWidth = size;
            let newHeight = size;
            if (aspectRatio > 1) newHeight = size / aspectRatio; else newWidth = size * aspectRatio;
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (error) => reject(error);
    });
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
}

const urlToImageFile = async (url: string, filename: string = 'material.jpg'): Promise<ImageFile> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
    
    const img = new Image();
    await new Promise((resolve) => {
        img.onload = resolve;
        img.src = base64;
    });

    return {
        file: new File([blob], filename, { type: blob.type }),
        base64: base64,
        url: base64,
        width: img.width,
        height: img.height
    };
};

export const MaterialChangeTab: React.FC<MaterialChangeTabProps> = ({ onEditRequest, onVideoRequest, initialImage, onClearInitialImage }) => {
  const [extIsLoading, setExtLoading] = useState(false);
  const [extResult, setExtResult] = useState<AiServiceResult | null>(null);
  const [extHistory, setExtHistory] = useSessionStorage<HistoryItem[]>(`${LOCAL_STORAGE_HISTORY_KEY}_canva_mix`, []);
  const [extLoadingMessage, setExtLoadingMessage] = useState('');
  const [extSourceImage, setExtSourceImage] = useState<ImageFile | null>(null);
  const [extMaskFile, setExtMaskFile] = useState<ImageFile | null>(null);
  const [extMaterialImage, setExtMaterialImage] = useState<ImageFile | null>(null);
  const [extMaterialTransform, setExtMaterialTransform] = useState<ObjectTransform | null>(null);
  const [extPrompt, setExtPrompt] = useState('');
  const [extNumberOfImages, setExtNumberOfImages] = useState(1);
  
  // Gallery State
  const [showMaterialGallery, setShowMaterialGallery] = useState(false);
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<keyof typeof PRESET_MATERIALS>('Gỗ (Wood)');
  const [isLoadingMaterialRef, setIsLoadingMaterialRef] = useState(false);

  useEffect(() => {
    if (initialImage) {
      setExtSourceImage(initialImage);
      setExtMaskFile(null); 
      setExtResult(null);
      onClearInitialImage();
    }
  }, [initialImage, onClearInitialImage]);
  
  const addExtHistoryItem = useCallback(async (prompt: string, result: AiServiceResult) => {
    if (result.imageUrls && result.imageUrls.length > 0) {
      try {
        const thumbnailUrl = await createThumbnail(result.imageUrls[0]);
        const newItem: HistoryItem = {
          id: new Date().toISOString(),
          prompt,
          thumbnail: thumbnailUrl,
          fullImage: result.imageUrls[0],
          imageUrls: result.imageUrls,
          imageCount: result.imageUrls.length,
          timestamp: Date.now(),
          category: 'canva_mix'
        };
        setExtHistory(prev => [newItem, ...prev].slice(0, 10));
      } catch (error) { console.error(error); }
    }
  }, [setExtHistory]);

  const handleExtHistorySelect = useCallback((item: HistoryItem) => {
    setExtLoading(false);
    setExtResult({ imageUrls: item.imageUrls || (item.fullImage ? [item.fullImage] : [item.thumbnail]) });
  }, []);

  const handleReplaceSourceImage = useCallback((imageUrl: string) => {
    if (!extSourceImage) return;
    const newFile = dataURLtoFile(imageUrl, `replaced-source-${Date.now()}.png`);
    const newImageFile: ImageFile = { file: newFile, base64: imageUrl, url: imageUrl };
    setExtSourceImage(newImageFile);
    setExtMaskFile(null);
    setExtResult(null);
    alert('Ảnh gốc đã được thay thế bằng kết quả.');
  }, [extSourceImage]);
  
  const handleSetMaterialFromUrl = async (url: string) => {
      setIsLoadingMaterialRef(true);
      try {
          const imageFile = await urlToImageFile(url);
          setExtMaterialImage(imageFile);
      } catch (e) {
          console.error(e);
          alert("Không thể tải ảnh vật liệu.");
      }
      setIsLoadingMaterialRef(false);
  };

  const createVisualGuide = async (): Promise<ImageFile | null> => {
      if (!extSourceImage || !extMaterialImage || !extMaterialTransform) return null;
      const bg = new Image(); bg.src = extSourceImage.base64; await new Promise(resolve => bg.onload = resolve);
      const fg = new Image(); fg.src = extMaterialImage.base64; await new Promise(resolve => fg.onload = resolve);
      
      const canvas = document.createElement('canvas');
      canvas.width = bg.naturalWidth; canvas.height = bg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(bg, 0, 0);
      const { x, y, scale, rotation, flipHorizontal, flipVertical } = extMaterialTransform;
      const canvasCenterX = (x / 100) * canvas.width;
      const canvasCenterY = (y / 100) * canvas.height;
      const fgWidth = (scale / 100) * canvas.width;
      const fgHeight = fg.naturalHeight * (fgWidth / fg.naturalWidth);
      
      ctx.save();
      ctx.translate(canvasCenterX, canvasCenterY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
      ctx.drawImage(fg, -fgWidth / 2, -fgHeight / 2, fgWidth, fgHeight);
      ctx.restore();
      
      const base64 = canvas.toDataURL('image/jpeg');
      const file = dataURLtoFile(base64, 'visual-guide.jpg');
      return { file, base64, url: base64 };
  };

  const handleExtGenerate = async () => {
    if (!extSourceImage) { alert('Vui lòng tải ảnh gốc.'); return; }
    if (!extMaskFile) { alert('Vui lòng vẽ vùng chọn.'); return; }
    if (!extPrompt.trim()) { alert('Vui lòng nhập mô tả.'); return; }

    setExtLoading(true);
    setExtResult(null);
    const visualGuide = await createVisualGuide();
    const response = await changeMaterial(extSourceImage, extMaskFile, extMaterialImage || null, extPrompt, extNumberOfImages, visualGuide);
    setExtResult(response);
    if (!response.error) addExtHistoryItem(extPrompt, response);
    setExtLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        <div>
            <Card title="Thay Đổi Vật Liệu (Exterior/Surface)">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-1">1. Tải ảnh gốc & Vẽ vùng chọn</label>
                    <MaskingCanvas 
                        initialImage={extSourceImage}
                        onImageSelect={setExtSourceImage}
                        onMaskChange={setExtMaskFile}
                    />
                </div>
                
                {/* Material Section */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <label className="block text-sm font-medium text-brand-text-muted">2. Tải ảnh vật liệu (tuỳ chọn)</label>
                        <button 
                        onClick={() => setShowMaterialGallery(!showMaterialGallery)} 
                        className="text-xs text-brand-accent hover:text-white px-2 py-1 border border-brand-primary rounded hover:bg-brand-primary transition-colors"
                        >
                        {showMaterialGallery ? 'Đóng thư viện' : 'Chọn từ thư viện'}
                        </button>
                    </div>
                    
                    {/* Material Gallery */}
                    {showMaterialGallery && (
                    <div className="bg-brand-bg/70 p-3 rounded-lg border border-brand-primary animate-slide-down">
                        <div className="flex gap-2 mb-3 border-b border-brand-primary/50 overflow-x-auto pb-1">
                            {(Object.keys(PRESET_MATERIALS) as Array<keyof typeof PRESET_MATERIALS>).map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedMaterialCategory(cat)} 
                                    className={`px-3 py-1 text-xs font-semibold rounded-t-md whitespace-nowrap transition-colors ${selectedMaterialCategory === cat ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:text-white'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {PRESET_MATERIALS[selectedMaterialCategory].map((img, idx) => (
                                <div key={idx} onClick={() => { handleSetMaterialFromUrl(img.url); setShowMaterialGallery(false); }} className="cursor-pointer group">
                                    <div className="aspect-square rounded overflow-hidden border border-brand-primary/50 group-hover:border-brand-accent transition-colors">
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[10px] text-brand-text-muted mt-1 truncate group-hover:text-white text-center">{img.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {isLoadingMaterialRef ? (
                        <div className='w-full h-32 border-2 border-dashed border-brand-primary rounded-lg flex items-center justify-center text-center text-brand-text-muted text-sm bg-brand-bg/30'>
                            <p className="animate-pulse">Đang tải vật liệu...</p>
                        </div>
                    ) : (
                        <ImageUploader 
                            onFileSelect={setExtMaterialImage}
                            label="Tải ảnh vật liệu tham khảo"
                        />
                    )}
                </div>

                <div>
                <label htmlFor="ext-material-prompt" className="block text-sm font-medium text-brand-text-muted mb-1">
                    3. Mô tả vật liệu mới
                </label>
                <textarea
                    id="ext-material-prompt"
                    rows={3}
                    value={extPrompt}
                    onChange={(e) => setExtPrompt(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition mb-2"
                    placeholder="e.g., đổi sàn thành gỗ sồi sáng màu, thay tường gạch bằng tường sơn trắng..."
                />
                <select
                    onChange={(e) => setExtPrompt(e.target.value)}
                    value=""
                    className="w-full bg-brand-bg/50 border border-brand-primary/50 rounded-lg px-3 py-2 text-xs text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                >
                    <option value="" disabled>-- Chọn mô tả mẫu --</option>
                    {MATERIAL_CHANGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.display}</option>
                    ))}
                </select>
                </div>

                <NumberSelector
                    label="4. Số lượng kết quả"
                    value={extNumberOfImages}
                    onChange={setExtNumberOfImages}
                />
                <button
                onClick={handleExtGenerate}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors"
                >
                Thực Hiện Thay Đổi
                </button>
            </div>
            </Card>
        </div>
        
        {/* Right Column: Preview & Result */}
        <div className="flex flex-col gap-8">
        <div>
            <h3 className="text-lg font-bold text-white mb-4">Định vị vật liệu tham khảo</h3>
            <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] rounded-xl p-2 h-[480px] flex items-center justify-center">
                <MaterialPlacementCanvas
                sourceImage={extSourceImage}
                materialImage={extMaterialImage}
                onTransformUpdate={setExtMaterialTransform}
                />
            </div>
        </div>
        <div>
            <ResultDisplay 
            result={extResult} 
            isLoading={extIsLoading} 
            onEditRequest={onEditRequest}
            onVideoRequest={onVideoRequest}
            onReplaceRequest={handleReplaceSourceImage}
            comparisonImage={extSourceImage?.base64} 
            loadingMessage={extLoadingMessage}
            />
            <HistoryList history={extHistory} onItemSelect={handleExtHistorySelect} />
        </div>
        </div>
    </div>
  );
};
