import React, { useState } from "react";
import {
  ArrowRight,
  Minus,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGamification } from "../context/GamificationContext";

interface HomePortalSectionProps {
  onNavigate: (
    tab:
      | "theory"
      | "quiz"
      | "exam"
      | "sim"
      | "chat"
      | "training"
      | "map"
      | "gamification"
      | "webar"
      | "shooting"
      | "survey"
      | "pose"
  ) => void;
}

export default function HomePortalSection({ onNavigate }: HomePortalSectionProps) {
  const { state: gamState } = useGamification();

  const totalLessons = 31;
  const readCount = gamState.lessonsRead.length;
  const progressPercent = Math.min(100, Math.round((readCount / totalLessons) * 100));

  const [isProgressCollapsed, setIsProgressCollapsed] = useState(() => {
    try {
      return localStorage.getItem("gdqp_home_progress_collapsed") !== "false";
    } catch {
      return true;
    }
  });

  const toggleProgressCollapse = () => {
    setIsProgressCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gdqp_home_progress_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="w-full max-w-[1320px] mx-auto space-y-20 lg:space-y-24 select-none pb-12 transition-colors">
      {/* ═══════════════════ 1. HERO SECTION (FIGMA SPEC) ═══════════════════ */}
      <section className="relative rounded-[28px] sm:rounded-[32px] bg-white dark:bg-[#0B1627] border border-[#E5EAF1] dark:border-white/10 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-10 xl:gap-12 items-center relative z-10">
          {/* CỘT TRÁI: EYEBROW, HEADLINE, DESCRIPTION, 2 CTA, TRUST CHIPS */}
          <div className="space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[#E53935] dark:text-[#EA3D41] text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#E53935] dark:bg-[#EA3D41] shrink-0" />
              <span>NỀN TẢNG CHUYỂN ĐỔI SỐ GDQP-AN THPT</span>
            </div>

            {/* Headline (Figma slogan chính xác: Học qua trải nghiệm – Hiểu sâu, nhớ lâu) */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#0B1324] dark:text-white leading-[1.18] tracking-tight">
              Học qua trải nghiệm – <br />
              Hiểu sâu, nhớ lâu
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#5F6F82] dark:text-[#94A3B8] leading-relaxed max-w-xl font-normal">
              Học sinh THPT tiếp cận GDQP-AN trực quan: bài học SGK, mô phỏng tháo lắp 3D, phòng thi trắc nghiệm và trợ giảng AI đồng hành.
            </p>

            {/* 2 CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate("theory")}
                className="px-6 py-3.5 rounded-xl bg-[#E53935] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                Bắt đầu học ngay
              </button>

              <button
                type="button"
                onClick={() => onNavigate("sim")}
                className="px-5 py-3.5 rounded-xl bg-white dark:bg-[#102136] hover:bg-slate-50 dark:hover:bg-[#152e4d] active:scale-[0.98] text-[#0B1324] dark:text-white font-semibold text-sm border border-[#E5EAF1] dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                Trải nghiệm thực hành
              </button>
            </div>

            {/* 3 Trust Chips */}
            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-[#5F6F82] dark:text-[#94A3B8] border-t border-[#E5EAF1] dark:border-white/10">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Chuẩn SGK KNTT lớp 10–12</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>AI chấm điểm động tác</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Học trực tiếp trên web</span>
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: VISUAL CARD KHÔNG GIAN THỰC HÀNH SỐ */}
          <div className="relative flex items-center justify-center w-full">
            <div className="w-full rounded-2xl bg-[#F8FAFB] dark:bg-[#0B182C] p-2 border border-[#E5EAF1] dark:border-white/10 shadow-xs transition-transform duration-300 hover:scale-[1.01]">
              <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#0B1627] border border-[#E5EAF1] dark:border-white/10">
                {/* Thanh header card */}
                <div className="px-3.5 py-2.5 border-b border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs bg-white dark:bg-[#0B1627]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-[#0B1324] dark:text-white text-xs">
                      Không gian thực hành số
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#5F6F82] dark:text-[#94A3B8]">
                    THPT KNTT
                  </span>
                </div>

                {/* Vùng ảnh chính (thay placeholder Figma bằng ảnh hero chiến sĩ thực tế) */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src="/images/hero-soldier.png"
                    alt="Không gian thực hành số GDQP-AN"
                    className="w-full h-full object-cover object-center select-none"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-[#E53935]/90 text-white font-bold text-[10px] tracking-wide shadow-xs">
                      ĐIỀU LỆNH &amp; THAO TRƯỜNG
                    </span>
                    <span className="text-[10px] text-slate-200 font-medium">
                      Mô phỏng trực quan
                    </span>
                  </div>
                </div>

                {/* 3 Thống kê cốt lõi */}
                <div className="p-2 sm:p-2.5 grid grid-cols-3 gap-2 text-center text-xs bg-white dark:bg-[#0B1627]">
                  <div className="p-2 rounded-lg bg-[#F8FAFB] dark:bg-[#0B182C] border border-[#E5EAF1] dark:border-white/10">
                    <div className="font-black text-[#0B1324] dark:text-white text-sm">31</div>
                    <div className="text-[10px] text-[#5F6F82] dark:text-[#94A3B8] mt-0.5">Bài học SGK</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFB] dark:bg-[#0B182C] border border-[#E5EAF1] dark:border-white/10">
                    <div className="font-black text-[#0B1324] dark:text-white text-sm">AI + 3D</div>
                    <div className="text-[10px] text-[#5F6F82] dark:text-[#94A3B8] mt-0.5">Thực hành số</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFB] dark:bg-[#0B182C] border border-[#E5EAF1] dark:border-white/10">
                    <div className="font-black text-[#0B1324] dark:text-white text-sm">10 · 11 · 12</div>
                    <div className="text-[10px] text-[#5F6F82] dark:text-[#94A3B8] mt-0.5">3 khối THPT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. SECTION 2: 3 TRẢI NGHIỆM SỐ CỐT LÕI ═══════════════════ */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5EAF1] dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono font-bold text-[#E53935] dark:text-[#EA3D41] uppercase tracking-wider">
              TRỌNG TÂM CÔNG NGHỆ
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1324] dark:text-white mt-1.5 tracking-tight">
              3 Trải nghiệm số cốt lõi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6F82] dark:text-[#94A3B8] max-w-md leading-relaxed font-normal sm:text-right">
            Tập trung vào 3 mô hình tương tác then chốt: nhận diện động tác AI, thao tác vũ khí 3D và trường bắn ảo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: AI POSE */}
          <div
            onClick={() => onNavigate("pose")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-4">
              {/* Badge tròn góc trên */}
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
                AI
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1324] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors duration-150">
                  AI Pose – chấm điểm động tác bằng camera
                </h3>
                <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] mt-2 leading-relaxed font-normal">
                  Thực hiện động tác trước camera, AI phân tích tư thế nghiêm, báo lỗi góc nghiêng trực tiếp.
                </p>
              </div>

              {/* Inner Feature Box chuẩn Figma */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFB] dark:bg-[#0B182C] border border-[#E5EAF1] dark:border-white/5 space-y-1.5 text-xs">
                <div className="text-[#0B1324] dark:text-slate-200 font-medium">
                  33 điểm khớp chuẩn MediaPipe
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  Phản hồi tức thì qua camera
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Vào AI Pose</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* CARD 2: MÔ PHỎNG THÁO/LẮP AK-47 */}
          <div
            onClick={() => onNavigate("sim")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-4">
              {/* Badge tròn góc trên */}
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#E53935] dark:text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-200 dark:border-rose-800/40">
                3D
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1324] dark:text-white group-hover:text-[#E53935] dark:group-hover:text-rose-300 transition-colors duration-150">
                  Mô phỏng tháo/lắp AK-47
                </h3>
                <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] mt-2 leading-relaxed font-normal">
                  Quan sát cấu tạo, tương tác 7 bước tháo lắp trong không gian 3D trực quan, thực hành tự do.
                </p>
              </div>

              {/* Inner Feature Box chuẩn Figma */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFB] dark:bg-[#0B182C] border border-[#E5EAF1] dark:border-white/5 space-y-1.5 text-xs">
                <div className="text-[#0B1324] dark:text-slate-200 font-medium">
                  Xoay 360° từng chi tiết cơ khí
                </div>
                <div className="text-[#E53935] dark:text-rose-400 font-semibold text-[11px]">
                  Đúng quy trình điều lệnh quân đội
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#E53935] dark:text-rose-400">
              <span>Vào phòng mô phỏng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* CARD 3: TRƯỜNG BẮN ẢO */}
          <div
            onClick={() => onNavigate("shooting")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-4">
              {/* Badge tròn góc trên */}
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-200 dark:border-amber-800/40">
                AK
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1324] dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors duration-150">
                  Trường bắn ảo &amp; hệ thống bia
                </h3>
                <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] mt-2 leading-relaxed font-normal">
                  Luyện ngắm bắn với hệ thống bia 4, 6, 8, đồng tiền, đo đạn đạo và chấm điểm tự động.
                </p>
              </div>

              {/* Inner Feature Box chuẩn Figma */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFB] dark:bg-[#0B182C] border border-[#E5EAF1] dark:border-white/5 space-y-1.5 text-xs">
                <div className="text-[#0B1324] dark:text-slate-200 font-medium">
                  Mô phỏng đạn đạo &amp; độ giật cơ học
                </div>
                <div className="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                  Tự động tính điểm &amp; xếp loại xạ thủ
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Khám phá trường bắn</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 3. SECTION 3: KHÔNG GIAN TƯƠNG TÁC SỐ ═══════════════════ */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5EAF1] dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono font-bold text-[#E53935] dark:text-[#EA3D41] uppercase tracking-wider">
              TRẢI NGHIỆM MỞ RỘNG
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1324] dark:text-white mt-1.5 tracking-tight">
              Không gian tương tác số
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6F82] dark:text-[#94A3B8] max-w-md leading-relaxed font-normal sm:text-right">
            Mở rộng trải nghiệm học tập bằng AR và không gian thực tế ảo 360°.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: WEBAR */}
          <div
            onClick={() => onNavigate("webar")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#E53935] dark:text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-200 dark:border-rose-800/40">
                  AR
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-[#E53935] dark:text-rose-300 font-mono font-bold text-[10px] uppercase border border-rose-200 dark:border-rose-500/20">
                  ★ AR
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0B1324] dark:text-white group-hover:text-[#E53935] dark:group-hover:text-rose-300 transition-colors duration-150">
                  WebAR – đưa mô hình vào không gian thật
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6F82] dark:text-[#94A3B8] mt-2 leading-relaxed font-normal">
                  Dùng camera điện thoại đưa mô hình súng AK hoặc bài tập vào không gian thật, không cần cài app.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#E53935] dark:text-rose-400">
              <span>Khám phá WebAR</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* CARD 2: DI TÍCH 360° VR */}
          <div
            onClick={() => onNavigate("map")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800/40">
                  360
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px] uppercase border border-blue-200 dark:border-blue-500/20">
                  ★ 360
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0B1324] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-150">
                  Di tích lịch sử 360° &amp; bản đồ số
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6F82] dark:text-[#94A3B8] mt-2 leading-relaxed font-normal">
                  Khám phá không gian bảo tàng, di tích lịch sử qua hình ảnh 360° sống động và bản đồ số trực quan.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Tham quan di tích</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. SECTION 4: KHÁM PHÁ HỌC PHẦN TRỰC QUAN ═══════════════════ */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5EAF1] dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono font-bold text-[#E53935] dark:text-[#EA3D41] uppercase tracking-wider">
              CHƯƠNG TRÌNH HỌC TẬP
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1324] dark:text-white mt-1.5 tracking-tight">
              Khám phá học phần trực quan
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6F82] dark:text-[#94A3B8] max-w-md leading-relaxed font-normal sm:text-right">
            Hệ thống bài giảng, câu hỏi trắc nghiệm và trợ lý ảo hỗ trợ học tập toàn diện.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CARD 1: VIDEO BÀI GIẢNG */}
          <div
            onClick={() => onNavigate("theory")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#E53935] dark:text-rose-400 font-mono font-bold text-[10px] uppercase border border-rose-200 dark:border-rose-800/40">
                VIDEO
              </span>
              <h3 className="text-base font-bold text-[#0B1324] dark:text-white group-hover:text-[#E53935] dark:group-hover:text-rose-400 transition-colors duration-150">
                Video bài giảng SGK
              </h3>
              <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] leading-relaxed font-normal">
                Xem bài giảng lý thuyết ngắn gọn, bám sát sách giáo khoa Kết nối tri thức.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#E53935] dark:text-rose-400">
              <span>Vào học</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* CARD 2: THI THỬ & TRẮC NGHIỆM */}
          <div
            onClick={() => onNavigate("exam")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-mono font-bold text-[10px] uppercase border border-amber-200 dark:border-amber-800/40">
                QUIZ
              </span>
              <h3 className="text-base font-bold text-[#0B1324] dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors duration-150">
                Thi thử &amp; trắc nghiệm
              </h3>
              <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] leading-relaxed font-normal">
                Luyện đề trắc nghiệm tính giờ, ngân hàng câu hỏi đa dạng theo từng khối lớp.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Vào thi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* CARD 3: GIÁO VIÊN AI ĐỒNG HÀNH */}
          <div
            onClick={() => onNavigate("chat")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono font-bold text-[10px] uppercase border border-blue-200 dark:border-blue-800/40">
                AI
              </span>
              <h3 className="text-base font-bold text-[#0B1324] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-150">
                Giáo viên AI đồng hành
              </h3>
              <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] leading-relaxed font-normal">
                Hỏi đáp thắc mắc bài học và nhận giải thích chi tiết từ trợ lý ảo 24/7.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Hỏi ngay</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>

          {/* CARD 4: KHẢO SÁT NCKH */}
          <div
            onClick={() => onNavigate("survey")}
            className="group rounded-[22px] bg-white dark:bg-[#102136] hover:bg-[#F8FAFB] dark:hover:bg-[#132842] border border-[#E5EAF1] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <div className="space-y-3.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-200 dark:border-emerald-800/40">
                SURVEY
              </span>
              <h3 className="text-base font-bold text-[#0B1324] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-150">
                Khảo sát NCKH
              </h3>
              <p className="text-xs text-[#5F6F82] dark:text-[#94A3B8] leading-relaxed font-normal">
                Đánh giá trải nghiệm học tập và đóng góp ý kiến cải thiện nền tảng.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF1] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Khảo sát</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 6. FLOATING PROGRESS WIDGET ═══════════════════ */}
      <div className="hidden sm:block fixed bottom-24 right-4 sm:right-6 z-40">
        <AnimatePresence mode="wait">
          {isProgressCollapsed ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={toggleProgressCollapse}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-[#102136]/95 backdrop-blur-md border border-[#E5EAF1] dark:border-white/10 shadow-md hover:shadow-lg text-[#0B1324] dark:text-white cursor-pointer hover:border-red-500/50 transition-all duration-200 group"
              title="Nhấn để mở rộng Bảng tiến độ học tập"
            >
              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#E53935] stroke-current transition-all duration-500"
                    strokeWidth="4"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[8px] font-black text-[#0B1324] dark:text-white font-mono">
                  {progressPercent}%
                </span>
              </div>

              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-[#0B1324] dark:text-white group-hover:text-[#E53935] transition-colors duration-150">
                  Tiến độ học tập
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                  +{gamState.xp} XP
                </span>
              </div>

              <div className="w-5 h-5 rounded-lg bg-[#F8FAFB] dark:bg-[#0B182C] text-[#5F6F82] dark:text-[#94A3B8] flex items-center justify-center group-hover:text-[#E53935] transition-colors duration-150 shrink-0 ml-1">
                <ChevronLeft className="w-3 h-3" />
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-[250px] bg-white/95 dark:bg-[#102136]/95 backdrop-blur-md p-4 rounded-2xl border border-[#E5EAF1] dark:border-white/10 shadow-xl text-[#0B1324] dark:text-white flex flex-col items-center space-y-3"
            >
              <div className="w-full flex items-center justify-between pb-2 border-b border-[#E5EAF1] dark:border-white/10">
                <h3 className="text-xs font-bold text-[#0B1324] dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]" />
                  Tiến độ học tập
                </h3>
                <button
                  onClick={toggleProgressCollapse}
                  className="p-1 rounded-lg text-[#5F6F82] dark:text-[#94A3B8] hover:text-[#0B1324] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer"
                  title="Thu nhỏ bảng"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative w-18 h-18 flex items-center justify-center my-0.5">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#E53935] stroke-current transition-all duration-500 ease-out"
                    strokeWidth="3.2"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-black text-base text-[#0B1324] dark:text-white font-mono leading-none">
                    {progressPercent}%
                  </span>
                  <span className="text-[9px] text-[#5F6F82] dark:text-[#94A3B8] font-medium mt-0.5">
                    Hoàn thành
                  </span>
                </div>
              </div>

              <div className="w-full space-y-1.5 pt-1 text-xs">
                <div className="flex items-center justify-between text-[#5F6F82] dark:text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3 h-3 text-[#E53935]" /> Đã học
                  </span>
                  <span className="font-bold text-[#0B1324] dark:text-white font-mono">
                    {readCount} / {totalLessons}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#5F6F82] dark:text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Flame className="w-3 h-3 text-amber-500" /> Điểm XP
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">+{gamState.xp}</span>
                </div>

                <div className="flex items-center justify-between text-[#5F6F82] dark:text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="w-3 h-3 text-amber-500" /> Huy hiệu
                  </span>
                  <span className="font-bold text-[#0B1324] dark:text-white font-mono">{gamState.badges.length}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("gamification")}
                className="w-full pt-2 border-t border-[#E5EAF1] dark:border-white/10 text-[11px] font-bold text-[#E53935] hover:text-red-700 dark:hover:text-red-400 flex items-center justify-center gap-1 cursor-pointer transition-colors duration-150"
              >
                <span>Xem bảng danh vọng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
