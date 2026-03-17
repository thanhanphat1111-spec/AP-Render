
import React, { useState } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage, generateText } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';

interface MoodboardTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

const SPACE_OPTIONS = [
    '-- Chọn không gian --',
    'Phòng khách', 
    'Phòng ăn', 
    'Bếp', 
    'Bếp + Ăn', 
    'Phòng ngủ', 
    'Phòng tắm', 
    'Hành lang', 
    'Sảnh', 
    'Văn phòng',
    'Phòng sinh hoạt chung',
    'Phòng thờ',
    'Phòng đọc sách',
    'Phòng giải trí',
    'Phòng thay đồ',
    'Cầu thang',
    'Sân vườn',
];

const LIGHTING_OPTIONS = [
  '-- Chọn ánh sáng --',
  'Ánh sáng ban ngày, trời trong xanh, nắng gắt lúc giữa trưa.',
  'Ánh sáng ban ngày, trời nhiều mây, ánh sáng dịu và bóng đổ mềm.',
  'Ánh sáng hoàng hôn với tông màu vàng cam ấm áp, bóng đổ dài.',
  'Ánh sáng bình minh với sương sớm và không khí trong lành.',
  'Ánh sáng ban đêm, nhấn mạnh vào hệ thống đèn nhân tạo của công trình và đường phố.',
  'Ánh sáng "giờ vàng" (golden hour) ngay trước khi mặt trời lặn.',
];

const ANGLE_OPTIONS = [
  '-- Chọn gợi ý --',
  'Góc chụp rộng (wide-angle) bao quát toàn bộ căn phòng.',
  'Góc chụp ngang tầm mắt (eye-level) từ cửa ra vào.',
  'Góc chụp cận cảnh (close-up) chi tiết một món đồ nội thất đặc trưng.',
  'Góc chụp từ trên xuống (top-down view) thể hiện bố cục mặt bằng.',
  'Góc chụp từ dưới lên (low-angle) nhấn mạnh chiều cao trần nhà.',
  'Góc chụp xuyên qua một vật thể (ví dụ: kệ sách) để tạo chiều sâu.',
  'Góc chụp tập trung vào khu vực cửa sổ để thấy được view bên ngoài.',
];

const PROMPT_EXAMPLES = [
    { value: 'Thay thế toàn bộ nội thất bằng phong cách hiện đại, sang trọng (Modern Luxury).', display: 'Thay thế: Hiện đại Sang trọng' },
    { value: 'Thay thế nội thất bằng phong cách tối giản (Minimalism) với tông màu gỗ sáng.', display: 'Thay thế: Tối giản (Minimalism)' },
    { value: 'Thay thế nội thất bằng phong cách Bắc Âu (Scandinavian) ấm cúng.', display: 'Thay thế: Bắc Âu (Scandinavian)' },
    { value: 'Giữ nguyên bố cục, thay đổi màu sắc sofa và rèm cửa sang tông màu be.', display: 'Đổi màu: Sofa & Rèm (Be)' },
    { value: 'Sắp xếp lại nội thất để không gian thoáng đãng hơn, thêm cây xanh.', display: 'Sắp xếp lại: Thoáng đãng' },
    { value: 'Biến đổi không gian thành phong cách Indochine với gạch bông và gỗ tối màu.', display: 'Phong cách: Indochine' },
    { value: 'Thiết kế lại theo phong cách Wabi-sabi, tường hiệu ứng thô và vật liệu tự nhiên.', display: 'Phong cách: Wabi-sabi' },
];

const ASPECT_RATIO_OPTIONS = ['Tự động (Theo ảnh gốc)', '16:9 (Ngang)', '9:16 (Dọc)', '4:3 (Ngang)', '3:4 (Dọc)', '1:1 (Vuông)'];

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


export const MoodboardTab: React.FC<MoodboardTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [contextFile, setContextFile] = useState<ImageFile | null>(null);
  const [moodboardFile, setMoodboardFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [spacePrompt, setSpacePrompt] = useState(SPACE_OPTIONS[0]);
  const [lightingPrompt, setLightingPrompt] = useState(LIGHTING_OPTIONS[0]);
  const [anglePrompt, setAnglePrompt] = useState(ANGLE_OPTIONS[0]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);

  const handlePromptExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPrompt(e.target.value);
  };

  return (
    <BaseTab tabKey="moodboard" onEditRequest={onEditRequest} onVideoRequest={onVideoRequest} comparisonImage={contextFile?.base64}>
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (!moodboardFile) {
            alert('Vui lòng tải ảnh moodboard.');
            return;
          }
          if (!prompt.trim()) {
            alert('Vui lòng cung cấp mô tả, ví dụ bằng cách chọn một phong cách hoặc sử dụng gợi ý từ AI.');
            return;
          }

          setLoading(true);
          setResult(null);
          
          const finalPromptElements: string[] = [];
          const imageFiles: ImageFile[] = [];

          if (contextFile) {
              imageFiles.push(contextFile);
              imageFiles.push(moodboardFile);
              finalPromptElements.push(`Using the style, colors, and materials from the second image (moodboard), completely redesign the interior of the room shown in the first image (context).`);
          } else {
              imageFiles.push(moodboardFile);
              finalPromptElements.push(`Create a photorealistic 3D architectural render concept inspired by the provided moodboard image.`);
          }
          
          if (prompt.trim()) {
            finalPromptElements.push(`The design should incorporate the following details: "${prompt}".`);
          }
          
          if (spacePrompt !== SPACE_OPTIONS[0]) {
            finalPromptElements.push(`The space is a ${spacePrompt}.`);
          }
          if (lightingPrompt !== LIGHTING_OPTIONS[0]) {
            finalPromptElements.push(`The lighting should be: ${lightingPrompt}.`);
          }

          // Aspect Ratio Instruction
          if (aspectRatio === ASPECT_RATIO_OPTIONS[0]) {
              if (contextFile && contextFile.width && contextFile.height) {
                  finalPromptElements.push(`CRITICAL: The output image MUST maintain the exact aspect ratio of the input context image, which is ${contextFile.width}x${contextFile.height}.`);
              }
          } else {
              finalPromptElements.push(`Aspect ratio: ${aspectRatio}.`);
          }

          finalPromptElements.push("The result must be high quality, cinematic lighting, 8k.");
          
          const fullPrompt = finalPromptElements.join(' ');
          
          const response = await generateImage(fullPrompt, imageFiles, numberOfImages); 
          
          setResult(response);
          addHistoryItem(fullPrompt, response);
          setLoading(false);
        };

        const handleSuggestPrompt = async () => {
          if (!moodboardFile) {
            alert('Vui lòng tải ảnh moodboard để AI có thể đưa ra gợi ý tốt nhất.');
            return;
          }
          setIsSuggesting(true);
          setResult(null);

          const systemInstruction = "Bạn là một AI chuyên tạo prompt cho render kiến trúc. Dựa trên các thông tin được cung cấp, hãy tạo ra một câu lệnh hoàn chỉnh, chi tiết bằng tiếng Việt theo đúng cấu trúc yêu cầu. Chỉ trả về nội dung của câu lệnh, không thêm lời giải thích nào khác.";
          
          let userPrompt = "Hãy tạo một câu lệnh render theo cấu trúc sau:\n";
          userPrompt += `"Tạo ảnh chụp thực tế, sắp xếp đồ đạc, vật dụng, trang trí vách tường một cách hợp lý.`;

          if (contextFile) {
             userPrompt += ` Bám theo không gian của phòng, bám theo vị trí cửa đi và cửa sổ từ ảnh hiện trạng.`;
             userPrompt += ` QUAN TRỌNG: Câu lệnh phải có yêu cầu giữ nguyên tỷ lệ khung hình (aspect ratio) của ảnh hiện trạng tải lên.`;
          }
          
          const selectedSpace = spacePrompt !== SPACE_OPTIONS[0] ? spacePrompt : "một không gian độc đáo";
          userPrompt += ` Không gian là một ${selectedSpace}.`;

          if (lightingPrompt !== LIGHTING_OPTIONS[0]) {
            userPrompt += ` Ánh sáng: ${lightingPrompt}.`;
          }

          if (anglePrompt !== ANGLE_OPTIONS[0]) {
              userPrompt += ` ${anglePrompt}`;
          }
          
          userPrompt += ` Phân tích và lấy cảm hứng chính từ ảnh moodboard về màu sắc, vật liệu, và không khí chung."`;


          const response = await generateText(userPrompt, systemInstruction, moodboardFile);

          if (response.text) {
            setPrompt(response.text);
          } else {
            alert(`Lỗi khi tạo gợi ý: ${response.error || 'Lỗi không xác định'}`);
          }
          setIsSuggesting(false);
        };
        
        const handleSpaceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            setSpacePrompt(value);
        };

        const handleLightingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            setLightingPrompt(value);
        };
        
        const handleAngleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            setAnglePrompt(value);
        };

        return (
          <Card title="Input - Tạo 3D từ Moodboard">
            <div className="space-y-4">
              {/* 1 & 2 Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploader onFileSelect={setContextFile} label="1. Tải ảnh hiện trạng (Không gian gốc)" />
                  <ImageUploader onFileSelect={setMoodboardFile} label="2. Tải ảnh Moodboard (Cảm hứng)" />
              </div>

              {/* 3. Prompt Input & Suggestions */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-brand-text-muted">3. Mô tả ý tưởng</h3>
                  <button
                      onClick={handleSuggestPrompt}
                      disabled={isSuggesting || !moodboardFile}
                      className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isSuggesting ? 'Đang nghĩ...' : '✨ Gợi ý từ AI'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition mb-2"
                  placeholder="Mô tả chi tiết: màu sắc, vật liệu, không khí, các đồ vật chính..."
                />
                
                <div className="relative">
                    <select
                        onChange={handlePromptExampleChange}
                        value=""
                        className="w-full bg-brand-bg/50 border border-brand-primary/50 rounded-lg px-3 py-2 text-xs text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer appearance-none"
                    >
                        <option value="" disabled>-- Chọn mẫu gợi ý nhanh --</option>
                        {PROMPT_EXAMPLES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.display}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-brand-text-muted">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
              </div>

              {/* 4. Advanced Options (Collapsible or Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <SelectInput 
                    label="Không gian"
                    options={SPACE_OPTIONS}
                    value={spacePrompt}
                    onChange={handleSpaceSelect}
                  />
                  <SelectInput 
                    label="Ánh sáng"
                    options={LIGHTING_OPTIONS}
                    value={lightingPrompt}
                    onChange={handleLightingSelect}
                  />
                  <SelectInput 
                    label="Góc chụp"
                    options={ANGLE_OPTIONS}
                    value={anglePrompt}
                    onChange={handleAngleSelect}
                  />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <NumberSelector
                      label="5. Số lượng phương án"
                      value={numberOfImages}
                      onChange={setNumberOfImages}
                    />
                   <SelectInput 
                        label="Tỷ lệ khung hình" 
                        options={ASPECT_RATIO_OPTIONS} 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value)} 
                   />
               </div>
                
              <button
                onClick={handleGenerate}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Tạo Ý Tưởng 3D
              </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};
