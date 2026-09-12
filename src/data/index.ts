export * from "./lessons10";
export * from "./lessons11";
export * from "./lessons12";
export * from "./quiz";
export * from "./questionBank";
export * from "./disassembly";
export * from "./practicalSkills";

import { Lesson } from "../types";
import { LESSONS_10 } from "./lessons10";
import { LESSONS_11 } from "./lessons11";
import { LESSONS_12 } from "./lessons12";

export const GDQP_LESSONS: Lesson[] = [
  ...LESSONS_10,
  ...LESSONS_11,
  ...LESSONS_12
];
