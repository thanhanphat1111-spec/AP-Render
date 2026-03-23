import { AiServiceResult, ImageFile } from '../types';

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
        return { error: 'Không thể kết nối máy chủ.' };
    }
};

// Gọi Gemini 2.0 Flash
export const generateText = async (prompt: string, systemInstruction: string, image?: ImageFile | null): Promise<AiServiceResult> => {
    return callVercelBackend('generateText', { prompt: `${systemInstruction}\n\n${prompt}`, imageBase64: image?.base64 });
};

// Gọi Nano-Banana-2
export const generateImage = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1, resolution?: string): Promise<AiServiceResult> => {
    return callVercelBackend('generateImage', { prompt, imageBase64: images.length > 0 ? images[0].base64 : null });
};

export const editImage = async (prompt: string, image: ImageFile, mask?: ImageFile | null, numberOfImages?: number): Promise<AiServiceResult> => {
    return callVercelBackend('editImage', { prompt, imageBase64: image.base64 });
};

export const removeWatermark = async (image: ImageFile, prompt: string): Promise<AiServiceResult> => {
    return callVercelBackend('editImage', { prompt: `Remove watermark: ${prompt}`, imageBase64: image.base64 });
};

export const changeMaterial = async (sourceImage: ImageFile, maskImage: ImageFile | null, materialImage: ImageFile | null, prompt: string, imageCount?: number, visualGuide?: ImageFile | null): Promise<AiServiceResult> => {
    return callVercelBackend('editImage', { prompt, imageBase64: sourceImage.base64 });
};

export const generateMoodboard = async (sourceImage: ImageFile, userPrompt: string, referenceImage?: ImageFile | null, imageCount?: number): Promise<AiServiceResult> => {
    return generateImage(userPrompt, [sourceImage]);
};

// --- BỌC THÉP CÁC HÀM CÒN LẠI ĐỂ VERCEL KHÔNG BAO GIỜ BÁO LỖI BUILD ---
export const upscaleImage = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generateVideo = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const extendVideo = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generateScript = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const colorizeFloorplan = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const convertToSketch = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generatePanorama = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generateVirtualTourImage = async (..._args: any[]): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export type TourMoveType = 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out';
