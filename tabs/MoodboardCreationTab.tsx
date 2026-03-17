
import React, { useState, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateMoodboard } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';

interface MoodboardCreationTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

const PRESETS = [
    {
        label: "Moodboard Collage (Nghệ thuật & Layer)",
        value: "Hãy tạo 1 moodboard chuyên nghiệp từ bức ảnh nội thất tôi gửi.\nYêu cầu:\n(1) Tách riêng đồ rời: sofa, bàn, ghế, thảm, đèn, trang trí,....làm sạch viền và cắt rời ra khỏi nền.\nSắp xếp đồ vào moodboard theo bố cục hài hòa, không chồng chéo, có chiều sâu.\n(2) Tạo bộ vật liệu (materials): trích xuất các chất liệu trong ảnh như gỗ, đá, vải, kim loại,...... trần – tường – sàn.\nTạo thành các ô vật liệu đặt phía sau hoặc cạnh đồ nội thất.\n(3) Tạo bảng màu (color palette) gồm 4–6 màu chính, dạng vòng tròn hoặc hình vuông, đặt gọn 1 bên.\n(4) Bố cục moodboard theo phong cách collage hiện đại: có layer, có arch/bo tròn có viền đen, tinh tế như các moodboard tham khảo.\nNền màu trung tính (beige hoặc xám nhạt).\nKhông thay đổi hình dáng đồ nội thất.\n(5) Xuất ra:\n • 1 moodboard hoàn chỉnh\n • Liệt kê palette màu\n • Liệt kê vật liệu nhận diện được\n • Nhận xét phong cách nội thất của ảnh\nHãy giữ thẩm mỹ cao, nghệ thuật, hiện đại khiến bằng trình bày trở nên mạch lạc thu hút bằng bố cục và phần chữ được sắp xếp hợp lý."
    },
    {
        label: "Moodboard Tối giản (Clean & Minimal)",
        value: "Hãy tạo một moodboard từ bức ảnh nội thất tôi cung cấp theo bố cục tối giản sạch sẽ:\n • Tách tất cả đồ nội thất và decor ra khỏi nền, làm sạch cạnh.\n • Sắp xếp thành một bố cục ảnh gốc ở phần trên moodboard.\n • Tạo bảng màu có trong ảnh gốc và đặt ở phía dưới ảnh nội thất gốc.\n • Tạo phần ‘item breakdown’ ở phía dưới cùng: hiển thị tất cả các món đồ, vật dụng nội thất đã tách rời và gắn nhãn tên (không lặp lại đồ, vật dụng giống nhau).\n • Mọi thứ phải bố trí gọn gàng, có khoảng trống hợp lý, style minimal tự nhiên.\n • Giữ nguyên phong cách và chất liệu thật từ ảnh gốc.\n • Xuất ra moodboard hoàn chỉnh + bảng màu + danh sách đồ + vật liệu + Ghi chú về phong cách nội thất\nHãy giữ thẩm mỹ cao, nghệ thuật, hiện đại khiến bằng trình bày trở nên mạch lạc thu hút bằng bố cục và phần chữ được sắp xếp hợp lý."
    },
    {
        label: "Style: Grid Gallery (Tạp chí & Editorial)",
        value: "Tạo một Moodboard trình bày nội thất (Interior Design Board) chuyên nghiệp với bố cục lưới (Grid Layout) chặt chẽ theo phong cách tạp chí kiến trúc.\n1. Bố cục: Sử dụng toàn bộ diện tích khung hình, chia lưới thẳng hàng.\no Vùng Hero: Một hình ảnh phối cảnh lớn, sắc nét, ánh sáng điện ảnh (cinematic lighting) chiếm 50% diện tích.\no Vùng Chi tiết: Một cột chứa 3-4 hình ảnh vuông nhỏ (crop chi tiết décor, ánh sáng từ ảnh gốc) xếp dọc thẳng hàng.\no Vùng Vật liệu: Một hàng ngang chứa các mẫu vật liệu hình vuông (Swatch) có hiệu ứng nổi khối nhẹ, có viền đen xung quanh.\n2. Đồ họa (Graphics): Thêm các đường kẻ mảnh (fine lines) để phân chia khu vực. Quan trọng: Dưới mỗi hình ảnh và mẫu vật liệu, hãy đặt các khối văn bản giả (dummy text blocks) màu xám nhạt để mô phỏng chú thích, giúp bố cục trông đầy đủ thông tin và không bị trống.\n3. Bảng màu: Trích xuất bảng màu 6 ô tròn đặt gọn gàng ở góc dưới. Yêu cầu: Thiết kế tối giản nhưng đặc (dense), giống trang biên tập tạp chí cao cấp.\nHãy giữ thẩm mỹ cao, nghệ thuật, hiện đại khiến bằng trình bày trở nên mạch lạc thu hút bằng bố cục và phần chữ được sắp xếp hợp lý."
    },
    {
        label: "Style: Hero Product (Chiều sâu & Studio)",
        value: "Biến hình ảnh đầu vào thành một Poster quảng cáo sản phẩm nội thất (Product Hero Shot) cao cấp.\n1. Chủ thể: Tách đối tượng nội thất đẹp nhất trong ảnh (ghế/đèn/bàn/....) đặt vào trung tâm.\n2. Môi trường: Đặt vật thể trên nền sàn studio có độ bóng nhẹ (reflective floor) và phông nền Gradient chuyển màu mềm mại. Không để vật thể lơ lửng trong không gian vô định.\n3. Vệ tinh (Satellites): Làm đầy không gian xung quanh bằng cách bố trí các 'bong bóng' hình tròn chứa ảnh zoom cận cảnh (macro textures) của vật liệu. Thêm các vật thể trang trí bay lơ lửng (lá cây, lọ hoa, sách,....) ở các độ sâu trường ảnh khác nhau (mờ ở xa, rõ ở gần) để tạo chiều sâu 3D (Depth of field).\nThêm một vài miniview về vật dụng khác ngoài khu vực chính.\nThêm bố trí xung quanh 2 bên khu vực chính bảng ghi chú và các mood ảnh vật liệu hình vuông có viền đen (to rõ và cân đối dễ đọc, thu hút).\n4. Ánh sáng: Sử dụng ánh sáng studio (Studio Lighting) với ánh sáng viền (rim light) để tách vật thể khỏi nền. Phong cách: Sang trọng, ấn tượng thị giác, độ phân giải 8k."
    },
    {
        label: "Style: Material Board A4 (Kỹ thuật & Chi tiết)",
        value: "Tạo một Bảng vật liệu kỹ thuật (Technical Material Specification) chi tiết và đầy đủ thông tin.\n1. Phối cảnh: Hình ảnh không gian nội thất dạng 3D Isometric chiếm 65-70% diện tích bảng, hiển thị rõ ràng từng ngóc ngách (không tự thêm bất cứ chi tiết không có trong ảnh gốc).\n2. Hàng vật liệu: Bên dưới là một hàng các hình tròn có viền gồm mẫu vật liệu có trong ảnh gốc, bao gồm cả vật liệu cứng (sàn, gỗ,...) và mềm (rèm, thảm,...), sắp xếp sát nhau.\n3. Kết nối: Sử dụng hệ thống đường dẫn (leader lines) nét đứt màu đen, có chấm tròn ở đầu, nối chính xác mẫu vật liệu lên phối cảnh đúng vị trí vật dụng, vật liệu có trong ảnh gốc (chỉ nối từ mẫu vật liệu lên phối cảnh không tạo các đường leader lines thừa).\n4. Bổ sung: Để bố cục trông chuyên nghiệp hơn, hãy thêm các yếu tố đồ họa phụ ở bên phải như: thanh thước tỉ lệ (scale bar), và các ô tiêu đề giả (dummy title box) ở góc dưới. Lưu ý: Nền trắng sạch, nét vẽ mảnh nhưng sắc sảo.\nHãy giữ thẩm mỹ cao, nghệ thuật, hiện đại khiến bằng trình bày trở nên mạch lạc thu hút bằng bố cục và phần chữ được sắp xếp hợp lý."
    },
    {
        label: "Style: Japandi/Zen (Ánh sáng & Cảm xúc)",
        value: "Tạo Moodboard phong cách Japandi (Zen) tập trung vào chiều sâu cảm xúc và sự phong phú của chất liệu.\n1. Không gian: Tái tạo không gian trong ảnh với tông màu ấm (Beige/Earth tones). Quan trọng: Thêm hiệu ứng bóng nắng đổ qua rèm (dappled sunlight/shadow play) lên tường và sàn để làm đầy không gian bằng ánh sáng tự nhiên.\n2. Sắp đặt (Layering): Bố trí các vật mẫu (gỗ mộc, vải linen nhăn, gốm thô) xếp chồng lên nhau một cách nghệ thuật ở một góc ảnh, thay vì xếp dàn trải rời rạc.\n3. Thiên nhiên: Thêm các nhánh cây khô hoặc lá cây xanh mờ ảo ở tiền cảnh (foreground) để tạo chiều sâu cho bức ảnh. Cảm xúc: Tĩnh lặng nhưng giàu chất cảm (rich texture), mộc mạc, không gian được lấp đầy bởi ánh sáng và vật liệu tự nhiên."
    },
    {
        label: "Style: Hospitality Presentation (Sang trọng & Drama)",
        value: "Tạo một Slide trình bày thiết kế (Design Presentation) khổ ngang 16:9 ấn tượng dành cho khách sạn/resort.\n1. Mood (Chính): Một khung hình lớn chiếm 2/3 diện tích, thể hiện không gian chính với ánh sáng kịch tính (Dramatic Lighting) và độ tương phản tốt.\n2. Items (Phụ): Phần còn lại sắp xếp các món đồ rời (bàn, ghế, đèn) được tách nền sạch sẽ, đặt trên nền màu trung tính trang nhã.\n3. Liên kết: Sử dụng các đường kẻ vàng kim (gold lines) hoặc layout chồng lớp nhẹ để liên kết hai vùng này lại với nhau.\n4. Finish: Các ô swatch vật liệu (đá, gỗ) được đặt nhỏ gọn, tinh tế ở cạnh dưới. Đồ họa: Bố cục dạng tạp chí kiến trúc hiện đại, sắc sảo. Các tiêu đề mục dùng tiếng Anh cơ bản (MOOD, ITEMS) font không chân sang trọng."
    },
    {
        label: "Style: Biophilia (Rừng nhiệt đới & Tươi mát)",
        value: "Tạo Moodboard phong cách Biophilia (Yêu thiên nhiên) tươi mát và tràn đầy sức sống.\n1. Trọng tâm: Làm nổi bật sự hòa quyện giữa nội thất và thiên nhiên. Không chỉ là chậu cây, hãy tạo cảm giác như một khu vườn trong nhà (Indoor Jungle).\n2. Lớp nền: Sử dụng các hình ảnh chụp cận cảnh (macro shots) của gân lá hoặc bề mặt gỗ thô làm nền mờ ảo hoặc các mảng trang trí lớn.\n3. Bố cục: Dạng Collage với các khung hình bo tròn mềm mại (Organic shapes) đan xen nhau.\n4. Màu sắc: Trích xuất bảng màu rực rỡ tập trung vào các tông màu đất (Earth tones) và đa dạng sắc độ xanh lá (Greenery). Cảm giác: Tươi mới, rậm rạp (lush), ngập tràn ánh sáng và oxy."
    },
    {
        label: "Ghi chú viết tay / Sketch Annotation",
        value: "Hãy tạo moodboard dạng “collage + ghi chú viết tay” từ bức ảnh nội thất tôi gửi.\nYêu cầu:\n1. Tách đồ (bàn, ghế, đèn, vật dụng trang trí,.....) + texture (gỗ, đá, vải, sơn, kim loại, gốm, cây xanh,......) và xếp collage tự do, có băng keo giấy, mép xé, đổ bóng nhẹ. \n2. Vẽ các đường cong/line mảnh chỉ chính xác vào từng mảnh và ghi chú như viết tay (tiếng Việt có dấu, font Be Vietnam Pro; nếu lỗi dấu thì để ô nhãn trống và xuất kèm danh sách chữ). \n3. Nền giấy trắng/kem, vibe concept board thủ công, nghệ thuật, sạch, không rối. Giữ nguyên tone và vật liệu từ ảnh gốc, không thêm đồ không có.\n4. Xuất: 1 moodboard + danh sách vật liệu + palette 4–6 màu.\nNền màu trung tính (beige hoặc xám nhạt).\nKhông thay đổi hình dáng đồ nội thất.\n5. Xuất ra:\n • 1 moodboard hoàn chỉnh\n • Liệt kê palette màu\n • Liệt kê vật liệu nhận diện được\n • Nhận xét phong cách nội thất của ảnh\nHãy giữ thẩm mỹ cao, nghệ thuật, hiện đại khiến bảng trình bày trở nên mạch lạc và thu hút bằng bố cục và phần chữ được sắp xếp hợp lý."
    },
    {
        label: "Moodboard Chỉ Dẫn (Annotated Plan)",
        value: "Bạn là Graphic Architect/Concept Designer. Tạo 01 “Moodboard chỉ dẫn” (annotated moodboard) chỉ dựa trên ẢNH 1 (mặt bằng đã đổ màu) — KHÔNG có ảnh tham chiếu khác. KHÔNG redraw/biến dạng mặt bằng, KHÔNG đổi bố trí phòng.\n\nINPUT\n- ẢNH 1 (bắt buộc): Mặt bằng đổ màu (tôi upload).\n- Thông tin board: [MOODBOARD TẦNG 1] | [TL 1/100] + thước 0–2–4–8m | [YOUR_STUDIO]\n\nAUTO LAYOUT THEO DẠNG MẶT BẰNG (BỐ TRÍ MOOD THEO 2 BÊN CHIỀU DÀI NHÀ)\n- Tự nhận diện hướng mặt bằng:\n  + Nếu mặt bằng NẰM NGANG (chiều dài trái–phải): đặt ảnh mood theo 2 DẢI TRÊN & DƯỚI (bám theo chiều dài nhà).\n  + Nếu mặt bằng NẰM DỌC (chiều dài trên–dưới): đặt ảnh mood theo 2 DẢI TRÁI & PHẢI (bám theo chiều dài nhà).\n=> Luôn đặt mood ở HAI BÊN của CHIỀU DÀI ngôi nhà để leader line ngắn và rõ.\n\nKHOÁ BỐ CỤC (BẮT BUỘC KHÔNG CHỒNG LÊN MẶT BẰNG)\n1) Tạo “VÙNG CẤM” (NO-OVERLAP ZONE): hình chữ nhật bao trọn mặt bằng + padding 3–5% kích thước trang.\n2) Mọi ảnh mood/caption/số thứ tự/palette key TUYỆT ĐỐI không được nằm trong vùng cấm.\n3) Chỉ được đặt ảnh mood trong 2 “DẢI AN TOÀN”:\n   - Mặt bằng ngang: TOP STRIP + BOTTOM STRIP.\n   - Mặt bằng dọc: LEFT STRIP + RIGHT STRIP.\n4) Ảnh mood cách đều và canh theo trục khu vực cần chỉ để leader line gần như thẳng; tránh mọi giao cắt.\n\nẢNH MOOD (TỰ TẠO NỘI DUNG TỪ MẶT BẰNG)\n- Từ các khu vực thể hiện trên mặt bằng (sân/lối vào/garage/sảnh/khách/bếp-ăn/WC/thang/hiên/sân trong/hồ nước/vườn/sân sau...), tự sinh 10–12 ảnh mood “hợp phong cách” (không cần tham chiếu), ưu tiên:\n  + cảnh sân vườn nhiệt đới, lối dạo stepping stone, hiên gỗ/stone, mảng xanh, ánh sáng tự nhiên\n  + nội thất tối giản ấm, gỗ–đá–bê tông, tông trung tính, cảm giác resort-like\n- Mỗi ảnh mood chỉ mang tính gợi ý không gian/vật liệu/tiểu cảnh cho đúng khu vực trên mặt bằng.\n\nLEADER LINE CHÍNH XÁC\n- Mỗi ảnh mood hình tròn có leader line nét chấm nối đúng khu vực tương ứng trên mặt bằng.\n- Leader line chỉ được “chạm” mặt bằng tại 1 chấm neo nhỏ (dot). Không kéo line xuyên qua phòng; nếu cần gấp khúc 90° và đi sát mép ngoài mặt bằng.\n- Đánh số 01–12 cạnh ảnh mood và lặp lại số nhỏ tại điểm chạm trên mặt bằng.\n\nVIỀN ẢNH MOOD (BẮT BUỘC)\n- Tất cả ảnh mood hình tròn có viền đen #111111:\n  + dày 2–3px (A3) / 3–4px (A2), viền sắc, không blur.\n\nBẢNG “MATERIAL / PALETTE KEY”\n- Đặt ở góc ngoài vùng cấm.\n- Trích 5–7 màu chủ đạo từ mặt bằng đổ màu, hiển thị swatch + mã HEX (ước lượng theo ảnh).\n- Gợi ý vật liệu ngắn: đá/sỏi/bê tông rửa/gỗ decking/cây bụi-tán cao/kính khung đen... (phù hợp những gì thấy trên mặt bằng).\n\nQUY CHUẨN TRÌNH BÀY\n- A2 ngang ưu tiên (hoặc A3), nền trắng.\n- Font sans sạch (Inter/Helvetica). Nếu công cụ hay lỗi dấu tiếng Việt: dùng Be Vietnam Pro hoặc Noto Sans và embed font; nếu vẫn lỗi thì để ô nhãn trống và xuất kèm danh sách chữ tiếng Việt để dán sau.\n- Tổng thể gọn, cân đối, ít rối.\n\nOUTPUT\n1) 01 trang moodboard hoàn chỉnh\n2) Layout blueprint (vị trí mặt bằng + 2 dải mood + vùng cấm + palette key)\n3) Content pack 10–12 mục: ID | Khu vực | Caption 6–10 từ | Keyword tìm ảnh (3–5) | Gợi ý vật liệu/tiểu cảnh (1–2)"
    }
];

const PAPER_SIZES = ['A4', 'A3', 'A2', 'Square (1:1)', 'Presentation (16:9)'];
const ORIENTATIONS = ['Landscape (Ngang)', 'Portrait (Dọc)'];

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean }> = ({ label, options, value, onChange, disabled=false }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} disabled={disabled} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition disabled:opacity-50">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export const MoodboardCreationTab: React.FC<MoodboardCreationTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageFile | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState<string>(PRESETS[0].value);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [paperSize, setPaperSize] = useState(PAPER_SIZES[0]);
  const [orientation, setOrientation] = useState(ORIENTATIONS[0]);

  // Sync customPrompt when selected preset changes
  useEffect(() => {
      setCustomPrompt(PRESETS[selectedPresetIndex].value);
  }, [selectedPresetIndex]);

  return (
    <BaseTab tabKey="moodboard_creation" onEditRequest={onEditRequest} onVideoRequest={onVideoRequest} comparisonImage={sourceImage?.base64}>
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (!sourceImage) {
            alert('Vui lòng tải ảnh nội thất gốc.');
            return;
          }

          setLoading(true);
          setResult(null);
          
          // Append layout instructions
          const layoutInstruction = `\n\n[LAYOUT CONSTRAINT]\nKhổ giấy: ${paperSize}.\nChiều: ${orientation}.\nHãy đảm bảo bố cục và tỷ lệ khung hình của ảnh kết quả tuân thủ chính xác yêu cầu này.`;
          const finalPrompt = customPrompt + layoutInstruction;

          // Use the custom prompt from the textarea
          const response = await generateMoodboard(sourceImage, finalPrompt, referenceImage, numberOfImages);
          
          setResult(response);
          if (!response.error) {
            addHistoryItem(PRESETS[selectedPresetIndex].label, response);
          }
          setLoading(false);
        };

        return (
          <Card title="Tạo Moodboard">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploader onFileSelect={setSourceImage} label="1. Ảnh nội thất gốc (Bắt buộc)" />
                  <ImageUploader onFileSelect={setReferenceImage} label="2. Ảnh tham chiếu Style (Tuỳ chọn)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-2">3. Chọn kiểu Moodboard</label>
                <div className="relative mb-3">
                    <select
                        value={selectedPresetIndex}
                        onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                        className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent transition appearance-none"
                    >
                        {PRESETS.map((preset, index) => (
                            <option key={index} value={index}>
                                {preset.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-text-muted">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <SelectInput 
                        label="Khổ giấy" 
                        options={PAPER_SIZES} 
                        value={paperSize} 
                        onChange={(e) => setPaperSize(e.target.value)} 
                    />
                    <SelectInput 
                        label="Chiều (Layout)" 
                        options={ORIENTATIONS} 
                        value={orientation} 
                        onChange={(e) => setOrientation(e.target.value)}
                        disabled={paperSize.includes('Square')}
                    />
                </div>

                <label className="block text-xs font-medium text-brand-text-muted mb-1 uppercase tracking-wider">Prompt chi tiết (Có thể chỉnh sửa)</label>
                <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={10}
                    className="w-full bg-black/20 border border-brand-primary/30 rounded-lg p-3 text-xs text-brand-text-muted font-mono focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 resize-none custom-scrollbar"
                    placeholder="Nội dung prompt..."
                />
              </div>

               <NumberSelector
                  label="4. Số lượng kết quả"
                  value={numberOfImages}
                  onChange={setNumberOfImages}
                />
                
              <button
                onClick={handleGenerate}
                disabled={!sourceImage}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:bg-brand-surface disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                Tạo Moodboard
              </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};
