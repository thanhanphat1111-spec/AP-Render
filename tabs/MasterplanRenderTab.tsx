
import React, { useState, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage, generateText } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { AngleSelectorCanvas } from '../components/AngleSelectorCanvas';
import { Icon } from '../components/icons';

interface MasterplanRenderTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialImage?: ImageFile | null;
  onClearInitialImage?: () => void;
}

const DEFAULT_PROMPT_SAMPLES = [
    'Ảnh chụp thực tế Master Plan từ góc nhìn flycam, thấy rõ tổng thể quy hoạch các khu vực chức năng, cây xanh và giao thông.',
    'Render phối cảnh tổng thể theo phong cách kiến trúc hiện đại, tập trung vào các công trình điểm nhấn và không gian công cộng.',
    'Phối cảnh siêu thực của khu đô thị vào lúc hoàng hôn, với ánh đèn đường bật sáng và các tòa nhà cao tầng lấp lánh.',
    'Tạo một bức ảnh tả thực khu nghỉ dưỡng ven biển từ trên cao, thể hiện rõ các biệt thự, hồ bơi và bãi biển riêng.',
    'Phối cảnh một khu đô thị thông minh (smart city) với kiến trúc tương lai, có các phương tiện tự hành và năng lượng mặt trời.',
];

const ANGLE_PROMPT_SAMPLES_SECTION_3 = [
    'Tạo góc nhìn Fly cam từ trên cao, bao quát toàn bộ dự án.',
    'Tạo góc nhìn ngang tầm mắt như một người đang đi bộ trong khu đô thị.',
    'Tạo góc nhìn từ dưới lên, nhấn mạnh sự hùng vĩ của tòa nhà cao nhất trong quy hoạch.',
    'Render phối cảnh từ góc chéo, tạo cảm giác năng động và nghệ thuật cho tổng thể.',
    'Góc nhìn 3/4 từ trái qua phải, nhấn mạnh mặt tiền chính của khu vực trung tâm.',
    'Góc nhìn dọc theo trục đường chính của dự án, tạo cảm giác chiều sâu hun hút.',
    'Cận cảnh một khu vực công cộng sầm uất như quảng trường hoặc công viên trung tâm.',
];

const WEATHER_OPTIONS = [
    '-- Chọn thời tiết --',
    'Trời ban ngày nắng gắt, bóng đổ rõ nét',
    'Trời ban ngày nhiều mây, ánh sáng dịu nhẹ',
    'Trời ban đêm với ánh sáng đèn đô thị và các công trình',
    'Hoàng hôn với tông màu cam-vàng ấm áp',
    'Bình minh với sương sớm mờ ảo',
    'Sau cơn mưa, mặt đường còn ẩm ướt',
];

const TONE_OPTIONS = [
    '-- Chọn tone màu --',
    'Chân thực (Default)',
    'Vintage',
    'Retro',
    'Cinema (Điện ảnh)',
    'Black & White (Trắng đen)',
    'Cyberpunk Neon',
];

const ASPECT_RATIO_OPTIONS = ['Tự động (Giữ nguyên gốc)', '16:9 (Landscape)', '9:16 (Portrait)', '1:1 (Square)', '4:3 (Standard)', '3:4 (Portrait)', '21:9 (Cinematic)'];

const ANGLE_VIEW_TYPE_OPTIONS = ['Fly cam trên cao', 'Góc ngang tầm mắt (line eye)', 'Góc từ dưới lên'];

const ANGLE_OPTIONS_SECTION_2 = [
    '-- Chọn góc chụp --',
    'Ngang tầm mắt (Eye-level)',
    'Góc nhìn từ trên cao (High Angle / Bird-eye)',
    'Góc nhìn từ dưới lên (Low Angle / Worm-eye)',
    'Cận cảnh chi tiết (Close-up)',
    'Toàn cảnh (Góc rộng / Panorama)',
    'Drone / Mặt chim (Top-down)',
    'Góc nhìn 1 điểm tụ (One-point perspective)',
    'Chụp qua vật cản (Framed view / Foreground interest)',
    'Đối xứng (Symmetrical)',
    'Bố cục đường chéo (Diagonal composition)',
    'Nhìn từ bên đường (Street view)',
    'Nhìn qua cửa kính (Through glass)',
    'Phản chiếu qua mặt nước (Reflection)',
    'Chụp đêm (Night shot)',
    'Bóng đổ dài (Long shadow)',
];

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const PromptResultList: React.FC<{ 
    promptsText: string; 
    copyToClipboard: (text: string) => void; 
    onGenerateFromPrompt: (prompt: string) => void;
}> = ({ promptsText, copyToClipboard, onGenerateFromPrompt }) => {
    const lines = promptsText.split('\n').filter(line => line.trim() !== '');

    return (
        <div className="space-y-2 text-brand-text-muted h-48 p-2 overflow-y-auto custom-scrollbar bg-brand-bg/50 rounded-lg border border-brand-primary/50">
            {lines.map((line, index) => {
                const cleanLine = line.trim();
                // Regex to detect header formats
                const isHeader = /^\s*(?:(?:\(\d+\)|[\d]+️⃣)\s+|Nhóm\s+\d+|---)/i.test(cleanLine);

                if (isHeader) {
                    return (
                        <h4 key={index} className="text-sm font-bold text-white pt-3 first:pt-0 border-b border-brand-primary/30 pb-1 mb-2">
                            {cleanLine.replace(/---/g, '')}
                        </h4>
                    );
                }
                return (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-brand-surface/50 rounded-md border border-brand-primary/30 hover:bg-brand-primary/20 transition-colors group">
                        <p className="text-xs flex-grow leading-relaxed line-clamp-2">{cleanLine}</p>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onGenerateFromPrompt(cleanLine)} title="Sử dụng prompt này" className="text-brand-text-muted hover:text-brand-accent p-1 rounded-md hover:bg-brand-primary/50 transition-colors">
                                <Icon name="photo" className="w-4 h-4"/>
                            </button>
                            <button onClick={() => copyToClipboard(cleanLine)} title="Copy prompt" className="text-brand-text-muted hover:text-brand-accent p-1 rounded-md hover:bg-brand-primary/50 transition-colors">
                                <Icon name="sparkles" className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const MasterplanRenderTab: React.FC<MasterplanRenderTabProps> = ({ onEditRequest, onVideoRequest, initialImage, onClearInitialImage }) => {
  // --- SHARED STATE ---
  const [masterplanImage, setMasterplanImage] = useState<ImageFile | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [masterplanType, setMasterplanType] = useState<'planning' | 'landscape'>('planning');
  
  // --- SECTION 2: DESCRIPTION-BASED RENDERING ---
  const [baseDescription, setBaseDescription] = useState('');
  const [weatherPromptSection2, setWeatherPromptSection2] = useState('');
  const [tonePromptSection2, setTonePromptSection2] = useState('');
  const [numImagesSection2, setNumImagesSection2] = useState(1);
  const [aspectRatioSection2, setAspectRatioSection2] = useState(ASPECT_RATIO_OPTIONS[0]);
  const [anglePromptSection2, setAnglePromptSection2] = useState('');
  const [finalPromptSection2, setFinalPromptSection2] = useState('');
  
  // Dynamic suggestions string block
  const [generatedPromptsBlock, setGeneratedPromptsBlock] = useState<string>('');

  // --- SECTION 3: ANGLE-DRIVEN RENDERING ---
  const [angleDirection, setAngleDirection] = useState<{ start: {x:number, y:number}, end: {x:number, y:number} } | null>(null);
  const [angleViewType, setAngleViewType] = useState(ANGLE_VIEW_TYPE_OPTIONS[0]);
  const [angleTextPromptSection3, setAngleTextPromptSection3] = useState('');
  const [angleWeatherPrompt, setAngleWeatherPrompt] = useState('');
  const [angleNumImages, setAngleNumImages] = useState(1);
  const [angleAspectRatio, setAngleAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);

  // Handle initial image transfer
  useEffect(() => {
    if (initialImage) {
      setMasterplanImage(initialImage);
      if (onClearInitialImage) onClearInitialImage();
    }
  }, [initialImage, onClearInitialImage]);

  // Effect to auto-generate the editable prompt for Section 2
  useEffect(() => {
    let aspectRatioPrompt = '';
    if (aspectRatioSection2 === ASPECT_RATIO_OPTIONS[0]) {
        if (masterplanImage?.width && masterplanImage?.height) {
            aspectRatioPrompt = `Ảnh kết quả phải có tỷ lệ khung hình giống hệt ảnh gốc, là ${masterplanImage.width}x${masterplanImage.height} pixels.`;
        } else {
            aspectRatioPrompt = 'Tự động chọn tỷ lệ khung hình phù hợp.';
        }
    } else {
        aspectRatioPrompt = `Tỷ lệ khung hình là ${aspectRatioSection2.split(' ')[0]}.`;
    }

    const typeContext = masterplanType === 'landscape' 
        ? "Tập trung vào chi tiết cảnh quan, cây xanh, đường dạo, hồ nước và các tiện ích ngoài trời."
        : "Tập trung vào quy hoạch tổng thể, khối công trình kiến trúc, phân khu chức năng và giao thông.";

    const elements = [
      baseDescription || `Tạo ảnh render phối cảnh siêu thực, chất lượng 8k từ ảnh Mặt bằng tổng thể (Master Plan) được cung cấp. ${typeContext}`,
      weatherPromptSection2,
      tonePromptSection2,
      anglePromptSection2,
      aspectRatioPrompt
    ];
    setFinalPromptSection2(elements.filter(Boolean).join(' '));
  }, [baseDescription, weatherPromptSection2, tonePromptSection2, anglePromptSection2, aspectRatioSection2, masterplanImage, masterplanType]);

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
          alert("Đã copy prompt vào clipboard");
      });
  }

  const onSelectSample = (prompt: string) => {
      if (prompt.startsWith('---') || prompt.startsWith('Nhóm') || prompt.startsWith('(')) return;
      setBaseDescription(prompt);
  }

  return (
    <BaseTab tabKey="masterplan" onEditRequest={onEditRequest} onVideoRequest={onVideoRequest} comparisonImage={masterplanImage?.base64}>
      {({ setLoading, setResult, addHistoryItem }) => {
        
        const handleGenerateFromDescription = async () => {
            if (!masterplanImage) {
                alert('Vui lòng tải ảnh Mặt bằng tổng thể.');
                return;
            }
            if (!finalPromptSection2.trim()) {
                alert('Mô tả không được để trống.');
                return;
            }
            setLoading(true);
            setResult(null);
            
            const finalPrompt = `${finalPromptSection2} Kết quả cuối cùng phải trông như một bức ảnh chụp thực tế bằng máy ảnh kỹ thuật số hoặc flycam chuyên nghiệp.`;
            const response = await generateImage(finalPrompt, [masterplanImage], numImagesSection2);
            
            setResult(response);
            if (!response.error) {
                addHistoryItem(finalPrompt, response);
            }
            setLoading(false);
        };

        const handleGenerateFromAngle = async () => {
            if (!masterplanImage) {
                alert('Vui lòng tải ảnh Mặt bằng tổng thể.');
                return;
            }
            if (!angleDirection && !angleTextPromptSection3) {
                alert('Vui lòng vẽ hướng nhìn hoặc chọn một góc nhìn có sẵn trong mục 3.');
                return;
            }

            setLoading(true);
            setResult(null);

            let aspectRatioPrompt = '';
            if (angleAspectRatio === ASPECT_RATIO_OPTIONS[0]) {
                if (masterplanImage?.width && masterplanImage?.height) {
                    aspectRatioPrompt = `Ảnh kết quả phải có tỷ lệ khung hình giống hệt ảnh mặt bằng, là ${masterplanImage.width}x${masterplanImage.height} pixels.`;
                } else {
                    aspectRatioPrompt = 'Giữ nguyên tỷ lệ khung hình của ảnh mặt bằng.';
                }
            } else {
                aspectRatioPrompt = `Tỷ lệ khung hình là ${angleAspectRatio.split(' ')[0]}.`;
            }

            const elements: string[] = [
                `Từ ảnh Mặt bằng tổng thể (Master Plan) được cung cấp, hãy tạo ra một ảnh render phối cảnh siêu thực, chất lượng 8k.`,
                angleWeatherPrompt,
            ];

            if (angleDirection && angleViewType) {
                const startX = angleDirection.start.x.toFixed(2);
                const startY = angleDirection.start.y.toFixed(2);
                const endX = angleDirection.end.x.toFixed(2);
                const endY = angleDirection.end.y.toFixed(2);
                elements.push(`Tạo góc nhìn theo hướng được vẽ trên ảnh. Vị trí camera (điểm 1) là [${startX}, ${startY}], nhìn về phía mục tiêu (điểm 2) là [${endX}, ${endY}].`);
                elements.push(`Kiểu góc nhìn là: ${angleViewType}.`);
            } else if (angleTextPromptSection3) {
                elements.push(angleTextPromptSection3);
            }

            elements.push(aspectRatioPrompt);
            elements.push("Kết quả cuối cùng phải trông như một bức ảnh chụp thực tế.");

            const finalPrompt = elements.filter(Boolean).join(' ');
            const response = await generateImage(finalPrompt, [masterplanImage], angleNumImages);

            setResult(response);
            if (!response.error) {
                addHistoryItem(finalPrompt, response);
            }
            setLoading(false);
        };
      
        const handleSuggestPrompt = async () => {
            if (!masterplanImage) {
                alert('Vui lòng tải ảnh Master Plan để AI có thể đưa ra gợi ý tốt nhất.');
                return;
            }
            setIsSuggesting(true);
            
            const systemInstruction = `You are an AI expert in architectural visualization. 
            Analyze the provided master plan. Generate 15 detailed prompts in Vietnamese, organized into 3 categories:
            1. 5 Wide shots (Góc toàn cảnh)
            2. 5 Medium shots (Góc trung cảnh)
            3. 5 Close-up shots (Góc cận cảnh)
            
            Format strictly as follows:
            [HEADER_WIDE]
            1. Prompt 1...
            2. Prompt 2...
            [HEADER_MEDIUM]
            1. Prompt 1...
            2. Prompt 2...
            [HEADER_CLOSEUP]
            1. Prompt 1...
            2. Prompt 2...
            
            The prompt content must be detailed and follow the style: "Góc chụp..., ánh sáng..., bố cục...". Do not include the header title inside the prompt text line.
            `;
            const userPrompt = "Phân tích ảnh mặt bằng tổng thể này và gợi ý các góc phối cảnh chi tiết.";
            
            const response = await generateText(userPrompt, systemInstruction, masterplanImage);
            if(response.text) {
                let formattedText = response.text
                    .replace('[HEADER_WIDE]', '--- (1) Góc toàn cảnh (Wide Shots) ---')
                    .replace('[HEADER_MEDIUM]', '--- (2) Góc trung cảnh (Medium Shots) ---')
                    .replace('[HEADER_CLOSEUP]', '--- (3) Góc cận cảnh (Close-up Shots) ---');
                setGeneratedPromptsBlock(formattedText);
            } else {
                alert(`Lỗi khi tạo gợi ý: ${response.error || 'Lỗi không xác định'}`);
            }
            setIsSuggesting(false);
        };

        return (
          <div className="space-y-4">
            {/* Type Selector */}
            <div className="flex bg-brand-surface rounded-lg p-1 mb-2">
                <button 
                    onClick={() => setMasterplanType('planning')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${masterplanType === 'planning' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:text-white'}`}
                >
                    Phối cảnh Quy hoạch
                </button>
                <button 
                    onClick={() => setMasterplanType('landscape')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${masterplanType === 'landscape' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:text-white'}`}
                >
                    Phối cảnh Cảnh quan
                </button>
            </div>

            <Card title="1. Input ảnh Mặt bằng tổng thể (Master Plan)">
              <ImageUploader onFileSelect={setMasterplanImage} label={masterplanImage ? "Đã tải ảnh (có thể thay đổi)" : "Tải ảnh Master Plan"} />
            </Card>

            <Card title="2. Tạo Phối Cảnh theo Mô tả & Tùy chọn">
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <label className="block text-sm font-medium text-brand-text-muted">Prompt tổng hợp (có thể chỉnh sửa)</label>
                             <button
                                onClick={handleSuggestPrompt}
                                disabled={isSuggesting || !masterplanImage}
                                className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSuggesting ? 'Đang phân tích...' : '✨ Gợi ý từ AI'}
                            </button>
                        </div>
                        <textarea
                          rows={4}
                          value={finalPromptSection2}
                          onChange={(e) => setFinalPromptSection2(e.target.value)}
                          className="w-full bg-brand-bg/50 border border-brand-primary/50 rounded-lg px-3 py-2 text-xs font-mono text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/80 cursor-text"
                        />
                    </div>
                    
                    {generatedPromptsBlock && (
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-2">Chọn prompt mẫu để cập nhật ô trên</label>
                            <PromptResultList 
                                promptsText={generatedPromptsBlock} 
                                copyToClipboard={copyToClipboard}
                                onGenerateFromPrompt={onSelectSample}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectInput label="Thời tiết" options={WEATHER_OPTIONS} value={weatherPromptSection2 || WEATHER_OPTIONS[0]} onChange={e => setWeatherPromptSection2(e.target.value === WEATHER_OPTIONS[0] ? '' : e.target.value)} />
                        <SelectInput label="Tone màu" options={TONE_OPTIONS} value={tonePromptSection2 || TONE_OPTIONS[0]} onChange={e => setTonePromptSection2(e.target.value === TONE_OPTIONS[0] ? '' : e.target.value)} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="md:col-span-1">
                           <NumberSelector label="Số lượng kết quả" value={numImagesSection2} onChange={setNumImagesSection2} min={1} max={4} />
                        </div>
                        <div className="md:col-span-2">
                           <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatioSection2} onChange={e => setAspectRatioSection2(e.target.value)} />
                        </div>
                    </div>
                    <SelectInput label="Góc chụp" options={ANGLE_OPTIONS_SECTION_2} value={anglePromptSection2 || ANGLE_OPTIONS_SECTION_2[0]} onChange={e => setAnglePromptSection2(e.target.value === ANGLE_OPTIONS_SECTION_2[0] ? '' : e.target.value)} />
                     <button
                        onClick={handleGenerateFromDescription}
                        className="w-full bg-brand-primary hover:bg-brand-accent text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                        Tạo Phối Cảnh theo Mô tả
                    </button>
                </div>
            </Card>

            <Card title="3. Tạo Phối Cảnh theo Hướng Nhìn Vẽ Tay">
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-muted mb-2">Vẽ hướng nhìn (ưu tiên cao nhất)</label>
                        <AngleSelectorCanvas 
                            imageFile={masterplanImage}
                            onDirectionChange={setAngleDirection}
                        />
                    </div>

                    {angleDirection && (
                        <SelectInput 
                            label="Lựa chọn kiểu góc nhìn"
                            options={ANGLE_VIEW_TYPE_OPTIONS}
                            value={angleViewType}
                            onChange={(e) => setAngleViewType(e.target.value)}
                        />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectInput label="Thời tiết" options={WEATHER_OPTIONS} value={angleWeatherPrompt || WEATHER_OPTIONS[0]} onChange={e => setAngleWeatherPrompt(e.target.value === WEATHER_OPTIONS[0] ? '' : e.target.value)} />
                        <NumberSelector label="Số lượng kết quả" value={angleNumImages} onChange={setAngleNumImages} min={1} max={4} />
                    </div>
                    <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={angleAspectRatio} onChange={e => setAngleAspectRatio(e.target.value)} />

                    <p className="text-xs text-brand-text-muted">Vẽ hướng nhìn lên ảnh trên để có góc nhìn chính xác nhất. Điểm 1 là vị trí camera, điểm 2 là hướng nhìn tới.</p>
                 </div>
            </Card>

            <button
              onClick={handleGenerateFromAngle}
              className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors"
            >
              Tạo Phối Cảnh theo Hướng Nhìn
            </button>
          </div>
        );
      }}
    </BaseTab>
  );
};