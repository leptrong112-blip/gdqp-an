import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  GamificationState,
  Rank,
  Badge,
  BADGES,
  loadState,
  getRankFromXP,
  getNextRank,
  getXPProgress,
  markLessonRead as apiMarkLessonRead,
  recordQuizScore as apiRecordQuizScore,
  recordMapVisit as apiRecordMapVisit,
  recordMapAnswer as apiRecordMapAnswer,
  recordSkillCompletion as apiRecordSkillCompletion,
  fireXPToast as apiFireXPToast,
} from "../gamification";

export interface XPToastItem {
  id: number;
  amount: number;
  label?: string;
}

export interface GamificationContextType {
  state: GamificationState;
  rank: Rank;
  nextRank: Rank | null;
  xpProgress: { current: number; needed: number; percent: number };
  xpToasts: XPToastItem[];
  unlockedBadgeToasts: Badge[];
  markLessonRead: (lessonId: string) => { xpGained: number; newBadges: string[] };
  recordQuizScore: (grade: number, correctCount: number, total: number) => { xpGained: number; newBadges: string[] };
  recordMapVisit: (siteId: number) => { xpGained: number; newBadges: string[] };
  recordMapAnswer: (siteId: number) => { xpGained: number; newBadges: string[] };
  recordSkillCompletion: (skillId: string) => { xpGained: number; newBadges: string[] };
  fireXPToast: (amount: number, label?: string) => void;
  removeXPToast: (id: number) => void;
  removeBadgeToast: (badgeId: string) => void;
  refreshState: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(() => loadState());
  const [xpToasts, setXpToasts] = useState<XPToastItem[]>([]);
  const [unlockedBadgeToasts, setUnlockedBadgeToasts] = useState<Badge[]>([]);

  const refreshState = useCallback(() => {
    setState(loadState());
  }, []);

  const rank = getRankFromXP(state.xp);
  const nextRank = getNextRank(rank.level);
  const xpProgress = getXPProgress(state.xp);

  useEffect(() => {
    const handleXPUpdated = () => {
      refreshState();
    };

    const handleXPToast = (e: Event) => {
      const customEv = e as CustomEvent<{ id: number; amount: number; label?: string }>;
      if (customEv.detail) {
        const toast = customEv.detail;
        setXpToasts(prev => [...prev, toast]);
        setTimeout(() => {
          setXpToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 2500);
      }
    };

    const handleBadgeUnlocked = (e: Event) => {
      const customEv = e as CustomEvent<{ ids: string[] }>;
      if (customEv.detail?.ids) {
        const badgesToAdd = BADGES.filter(b => customEv.detail.ids.includes(b.id));
        setUnlockedBadgeToasts(prev => [...prev, ...badgesToAdd]);
      }
    };

    window.addEventListener("gqd_xp_updated", handleXPUpdated);
    window.addEventListener("gqd_xp_toast", handleXPToast);
    window.addEventListener("gqd_badge_unlocked", handleBadgeUnlocked);

    return () => {
      window.removeEventListener("gqd_xp_updated", handleXPUpdated);
      window.removeEventListener("gqd_xp_toast", handleXPToast);
      window.removeEventListener("gqd_badge_unlocked", handleBadgeUnlocked);
    };
  }, [refreshState]);

  const markLessonRead = useCallback((lessonId: string) => {
    const res = apiMarkLessonRead(lessonId);
    refreshState();
    return res;
  }, [refreshState]);

  const recordQuizScore = useCallback((grade: number, correctCount: number, total: number) => {
    const res = apiRecordQuizScore(grade, correctCount, total);
    refreshState();
    return res;
  }, [refreshState]);

  const recordMapVisit = useCallback((siteId: number) => {
    const res = apiRecordMapVisit(siteId);
    refreshState();
    return res;
  }, [refreshState]);

  const recordMapAnswer = useCallback((siteId: number) => {
    const res = apiRecordMapAnswer(siteId);
    refreshState();
    return res;
  }, [refreshState]);

  const recordSkillCompletion = useCallback((skillId: string) => {
    const res = apiRecordSkillCompletion(skillId);
    refreshState();
    return res;
  }, [refreshState]);

  const fireXPToast = useCallback((amount: number, label?: string) => {
    apiFireXPToast(amount, label);
  }, []);

  const removeXPToast = useCallback((id: number) => {
    setXpToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const removeBadgeToast = useCallback((badgeId: string) => {
    setUnlockedBadgeToasts(prev => prev.filter(b => b.id !== badgeId));
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        state,
        rank,
        nextRank,
        xpProgress,
        xpToasts,
        unlockedBadgeToasts,
        markLessonRead,
        recordQuizScore,
        recordMapVisit,
        recordMapAnswer,
        recordSkillCompletion,
        fireXPToast,
        removeXPToast,
        removeBadgeToast,
        refreshState,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
};
