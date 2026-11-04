import React, { lazy } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { ParallelDiskView } from './ParallelDiskView';
import { Stage3D } from '../shell/Stage3D';

// Three.js is only fetched when the flat or sphere parallels page opens
const ParallelCanvas3D = lazy(() => import('./ParallelCanvas3D'));

/** The parallel-lines figure: the disk for the hyperbolic plane, 3D for the other two. */
export const GeometryCanvas: React.FC = () => {
  const world = useGeometryStore((s) => s.world);

  // The hyperbolic plane is shown flat, on the Poincaré disk
  if (world === 'hyperbolic') {
    return <ParallelDiskView />;
  }

  return (
    <Stage3D>
      <ParallelCanvas3D />
    </Stage3D>
  );
};
