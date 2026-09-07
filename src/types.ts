export type GradeLevel = 10 | 11 | 12;

export interface Lesson {
  id: string;
  title: string;
  grade: GradeLevel;
  topic: string;
  description: string;
  importance: string;
  content: {
    sectionTitle: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
}

export interface AKPartDisassembly {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  correctStep: number; // 1-based order
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ShootingAttempt {
  id: string;
  horizontalOffset: number; // -50 to 50
  verticalOffset: number; // -50 to 50
  sightAlignmentError: {
    x: number; // Lệch trái/phải
    y: number; // Lệch trên/dưới
  };
  score: number; // 0 to 10
  feedback: string;
  timestamp: string;
}
