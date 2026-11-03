import { useGeometryStore } from './geometryStore';

// Discoveries and notes survive a refresh. They are kept in this browser only.
const KEY = 'curvature-lab/progress/v1';

interface SavedProgress {
  solvedQuestions: Record<string, boolean>;
  reflectionText: string;
}

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
  useGeometryStore.setState({
    ...(saved.solvedQuestions && typeof saved.solvedQuestions === 'object' ? { solvedQuestions: saved.solvedQuestions } : {}),
    ...(typeof saved.reflectionText === 'string' ? { reflectionText: saved.reflectionText } : {}),
  });

  let { solvedQuestions, reflectionText } = useGeometryStore.getState();
  useGeometryStore.subscribe((s) => {
    if (s.solvedQuestions !== solvedQuestions || s.reflectionText !== reflectionText) {
      ({ solvedQuestions, reflectionText } = s);
      write({ solvedQuestions, reflectionText });
    }
  });
}
