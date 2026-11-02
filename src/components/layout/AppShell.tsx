import React from 'react';
import { TopNavigation } from './TopNavigation';
import { ControlPanel } from './ControlPanel';
import { GeometryCanvas } from '../geometry/GeometryCanvas';

export const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090A0D] text-[#E8EAF0]">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Interactive Canvas */}
        <main className="flex-1 relative h-full overflow-hidden">
          <GeometryCanvas />
        </main>

        {/* Right Contextual Control Panel */}
        <ControlPanel />
      </div>
    </div>
  );
};
