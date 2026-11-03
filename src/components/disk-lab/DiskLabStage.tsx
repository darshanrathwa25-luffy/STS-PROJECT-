import React, { useEffect } from 'react';
import { useGeometryStore, DiskExploration } from '../../store/geometryStore';
import { WalkFigure, TilesFigure, TilingFigure, PolygonFigure } from './figures';

/** Hyperbolic length of one step, and the angle of one turn. */
export const WALK_STEP = 0.25;
export const WALK_TURN = Math.PI / 12;

const HINTS: Record<DiskExploration, React.ReactNode> = {
  walk: (
    <>
      <Kbd>↑</Kbd> step forward, <Kbd>↓</Kbd> step back, <Kbd>←</Kbd> <Kbd>→</Kbd> turn. The faint rings are 1, 2, 3… units from the centre.
    </>
  ),
  tiles: <>Every tile is the same size and shape. They only look smaller because of the map.</>,
  tiling: <>Drag anywhere to slide the whole plane. The red tile is home.</>,
  polygon: <>Click inside the disk to add a corner (up to 8). Drag a corner to move it.</>,
};

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="font-mono text-[11px] px-1 border border-rule rounded-sm bg-paper-raised">{children}</kbd>;
}

export const DiskLabStage: React.FC = () => {
  const disk = useGeometryStore((s) => s.disk);
  const { diskWalk, diskTurn } = useGeometryStore();
  const { exploration } = disk;

  // Keyboard walking
  useEffect(() => {
    if (exploration !== 'walk') return;
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowUp') diskWalk(WALK_STEP);
      else if (e.key === 'ArrowDown') diskWalk(-WALK_STEP);
      else if (e.key === 'ArrowLeft') diskTurn(WALK_TURN);
      else if (e.key === 'ArrowRight') diskTurn(-WALK_TURN);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exploration, diskWalk, diskTurn]);

  return (
    <div className="absolute inset-0 bg-paper overflow-hidden select-none">
      <div className="absolute inset-0 flex items-center justify-center p-4 pb-10">
        <div className="h-full max-w-full aspect-square">
          {exploration === 'walk' && <WalkFigure />}
          {exploration === 'tiles' && <TilesFigure />}
          {exploration === 'tiling' && <TilingFigure />}
          {exploration === 'polygon' && <PolygonFigure />}
        </div>
      </div>
      <p className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none text-[12px] text-ink-muted">{HINTS[exploration]}</p>
    </div>
  );
};
