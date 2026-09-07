// ============================================================
// GAMIFICATION ENGINE — XP, Ranks, Badges, Missions
// Lưu trữ: localStorage. Không cần backend.
// ============================================================

// ---- TYPES ----
export interface Rank {
  level: number;
  name: string;
  emoji: string;
  minXP: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

export interface GamificationState {
  xp: number;
  badges: string[];
  lessonsRead: string[];
  mapSitesVisited: number[];
  mapAnswersViewed: number[];
  quizScores: Record<string, number>; // gradeKey -> score
  practicalSkillsCompleted: string[]; // Mới thêm: theo dõi bài thực hành
}

// ---- RANK CONFIG ----
export const RANKS: Rank[] = [
  { level: 1, name: "Chiến sĩ mới",          emoji: "🪖", minXP: 0,    color: "#6b7280" },
  { level: 2, name: "Tân binh",               emoji: "⭐", minXP: 100,  color: "#3b82f6" },
  { level: 3, name: "Chiến sĩ",               emoji: "🎖️", minXP: 250,  color: "#10b981" },
  { level: 4, name: "Hạ sĩ",                  emoji: "🎗️", minXP: 500,  color: "#f59e0b" },
  { level: 5, name: "Trung sĩ",               emoji: "🏅", minXP: 900,  color: "#f97316" },
  { level: 6, name: "Thượng sĩ",              emoji: "🥈", minXP: 1400, color: "#8b5cf6" },
  { level: 7, name: "Cựu chiến binh",         emoji: "🥇", minXP: 2000, color: "#dc2626" },
  { level: 8, name: "Chuyên gia Quốc phòng",  emoji: "🎗️🌟", minXP: 3000, color: "#b91c1c" },
];

// ---- BADGE CONFIG ----
export const BADGES: Badge[] = [
  { id: "first_lesson",   name: "Khai môn",       emoji: "🔰", color: "#3b82f6", description: "Hoàn thành bài lý thuyết đầu tiên" },
  { id: "perfect_quiz",   name: "Bắn tỉa",        emoji: "🎯", color: "#ef4444", description: "Đạt 100% điểm quiz một lần" },
  { id: "all_lessons",    name: "Mọt sách",        emoji: "📚", color: "#8b5cf6", description: "Đọc hết tất cả bài lý thuyết một khối lớp" },
  { id: "explorer",       name: "Nhà thám hiểm",  emoji: "🗺️", color: "#10b981", description: "Xem tất cả 6 địa điểm trên bản đồ" },
  { id: "map_scholar",    name: "Học giả bản đồ", emoji: "🔍", color: "#06b6d4", description: "Xem đáp án của tất cả 6 địa điểm bản đồ" },
  { id: "historian",      name: "Nhà Sử Học",     emoji: "📚", color: "#6366f1", description: "Trả lời tất cả câu hỏi tại các di tích" },
  { id: "first_aid",      name: "Cứu Thương Binh", emoji: "⛑️", color: "#ef4444", description: "Hoàn thành kỹ năng Sơ cứu ban đầu" },
  { id: "firefighter",    name: "Lính Cứu Hỏa",   emoji: "🧯", color: "#f97316", description: "Hoàn thành kỹ năng PCCC" },
  { id: "practical_master", name: "Chiến Sĩ Thực Hành", emoji: "🏅", color: "#10b981", description: "Hoàn thành xuất sắc tất cả bài thực hành" },
  { id: "veteran",        name: "Lão luyện",       emoji: "🏆", color: "#f59e0b", description: "Đạt cấp Cựu chiến binh (level 7)" },
  { id: "omnipotent",     name: "Toàn năng",       emoji: "🌟", color: "#dc2626", description: "Mở khóa tất cả huy hiệu khác" },
];

// ---- XP VALUES ----
export const XP = {
  LESSON_READ: 10,
  QUIZ_CORRECT: 10,
  QUIZ_PERFECT_BONUS: 50,
  MAP_VISIT: 5,
  MAP_ANSWER: 15,
  PRACTICAL_SKILL_DONE: 30, // Mới thêm
};

// ---- XP TOAST EVENT ----
let _toastId = 0;
export function fireXPToast(amount: number, label?: string) {
  window.dispatchEvent(new CustomEvent("gqd_xp_toast", { detail: { id: ++_toastId, amount, label } }));
  window.dispatchEvent(new Event("gqd_xp_updated"));
}

// ---- STORAGE KEY ----
const STORAGE_KEY = "gqd_gamification_v2";

// ---- LOAD / SAVE ----
export function loadState(): GamificationState {
  const defaultState: GamificationState = {
    xp: 0,
    badges: [],
    lessonsRead: [],
    mapSitesVisited: [],
    mapAnswersViewed: [],
    quizScores: {},
    practicalSkillsCompleted: [],
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    }
  } catch { /* ignore */ }
  return defaultState;
}

export function saveState(state: GamificationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---- RANK UTILS ----
export function getRankFromXP(xp: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
  }
  return rank;
}

export function getNextRank(currentLevel: number): Rank | null {
  return RANKS.find(r => r.level === currentLevel + 1) ?? null;
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const rank = getRankFromXP(xp);
  const next = getNextRank(rank.level);
  if (!next) return { current: xp - rank.minXP, needed: 0, percent: 100 };
  const current = xp - rank.minXP;
  const needed = next.minXP - rank.minXP;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

// ---- BADGE CHECK ----
export function checkBadges(state: GamificationState): string[] {
  const newBadges: string[] = [];
  const earned = new Set(state.badges);

  if (!earned.has("first_lesson") && state.lessonsRead.length >= 1)
    newBadges.push("first_lesson");

  if (!earned.has("perfect_quiz") && Object.values(state.quizScores).some(s => s === 100))
    newBadges.push("perfect_quiz");

  if (!earned.has("all_lessons")) {
    if (state.lessonsRead.length >= 10) newBadges.push("all_lessons");
  }

  if (!earned.has("explorer") && state.mapSitesVisited.length >= 6)
    newBadges.push("explorer");

  if (!earned.has("historian") && state.mapAnswersViewed.length >= 6)
    newBadges.push("historian");

  // Thực hành
  if (!earned.has("first_aid") && state.practicalSkillsCompleted.includes("first-aid"))
    newBadges.push("first_aid");
  
  if (!earned.has("firefighter") && state.practicalSkillsCompleted.includes("fire-safety"))
    newBadges.push("firefighter");
    
  if (!earned.has("practical_master") && state.practicalSkillsCompleted.length >= 3)
    newBadges.push("practical_master");

  if (!earned.has("veteran") && getRankFromXP(state.xp).level >= 7)
    newBadges.push("veteran");

  const allEarned = new Set([...state.badges, ...newBadges]);
  const nonMeta = BADGES.filter(b => b.id !== "omnipotent").map(b => b.id);
  if (!earned.has("omnipotent") && nonMeta.every(id => allEarned.has(id)))
    newBadges.push("omnipotent");

  return newBadges;
}

// ---- ACTION DISPATCHERS ----
export function addXPAndSave(
  amount: number,
  extra?: Partial<Pick<GamificationState, "lessonsRead" | "mapSitesVisited" | "mapAnswersViewed" | "quizScores" | "practicalSkillsCompleted">>
): { state: GamificationState; newBadges: string[]; xpGained: number } {
  const state = loadState();
  state.xp += amount;
  if (extra?.lessonsRead) {
    extra.lessonsRead.forEach(id => {
      if (!state.lessonsRead.includes(id)) state.lessonsRead.push(id);
    });
  }
  if (extra?.mapSitesVisited) {
    extra.mapSitesVisited.forEach(id => {
      if (!state.mapSitesVisited.includes(id)) state.mapSitesVisited.push(id);
    });
  }
  if (extra?.mapAnswersViewed) {
    extra.mapAnswersViewed.forEach(id => {
      if (!state.mapAnswersViewed.includes(id)) state.mapAnswersViewed.push(id);
    });
  }
  if (extra?.quizScores) {
    Object.assign(state.quizScores, extra.quizScores);
  }
  if (extra?.practicalSkillsCompleted) {
    state.practicalSkillsCompleted = [...new Set([...state.practicalSkillsCompleted, ...extra.practicalSkillsCompleted])];
  }
  const newBadges = checkBadges(state);
  state.badges = [...new Set([...state.badges, ...newBadges])];
  saveState(state);
  return { state, newBadges, xpGained: amount };
}

export function markLessonRead(lessonId: string): { xpGained: number; newBadges: string[] } {
  const state = loadState();
  if (state.lessonsRead.includes(lessonId)) return { xpGained: 0, newBadges: [] };
  const result = addXPAndSave(XP.LESSON_READ, { lessonsRead: [lessonId] });
  return { xpGained: result.xpGained, newBadges: result.newBadges };
}

export function recordQuizScore(grade: number, correctCount: number, total: number): { xpGained: number; newBadges: string[] } {
  const percent = Math.round((correctCount / total) * 100);
  const xpFromAnswers = correctCount * XP.QUIZ_CORRECT;
  const bonus = percent === 100 ? XP.QUIZ_PERFECT_BONUS : 0;
  const total_xp = xpFromAnswers + bonus;
  const result = addXPAndSave(total_xp, { quizScores: { [`grade_${grade}`]: percent } });
  return { xpGained: total_xp, newBadges: result.newBadges };
}

export function recordMapVisit(siteId: number): { xpGained: number; newBadges: string[] } {
  const state = loadState();
  if (state.mapSitesVisited.includes(siteId)) return { xpGained: 0, newBadges: [] };
  const result = addXPAndSave(XP.MAP_VISIT, { mapSitesVisited: [siteId] });
  return { xpGained: result.xpGained, newBadges: result.newBadges };
}

export function recordMapAnswer(siteId: number): { xpGained: number; newBadges: string[] } {
  const state = loadState();
  if (state.mapAnswersViewed.includes(siteId)) return { xpGained: 0, newBadges: [] };
  const result = addXPAndSave(XP.MAP_ANSWER, { mapAnswersViewed: [siteId] });
  return { xpGained: result.xpGained, newBadges: result.newBadges };
}

export function recordSkillCompletion(skillId: string): { xpGained: number; newBadges: string[] } {
  const state = loadState();
  if (state.practicalSkillsCompleted.includes(skillId)) return { xpGained: 0, newBadges: [] };
  const result = addXPAndSave(XP.PRACTICAL_SKILL_DONE, { practicalSkillsCompleted: [skillId] });
  return { xpGained: result.xpGained, newBadges: result.newBadges };
}

// ---- LEADERBOARD MOCK DATA ----
export const MOCK_LEADERBOARD = [
  { name: "Nguyễn Minh Khoa", grade: 12, xp: 3120, avatar: "👨‍💼" },
  { name: "Trần Thị Lan Anh",  grade: 11, xp: 2850, avatar: "👩‍🎓" },
  { name: "Lê Hữu Phước",      grade: 12, xp: 2640, avatar: "👨‍🎓" },
  { name: "Phạm Thúy Hằng",    grade: 10, xp: 2100, avatar: "👩‍💼" },
  { name: "Võ Đức Thắng",      grade: 11, xp: 1980, avatar: "🧑‍🎓" },
  { name: "Đỗ Thị Kim Oanh",   grade: 12, xp: 1750, avatar: "👩‍🎓" },
  { name: "Bùi Văn Hải",       grade: 10, xp: 1520, avatar: "👨‍🎓" },
  { name: "Ngô Thị Mỹ Linh",   grade: 11, xp: 1380, avatar: "👩‍💼" },
  { name: "Huỳnh Quốc Bảo",    grade: 12, xp: 1200, avatar: "🧑‍💼" },
  { name: "Đinh Thị Thu Hà",   grade: 10, xp: 980,  avatar: "👩‍🎓" },
];
