import React from "react";
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
  Flame,
  Award,
  Camera,
  Crosshair,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import { useGamification } from "../context/GamificationContext";

interface HomePortalSectionProps {
  onNavigate: (tab: "theory" | "quiz" | "exam" | "sim" | "chat" | "training" | "map" | "gamification" | "webar" | "shooting") => void;
}

export default function HomePortalSection({ onNavigate }: HomePortalSectionProps) {
  const { state: gamState } = useGamification();

  const totalLessons = 31;
  const readCount = gamState.lessonsRead.length;
  const progressPercent = Math.min(100, Math.round((readCount / totalLessons) * 100));

  return (
    <div className="w-full space-y-8 select-none">
      {/* ═══════════════════ HERO BANNER SECTION (ĐỎ - TRẮNG - VÀNG QUÂN ĐỘI) ═══════════════════ */}
      <div className="relative rounded-3xl bg-gradient-to-br from-red-600/10 via-amber-500/5 to-rose-600/10 dark:from-slate-900 dark:via-red-950/30 dark:to-slate-900 border border-red-200/70 dark:border-red-900/50 p-6 sm:p-8 lg:p-10 overflow-hidden shadow-xs transition-colors">
        
        {/* Background Decorative Blur Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* CỘT TRÁI: TIÊU ĐỀ & NÚT HÀNH ĐỘNG */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-extrabold border border-red-500/25">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              Nền Tảng Trải Nghiệm Số GDQP-AN THPT
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
              Học qua trải nghiệm – <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 bg-clip-text text-transparent">
                Hiểu sâu, nhớ lâu
              </span>
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-md">
              Học sinh THPT học hiệu quả hơn với mô phỏng 3D AK-47, thao trường trực quan, bài giảng SGK Kết nối tri thức, đề thi thử trắc nghiệm và Giảng viên AI luôn đồng hành.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate("theory")}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-amber-300" /> Bắt đầu học ngay
              </button>

              <button
                onClick={() => onNavigate("sim")}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-red-600 dark:text-red-400" /> Mô phỏng 3D
              </button>

              <button
                onClick={() => onNavigate("webar")}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer border border-amber-300/40"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>WebAR Đặt Bàn &amp; Sàn</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white/25 text-white rounded font-mono font-bold">Mới</span>
              </button>

              <button
                onClick={() => onNavigate("shooting")}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer border border-amber-300"
              >
                <Crosshair className="w-4 h-4 text-slate-950" />
                <span>Trường Bắn &amp; Hệ Thống Bia AK</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-slate-950 text-amber-300 rounded font-mono font-bold">Mới</span>
              </button>
            </div>
          </div>

          {/* CỘT GIỮA: CỤM NHÂN VẬT 3D */}
          <div className="lg:col-span-4 relative flex items-center justify-center min-h-[340px] sm:min-h-[380px]">
            <div className="absolute w-72 h-72 bg-gradient-to-tr from-red-500/25 via-amber-400/20 to-red-600/25 dark:from-red-950/30 dark:to-amber-950/30 blur-3xl rounded-full pointer-events-none -z-0" />

            <div className="relative w-full flex items-center justify-center">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                src="/images/hero-new.png"
                alt="Chiến Sĩ & Học Sinh GDQP 3D"
                className="w-full h-auto max-h-[400px] object-contain select-none drop-shadow-2xl"
              />
            </div>
          </div>

          {/* CỘT PHẢI: BẢNG TIẾN ĐỘ HỌC TẬP ĐỨNG */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full max-w-[260px] bg-white dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-red-100 dark:border-slate-800 shadow-xl shadow-red-600/5 dark:shadow-none flex flex-col items-center space-y-5"
            >
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 self-start flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                Tiến độ học tập
              </h3>

              <div className="relative w-28 h-28 flex items-center justify-center my-1">
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

              <div className="w-full space-y-3 pt-2 text-xs font-semibold">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-red-500" /> Bài đã học
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">{readCount}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" /> Tổng XP
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">+{gamState.xp}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Huy hiệu
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">{gamState.badges.length}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate("gamification")}
                className="w-full pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                Xem chi tiết <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

        </div>
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
    </div>
  );
}