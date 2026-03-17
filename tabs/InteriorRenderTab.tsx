
import React, { useState, useEffect, useCallback } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader'; 
import { MultiImageUploader } from '../components/MultiImageUploader';
import { generateImage, generateText, convertToSketch } from '../services/aiService';
import { ImageFile, AiServiceResult } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { Icon } from '../components/icons';
import { SelectInput } from '../components/SelectInput';
import { 
    STYLE_OPTIONS, MATERIAL_OPTIONS, TONE_OPTIONS, LIGHTING_MOOD_OPTIONS, 
    DESIGN_LINES_OPTIONS, DETAIL_LEVEL_OPTIONS, PRIORITY_FEELING_OPTIONS, 
    ASPECT_RATIO_OPTIONS, SPACE_TYPE_OPTIONS, INTERIOR_ANGLE_OPTIONS,
    CONTEXT_OPTIONS
} from './InteriorRenderConfig';

interface InteriorRenderTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  onStyleChangeRequest: (image: ImageFile, type: 'exterior' | 'interior') => void;
  onMaterialChangeRequest: (image: ImageFile) => void;
}

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

const InteriorSyncMode: React.FC<{
    setLoading: (loading: boolean) => void;
    setResult: (result: AiServiceResult | null) => void;
    addHistoryItem: (prompt: string, result: AiServiceResult) => void;
}> = ({ setLoading, setResult, addHistoryItem }) => {
  const [sourceImages, setSourceImages] = useState<ImageFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0]);
  const [lightingMood, setLightingMood] = useState(LIGHTING_MOOD_OPTIONS[0]);
  const [colorTone, setColorTone] = useState(TONE_OPTIONS[0]);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIAL_OPTIONS[0]);
  const [designLines, setDesignLines] = useState(DESIGN_LINES_OPTIONS[0]);
  const [detailLevel, setDetailLevel] = useState(DETAIL_LEVEL_OPTIONS[0]);
  const [priorityFeeling, setPriorityFeeling] = useState(PRIORITY_FEELING_OPTIONS[0]);
  const [generalDescription, setGeneralDescription] = useState(''); 
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');

  useEffect(() => {
      const selections = [
          selectedStyle !== STYLE_OPTIONS[0] ? `Phong cách: ${selectedStyle}` : '',
          selectedMaterial !== MATERIAL_OPTIONS[0] ? `Vật liệu: ${selectedMaterial}` : '',
          colorTone !== TONE_OPTIONS[0] ? `Tone màu: ${colorTone}` : '',
          lightingMood !== LIGHTING_MOOD_OPTIONS[0] ? `Ánh sáng: ${lightingMood}` : '',
          designLines !== DESIGN_LINES_OPTIONS[0] ? `Đường nét: ${designLines}` : '',
          detailLevel !== DETAIL_LEVEL_OPTIONS[0] ? `Chi tiết: ${detailLevel}` : '',
          priorityFeeling !== PRIORITY_FEELING_OPTIONS[0] ? `Cảm giác: ${priorityFeeling}` : '',
          aspectRatio !== 'Auto' ? `Tỷ lệ: ${aspectRatio}` : ''
      ].filter(Boolean).join(', ');

      const base = "Ảnh chụp thực tế các góc nhìn của không gian nội thất";
      const desc = [selections, generalDescription].filter(Boolean).join('. ');
      setFinalPrompt(`${base}${desc ? ', ' + desc : ''}. Yêu cầu: Giữ nguyên bố cục của 4 góc nhìn trong Grid, render chất lượng chuyên nghiệp 8k.`);
  }, [selectedStyle, selectedMaterial, colorTone, lightingMood, designLines, detailLevel, priorityFeeling, aspectRatio, generalDescription]);

  const handleSuggestPrompt = async () => {
      if (sourceImages.length === 0) { alert("Vui lòng tải ảnh phòng."); return; }
      setIsSuggesting(true);
      const systemInstruction = "Bạn là một KTS trưởng. Hãy phân tích các góc nhìn của cùng một không gian phòng và đưa ra nhận xét chung về không gian, phong cách hiện trạng và gợi ý cải thiện đồng bộ.";
      const response = await generateText("Nhận xét về không gian chung của phòng dựa trên các ảnh này.", systemInstruction, sourceImages[0]);
      if (response.text) setGeneralDescription(response.text);
      setIsSuggesting(false);
  };

  const handleGenerate = async () => {
      if (sourceImages.length === 0) { alert('Vui lòng tải ảnh.'); return; }
      setLoading(true); setResult(null);

      const gridImage = await createGridImage(sourceImages);
      if (!gridImage) return;

      const response = await generateImage(finalPrompt, [gridImage], numberOfImages, '2K');
      setResult(response);
      if (!response.error) addHistoryItem("Multi-View Interior Grid", response);
      setLoading(false);
  };

  return (
      <Card title="Input (Chế độ Đồng bộ)">
        <div className="space-y-6">
          <div className="space-y-4 p-4 border border-brand-primary/30 rounded-lg bg-brand-bg/20">
            <MultiImageUploader onFilesSelect={setSourceImages} label="Tải ảnh nội thất các góc nhìn (Max 4)" maxFiles={4} />
            <p className="text-[10px] text-brand-text-muted italic">Các góc nhìn sẽ được ghép thành Grid 2x2 để AI render đồng bộ vật liệu và phong cách.</p>
          </div>
          
          <div className="space-y-4 p-4 border border-brand-primary/50 rounded-lg bg-brand-bg/30">
             <h4 className="text-md font-semibold text-white flex items-center gap-2">
                <Icon name="adjustments" className="w-4 h-4 text-brand-accent" /> Bối cảnh & Phong cách (Master Style)
             </h4>
             <div className="grid grid-cols-2 gap-4">
                <SelectInput label="Phong cách nội thất" options={STYLE_OPTIONS} value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} />
                <SelectInput label="Vật liệu chủ đạo" options={MATERIAL_OPTIONS} value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)} />
                <SelectInput label="Tone màu" options={TONE_OPTIONS} value={colorTone} onChange={e => setColorTone(e.target.value)} />
                <SelectInput label="Mood ánh sáng" options={LIGHTING_MOOD_OPTIONS} value={lightingMood} onChange={e => setLightingMood(e.target.value)} />
                <SelectInput label="Đường nét" options={DESIGN_LINES_OPTIONS} value={designLines} onChange={e => setDesignLines(e.target.value)} />
                <SelectInput label="Mức độ chi tiết" options={DETAIL_LEVEL_OPTIONS} value={detailLevel} onChange={e => setDetailLevel(e.target.value)} />
                <SelectInput label="Cảm giác chủ đạo" options={PRIORITY_FEELING_OPTIONS} value={priorityFeeling} onChange={e => setPriorityFeeling(e.target.value)} />
                <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
             </div>
             
             <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-brand-text-muted">Mô tả style chung</label>
                    <button onClick={handleSuggestPrompt} disabled={isSuggesting} className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md text-white">
                        {isSuggesting ? '...' : '✨ Gợi ý đồng bộ'}
                    </button>
                </div>
                <textarea
                    rows={3}
                    value={generalDescription}
                    onChange={(e) => setGeneralDescription(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Mô tả chung..."
                />
            </div>

            <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted mb-1">Prompt tổng hợp cuối cùng</label>
                <textarea
                    value={finalPrompt}
                    onChange={(e) => setFinalPrompt(e.target.value)}
                    className="w-full h-24 bg-black/30 border border-brand-primary/30 rounded p-2 text-[10px] font-mono text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
            </div>
              
             <NumberSelector label="Số lượng ảnh" value={numberOfImages} onChange={setNumberOfImages} />
             <button onClick={handleGenerate} className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold py-3 rounded-lg text-sm">
                Tạo Ảnh Render Đồng Bộ
            </button>
          </div>
        </div>
      </Card>
  );
};

const InteriorSingleMode: React.FC<any> = ({ sourceImage, setSourceImage, onGenerate, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('Auto');
    const [numImages, setNumImages] = useState(4);
    
    const [selectedRoomType, setSelectedRoomType] = useState(SPACE_TYPE_OPTIONS[0]);
    const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0]);
    const [selectedLighting, setSelectedLighting] = useState(LIGHTING_MOOD_OPTIONS[0]);
    const [selectedTone, setSelectedTone] = useState(TONE_OPTIONS[0]);
    const [selectedContext, setSelectedContext] = useState(CONTEXT_OPTIONS[0]);
    const [selectedAngle, setSelectedAngle] = useState(INTERIOR_ANGLE_OPTIONS[0]);
    const [refImage, setRefImage] = useState<ImageFile | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleSuggestPrompt = async () => {
        if (!sourceImage) { alert("Vui lòng tải ảnh gốc."); return; }
        setIsSuggesting(true);
        
        const roomType = selectedRoomType !== SPACE_TYPE_OPTIONS[0] ? selectedRoomType : "không gian nội thất";
        const style = selectedStyle !== STYLE_OPTIONS[0] ? selectedStyle : "hiện đại";
        const context = selectedContext !== CONTEXT_OPTIONS[0] ? selectedContext : "tự nhiên";
        const lighting = selectedLighting !== LIGHTING_MOOD_OPTIONS[0] ? selectedLighting : "ánh sáng tự nhiên";
        const tone = selectedTone !== TONE_OPTIONS[0] ? selectedTone : "trung tính";

        const systemInstruction = `Bạn là một chuyên gia thiết kế nội thất. Hãy viết một đoạn mô tả chi tiết cho ảnh nội thất dựa trên các thông tin sau:
        - Loại phòng: ${roomType}
        - Phong cách: ${style}
        - Bối cảnh: ${context}
        - Ánh sáng: ${lighting}
        - Tone màu: ${tone}
        ${refImage ? "- Có ảnh tham chiếu kèm theo (ưu tiên phong cách, bối cảnh, ánh sáng, vật liệu từ ảnh này)" : ""}
        
        Yêu cầu mô tả chi tiết về vị trí, hình thức thiết kế, vật liệu của sàn, trần, tường, vách, vật dụng, cây xanh, cửa, đèn... theo phong cách đã chọn.
        Đoạn văn phải bắt đầu bằng: "Ảnh chụp thực tế nội thất ${roomType}, phong cách ${style} với các thành phần chính..."
        Kết thúc bằng việc liệt kê Bối cảnh: ${context}; Ánh sáng: ${lighting}; Tone màu: ${tone}.
        Nếu có ảnh tham chiếu, hãy nhấn mạnh việc áp dụng các yếu tố từ ảnh tham chiếu vào không gian gốc.`;

        const response = await generateText("Hãy tạo mô tả chi tiết cho không gian nội thất này.", systemInstruction, sourceImage);
        if (response.text) setPrompt(response.text);
        setIsSuggesting(false);
    };

    const handleGenerateClick = () => {
        let finalPrompt = prompt;
        if (selectedAngle !== INTERIOR_ANGLE_OPTIONS[0]) {
            finalPrompt += `. Góc chụp: ${selectedAngle}`;
        }
        
        const images = [sourceImage];
        if (refImage) images.push(refImage);
        
        onGenerate(finalPrompt, images, numImages, aspectRatio);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="1. Ảnh & Cấu hình">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-brand-text-muted uppercase">Ảnh gốc (Hiện trạng)</label>
                            <ImageUploader sourceImage={sourceImage} onFileSelect={setSourceImage} label="Tải ảnh nội thất" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-brand-text-muted uppercase">Ảnh tham chiếu (Style/Ref)</label>
                            <ImageUploader sourceImage={refImage} onFileSelect={setRefImage} label="Tải ảnh tham chiếu" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectInput label="Loại phòng" options={SPACE_TYPE_OPTIONS} value={selectedRoomType} onChange={e => setSelectedRoomType(e.target.value)} />
                        <SelectInput label="Phong cách" options={STYLE_OPTIONS} value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} />
                        <SelectInput label="Bối cảnh" options={CONTEXT_OPTIONS} value={selectedContext} onChange={e => setSelectedContext(e.target.value)} />
                        <SelectInput label="Ánh sáng" options={LIGHTING_MOOD_OPTIONS} value={selectedLighting} onChange={e => setSelectedLighting(e.target.value)} />
                        <SelectInput label="Tone màu" options={TONE_OPTIONS} value={selectedTone} onChange={e => setSelectedTone(e.target.value)} />
                        <SelectInput label="Đổi Góc Chụp" options={INTERIOR_ANGLE_OPTIONS} value={selectedAngle} onChange={e => setSelectedAngle(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-brand-text-muted uppercase">Mô tả chi tiết (Prompt)</label>
                            <button 
                                onClick={handleSuggestPrompt} 
                                disabled={isSuggesting || !sourceImage}
                                className="text-[10px] bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent px-2 py-1 rounded border border-brand-accent/30 transition-all"
                            >
                                {isSuggesting ? 'Đang tạo...' : '✨ Gợi ý từ AI'}
                            </button>
                        </div>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)} 
                            className="w-full bg-black/20 p-3 rounded-lg h-32 border border-white/10 text-sm focus:ring-1 focus:ring-brand-accent outline-none" 
                            placeholder="Mô tả không gian, vật liệu, đồ đạc..." 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectInput label="Tỷ lệ" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
                        <NumberSelector label="Số lượng" value={numImages} onChange={setNumImages} />
                    </div>

                    <button 
                        onClick={handleGenerateClick} 
                        disabled={isLoading || !sourceImage} 
                        className="btn-primary py-4 text-lg"
                    >
                        {isLoading ? <Icon name="spinner" className="animate-spin" /> : <Icon name="sparkles" />}
                        Tạo Ảnh Render
                    </button>
                </div>
            </Card>
            <Card title="Hướng dẫn & Gợi ý">
                <div className="space-y-4 text-sm text-brand-text-muted">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                            <Icon name="info" className="w-4 h-4 text-brand-accent" /> Cách sử dụng hiệu quả
                        </h4>
                        <ul className="list-disc list-inside space-y-2 text-xs">
                            <li>Tải ảnh hiện trạng rõ nét, đủ ánh sáng.</li>
                            <li>Sử dụng <strong>Ảnh tham chiếu</strong> để AI học theo phong cách, màu sắc và vật liệu bạn thích.</li>
                            <li>Chọn <strong>Loại phòng</strong> và <strong>Phong cách</strong> trước khi nhấn <strong>Gợi ý từ AI</strong> để có prompt chính xác nhất.</li>
                            <li><strong>Đổi Góc Chụp:</strong> Giúp AI hiểu góc nhìn bạn mong muốn (rộng, cận cảnh...).</li>
                        </ul>
                    </div>
                    
                    <div className="p-4 bg-brand-accent/5 rounded-lg border border-brand-accent/10">
                        <h4 className="font-bold text-brand-accent mb-2 flex items-center gap-2">
                            <Icon name="sparkles" className="w-4 h-4" /> Mẹo Prompt
                        </h4>
                        <p className="text-xs italic">
                            "Ảnh chụp thực tế nội thất phòng khách, phong cách hiện đại với sàn gỗ sồi, tường ốp đá marble, sofa nỉ xám, đèn chùm pha lê, ánh sáng tự nhiên từ cửa sổ lớn..."
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const InteriorRenderTab: React.FC<InteriorRenderTabProps> = ({ onEditRequest, onVideoRequest, onStyleChangeRequest, onMaterialChangeRequest }) => {
  const [mode, setMode] = useState<'sync' | 'single' | 'improve'>('sync');
  const [singleSourceImage, setSingleSourceImage] = useState<ImageFile | null>(null);

  return (
    <BaseTab 
        tabKey="interior" 
        onEditRequest={onEditRequest} 
        onVideoRequest={onVideoRequest}
        onStyleChangeRequest={onStyleChangeRequest}
        onMaterialChangeRequest={onMaterialChangeRequest}
        styleChangeType="interior"
        showAngleActions={true} 
        comparisonImage={singleSourceImage?.base64}
    >
      {({ isLoading, setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async (prompt: string, imgs: ImageFile[], count: number, ratio: string = 'Auto') => {
            setLoading(true); setResult(null);
            let finalP = prompt;
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
            </div>

            {mode === 'sync' && <InteriorSyncMode setLoading={setLoading} setResult={setResult} addHistoryItem={addHistoryItem} />}
            {mode === 'single' && <InteriorSingleMode sourceImage={singleSourceImage} setSourceImage={setSingleSourceImage} onGenerate={handleGenerate} isLoading={isLoading} />}
          </div>
        );
      }}
    </BaseTab>
  );
};
