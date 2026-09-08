import React from "react";
import {
  Shield,
  GraduationCap,
  School,
  Mail,
  MapPin,
  Sparkles,
  Users,
  Target,
  Camera,
  BookOpen,
  Bot,
  Compass,
} from "lucide-react";

interface FooterProps {
  onNavigate?: (tab: "home" | "theory" | "quiz" | "exam" | "sim" | "chat" | "training" | "map" | "gamification" | "webar" | "shooting") => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNav = (tab: "home" | "theory" | "quiz" | "exam" | "sim" | "chat" | "training" | "map" | "gamification" | "webar" | "shooting") => {
    if (onNavigate) {
      onNavigate(tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-slate-950 text-slate-300 border-t border-slate-800 select-none relative z-20 transition-colors">
      {/* ════════════ DẢI TRANG TRÍ MÀU CỜ ĐỎ SAO VÀNG QUÂN ĐỘI Ở ĐỈNH FOOTER ════════════ */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-yellow-400 to-red-600 shadow-sm" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16 space-y-12">
        
        {/* ════════════ KHỐI NỘI DUNG CHÍNH (4 CỘT LỚN) ════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* CỘT 1 (4 COLS): THƯƠNG HIỆU & GIỚI THIỆU DỰ ÁN */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-amber-300 font-black text-xl flex items-center justify-center shadow-lg border border-amber-400/40">
                ★
              </div>
              <div>
                <div className="font-black text-lg text-white tracking-tight flex items-center gap-2">
                  HỌC QPAN <span className="text-amber-400 text-xs px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30">3D</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Nền Tảng Trải Nghiệm Số GDQP-AN THPT</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Dự án nghiên cứu &amp; chuyển đổi số giáo dục môn Giáo dục Quốc phòng và An ninh dành cho học sinh THPT. Tích hợp mô phỏng 3D AK-47, thao trường trực quan, thực tế tăng cường WebAR, trường bắn ảo và Trợ lý AI đồng hành.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-red-300 text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                Chuẩn SGK Bộ GD&amp;ĐT
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-700/50 text-amber-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sáng tạo KHKT THPT
              </span>
            </div>
          </div>

          {/* CỘT 2 (3 COLS): BẢN QUYỀN & TÁC GIẢ THỰC HIỆN */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
              <Users className="w-4 h-4 text-red-500" />
              <span>Tác Giả &amp; Bản Quyền</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Nhóm Tác Giả Học Sinh:
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Lê Trọng Phúc</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 font-black">
                      Lớp 12C3
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Nguyễn Chí Toàn</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 font-black">
                      Lớp 12C7
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Đơn Vị Học Tập:
                </span>
                <div className="flex items-start gap-2 text-slate-200 font-bold">
                  <School className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-black text-xs leading-snug">
                      Trường TH - THCS - THPT Tân Phú
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Tập đoàn Giáo dục IGC • TP. Hồ Chí Minh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 3 (3 COLS): THÔNG TIN LIÊN HỆ & CỐ VẤN */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Thông Tin Liên Hệ</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>Trường TH-THCS-THPT Tân Phú, Quận Tân Phú, TP. Hồ Chí Minh</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a
                  href="mailto:letrongphuc.12c3.tanphu@gmail.com"
                  className="hover:text-amber-300 transition-colors font-mono text-[11px]"
                >
                  letrongphuc.12c3.tanphu@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-mono text-[11px]">hotro.hocqpan@gmail.com</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Giáo viên hướng dẫn:</strong> Thầy giáo bộ môn Giáo dục Quốc phòng &amp; An ninh - Tổ Tin học Trường TH-THCS-THPT Tân Phú.
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 4 (2 COLS): LỐI TẮT TÍNH NĂNG */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Phân Hệ 3D</span>
            </div>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleNav("shooting")}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trường bắn AK</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("webar")}
                  className="hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Camera className="w-3.5 h-3.5 text-red-400" />
                  <span>WebAR 3D</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("sim")}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tháo lắp súng AK</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("training")}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Thao trường 3D</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("theory")}
                  className="hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lý thuyết SGK</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("chat")}
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>Giảng viên AI</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* ════════════ DÒNG BẢN QUYỀN DƯỚI CÙNG (COPYRIGHT BAR) ════════════ */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <div className="text-center sm:text-left space-y-1">
            <div className="text-slate-300 font-bold">
              © 2026 Bản quyền thuộc về <strong className="text-white">Lê Trọng Phúc (12C3)</strong> &amp; <strong className="text-white">Nguyễn Chí Toàn (12C7)</strong> – Trường TH-THCS-THPT Tân Phú.
            </div>
            <div className="text-[11px] text-slate-500">
              Sản phẩm học tập số phi thương mại phục vụ đổi mới dạy và học môn Giáo dục Quốc phòng &amp; An ninh THPT.
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono font-semibold text-slate-400">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">Phiên bản v2.5.0</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">TP. Hồ Chí Minh</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
