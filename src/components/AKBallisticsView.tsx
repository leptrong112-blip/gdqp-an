import React, { useState } from "react";
import {
  TrendingUp,
  Target,
  Crosshair,
  Zap,
  Info,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Compass,
} from "lucide-react";
import { AK_BALLISTICS_DATA, BallisticsPoint } from "../data/akShootingData";

export default function AKBallisticsView() {
  const [selectedSight, setSelectedSight] = useState<1 | 3 | 4 | 5>(3);
  const [activeDistance, setActiveDistance] = useState<number>(100);

  const selectedPoint =
    AK_BALLISTICS_DATA.find((p) => p.distanceMeters === activeDistance) ||
    AK_BALLISTICS_DATA[0];

  // Helper để lấy độ cao theo thước ngắm đã chọn
  const getHeightForSight = (p: BallisticsPoint, sight: 1 | 3 | 4 | 5) => {
    switch (sight) {
      case 1:
        return p.heightWithSight1Cm;
      case 3:
        return p.heightWithSight3Cm;
      case 4:
        return p.heightWithSight4Cm;
      case 5:
        return p.heightWithSight5Cm;
      default:
        return p.heightWithSight3Cm;
    }
  };

  // Tọa độ biểu đồ SVG
  // Cự ly: 0m -> 500m tương ứng x: 80 -> 740
  // Độ cao: +150cm (y: 40) đến -420cm (y: 280)
  const mapX = (meters: number) => 80 + (meters / 500) * 660;
  const mapY = (heightCm: number) => {
    // 0cm nằm ở y: 100
    // +150cm nằm ở y: 40 (slope: -60/150 = -0.4)
    // -400cm nằm ở y: 270 (slope: 170/400 = 0.425)
    if (heightCm >= 0) {
      return 100 - (heightCm / 150) * 60;
    } else {
      return 100 + (Math.abs(heightCm) / 400) * 170;
    }
  };

  // Tạo chuỗi đường cong Path SVG
  const pathPoints = [
    { distanceMeters: 0, h: -3 }, // Đạn xuất phát từ miệng nòng dưới đường ngắm ~3cm
    ...AK_BALLISTICS_DATA.map((p) => ({
      distanceMeters: p.distanceMeters,
      h: getHeightForSight(p, selectedSight),
    })),
  ];

  const pathD = pathPoints.reduce((acc, pt, idx) => {
    const x = mapX(pt.distanceMeters);
    const y = mapY(pt.h);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ═══════════════ HEADER BANNER ═══════════════ */}
      <div className="bg-gradient-to-r from-red-900/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black border border-red-400/30">
              <TrendingUp className="w-3.5 h-3.5 text-red-400" />
              CHUẨN BẢNG BẮN QUÂN SỰ CHÍNH QUY (GDQP-AN &amp; QĐNDVN)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bảng Đạn Đạo &amp; Quy Tắc Ngắm Súng Tiểu Liên AK-47
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Áp dụng cho cỡ đạn tiêu chuẩn <strong>7,62 × 39 mm (M43)</strong>, vận tốc đầu nòng <strong>V₀ = 715 m/s</strong>. 
              Hiểu rõ đường đạn thực tế giúp xạ thủ giải thích vì sao chọn Thước 3 ngắm mép dưới bia số 4 lại bắn trúng tâm vòng 10 ở cự ly 100m.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Vận tốc ban đầu V₀</div>
              <div className="text-lg font-black text-amber-400 font-mono">715 m/s</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tầm bắn hiệu quả</div>
              <div className="text-lg font-black text-emerald-400 font-mono">400 m</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tầm bắn thẳng (Bia 4)</div>
              <div className="text-lg font-black text-cyan-400 font-mono">350 m</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ QUY TẮC NGẮM BẮN TRỌNG TÂM SGK ═══════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-amber-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xs border border-amber-500/20">
              1
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Quy tắc Vàng: Thước 3 ở 100m
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ở cự ly 100m với Thước ngắm 3, đạn vọt cao hơn đường ngắm <strong>+28 cm</strong>. 
            Do bia số 4 cao 50cm, tâm vòng 10 cách mép dưới 25cm. Khi ngắm <strong>chính giữa mép dưới bia</strong>, đạn sẽ bay vọt rơi trúng chính tâm 10!
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-emerald-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xs border border-emerald-500/20">
              2
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Thước 1 (Thước ngắm tương ứng)
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Nếu xạ thủ đặt <strong>Thước ngắm 1</strong> để bắn cự ly 100m, đường đạn cắt đường ngắm tại 100m (độ cao = 0cm). 
            Lúc này điểm ngắm chuẩn phải dọi vào <strong>chính giữa tâm bia (vòng 10)</strong>.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-blue-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-xs border border-blue-500/20">
              3
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Đỉnh đường đạn Thước 3 (150m)
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Đường đạn Thước 3 đạt độ cao đỉnh vòm tại cự ly 150m (cao hơn đường ngắm <strong>+38 cm</strong>). 
            Khi bắn Bia số 6 (người quỳ) ở 150m, xạ thủ ngắm <strong>ngang thắt lưng</strong> hoặc mép dưới mục tiêu.
          </p>
        </div>
      </div>

      {/* ═══════════════ INTERACTIVE TRAJECTORY GRAPH (SVG) ═══════════════ */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-red-500" />
              Đồ Thị Quỹ Đạo Đường Đạn Thực Tế (0m - 500m)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn nấc thước ngắm để quan sát độ vồng đường đạn so với đường ngắm chuẩn (Line of Sight).
            </p>
          </div>

          {/* Chọn nấc Thước ngắm */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Thước ngắm:</span>
            {([1, 3, 4, 5] as const).map((sight) => (
              <button
                key={sight}
                onClick={() => setSelectedSight(sight)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedSight === sight
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Thước {sight} {sight === 3 ? "(Chiến đấu)" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Khung vẽ SVG */}
        <div className="w-full bg-slate-950 rounded-2xl p-4 border border-slate-800 relative overflow-x-auto shadow-inner">
          <svg
            viewBox="0 0 800 310"
            className="w-full min-w-[680px] h-64 select-none"
          >
            <defs>
              <linearGradient id="trajGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#10b981" />
                <stop offset="70%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Trục tọa độ ngang (Mặt bằng) */}
            <line x1="80" y1="290" x2="750" y2="290" stroke="#334155" strokeWidth="1.5" />
            
            {/* Đường ngắm chuẩn (Line of Sight) Y = 0 */}
            <line
              x1="80"
              y1={mapY(0)}
              x2="750"
              y2={mapY(0)}
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              opacity="0.6"
            />
            <text x="85" y={mapY(0) - 6} fill="#06b6d4" fontSize="10" fontWeight="bold">
              Đường ngắm chuẩn (0 cm)
            </text>

            {/* Các vạch cự ly thẳng đứng */}
            {AK_BALLISTICS_DATA.map((p) => {
              const x = mapX(p.distanceMeters);
              const isActive = activeDistance === p.distanceMeters;
              return (
                <g key={p.distanceMeters}>
                  <line
                    x1={x}
                    y1="30"
                    x2={x}
                    y2="290"
                    stroke={isActive ? "#ef4444" : "#1e293b"}
                    strokeWidth={isActive ? "1.5" : "1"}
                    strokeDasharray={isActive ? "3,3" : "2,4"}
                  />
                  <text
                    x={x}
                    y="304"
                    fill={isActive ? "#ef4444" : "#64748b"}
                    fontSize="11"
                    fontWeight={isActive ? "bold" : "normal"}
                    textAnchor="middle"
                  >
                    {p.distanceMeters}m
                  </text>
                </g>
              );
            })}

            {/* Vạch mốc độ cao Y */}
            {[+150, +100, +50, 0, -100, -200, -300, -400].map((h) => {
              const y = mapY(h);
              return (
                <g key={h}>
                  <line x1="75" y1={y} x2="80" y2={y} stroke="#475569" strokeWidth="1" />
                  <text x="70" y={y + 3.5} fill="#64748b" fontSize="9" textAnchor="end">
                    {h > 0 ? `+${h}` : h}
                  </text>
                </g>
              );
            })}
            <text x="25" y="45" fill="#94a3b8" fontSize="9" fontWeight="bold">
              Độ cao (cm)
            </text>

            {/* Minh họa các bia mục tiêu đặt trên đường ngắm */}
            {/* Bia 4 ở 100m */}
            <g transform={`translate(${mapX(100) - 10}, ${mapY(0) - 20})`}>
              <rect width="20" height="20" fill="#059669" rx="3" opacity="0.8" />
              <text x="10" y="14" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Bia 4</text>
            </g>
            {/* Bia 6 ở 150m */}
            <g transform={`translate(${mapX(150) - 10}, ${mapY(0) - 26})`}>
              <rect width="20" height="26" fill="#2563eb" rx="3" opacity="0.8" />
              <text x="10" y="16" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Bia 6</text>
            </g>
            {/* Bia 8 ở 200m */}
            <g transform={`translate(${mapX(200) - 10}, ${mapY(0) - 32})`}>
              <rect width="20" height="32" fill="#7c3aed" rx="3" opacity="0.8" />
              <text x="10" y="20" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Bia 8</text>
            </g>

            {/* ĐƯỜNG CONG ĐẠN ĐẠO CHÍNH */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#trajGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#glow)"
            />

            {/* Các điểm nút trên đường đạn */}
            {AK_BALLISTICS_DATA.map((p) => {
              const x = mapX(p.distanceMeters);
              const h = getHeightForSight(p, selectedSight);
              const y = mapY(h);
              const isActive = activeDistance === p.distanceMeters;

              return (
                <g
                  key={p.distanceMeters}
                  className="cursor-pointer"
                  onClick={() => setActiveDistance(p.distanceMeters)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? "7" : "4.5"}
                    fill={isActive ? "#ef4444" : "#ffffff"}
                    stroke={isActive ? "#fee2e2" : "#0f172a"}
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                  {/* Nhãn độ cao phía trên điểm */}
                  <text
                    x={x}
                    y={y - 10}
                    fill={h >= 0 ? "#34d399" : "#f87171"}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {h >= 0 ? `+${h}cm` : `${h}cm`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Chú thích điểm đang chọn */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-black font-mono border border-red-500/20">
              {selectedPoint.distanceMeters}m
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Chi tiết đạn đạo tại cự ly {selectedPoint.distanceMeters} mét (Thước ngắm {selectedSight})
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedPoint.recommendedAimPoint}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Độ cao: {getHeightForSight(selectedPoint, selectedSight) >= 0 ? `+${getHeightForSight(selectedPoint, selectedSight)}` : getHeightForSight(selectedPoint, selectedSight)} cm
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Vận tốc: {selectedPoint.remainingVelocityMs} m/s
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Tản mát R₅₀: {selectedPoint.dispersionRadiusR50Cm} cm
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════ BẢNG SỐ LIỆU ĐẦY ĐỦ QUÂN ĐỘI ═══════════════ */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            Bảng Tra Cứu Số Liệu Bắn Súng AK-47 Chi Tiết
          </h3>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
            Nhấp vào từng hàng để đồng bộ đồ thị
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-extrabold">
                <th className="py-3 px-3">Cự ly</th>
                <th className="py-3 px-3">Thời gian bay</th>
                <th className="py-3 px-3">Vận tốc rơi</th>
                <th className="py-3 px-3 text-center">Thước 1 (cm)</th>
                <th className="py-3 px-3 text-center bg-red-500/5 text-red-500">Thước 3 (cm)</th>
                <th className="py-3 px-3 text-center">Thước 4 (cm)</th>
                <th className="py-3 px-3 text-center">Thước 5 (cm)</th>
                <th className="py-3 px-3 text-center">Tản mát R₅₀</th>
                <th className="py-3 px-4">Quy tắc ngắm chuẩn GDQP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {AK_BALLISTICS_DATA.map((row) => {
                const isSelected = activeDistance === row.distanceMeters;
                return (
                  <tr
                    key={row.distanceMeters}
                    onClick={() => setActiveDistance(row.distanceMeters)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-red-50 dark:bg-red-950/40 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-3.5 px-3 font-black text-slate-900 dark:text-white">
                      {row.distanceMeters} m
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {row.flightTimeSec.toFixed(2)} s
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {row.remainingVelocityMs} m/s
                    </td>

                    {/* Thước 1 */}
                    <td
                      className={`py-3.5 px-3 text-center ${
                        row.heightWithSight1Cm > 0
                          ? "text-emerald-500"
                          : row.heightWithSight1Cm < 0
                          ? "text-red-400"
                          : "text-cyan-400 font-black"
                      }`}
                    >
                      {row.heightWithSight1Cm > 0 ? `+${row.heightWithSight1Cm}` : row.heightWithSight1Cm}
                    </td>

                    {/* Thước 3 */}
                    <td
                      className={`py-3.5 px-3 text-center bg-red-500/5 font-black ${
                        row.heightWithSight3Cm > 0
                          ? "text-emerald-500"
                          : row.heightWithSight3Cm < 0
                          ? "text-red-400"
                          : "text-cyan-400 font-black"
                      }`}
                    >
                      {row.heightWithSight3Cm > 0 ? `+${row.heightWithSight3Cm}` : row.heightWithSight3Cm}
                    </td>

                    {/* Thước 4 */}
                    <td
                      className={`py-3.5 px-3 text-center ${
                        row.heightWithSight4Cm > 0
                          ? "text-emerald-500"
                          : row.heightWithSight4Cm < 0
                          ? "text-red-400"
                          : "text-cyan-400 font-black"
                      }`}
                    >
                      {row.heightWithSight4Cm > 0 ? `+${row.heightWithSight4Cm}` : row.heightWithSight4Cm}
                    </td>

                    {/* Thước 5 */}
                    <td
                      className={`py-3.5 px-3 text-center ${
                        row.heightWithSight5Cm > 0
                          ? "text-emerald-500"
                          : row.heightWithSight5Cm < 0
                          ? "text-red-400"
                          : "text-cyan-400 font-black"
                      }`}
                    >
                      {row.heightWithSight5Cm > 0 ? `+${row.heightWithSight5Cm}` : row.heightWithSight5Cm}
                    </td>

                    <td className="py-3.5 px-3 text-center text-amber-500 font-bold">
                      ±{row.dispersionRadiusR50Cm} cm
                    </td>

                    <td className="py-3.5 px-4 font-sans text-xs text-slate-700 dark:text-slate-300">
                      {row.recommendedAimPoint}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
