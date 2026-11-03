import React from 'react';
import { useGeometryStore, WorldKind, LabKind } from '../../store/geometryStore';
import { Volume2, VolumeX, RotateCcw, PanelRight } from 'lucide-react';
import { worldColor } from '../../theme/palette';
import { ByrneMark } from './ByrneMark';

const worlds: { id: WorldKind; label: string; curvature: string }[] = [
  { id: 'flat', label: 'Flat', curvature: 'K = 0' },
  { id: 'sphere', label: 'Sphere', curvature: 'K > 0' },
  { id: 'hyperbolic', label: 'Saddle', curvature: 'K < 0' },
];

const labs: { id: LabKind; label: string; title: string }[] = [
  { id: 'triangle', label: 'Triangles', title: 'Triangle lab: angle sums and curvature' },
  { id: 'parallel', label: 'Parallels', title: "Parallel lines lab: Euclid's fifth postulate" },
];

const iconButton =
  'inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors';

export const TopBar: React.FC = () => {
  const {
    world,
    setWorld,
    lab,
    setLab,
    appMode,
    setAppMode,
    soundEnabled,
    setSoundEnabled,
    resetLab,
    detailsOpen,
    setDetailsOpen,
    setIsLanding,
  } = useGeometryStore();

  const worldSwitcher = (fill = false) =>
    appMode !== 'compare' ? (
      <nav
        aria-label="Geometry World Selector"
        className={`flex items-center rounded-lg border border-rule bg-paper-raised p-0.5 ${fill ? 'w-full' : ''}`}
      >
        {worlds.map((w) => {
          const active = world === w.id;
          return (
            <button
              key={w.id}
              onClick={() => setWorld(w.id)}
              aria-pressed={active}
              aria-label={`Switch to ${w.id === 'hyperbolic' ? 'Hyperbolic' : w.label} world`}
              className={`flex items-center justify-center gap-2 px-3 h-8 rounded-md text-[13px] transition-colors ${
                fill ? 'flex-1' : ''
              } ${active ? 'bg-paper-sunk text-ink font-medium' : 'text-ink-muted hover:text-ink'}`}
            >
              <span
                className="w-2.5 h-2.5 shrink-0"
                style={{ background: worldColor[w.id], opacity: active ? 1 : 0.55 }}
                aria-hidden="true"
              />
              <span>{w.label}</span>
              <span className="hidden lg:inline font-mono text-[11px] text-ink-muted">{w.curvature}</span>
            </button>
          );
        })}
      </nav>
    ) : null;

  return (
    <header className="shrink-0 border-b border-rule bg-paper px-3 sm:px-5 z-30 select-none">
      <div className="h-14 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3">
      {/* Wordmark */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => setIsLanding(true)}
          className="flex items-center gap-2.5 rounded-md -m-1 p-1 min-w-0"
          title="Back to the introduction"
          aria-label="Return to Introduction / Landing"
        >
          <ByrneMark className="w-6 h-6 shrink-0" />
          <span className="font-serif text-[19px] leading-none text-ink whitespace-nowrap hidden xl:inline">
            Curvature Lab
          </span>
        </button>

        <nav aria-label="Lab" className="flex items-center gap-1 xl:border-l xl:border-rule xl:pl-4">
          {labs.map((l) => {
            const active = lab === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLab(l.id)}
                title={l.title}
                aria-pressed={active}
                className={`px-2 py-1 text-[13px] rounded-md transition-colors ${
                  active ? 'text-ink font-medium bg-paper-sunk' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* World switcher (second row on small screens) */}
      <div className="hidden md:block">{worldSwitcher()}</div>

      {/* Tools */}
      <div className="flex items-center justify-end gap-1">
        <div className="hidden xl:flex items-center mr-2 text-[12px]">
          {(['explore', 'compare'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setAppMode(m)}
              aria-pressed={appMode === m}
              className={`px-2 py-1 rounded-md capitalize transition-colors ${
                appMode === m ? 'text-ink font-medium' : 'text-ink-faint hover:text-ink-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button onClick={resetLab} className={iconButton} title="Reset the lab" aria-label="Reset Lab">
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`${iconButton} ${soundEnabled ? 'text-blue' : ''}`}
          title={soundEnabled ? 'Mute sound' : 'Turn sound on'}
          aria-label={soundEnabled ? 'Mute Audio' : 'Unmute Sound'}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className={`ml-1 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[13px] border transition-colors ${
            detailsOpen
              ? 'border-ink text-ink bg-paper-sunk'
              : 'border-rule text-ink-soft hover:text-ink hover:border-rule-strong'
          }`}
          title="Show the maths and history notes"
          aria-label="Toggle Math & STS Details Drawer"
          aria-expanded={detailsOpen}
        >
          <PanelRight className="w-4 h-4" />
          <span className="hidden sm:inline">Notes</span>
        </button>
      </div>
      </div>

      <div className="md:hidden pb-2">{worldSwitcher(true)}</div>
    </header>
  );
};
