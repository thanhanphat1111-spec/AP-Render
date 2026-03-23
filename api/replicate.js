import Replicate from "replicate";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Lưu ý: Lấy Token từ biến môi trường Vercel
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return res.status(500).json({ error: 'Chưa tìm thấy API Token.' });

    const replicate = new Replicate({ auth: apiKey });
    const { action, prompt, aspect_ratio = "1:1" } = req.body;

    // --- CHẠY CHÍNH XÁC NANO-BANANA-2 NHƯ LỆNH CURL CỦA ANH ---
    if (action === 'generateImage' || action === 'imageToImage') {
      const output = await replicate.run(
        "google/nano-banana-2", // Gọi thẳng tên, không có mã Hash
        {
          input: {
            prompt: prompt,
            aspect_ratio: aspect_ratio
          }
        }
      );
      
      // Replicate có thể trả về mảng ảnh hoặc link ảnh trực tiếp
      const imageUrl = Array.isArray(output) ? output[0] : output;
      return res.status(200).json({ imageUrls: [imageUrl] });
    }

    // --- GIỮ LẠI GEMINI CHO CHATBOT ---
    if (action === 'generateText') {
      const { imageBase64 } = req.body;
      const output = await replicate.run(
        "google/gemini-2.0-flash-exp:8b557340",
        { 
          input: { 
            prompt: prompt, 
            image: imageBase64 ? (imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`) : undefined
          } 
        }
      );
      const cleanText = Array.isArray(output) ? output.join("") : (output.text || String(output));
      return res.status(200).json({ text: cleanText });
    }

    return res.status(400).json({ error: 'Hành động không được hỗ trợ' });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
