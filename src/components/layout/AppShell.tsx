import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { TopBar, QuestionCard, DetailsDrawer, LandingScreen, PageBar, ReflectionPage } from '../shell';
import { TriangleLabStage, TriangleHUD } from '../triangle-lab';
import { GeometryCanvas } from '../geometry/GeometryCanvas';
import { ParallelControls } from '../geometry/ParallelControls';
import { DiskLabStage, DiskLabPanel } from '../disk-lab';

export const AppShell: React.FC = () => {
  const { isLanding, lab } = useGeometryStore();

  if (isLanding) {
    return <LandingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-paper text-ink">
      <TopBar />
      <PageBar />

      <main className="relative flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {lab === 'reflection' ? (
          <section className="relative flex-1 min-h-[70vh] lg:min-h-0">
            <ReflectionPage />
          </section>
        ) : (
          <>
            {/* Figure */}
            <section className="relative flex-1 min-h-[56vh] lg:min-h-0">
              {lab === 'triangle' ? <TriangleLabStage /> : lab === 'disk' ? <DiskLabStage /> : <GeometryCanvas />}
            </section>

            {/* Margin column: readout and the question for this view */}
            <aside className="shrink-0 lg:w-[360px] xl:w-[380px] border-t lg:border-t-0 lg:border-l border-rule bg-paper-raised lg:overflow-y-auto">
              {lab === 'triangle' ? <TriangleHUD /> : lab === 'disk' ? <DiskLabPanel /> : <ParallelControls />}
              <QuestionCard />
            </aside>
          </>
        )}

        <DetailsDrawer />
      </main>
    </div>
  );
};
