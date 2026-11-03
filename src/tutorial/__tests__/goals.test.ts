import { describe, it, expect, beforeEach } from 'vitest';
import { useGeometryStore } from '../../store/geometryStore';
import { GOALS } from '../goals';
import { QUESTIONS } from '../../content/questions';

describe('Tutorial goals', () => {
  beforeEach(() => useGeometryStore.getState().resetLab());

  it('every question has a goal and a prediction with a valid answer', () => {
    for (const q of QUESTIONS) {
      expect(GOALS[q.id], q.id).toBeDefined();
      expect(q.predict.options.map((o) => o.id)).toContain(q.predict.answer);
    }
  });

  it('no goal is already met by the state a page starts in', () => {
    const s = useGeometryStore.getState();
    for (const q of QUESTIONS) {
      expect(GOALS[q.id](s, {}).met, q.id).toBe(false);
    }
  });

  it('goals are met by doing the thing', () => {
    const st = useGeometryStore.getState();
    // Flat: a long thin triangle
    st.updateFlatVertex('p3', { x: 0, y: -0.45 });
    expect(GOALS.tri_flat(useGeometryStore.getState(), {}).met).toBe(true);
    // Parallels: tilt, then level again
    st.setCandidateAngle(20);
    const r = GOALS.par_flat(useGeometryStore.getState(), {});
    expect(r.met).toBe(false);
    st.setCandidateAngle(0);
    expect(GOALS.par_flat(useGeometryStore.getState(), r.flags ?? {}).met).toBe(true);
    // Circles and walking
    st.setDiskCircle({ r: 3 });
    expect(GOALS.disk_circles(useGeometryStore.getState(), {}).met).toBe(true);
    for (let i = 0; i < 20; i++) st.diskWalk(0.25);
    expect(GOALS.disk_walk(useGeometryStore.getState(), {}).met).toBe(true);
  });
});
