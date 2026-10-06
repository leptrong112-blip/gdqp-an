import React from 'react';
import { POSE_CONFIG } from '../config';
import type { PoseStage, QualityReport } from '../types';

export const CAMERA_LIGHTING_HELP = 'Bật đèn phòng hoặc đặt đèn phía trước / chếch trước để chiếu rõ mặt, thân và chân. Nếu có cửa sổ hay đèn sáng phía sau, đổi hướng đứng để nguồn sáng ở phía trước; tránh chiếu đèn thẳng vào ống kính.';
export const CAMERA_FRAMING_HELP = 'Đặt laptop hoặc điện thoại cố định, lau sạch ống kính. Chỉnh khoảng cách và góc camera để thấy đỉnh đầu, hai tay, gót và mũi chân, còn khoảng trống quanh người. Nếu người quá nhỏ, tiến gần hơn nhưng vẫn giữ cả bàn chân trong hình.';
export const CAMERA_DARKNESS_NOTICE = 'Camera thông thường không nhìn được trong bóng tối hoàn toàn; cần bổ sung ánh sáng thật để AI có dữ liệu chấm.';

// Presentation only: use the existing quality checks, never a separate scoring gate.
export function cameraGuidance(report?: QualityReport) {
  if (!report) return { id: 'checking', title: 'Kiểm tra hình ảnh trước khi tập', tips: [CAMERA_LIGHTING_HELP, CAMERA_FRAMING_HELP] };
  const failed = (id: string) => report.checks.some(check => check.id === id && !check.passed);
  if (failed('lighting')) {
    const light = report.metrics.lighting;
    const tooBright = light.mean > POSE_CONFIG.lighting.maximumMean || light.brightRatio >= POSE_CONFIG.lighting.maximumBrightRatio;
    return {
      id: 'lighting', title: tooBright ? 'Hình ảnh quá sáng hoặc có vùng bị chói' : 'Hình ảnh thiếu sáng hoặc có nhiều vùng tối',
      tips: [tooBright ? 'Giảm đèn chiếu trực tiếp vào camera, kéo rèm nếu nền quá sáng; giữ ánh sáng đều trên người.' : CAMERA_LIGHTING_HELP, CAMERA_FRAMING_HELP],
    };
  }
  if (failed('person')) return { id: 'person', title: 'Chưa xác nhận được một người rõ trong hình', tips: ['Đứng trước camera và chỉ để một người trong khung hình. Nếu đã đứng trong hình nhưng chưa được nhận diện, bổ sung ánh sáng phía trước.', CAMERA_FRAMING_HELP] };
  if (failed('framing') || failed('reliability')) return {
    id: 'visibility', title: 'Chưa quan sát đủ rõ người và các khớp',
    tips: [CAMERA_FRAMING_HELP, 'Bỏ vật che tay/chân, giữ ánh sáng đều trên người. Khớp khó nhận diện có thể do thiếu sáng hoặc bị che, không có nghĩa là bạn làm sai động tác.'],
  };
  if (failed('stability') || failed('orientation')) return {
    id: 'position', title: 'Cần ổn định vị trí trước khi tập',
    tips: report.checks.filter(check => !check.passed).map(check => check.message),
  };
  return report.passed
    ? { id: 'ready', title: 'Hình ảnh đã đủ điều kiện để bắt đầu', tips: ['Tiếp tục giữ camera cố định và toàn thân trong hình. Đây là kiểm tra chất lượng dữ liệu, không phải điểm động tác.'] }
    : { id: 'settling', title: 'Đã thấy rõ người — đang xác nhận độ ổn định', tips: ['Giữ nguyên vị trí thêm một giây để hệ thống xác nhận.'] };
}

export function PoseCameraGuidance({ report, stage }: { report?: QualityReport; stage: PoseStage }) {
  // Never cover command/countdown or apply frontal readiness requirements to a turn.
  if (!['idle', 'loading-model', 'quality-check', 'calibrating', 'waiting-precondition', 'blocked'].includes(stage)) return null;
  const guidance = cameraGuidance(report);
  return (
    <section aria-label="Kiểm tra độ rõ hình ảnh" data-camera-guidance={guidance.id}
      className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-xs leading-relaxed space-y-2">
      <h3 role="status" className="font-bold">{guidance.title}</h3>
      <ul className="list-disc pl-4 space-y-2">{guidance.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>
      {['checking', 'lighting'].includes(guidance.id) && <p className="text-slate-600 dark:text-slate-400">{CAMERA_DARKNESS_NOTICE}</p>}
    </section>
  );
}
