import React from 'react';
import { TopNavigation } from './TopNavigation';
import { ControlPanel } from './ControlPanel';
import { ToolDock } from './ToolDock';
import { GeometryCanvas } from '../geometry/GeometryCanvas';
import { CompareView } from '../geometry/CompareView';
import { StsLensView } from '../sts/StsLensView';
import { useGeometryStore } from '../../store/geometryStore';

export const AppShell: React.FC = () => {
  const { mode, appSection } = useGeometryStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090A0D] text-[#E8EAF0]">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {appSection === 'sts' ? (
          <StsLensView />
        ) : (
          <>
            {/* Main 3D Viewport */}
            <main className="flex-1 relative h-full overflow-hidden">
              {mode === 'explore' ? <GeometryCanvas /> : <CompareView />}
              <ToolDock />
            </main>

            {/* Right Control Panel */}
            <ControlPanel />
          </>
        )}
      </div>
    </div>
  );
};
