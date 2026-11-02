import React, { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useGeometryStore } from './store/geometryStore';

export function App() {
  const { loadExperiment, experiment } = useGeometryStore();

  useEffect(() => {
    // Initial experiment setup
    loadExperiment(experiment);
  }, []);

  return <AppShell />;
}

export default App;
