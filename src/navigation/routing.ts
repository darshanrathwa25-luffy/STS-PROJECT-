import { useGeometryStore } from '../store/geometryStore';
import { STEPS, currentStepIndex, hashToStep, stepToHash } from '../content/chapters';

/** The address for what is on screen right now. */
function currentHash(): string {
  const s = useGeometryStore.getState();
  if (s.isLanding) return '#/';
  const step = STEPS[currentStepIndex(s.lab, s.world, s.disk.exploration)];
  return step ? stepToHash(step) : '#/';
}

/** Show whatever the address bar points at. Unknown addresses show the cover. */
function applyHash(): void {
  const step = hashToStep(window.location.hash);
  const store = useGeometryStore.getState();
  if (step) {
    store.goToStep(step);
  } else if (!store.isLanding) {
    store.setIsLanding(true);
  }
}

/**
 * Keep the address bar and the store in step, both ways. Each page change adds a
 * history entry, so the browser's Back and Forward buttons move between pages,
 * a refresh stays on the same page, and a page can be shared as a link.
 * Call once, before the first render.
 */
export function initRouting(): void {
  if (typeof window === 'undefined') return;

  applyHash();
  window.addEventListener('hashchange', applyHash);

  let last = currentHash();
  if (window.location.hash !== last) {
    history.replaceState(null, '', last);
  }

  // A page change can take several store updates (world, then lab). Write the address
  // once they have all landed, so the halfway state never becomes a history entry.
  let pending = false;
  useGeometryStore.subscribe(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      const next = currentHash();
      if (next !== last) {
        last = next;
        if (window.location.hash !== next) window.location.hash = next;
      }
    });
  });
}
