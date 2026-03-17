export default async function handler(req, res) {
  const token = process.env.VITE_REPLICATE_API_TOKEN;

  if (!token) return res.status(500).json({ error: 'Chưa cài token trên Vercel' });

  // 1. Luồng nhận ảnh từ Web của anh -> Đẩy lên Replicate
  if (req.method === 'POST') {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  }

  // 2. Luồng hỏi thăm tiến độ -> Trả ảnh về Web của anh
  if (req.method === 'GET') {
    const { id } = req.query;
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  }
}
