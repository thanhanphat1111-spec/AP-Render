import Replicate from "replicate";

export default async function handler(req, res) {
  // Cấu hình CORS để Frontend gọi được vào Backend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return res.status(500).json({ error: 'Chưa tìm thấy API Token của Replicate.' });

    const replicate = new Replicate({ auth: apiKey });
    const { action, prompt, imageBase64, aspect_ratio = "1:1" } = req.body;

    // Xử lý ảnh đầu vào nếu có
    let finalImage = imageBase64;
    if (finalImage && !finalImage.startsWith('data:')) {
      finalImage = `data:image/jpeg;base64,${finalImage}`;
    }

    // --- CASE 1: VẼ ẢNH BẰNG GOOGLE NANO-BANANA-2 (IMAGEN 3) ---
    if (action === 'generateImage' || action === 'imageToImage') {
      const output = await replicate.run(
        "google/nano-banana-2:766289ba598f1f7d63683f2d01124619d084e723659247491d9d59a22d4f2963",
        {
          input: {
            prompt: prompt,
            aspect_ratio: aspect_ratio,
            safety_filter_level: "block_medium_and_above"
          }
        }
      );
      // Kết quả trả về từ model Google thường là một object chứa link ảnh trực tiếp
      const imageUrl = typeof output === 'string' ? output : (output[0] || output.image || output);
      return res.status(200).json({ imageUrls: [imageUrl] });
    }

    // --- CASE 2: CHAT VÀ PHÂN TÍCH BẰNG GEMINI 2.0 FLASH (NANO BANANA) ---
    if (action === 'generateText') {
      const output = await replicate.run(
        "google/gemini-2.0-flash-exp:8b557340",
        {
          input: {
            prompt: prompt,
            image: finalImage ? finalImage : undefined
          }
        }
      );
      // Xử lý dữ liệu trả về từ Gemini (thường là mảng các chuỗi)
      const cleanText = Array.isArray(output) ? output.join("") : (output.text || String(output));
      return res.status(200).json({ text: cleanText });
    }

    return res.status(400).json({ error: 'Hành động AI không được hỗ trợ' });

  } catch (error) {
    console.error("Lỗi Replicate API:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ nội bộ." });
  }
}
