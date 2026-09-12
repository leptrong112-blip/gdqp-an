import { GradeLevel } from '../types';
import { DETAILED_LESSONS_10 } from './lessonsDetailGrade10';
import { DETAILED_LESSONS_11 } from './lessonsDetailGrade11';
import { DETAILED_LESSONS_12 } from './lessonsDetailGrade12';

export interface DetailedSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: {
    subtitle: string;
    paragraphs?: string[];
    bullets?: string[];
    highlight?: string;
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  tipBox?: {
    title: string;
    content: string;
  };
  highlight?: string;
}

export interface QuickReviewQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface DetailedLesson {
  id: string;
  order: string;
  title: string;
  grade: GradeLevel;
  textbook: string;
  estimatedTime: string;
  objectives: {
    knowledge: string[];
    skills: string[];
    attitudes: string[];
  };
  sections: DetailedSection[];
  keyTakeaways: string[];
  practicalApplication: string[];
  reviewQuestions: QuickReviewQuestion[];
}

export { DETAILED_LESSONS_10 } from './lessonsDetailGrade10';
export { DETAILED_LESSONS_11 } from './lessonsDetailGrade11';
export { DETAILED_LESSONS_12 } from './lessonsDetailGrade12';

export const ALL_DETAILED_LESSONS: Record<GradeLevel, DetailedLesson[]> = {
  10: DETAILED_LESSONS_10,
  11: DETAILED_LESSONS_11,
  12: DETAILED_LESSONS_12,
};
