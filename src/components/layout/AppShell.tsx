import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { TopBar, QuestionCard, DetailsDrawer, LandingScreen } from '../shell';
import { GeometryCanvas } from '../geometry/GeometryCanvas';

export const AppShell: React.FC = () => {
  const { isLanding } = useGeometryStore();

  if (isLanding) {
    return <LandingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090A0D] text-[#E8EAF0]">
      {/* Top Bar Navigation */}
      <TopBar />

      {/* Full-bleed Interactive Stage */}
      <main className="flex-1 relative h-full overflow-hidden">
        <GeometryCanvas />
        <QuestionCard />
        <DetailsDrawer />
      </main>
    </div>
  );
};
