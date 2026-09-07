import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Tv, Send, Bot, User, ShieldCheck, AlertCircle } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Bao nhiêu tuổi thì được tham gia Nghĩa vụ quân sự?",
  "Hãy nêu tính năng chiến đấu nâng cao của súng AK-47?",
  "Băng bó vết thương dã chiến cần lưu ý gì?",
  "Học sinh có trách nhiệm gì đối với bảo vệ chủ quyền biên giới quốc gia?"
];

export default function AiBotSection() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("gqd_chat_history");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "assistant",
            content: "Chào em học sinh thân mến! Tôi là Trung tá Nguyễn Văn Quyết, giảng viên ảo môn Giáo dục Quốc phòng và An ninh (GDQPAN). Em có câu hỏi, thắc mắc gì về bài giảng lý thuyết quân sự, kỹ thuật tháo lắp súng AK, luật nghĩa vụ hay các kỹ năng sơ cứu sinh tồn không? Hãy đặt câu hỏi, tôi luôn ở đây để huấn luyện và chia sẻ giáo trình giúp em tự tin bắn phá điểm cao!",
            timestamp: new Date().toLocaleTimeString()
          }
        ];
  });
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("gqd_chat_history", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorText(null);
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10)
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi đường truyền hoặc máy chủ Gemini tạm thời gián đoạn.");
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "Tôi không nghe rõ tín hiệu vô tuyến từ phía em. Em hãy đặt lại thắc mắc được không?",
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Không thể kết nối vô tuyến đến tổng đài giảng huấn.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "Đã làm sạch đường truyền vô tuyến liên lạc. Em có câu hỏi mới nào cần Trung tá Nguyễn Văn Quyết tư vấn không nào?",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div id="aibot-section-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Cột trái: Gợi ý câu hỏi & Tiêu chí tư vấn học thuật */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-xs transition-colors">
          <div className="pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Giảng Viên Ảo GDQPAN</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Gặp gỡ <strong className="text-slate-800 dark:text-slate-200">Trung tá Nguyễn Văn Quyết</strong> để thảo luận mọi chủ đề từ chính trị an ninh học đường, luật phục vụ Tổ quốc hay kĩ thuật thực hành ngắm bắn và hành quân dã chiến dã ngoại của cấp THPT.
          </p>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 pl-1">
              Câu hỏi tham khảo nhanh:
            </span>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  id={`suggested-question-btn-${idx}`}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="w-full p-3 text-left text-xs bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 rounded-xl transition-all leading-relaxed font-sans cursor-pointer disabled:opacity-50"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cảnh báo hành chính quốc phòng */}
        <div className="bg-emerald-50/40 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 font-sans transition-colors">
          <h4 className="text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bản quyền giáo vụ học thuật
          </h4>
          <p className="leading-relaxed">
            Hệ thống huấn luyện sử dụng hạt nhân kỹ thuật số thông minh <strong className="text-emerald-700 dark:text-emerald-300">Gemini</strong> biên tập thông tin tức thời theo chương trình SGK GDQPAN Việt Nam hiện hành. Hãy đặt các truy vấn lịch sự, chính xác và lành mạnh.
          </p>
        </div>
      </div>

      {/* Cột phải: Khu vực khung chat */}
      <div className="lg:col-span-8 flex flex-col h-[580px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        
        {/* Header khung chat */}
        <div className="px-5 py-4.5 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-white">Trung tá Nguyễn Văn Quyết</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Đang trực tuyến giảng bài
              </div>
            </div>
          </div>

          <button
            id="clear-chat-btn"
            onClick={handleClearHistory}
            className="px-3 py-1.5 text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer font-bold uppercase tracking-wider"
          >
            Làm mới hội thoại
          </button>
        </div>

        {/* Nội dung tin nhắn chat */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0 bg-slate-50/20 dark:bg-slate-950/20" style={{ contentVisibility: "auto" }}>
          {messages.map((msg, index) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isBot ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Tin nhắn */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl leading-relaxed text-xs text-justify font-sans whitespace-pre-line shadow-2xs ${
                    isBot
                      ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none"
                      : "bg-emerald-700 dark:bg-emerald-600 text-white rounded-tr-none"
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`text-[9px] text-slate-400 font-mono ${!isBot ? "text-right" : ""}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Trạng thái load tin nhắn từ server */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 rounded-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              Trung tá Nguyễn Văn Quyết đang đối chiếu giáo trình và trả lời...
            </div>
          )}

          {errorText && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorText}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Khung nhập tin nhắn */}
        <div className="p-4 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="aibot-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi Trung tá Quyết về súng AK, luật NVQS, truyền thống quân đội..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 font-sans transition-colors"
            />
            <button
              type="submit"
              id="aibot-send-btn"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
