
import React, { useState, useCallback, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage, generateText } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { FloorplanColoringTab } from './FloorplanColoringTab';
import { MasterplanRenderTab } from './MasterplanRenderTab';

interface FloorplanTo3DTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialMasterplanImage?: ImageFile | null;
  onClearMasterplanImage?: () => void;
}

const roomTypes = ['Phòng khách', 'Phòng ngủ', 'Bếp', 'Phòng tắm', 'Văn phòng tại nhà'];
const styles = [
    'Hiện đại (Modern)',
    'Tối giản (Minimalist)',
    'Scandinavian',
    'Indochine (Đông Dương)',
    'Japandi',
    'Wabi-sabi',
    'Công nghiệp (Industrial)',
    'Tân cổ điển (Neoclassical)',
    'Sang trọng (Luxury)',
    'Ven biển (Coastal)',
    'Nông trại (Farmhouse)',
    'Mid-Century Modern',
];
const ASPECT_RATIO_OPTIONS = ['Tự động (Giữ nguyên gốc)', '16:9 (Landscape)', '9:16 (Portrait)', '1:1 (Square)', '4:3 (Standard)', '3:4 (Portrait)'];


const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// Internal component for the "Interior Room" logic (the original functionality)
const InteriorRoomView: React.FC<FloorplanTo3DTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [moodboardFile, setMoodboardFile] = useState<ImageFile | null>(null);
  const [roomType, setRoomType] = useState(roomTypes[0]);
  const [style, setStyle] = useState(styles[0]);
  const [prompt, setPrompt] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);
  const [lastPrompt, setLastPrompt] = useState('');

  return (
    <BaseTab tabKey="floorplan_interior" onEditRequest={onEditRequest} onVideoRequest={onVideoRequest} showAngleActions={true} comparisonImage={imageFile?.base64}>
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleRegenerate = useCallback(async (modifier: string) => {
            if (!lastPrompt) {
                alert("Vui lòng tạo một ảnh trước khi đổi góc chụp.");
                return;
            };
            if (!imageFile) {
                alert("Vui lòng tải lên ảnh mặt bằng.");
                return;
            }
            setLoading(true);
            setResult(null);
            
            const newPrompt = `${lastPrompt}. Yêu cầu bổ sung: ${modifier}`;
            
            const imagesToSend: ImageFile[] = [imageFile];
            if (moodboardFile) {
                imagesToSend.push(moodboardFile);
            }

            const response = await generateImage(newPrompt, imagesToSend, numberOfImages);
            
            setLastPrompt(newPrompt);
            setResult(response);
            if (!response.error) {
                addHistoryItem(newPrompt, response);
            }
            setLoading(false);
        }, [lastPrompt, imageFile, moodboardFile, numberOfImages, setLoading, setResult, addHistoryItem]);

        useEffect(() => {
            const handleEvent = (event: Event) => {
                const customEvent = event as CustomEvent<{ modifier: string }>;
                if (customEvent.detail?.modifier) {
                    handleRegenerate(customEvent.detail.modifier);
                }
            };
            document.addEventListener('regenerateRequest', handleEvent);
            return () => {
                document.removeEventListener('regenerateRequest', handleEvent);
            };
        }, [handleRegenerate]);

        const handleGenerate = async () => {
          if (!imageFile) {
            alert('Vui lòng tải ảnh mặt bằng.');
            return;
          }

          setLoading(true);
          setResult(null);
          
          const promptElements = [
            `Dựa trên ảnh mặt bằng (floorplan) được cung cấp, hãy tạo ra một ảnh render 3D siêu thực.`,
            `Loại phòng: ${roomType}.`,
            `Phong cách thiết kế: ${style}.`
          ];
          
          if (moodboardFile) {
              promptElements.push(`Lấy cảm hứng về màu sắc, vật liệu và không khí từ ảnh moodboard đính kèm.`);
          }
      
          if (prompt) {
              promptElements.push(`Yêu cầu bổ sung của người dùng: "${prompt}".`);
          }
          
          if (aspectRatio === ASPECT_RATIO_OPTIONS[0]) {
            if (imageFile?.width && imageFile?.height) {
                promptElements.push(`Ảnh kết quả phải có tỷ lệ khung hình giống hệt ảnh mặt bằng, là ${imageFile.width}x${imageFile.height} pixels.`);
            } else {
                promptElements.push('Giữ nguyên tỷ lệ khung hình của ảnh mặt bằng.');
            }
          } else {
            promptElements.push(`Tỷ lệ khung hình là ${aspectRatio.split(' ')[0]}.`);
          }

          promptElements.push(`Kết quả cuối cùng phải có chất lượng 8k, ánh sáng điện ảnh, và trông như một bức ảnh chụp thực tế bằng máy ảnh kỹ thuật số.`);
      
          const fullPrompt = promptElements.join(' ');
          setLastPrompt(fullPrompt);
          
          const imagesToSend: ImageFile[] = [imageFile];
          if (moodboardFile) {
              imagesToSend.push(moodboardFile);
          }
          
          const response = await generateImage(fullPrompt, imagesToSend, numberOfImages);
          
          setResult(response);
          if (!response.error) {
              addHistoryItem(fullPrompt, response);
          }
          setLoading(false);
        };
        
        const handleSuggestPrompt = async () => {
            if (!imageFile) {
              alert("Vui lòng tải ảnh mặt bằng trước khi dùng gợi ý.");
              return;
            }
            setIsSuggesting(true);
            setResult(null);

            const systemInstruction = "You are an AI assistant specializing in architectural visualization. Your task is to analyze a floorplan image and generate a highly detailed prompt in Vietnamese for creating a 3D render. The prompt must be specific about layout, furniture, and openings. Respond only with the prompt text.";
            
            let userPrompt = `Phân tích kỹ lưỡng ảnh mặt bằng (floorplan) được cung cấp. Dựa vào đó, hãy tạo một câu lệnh render 3D chi tiết. Câu lệnh phải mô tả rõ ràng:
1.  **Bố cục không gian:** Mô tả cách sắp xếp chung của phòng.
2.  **Vị trí vật dụng:** Liệt kê các vật dụng chính (bàn, ghế, giường, tủ, sofa...) và vị trí của chúng theo mặt bằng.
3.  **Hình thức vật dụng:** Gợi ý hình thức, kiểu dáng cho các vật dụng đó.
4.  **Vị trí cửa:** Xác định vị trí cửa đi và cửa sổ.

Kết hợp các chi tiết trên với các yêu cầu sau:
-   **Loại phòng:** ${roomType}
-   **Phong cách:** ${style}`;

            if (moodboardFile) {
              userPrompt += `\n-   **Cảm hứng:** Lấy cảm hứng về màu sắc, vật liệu và không khí chung từ một ảnh moodboard (không được đính kèm trực tiếp để phân tích, nhưng hãy dựa vào đó để gợi ý).`;
            }

            const response = await generateText(userPrompt, systemInstruction, imageFile); // Pass floorplan for analysis

            if (response.text) {
                setPrompt(response.text);
            } else {
                alert(`Error generating suggestion: ${response.error || 'Unknown error'}`);
            }
            setIsSuggesting(false);
        };


        return (
          <Card title="Input">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploader onFileSelect={setImageFile} label="1. Tải ảnh mặt bằng (floorplan)" />
                  <ImageUploader onFileSelect={setMoodboardFile} label="2. Tải ảnh moodboard (tuỳ chọn)" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectInput label="3. Loại phòng" options={roomTypes} value={roomType} onChange={e => setRoomType(e.target.value)} />
                  <SelectInput label="4. Phong cách" options={styles} value={style} onChange={e => setStyle(e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="floorplan-prompt" className="block text-sm font-medium text-brand-text-muted">
                      5. Yêu cầu bổ sung
                    </label>
                     <button
                        onClick={handleSuggestPrompt}
                        disabled={isSuggesting}
                        className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isSuggesting ? 'Đang phân tích...' : '✨ Gợi ý từ AI'}
                    </button>
                </div>
                <textarea
                  id="floorplan-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                  placeholder="e.g., sàn gỗ sồi, cửa sổ lớn nhìn ra vườn..."
                />
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberSelector
                        label="6. Số lượng ảnh"
                        value={numberOfImages}
                        onChange={setNumberOfImages}
                    />
                     <SelectInput 
                        label="7. Tỷ lệ ảnh"
                        options={ASPECT_RATIO_OPTIONS}
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value)}
                    />
                </div>
              <button
                onClick={handleGenerate}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors"
              >
                Tạo Ảnh 3D
              </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};

export const FloorplanTo3DTab: React.FC<FloorplanTo3DTabProps> = ({ onEditRequest, onVideoRequest, initialMasterplanImage, onClearMasterplanImage }) => {
    const [activeMode, setActiveMode] = useState<'interior' | 'house_3d' | 'masterplan'>('interior');

    // Automatically switch to masterplan mode if an image is transferred
    useEffect(() => {
        if (initialMasterplanImage) {
            setActiveMode('masterplan');
        }
    }, [initialMasterplanImage]);

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('interior')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'interior'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🛋️ Nội Thất Phòng
                </button>
                <button
                    onClick={() => setActiveMode('house_3d')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'house_3d'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🏠 3D Nhà
                </button>
                <button
                    onClick={() => setActiveMode('masterplan')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'masterplan'
                            ? 'bg-brand-accent text-white shadow-lg scale-105'
                            : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🗺️ Quy Hoạch
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeMode === 'interior' && (
                    <InteriorRoomView onEditRequest={onEditRequest} onVideoRequest={onVideoRequest} />
                )}
                {activeMode === 'house_3d' && (
                    <FloorplanColoringTab onEditRequest={onEditRequest} onVideoRequest={onVideoRequest} />
                )}
                {activeMode === 'masterplan' && (
                    <MasterplanRenderTab 
                        onEditRequest={onEditRequest} 
                        onVideoRequest={onVideoRequest} 
                        initialImage={initialMasterplanImage}
                        onClearInitialImage={onClearMasterplanImage}
                    />
                )}
            </div>
        </div>
    );
};
