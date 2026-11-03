import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { questionById } from '../../content/questions';
import { worldColor } from '../../theme/palette';

const WORLD_ROWS = [
  { world: 'flat' as const, label: 'Flat plane', angles: 'tri_flat', parallels: 'par_flat', circles: 'circ_flat' },
  { world: 'sphere' as const, label: 'Sphere', angles: 'tri_sphere', parallels: 'par_sphere', circles: 'circ_sphere' },
  { world: 'hyperbolic' as const, label: 'Saddle', angles: 'tri_hyperbolic', parallels: 'par_hyperbolic', circles: 'circ_hyperbolic' },
];

const DISK_ROWS = ['disk_walk', 'disk_tiles', 'disk_tiling', 'disk_polygon'];

/** What the student has found so far. Cells fill in as questions are marked observed. */
export const FindingsTable: React.FC = () => {
  const solved = useGeometryStore((s) => s.solvedQuestions);

  const cell = (id: string) =>
    solved[id] ? (
      <span className="text-ink">{questionById(id)?.finding}</span>
    ) : (
      <span className="text-ink-faint">not yet</span>
    );

  return (
    <div className="space-y-5">
      <table className="w-full text-[14px] table-fixed">
        <thead>
          <tr className="text-left text-[12px] text-ink-muted">
            <th className="font-normal pb-2 w-[25%]" />
            <th className="font-normal pb-2 pr-2">Triangle angles add up to</th>
            <th className="font-normal pb-2 pr-2">Lines through P that miss L</th>
            <th className="font-normal pb-2">Distance around a circle</th>
          </tr>
        </thead>
        <tbody>
          {WORLD_ROWS.map((r) => (
            <tr key={r.world} className="border-t border-rule align-top">
              <th scope="row" className="font-normal text-left py-2 pr-2">
                <span className="inline-flex items-center gap-2 text-ink-soft">
                  <span className="w-2.5 h-2.5 shrink-0" style={{ background: worldColor[r.world] }} aria-hidden="true" />
                  {r.label}
                </span>
              </th>
              <td className="py-2 pr-2">{cell(r.angles)}</td>
              <td className="py-2 pr-2">{cell(r.parallels)}</td>
              <td className="py-2">{cell(r.circles)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <div className="text-[12px] text-ink-muted">On the hyperbolic plane (the disk)</div>
        <ul className="mt-1 divide-y divide-rule border-y border-rule">
          {DISK_ROWS.map((id) => (
            <li key={id} className="flex items-baseline justify-between gap-3 py-2 text-[14px]">
              <span className="text-ink-soft">{questionById(id)?.title}</span>
              <span className="text-right">{cell(id)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
