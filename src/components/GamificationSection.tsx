import { useState, useEffect, useCallback } from "react";
import {
  Trophy, Star, Shield, Map, BookOpen, Award, Users, ChevronUp, Zap, Lock
} from "lucide-react";
import {
  loadState, RANKS, BADGES, MOCK_LEADERBOARD,
  getRankFromXP, getNextRank, getXPProgress,
  GamificationState, Rank, Badge,
} from "../gamification";
import { useGamification } from "../context/GamificationContext";

// ---- XP TOAST (nhỏ, không phá layout) ----
interface XPToast { id: number; amount: number; label?: string; }

export function XPToastContainer({ toasts }: { toasts: XPToast[] }) {
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-extrabold shadow-lg animate-bounce-once">
          <Zap className="w-3.5 h-3.5" />
          +{t.amount} XP {t.label ? `· ${t.label}` : ""}
        </div>
      ))}
    </div>
  );
}

// ---- BADGE UNLOCK TOAST ----
export function BadgeToast({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-white border-2 px-5 py-3 rounded-2xl shadow-2xl pointer-events-none"
      style={{ borderColor: badge.color }}>
      <span className="text-3xl">{badge.emoji}</span>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: badge.color }}>🎉 Huy hiệu mới mở khóa!</div>
        <div className="font-extrabold text-slate-900 text-sm">{badge.name}</div>
        <div className="text-xs text-slate-500">{badge.description}</div>
      </div>
    </div>
  );
}

// ---- RANK CARD ----
function RankCard({ state }: { state: GamificationState }) {
  const rank = getRankFromXP(state.xp);
  const next = getNextRank(rank.level);
  const progress = getXPProgress(state.xp);
  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${rank.color}, ${rank.color}aa)` }}>
      {/* background decoration */}
      <div className="absolute right-4 top-2 text-[80px] opacity-10 leading-none select-none">{rank.emoji.split(" ")[0]}</div>
      <div className="relative z-10">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Cấp bậc hiện tại</div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">{rank.emoji.split(" ")[0]}</span>
          <div>
            <div className="font-extrabold text-xl leading-tight">{rank.name}</div>
            <div className="text-xs opacity-80">Cấp {rank.level}/8</div>
          </div>
        </div>
        <div className="flex items-end justify-between mb-1">
          <div className="text-2xl font-black">{state.xp.toLocaleString()} XP</div>
          {next && <div className="text-xs opacity-80">{next.minXP.toLocaleString()} XP → {next.emoji.split(" ")[0]} {next.name}</div>}
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
          <div className="h-full bg-white/80 rounded-full transition-all duration-700"
            style={{ width: `${progress.percent}%` }} />
        </div>
        {next && (
          <div className="text-xs opacity-80 mt-1">{progress.current}/{progress.needed} XP đến cấp tiếp theo ({progress.percent}%)</div>
        )}
        {!next && <div className="text-xs opacity-80 mt-1 font-bold">🌟 Đã đạt cấp bậc tối cao!</div>}
      </div>
    </div>
  );
}

// ---- STAT CARDS ----
function StatBar({ label, icon, value, color }: { label: string; icon: React.ReactNode; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-400 font-medium">{label}</div>
        <div className="font-extrabold text-slate-800 text-sm">{value}</div>
      </div>
    </div>
  );
}

// ---- BADGES GRID ----
function BadgesGrid({ earned }: { earned: string[] }) {
  const earnedSet = new Set(earned);
  return (
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
        <Award className="w-3.5 h-3.5" /> Huy hiệu thành tích ({earned.length}/{BADGES.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BADGES.map(b => {
          const unlocked = earnedSet.has(b.id);
          return (
            <div key={b.id}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-center transition-all ${unlocked ? "shadow-sm" : "opacity-50 grayscale"}`}
              style={unlocked ? { borderColor: b.color, background: `${b.color}08` } : { borderColor: "#e2e8f0" }}>
              <span className="text-2xl">{unlocked ? b.emoji : "🔒"}</span>
              <div className="text-[11px] font-extrabold text-slate-800 leading-tight">{b.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{b.description}</div>
              {unlocked && <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: b.color }}>✓ Đạt được</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- LEADERBOARD ----
function Leaderboard({ userXP }: { userXP: number }) {
  const [filterGrade, setFilterGrade] = useState<number | null>(null);

  const combined = [
    ...MOCK_LEADERBOARD,
    { name: "Bạn", grade: 0, xp: userXP, avatar: "👤" },
  ]
    .filter(e => filterGrade === null || e.grade === filterGrade || e.grade === 0)
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Bảng xếp hạng
        </h3>
        <div className="flex gap-1">
          {[null, 10, 11, 12].map(g => (
            <button key={g ?? "all"}
              onClick={() => setFilterGrade(g)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold border cursor-pointer transition-all ${filterGrade === g ? "bg-red-600 text-white border-red-600" : "border-slate-200 text-slate-500 hover:border-red-400"}`}>
              {g === null ? "Tất cả" : `Lớp ${g}`}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {combined.map((e) => {
          const isUser = e.name === "Bạn";
          const medal = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `${e.rank}.`;
          const rankInfo = getRankFromXP(e.xp);
          return (
            <div key={`${e.name}-${e.xp}`}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isUser ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-slate-50/40"}`}>
              <div className="w-7 text-center font-extrabold text-sm">{medal}</div>
              <span className="text-xl">{e.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate ${isUser ? "text-amber-700" : "text-slate-800"}`}>
                  {e.name} {isUser && "← Bạn"}
                </div>
                <div className="text-[10px] text-slate-400">{rankInfo.emoji} {rankInfo.name} {e.grade > 0 ? `· Lớp ${e.grade}` : ""}</div>
              </div>
              <div className="text-sm font-extrabold text-slate-700 shrink-0">{e.xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- ALL RANKS OVERVIEW ----
function RanksOverview({ currentXP }: { currentXP: number }) {
  const currentRank = getRankFromXP(currentXP);
  return (
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
        <ChevronUp className="w-3.5 h-3.5" /> Lộ trình thăng cấp
      </h3>
      <div className="space-y-2">
        {RANKS.map(r => {
          const reached = currentXP >= r.minXP;
          const isCurrent = r.level === currentRank.level;
          return (
            <div key={r.level}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isCurrent ? "shadow-md" : reached ? "opacity-70" : "opacity-40"}`}
              style={isCurrent ? { borderColor: r.color, background: `${r.color}10` } : reached ? { borderColor: `${r.color}60` } : { borderColor: "#e2e8f0" }}>
              <span className="text-xl w-8 text-center">{reached ? r.emoji.split(" ")[0] : "🔒"}</span>
              <div className="flex-1">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  {r.name}
                  {isCurrent && <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white" style={{ background: r.color }}>Hiện tại</span>}
                </div>
                <div className="text-[10px] text-slate-400">Cấp {r.level} · {r.minXP.toLocaleString()} XP</div>
              </div>
              {reached && !isCurrent && <div className="text-[10px] font-bold text-green-500">✓ Đã đạt</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- HOW TO EARN XP ----
function HowToEarnXP() {
  const items = [
    { emoji: "📖", label: "Đọc xong 1 bài lý thuyết", xp: 10 },
    { emoji: "✅", label: "Trả lời đúng 1 câu quiz", xp: 15 },
    { emoji: "🏆", label: "Đạt 100% điểm quiz (bonus)", xp: 50 },
    { emoji: "📍", label: "Xem 1 địa điểm trên bản đồ", xp: 5 },
    { emoji: "💡", label: "Xem đáp án câu hỏi bản đồ", xp: 10 },
  ];
  return (
    <div className="border border-blue-100 bg-blue-50/50 rounded-2xl p-4">
      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
        <Zap className="w-3.5 h-3.5" /> Cách kiếm XP
      </h3>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.label} className="flex items-center gap-2.5">
            <span className="text-lg">{it.emoji}</span>
            <span className="text-xs text-slate-700 flex-1">{it.label}</span>
            <span className="text-xs font-extrabold text-amber-600">+{it.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function GamificationSection() {
  const { state } = useGamification();
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "ranks" | "leaderboard">("overview");

  const rank = getRankFromXP(state.xp);

  const tabs = [
    { key: "overview",    label: "Tổng quan",    icon: <Trophy className="w-3.5 h-3.5" /> },
    { key: "badges",      label: "Huy hiệu",     icon: <Award className="w-3.5 h-3.5" /> },
    { key: "ranks",       label: "Cấp bậc",      icon: <Shield className="w-3.5 h-3.5" /> },
    { key: "leaderboard", label: "Xếp hạng",     icon: <Users className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-slate-100" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest font-mono">Gamification</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Cấp bậc & Nhiệm vụ</h2>
        <p className="text-xs text-slate-400 mt-1">Học — Tích XP — Thăng cấp — Chinh phục huy hiệu</p>
      </div>

      {/* INNER TABS */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold cursor-pointer transition-all border-b-2 ${activeTab === t.key ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-5">
        {activeTab === "overview" && (
          <>
            <RankCard state={state} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBar label="Tổng XP" icon={<Zap className="w-4 h-4" />} value={`${state.xp.toLocaleString()} XP`} color="#f59e0b" />
              <StatBar label="Huy hiệu" icon={<Award className="w-4 h-4" />} value={`${state.badges.length}/${BADGES.length}`} color="#8b5cf6" />
              <StatBar label="Bài đã đọc" icon={<BookOpen className="w-4 h-4" />} value={`${state.lessonsRead.length} bài`} color="#3b82f6" />
              <StatBar label="Địa điểm" icon={<Map className="w-4 h-4" />} value={`${state.mapSitesVisited.length}/6`} color="#10b981" />
            </div>
            <HowToEarnXP />
          </>
        )}
        {activeTab === "badges" && <BadgesGrid earned={state.badges} />}
        {activeTab === "ranks" && <RanksOverview currentXP={state.xp} />}
        {activeTab === "leaderboard" && <Leaderboard userXP={state.xp} />}
      </div>
    </div>
  );
}
