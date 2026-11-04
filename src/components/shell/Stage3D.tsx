import React, { Suspense } from 'react';
import { StageLoading } from './StageLoading';

/** Whether this browser can start WebGL at all. Checked once; the answer doesn't change. */
let webglCache: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement('canvas');
    webglCache = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

type Problem = 'no-webgl' | 'failed';

const StageProblem: React.FC<{ problem: Problem; onRetry?: () => void }> = ({ problem, onRetry }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-paper p-6">
    <div className="max-w-sm text-center">
      <p className="font-serif text-[18px] text-ink">
        {problem === 'no-webgl' ? 'This figure needs 3D graphics' : 'The 3D view didn’t load'}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        {problem === 'no-webgl'
          ? 'Your browser couldn’t start WebGL. Turning on hardware acceleration in its settings, or trying another browser, usually fixes it. The flat-plane and Poincaré-disk pages work without it.'
          : 'Something went wrong while drawing it, or the page lost its connection. The rest of the site still works.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-[13px] px-3 py-1.5 border border-rule-strong rounded-sm bg-paper-raised text-ink hover:bg-paper-sunk"
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

type BoundaryState = { failed: boolean; attempt: number; chunkFailed: boolean };

class Stage3DBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false, attempt: 0, chunkFailed: false };

  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    // React.lazy remembers a failed download, so that case needs a page reload to retry
    const msg = error instanceof Error ? error.message : String(error);
    return { failed: true, chunkFailed: /dynamically imported module|Loading chunk|Importing a module script/i.test(msg) };
  }

  componentDidCatch(error: unknown) {
    console.error('3D view failed:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <StageProblem
          problem="failed"
          onRetry={() =>
            this.state.chunkFailed
              ? window.location.reload()
              : this.setState((s) => ({ failed: false, chunkFailed: false, attempt: s.attempt + 1 }))
          }
        />
      );
    }
    // Keyed so "Try again" mounts a fresh canvas
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

/**
 * Wraps a lazily loaded 3D figure: a loading note while its code downloads,
 * and a plain explanation instead of a blank stage if WebGL is missing or the figure crashes.
 */
export const Stage3D: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!hasWebGL()) return <StageProblem problem="no-webgl" />;
  return (
    <Stage3DBoundary>
      <Suspense fallback={<StageLoading />}>{children}</Suspense>
    </Stage3DBoundary>
  );
};
