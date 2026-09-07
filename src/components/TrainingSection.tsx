import { useState } from "react";
import { Move, Target, Accessibility, HeartPulse, Flame, Stethoscope, ChevronDown, ChevronUp, Users, Compass, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PRACTICAL_SKILLS } from "../data/practicalSkills";
import StepByStepModule from "./training/StepByStepModule";
import Tactical3DSimulation from "./training/Tactical3DSimulation";

const iconMap: Record<string, any> = {
  Move, Target, Accessibility, HeartPulse, Flame, Stethoscope, Users, Compass, Eye
};

export default function TrainingSection() {
  const [activeSubTab, setActiveSubTab] = useState<string>("3d-drill");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeSkill = PRACTICAL_SKILLS.find(s => s.id === activeSubTab);

  return (
    <div className="flex flex-col bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      {/* ── TOP SWITCHER BAR ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center font-bold">
            3D
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
              Huấn Luyện Thao Trường & Mô Phỏng 3D
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Mô phỏng điều lệnh đội ngũ, tư thế vận động chiến đấu & kỹ năng dã chiến
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
          <button
            onClick={() => setActiveSubTab("3d-drill")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "3d-drill"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mô phỏng 3D Trực quan</span>
          </button>

          <button
            onClick={() => setActiveSubTab("crawl")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab !== "3d-drill"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Kỹ năng & Bài tập SGK</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT BODY ── */}
      {activeSubTab === "3d-drill" ? (
        <Tactical3DSimulation />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT SIDEBAR FOR PRACTICAL SKILLS */}
          <aside className="lg:w-[260px] shrink-0 flex flex-col gap-2">
            {PRACTICAL_SKILLS.map((item) => {
              const Icon = iconMap[item.iconName] || Target;
              const isSelected = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex gap-3 items-start group ${
                    isSelected
                      ? "bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600 shadow-md"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-emerald-300 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-emerald-300" : "text-slate-400 group-hover:text-emerald-500"}`} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide leading-none">{item.name}</h4>
                    <p className={`text-[10px] mt-1 leading-tight ${isSelected ? "text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* RIGHT: STEP BY STEP SKILL MODULE */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {PRACTICAL_SKILLS.map(skill => (
                  skill.id === activeSubTab && <StepByStepModule key={skill.id} skill={skill} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
