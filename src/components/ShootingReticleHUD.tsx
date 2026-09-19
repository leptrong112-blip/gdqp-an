import React from 'react';
import { ReticleConfig, RETICLE_COLORS } from './rangeReticleConfig';

interface ShootingReticleHUDProps {
  isAds: boolean;
  visible: boolean;
  config: ReticleConfig;
  previewMode?: boolean;      // Khi mở bảng cài đặt để xem trước
  showAlignmentGrid?: boolean; // Vạch gióng tâm hỗ trợ căn chỉnh 3D
}

export const ShootingReticleHUD: React.FC<ShootingReticleHUDProps> = ({
  isAds,
  visible,
  config,
  previewMode = false,
  showAlignmentGrid = false,
}) => {
  if (!visible && !previewMode) return null;

  const color = RETICLE_COLORS[config.colorPreset]?.hex || '#ffffff';
  const t = config.lineThickness;
  const outlineT = t + 1.6; // Lớp viền đen dày hơn đúng 1.6px để tạo viền 0.8px sắc lẹm xung quanh
  const dotR = config.centerDotSize;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 select-none flex items-center justify-center transition-all duration-150 ease-out"
    >
      {/* ════════════════════════════════════════════════════════════════
          0. VẠCH GIÓNG TÂM HỖ TRỢ CĂN CHỈNH 3D (ALIGNMENT GRID GUIDES)
          Chỉ hiện khi người dùng đang mở bảng căn chỉnh 3D để so khớp
          ════════════════════════════════════════════════════════════════ */}
      {(showAlignmentGrid || (previewMode && config.showAlignmentGrid)) && (
        <svg
          width="320"
          height="320"
          viewBox="-160 -160 320 320"
          className="absolute overflow-visible pointer-events-none opacity-60"
        >
          {/* Trục chữ thập toàn màn hình mảnh */}
          <line x1="-150" y1="0" x2="150" y2="0" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="-150" x2="0" y2="150" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Vòng chuẩn tâm 10m & 100m */}
          <circle cx="0" cy="0" r="30" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
          <circle cx="0" cy="0" r="60" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />

          {/* Vạch chia mil mỏng */}
          {[-80, -40, 40, 80].map(pos => (
            <React.Fragment key={pos}>
              <line x1={pos} y1="-4" x2={pos} y2="4" stroke="#f59e0b" strokeWidth="1" />
              <line x1="-4" y1={pos} x2="4" y2={pos} stroke="#f59e0b" strokeWidth="1" />
            </React.Fragment>
          ))}
        </svg>
      )}

      {/* ════════════════════════════════════════════════════════════════
          A. TÂM BẮN TỪ HÔNG (HIP-FIRE CROSSHAIR)
          Kỹ thuật Dual-Stroke Vector: Viền đen sắc nét phía dưới, màu phía trên
          Không dùng filter blur -> 100% SẮC NÉT (CRISP & SHARP)
          ════════════════════════════════════════════════════════════════ */}
      {!isAds && config.showHipCrosshair && (
        <svg
          width={config.hipCrosshairSize}
          height={config.hipCrosshairSize}
          viewBox="-24 -24 48 48"
          shapeRendering="geometricPrecision"
          className="overflow-visible transition-opacity duration-150"
          style={{ opacity: config.hipCrosshairOpacity }}
        >
          {/* Lớp 1: Viền đen sắc nét chống chói trên nền trời & bia sáng */}
          {config.hasOutline && (
            <g stroke="#000000" strokeWidth={outlineT} strokeLinecap="round">
              <line x1="0" y1="-6" x2="0" y2="-16" />
              <line x1="0" y1="6" x2="0" y2="16" />
              <line x1="-6" y1="0" x2="-16" y2="0" />
              <line x1="6" y1="0" x2="16" y2="0" />
            </g>
          )}

          {/* Lớp 2: Vạch màu chính sắc nét */}
          <g stroke={color} strokeWidth={t} strokeLinecap="round">
            <line x1="0" y1="-6" x2="0" y2="-16" />
            <line x1="0" y1="6" x2="0" y2="16" />
            <line x1="-6" y1="0" x2="-16" y2="0" />
            <line x1="6" y1="0" x2="16" y2="0" />
          </g>

          {/* Chấm tâm tinh tế */}
          {config.hasOutline && (
            <circle cx="0" cy="0" r={dotR + 0.8} fill="#000000" />
          )}
          <circle cx="0" cy="0" r={dotR} fill={color} />
        </svg>
      )}

      {/* ════════════════════════════════════════════════════════════════
          B. TÂM THƯỚC NGẮM KHI ADS (ADS SIGHT RETICLE OVERLAY)
          Đầu ngắm - Khe ngắm - Vạch thăng bằng - Chấm đỏ hồng tâm
          100% Vector sắc nét không vỡ hình
          ════════════════════════════════════════════════════════════════ */}
      {isAds && config.showAdsReticle && (
        <svg
          width={config.adsReticleSize}
          height={config.adsReticleSize}
          viewBox="-32 -32 64 64"
          shapeRendering="geometricPrecision"
          className="overflow-visible transition-opacity duration-150"
          style={{ opacity: config.adsReticleOpacity }}
        >
          {/* 1. Kiểu dáng: "ak_iron_guide" (Thước ngắm AK trực quan) */}
          {config.adsReticleStyle === 'ak_iron_guide' && (
            <g>
              {/* Vòng chuẩn mờ mỏng định vị lấy nét */}
              <circle
                cx="0"
                cy="0"
                r="18"
                fill="none"
                stroke={color}
                strokeWidth={Math.max(0.8, t * 0.6)}
                strokeDasharray="3 3"
                opacity="0.45"
              />

              {/* Vạch thăng bằng ngang hai bên (Horizon balance) */}
              {config.hasOutline && (
                <g stroke="#000000" strokeWidth={outlineT} strokeLinecap="round">
                  <line x1="-24" y1="0" x2="-11" y2="0" />
                  <line x1="11" y1="0" x2="24" y2="0" />
                </g>
              )}
              <g stroke={color} strokeWidth={t} strokeLinecap="round" opacity="0.85">
                <line x1="-24" y1="0" x2="-11" y2="0" />
                <line x1="11" y1="0" x2="24" y2="0" />
              </g>

              {/* Mô phỏng khe ngắm sau 2 bên (Rear sight notch guide) */}
              {config.hasOutline && (
                <g stroke="#000000" strokeWidth={outlineT} fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M -16 6 L -8 6 L -8 13" />
                  <path d="M 16 6 L 8 6 L 8 13" />
                </g>
              )}
              <g stroke={color} strokeWidth={t} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                <path d="M -16 6 L -8 6 L -8 13" />
                <path d="M 16 6 L 8 6 L 8 13" />
              </g>

              {/* Trụ đầu ngắm ở giữa (Front sight post guide) */}
              {config.hasOutline && (
                <line x1="0" y1="3" x2="0" y2="14" stroke="#000000" strokeWidth={outlineT + 0.6} strokeLinecap="square" />
              )}
              <line x1="0" y1="3" x2="0" y2="14" stroke={color} strokeWidth={t + 0.4} strokeLinecap="square" />

              {/* Điểm chạm hồng tâm (Center Red Aim Point) */}
              <circle cx="0" cy="0" r={dotR + 1.0} fill="#000000" />
              <circle cx="0" cy="0" r={dotR + 0.2} fill="#ef4444" />
              <circle cx="0" cy="0" r={dotR * 0.45} fill="#ffffff" />
            </g>
          )}

          {/* 2. Kiểu dáng: "precision_dot" (Chấm đỏ chuẩn xác + chữ thập mảnh) */}
          {config.adsReticleStyle === 'precision_dot' && (
            <g>
              {config.hasOutline && (
                <g stroke="#000000" strokeWidth={outlineT} strokeLinecap="round">
                  <line x1="0" y1="-18" x2="0" y2="-5" />
                  <line x1="0" y1="5" x2="0" y2="18" />
                  <line x1="-18" y1="0" x2="-5" y2="0" />
                  <line x1="5" y1="0" x2="18" y2="0" />
                </g>
              )}
              <g stroke={color} strokeWidth={t} strokeLinecap="round">
                <line x1="0" y1="-18" x2="0" y2="-5" />
                <line x1="0" y1="5" x2="0" y2="18" />
                <line x1="-18" y1="0" x2="-5" y2="0" />
                <line x1="5" y1="0" x2="18" y2="0" />
              </g>

              {/* Chấm đỏ trung tâm */}
              <circle cx="0" cy="0" r={dotR + 1.0} fill="#000000" />
              <circle cx="0" cy="0" r={dotR + 0.3} fill="#ef4444" />
              <circle cx="0" cy="0" r={dotR * 0.45} fill="#ffffff" />
            </g>
          )}

          {/* 3. Kiểu dáng: "tactical_circle" (Vòng tròn chiến thuật lấy nét nhanh) */}
          {config.adsReticleStyle === 'tactical_circle' && (
            <g>
              {config.hasOutline && (
                <>
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#000000" strokeWidth={outlineT} />
                  <line x1="0" y1="-22" x2="0" y2="-15" stroke="#000000" strokeWidth={outlineT} strokeLinecap="round" />
                  <line x1="0" y1="15" x2="0" y2="22" stroke="#000000" strokeWidth={outlineT} strokeLinecap="round" />
                  <line x1="-22" y1="0" x2="-15" y2="0" stroke="#000000" strokeWidth={outlineT} strokeLinecap="round" />
                  <line x1="15" y1="0" x2="22" y2="0" stroke="#000000" strokeWidth={outlineT} strokeLinecap="round" />
                </>
              )}
              <circle cx="0" cy="0" r="14" fill="none" stroke={color} strokeWidth={t} opacity="0.85" />
              <line x1="0" y1="-22" x2="0" y2="-15" stroke={color} strokeWidth={t} strokeLinecap="round" />
              <line x1="0" y1="15" x2="0" y2="22" stroke={color} strokeWidth={t} strokeLinecap="round" />
              <line x1="-22" y1="0" x2="-15" y2="0" stroke={color} strokeWidth={t} strokeLinecap="round" />
              <line x1="15" y1="0" x2="22" y2="0" stroke={color} strokeWidth={t} strokeLinecap="round" />

              {/* Chấm đỏ trung tâm */}
              <circle cx="0" cy="0" r={dotR + 0.8} fill="#000000" />
              <circle cx="0" cy="0" r={dotR + 0.2} fill="#ef4444" />
            </g>
          )}
        </svg>
      )}
    </div>
  );
};
