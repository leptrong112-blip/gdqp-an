interface Props {
  feature: 'physics' | 'pose-sequence';
  className?: string;
}

const messages: Record<Props['feature'], string> = {
  physics: 'Mô phỏng đang chạy ở chế độ tương thích JavaScript. Thao tác và cách tính điểm không thay đổi.',
  'pose-sequence': 'Phân tích chuỗi đang chạy ở chế độ tương thích JavaScript. Bài tập và cách tính điểm không thay đổi.',
};

export default function WasmCompatibilityNotice({ feature, className = '' }: Props) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl border border-amber-400/40 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-900 shadow-sm dark:bg-amber-950/90 dark:text-amber-100 ${className}`}
    >
      <span aria-hidden="true">ⓘ</span>{' '}{messages[feature]}
    </p>
  );
}
