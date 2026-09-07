import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface ExamTimerProps {
  startedAt: number;
  durationSeconds: number;
  onExpire: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  startedAt,
  durationSeconds,
  onExpire,
}) => {
  const calculateRemaining = () => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = calculateRemaining();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt, durationSeconds, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 60;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-extrabold shadow-md transition-all ${
        isUrgent
          ? "bg-red-500 text-white animate-pulse"
          : "bg-slate-900 text-amber-400 border border-slate-700"
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-amber-400" />
      )}
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

export default ExamTimer;
