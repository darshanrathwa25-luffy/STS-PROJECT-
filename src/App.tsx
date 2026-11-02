import React, { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useGeometryStore } from './store/geometryStore';

export function App() {
  const { loadPreset, preset } = useGeometryStore();

  useEffect(() => {
    // Initial preset setup
    loadPreset(preset);
  }, []);

  return <AppShell />;
}

export default App;

