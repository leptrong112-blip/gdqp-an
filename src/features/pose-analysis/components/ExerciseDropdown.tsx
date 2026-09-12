import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { EXERCISE_CATALOG, type ExerciseInfo } from '../scoring/movements';
import type { MovementId } from '../types';

interface ExerciseDropdownProps {
  currentId: MovementId;
  onSelect: (id: MovementId) => void;
  isFullscreen?: boolean;
}

export function ExerciseDropdown({
  currentId,
  onSelect,
  isFullscreen = false,
}: ExerciseDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentExercise = EXERCISE_CATALOG.find(e => e.id === currentId) || EXERCISE_CATALOG[0];

  // Đóng dropdown khi bấm ra ngoài hoặc bấm Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (item: ExerciseInfo) => {
    if (item.available === false) return;
    onSelect(item.id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Nút bấm kích hoạt mở menu xổ xuống */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
          isFullscreen
            ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 hover:border-slate-500 shadow-md'
            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-red-500/60 shadow-sm hover:shadow-md'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{currentExercise.icon}</span>
          <span className="font-extrabold tracking-tight">
            {currentExercise.name}
          </span>
        </span>

        <span className="flex items-center gap-1.5 pl-1 border-l border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500">
          <span className="text-[10px] hidden sm:inline uppercase tracking-wider font-semibold">Đổi</span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-500' : ''}`}
          />
        </span>
      </button>

      {/* Menu xổ xuống */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-72 sm:w-84 max-h-[380px] overflow-y-auto rounded-2xl shadow-2xl border z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ${
            isFullscreen
              ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700 text-white shadow-black/80'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-slate-900/20'
          }`}
          role="listbox"
        >
          {/* Tiêu đề đầu menu */}
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-400 dark:text-slate-400">
            <span>CHỌN BÀI TẬP ĐIỀU LỆNH</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {EXERCISE_CATALOG.length} động tác
            </span>
          </div>

          {/* Danh sách các bài tập */}
          <div className="space-y-1 pt-1">
            {EXERCISE_CATALOG.map((item) => {
              const isSelected = item.id === currentId;
              const isAvailable = item.available !== false;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 font-extrabold'
                      : isAvailable
                      ? 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 border border-transparent'
                      : 'opacity-50 cursor-not-allowed hover:bg-transparent text-slate-400'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                      isSelected
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold truncate">{item.name}</span>
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                            isAvailable
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-500/15 text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug font-normal">
                        {item.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Icon trạng thái đã chọn hoặc sắp có */}
                  <div className="shrink-0 pt-0.5">
                    {isSelected && (
                      <Check size={16} className="text-red-600 dark:text-red-400 stroke-[3]" />
                    )}
                    {!isAvailable && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic">
                        Sắp có
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chân menu nhắc nhở */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-2.5 py-1 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500 shrink-0" />
            <span>Sẽ cập nhật thêm các động tác quay, chào theo chương trình GDQP!</span>
          </div>
        </div>
      )}
    </div>
  );
}
