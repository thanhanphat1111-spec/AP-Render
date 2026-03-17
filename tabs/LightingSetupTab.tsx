
import React, { useState, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';

interface LightingSetupTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialImage: ImageFile | null;
  onClearInitialImage: () => void;
}

const INTERIOR_LIGHTING_OPTIONS = [
    { value: '', display: '-- Chọn ánh sáng nội thất --' },
    { value: 'Natural Morning Light, soft shadows, bright and airy atmosphere', display: 'Sáng sớm tự nhiên (Morning)' },
    { value: 'Golden Hour Sunlight, warm orange tones, long shadows', display: 'Giờ vàng (Golden Hour)' },
    { value: 'Cozy Night Ambient, warm artificial lights, intimate feeling', display: 'Đêm ấm cúng (Cozy Night)' },
    { value: 'Studio Lighting, balanced, high key, neutral white light', display: 'Ánh sáng Studio (Balanced)' },
    { value: 'Cyberpunk Neon, blue and pink lights, high contrast, futuristic', display: 'Cyberpunk Neon' },
    { value: 'Moody Overcast, soft diffused light, cool tones, no hard shadows', display: 'Trời âm u (Overcast)' },
    { value: 'Candlelight Dinner, very warm, dim, focal points on table', display: 'Ánh nến (Candlelight)' },
    { value: 'Minimalist Cold, bright white light, sharp contrasts', display: 'Hiện đại lạnh (Cold Modern)' },
];

const EXTERIOR_LIGHTING_OPTIONS = [
    { value: '', display: '-- Chọn ánh sáng ngoại thất --' },
    { value: 'Sunny Day, clear blue sky, strong hard shadows, vibrant colors', display: 'Ban ngày nắng gắt (Sunny)' },
    { value: 'Sunset, dramatic sky, purple and orange gradient, silhouette effects', display: 'Hoàng hôn (Sunset)' },
    { value: 'Blue Hour, city lights turning on, deep blue sky', display: 'Giờ xanh (Blue Hour)' },
    { value: 'Foggy Morning, mysterious atmosphere, low visibility, soft light', display: 'Sương mù (Foggy)' },
    { value: 'Rainy Night, wet reflections on ground, street lights, cinematic', display: 'Đêm mưa (Rainy Night)' },
    { value: 'Moonlight, cold blue tones, starry sky', display: 'Ánh trăng (Moonlight)' },
    { value: 'Snowy Day, bright white ambient, soft shadows', display: 'Ngày tuyết (Snowy)' },
];

const SelectInput: React.FC<{ label: string, options: {value: string, display: string}[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean }> = ({ label, options, value, onChange, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select 
            value={value} 
            onChange={onChange} 
            disabled={disabled}
            className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition disabled:opacity-50"
        >
            {options.map(opt => <option key={opt.display} value={opt.value}>{opt.display}</option>)}
        </select>
    </div>
);

export const LightingSetupTab: React.FC<LightingSetupTabProps> = ({ onEditRequest, onVideoRequest, initialImage, onClearInitialImage }) => {
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [selectedInteriorPrompt, setSelectedInteriorPrompt] = useState('');
  const [selectedExteriorPrompt, setSelectedExteriorPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);

  useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
      onClearInitialImage();
    }
  }, [initialImage, onClearInitialImage]);

  const handleInteriorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedInteriorPrompt(e.target.value);
      if (e.target.value) setSelectedExteriorPrompt(''); // Reset exterior if interior selected
  };

  const handleExteriorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedExteriorPrompt(e.target.value);
      if (e.target.value) setSelectedInteriorPrompt(''); // Reset interior if exterior selected
  };

  return (
    <BaseTab 
      tabKey="lighting_setup" 
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={sourceImage?.base64}
    >
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (!sourceImage) {
            alert('Vui lòng tải ảnh nguồn.');
            return;
          }
          
          const mainLighting = selectedInteriorPrompt || selectedExteriorPrompt;
          
          if (!mainLighting && !customPrompt.trim()) {
            alert('Vui lòng chọn kiểu ánh sáng hoặc nhập mô tả tùy chỉnh.');
            return;
          }

          setLoading(true);
          setResult(null);

          // Constructing the prompt
          let prompt = `Relight this image. Keep the geometry, architecture, and objects EXACTLY the same. Only change the lighting atmosphere and time of day.`;
          
          if (mainLighting) {
              prompt += ` Target lighting style: ${mainLighting}.`;
          }
          
          if (customPrompt) {
              prompt += ` Additional lighting details: ${customPrompt}.`;
          }

          prompt += ` Result must be photorealistic 8k resolution.`;

          const response = await generateImage(prompt, [sourceImage], numberOfImages);
          
          setResult(response);
          if (!response.error) {
            addHistoryItem(`Lighting: ${mainLighting || customPrompt}`, response);
          }
          setLoading(false);
        };

        return (
            <Card title="Thiết lập Ánh sáng">
                <div className="space-y-6">
                    {/* Upload Section */}
                    {sourceImage ? (
                       <div className="relative group h-64 bg-brand-bg/50 border-2 border-dashed border-brand-primary/80 rounded-xl p-2 flex items-center justify-center">
                        <img src={sourceImage.base64} alt="Source" className="max-h-full max-w-full object-contain rounded-lg"/>
                        <button 
                            onClick={() => setSourceImage(null)} 
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-500 transition-colors z-10"
                            title="Xóa ảnh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    ) : (
                        <ImageUploader onFileSelect={setSourceImage} label="Tải ảnh mô hình/render cần đổi ánh sáng" />
                    )}

                    {/* Selection Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-primary/10 p-4 rounded-lg border border-brand-primary/30">
                        <SelectInput 
                            label="Ánh sáng Nội thất" 
                            options={INTERIOR_LIGHTING_OPTIONS} 
                            value={selectedInteriorPrompt} 
                            onChange={handleInteriorChange}
                            disabled={!!selectedExteriorPrompt}
                        />
                        <SelectInput 
                            label="Ánh sáng Ngoại thất" 
                            options={EXTERIOR_LIGHTING_OPTIONS} 
                            value={selectedExteriorPrompt} 
                            onChange={handleExteriorChange}
                            disabled={!!selectedInteriorPrompt}
                        />
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text-muted mb-1">
                            Mô tả ánh sáng tùy chỉnh
                        </label>
                        <textarea
                            rows={3}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                            placeholder="Ví dụ: Ánh sáng tím neon hắt từ bên phải, tạo cảm giác bí ẩn..."
                        />
                    </div>

                    <NumberSelector 
                        label="Số lượng ảnh" 
                        value={numberOfImages} 
                        onChange={setNumberOfImages} 
                        min={1} 
                        max={4} 
                    />
                    
                    <button
                        onClick={handleGenerate}
                        disabled={!sourceImage || (!selectedInteriorPrompt && !selectedExteriorPrompt && !customPrompt)}
                        className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-lg transition-colors flex items-center justify-center gap-2 disabled:bg-brand-surface disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                        Tạo Ánh Sáng Mới
                    </button>
                </div>
            </Card>
        );
      }}
    </BaseTab>
  );
};
