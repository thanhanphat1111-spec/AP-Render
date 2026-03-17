import { ImageFile } from "../types";

export const STYLE_OPTIONS = [
    '-- Chọn phong cách nội thất --',
    'Hiện đại (Modern)',
    'Tối giản (Minimalism)',
    'Scandinavian',
    'Đông Dương (Indochine)',
    'Tân cổ điển (Neoclassical)',
    'Công nghiệp (Industrial)',
    'Wabi-sabi',
    'Bohemian (Boho)',
    'Mid-Century Modern',
    'Japandi',
    'Art Deco',
    'Rustic',
    'Coastal (Ven biển)',
    'Luxury (Sang trọng)',
    'Zen (Thiền)',
];

export const MATERIAL_OPTIONS = [
    '-- Chọn vật liệu chủ đạo --',
    'Gỗ sồi tự nhiên',
    'Gỗ óc chó (Walnut)',
    'Đá Marble trắng vân mây',
    'Đá Terrazzo',
    'Kim loại mạ vàng (PVD)',
    'Thép đen & Kính',
    'Vải lanh & Cotton',
    'Da bò tót (Leather)',
    'Bê tông trần & Gỗ',
    'Mây tre đan',
    'Gạch thẻ & Gốm',
    'Nhung (Velvet)',
];

export const TONE_OPTIONS = [
    '-- Chọn tone màu --',
    'Trung tính (Beige/Grey/White)',
    'Ấm áp (Warm Wood/Earth)',
    'Lạnh & Sạch (Cool White/Blue)',
    'Tương phản cao (Black & White)',
    'Pastel nhẹ nhàng',
    'Dark Moody (Tối & Sang)',
    'Rực rỡ (Colorful/Pop)',
];

export const LIGHTING_MOOD_OPTIONS = [
    '-- Chọn Mood ánh sáng --',
    'Ánh sáng tự nhiên ban ngày (Natural Day)',
    'Ấm áp buổi tối (Cozy Evening)',
    'Hiện đại, lạnh & sắc nét (Cool Modern)',
    'Nắng gắt tạo bóng đổ (Hard Sun)',
    'Điện ảnh, nghệ thuật (Cinematic/Moody)',
    'Ánh sáng Studio đều (Studio Lighting)',
];

export const DESIGN_LINES_OPTIONS = [
    '-- Đường nét tổng thể --',
    'Thẳng, hình học rõ ràng',
    'Bo cong mềm mại',
    'Kết hợp thẳng và cong',
    'Hữu cơ tự nhiên (Organic)',
    'Sắc sảo, góc cạnh',
];

export const DETAIL_LEVEL_OPTIONS = [
    '-- Mức độ chi tiết --',
    'Tối giản, rất ít decor',
    'Vừa phải, tinh tế',
    'Nhiều chi tiết decor',
    'Phức tạp, cầu kỳ',
];

export const PRIORITY_FEELING_OPTIONS = [
    '-- Cảm giác chủ đạo --',
    'Ấm cúng, gần gũi (Homey)',
    'Sang trọng, đẳng cấp (Luxury)',
    'Trẻ trung, năng động',
    'Tối giản, thanh tịnh (Zen)',
    'Chuyên nghiệp, nghiêm túc',
    'Nghệ thuật, phá cách',
];

export const INTERIOR_ANGLE_OPTIONS = [
  '-- Chọn góc chụp (nếu cần) --',
  'Góc rộng (Wide-angle) bao quát',
  'Ngang tầm mắt (Eye-level)',
  'Cận cảnh (Close-up)',
  'Từ trên cao (Top-down)',
  'Góc thấp (Low-angle)',
];

export const CONTEXT_OPTIONS = [
    '-- Chọn bối cảnh --',
    'Thành phố ban đêm',
    'Thành phố ban ngày',
    'Sân vườn xanh mát',
    'Rừng cây tự nhiên',
    'Bờ biển',
    'Núi non hùng vĩ',
    'Nội khu cao cấp',
    'Khu dân cư yên tĩnh',
];

export const ASPECT_RATIO_OPTIONS = ['Tự động (Giữ nguyên gốc)', '16:9 (Landscape)', '9:16 (Portrait)', '1:1 (Square)', '4:3 (Standard)', '3:4 (Portrait)'];

export const SPACE_TYPE_OPTIONS = [
    '-- Chọn loại không gian --',
    'Phòng khách',
    'Phòng ngủ Master',
    'Phòng bếp',
    'Phòng ăn',
    'Phòng tắm',
    'Phòng làm việc',
    'Phòng trẻ em',
    'Sảnh đón (Lobby)',
    'Ban công / Logia',
    'Penthouse Living Area',
    'Phòng thay đồ (Walk-in closet)',
    'Phòng Thờ',
    'Phòng Sinh Hoạt Chung',
    'Phòng Vệ Sinh',
    'Hành Lang',
];

export interface InteriorPromptParams {
    roomId: string;
    spaceType: string;
    roomObjects: string;
    style: string;
    lighting: string;
    color: string;
    material: string;
    lines: string;
    detail: string;
    feeling: string;
    generalDesc: string;
    aspectRatio: string;
    moodboardFile: ImageFile | null;
    refImageForAspectRatio?: ImageFile | null;
}

export const getInteriorPromptLayers = (params: InteriorPromptParams) => {
    const {
        roomId, spaceType, roomObjects, style, lighting, color, material,
        lines, detail, feeling, generalDesc, aspectRatio, moodboardFile, refImageForAspectRatio
    } = params;

    // 1. Master Space Spec
    const masterSpaceSpec = `[MASTER_SPACE_SPECIFICATION]
Tất cả hình ảnh/phác thảo trong job này đều thuộc CÙNG MỘT KHÔNG GIAN, mã phòng: ${roomId}.
Loại không gian: ${spaceType}.
Danh sách các phần tử CỐ ĐỊNH, KHÔNG ĐƯỢC THAY ĐỔI giữa các góc nhìn:
${roomObjects}
YÊU CẦU:
- Giữ nguyên bố cục, tỉ lệ và vị trí TẤT CẢ khối kiến trúc và đồ nội thất lớn theo ảnh/phác thảo đầu vào.
- KHÔNG thêm mới, KHÔNG bớt, KHÔNG di chuyển các đồ nội thất lớn.
- Mọi ảnh kết quả phải thể hiện CÙNG MỘT PHÒNG ${roomId} nhìn từ các góc khác nhau.`;

    // 2. Master Style Spec - ENHANCED FOR PHOTOREALISM
    // Logic: If moodboard exists, prioritize it.
    let styleContent = "";
    if (moodboardFile) {
        styleContent = `*** ƯU TIÊN TUYỆT ĐỐI: STYLE TỪ ẢNH MOODBOARD ***
Hãy phân tích và sao chép chính xác phong cách, vật liệu, ánh sáng và không khí từ ảnh Moodboard (Image 2).
Sử dụng các thông tin dưới đây như là bổ sung:
- Phong cách mong muốn: ${style}
- Vật liệu: ${material}
- Màu sắc: ${color}
`;
    } else {
        styleContent = `Phong cách chính: ${style}.
Mood ánh sáng: ${lighting}.
Bảng màu: ${color}.
Vật liệu chủ đạo: ${material}.
Đường nét tổng thể: ${lines}.
Mức độ decor: ${detail}.
Cảm giác ưu tiên: ${feeling}.`;
    }

    const masterStyleSpec = `[MASTER_STYLE_SPECIFICATION]
${styleContent}

QUY ĐỊNH VỀ CHẤT LƯỢNG RENDER (BẮT BUỘC):
1. PHONG CÁCH NHIẾP ẢNH: Ảnh kết quả phải trông giống hệt ảnh chụp thực tế (Photorealistic) bằng máy ảnh chuyên nghiệp. Tuyệt đối tránh cảm giác "nhựa" hoặc "giả".
2. VẬT LIỆU CAO CẤP: Tái tạo chính xác tính chất vật lý của vật liệu (gỗ có vân tự nhiên, kính trong suốt có phản xạ, kim loại có độ bóng, vải có độ mềm).
3. ÁNH SÁNG TỰ NHIÊN: Xử lý ánh sáng và bóng đổ mềm mại, có chiều sâu không gian (Depth), Ambient Occlusion rõ ràng.
4. CHI TIẾT: Hình ảnh sắc nét, độ phân giải cao (8K UHD), không bị mờ hay noise.

Mô tả style chung:
${generalDesc}`;

    // 4. Lock Layout Mode (Strict Mode Block)
    const lockLayoutMode = `[LOCK_LAYOUT_MODE]
Bạn đang ở CHẾ ĐỘ GIỮ NGUYÊN BỐ CỤC (LOCK LAYOUT MODE).
Đầu vào là ảnh/phác thảo của một không gian đã được bố trí đầy đủ.
Nhiệm vụ của bạn KHÔNG PHẢI là thiết kế lại phòng, mà chỉ NÂNG CẤP ảnh này thành ẢNH CHỤP THỰC TẾ (PHOTOREALISTIC).
LUẬT BẮT BUỘC:
1. GIỮ NGUYÊN hình dáng, vị trí và tỉ lệ của TẤT CẢ đồ nội thất lớn.
2. KHÔNG được thêm mới, xóa bớt hoặc di chuyển đồ nội thất lớn.
3. KHÔNG thay đổi cấu trúc ánh sáng chính (vị trí nguồn sáng).
4. CHỈ ĐƯỢC phép: Biến đổi nét vẽ/ảnh thô thành vật liệu thật, tăng cường độ chân thực.
Nếu phải chọn giữa “render đẹp hơn” và “giữ nguyên bố cục”, LUÔN ƯU TIÊN GIỮ NGUYÊN BỐ CỤC.`;

    // Aspect Ratio
    let aspectRatioPrompt = '';
    if (aspectRatio === ASPECT_RATIO_OPTIONS[0] && refImageForAspectRatio) {
        aspectRatioPrompt = `Tỷ lệ khung hình: ${refImageForAspectRatio.width}x${refImageForAspectRatio.height} (Giữ nguyên gốc).`;
    } else {
        aspectRatioPrompt = `Tỷ lệ khung hình: ${aspectRatio.split(' ')[0]}.`;
    }

    return {
        masterSpaceSpec,
        masterStyleSpec,
        lockLayoutMode,
        aspectRatioPrompt
    };
};