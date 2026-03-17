import React, { useState, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';

interface InteriorStyleChangeTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialImage: ImageFile | null;
  onClearInitialImage: () => void;
}

const STYLE_SAMPLES = [
    { name: 'Tối giản (Minimalism)', description: 'tập trung vào đường nét sạch sẽ, không gian thoáng đãng và bảng màu trung tính.' },
    { name: 'Hiện đại (Modern)', description: 'tập trung vào các hình khối đơn giản, vật liệu như kim loại, kính và nhựa.' },
    { name: 'Bắc Âu (Scandinavian)', description: 'tập trung vào sự ấm cúng, ánh sáng tự nhiên, vật liệu gỗ và màu sắc tươi sáng.' },
    { name: 'Công nghiệp (Industrial)', description: 'tập trung vào các vật liệu thô mộc như gạch, bê tông, kim loại và các chi tiết kết cấu lộ ra ngoài.' },
    { name: 'Wabi-sabi', description: 'tập trung vào vẻ đẹp không hoàn hảo, vật liệu tự nhiên, thô mộc và sự tĩnh lặng.' },
    { name: 'Bohemian', description: 'tập trung vào sự tự do, chiết trung với nhiều họa tiết, cây xanh và đồ trang trí thủ công.' },
    { name: 'Tân cổ điển (Neoclassical)', description: 'tập trung vào sự sang trọng, các đường phào chỉ tinh xảo, và nội thất thanh lịch.' },
    { name: 'Coastal (Ven biển)', description: 'tập trung vào không gian thoáng đãng, ánh sáng tự nhiên và tông màu xanh-trắng của biển cả.' },
    { name: 'Mid-Century Modern', description: 'tập trung vào các đường nét hữu cơ, đơn giản và sự kết nối giữa trong nhà và ngoài trời.' },
    { name: 'Art Deco', description: 'tập trung vào các họa tiết hình học táo bạo, vật liệu bóng bẩy và sự lộng lẫy, quyến rũ.' },
];

const ASPECT_RATIO_OPTIONS = ['Tự động (Giữ nguyên gốc)', '1:1 (Square)', '16:9 (Landscape)', '9:16 (Portrait)', '4:3 (Standard)', '3:4 (Portrait)'];

const PromptButton: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full text-left text-sm px-3 py-1.5 rounded-md bg-brand-primary/60 hover:bg-brand-accent transition-colors">
        {label}
    </button>
);


const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export const InteriorStyleChangeTab: React.FC<InteriorStyleChangeTabProps> = ({ onEditRequest, onVideoRequest, initialImage, onClearInitialImage }) => {
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);

  useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
      onClearInitialImage();
    }
  }, [initialImage, onClearInitialImage]);

  const handlePromptSelect = (name: string, description: string) => {
    const fullPrompt = `Bố cục của căn phòng lấy cảm hứng phong cách ${name}, ${description}`;
    setPrompt(fullPrompt);
  };

  return (
    <BaseTab 
      tabKey="interior_style_change" 
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={sourceImage?.base64}
    >
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (!sourceImage) {
            alert('Vui lòng tải ảnh nội thất gốc.');
            return;
          }
          if (!prompt.trim()) {
            alert('Vui lòng nhập mô tả phong cách mới hoặc chọn một gợi ý.');
            return;
          }

          setLoading(true);
          setResult(null);

          let aspectRatioPrompt = '';
          if (aspectRatio === ASPECT_RATIO_OPTIONS[0]) {
            if (sourceImage?.width && sourceImage?.height) {
                aspectRatioPrompt = `The aspect ratio must be exactly the same as the source image, which is ${sourceImage.width}x${sourceImage.height} pixels.`;
            } else {
                aspectRatioPrompt = 'The aspect ratio must be exactly the same as the source image.';
            }
          } else {
            aspectRatioPrompt = `The aspect ratio must be ${aspectRatio.split(' ')[0]}.`;
          }

          const engineeredPrompt = `You are an expert interior designer AI. The user has provided an image of a room. Your task is to re-render this exact room, keeping the layout, camera angle, and architectural elements (walls, windows, doors) the same, but completely changing the interior design style based on the user's text prompt. The user's request is: "${prompt}". Do not change the structure of the room. ${aspectRatioPrompt} Render a photorealistic, high-quality 8k image.`;

          const response = await generateImage(engineeredPrompt, [sourceImage], numberOfImages);
          
          setResult(response);
          if (!response.error) {
            addHistoryItem(prompt, response);
          }
          setLoading(false);
        };

        return (
            <Card title="1. Dữ Liệu Đầu Vào">
                <div className="space-y-6">
                    {sourceImage ? (
                       <div className="relative group h-96 bg-brand-bg/50 border-2 border-dashed border-brand-primary/80 rounded-xl p-2">
                        <img src={sourceImage.base64} alt="Ảnh nội thất gốc" className="w-full h-full object-contain rounded-lg"/>
                        <button 
                            onClick={() => setSourceImage(null)} 
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-500 transition-colors z-10"
                            title="Xóa ảnh gốc"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    ) : (
                        <ImageUploader onFileSelect={setSourceImage} label="Ảnh Nội Thất Gốc" />
                    )}
                    <textarea
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                        placeholder="Ví dụ: đổi thành phong cách tân cổ điển với tông màu vàng gold"
                    />
                    <div>
                        <label className="block text-sm font-medium text-brand-text-muted mb-2">Gợi ý prompt:</label>
                        <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-brand-bg/50 rounded-lg border border-brand-primary/50">
                            {STYLE_SAMPLES.map((style) => (
                                <PromptButton 
                                    key={style.name} 
                                    label={`Phong cách ${style.name}`}
                                    onClick={() => handlePromptSelect(style.name, style.description)} 
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NumberSelector label="Số lượng kết quả" value={numberOfImages} onChange={setNumberOfImages} min={1} max={4} />
                        <SelectInput label="Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 22v-6.31"/><path d="M12 22a8 8 0 0 0 5.66-13.66"/></svg>
                        Thực Hiện
                    </button>
                </div>
            </Card>
        );
      }}
    </BaseTab>
  );
};