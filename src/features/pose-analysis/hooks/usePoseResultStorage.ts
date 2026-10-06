import { useEffect, useRef, useState } from 'react';
import { PoseResultSaver } from '../results/resultSaver';
import { savePoseResult } from '../results/poseResultsApi';

export function usePoseResultStorage() {
  const saver = useRef<PoseResultSaver | null>(null);
  if (!saver.current) saver.current = new PoseResultSaver(savePoseResult);
  const [, update] = useState(0);
  useEffect(() => saver.current!.subscribe(() => update(value => value + 1)), []);
  return saver.current;
}
