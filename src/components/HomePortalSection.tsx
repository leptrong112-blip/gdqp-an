import React, { useState } from "react";
import {
  BookOpen,
  Trophy,
  Wrench,
  Bot,
  ArrowRight,
  Sparkles,
  Compass,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
  Camera,
  Crosshair,
  Target,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGamification } from "../context/GamificationContext";

interface HomePortalSectionProps {
  onNavigate: (tab: "theory" | "quiz" | "exam" | "sim" | "chat" | "training" | "map" | "gamification" | "webar" | "shooting" | "survey" | "pose") => void;
}

export default function HomePortalSection({ onNavigate }: HomePortalSectionProps) {
  const { state: gamState } = useGamification();

  const totalLessons = 31;
  const readCount = gamState.lessonsRead.length;
  const progressPercent = Math.min(100, Math.round((readCount / totalLessons) * 100));

  const [isProgressCollapsed, setIsProgressCollapsed] = useState(() => {
    try {
      return localStorage.getItem("gdqp_home_progress_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleProgressCollapse = () => {
    setIsProgressCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("gdqp_home_progress_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="w-full space-y-5 sm:space-y-8 select-none">
      
      {/* ═══════════════════ HERO BANNER SECTION (ĐỎ - TRẮNG - VÀNG QUÂN ĐỘI) ═══════════════════ */}
      <div className="relative rounded-3xl bg-gradient-to-br from-red-600/10 via-amber-500/5 to-rose-600/10 dark:from-slate-900 dark:via-red-950/30 dark:to-slate-900 border border-red-200/70 dark:border-red-900/50 p-4 sm:p-8 lg:p-10 overflow-hidden shadow-xs transition-colors">
        
        {/* Background Decorative Blur Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
          
          {/* CỘT TRÁI: TIÊU ĐỀ & NÚT HÀNH ĐỘNG */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[11px] sm:text-xs font-extrabold border border-red-500/25">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              Nền Tảng Trải Nghiệm Số GDQP-AN THPT
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
              Học qua trải nghiệm – <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 bg-clip-text text-transparent">
                Hiểu sâu, nhớ lâu
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-lg">
              Học sinh THPT học hiệu quả hơn với mô phỏng 3D AK-47, thao trường trực quan, bài giảng SGK Kết nối tri thức, đề thi thử trắc nghiệm và Giảng viên AI luôn đồng hành.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => onNavigate("theory")}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-amber-300" /> Bắt đầu học ngay
              </button>

              <button
                onClick={() => onNavigate("sim")}
                className="flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-red-600 dark:text-red-400" /> Mô phỏng 3D
              </button>

              <button
                onClick={() => onNavigate("shooting")}
                className="flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer border border-amber-300"
              >
                <Crosshair className="w-4 h-4 text-slate-950" />
                <span>Trường Bắn AK</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: BANNER CHIẾN SĨ & CÔNG NGHỆ SỐ GDQP-AN ĐẦY ĐỦ 16:9 */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="absolute w-full h-full bg-gradient-to-tr from-red-500/20 via-amber-400/15 to-red-600/20 dark:from-red-950/40 dark:to-amber-950/40 blur-3xl rounded-full pointer-events-none -z-0" />

            <div className="relative w-full flex items-center justify-center p-1 sm:p-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full overflow-hidden rounded-3xl border-2 border-white/80 dark:border-slate-700/80 shadow-2xl shadow-red-950/20 hover:scale-[1.01] transition-transform duration-300 bg-slate-950/10"
              >
                <img
                  src="/images/hero-soldier.png"
                  alt="Chiến Sĩ Trải Nghiệm Số GDQP-AN"
                  className="w-full h-auto object-cover rounded-3xl select-none"
                />
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════ TÍNH NĂNG ĐẶC BIỆT: AI POSE & KHẢO SÁT (2 CỘT GỌN GÀNG) ═══════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: AI Pose */}
        <button
          onClick={() => onNavigate('pose')}
          className="group relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-900 text-white border border-emerald-600/40 p-4 sm:p-5 flex items-center justify-between gap-3 text-left shadow-md hover:border-emerald-500 transition-all hover:scale-[1.01] cursor-pointer overflow-hidden"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider">Mới · AI Pose Analysis</span>
            </div>
            <h2 className="text-sm sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors truncate">
              Chấm điểm động tác bằng camera
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 line-clamp-1">
              Luyện đứng nghiêm, xem khung xương và nhận góp ý trực tiếp.
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

        {/* Card 2: Khảo sát ý kiến */}
        <button
          onClick={() => onNavigate('survey')}
          className="group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-amber-300/80 dark:border-amber-700/50 p-4 sm:p-5 flex items-center justify-between gap-3 text-left shadow-md hover:border-amber-500 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Khảo sát NCKH</span>
            </div>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-amber-400 transition-colors truncate">
              Đóng góp ý kiến trải nghiệm
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              Khảo sát trước &amp; sau trải nghiệm dành cho học sinh, giáo viên.
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>
      </div>

      {/* ═══════════════════ WEBAR HIGHLIGHT BANNER (KHUYẾN NGHỊ TỪ THẦY GIÁO) ═══════════════════ */}
      <motion.div
        whileHover={{ scale: 1.006 }}
        onClick={() => onNavigate("webar")}
        className="relative rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 sm:p-7 text-white shadow-xl shadow-red-600/20 cursor-pointer overflow-hidden group border border-amber-300/30"
      >
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase font-mono tracking-wider">
                  Đột Phá WebAR Mới
                </span>
                <span className="text-white/80 text-xs font-semibold">Khuyến nghị từ Thầy giáo &amp; Cố vấn</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mt-1 text-white">
                Trải Nghiệm WebAR: Đặt Súng AK-47 Lên Bàn &amp; Chiếu Chiến Sĩ Lên Sàn Nhà
              </h3>
              <p className="text-xs text-white/90 mt-1 max-w-2xl font-sans">
                Không cần cài app! Mở camera thiết bị để soi cấu tạo từng chi tiết súng AK, quan sát tư thế bò/đi khom ngay trong phòng học và ngắm hiện vật bảo tàng lịch sử.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="px-4 py-2.5 rounded-2xl bg-white text-red-600 font-extrabold text-xs shadow-md group-hover:bg-amber-300 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <span>Trải nghiệm ngay</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════ SHOOTING RANGE & TARGET SYSTEM BANNER (ĐỀ XUẤT TỪ THẦY GIÁO) ═══════════════════ */}
      <motion.div
        whileHover={{ scale: 1.006 }}
        onClick={() => onNavigate("shooting")}
        className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-[#1b2a4a] to-slate-900 p-6 sm:p-7 text-white shadow-xl shadow-slate-900/20 cursor-pointer overflow-hidden group border border-amber-400/40"
      >
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 backdrop-blur-md border border-amber-400/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Crosshair className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase font-mono tracking-wider">
                  Mới Ra Mắt
                </span>
                <span className="text-amber-300 text-xs font-semibold">Theo đề xuất chuẩn Sư phạm &amp; SGK GDQP</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mt-1 text-white">
                Trường Bắn Ảo &amp; Hệ Thống Bia AK: Nằm Bia 4, Quỳ Bia 6, Đứng Bia 8, Bia Đồng Tiền 10m
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl font-sans">
                Tập bắn mục tiêu cố định 10m có tính điểm, ngắm bắn bài 1 (100m bia 4), nín thở bóp cò có độ giật, âm thanh súng AK thực tế, báo bia tự động và tổng kết xếp loại Xạ thủ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-md group-hover:bg-amber-300 transition-colors flex items-center gap-1.5">
              <span>Vào trường bắn</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════ 4 FEATURE SHOWCASE CARDS (SẮC ĐỎ - VÀNG QUÂN ĐỘI) ═══════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400" /> Khám Phá Học Phần Trực Quan
          </h2>
          <span className="text-xs text-slate-400 font-medium">Chương trình SGK THPT hiện hành</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* THẺ 1: Video bài giảng (Đỏ cờ) */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => onNavigate("theory")}
            className="p-6 rounded-3xl bg-gradient-to-br from-red-500/10 via-rose-500/5 to-red-500/10 dark:from-red-950/40 dark:to-slate-900 border border-red-200/70 dark:border-red-900/60 shadow-xs flex flex-col justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  Video bài giảng
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">
                  Lý thuyết chuẩn SGK GDQP-AN Kết nối tri thức Lớp 10, 11 và 12.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-red-200/50 dark:border-red-900/40">
              <span className="text-[11px] font-bold text-red-700 dark:text-red-400">
                31 bài học cốt lõi
              </span>
              <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs group-hover:bg-red-600 group-hover:text-white transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

          {/* THẺ 2: Trò chơi tương tác (Vàng ánh kim huân chương) */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => onNavigate("exam")}
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200/70 dark:border-amber-900/60 shadow-xs flex flex-col justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Trò chơi tương tác
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">
                  Ôn tập trắc nghiệm & Phòng thi thử đếm giờ tính điểm XP rank.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-200/50 dark:border-amber-900/40">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Ôn thi THPT & SGK
              </span>
              <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:bg-amber-600 group-hover:text-white transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

          {/* THẺ 3: Phòng trải nghiệm 3D (Đỏ son quân giới) */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => onNavigate("sim")}
            className="p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-red-500/5 to-rose-500/10 dark:from-rose-950/40 dark:to-slate-900 border border-rose-200/70 dark:border-rose-900/60 shadow-xs flex flex-col justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Phòng trải nghiệm 3D
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">
                  Mô phỏng tháo/lắp súng AK-47 & Đội ngũ thao trường 3D.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-rose-200/50 dark:border-rose-900/40">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                Interactive 3D Stage
              </span>
              <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs group-hover:bg-rose-600 group-hover:text-white transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

          {/* THẺ 4: Giáo viên AI (Vàng cam sao vàng) */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => onNavigate("chat")}
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200/70 dark:border-amber-900/60 shadow-xs flex flex-col justify-between cursor-pointer group transition-all"
          >
            <div className="space-y-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Giáo viên AI
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">
                  Hỏi đáp trực tiếp Trung tá Nguyễn Văn Quyết & Khám phá Bản đồ di tích.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-200/50 dark:border-amber-900/40">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Gemini AI Tutor
              </span>
              <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:bg-amber-600 group-hover:text-white transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ═══════════════════ BẢNG TIẾN ĐỘ HỌC TẬP NỔI ĐI THEO (CHỈ HIỆN Ở TRANG CHỦ TRÊN DESKTOP) ═══════════════════ */}
      <div className="hidden sm:block fixed bottom-24 right-4 sm:right-6 z-40">
        <AnimatePresence mode="wait">
          {isProgressCollapsed ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={toggleProgressCollapse}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-red-500/40 dark:border-red-500/30 shadow-2xl shadow-red-950/20 text-slate-800 dark:text-white cursor-pointer hover:border-red-600 hover:scale-105 hover:shadow-red-500/20 transition-all group"
              title="Nhấn để mở rộng Bảng tiến độ học tập"
            >
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-600 dark:text-red-500 stroke-current transition-all duration-500"
                    strokeWidth="4"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-slate-900 dark:text-white font-mono">
                  {progressPercent}%
                </span>
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    Tiến độ học tập
                  </span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono">
                  +{gamState.xp} XP · {gamState.badges.length} huy hiệu
                </span>
              </div>

              <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0 ml-1">
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25 }}
              className="w-[270px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl border-2 border-red-500/30 dark:border-slate-700 shadow-2xl shadow-red-950/25 flex flex-col items-center space-y-4"
            >
              <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  Tiến độ học tập
                </h3>
                <button
                  onClick={toggleProgressCollapse}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Thu nhỏ bảng"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative w-24 h-24 flex items-center justify-center my-0.5">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-600 dark:text-red-500 stroke-current transition-all duration-1000 ease-out"
                    strokeWidth="3.2"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-black text-xl text-slate-900 dark:text-white font-mono leading-none">
                    {progressPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    Hoàn thành
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2.5 pt-1 text-xs font-semibold">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-red-500" /> Bài đã học
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {readCount} / {totalLessons}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Tổng XP
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">+{gamState.xp}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Huy hiệu
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">{gamState.badges.length}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate("gamification")}
                className="w-full pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
