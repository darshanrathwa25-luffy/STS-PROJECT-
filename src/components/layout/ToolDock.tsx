import React from 'react';
import { useGeometryStore, ToolType } from '../../store/geometryStore';
import {
  MousePointer2,
  PlusCircle,
  Activity,
  Triangle,
  Ruler,
  Trash2,
} from 'lucide-react';

export const ToolDock: React.FC = () => {
  const { tool, setTool, clearAll } = useGeometryStore();

  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select & Move', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'point', label: 'Add Point', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'geodesic', label: 'Geodesic', icon: <Activity className="w-4 h-4" /> },
    { id: 'polygon', label: 'Triangle', icon: <Triangle className="w-4 h-4" /> },
    { id: 'measure', label: 'Measure', icon: <Ruler className="w-4 h-4" /> },
  ];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 select-none">
      <div className="bg-[#12141A]/95 backdrop-blur-md border border-[#292C35] rounded-xl p-1.5 shadow-panel flex items-center gap-1">
        {tools.map((t) => {
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 shadow-glow-accent font-semibold'
                  : 'text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/70'
              }`}
              title={t.label}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}

        <div className="w-[1px] h-5 bg-[#292C35] mx-1" />

        <button
          onClick={clearAll}
          className="p-2 rounded-lg text-[#858B9A] hover:text-rose-400 hover:bg-[#181B22]/70 transition"
          title="Clear construction points"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

