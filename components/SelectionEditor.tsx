
import React, { useState, useRef, useEffect } from 'react';
import { ImageFile, AiServiceResult } from '../types';
import { ImageUploader } from './ImageUploader';
import { editImage } from '../services/aiService';
import { Icon } from './icons';
import { NumberSelector } from './NumberSelector';
import { cropImage, compositeImage, dataUrlToSourceImage, dataURLtoFile } from '../utils';
import { Card } from './Card';

interface SelectionEditorProps {
    initialImage: ImageFile | null;
    onImageChange?: (image: ImageFile | null) => void;
    onResult: (result: AiServiceResult) => void;
    setLoading: (loading: boolean) => void;
}

const SMART_EDIT_PROMPT_TEMPLATE = "Bạn đang làm việc trên một vùng ảnh crop độ phân giải cao. Nhiệm vụ của bạn là vẽ lại phần được tô MASK (màu trắng) một cách cực kỳ chi tiết và chân thực: {0}. Giữ nguyên bố cục và phối cảnh của phần ảnh xung quanh trong khung crop.";

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const SelectionEditor: React.FC<SelectionEditorProps> = ({ initialImage, onImageChange, onResult, setLoading }) => {
    const [image, setImage] = useState<ImageFile | null>(initialImage || null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [prompt, setPrompt] = useState('');
    const [numberOfImages, setNumberOfImages] = useState(1);
    
    // Interaction State
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({x:0, y:0});
    const startSelectionRef = useRef<{x: number, y: number, w: number, h: number} | null>(null);
    const [dragAction, setDragAction] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'creating' | null>(null);

    useEffect(() => {
        if (initialImage) setImage(initialImage);
    }, [initialImage]);

    const handleImageUpdate = (newImage: ImageFile | null) => {
        setImage(newImage);
        if (onImageChange) onImageChange(newImage);
    };

    const handleMouseDown = (e: React.MouseEvent, action: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
        e.stopPropagation(); e.preventDefault();
        setIsDragging(true);
        setDragAction(action);
        setDragStart({ x: e.clientX, y: e.clientY });
        if (selection) startSelectionRef.current = { ...selection };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const startX = ((e.clientX - rect.left) / rect.width) * 100;
        const startY = ((e.clientY - rect.top) / rect.height) * 100;
        setIsDragging(true); setDragAction('creating');
        startSelectionRef.current = { x: startX, y: startY, w: 0, h: 0 };
        setSelection({ x: startX, y: startY, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !startSelectionRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        if (dragAction === 'creating') {
            const currentXPct = ((e.clientX - rect.left) / rect.width) * 100;
            const currentYPct = ((e.clientY - rect.top) / rect.height) * 100;
            const originX = startSelectionRef.current.x;
            const originY = startSelectionRef.current.y;
            let x = Math.min(originX, currentXPct);
            let y = Math.min(originY, currentYPct);
            let w = Math.abs(currentXPct - originX);
            let h = Math.abs(currentYPct - originY);
            x = Math.max(0, x); y = Math.max(0, y);
            if (x + w > 100) w = 100 - x;
            if (y + h > 100) h = 100 - y;
            setSelection({ x, y, w, h });
            return;
        }

        const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
        const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
        const startSel = startSelectionRef.current;
        let newSel = { ...startSel };

        if (dragAction === 'move') {
            newSel.x = clamp(startSel.x + dx, 0, 100 - startSel.w);
            newSel.y = clamp(startSel.y + dy, 0, 100 - startSel.h);
        } else if (dragAction === 'se') {
            newSel.w = clamp(startSel.w + dx, 5, 100 - startSel.x);
            newSel.h = clamp(startSel.h + dy, 5, 100 - startSel.y);
        } else if (dragAction === 'nw') {
            const maxX = startSel.x + startSel.w;
            const maxY = startSel.y + startSel.h;
            newSel.x = clamp(startSel.x + dx, 0, maxX - 5);
            newSel.y = clamp(startSel.y + dy, 0, maxY - 5);
            newSel.w = maxX - newSel.x;
            newSel.h = maxY - newSel.y;
        } else if (dragAction === 'ne') {
            const maxY = startSel.y + startSel.h;
            newSel.y = clamp(startSel.y + dy, 0, maxY - 5);
            newSel.h = maxY - newSel.y;
            newSel.w = clamp(startSel.w + dx, 5, 100 - startSel.x);
        } else if (dragAction === 'sw') {
            const maxX = startSel.x + startSel.w;
            newSel.x = clamp(startSel.x + dx, 0, maxX - 5);
            newSel.w = maxX - newSel.x;
            newSel.h = clamp(startSel.h + dy, 5, 100 - startSel.y);
        }

        setSelection(newSel);
    };

    const handleMouseUp = () => { setIsDragging(false); setDragAction(null); startSelectionRef.current = null; };

    const handleExecute = async () => {
        if (!image || !selection || !prompt) {
            alert("Vui lòng thực hiện đủ 4 bước hướng dẫn.");
            return;
        }

        setLoading(true);
        try {
            // STEP 1: Crop Selection from source for high-res focus
            const croppedArea = await cropImage(image, selection);
            
            // Create a full-white mask for the cropped area as Smart Edit assumes target within box
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = croppedArea.width || 1024;
            maskCanvas.height = croppedArea.height || 1024;
            const mCtx = maskCanvas.getContext('2d');
            if (mCtx) { 
                mCtx.fillStyle = 'white'; 
                mCtx.fillRect(0,0,maskCanvas.width, maskCanvas.height); 
            }
            const maskBase64 = maskCanvas.toDataURL('image/png');
            const croppedMask: ImageFile = { 
                file: dataURLtoFile(maskBase64, 'mask.png'), 
                base64: maskBase64, 
                url: maskBase64 
            };

            // STEP 2: Use Engineered Prompt
            const smartPrompt = SMART_EDIT_PROMPT_TEMPLATE.replace('{0}', prompt);

            // STEP 3: Localized AI Processing
            const result = await editImage(smartPrompt, croppedArea, croppedMask, numberOfImages);
            
            if (result.imageUrls && result.imageUrls.length > 0) {
                const compositedImages: string[] = [];

                // STEP 4: Composite Results Back with Edge Blending
                for (const url of result.imageUrls) {
                    const locImg = await dataUrlToSourceImage(url);
                    if (locImg) {
                        const canvas = await compositeImage(image, locImg, selection, null, { expansion: 0, edgeBlend: 3 });
                        compositedImages.push(canvas.toDataURL('image/jpeg', 0.95));
                    }
                }
                
                onResult({ imageUrls: compositedImages });
            } else {
                onResult({ error: result.error || "AI không trả về kết quả." });
            }

        } catch (e: any) {
            console.error(e);
            onResult({ error: "Lỗi thực thi Smart Edit: " + (e.message || "Unknown error") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Chỉnh Sửa Thông Minh (Smart Edit)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: 4-Step Workflow */}
                    <div className="space-y-4">
                        <section className={`p-4 rounded-xl border transition-all ${image ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                            <h3 className="font-bold text-sm flex items-center gap-2 text-white mb-2">
                                <span className="bg-orange-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                Tải ảnh nguồn
                            </h3>
                            <ImageUploader onFileSelect={handleImageUpdate} sourceImage={image} label="Upload Image" />
                        </section>

                        <section className={`p-4 rounded-xl border transition-all ${selection ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                            <h3 className="font-bold text-sm flex items-center gap-2 text-white mb-2">
                                <span className="bg-orange-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                Khoanh vùng Bounding Box
                            </h3>
                            <button 
                                disabled={!image}
                                onClick={() => setIsPreviewOpen(true)}
                                className="w-full bg-brand-primary/50 hover:bg-brand-primary text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                <Icon name="arrows-pointing-out" className="w-4 h-4" />
                                {selection ? 'Chỉnh sửa vùng chọn' : 'Vẽ khung vùng cần sửa'}
                            </button>
                        </section>

                        <section className={`p-4 rounded-xl border transition-all ${prompt ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                            <h3 className="font-bold text-sm flex items-center gap-2 text-white mb-2">
                                <span className="bg-orange-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                                Nhập yêu cầu chi tiết
                            </h3>
                            <textarea 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-black/40 border border-brand-primary/30 rounded-lg p-3 text-xs text-brand-text focus:outline-none focus:border-brand-accent resize-none h-20"
                                placeholder="Ví dụ: Thay thế bằng cửa sổ gỗ hiện đại, thêm chậu cây cảnh..."
                            />
                        </section>

                        <section className="p-4 rounded-xl border border-white/10 bg-white/5">
                            <h3 className="font-bold text-sm flex items-center gap-2 text-white mb-2">
                                <span className="bg-orange-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">4</span>
                                Thực thi & Ghép ảnh
                            </h3>
                            <div className="flex gap-4 items-center">
                                <div className="flex-grow">
                                    <NumberSelector label="Số lượng" value={numberOfImages} onChange={setNumberOfImages} min={1} max={4} className="scale-90 origin-left" />
                                </div>
                                <button
                                    onClick={handleExecute}
                                    disabled={!image || !selection || !prompt}
                                    className="flex-grow py-3 bg-gradient-to-r from-brand-accent to-brand-secondary hover:brightness-110 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Icon name="sparkles" className="w-5 h-5" />
                                    Smart Render
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right: Layout Preview */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex-grow flex flex-col items-center justify-center min-h-[300px]">
                            {image ? (
                                <div className="relative w-full h-full flex items-center justify-center group overflow-hidden rounded-lg">
                                    <img src={image.url} className="max-w-full max-h-[400px] object-contain opacity-50" alt="Context Preview" />
                                    {selection && (
                                        <div 
                                            className="absolute border-2 border-orange-500 bg-orange-500/10 pointer-events-none"
                                            style={{
                                                left: `${selection.x}%`,
                                                top: `${selection.y}%`,
                                                width: `${selection.w}%`,
                                                height: `${selection.h}%`
                                            }}
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full border border-white/10">Bố cục làm việc</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-brand-text-muted">
                                    <Icon name="photo" className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Tải ảnh ở bước 1 để bắt đầu</p>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-brand-surface border border-white/10 rounded-xl text-[10px] text-brand-text-muted leading-relaxed italic">
                            Smart Edit cô lập vùng chọn để tập trung tài nguyên AI, sau đó ghép lại bằng kỹ thuật Edge Blending (mờ biên 3px) giúp vùng sửa hòa nhập tự nhiên với ảnh gốc.
                        </div>
                    </div>
                </div>
            </Card>

            {/* Bounding Box Modal */}
            {isPreviewOpen && image && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
                    <div className="bg-brand-surface w-full max-w-5xl h-[90vh] rounded-xl flex flex-col overflow-hidden border border-brand-primary shadow-2xl">
                        <div className="p-4 border-b border-brand-primary flex justify-between items-center bg-brand-surface">
                            <div className="flex items-center gap-3">
                                <h3 className="text-white font-bold">Bounding Box Editor</h3>
                                <span className="text-[10px] text-brand-text-muted bg-white/5 px-2 py-0.5 rounded">Hệ tọa độ tự nhiên</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsPreviewOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-sm transition-colors">Đóng</button>
                                <button onClick={() => setIsPreviewOpen(false)} className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/80 text-white rounded text-sm font-bold shadow-lg shadow-brand-accent/20">Lưu vùng chọn</button>
                            </div>
                        </div>
                        <div 
                            className="flex-grow bg-[#050505] relative overflow-hidden flex items-center justify-center select-none"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="relative inline-block max-w-full max-h-full">
                                <img 
                                    src={image.base64.startsWith('data:') ? image.base64 : image.url} 
                                    className="max-w-full max-h-[80vh] pointer-events-none object-contain block" 
                                    draggable={false} 
                                    alt="Target" 
                                />
                                <div 
                                    ref={containerRef}
                                    className={`absolute inset-0 ${!selection ? 'cursor-crosshair' : ''}`}
                                    onMouseDown={handleCanvasMouseDown}
                                >
                                    {selection && (
                                        <div 
                                            className="absolute border-2 border-orange-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] cursor-move"
                                            style={{
                                                left: `${selection.x}%`,
                                                top: `${selection.y}%`,
                                                width: `${selection.w}%`,
                                                height: `${selection.h}%`
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, 'move')}
                                        >
                                            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-nw-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-ne-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
                                            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-sw-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
                                            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-se-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'se')} />
                                            
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="bg-orange-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">REGION TO EDIT</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-black/40 text-[10px] text-brand-text-muted text-center border-t border-brand-primary/30">
                            Kéo chuột để vẽ khung hoặc kéo các nút ở góc để thay đổi kích thước. AI sẽ chỉ xử lý khu vực bên trong khung này.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
