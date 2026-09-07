import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Instructor assistant endpoint
app.post("/api/ask", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Construct structured context from dialog history to avoid version mismatch issues
    let promptText = `Bạn là Trung tá Nguyễn Văn Quyết, một giảng viên ưu tú của Bộ môn Giáo dục Quốc phòng và An ninh (GDQPAN) dành cho học sinh Trung học phổ thông (Lớp 10, 11, 12) tại Việt Nam.
Nhiệm vụ của bạn là giải đáp chính xác, sư phạm, nghiêm túc nhưng cực kỳ gần gũi và đầy khao khát cống hiến cho học sinh về chương trình giáo dục quốc phòng an ninh cấp ba.
Hãy trả lời ngắn gọn, đầy đủ, chia ý rõ ràng và sử dụng ngôn ngữ Tiếng Việt chuẩn mực.

Chủ đề thảo luận bao gồm:
- Luật nghĩa vụ quân sự (độ tuổi thực hiện nghĩa vụ là từ đủ 18 đến hết 25 tuổi, kéo dài tới hết 27 tuổi đối với người có trình độ ĐH-CĐ; các diện tạm hoãn hay miễn nghĩa vụ quân sự...).
- Lịch sử hào hùng, truyền thống anh hùng của Quân đội nhân dân Việt Nam và Công an nhân dân Việt Nam.
- Kiến thức sử dụng súng tiểu liên AK, súng trường CKC, kỹ thuật tháo lắp (8 bước chính), tư thế bắn (Nằm, Quỳ, Đứng), và kỹ thuật ngắm bắn chuẩn xác.
- Phòng thủ dân sự, sơ cứu vết thương do tai nạn cơ bản (băng ép, garo, cố định xương gãy).
- Phòng chống tệ nạn ma túy và giữ vững trật tự an toàn giao thông trong môi trường học đường.

Hãy phản hồi như một Trung tá đang trực tiếp giảng bài trên bục giảng quân trường đầy nhiệt huyết. Khuyên răn học sinh học tập tốt để dựng xây đất nước. Từ chối trả lời lịch sự nếu câu hỏi vượt khỏi phạm vi quốc phòng an ninh hoặc đời sống học đường.

Lịch sử trò chuyện:
`;

    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        const roleName = turn.role === "user" ? "Học sinh" : "Trung tá Quyết";
        promptText += `${roleName}: ${turn.content}\n`;
      });
    }
    promptText += `Học sinh: ${message}\nTrung tá Quyết:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    const reply = response.text || "Tôi chưa nghe rõ câu hỏi của em. Em có thể trình bày lại được không?";
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Vite middleware flow
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
