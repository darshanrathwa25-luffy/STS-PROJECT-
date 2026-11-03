import React, { Suspense, lazy, useEffect } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { FlatTriangleView } from './FlatTriangleView';
import { StageLoading } from '../shell/StageLoading';

// Three.js is only fetched when a sphere or saddle page opens
const TriangleCanvas3D = lazy(() => import('./TriangleCanvas3D'));

export const TriangleLabStage: React.FC = () => {
  const { world, cycleSelectedVertex, nudgeSelectedVertex } = useGeometryStore();

  // Keyboard navigation: Tab to cycle vertices, Arrow keys to nudge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in reflection notes or an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        cycleSelectedVertex(e.shiftKey);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelectedVertex(0, 0.05);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelectedVertex(0, -0.05);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelectedVertex(-0.05, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelectedVertex(0.05, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleSelectedVertex, nudgeSelectedVertex]);


  return (
    <div className="absolute inset-0 bg-paper overflow-hidden select-none">
      {/* World Stage Display */}
      {world === 'flat' ? (
        // 1. Flat Euclidean World: Pure SVG Top-Down Renderer
        <FlatTriangleView />
      ) : (
        // 2 & 3. Sphere and saddle, drawn in 3D
        <Suspense fallback={<StageLoading />}>
          <TriangleCanvas3D />
        </Suspense>
      )}

      {/* Interaction hint */}
      <p className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none hidden md:block text-[12px] text-ink-muted">
        Drag a corner{world !== 'flat' && ', or drag the background to turn the view'}.{' '}
        <kbd className="font-mono text-[11px] px-1 border border-rule rounded-sm bg-paper-raised">Tab</kbd> picks a corner,{' '}
        <kbd className="font-mono text-[11px] px-1 border border-rule rounded-sm bg-paper-raised">←↑→↓</kbd> nudge it.
      </p>
    </div>
  );
};
