import { useEffect } from 'react';
import { useGeometryStore } from '../store/geometryStore';
import { findQuestion } from '../content/questions';
import { GOALS } from './goals';

/**
 * Watches the page on screen and records a discovery when its goal is met.
 * Runs in both modes, so the Contents ticks and findings table fill in either way.
 * Renders nothing; mount it once.
 */
export function GoalRunner(): null {
  useEffect(() => {
    const check = () => {
      const s = useGeometryStore.getState();
      if (s.isLanding) return;
      const q = findQuestion(s.lab, s.world, s.disk.exploration);
      if (!q || s.solvedQuestions[q.id]) return;
      // In the tutorial, the goal only counts once a prediction has been made
      if (s.mode === 'tutorial' && !s.predictions[q.id]) return;
      const goal = GOALS[q.id];
      if (!goal) return;
      const flags = s.goalFlags[q.id] ?? {};
      const result = goal(s, flags);
      if (result.flags && Object.entries(result.flags).some(([k, v]) => flags[k] !== v)) {
        s.setGoalFlags(q.id, result.flags);
      }
      if (result.met) s.markQuestionSolved(q.id, true);
    };
    check();
    return useGeometryStore.subscribe(check);
  }, []);
  return null;
}
