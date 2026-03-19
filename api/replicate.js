import Replicate from "replicate";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chưa tìm thấy chìa khóa REPLICATE_API_TOKEN.' });
    }

    const replicate = new Replicate({ auth: apiKey });
    const { action, prompt, imageBase64 } = req.body;

    // Chốt chặn an toàn: Đảm bảo định dạng ảnh chuẩn Data URI cho Replicate
    let finalImage = imageBase64;
    if (finalImage && !finalImage.startsWith('data:')) {
      finalImage = `data:image/jpeg;base64,${finalImage}`;
    }

    if (action === 'generateImage') {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: { prompt: prompt, go_fast: true, megapixels: "1", num_outputs: 1 } }
      );
      return res.status(200).json({ imageUrls: output });
    }

    if (action === 'imageToImage' || action === 'editImage') {
      // Dùng mã Hash tuyệt đối 64 ký tự thay vì tên rút gọn để vá lỗi 404
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        { input: { prompt: prompt, image: finalImage, prompt_strength: 0.7 } }
      );
      return res.status(200).json({ imageUrls: output });
    }

    if (action === 'generateText') {
      const output = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        { input: { prompt: prompt, max_tokens: 512 } }
      );
      return res.status(200).json({ text: Array.isArray(output) ? output.join("") : String(output) });
    }

    return res.status(400).json({ error: 'Hành động không được hỗ trợ' });

  } catch (error) {
    console.error("Lỗi máy chủ Replicate:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ nội bộ. Vui lòng thử lại." });
  }
}
