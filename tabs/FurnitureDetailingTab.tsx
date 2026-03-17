import React, { useState, useCallback, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage } from '../services/aiService';
import { ImageFile } from '../types';

interface FurnitureDetailingTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

// Constants for the new tab
const PAPER_SIZES = ['A4', 'A3', 'A2', 'A1', 'A0'];

const PROMPT_SAMPLES = [
  'Sử dụng ảnh tham chiếu được cung cấp. Tạo bản vẽ kỹ thuật 2D của mặt trước, mặt bên, và mặt trên. Trên nền trắng, nét mảnh, khoảng cách đều nhau. Phải có kích thước và ghi chú vật liệu.',
  'Từ ảnh tham chiếu, tạo bản vẽ kỹ thuật 2D của mặt trước, nét mảnh, nền trắng, có đầy đủ kích thước.',
  'Từ ảnh tham chiếu, tạo bản vẽ kỹ thuật 2D của mặt bằng nhìn từ trên xuống, nét đen, nền trắng, ghi chú vật liệu chính.',
  'Tạo bản vẽ chi tiết một khớp nối hoặc một bộ phận đặc trưng của sản phẩm nội thất trong ảnh.',
  'Chuyển đổi ảnh sản phẩm thành bản vẽ 2D dạng phác thảo tay (hand-drawn sketch), thể hiện hình khối và tỷ lệ.',
];

const ANGLE_OPTIONS_FURNITURE = [
  { label: 'Mặt trước', modifier: 'Tạo lại bản vẽ kỹ thuật 2D cho mặt trước (front view).' },
  { label: 'Mặt bên trái', modifier: 'Tạo lại bản vẽ kỹ thuật 2D cho mặt bên trái (left side view).' },
  { label: 'Mặt bên phải', modifier: 'Tạo lại bản vẽ kỹ thuật 2D cho mặt bên phải (right side view).' },
  { label: 'Mặt trên', modifier: 'Tạo lại bản vẽ kỹ thuật 2D cho mặt trên (top view).' },
];

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const PromptSampleList: React.FC<{ samples: string[], onSelect: (prompt: string) => void }> = ({ samples, onSelect }) => (
    <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-brand-bg/50 rounded-lg border border-brand-primary/50">
        {samples.map((sample, index) => (
            <button key={index} onClick={() => onSelect(sample)} className="w-full text-left text-xs p-2 rounded-md bg-brand-primary/50 hover:bg-brand-accent transition-colors">
                {sample}
            </button>
        ))}
    </div>
);


export const FurnitureDetailingTab: React.FC<FurnitureDetailingTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [paperSize, setPaperSize] = useState(PAPER_SIZES[0]);
  const [prompt, setPrompt] = useState(PROMPT_SAMPLES[0]);
  const [lastPrompt, setLastPrompt] = useState('');

  return (
    <BaseTab
      tabKey="furniture_detailing"
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={imageFile?.base64}
      showAngleActions={true}
      angleOptions={ANGLE_OPTIONS_FURNITURE}
    >
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleRegenerate = useCallback(async (modifier: string) => {
            if (!lastPrompt) {
                alert("Vui lòng tạo một bản vẽ trước khi đổi góc nhìn.");
                return;
            };
            if (!imageFile) {
                alert("Ảnh gốc không còn tồn tại.");
                return;
            }
            setLoading(true);
            setResult(null);
            
            const newPrompt = `${modifier} Dựa trên ảnh 3D gốc. Kết quả phải là bản vẽ nét đen trên nền trắng, khổ giấy ${paperSize}. QUAN TRỌNG: Mọi văn bản, kích thước và ghi chú phải bằng tiếng Việt, sử dụng phông chữ sans-serif tiêu chuẩn, rõ ràng, dễ đọc. Đảm bảo tất cả các ký tự và dấu phụ được hiển thị chính xác.`;
            
            const response = await generateImage(newPrompt, [imageFile], 1);
            
            setLastPrompt(newPrompt);
            setResult(response);
            if (!response.error) {
                addHistoryItem(newPrompt, response);
            }
            setLoading(false);
        }, [lastPrompt, imageFile, paperSize, setLoading, setResult, addHistoryItem]);

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
            alert('Vui lòng tải ảnh tham chiếu sản phẩm.');
            return;
          }
           if (!prompt) {
            alert('Vui lòng nhập mô tả hoặc chọn một mẫu có sẵn.');
            return;
          }

          setLoading(true);
          setResult(null);
          
          const fullPrompt = `${prompt} Đây là một bản vẽ kỹ thuật, yêu cầu độ chính xác và rõ ràng. Khổ giấy là ${paperSize}. QUAN TRỌNG: Mọi văn bản, kích thước và ghi chú phải bằng tiếng Việt, sử dụng phông chữ sans-serif tiêu chuẩn, rõ ràng, dễ đọc. Đảm bảo tất cả các ký tự và dấu phụ được hiển thị chính xác.`;
          setLastPrompt(fullPrompt);
          
          const response = await generateImage(fullPrompt, [imageFile], 1);
          setResult(response);
          addHistoryItem(fullPrompt, response);
          setLoading(false);
        };

        return (
          <Card title="Input">
            <div className="space-y-4">
                <ImageUploader onFileSelect={setImageFile} label="1. Tải ảnh tham chiếu sản phẩm" />

                <SelectInput 
                    label="2. Lựa chọn khổ giấy"
                    options={PAPER_SIZES}
                    value={paperSize}
                    onChange={e => setPaperSize(e.target.value)}
                />

                <div>
                    <label htmlFor="furniture-prompt" className="block text-sm font-medium text-brand-text-muted mb-1">
                      3. Yêu cầu & Mô tả
                    </label>
                    <textarea
                      id="furniture-prompt"
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                      placeholder="Mô tả chi tiết yêu cầu bản vẽ của bạn..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-2">Hoặc chọn một mẫu có sẵn</label>
                    <PromptSampleList samples={PROMPT_SAMPLES} onSelect={setPrompt} />
                </div>

              <button
                onClick={handleGenerate}
                disabled={!imageFile}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors disabled:bg-brand-surface disabled:cursor-not-allowed"
              >
                Tạo Bản Vẽ Triển Khai
              </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};
