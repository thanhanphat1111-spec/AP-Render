
import { SourceImage, ImageFile } from './types';

export const sourceImageToDataUrl = (image: SourceImage | ImageFile): string => {
    if (!image.base64) return '';
    if (image.base64.startsWith('data:')) return image.base64;
    // Fallback to mimeType if provided
    const mime = (image as SourceImage).mimeType || (image as ImageFile).file?.type || 'image/png';
    return `data:${mime};base64,${image.base64}`;
};

export const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export const dataUrlToSourceImage = async (dataUrl: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
};

/**
 * Extracts a specific area from an image using percentage-based coordinates.
 */
export const cropImage = async (source: ImageFile, box: {x: number, y: number, w: number, h: number}): Promise<ImageFile> => {
    const img = new Image();
    img.src = source.base64.startsWith('data:') ? source.base64 : `data:${source.file?.type || 'image/png'};base64,${source.base64}`;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    // Ensure coordinates are within natural bounds
    const sx = (box.x / 100) * img.naturalWidth;
    const sy = (box.y / 100) * img.naturalHeight;
    const sw = (box.w / 100) * img.naturalWidth;
    const sh = (box.h / 100) * img.naturalHeight;

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    const base64 = canvas.toDataURL('image/png');
    return {
        file: dataURLtoFile(base64, 'crop.png'),
        base64,
        url: base64,
        width: sw,
        height: sh
    };
};

/**
 * Merges an edited patch back into the original image with edge blending.
 * Uses globalCompositeOperation and blur filter for seamless integration.
 */
export const compositeImage = async (
    original: ImageFile, 
    editedCrop: HTMLImageElement, 
    box: {x: number, y: number, w: number, h: number},
    maskImage?: ImageFile | null,
    options: { expansion: number, edgeBlend: number } = { expansion: 0, edgeBlend: 3 }
): Promise<HTMLCanvasElement> => {
    const bgImg = new Image();
    bgImg.src = original.base64.startsWith('data:') ? original.base64 : `data:${original.file?.type || 'image/png'};base64,${original.base64}`;
    await new Promise(r => bgImg.onload = r);

    const canvas = document.createElement('canvas');
    canvas.width = bgImg.naturalWidth;
    canvas.height = bgImg.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw original background
    ctx.drawImage(bgImg, 0, 0);

    const dx = (box.x / 100) * bgImg.naturalWidth;
    const dy = (box.y / 100) * bgImg.naturalHeight;
    const dw = (box.w / 100) * bgImg.naturalWidth;
    const dh = (box.h / 100) * bgImg.naturalHeight;

    // 2. Create patch with feathered edges
    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = dw;
    patchCanvas.height = dh;
    const pCtx = patchCanvas.getContext('2d')!;

    // Draw the edited area
    pCtx.drawImage(editedCrop, 0, 0, dw, dh);
    
    // Create the feathering mask
    const featherMask = document.createElement('canvas');
    featherMask.width = dw;
    featherMask.height = dh;
    const fmCtx = featherMask.getContext('2d')!;
    
    // Draw white rectangle slightly smaller than crop to define opacity area
    const pad = options.edgeBlend * 1.5;
    fmCtx.fillStyle = 'white';
    fmCtx.fillRect(pad, pad, dw - pad * 2, dh - pad * 2);
    
    // Use destination-in to cut the patch with the mask
    pCtx.globalCompositeOperation = 'destination-in';
    // Apply blur to the mask to create soft edges
    pCtx.filter = `blur(${options.edgeBlend}px)`;
    pCtx.drawImage(featherMask, 0, 0);

    // 3. Final merge onto background
    ctx.drawImage(patchCanvas, dx, dy);
    return canvas;
};
