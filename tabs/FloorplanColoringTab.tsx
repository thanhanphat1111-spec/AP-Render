
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage, generateText } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { Icon } from '../components/icons';

interface FloorplanColoringTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

const ASPECT_RATIO_OPTIONS = ['Tự động (Giữ nguyên gốc)', '1:1 (Square)', '16:9 (Landscape)', '9:16 (Portrait)', '4:3 (Standard)', '3:4 (Portrait)'];

const STYLE_OPTIONS = [
  'Hiện đại (Modern)',
  'Tân cổ điển (Neoclassical)',
  'Cổ điển (Classic)',
  'Tối giản (Minimalism)',
  'Scandinavian',
  'Indochine (Đông Dương)',
  'Industrial',
  'Wabi-sabi',
  'Luxury (Sang trọng)',
  'Địa Trung Hải (Mediterranean)',
];

const ROOM_TYPE_OPTIONS = [
  'Phòng khách',
  'Phòng ngủ',
  'Phòng Bếp',
  'Phòng ăn',
  'Phòng tắm',
  'Ban công',
  'Hiên nhà'
];

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition shadow-inner">
            {options.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
        </select>
    </div>
);

const urlToImageFile = async (url: string, filename: string): Promise<ImageFile> => {
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

export const FloorplanColoringTab: React.FC<FloorplanColoringTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [currentStep, setCurrentStep] = useState(0); 
  const [cleanImage, setCleanImage] = useState<ImageFile | null>(null);
  const [interiorRefImage, setInteriorRefImage] = useState<ImageFile | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0]);
  const [selectedRoomType, setSelectedRoomType] = useState(ROOM_TYPE_OPTIONS[0]);
  const [housePrompt, setHousePrompt] = useState('');
  const [roomPrompt, setRoomPrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);
  const [isSuggestingHouse, setIsSuggestingHouse] = useState(false);
  const [isSuggestingRoom, setIsSuggestingRoom] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Selection state for generic rectangular region
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({x: 0, y: 0});

  const handleStartProcessing = async () => {
      if (!sourceImage) return;
      
      setCleanImage(null);
      setCurrentStep(1);
      setLoadingMessage("Đang lọc bỏ kích thước và làm sạch bản vẽ...");

      try {
          const CLEAN_PROMPT = "Carefully edit this architectural floor plan image. REMOVE: all dimension lines, dimension numbers (both inside and outside the building), grid lines (axis lines), and all text/labels located OUTSIDE the main floor plan area. KEEP: all architectural details (walls, windows, doors, stairs, furniture, structural elements) and all text/labels located INSIDE the rooms or building boundaries. Ensure the final result is a clean architectural drawing on a plain white background, maintaining sharp line work.";
          const res = await generateImage(CLEAN_PROMPT, [sourceImage], 1);
          if (res.imageUrls && res.imageUrls[0]) {
              const cleanImgFile = await urlToImageFile(res.imageUrls[0], 'clean_floorplan.png');
              setCleanImage(cleanImgFile);
              setCurrentStep(2);
              setLoadingMessage("");
          } else {
              alert("Không thể xử lý ảnh: " + (res.error || "Lỗi không xác định"));
              setCurrentStep(0);
          }
      } catch (e: any) {
          console.error(e);
          alert("Lỗi: " + e.message);
          setCurrentStep(0);
      }
  };

  const handleSuggestHousePrompt = () => {
    setIsSuggestingHouse(true);
    const p = `Từ ảnh bản vẽ 2D hãy tạo một hình ảnh phối cảnh 3D cắt nóc (3D cutaway floor plan) với góc nhìn top-down.
Phong cách thiết kế nội thất ${selectedStyle} và ấm cúng.
Ánh sáng tự nhiên dịu nhẹ chiếu vào từ phía Hiên hoặc ban công và cửa sổ, kết hợp với ánh sáng đèn nội thất ấm áp tạo hiệu ứng bóng đổ mềm mại và chiều sâu không gian.
Hình ảnh render chất lượng 8K, siêu sắc nét, diễn họa chân thực các bề mặt vật liệu như vải, gỗ, đá và kính theo tiêu chuẩn diễn họa bất động sản cao cấp.`;
    setHousePrompt(p);
    setIsSuggestingHouse(false);
  };

  const handleSuggestRoomPrompt = async (currentResultImage: string | undefined) => {
    if (!currentResultImage) {
        alert("Vui lòng tạo ảnh 3D tổng thể trước.");
        return;
    }
    
    setIsSuggestingRoom(true);
    setRoomPrompt("Đang phân tích vùng chọn và tạo gợi ý từ AI...");

    const selectionText = selection 
        ? `Vùng khoanh vùng nằm tại tọa độ: x=${selection.x.toFixed(1)}%, y=${selection.y.toFixed(1)}%, rộng=${selection.w.toFixed(1)}%, cao=${selection.h.toFixed(1)}%.`
        : "Người dùng chưa khoanh vùng cụ thể, hãy phân tích toàn bộ không gian.";

    const systemInstruction = `Bạn là một chuyên gia thiết kế nội thất và AI Prompter chuyên nghiệp. 
    Nhiệm vụ: Phân tích ảnh phối cảnh 3D và viết một prompt cực kỳ chi tiết cho view nội thất ngang tầm mắt.
    
    YÊU CẦU CẤU TRÚC PROMPT (BẮT BUỘC):
    1. Mô tả view nhìn: "Góc chụp chính diện view nhìn toàn cảnh ngang tầm mắt từ [Tên phòng] về hướng [AI tự đề xuất hướng nhìn đẹp nhất, VD: cửa chính/cửa sổ/kệ tivi] phong cách [Phong cách]".
    
    2. Mô tả không gian (Markdown):
    **Các thành phần cố định:**
    *   **Trần:** [Mô tả chi tiết trần, đèn hắt, đèn âm trần phù hợp góc nhìn]
    *   **Tường:** [Mô tả tường bên trái, phải, trước và sau theo góc nhìn chỉ định]
    *   **Sàn:** [Dựa trên ảnh 3D tổng thể và vùng khoanh vùng để mô tả vật liệu lát sàn]
    *   **Cửa:** [Mô tả vị trí và kiểu dáng của các loại cửa]

    **Đồ nội thất chính:**
    *   **Ghế:** [Mô tả chi tiết kiểu dáng, màu sắc, vật liệu ghế/sofa]
    *   **Bàn:** [Mô tả kiểu dáng, vật liệu bàn trà/bàn làm việc]
    *   **Kệ tủ:** [Mô tả chi tiết hệ tủ kệ]
    *   **Trang trí lớn:** [Liệt kê thảm, bộ đèn thả trần, chậu cây cảnh, tranh ảnh lớn, tivi...]

    3. Nhân vật: Thêm vào phối cảnh một cô gái người Việt Nam tóc đen búi gọn mặc trang phục vải lanh mềm mại đang thư giãn trong không gian.
    Văn phong: Sang trọng như tạp chí Architectural Digest.`;

    const userPrompt = `Dựa vào ảnh phối cảnh 3D tổng thể này, hãy viết một prompt mô tả không gian nội thất ngang tầm mắt cho loại phòng: ${selectedRoomType} phong cách ${selectedStyle}.
    ${selectionText}`;

    try {
        const dummyFile = await urlToImageFile(currentResultImage, 'result_view.png');
        const res = await generateText(userPrompt, systemInstruction, dummyFile);
        if (res.text) {
            setRoomPrompt(res.text);
        } else {
            setRoomPrompt("Không thể tạo gợi ý. Vui lòng thử lại.");
        }
    } catch (e) {
        console.error(e);
        setRoomPrompt("Lỗi phân tích AI.");
    } finally {
        setIsSuggestingRoom(false);
    }
  };

  const handleGenerate3D = async (p: string, setLoading: any, setResult: any, addHistoryItem: any, refImage?: ImageFile | null) => {
      if (!cleanImage) return;
      if (!p.trim()) { alert("Vui lòng nhập prompt."); return; }
      setLoading(true);
      setResult(null);
      setSelectedResultIndex(0); 
      
      let ar = aspectRatio === ASPECT_RATIO_OPTIONS[0] ? `Maintain aspect ratio ${cleanImage.width}x${cleanImage.height}` : `Aspect ratio ${aspectRatio.split(' ')[0]}`;
      const finalPrompt = `${p}. ${ar}. Photorealistic 8K. High dynamic range.`;
      
      const imagesToSend = [cleanImage];
      if (refImage) imagesToSend.push(refImage);

      const response = await generateImage(finalPrompt, imagesToSend, numberOfImages);
      setResult(response);
      if (!response.error) addHistoryItem(p, response);
      setLoading(false);
  };

  // --- Optimized Selection Logic (Free-form Rectangle) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectionMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDragging(true);
    setDragStart({ x, y });
    setSelection({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;
    
    const nextX = dx >= 0 ? dragStart.x : currentX;
    const nextY = dy >= 0 ? dragStart.y : currentY;
    const nextW = Math.abs(dx);
    const nextH = Math.abs(dy);

    setSelection({
        x: Math.max(0, Math.min(100, nextX)),
        y: Math.max(0, Math.min(100, nextY)),
        w: Math.min(100 - (dx >= 0 ? dragStart.x : currentX), nextW),
        h: Math.min(100 - (dy >= 0 ? dragStart.y : currentY), nextH)
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleImageChangeFromBase = useCallback((url: string, index: number) => {
      setSelectedResultIndex(index);
      setSelection(null); // Reset selection when user switches image
  }, []);

  return (
    <BaseTab 
      tabKey="floorplan_coloring" 
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={cleanImage?.base64 || sourceImage?.base64}
      onImageChange={handleImageChangeFromBase}
      resultMiddleContent={
        <div className="animate-fade-in">
           <Card title="Công cụ hỗ trợ Kết quả (Khoanh vùng AI)">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsSelectionMode(!isSelectionMode)} 
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${isSelectionMode ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-brand-surface border-white/10 text-brand-text-muted hover:text-white'}`}
                        >
                            <Icon name="arrows-pointing-out" className="w-4 h-4" />
                            {isSelectionMode ? 'Hủy Vẽ Vùng Chọn' : 'Vẽ Vùng Khoanh (Tùy biến)'}
                        </button>
                        {selection && (
                            <button onClick={() => setSelection(null)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg border border-red-500/30 transition-colors"><Icon name="trash" className="w-4 h-4" /></button>
                        )}
                    </div>
                    
                    {isSelectionMode && (
                        <div className="space-y-2">
                            <div 
                                ref={containerRef}
                                className="relative w-full aspect-video bg-black/40 rounded-lg overflow-hidden border border-orange-500/50 cursor-crosshair group select-none touch-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                {/* We display the clean plan as context if no result yet, otherwise show current result */}
                                <img 
                                    src={cleanImage?.url || sourceImage?.url} 
                                    className="w-full h-full object-contain pointer-events-none opacity-60" 
                                    alt="Selection context" 
                                    draggable={false} 
                                />
                                {selection && (
                                    <div 
                                        className="absolute border-2 border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(255,165,0,0.4)] pointer-events-none"
                                        style={{ left: `${selection.x}%`, top: `${selection.y}%`, width: `${selection.w}%`, height: `${selection.h}%` }}
                                    >
                                        <div className="absolute -top-6 left-0 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg uppercase whitespace-nowrap">Khu vực phân tích nội thất</div>
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">Kéo để khoanh vùng lên ảnh kết quả đang xem</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-brand-text-muted italic text-center">Khoanh vùng chính xác vào vị trí phòng muốn xem nội thất để AI đề xuất prompt chi tiết nhất.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
      }
    >
      {({ setLoading, setResult, addHistoryItem, result }) => {
        const currentResultImage = result?.imageUrls?.[selectedResultIndex];

        return (
            <div className="space-y-6">
                <Card title="1. Dữ Liệu Đầu Vào">
                    <div className="space-y-4">
                        <ImageUploader onFileSelect={(file) => { setSourceImage(file); setCleanImage(null); setCurrentStep(0); }} label="Tải ảnh mặt bằng 2D" />
                        <div className="flex gap-2">
                             <button 
                                onClick={handleStartProcessing} 
                                disabled={!sourceImage || currentStep === 1}
                                className="btn-primary flex-grow group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <Icon name={cleanImage ? "arrow-path" : "sparkles"} className={`w-5 h-5 ${currentStep === 1 ? 'animate-spin' : ''}`} /> 
                                    {cleanImage ? 'Làm sạch lại mặt bằng' : 'Bước 1: Làm sạch mặt bằng'}
                                </span>
                            </button>
                        </div>
                    </div>
                </Card>

                {currentStep > 0 && (
                    <Card title="Quy trình xử lý AI">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-brand-bg/30 p-2 rounded text-center">
                                <p className="text-[10px] mb-1 text-brand-text-muted uppercase font-bold tracking-wider">Mặt bằng gốc</p>
                                <div className="aspect-video bg-black/20 rounded flex items-center justify-center overflow-hidden border border-white/5">
                                    {sourceImage && <img src={sourceImage.url} className="w-full h-full object-contain" alt="Original" />}
                                </div>
                            </div>
                            <div className="bg-brand-bg/30 p-2 rounded text-center relative">
                                <p className="text-[10px] mb-1 text-brand-text-muted uppercase font-bold tracking-wider">Mặt bằng sạch (Dữ liệu 3D)</p>
                                <div className="aspect-video bg-black/20 rounded flex items-center justify-center overflow-hidden border border-white/5">
                                    {cleanImage ? <img src={cleanImage.url} className="w-full h-full object-contain" alt="Clean" /> : (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <span className="text-[10px] text-brand-text-muted">{loadingMessage}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* SECTION A: 3D HOUSE CUTAWAY */}
                        <Card title="Phối cảnh 3D Tổng Thể (Cắt nóc)">
                            <div className="space-y-4">
                                <SelectInput label="Phong cách thiết kế" options={STYLE_OPTIONS} value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} />
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Prompt Phối cảnh 3D</label>
                                        <button onClick={handleSuggestHousePrompt} disabled={isSuggestingHouse} className="text-[10px] bg-brand-primary hover:bg-brand-accent px-3 py-1 rounded text-white transition-colors border border-white/10">✨ Gợi ý từ AI</button>
                                    </div>
                                    <textarea 
                                        rows={6} 
                                        value={housePrompt} 
                                        onChange={e => setHousePrompt(e.target.value)} 
                                        className="w-full bg-black/40 border border-brand-primary rounded-lg px-3 py-3 text-xs font-mono text-white placeholder-brand-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none shadow-inner" 
                                        placeholder="Nhấp gợi ý AI để điền prompt 3D cắt nóc..." 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <NumberSelector label="Số lượng ảnh" value={numberOfImages} onChange={setNumberOfImages} />
                                    <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
                                </div>
                                <button onClick={() => handleGenerate3D(housePrompt, setLoading, setResult, addHistoryItem)} className="btn-primary py-3"><Icon name="sparkles" className="w-5 h-5" /> Tạo Ảnh 3D Nhà</button>
                            </div>
                        </Card>

                        {/* SECTION B: INTERIOR ROOM VIEW */}
                        <Card title="Phối cảnh Nội Thất Chi Tiết (Ngang tầm mắt)">
                            <div className="space-y-4">
                                <ImageUploader onFileSelect={setInteriorRefImage} label="Tải ảnh tham chiếu (Tùy chọn)" />
                                <div className="grid grid-cols-2 gap-4">
                                    <SelectInput label="Lựa chọn loại phòng" options={ROOM_TYPE_OPTIONS} value={selectedRoomType} onChange={e => setSelectedRoomType(e.target.value)} />
                                    <div className="flex items-end">
                                         <button 
                                            onClick={() => handleSuggestRoomPrompt(currentResultImage)} 
                                            disabled={isSuggestingRoom || !currentResultImage} 
                                            className="w-full h-[38px] bg-brand-primary hover:bg-brand-accent rounded-lg text-xs font-bold text-white transition-colors border border-white/10 disabled:opacity-50"
                                        >
                                            {isSuggestingRoom ? 'AI đang phân tích...' : '✨ Gợi ý View Nội Thất'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1 block">Prompt View Nội Thất (Gợi ý dựa theo phong cách & vùng chọn)</label>
                                    <textarea 
                                        rows={15} 
                                        value={roomPrompt} 
                                        onChange={e => setRoomPrompt(e.target.value)} 
                                        className="w-full bg-black/40 border border-brand-primary rounded-lg px-3 py-3 text-xs leading-relaxed text-white placeholder-brand-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none shadow-inner custom-scrollbar" 
                                        placeholder="Mô tả chi tiết không gian hoặc nhấn nút gợi ý để AI phân tích vùng khoanh trên ảnh 3D..." 
                                    />
                                </div>
                                <button onClick={() => handleGenerate3D(roomPrompt, setLoading, setResult, addHistoryItem, interiorRefImage)} className="w-full py-4 bg-brand-accent hover:brightness-110 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 border border-white/10 uppercase tracking-widest text-sm disabled:opacity-50"><Icon name="photo" className="w-5 h-5" /> Tạo Ảnh Phối Cảnh Nội Thất</button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        );
      }}
    </BaseTab>
  );
};
