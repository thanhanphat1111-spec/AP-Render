
import { ActiveTab } from './types';

export const LOCAL_STORAGE_HISTORY_KEY = 'APR_HISTORY';
export const MODEL_STORAGE_KEY = 'APR_MODEL_PREF';

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const GEMINI_PRO_MODEL = 'gemini-3-pro-preview';
export const VEO_MODEL = 'veo-3.1-fast-generate-preview';


export const TABS = [
  { id: ActiveTab.Exterior, label: 'Render Ngoại Thất' },
  { id: ActiveTab.Interior, label: 'Render Nội Thất' },
  { id: ActiveTab.Floorplan, label: '2D to 3D' },
  { id: ActiveTab.BV2D, label: 'BV2D' },
  { id: ActiveTab.Renovation, label: 'Cải Tạo' }, // New Merged Tab
  { id: ActiveTab.ReMake, label: 'ReMake (Đổi Style)' },
  { id: ActiveTab.MoodboardMain, label: 'Moodboard' },
  { id: ActiveTab.Editing, label: 'Chỉnh Sửa Ảnh' },
  { id: ActiveTab.Movie, label: 'Tạo Phim' },
  { id: ActiveTab.Utilities, label: 'Tiện Ích Khác' },
  { id: ActiveTab.Storage, label: 'Lưu trữ' },
];

export const TAB_HISTORY_KEYS: Record<string, string> = {
    'exterior': 'Ngoại thất',
    'interior': 'Nội thất',
    'floorplan_interior': 'Nội thất từ 2D',
    'floorplan_coloring': '3D Nhà',
    'masterplan': 'Quy hoạch & Cảnh quan',
    'editing': 'Chỉnh sửa ảnh',
    'moodboard': 'Ý tưởng từ Moodboard',
    'video': 'Video Đơn',
    'canva_mix': 'Cải tạo (Vật liệu)',
    'canva_mix_interior': 'Cải tạo (Nội thất)',
    'virtual_tour': 'Tham quan ảo 360',
    'style_transfer': 'Đổi Style Công Trình',
    'embed_building': 'Chèn Công Trình',
    '3d_to_2d': '3D sang 2D',
    'furniture_detailing': 'Triển khai nội thất',
    'interior_style_change': 'Đổi Style Nội Thất',
    'watermark_removal': 'Xoá Watermark',
    'lighting_setup': 'Thiết lập Ánh sáng',
    'moodboard_creation': 'Tạo Moodboard'
};

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
    [ActiveTab.Exterior]: "Tính năng Render Ngoại thất: Tải lên ảnh thô hoặc sketch, chọn phong cách, vật liệu và bối cảnh để AI tạo ra phối cảnh ngoại thất chân thực. Hỗ trợ chế độ 'Đồng bộ' (Multi-view) để render nhiều góc cùng lúc.",
    [ActiveTab.Interior]: "Tính năng Render Nội thất: Biến đổi không gian nội thất từ ảnh hiện trạng hoặc sketch. Tự động nhận diện đồ đạc, thay đổi phong cách, ánh sáng và vật liệu theo ý muốn.",
    [ActiveTab.Floorplan]: "Tính năng 2D to 3D: Chuyển đổi mặt bằng 2D thành phối cảnh 3D (Top-down view) hoặc dựng không gian nội thất từ mặt bằng. Hỗ trợ cả Masterplan quy hoạch.",
    [ActiveTab.BV2D]: "Tính năng BV2D (Bản vẽ 2D): Chuyển đổi ngược từ ảnh phối cảnh 3D về bản vẽ kỹ thuật 2D (mặt đứng, mặt cắt) hoặc triển khai chi tiết sản phẩm nội thất.",
    [ActiveTab.Renovation]: "Tính năng Cải Tạo: Tổ hợp các công cụ mạnh mẽ cho việc cải tạo công trình: Tạo 3D từ Moodboard, Chèn công trình vào hiện trạng, Thay đổi vật liệu ngoại thất, và Sắp đặt đồ nội thất.",
    [ActiveTab.ReMake]: "Tính năng ReMake: Chuyên dùng để thay đổi phong cách (Style Transfer) cho cả Nội thất và Ngoại thất, hoặc thiết lập lại ánh sáng (Relighting) mà không làm thay đổi cấu trúc.",
    [ActiveTab.MoodboardMain]: "Tính năng Moodboard: Tạo bảng ý tưởng (Moodboard) chuyên nghiệp từ ảnh nội thất hoặc sắp xếp layout bản vẽ kiến trúc (Arch Layout) tự động.",
    [ActiveTab.Editing]: "Tính năng Chỉnh sửa ảnh: Sử dụng cọ vẽ (Masking) để chỉnh sửa cục bộ, thêm/bớt vật thể, mở rộng ảnh hoặc xóa chi tiết thừa.",
    [ActiveTab.Movie]: "Tính năng Tạo Phim: Tạo video ngắn từ ảnh tĩnh. Hỗ trợ video dựng nội thất (timelapse), video ngoại thất (flycam) và ghép nối timeline.",
    [ActiveTab.Utilities]: "Tiện ích khác: Các công cụ bổ trợ như Xóa Watermark (logo/chữ) khỏi ảnh và Tạo Tour tham quan ảo 360 độ.",
    [ActiveTab.Storage]: "Lưu trữ: Quản lý toàn bộ lịch sử các ảnh và video đã tạo. Bạn có thể xem lại, tải xuống hoặc tiếp tục chỉnh sửa từ đây."
};
