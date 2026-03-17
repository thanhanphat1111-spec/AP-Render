
import React, { useState, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateVideo } from '../services/aiService';
import { ImageFile } from '../types';

interface VideoTabProps {
  onEditRequest: (image: ImageFile) => void;
  initialImage: ImageFile | null;
  onClearInitialImage: () => void;
}

// Data for UI elements
const ASPECT_RATIO_OPTIONS: Array<'16:9' | '9:16'> = ['16:9', '9:16'];
const RESOLUTION_OPTIONS: Record<string, '1080p' | '720p'> = {
    '1080p (Full HD)': '1080p',
    '720p (HD)': '720p',
};
const VIDEO_CATEGORY_OPTIONS = ['Kiến trúc', 'Nội thất', 'Quy hoạch', 'Công trường'];
const ROOM_TYPE_OPTIONS = [
    'Phòng khách', 
    'Phòng ăn', 
    'Bếp', 
    'Bếp + Ăn', 
    'Phòng ngủ', 
    'Phòng tắm', 
    'Hành lang', 
    'Sảnh', 
    'Văn phòng',
    'Phòng sinh hoạt chung',
    'Phòng thờ',
    'Phòng đọc sách',
    'Phòng giải trí',
    'Phòng thay đồ',
    'Cầu thang',
    'Sân vườn',
];

const PROMPT_SAMPLES_DATA = [
  {
    category: '🏠 I. GÓC QUAY NGOẠI THẤT (EXTERIOR CAMERA ANGLES)',
    samples: [
      { name: 'Góc mắt người (Eye-level)', description: 'Tầm nhìn cao khoảng 1,6–1,7 m, thể hiện công trình thực tế như khi đứng trước.', prompt: 'Camera đặt ở tầm mắt người, khung cảnh nhìn trực diện, đường chân trời ở giữa khung hình, góc nhìn tự nhiên, giống máy ảnh DSLR.' },
      { name: 'Góc thấp (Low angle)', description: 'Camera đặt thấp (~0,5–1 m), nhìn lên, nhấn mạnh sự bề thế.', prompt: 'Góc nhìn thấp, camera ngẩng lên khoảng 15–25°, nhấn mạnh chiều cao và khối công trình, đường thẳng đứng không bị méo.' },
      { name: 'Góc cao (High angle / Bird view)', description: 'Nhìn từ trên cao (2–5 tầng), dùng cho phối cảnh tổng thể hoặc khối chính.', prompt: 'Camera nhìn từ trên cao, phối cảnh chim bay, tầm cao khoảng 15–20 m, nhìn xuống toàn bộ mặt đứng và cảnh quan xung quanh.' },
      { name: 'Góc chéo 3/4 (Three-quarter)', description: 'Góc 45°, thấy hai mặt công trình, cân bằng ánh sáng.', prompt: 'Camera nghiêng khoảng 45°, thấy hai mặt công trình, bố cục cân đối, ánh sáng chiếu xiên nhẹ, tạo chiều sâu.' },
      { name: 'Góc cận chi tiết (Close-up detail)', description: 'Zoom vào vật liệu, cửa, lam, hoặc logo.', prompt: 'Camera cận chi tiết, tiêu cự dài, DOF mờ nhẹ, tập trung vào bề mặt vật liệu, phản xạ ánh sáng chân thực.' },
      { name: 'Orbit nhẹ (Semi-orbit)', description: 'Camera bay nhẹ quanh công trình, tạo cảm giác 3D.', prompt: 'Camera orbit quanh công trình theo cung 1/4 hoặc 1/2 vòng, chuyển động mượt, trục đứng giữ nguyên.' }
    ]
  },
  {
    category: '🏡 II. GÓC QUAY NỘI THẤT (INTERIOR CAMERA ANGLES)',
    samples: [
      { name: 'Eye-level static', description: 'Góc nhìn người đứng trong phòng.', prompt: 'Camera đặt ở tầm mắt người (1,6 m), hướng vào trung tâm không gian, phối cảnh tự nhiên, không méo, ánh sáng thực.' },
      { name: 'Corner wide shot', description: 'Chụp từ góc phòng để thấy toàn không gian.', prompt: 'Camera đặt tại góc phòng, góc nhìn rộng 18–24 mm, thấy được toàn bộ bố cục, giữ đường đứng thẳng, ánh sáng đều.' },
      { name: 'Pan ngang (horizontal pan)', description: 'Di chuyển ngang qua phòng.', prompt: 'Camera pan ngang từ trái sang phải, di chuyển mượt, không đổi trục đứng, giữ ánh sáng và vật liệu ổn định.' },
      { name: 'Pan dọc (vertical tilt)', description: 'Từ trần xuống sàn, nhấn trần – sàn – vật thể.', prompt: 'Camera tilt nhẹ từ trên xuống, chuyển động chậm, đường thẳng đứng giữ nguyên, ánh sáng ổn định.' },
      { name: 'Dolly in/out', description: 'Tiến – lùi vào giữa phòng hoặc vật thể.', prompt: 'Camera dolly in mượt, FOV không đổi, cảm giác tiến vào không gian, ánh sáng phản chiếu tự nhiên.' },
      { name: 'Focus detail', description: 'Cận vật thể (đèn, sofa, bàn ăn…).', prompt: 'Camera cận cảnh chi tiết nội thất, DOF mờ hậu cảnh, ánh sáng nhẹ, phản chiếu mềm mại.' }
    ]
  },
  {
    category: '🌆 III. GÓC QUAY QUY HOẠCH – CẢNH QUAN (URBAN PLANNING CAMERA ANGLES)',
    samples: [
      { name: 'Top view (plan view)', description: 'Nhìn vuông góc từ trên xuống.', prompt: 'Camera nhìn từ trên cao vuông góc, hiển thị tổng thể khu quy hoạch, đường giao thông và lô đất rõ ràng, ánh sáng đều.' },
      { name: 'Bird-eye oblique', description: 'Góc nghiêng 30–45°, nhìn tổng thể.', prompt: 'Góc nhìn chim bay nghiêng 30–45°, cao khoảng 100–200 m, thấy rõ khối công trình, cây xanh và hạ tầng.' },
      { name: 'Fly-through forward', description: 'Bay dọc tuyến đường chính.', prompt: 'Camera bay dọc tuyến đường trung tâm, di chuyển mượt, độ cao ổn định, tốc độ chậm, mô phỏng drone thật.' },
      { name: 'Orbit around node', description: 'Bay vòng quanh quảng trường/trục chính.', prompt: 'Camera orbit quanh khu trung tâm quy hoạch, giữ trục đứng, nhấn mạnh bố cục đối xứng và các công trình điểm nhấn.' },
      { name: 'Low fly-in', description: 'Bay thấp, cảm giác người đi trong đô thị.', prompt: 'Camera bay thấp cao ~2 m, chuyển động tiến chậm giữa hai dãy công trình, hiệu ứng thị sai (parallax) rõ.' },
      { name: 'Time-lapse light shift', description: 'Thay đổi ánh sáng ngày – đêm.', prompt: 'Camera tĩnh, ánh sáng chuyển dần từ ban ngày sang buổi tối, đèn đường và công trình sáng dần, phơi sáng ổn định.' }
    ]
  }
];

const SelectInput: React.FC<{ label: string, options: readonly string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean }> = ({ label, options, value, onChange, disabled=false }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} disabled={disabled} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition disabled:opacity-50 disabled:cursor-not-allowed">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


const getInteriorHumanActions = (roomType: string) => {
    const actions = {
        panHorizontal: 'Một người di chuyển tự nhiên, không nhìn vào camera.',
        panVertical: 'Một người đang thực hiện một hành động nhẹ nhàng liên quan đến không gian.',
        zoom: 'Bàn tay của một người tương tác với một vật thể.',
    };

    switch (roomType) {
        case 'Phòng khách':
            actions.panHorizontal = 'người đàn ông ngồi đọc báo, người phụ nữ bước qua hoặc uống trà.';
            actions.panVertical = 'người đứng dậy từ sofa hoặc đi tới cửa sổ.';
            actions.zoom = 'tay người nâng ly trà hoặc lật trang báo.';
            break;
        case 'Phòng ăn':
        case 'Bếp + Ăn':
            actions.panHorizontal = 'một người kéo ghế, cử động tay tự nhiên.';
            actions.panVertical = 'người đang bưng khay hoặc rót nước.';
            actions.zoom = 'tay đặt muỗng, cắt bánh, hoặc nhấc ly nước.';
            break;
        case 'Bếp':
            actions.panHorizontal = 'một người đang thái rau củ hoặc lau dọn mặt bếp.';
            actions.panVertical = 'người đang nấu, đảo thức ăn hoặc đặt đĩa.';
            actions.zoom = 'tay thêm gia vị vào món ăn, hoặc mở tủ lạnh.';
            break;
        case 'Phòng ngủ':
            actions.panHorizontal = 'một người gấp chăn, đặt sách, hoặc đi ngang qua.';
            actions.panVertical = 'một người mở rèm cửa sổ để ánh sáng vào phòng.';
            actions.zoom = 'tay chạm vào rèm hoặc đèn đầu giường.';
            break;
        case 'Phòng tắm':
            actions.panHorizontal = 'một người đang lau tay hoặc đặt chai dầu gội lên kệ.';
            actions.panVertical = 'hơi nước bốc lên từ vòi sen hoặc bồn tắm.';
            actions.zoom = 'tay mở vòi nước hoặc lấy khăn tắm.';
            break;
        case 'Hành lang':
        case 'Sảnh':
             actions.panHorizontal = 'một người bước đi chậm rãi qua hành lang.';
             actions.panVertical = 'người bước qua dưới ánh sáng từ trên cao.';
             actions.zoom = 'bàn tay người mở một cánh cửa.';
             break;
        case 'Văn phòng':
             actions.panHorizontal = 'một người đang gõ bàn phím hoặc sắp xếp tài liệu trên bàn.';
             actions.panVertical = 'một người lấy sách từ trên kệ cao.';
             actions.zoom = 'bàn tay người cầm bút viết hoặc di chuột máy tính.';
             break;
        case 'Phòng sinh hoạt chung':
            actions.panHorizontal = 'gia đình đang quây quần xem TV hoặc trẻ em chơi đùa trên sàn.';
            actions.panVertical = 'một người đi từ khu vực này sang khu vực khác trong phòng.';
            actions.zoom = 'tay điều khiển TV hoặc cầm một món đồ chơi.';
            break;
        case 'Phòng thờ':
            actions.panHorizontal = 'một người đang đứng chắp tay thành kính, không gian tĩnh lặng.';
            actions.panVertical = 'khói hương lan tỏa nhẹ nhàng từ lư hương.';
            actions.zoom = 'bàn tay đang thắp một nén hương.';
            break;
        case 'Phòng đọc sách':
            actions.panHorizontal = 'một người đang ngồi đọc sách trên ghế bành, người khác đang lấy sách từ kệ.';
            actions.panVertical = 'camera lướt dọc theo giá sách cao từ sàn đến trần.';
            actions.zoom = 'tay lật một trang sách hoặc đặt tách cà phê xuống.';
            break;
        case 'Phòng giải trí':
            actions.panHorizontal = 'một nhóm người đang xem phim trên màn hình lớn hoặc chơi game.';
            actions.panVertical = 'ánh sáng từ máy chiếu hoặc TV hắt lên tường.';
            actions.zoom = 'tay cầm điều khiển game hoặc một ly nước ngọt.';
            break;
        case 'Phòng thay đồ':
            actions.panHorizontal = 'một người đang lựa chọn trang phục từ tủ quần áo mở.';
            actions.panVertical = 'camera lướt qua các ngăn kéo và kệ chứa phụ kiện.';
            actions.zoom = 'bàn tay đang cài một chiếc khuy áo hoặc lấy một chiếc cà vạt.';
            break;
        case 'Cầu thang':
            actions.panHorizontal = 'một người đang bước đi lên hoặc xuống cầu thang một cách thanh lịch.';
            actions.panVertical = 'camera di chuyển dọc theo lan can hoặc chi tiết trang trí tường.';
            actions.zoom = 'bàn tay lướt nhẹ trên tay vịn cầu thang.';
            break;
        case 'Sân vườn':
            actions.panHorizontal = 'một người đang đi dạo hoặc ngồi thư giãn trên ghế ngoài trời.';
            actions.panVertical = 'camera lướt từ gốc cây lên đến tán lá.';
            actions.zoom = 'bàn tay đang chăm sóc một bông hoa hoặc tưới cây.';
            break;
    }
    return actions;
};



export const VideoTab: React.FC<VideoTabProps> = ({ onEditRequest, initialImage, onClearInitialImage }) => {
    const [imageFile, setImageFile] = useState<ImageFile | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIO_OPTIONS[0]);
    const [resolution, setResolution] = useState<string>(Object.keys(RESOLUTION_OPTIONS)[0]);
    const [videoCategory, setVideoCategory] = useState(VIDEO_CATEGORY_OPTIONS[0]);
    const [roomType, setRoomType] = useState(ROOM_TYPE_OPTIONS[0]);
    const [prompt, setPrompt] = useState('');
    const [hasSelectedKey, setHasSelectedKey] = useState(false);
    const [isCheckingKey, setIsCheckingKey] = useState(true);

    useEffect(() => {
        if (initialImage) {
            setImageFile(initialImage);
            onClearInitialImage();
        }
    }, [initialImage, onClearInitialImage]);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio?.hasSelectedApiKey) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasSelectedKey(hasKey);
            } else {
                setHasSelectedKey(true); // Assume key is from env vars if not in AI Studio
            }
            setIsCheckingKey(false);
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setHasSelectedKey(true); // Assume success to avoid race condition
        } else {
            alert("Vui lòng thiết lập API Key trong môi trường của bạn.");
        }
    };

    const handleSampleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPrompt(e.target.value);
    };

    const handleSuggestPrompt = () => {
        let suggestedPrompt = '';
        const resValue = RESOLUTION_OPTIONS[resolution];

        switch (videoCategory) {
            case 'Kiến trúc':
                suggestedPrompt = `[KHỔ HÌNH VIDEO]
${aspectRatio}

[CHẤT LƯỢNG VIDEO]
${resValue}

**MÔ TẢ NGẮN GỌN:**
Tạo một video kiến trúc 8 giây từ một hình ảnh phối cảnh tĩnh. Video bao gồm ba giai đoạn chuyển động chính: Pan ngang, Orbit bán nguyệt và Zoom vào, với mục tiêu tạo ra cảm giác máy ảnh thực, chuyển động mượt mà và giữ nguyên vẹn các đặc điểm kiến trúc, đường thẳng, và cấu trúc của ảnh gốc.

**THAM CHIẾU HÌNHẢNH GỐC:** Dựa trên hình ảnh phối cảnh kiến trúc tĩnh được tải lên.

**CÁC YÊU CẦU CHUNG:**
*   **Thời lượng:** Khoảng 8 giây.
*   **Bố cục & Đối tượng:** Giữ nguyên bố cục, hình khối, vật liệu, ánh sáng của ảnh gốc. Không thêm hoặc xóa bất kỳ đối tượng nào (không có người, xe cộ, cây cối, biển hiệu, v.v.).
*   **Đường thẳng & Trục:** Bảo toàn tuyệt đối đường thẳng và trục đứng. Cạnh tường, khung cửa, lam phải sắc nét, ổn định và nhất quán theo thời gian. Cấu trúc mặt đứng/không gian cần giữ nhất quán trong toàn bộ video.
*   **Biến dạng:** Tránh hoàn toàn hiện tượng méo "cao su" (rubber-banding), nhấp nháy (flicker), và biến dạng hoa văn.
*   **Phơi sáng:** Phơi sáng ổn định trong toàn bộ video, không có hiện tượng "bơm sáng" (pumping) hoặc thay đổi độ sáng đột ngột.
*   **Phong cách:** Cảm giác máy ảnh thật, chuyển động mượt mà, tự nhiên.

**TUYẾN CHUYỂN ĐỘNG CỤ THỂ:**

**Giai đoạn 1: Pan ngang (0-2.5 giây)**
*   **Loại chuyển động:** Camera pan ngang từ trái sang phải.
*   **Đặc điểm:** Chuyển động ổn định, mượt mà như di chuyển trên slider. Không có hiện tượng roll (quay quanh trục ống kính).
*   **Mục tiêu:** Giới thiệu tổng thể hoặc một phần quan trọng của công trình kiến trúc.

**Giai đoạn 2: Orbit bán nguyệt (2.5-5 giây)**
*   **Loại chuyển động:** Camera orbit nhẹ nhàng theo hình bán nguyệt quanh công trình.
*   **Đặc điểm:** Có hiệu ứng thị sai (parallax) tinh tế để tạo chiều sâu. Trục đứng của công trình phải được giữ thẳng, không bị nghiêng hay xoay.
*   **Mục tiêu:** Khám phá công trình từ một góc nhìn khác, tạo cảm giác không gian 3D.

**Giai đoạn 3: Zoom vào (5-8 giây)**
*   **Loại chuyển động:** Camera zoom mượt mà vào một chi tiết hoặc khu vực cụ thể của công trình.
*   **Đặc điểm:** Kết hợp dolly nhẹ nhàng và thay đổi FOV (Trường nhìn) tối thiểu để tạo cảm giác zoom quang học hoặc dolly in tự nhiên. Kết thúc bằng việc giữ khung hình ổn định trong một khoảnh khắc ngắn cuối cùng.
*   **Mục tiêu:** Nhấn mạnh một chi tiết kiến trúc, vật liệu hoặc điểm nhấn thiết kế cụ thể.

**ĐỘ PHỨC TẠP:** Phức tạp

**MỤC ĐÍCH SỬ DỤNG:** Trình bày kiến trúc, portfolio, marketing bất động sản.`;
                break;
            
            case 'Nội thất':
                const actions = getInteriorHumanActions(roomType);
                suggestedPrompt = `[KHỔ HÌNH VIDEO]
${aspectRatio}

[CHẤT LƯỢNG VIDEO]
Chất lượng cao ${resValue}, ánh sáng vật lý, chuyển động máy ảnh thật, không nhấp nháy, không biến dạng.

**MÔ TẢ NGẮN GỌN:**
Tạo một video nội thất dài khoảng 8 giây từ hình ảnh phối cảnh tĩnh, bao gồm ba giai đoạn chuyển động chính:
1️⃣ Pan ngang (0–2.5 giây)
2️⃣ Pan dọc từ trần xuống (2.5–5 giây)
3️⃣ Zoom vào chi tiết nội thất (5–8 giây).
Video giữ nguyên bố cục, ánh sáng và vật liệu gốc, đồng thời có người thật di chuyển hoặc thao tác nhẹ nhàng phù hợp với chức năng không gian.

**CÁC YÊU CẦU CHUNG:**
*   **Thời lượng:** ~8 giây.
*   **Không gian:** Giữ nguyên bố cục, vật liệu, ánh sáng và phối cảnh.
*   **Không thay đổi:** hình khối, vị trí đồ đạc, ánh sáng hoặc vật thể.
*   **Không thêm:** hiệu ứng, đồ vật, cây cối hoặc vật trang trí.
*   **Đường thẳng, trục đứng:** Bảo toàn tuyệt đối. Không bị méo, nghiêng, rung.
*   **Phơi sáng:** Ổn định trong suốt video, không thay đổi độ sáng.
*   **Phong cách:** Giống quay phim thật, chuyển động máy mượt, tự nhiên.

**TUYẾN CHUYỂN ĐỘNG CỤ THỂ**

**Giai đoạn 1: Pan ngang (0–2.5 giây)**
*   **Loại chuyển động:** Camera pan nhẹ từ trái sang phải (hoặc ngược lại).
*   **Đặc điểm:** Giữ thẳng trục đứng, không xoay (roll).
*   **Mục tiêu:** Giới thiệu tổng thể không gian nội thất.
*   **Người trong cảnh (nếu có):** ${actions.panHorizontal}

**Giai đoạn 2: Pan dọc (2.5–5 giây)**
*   **Loại chuyển động:** Camera di chuyển từ trần xuống sàn, chậm, mượt, cảm giác dolly vertical.
*   **Đặc điểm:** Giữ thẳng trục dọc, không méo vật thể, ánh sáng ổn định.
*   **Mục tiêu:** Tạo cảm giác chiều cao không gian, thể hiện vật liệu trần, đèn, tường và sàn.
*   **Người trong cảnh (nếu có):** ${actions.panVertical}

**Giai đoạn 3: Zoom vào chi tiết (5–8 giây)**
*   **Loại chuyển động:** Camera zoom mượt mà vào một chi tiết nổi bật (đèn, ghế, sofa, bàn, bình hoa…).
*   **Đặc điểm:** Dolly in nhẹ, không đổi phối cảnh, không méo hình.
*   **Mục tiêu:** Nhấn mạnh chi tiết nội thất hoặc điểm nhấn thiết kế.
*   **Người trong cảnh (nếu có):** ${actions.zoom}

**MỤC ĐÍCH SỬ DỤNG:**
Trình chiếu nội thất, portfolio thiết kế, marketing dự án hoặc giới thiệu không gian sinh hoạt thực tế.`;
                break;

            default:
                suggestedPrompt = `Tạo một video cinematic, chất lượng ${resValue}, khổ hình ${aspectRatio}, từ hình ảnh được cung cấp. Video nên có chuyển động mượt mà, chuyên nghiệp như sử dụng flycam hoặc slider, làm nổi bật các đặc điểm chính của đối tượng trong ảnh.`;
                break;
        }
        setPrompt(suggestedPrompt.trim());
    };

    return (
        <BaseTab tabKey="video" onEditRequest={onEditRequest} comparisonImage={imageFile?.base64}>
            {({ setLoading, setResult, addHistoryItem, setLoadingMessage }) => {

                const handleGenerate = async () => {
                    if (!imageFile) {
                        alert('Vui lòng tải ảnh gốc để tạo video.');
                        return;
                    }
                    if (!prompt.trim()) {
                        alert('Vui lòng nhập mô tả cho video.');
                        return;
                    }

                    if (!hasSelectedKey) {
                        alert("Vui lòng chọn API Key để tiếp tục. Video API yêu cầu key riêng.");
                        handleSelectKey();
                        return;
                    }

                    setLoading(true);
                    setResult(null);

                    const selectedAspectRatio = aspectRatio.split(' ')[0] as '16:9' | '9:16';
                    const selectedResolution = RESOLUTION_OPTIONS[resolution] as '1080p' | '720p';

                    const response = await generateVideo(prompt, imageFile, selectedAspectRatio, selectedResolution, setLoadingMessage || (() => {}), false);
                    
                    if (response.error && (response.error.includes('API Key không hợp lệ') || response.error.includes('hết hạn'))) {
                        setHasSelectedKey(false);
                    }
                    
                    setResult(response);
                    if (!response.error) {
                        addHistoryItem(prompt, response);
                    }
                    setLoading(false);
                };

                return (
                    <Card title="Input">
                        <div className="space-y-4">
                            <ImageUploader onFileSelect={setImageFile} label="Tải ảnh gốc" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectInput label="Thể loại video" options={VIDEO_CATEGORY_OPTIONS} value={videoCategory} onChange={e => setVideoCategory(e.target.value)} />
                                <SelectInput 
                                    label="Loại phòng"
                                    options={ROOM_TYPE_OPTIONS} 
                                    value={roomType} 
                                    onChange={e => setRoomType(e.target.value)}
                                    disabled={videoCategory !== 'Nội thất'}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <SelectInput 
                                    label="Khổ hình (Aspect Ratio)" 
                                    options={ASPECT_RATIO_OPTIONS}
                                    value={aspectRatio}
                                    onChange={e => setAspectRatio(e.target.value)} 
                               />
                               <SelectInput
                                    label="Chất lượng (Resolution)" 
                                    options={Object.keys(RESOLUTION_OPTIONS)}
                                    value={resolution}
                                    onChange={e => setResolution(e.target.value)}
                               />
                            </div>
                            
                            <div className="space-y-1">
                                <label htmlFor="prompt-samples" className="block text-sm font-medium text-brand-text-muted">Chọn prompt mẫu (lựa chọn dạng cuộn)</label>
                                <select
                                    id="prompt-samples"
                                    onChange={handleSampleSelect}
                                    className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Chọn một gợi ý --</option>
                                    {PROMPT_SAMPLES_DATA.map((group, groupIndex) => (
                                        <optgroup key={groupIndex} label={group.category}>
                                            {group.samples.map((sample, sampleIndex) => (
                                                <option key={sampleIndex} value={sample.prompt}>
                                                    {sample.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="video-prompt" className="block text-sm font-medium text-brand-text-muted">Mô tả video (Prompt)</label>
                                    <button
                                      onClick={handleSuggestPrompt}
                                      className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors"
                                    >
                                      ✨ Gợi ý từ AI
                                    </button>
                                </div>
                                <textarea
                                    id="video-prompt"
                                    rows={10}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                                    placeholder="Mô tả chi tiết chuyển động, phong cách và nội dung video bạn muốn tạo..."
                                />
                            </div>

                            {!hasSelectedKey ? (
                                <div className="p-4 border border-yellow-500/50 bg-yellow-900/20 rounded-lg text-center">
                                    <p className="text-sm text-yellow-300 mb-2">Tính năng tạo video yêu cầu API Key riêng. Vui lòng chọn key của bạn để tiếp tục.</p>
                                    <p className="text-xs text-yellow-400 mb-3">Thông tin thanh toán có thể được yêu cầu. Xem chi tiết tại <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">ai.google.dev/gemini-api/docs/billing</a>.</p>
                                    <button
                                        onClick={handleSelectKey}
                                        disabled={isCheckingKey}
                                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                                    >
                                        {isCheckingKey ? 'Đang kiểm tra...' : 'Chọn API Key'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors"
                                >
                                    Tạo Video
                                </button>
                            )}
                        </div>
                    </Card>
                );
            }}
        </BaseTab>
    );
};
