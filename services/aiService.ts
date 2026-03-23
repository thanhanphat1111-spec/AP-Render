import { AiServiceResult, ImageFile } from '../types';

/**
 * Hàm lõi để gửi yêu cầu từ giao diện lên Backend Vercel
 */
const callVercelBackend = async (action: string, payload: any): Promise<AiServiceResult> => {
    try {
        const response = await fetch('/api/replicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
        });
        const data = await response.json();
        
        if (!response.ok) return { error: data.error || 'Lỗi kết nối API.' };
        
        return { imageUrls: data.imageUrls, text: data.text };
    } catch (error: any) {
        console.error(`Lỗi Service:`, error);
        return { error: 'Không thể kết nối tới hệ thống xử lý AI.' };
    }
};

/**
 * Gọi Gemini 2.0 (Nano Banana) để chat hoặc tư vấn kiến trúc
 */
export const generateText = async (prompt: string, systemInstruction: string, image: ImageFile | null = null): Promise<AiServiceResult> => {
    const fullPrompt = `${systemInstruction}\n\nCâu hỏi của khách hàng: ${prompt}`;
    return callVercelBackend('generateText', { 
        prompt: fullPrompt, 
        imageBase64: image?.base64 
    });
};

/**
 * Gọi Nano-Banana-2 (Imagen 3) để vẽ phối cảnh
 */
export const generateImage = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1, resolution: '1K' | '2K' | '4K' = '1K'): Promise<AiServiceResult> => {
    // Model Google hiện tại tập trung vào chất lượng vẽ từ mô tả (Prompt)
    return callVercelBackend('generateImage', { 
        prompt: prompt,
        imageBase64: images.length > 0 ? images[0].base64 : null,
        aspect_ratio: "1:1" // Có thể tùy chỉnh '16:9' hoặc '9:16' nếu cần
    });
};

/**
 * Chỉnh sửa ảnh (Smart Edit)
 */
export const editImage = async (prompt: string, image: ImageFile, mask: ImageFile | null, numberOfImages: number = 1): Promise<AiServiceResult> => {
    return callVercelBackend('generateImage', { 
        prompt: `Edit this image based on: ${prompt}`, 
        imageBase64: image.base64 
    });
};

/**
 * Các tính năng khác được thiết kế để khớp với UI của anh
 */
export const generateMoodboard = async (sourceImage: ImageFile, userPrompt: string, referenceImage: ImageFile | null, imageCount: number): Promise<AiServiceResult> => {
    return generateImage(userPrompt, [sourceImage], imageCount);
};

export const changeMaterial = async (sourceImage: ImageFile, maskImage: ImageFile | null, materialImage: ImageFile | null, prompt: string, imageCount: number): Promise<AiServiceResult> => {
    return callVercelBackend('generateImage', { prompt, imageBase64: sourceImage.base64 });
};

// --- Khai báo các hàm phụ để không bị lỗi Build ---
export const upscaleImage = async () => ({ error: "Tính năng đang cập nhật." });
export const generateVideo = async () => ({ error: "Tính năng đang cập nhật." });
export const removeWatermark = async () => ({ error: "Tính năng đang cập nhật." });
export const generateVirtualTourImage = async () => ({ error: "Tính năng đang cập nhật." });
