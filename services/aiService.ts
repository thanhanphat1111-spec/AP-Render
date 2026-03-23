import { AiServiceResult, ImageFile } from '../types';

// Hàm gọi lên backend của Vercel (file api/replicate.js)
const callVercelBackend = async (action: string, payload: any): Promise<AiServiceResult> => {
    try {
        const response = await fetch('/api/replicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
        });
        const data = await response.json();
        
        if (!response.ok) return { error: data.error || 'Lỗi kết nối API tới Vercel.' };
        
        // Trả về mảng ảnh hoặc text tùy theo endpoint
        return { imageUrls: data.imageUrls, text: data.text };
    } catch (error: any) {
        console.error(`Lỗi API:`, error);
        return { error: 'Không thể kết nối máy chủ backend.' };
    }
};

export const generateText = async (prompt: string, systemInstruction: string, image: ImageFile | null = null): Promise<AiServiceResult> => {
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;
    return callVercelBackend('generateText', { prompt: fullPrompt });
};

export const generateImage = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1, resolution: '1K' | '2K' | '4K' = '1K'): Promise<AiServiceResult> => {
    if (images.length > 0) {
        // Có ảnh -> Gọi chế độ SDXL Img2Img để giữ form nhà
        return callVercelBackend('imageToImage', { prompt, imageBase64: images[0].base64, numberOfImages });
    }
    // Không có ảnh -> Gọi Flux Schnell vẽ siêu tốc
    const enhancedPrompt = `${prompt}, photorealistic architectural photography, 8k resolution`;
    return callVercelBackend('generateImage', { prompt: enhancedPrompt, numberOfImages });
};

export const editImage = async (prompt: string, image: ImageFile, mask: ImageFile | null, numberOfImages: number = 1): Promise<AiServiceResult> => {
    return callVercelBackend('editImage', { prompt, imageBase64: image.base64, numberOfImages });
};

export const generateMoodboard = async (sourceImage: ImageFile, userPrompt: string, referenceImage: ImageFile | null, imageCount: number): Promise<AiServiceResult> => {
    return generateImage(userPrompt, [sourceImage], imageCount);
};

// Bổ sung hàm này để Tab Cải tạo / Đổi vật liệu (Canva Mix) hoạt động trơn tru
export const changeMaterial = async (sourceImage: ImageFile, maskImage: ImageFile | null, materialImage: ImageFile | null, prompt: string, imageCount: number, visualGuide?: ImageFile | null): Promise<AiServiceResult> => {
    return callVercelBackend('editImage', { prompt, imageBase64: sourceImage.base64, numberOfImages: imageCount });
};

// --- Các tính năng phụ đang được vô hiệu hóa tạm thời ---
export const upscaleImage = async (image: ImageFile, targetResolution: '2k' | '4k'): Promise<AiServiceResult> => ({ error: "Tính năng Upscale đang cập nhật qua Replicate." });
export const generateVideo = async (): Promise<AiServiceResult> => ({ error: "Tính năng Video đang cập nhật." });
export const extendVideo = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generateScript = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const colorizeFloorplan = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const removeWatermark = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const convertToSketch = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generatePanorama = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });

export type TourMoveType = 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out';
export const generateVirtualTourImage = async (image: ImageFile, moveType: TourMoveType): Promise<AiServiceResult> => {
    return { error: "Tính năng Virtual Tour đang được cấu hình lại cho Replicate." };
};
