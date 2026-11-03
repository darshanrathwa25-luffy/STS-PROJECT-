import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { TopBar, QuestionCard, DetailsDrawer, LandingScreen } from '../shell';
import { TriangleLabStage, TriangleHUD } from '../triangle-lab';
import { GeometryCanvas } from '../geometry/GeometryCanvas';
import { ParallelControls } from '../geometry/ParallelControls';

export const AppShell: React.FC = () => {
  const { isLanding, lab } = useGeometryStore();

  if (isLanding) {
    return <LandingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-paper text-ink">
      <TopBar />

      <main className="relative flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Figure */}
        <section className="relative flex-1 min-h-[56vh] lg:min-h-0">
          {lab === 'triangle' ? <TriangleLabStage /> : <GeometryCanvas />}
        </section>

        {/* Margin column: readout and the question for this world */}
        <aside className="shrink-0 lg:w-[360px] xl:w-[380px] border-t lg:border-t-0 lg:border-l border-rule bg-paper-raised lg:overflow-y-auto">
          {lab === 'triangle' ? <TriangleHUD /> : <ParallelControls />}
          <QuestionCard />
        </aside>

        <DetailsDrawer />
      </main>
    </div>
  );
};
