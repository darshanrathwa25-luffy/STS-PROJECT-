import { useGeometryStore } from './geometryStore';

// Discoveries, predictions, notes and the chosen mode survive a refresh. They are kept in this browser only.
const KEY = 'curvature-lab/progress/v1';

interface SavedProgress {
  solvedQuestions: Record<string, boolean>;
  reflectionText: string;
  mode: 'tutorial' | 'explorer';
  predictions: Record<string, string>;
  goalFlags: Record<string, Record<string, boolean>>;
}

const KEYS = ['solvedQuestions', 'reflectionText', 'mode', 'predictions', 'goalFlags'] as const;

function read(): Partial<SavedProgress> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedProgress>) : {};
  } catch {
    return {};
  }
}

function write(progress: SavedProgress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private window, blocked site data): progress just isn't saved
  }
}

/** Restore saved progress, then save whenever it changes. Call once, before the first render. */
export function initPersistence(): void {
  if (typeof window === 'undefined') return;

  const saved = read();
  const restored: Partial<SavedProgress> = {};
  if (saved.solvedQuestions && typeof saved.solvedQuestions === 'object') restored.solvedQuestions = saved.solvedQuestions;
  if (typeof saved.reflectionText === 'string') restored.reflectionText = saved.reflectionText;
  if (saved.mode === 'tutorial' || saved.mode === 'explorer') restored.mode = saved.mode;
  if (saved.predictions && typeof saved.predictions === 'object') restored.predictions = saved.predictions;
  if (saved.goalFlags && typeof saved.goalFlags === 'object') restored.goalFlags = saved.goalFlags;
  useGeometryStore.setState(restored);

  const pick = (st: ReturnType<typeof useGeometryStore.getState>): SavedProgress => ({
    solvedQuestions: st.solvedQuestions,
    reflectionText: st.reflectionText,
    mode: st.mode,
    predictions: st.predictions,
    goalFlags: st.goalFlags,
  });
  let last = pick(useGeometryStore.getState());
  useGeometryStore.subscribe((st) => {
    const next = pick(st);
    if (KEYS.some((k) => next[k] !== last[k])) {
      last = next;
      write(next);
    }
  });
}
