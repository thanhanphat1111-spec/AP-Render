
import { generateText } from "./aiService";
import { LayoutAsset, LayoutTemplate, AssetPlacement, LayoutFrame, AssetType } from "../types/archLayout";
import { LAYOUT_TEMPLATES } from "../data/archTemplates";

// --- AI CLASSIFICATION ---

const CLASSIFY_SYSTEM_PROMPT = `Bạn là mô-đun phân loại tài liệu kiến trúc. Nhiệm vụ: đọc caption trên ảnh/trang PDF và phân loại loại bản vẽ. Ưu tiên caption làm kết luận. Trả JSON đúng schema, không văn xuôi.`;

export const classifyAsset = async (file: File, base64: string): Promise<Partial<LayoutAsset>> => {
    const userPrompt = `1) Trích caption/tiêu đề lớn và các keyword quan trọng.
 2) Phân loại type theo 1 trong:
 mat_bang | mat_cat | mat_dung | phoi_canh | tieu_canh | diagram | phan_tich | bo_ky_thuat | y_tuong | khac
 3) priority=main nếu caption có 'CHÍNH/MAIN' hoặc đây là hình phối cảnh lớn/hero; sub nếu ghi 'PHỤ/SUB' hoặc là hình bổ trợ; unknown nếu không rõ.
 4) floor: nếu có TẦNG 1/2/3, T1/T2, ROOF... thì điền, nếu không thì null.
 Trả về JSON:
 { "detectedText": string, "type": string, "priority": string, "floor": string|null, "confidence": number, "keywordsFound": string[], "warnings": string[] }`;

    // Create a dummy ImageFile to pass to existing service
    const imageFile = { file, base64, url: '', width: 0, height: 0 };
    
    try {
        const result = await generateText(userPrompt, CLASSIFY_SYSTEM_PROMPT, imageFile);
        if (result.text) {
            // Parse JSON
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return {
                    detectedText: data.detectedText,
                    type: data.type as AssetType,
                    priority: data.priority,
                    floor: data.floor,
                    confidence: data.confidence,
                    keywordsFound: data.keywordsFound,
                    warnings: data.warnings
                };
            }
        }
        throw new Error("Invalid AI response");
    } catch (e) {
        console.error("Classification failed", e);
        return {
            type: "khac",
            priority: "unknown",
            confidence: 0,
            detectedText: "AI Error",
            keywordsFound: [],
            warnings: ["Classification failed"]
        };
    }
};

// --- LAYOUT ENGINE ---

export const calculateTemplateScore = (assets: LayoutAsset[], template: LayoutTemplate): number => {
    let score = 0;
    const assetPool = [...assets].filter(a => a.confidence >= 0.5); // Only confident assets
    
    // Count asset types
    const typeCounts: Record<string, number> = {};
    assetPool.forEach(a => {
        typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });

    // Check matches
    template.frames.forEach(frame => {
        // Check if we have a suitable asset for this frame
        const perfectMatch = assetPool.find(a => frame.accepts.includes(a.type) && a.priority === 'main' && frame.role === 'hero');
        const goodMatch = assetPool.find(a => frame.accepts.includes(a.type));
        
        if (perfectMatch) {
            score += 2;
        } else if (goodMatch) {
            score += 1;
        } else if (frame.role === 'hero') {
            score -= 1; // Hero frame empty is bad
        }
    });

    return score;
};

export const suggestBestTemplate = (assets: LayoutAsset[]): string => {
    let bestId = LAYOUT_TEMPLATES[0].id;
    let maxScore = -999;

    LAYOUT_TEMPLATES.forEach(tpl => {
        const score = calculateTemplateScore(assets, tpl);
        if (score > maxScore) {
            maxScore = score;
            bestId = tpl.id;
        } else if (score === maxScore) {
            // Tie-break: Prefer templates with hero 'phoi_canh' if we have main renders
            const hasMainRender = assets.some(a => a.type === 'phoi_canh' && a.priority === 'main');
            const tplHasRenderHero = tpl.frames.some(f => f.role === 'hero' && f.accepts.includes('phoi_canh'));
            if (hasMainRender && tplHasRenderHero) {
                bestId = tpl.id;
            }
        }
    });

    return bestId;
};

export const autoAssignAssets = (assets: LayoutAsset[], template: LayoutTemplate): Record<string, AssetPlacement> => {
    const placements: Record<string, AssetPlacement> = {};
    const availableAssets = [...assets].sort((a, b) => {
        // Sort: Main > Sub > Unknown, then Confidence Desc
        const pScore = (p: string) => p === 'main' ? 2 : p === 'sub' ? 1 : 0;
        if (pScore(b.priority) !== pScore(a.priority)) return pScore(b.priority) - pScore(a.priority);
        return b.confidence - a.confidence;
    });

    const assignedAssetIds = new Set<string>();

    // 1. Assign Hero Frames First
    template.frames.filter(f => f.role === 'hero').forEach(frame => {
        const candidate = availableAssets.find(a => 
            !assignedAssetIds.has(a.id) && 
            frame.accepts.includes(a.type) &&
            a.priority === 'main'
        );
        
        if (candidate) {
            placements[frame.id] = createPlacement(candidate, frame);
            assignedAssetIds.add(candidate.id);
        }
    });

    // 2. Assign remaining frames with best fit
    template.frames.forEach(frame => {
        if (placements[frame.id]) return; // Already assigned

        const candidate = availableAssets.find(a => 
            !assignedAssetIds.has(a.id) && 
            frame.accepts.includes(a.type)
        );

        if (candidate) {
            placements[frame.id] = createPlacement(candidate, frame);
            assignedAssetIds.add(candidate.id);
        }
    });

    // 3. Fill empty frames with 'khac' if needed, or loose matching
    template.frames.forEach(frame => {
        if (placements[frame.id]) return;
        const anyCandidate = availableAssets.find(a => !assignedAssetIds.has(a.id));
        if (anyCandidate) {
             // Weak match fallback
             placements[frame.id] = createPlacement(anyCandidate, frame);
             assignedAssetIds.add(anyCandidate.id);
        }
    });

    return placements;
};

const createPlacement = (asset: LayoutAsset, frame: LayoutFrame): AssetPlacement => {
    // Determine default fit
    let fit: "cover" | "contain" = frame.fit;
    
    // Override logic based on asset type
    if (['mat_bang', 'mat_cat', 'mat_dung', 'bo_ky_thuat'].includes(asset.type)) {
        fit = 'contain';
    } else if (['phoi_canh', 'tieu_canh', 'y_tuong'].includes(asset.type)) {
        fit = 'cover';
    }

    return {
        assetId: asset.id,
        fit: fit,
        zoom: 1,
        panX: 0,
        panY: 0,
        labelVisible: true,
        labelOverride: asset.floor ? `${asset.type.toUpperCase()} - ${asset.floor}` : undefined
    };
};
