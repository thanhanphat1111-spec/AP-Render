import { AiServiceResult, ImageFile } from '../types';

// Hàm lấy Token an toàn trên môi trường Vercel
const getToken = () => {
    return import.meta.env?.VITE_REPLICATE_API_TOKEN || (process && process.env && process.env.VITE_REPLICATE_API_TOKEN) || "";
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ==========================================
// HÀM LÕI GỌI REPLICATE (THAY THẾ GEMINI)
// ==========================================
export const generateImageWithReplicate = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1): Promise<AiServiceResult> => {
    try {
        const token = getToken();
        if (!token) return { error: 'Lỗi: Chưa cấu hình biến môi trường VITE_REPLICATE_API_TOKEN trên Vercel.' };

        let imageBase64 = undefined;
        if (images.length > 0) {
            const img = images[0];
            imageBase64 = img.base64.includes(',') ? img.base64 : `data:${img.file?.type || 'image/png'};base64,${img.base64}`;
        }

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2723f436dcbce190", // Model kiến trúc siêu rẻ
                input: {
                    image: imageBase64,
                    prompt: prompt,
                    a_prompt: "masterpiece, best quality, ultra-detailed, architectural visualization",
                    n_prompt: "lowres, bad anatomy, worst quality, low quality",
                    num_samples: numberOfImages,
                    image_resolution: "512"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return { error: `Lỗi kết nối API Replicate: ${errText}` };
        }

        let prediction = await response.json();

        // Chờ render xong
        while (prediction.status !== "succeeded" && prediction.status !== "failed") {
            await sleep(1500);
            const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: {
                    "Authorization": `Token ${token}`,
                    "Content-Type": "application/json"
                }
            });
            prediction = await checkRes.json();
        }

        if (prediction.status === "succeeded") {
            const output = prediction.output;
            const imageUrls = typeof output === 'string' ? [output] : output;
            return { imageUrls };
        } else {
            return { error: prediction.error || 'Render thất bại trên máy chủ Replicate.' };
        }
    } catch (error: any) {
        return { error: error.message };
    }
};

// ============================================================================
// CÁC HÀM XUẤT (EXPORT) ĐỂ GIỮ NGUYÊN CẤU TRÚC APP, KHÔNG BỊ LỖI BUILD VERCEL
// ============================================================================

export const generateText = async (): Promise<AiServiceResult> => {
    return { text: "Tính năng text đang tạm tắt để tối ưu chi phí render ảnh." };
};
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

export const generateVideo = async (): Promise<AiServiceResult> => ({ error: "Tính năng Video chưa được kích hoạt." });
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
