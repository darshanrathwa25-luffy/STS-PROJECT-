import React, { Suspense, lazy } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { FlatCircleView } from './FlatCircleView';
import { CirclesFigure } from '../disk-lab/figures';
import { StageLoading } from '../shell/StageLoading';

// Three.js is only fetched when the sphere page opens
const SphereCircleCanvas = lazy(() => import('./SphereCircleCanvas'));

export const CircleLabStage: React.FC = () => {
  const world = useGeometryStore((s) => s.world);

  if (world === 'flat') return <FlatCircleView />;

  if (world === 'sphere') {
    return (
      <Suspense fallback={<StageLoading />}>
        <SphereCircleCanvas />
      </Suspense>
    );
  }

  return (
    <div className="absolute inset-0 bg-paper select-none">
      <div className="absolute inset-0 flex items-center justify-center p-4 pb-10">
        <div className="h-full max-w-full aspect-square">
          <CirclesFigure />
        </div>
      </div>
      <p className="absolute bottom-3 left-4 right-4 pointer-events-none text-[12px] text-ink-muted">
        Drawn on the Poincaré disk. Drag the dot to move the circle: the same circle is drawn smaller near the rim.
      </p>
    </div>
  );
};
