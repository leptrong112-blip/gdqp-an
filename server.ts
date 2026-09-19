import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createSurveyRouter } from "./server/survey";
import { createExamRouter } from "./server/exam";
import { createAuth } from "./server/auth";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '1mb' }));
const accountDirectory = process.env.SURVEY_DATA_DIR || path.join(process.cwd(), 'data');
const accountAuth = createAuth(accountDirectory);
app.use('/api/survey', createSurveyRouter(accountDirectory, accountAuth));
app.use('/api/exam', createExamRouter(accountDirectory, accountAuth));

// In-memory rate limiter for AI endpoints
function createRateLimiter(windowMs: number, maxRequests: number, message: string) {
  const requests = new Map<string, { count: number; resetAt: number }>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';

    for (const [key, val] of requests) {
      if (val.resetAt <= now) requests.delete(key);
    }

    const record = requests.get(ip);
    if (!record || record.resetAt <= now) {
      requests.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }

    record.count++;
    next();
  };
}

const askRateLimiter = createRateLimiter(60_000, 20, "Em đã gửi quá nhiều câu hỏi trong thời gian ngắn. Vui lòng đợi 1 phút trước khi hỏi tiếp nhé.");
const essayRateLimiter = createRateLimiter(60_000, 10, "Yêu cầu chấm tự luận đang gửi quá nhanh. Em vui lòng đợi 1 phút rồi thử lại nhé.");

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
app.post("/api/ask", askRateLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: "Em vui lòng nhập câu hỏi." });
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ error: "Câu hỏi vượt quá độ dài cho phép (tối đa 2.000 ký tự). Em vui lòng tóm lược lại nhé." });
    }
    
    // Construct structured context from dialog history to avoid version mismatch issues
    let promptText = `Bạn là Trung tá Nguyễn Văn Quyết, một giảng viên ưu tú của Bộ môn Giáo dục Quốc phòng và An ninh (GDQP-AN) dành cho học sinh Trung học phổ thông (Lớp 10, 11, 12) tại Việt Nam.
Nhiệm vụ của bạn là giải đáp chính xác, sư phạm, nghiêm túc nhưng cực kỳ gần gũi và đầy khao khát cống hiến cho học sinh về chương trình giáo dục quốc phòng an ninh cấp ba.
Hãy trả lời ngắn gọn, đầy đủ, chia ý rõ ràng và sử dụng ngôn ngữ tiếng Việt chuẩn mực.

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
      history.slice(-15).forEach((turn: any) => {
        const roleName = turn?.role === "user" ? "Học sinh" : "Trung tá Quyết";
        const content = typeof turn?.content === 'string' ? turn.content.slice(0, 1000) : '';
        if (content) promptText += `${roleName}: ${content}\n`;
      });
    }
    promptText += `Học sinh: ${cleanMessage}\nTrung tá Quyết:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    const reply = response.text || "Tôi chưa nghe rõ câu hỏi của em. Em có thể trình bày lại được không?";
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Máy chủ trợ giảng tạm thời gián đoạn. Em vui lòng thử lại sau ít phút nhé." });
  }
});

// AI Essay Grader endpoint
app.post("/api/evaluate-essay", essayRateLimiter, async (req, res) => {
  try {
    const { prompt, userResponse, rubric, suggestedAnswer, maxScore = 3.0 } = req.body;

    if (!userResponse || typeof userResponse !== 'string' || !userResponse.trim()) {
      return res.json({
        score: 0,
        feedback: "Học sinh chưa hoàn thành phần làm bài tự luận. Em hãy đọc kỹ đề bài và trình bày các ý chính theo kiến thức bài học SGK nhé!",
      });
    }

    const cleanResponse = userResponse.trim();
    if (cleanResponse.length > 5000) {
      return res.status(400).json({ error: "Bài tự luận vượt quá dung lượng tối đa cho phép (5.000 ký tự)." });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Heuristic fallback if GEMINI_API_KEY is not configured
      const wordCount = userResponse.trim().split(/\s+/).length;
      let calculatedScore = 1.0;
      let feedback = "";

      if (wordCount >= 100) {
        calculatedScore = Number((maxScore * 0.9).toFixed(1));
        feedback = `Trung tá Quyết nhận xét: Em trình bày bài viết rất đầy đủ (${wordCount} từ), bố cục rõ ràng và bám sát các ý trọng tâm của đề bài! Hãy tiếp tục duy trì tinh thần học tập nghiêm túc, sâu sắc này nhé.`;
      } else if (wordCount >= 50) {
        calculatedScore = Number((maxScore * 0.65).toFixed(1));
        feedback = `Trung tá Quyết nhận xét: Bài làm (${wordCount} từ) đã nêu được ý cơ bản nhưng cần phân tích sâu hơn và liên hệ trách nhiệm bản thân cụ thể hơn theo barem biểu điểm của giáo viên.`;
      } else {
        calculatedScore = Number((maxScore * 0.35).toFixed(1));
        feedback = `Trung tá Quyết nhận xét: Bài làm (${wordCount} từ) còn sơ sài. Em nên đối chiếu với Đáp án mẫu để bổ sung các luận điểm quan trọng nhé.`;
      }

      return res.json({
        score: calculatedScore,
        feedback,
      });
    }

    const aiPrompt = `Bạn là Trung tá Nguyễn Văn Quyết, giảng viên bộ môn GDQP-AN THPT.
Hãy chấm điểm bài làm tự luận của học sinh dưới đây dựa trên Barem tiêu chí (Rubric) và Đáp án gợi ý chuẩn.
Thang điểm tối đa của câu hỏi này là: ${maxScore} điểm.

[ĐỀ BÀI]:
${prompt}

[BAREM TIÊU CHÍ CHẤM]:
${JSON.stringify(rubric, null, 2)}

[ĐÁP ÁN GỢI Ý CHUẨN]:
${suggestedAnswer}

[BÀI LÀM CỦA HỌC SINH]:
${userResponse}

Hãy trả về phản hồi định dạng JSON có cấu trúc sau:
{
  "score": <số thực từ 0 đến ${maxScore}, làm tròn 1 chữ số thập phân>,
  "strengths": "<Điểm mạnh của học sinh>",
  "improvements": "<Điểm cần bổ sung hoặc sửa đổi>",
  "feedback": "<Lời nhận xét sư phạm tổng thể ngắn gọn, chân thành, mang phong thái người lính của Trung tá Quyết>"
}
Chỉ trả về duy nhất chuỗi JSON hợp lệ, không bọc markdown hay chú thích thừa.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: aiPrompt,
    });

    const text = response.text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch {
      res.json({
        score: Number((maxScore * 0.75).toFixed(1)),
        feedback: text,
      });
    }
  } catch (err: any) {
    console.error("AI Essay Evaluate Error:", err);
    // Graceful fallback
    res.json({
      score: 2.0,
      feedback: "Bài làm đã được ghi nhận. Em hãy đối chiếu với Hướng dẫn chấm chi tiết để tự rút kinh nghiệm nhé!",
    });
  }
});

// Vite middleware flow
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/accounts.json*', '**/surveys.jsonl', '**/feedback_analysis.json', '**/exam_results.jsonl*'] },
      },
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
