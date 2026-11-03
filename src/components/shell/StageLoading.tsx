import React from 'react';

/** Shown in the figure area while a 3D page's code downloads. */
export const StageLoading: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-paper">
    <p className="text-[13px] text-ink-muted">Loading the 3D view…</p>
  </div>
);
