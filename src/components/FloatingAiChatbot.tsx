import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  User,
  AlertCircle
} from "lucide-react";
import { ChatMessage } from "../types";

const SUGGESTED_QUESTIONS = [
  "Bao nhiêu tuổi thì tham gia NVQS?",
  "Tính năng chiến đấu của súng AK-47?",
  "Các tư thế bắn súng tiểu liên AK?",
  "Nguyên tắc băng bó garo dã chiến?"
];

export default function FloatingAiChatbot() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("gqd_floating_chat_history");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "assistant",
            content:
              "Chào em học sinh thân mến! Tôi là Trung tá Nguyễn Văn Quyết, giảng viên ảo môn Giáo dục Quốc phòng và An ninh (GDQP-AN). Em đang gặp thắc mắc gì về lý thuyết, kỹ thuật bắn súng AK hay bài thi trắc nghiệm không? Cứ hỏi tôi nhé!",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ];
  });
  const [inputVal, setInputVal] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem("gqd_floating_chat_history", JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setErrorText(null);
    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8)
        })
      });

      if (!response.ok) {
        throw new Error("Máy chủ trợ giảng tạm thời gián đoạn.");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "Tôi chưa nghe rõ tín hiệu của em, em hỏi lại giúp tôi nhé!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setErrorText(err.message || "Không thể kết nối đến Trung tá Quyết AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const fresh: ChatMessage[] = [
      {
        role: "assistant",
        content: "Đã làm mới cuộc trò chuyện. Em có câu hỏi mới nào cần Trung tá Quyết giải đáp không?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
    setMessages(fresh);
    localStorage.setItem("gqd_floating_chat_history", JSON.stringify(fresh));
  };

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON IN BOTTOM-RIGHT CORNER ── */}
      {/* ── FLOATING TRIGGER BUTTON IN BOTTOM-RIGHT CORNER ── */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 sm:gap-3">
          {/* Tooltip badge */}
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-black/90 text-white text-xs font-bold shadow-xl border border-red-500/30 backdrop-blur-md cursor-pointer hover:border-red-400 transition-all hover:scale-105 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-200 group-hover:text-amber-300 transition-colors">
              Hỏi trợ giảng AI
            </span>
          </div>

          {/* Main Floating Avatar Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-amber-500 text-white shadow-2xl shadow-red-600/40 border-2 border-amber-300 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group"
            title="Mở trợ lý học tập Trung tá Nguyễn Văn Quyết AI"
            aria-label="Hỏi trợ giảng AI"
          >
            {/* Glow pulse ring */}
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 pointer-events-none" />

            <div className="relative text-xl sm:text-2xl group-hover:rotate-12 transition-transform">
              🎖️
            </div>

            {/* Online status indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
          </button>
        </div>
      )}

      {/* ── EXPANDED FLOATING CHAT WINDOW ── */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[410px] h-[520px] sm:h-[560px] max-h-[82vh] bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-red-500/30 dark:border-red-500/20 flex flex-col overflow-hidden backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* HEADER */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-bold shadow-md shrink-0 border border-amber-200">
                🎖️
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-red-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-extrabold truncate text-white leading-tight">
                    Trung tá Quyết AI
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-200 text-[9px] font-bold border border-amber-300/30">
                    GDQP-AN
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/90 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trợ giảng trực tuyến 24/7</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Làm mới hội thoại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Thu nhỏ cửa sổ trò chuyện"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                      isUser
                        ? "bg-slate-800 text-white dark:bg-slate-700"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <span>🎖️</span>}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-xs leading-relaxed font-sans ${
                      isUser
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isUser ? "text-red-200" : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading typing bubble */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center text-xs shrink-0">
                  🎖️
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 ml-1">Trung tá Quyết đang soạn...</span>
                </div>
              </div>
            )}

            {/* Error message */}
            {errorText && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorText}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK SUGGESTIONS CHIPS */}
          <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Gợi ý:
              </span>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-300 border border-slate-200 dark:border-slate-700 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="p-3 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Đặt câu hỏi GDQP-AN với Trung tá Quyết..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-600/30 cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
