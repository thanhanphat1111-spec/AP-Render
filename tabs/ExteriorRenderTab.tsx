
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { MultiImageUploader } from '../components/MultiImageUploader';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage, generateText, convertToSketch } from '../services/aiService';
import { ImageFile, AiServiceResult } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { Icon } from '../components/icons';
import { SelectInput } from '../components/SelectInput';

interface ExteriorRenderTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  onStyleChangeRequest: (image: ImageFile, type: 'exterior' | 'interior') => void;
  onMaterialChangeRequest: (image: ImageFile) => void;
}

// --- Common Helper Components ---
const Section: React.FC<{ title: string; children: React.ReactNode; titleExtra?: React.ReactNode }> = ({ title, children, titleExtra }) => (
  <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] shadow-2xl shadow-[var(--shadow-color)] p-6 rounded-xl mb-6">
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {titleExtra}
    </div>
    {children}
  </div>
);

// Helper to stitch images into a grid
const createGridImage = async (images: ImageFile[]): Promise<ImageFile | null> => {
    if (images.length === 0) return null;
    if (images.length === 1) return images[0];

    const canvas = document.createElement('canvas');
    const cols = images.length > 2 ? 2 : images.length;
    const rows = Math.ceil(images.length / cols);
    
    const baseW = images[0].width || 1024;
    const baseH = images[0].height || 768;
    
    canvas.width = baseW * cols;
    canvas.height = baseH * rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    for (let i = 0; i < images.length; i++) {
        const img = new Image();
        img.src = images[i].base64;
        await new Promise(r => img.onload = r);
        const x = (i % cols) * baseW;
        const y = Math.floor(i / cols) * baseH;
        ctx.drawImage(img, x, y, baseW, baseH);
    }

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    return {
        file: new File([], 'grid.jpg', { type: 'image/jpeg' }),
        base64,
        url: base64,
        width: canvas.width,
        height: canvas.height
    };
};

const CONTEXT_OPTIONS_SYNC = [
    '-- Chọn bối cảnh --',
    'Trên một con phố ở Việt Nam',
    'Tại vùng nông thôn Việt Nam',
    'Trong khu đô thị cao cấp ở Việt Nam',
    'Ở ngã 4 của đường phố Việt Nam',
    'Sân vườn hiện đại',
    'Khu nghỉ dưỡng ven biển'
];

const LIGHTING_OPTIONS_SYNC = [
    '-- Chọn ánh sáng --',
    'Ban ngày nắng đẹp',
    'Hoàng hôn rực rỡ',
    'Ánh sáng ban đêm (đèn kiến trúc)',
    'Trời sau mưa (phản chiếu ướt)',
    'Bình minh dịu nhẹ'
];

const TONE_OPTIONS_SYNC = [
    '-- Chọn tone màu --',
    'Chân thực (Photoreal)',
    'Tone ấm áp (Warm)',
    'Tone lạnh hiện đại (Cool)',
    'Trắng - Xám tối giản',
    'Cinematic'
];

const ASPECT_RATIO_OPTIONS = ['Auto', '1:1', '16:9', '9:16', '4:3', '3:4'];
const EXTERIOR_ANGLE_OPTIONS = [
    "Góc chụp trực diện toàn cảnh mặt tiền căn nhà",
    "Góc chụp 3/4 bên trái, thể hiện cả mặt tiền và hông nhà",
    "Góc chụp 3/4 bên phải, lấy được chiều sâu công trình",
    "Góc chụp từ trên cao nhìn xuống (drone view)",
    "Close shot of this image",
];

const ExteriorSyncMode: React.FC<any> = ({
    sourceImages, setSourceImages,
    onGenerate,
    isLoading
}) => {
    const [refImage, setRefImage] = useState<ImageFile | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [context, setContext] = useState(CONTEXT_OPTIONS_SYNC[0]);
    const [lighting, setLighting] = useState(LIGHTING_OPTIONS_SYNC[0]);
    const [tone, setTone] = useState(TONE_OPTIONS_SYNC[0]);
    const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [finalPrompt, setFinalPrompt] = useState('');

    useEffect(() => {
        const selections = [
            context !== CONTEXT_OPTIONS_SYNC[0] ? `Bối cảnh: ${context}` : '',
            lighting !== LIGHTING_OPTIONS_SYNC[0] ? `Ánh sáng: ${lighting}` : '',
            tone !== TONE_OPTIONS_SYNC[0] ? `Tone màu: ${tone}` : '',
            aspectRatio !== 'Auto' ? `Tỷ lệ: ${aspectRatio}` : ''
        ].filter(Boolean).join(', ');

        const base = "Ảnh chụp thực tế các góc nhìn của công trình";
        const content = [userPrompt, selections].filter(Boolean).join(', ');
        setFinalPrompt(`${base}${content ? ', ' + content : ''}. Yêu cầu: Giữ nguyên bố cục 4 góc nhìn trong grid, render siêu thực 8k.`);
    }, [userPrompt, context, lighting, tone, aspectRatio]);

    const handleGenerateClick = async () => {
        if (sourceImages.length === 0) { alert("Vui lòng tải ảnh công trình."); return; }
        
        // Stitch images
        const gridImage = await createGridImage(sourceImages);
        if (!gridImage) return;

        const imgs = [gridImage];
        if (refImage) imgs.push(refImage);

        onGenerate(finalPrompt, imgs, numberOfImages);
    };

    return (
        <Card title="Input (Chế độ Đồng bộ - Multi View)">
            <div className="space-y-6">
                <div className="space-y-4 p-4 border border-brand-primary/30 rounded-lg bg-brand-bg/20">
                    <MultiImageUploader onFilesSelect={setSourceImages} label="Tải nhiều ảnh công trình (Max 4 ảnh cho Grid 2x2)" maxFiles={4} />
                    <p className="text-[10px] text-brand-text-muted italic">Các ảnh sẽ được tự động ghép lại thành một Grid 2x2 để AI xử lý đồng bộ.</p>
                </div>

                <div className="space-y-4 p-4 border border-brand-primary/50 rounded-lg bg-brand-bg/30">
                    <h4 className="text-md font-semibold text-white flex items-center gap-2">
                        <Icon name="adjustments" className="w-4 h-4 text-brand-accent" /> Mô Tả & Tùy Chọn
                    </h4>
                    
                    <ImageUploader onFileSelect={setRefImage} label="Tải ảnh tham chiếu Style (Tuỳ chọn)" />

                    <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Mô tả chi tiết công trình (ví dụ: gạch thẻ màu đỏ, cửa kính đen...)"
                        className="w-full bg-brand-bg border border-brand-primary rounded-lg p-2 h-20 resize-none text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <SelectInput label="Bối cảnh" options={CONTEXT_OPTIONS_SYNC} value={context} onChange={e => setContext(e.target.value)} />
                        <SelectInput label="Ánh sáng" options={LIGHTING_OPTIONS_SYNC} value={lighting} onChange={e => setLighting(e.target.value)} />
                        <SelectInput label="Tone màu" options={TONE_OPTIONS_SYNC} value={tone} onChange={e => setTone(e.target.value)} />
                        <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-text-muted mb-1">Prompt tổng hợp cuối cùng</label>
                        <textarea
                            value={finalPrompt}
                            onChange={(e) => setFinalPrompt(e.target.value)}
                            className="w-full h-24 bg-black/30 border border-brand-primary/30 rounded p-2 text-[10px] font-mono text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <NumberSelector label="Số lượng ảnh kết quả" value={numberOfImages} onChange={setNumberOfImages} min={1} max={4} />
                </div>
                
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || sourceImages.length === 0}
                    className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                    Tạo Ảnh Render Đồng Bộ
                </button>
            </div>
        </Card>
    );
};

const ExteriorSingleMode: React.FC<any> = ({
    sourceImage, setSourceImage,
    referenceImage, setReferenceImage,
    onGenerate,
    isLoading
}) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [context, setContext] = useState('');
    const [lighting, setLighting] = useState('');
    const [tone, setTone] = useState('');
    const [finalPrompt, setFinalPrompt] = useState('Ảnh chụp thực tế công trình');
    const [numImages, setNumImages] = useState(4);
    const [aspectRatio, setAspectRatio] = useState('Auto');
    const [anglePrompt, setAnglePrompt] = useState(EXTERIOR_ANGLE_OPTIONS[0]);

    useEffect(() => {
        const base = 'Ảnh chụp thực tế công trình';
        const parts = [customPrompt, context, lighting, tone].filter(p => p && p.trim() !== '');
        let final = base;
        if (parts.length > 0) final += ', ' + parts.join(', ');
        setFinalPrompt(final);
    }, [customPrompt, context, lighting, tone]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-8">
                <Section title="2. Mô Tả & Tùy Chọn">
                    <div className="space-y-4">
                        <ImageUploader onFileSelect={setReferenceImage} label="Ảnh tham chiếu (Tuỳ chọn)" />
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Thêm mô tả tùy chỉnh (ví dụ: nhà 1 tầng, có gara...)"
                            className="w-full bg-brand-bg border border-brand-primary rounded-lg p-2 h-20 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <SelectInput label="Bối cảnh" options={CONTEXT_OPTIONS_SYNC} value={context} onChange={e => setContext(e.target.value)} />
                            <SelectInput label="Ánh sáng" options={LIGHTING_OPTIONS_SYNC} value={lighting} onChange={e => setLighting(e.target.value)} />
                            <SelectInput label="Tone màu" options={TONE_OPTIONS_SYNC} value={tone} onChange={e => setTone(e.target.value)} />
                            <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
                        </div>
                        
                        <div className="pt-2">
                            <label className="block text-xs font-medium text-brand-text-muted mb-1">Prompt cuối cùng:</label>
                            <textarea
                                value={finalPrompt}
                                onChange={(e) => setFinalPrompt(e.target.value)}
                                className="w-full h-24 bg-brand-bg/50 p-3 rounded-md text-sm text-brand-text border border-brand-primary/30 focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none"
                            />
                        </div>

                        <NumberSelector label="Số lượng ảnh" value={numImages} onChange={setNumImages} min={1} max={4} />

                        <button 
                            onClick={() => onGenerate(finalPrompt, [sourceImage], numImages, aspectRatio, false)} 
                            disabled={isLoading || !sourceImage} 
                            className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Icon name="sparkles" className="w-5 h-5" /> Tạo Ảnh Thực Tế
                        </button>
                    </div>
                </Section>
            </div>
            
            <div className="flex flex-col gap-8">
                <Section title="1. Tải Lên Ảnh Ngoại Thất">
                    <ImageUploader sourceImage={sourceImage} onFileSelect={setSourceImage} label="Tải ảnh ngoại thất gốc" />
                </Section>
                <Section title="3. Đổi Góc Chụp">
                    <div className="space-y-4">
                        <textarea value={anglePrompt} onChange={(e) => setAnglePrompt(e.target.value)} placeholder="Ví dụ: Góc chụp từ dưới lên (low angle)..." className="w-full bg-brand-bg border border-brand-primary rounded-lg p-2 h-24 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                        <select onChange={(e) => setAnglePrompt(e.target.value)} value="" className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none">
                            <option value="" disabled>Hoặc chọn một góc chụp có sẵn</option>
                            {EXTERIOR_ANGLE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <button 
                            onClick={() => onGenerate(anglePrompt, [sourceImage], numImages, aspectRatio, true)} 
                            disabled={isLoading || !sourceImage} 
                            className="w-full bg-brand-primary hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Icon name="sparkles" className="w-5 h-5" /> Tạo Góc Chụp Mới
                        </button>
                    </div>
                </Section>
            </div>
        </div>
    );
};

const ExteriorImproveMode: React.FC<any> = ({ sourceImage, setSourceImage, onGenerateFinal, isLoading }) => {
    const [step2Image, setStep2Image] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [context, setContext] = useState('');
    const [lighting, setLighting] = useState('');

    const handleStartImprovement = async () => {
        if (!sourceImage) return;
        setCurrentStep(1);
        setLoadingMessage("Bước 1: Tách nền...");
        try {
            const step1Prompt = `Isolate the architectural building from its surroundings. Replace background with solid white.`;
            const res1 = await generateImage(step1Prompt, [sourceImage], 1);
            if(res1.imageUrls?.[0]) {
                const step1Img = await fetch(res1.imageUrls[0]).then(r => r.blob()).then(b => ({ file: new File([b], 's1.jpg', {type:b.type}), base64: res1.imageUrls![0], url: '' } as ImageFile));
                setCurrentStep(2);
                setLoadingMessage("Bước 2: Chuyển Sketch...");
                const res2 = await convertToSketch(step1Img, 60);
                if (res2.imageUrls?.[0]) {
                    setStep2Image(res2.imageUrls[0]);
                    setCurrentStep(0);
                }
            }
        } catch (e: any) { alert(e.message); setCurrentStep(0); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Section title="1. Tải Lên Ảnh & Xử Lý">
                <ImageUploader onFileSelect={setSourceImage} label="Tải ảnh cần cải thiện" />
                <button onClick={handleStartImprovement} disabled={!sourceImage || currentStep > 0} className="w-full mt-4 bg-brand-accent text-white py-3 rounded font-bold transition-opacity disabled:opacity-50">
                    {currentStep > 0 ? loadingMessage : "Bắt Đầu Cải Thiện"}
                </button>
            </Section>
            <Section title="2. Render Lại">
                {step2Image ? (
                    <div className="space-y-4">
                        <img src={step2Image} className="h-40 mx-auto object-contain rounded" />
                        <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Mô tả thêm..." className="w-full bg-brand-bg p-2 rounded text-sm h-20 border border-brand-primary" />
                        <button onClick={() => onGenerateFinal(step2Image, customPrompt)} disabled={isLoading} className="w-full bg-brand-primary text-white py-3 rounded font-bold">Tạo Ảnh Render</button>
                    </div>
                ) : <p className="text-center text-brand-text-muted italic py-10">Hoàn tất bước 1 để render lại.</p>}
            </Section>
        </div>
    );
};

export const ExteriorRenderTab: React.FC<ExteriorRenderTabProps> = ({ onEditRequest, onVideoRequest, onStyleChangeRequest, onMaterialChangeRequest }) => {
  const [mode, setMode] = useState<'sync' | 'single' | 'improve'>('sync');
  const [sourceImages, setSourceImages] = useState<ImageFile[]>([]);
  const [singleSourceImage, setSingleSourceImage] = useState<ImageFile | null>(null);

  return (
    <BaseTab 
        tabKey="exterior" 
        onEditRequest={onEditRequest} 
        onVideoRequest={onVideoRequest} 
        onStyleChangeRequest={onStyleChangeRequest}
        onMaterialChangeRequest={onMaterialChangeRequest}
        styleChangeType="exterior"
        showAngleActions={true} 
        comparisonImage={mode === 'sync' ? (sourceImages.length > 0 ? sourceImages[0].base64 : undefined) : (singleSourceImage?.base64)}
    >
      {({ setLoading, setResult, addHistoryItem }) => {

        const handleGenerate = async (prompt: string, imgs: ImageFile[], count: number, ratio: string = 'Auto', isAngle: boolean = false) => {
            setLoading(true); setResult(null);
            let finalP = prompt;
            if (isAngle) finalP += " Change camera angle. Maintain structure.";
            if (ratio !== 'Auto') finalP += ` Aspect ratio ${ratio}.`;

            const res = await generateImage(finalP, imgs, count, '2K');
            setResult(res);
            if(!res.error) addHistoryItem(prompt, res);
            setLoading(false);
        };

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button onClick={() => setMode('sync')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === 'sync' ? 'bg-brand-accent text-white shadow-lg scale-105' : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'}`}>
                    🔄 Đồng bộ (Multi-View)
                </button>
                <button onClick={() => setMode('single')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === 'single' ? 'bg-brand-accent text-white shadow-lg scale-105' : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'}`}>
                    🖼️ Đơn (Single Shot)
                </button>
                <button onClick={() => setMode('improve')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === 'improve' ? 'bg-brand-secondary text-white shadow-lg scale-105' : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'}`}>
                    ✨ Cải thiện (Improve)
                </button>
            </div>

            {mode === 'sync' && <ExteriorSyncMode sourceImages={sourceImages} setSourceImages={setSourceImages} onGenerate={handleGenerate} isLoading={false} />}
            {mode === 'single' && <ExteriorSingleMode sourceImage={singleSourceImage} setSourceImage={setSingleSourceImage} onGenerate={handleGenerate} isLoading={false} />}
            {mode === 'improve' && <ExteriorImproveMode sourceImage={singleSourceImage} setSourceImage={setSingleSourceImage} onGenerateFinal={(url: string, p: string) => handleGenerate(p, [], 2)} isLoading={false} />}
          </div>
        );
      }}
    </BaseTab>
  );
};
