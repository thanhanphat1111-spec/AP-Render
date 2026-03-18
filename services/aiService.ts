// File: src/services/aiService.ts
import { AiServiceResult, ImageFile } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ==========================================
// HÀM LÕI GỌI TRẠM TRUNG CHUYỂN VERCEL (ĐÃ FIX LỖI MẤT ẢNH 422)
// ==========================================
export const generateImageWithReplicate = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1): Promise<AiServiceResult> => {
    try {
        // 1. CHẶN LỖI 422 TỪ TRONG TRỨNG NƯỚC: Bắt buộc phải có ảnh
        if (!images || images.length === 0 || !images[0]) {
            return { error: "Lỗi: Bạn chưa cung cấp ảnh đầu vào (hoặc chưa khoanh vùng chọn/vẽ góc nhìn). AI Kiến trúc bắt buộc phải có ảnh gốc để làm việc!" };
        }

        const img = images[0];
        let imageBase64 = img.base64;

        // 2. Chuẩn hóa chuỗi Base64 tránh lỗi dị dạng
        if (!imageBase64.startsWith('data:image')) {
            const mimeType = img.file?.type || 'image/jpeg';
            imageBase64 = imageBase64.includes('base64,') 
                ? `data:${mimeType};${imageBase64.substring(imageBase64.indexOf('base64,'))}`
                : `data:${mimeType};base64,${imageBase64}`;
        }

        const safePrompt = prompt && prompt.trim() !== '' ? prompt : "architectural visualization, high quality, photorealistic";

        const response = await fetch("/api/replicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                version: "435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2723f436dcbce190", 
                input: {
                    image: imageBase64,
                    prompt: safePrompt,
                    a_prompt: "masterpiece, best quality, ultra-detailed",
                    n_prompt: "lowres, bad anatomy, worst quality, low quality",
                    num_samples: Math.floor(numberOfImages),
                    image_resolution: "512"
                }
            })
        });

        if (!response.ok) {
            let errorDetail = await response.text();
            try {
                const parsed = JSON.parse(errorDetail);
                errorDetail = JSON.stringify(parsed.detail || parsed);
            } catch(e) {}
            return { error: `Lỗi kết nối API: ${errorDetail}` };
        }

        let prediction = await response.json();

        // Chờ kết quả render
        while (prediction.status !== "succeeded" && prediction.status !== "failed") {
            await sleep(1500);
            const checkRes = await fetch(`/api/replicate?id=${prediction.id}`);
            prediction = await checkRes.json();
        }

        if (prediction.status === "succeeded") {
            const output = prediction.output;
            const imageUrls = typeof output === 'string' ? [output] : output;
            return { imageUrls };
        } else {
            return { error: prediction.error || 'Render thất bại từ máy chủ.' };
        }
    } catch (error: any) {
        return { error: error.message };
    }
};

// ============================================================================
// CÁC HÀM XUẤT (EXPORT) GIỮ NGUYÊN
// ============================================================================
export const generateText = async (): Promise<AiServiceResult> => ({ text: "Tính năng text đang tạm tắt để tối ưu chi phí render ảnh." });
export const generateTextGemini = generateText;

export const generateImage = generateImageWithReplicate;
export const generateImageGemini = generateImageWithReplicate;

export const editImage = async (prompt: string, image: ImageFile, mask: ImageFile | null, numberOfImages: number = 1): Promise<AiServiceResult> => {
    return generateImageWithReplicate(prompt, [image], numberOfImages);
};
export const editImageGemini = editImage;

export const generatePanorama = async (images: ImageFile[]): Promise<AiServiceResult> => {
    return generateImageWithReplicate("stitch panorama 360", images, 1);
};
export const generatePanoramaGemini = generatePanorama;

export const upscaleImage = async (image: ImageFile): Promise<AiServiceResult> => {
    return generateImageWithReplicate("upscale image to 4k, high detail", [image], 1);
};
export const upscaleImageGemini = upscaleImage;

export const generateVideo = async (): Promise<AiServiceResult> => ({ error: "Tính năng Video chưa kích hoạt." });
export const generateVideoGemini = generateVideo;

export const extendVideo = async (): Promise<AiServiceResult> => ({ error: "Tính năng nối Video chưa kích hoạt." });
export const extendVideoGemini = extendVideo;

export const generateScript = async (): Promise<AiServiceResult> => ({ text: "Kịch bản tự động..." });
export const generateScriptGemini = generateScript;

export const colorizeFloorplan = async (floorplanImage: ImageFile, userPrompt: string, numberOfImages: number): Promise<AiServiceResult> => {
    return generateImageWithReplicate(userPrompt, [floorplanImage], numberOfImages);
};
export const colorizeFloorplanGemini = colorizeFloorplan;

export const removeWatermark = async (sourceImage: ImageFile, userHint: string, numberOfImages: number): Promise<AiServiceResult> => {
    return generateImageWithReplicate("remove watermark, clean image " + userHint, [sourceImage], numberOfImages);
};
export const removeWatermarkGemini = removeWatermark;

export const changeMaterial = async (sourceImage: ImageFile, maskFile: ImageFile, materialRefImage: ImageFile | null, prompt: string, count: number): Promise<AiServiceResult> => {
    return generateImageWithReplicate(prompt, [sourceImage], count);
};
export const changeMaterialGemini = changeMaterial;

export const convertToSketch = async (sourceImage: ImageFile, strength: number): Promise<AiServiceResult> => {
    return generateImageWithReplicate("architectural sketch, pencil drawing, blueprint", [sourceImage], 1);
};
export const convertToSketchGemini = convertToSketch;

export const generateVirtualTourImage = async (image: any, moveType: string, magnitude: number): Promise<string | null> => {
    return null;
};

export const generateMoodboard = async (prompt: string, images: ImageFile[], count: number): Promise<AiServiceResult> => {
    return generateImageWithReplicate(prompt, images, count);
};
export const generateMoodboardGemini = generateMoodboard;
