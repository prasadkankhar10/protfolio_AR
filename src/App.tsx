import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import type { KeyboardControlsEntry } from '@react-three/drei';
import { Suspense, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Scene } from './components/3d/Scene';
import { useGameStore } from './store/useGameStore';
import { DialogOverlay } from './components/ui/DialogOverlay';
import { MobileControls } from './components/ui/MobileControls';
import { RotateDeviceOverlay } from './components/ui/RotateDeviceOverlay';
import { PortfolioTracker } from './components/ui/PortfolioTracker';
import { ARButton, XR } from '@react-three/xr';

export const Controls = {
  forward: 'forward',
  back: 'back',
  left: 'left',
  right: 'right',
  jump: 'jump',
  run: 'run',
} as const;

export type ControlsType = keyof typeof Controls;

function App() {
  const toggleFreeCam = useGameStore((state) => state.toggleFreeCam);
  const toggleTracker = useGameStore((state) => state.toggleTracker);
  const hasStarted = useGameStore((state) => state.hasStarted);
  const setIsMobile = useGameStore((state) => state.setIsMobile);
  const isMobile = useGameStore((state) => state.isMobile);

  useEffect(() => {
    // Basic mobile detection based on pointer type (coarse = touch)
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsMobile(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [setIsMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.key.toLowerCase() === 'v') {
        toggleFreeCam();
      }
      if (e.key.toLowerCase() === 'm' || e.key === 'Tab') {
        e.preventDefault();
        const willOpen = !useGameStore.getState().isTrackerOpen;
        if (willOpen && document.pointerLockElement) {
          document.exitPointerLock();
        }
        toggleTracker();
      }
      if (e.key.toLowerCase() === 'y') {
        const gameStore = useGameStore.getState();
        if (!gameStore.activeRitual) {
          gameStore.setActiveRitual(true);
          gameStore.setRitualState('gathering');
        } else {
          // Pressing Y again cancels it for testing
          gameStore.setActiveRitual(false);
          gameStore.setRitualState('idle');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFreeCam, toggleTracker]);

  const map = useMemo<KeyboardControlsEntry<ControlsType>[]>(() => [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.run, keys: ['Shift'] },
  ], []);

  return (
    <KeyboardControls map={map}>
      <ARButton 
        sessionInit={{ 
          requiredFeatures: ['hit-test'], 
          optionalFeatures: ['dom-overlay'], 
          domOverlay: { root: document.body } 
        }} 
        style={{ 
          position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 9999, padding: '12px 24px', borderRadius: '8px', background: '#ec4899', color: 'white', 
          fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' 
        }}
      />
      <Layout />
      {hasStarted && <DialogOverlay />}
      {hasStarted && <MobileControls />}
      {hasStarted && <PortfolioTracker />}
      {isMobile && <RotateDeviceOverlay />}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], fov: 60 }}
          gl={{ antialias: true }}
          dpr={[1, 1.5]}
        >
          <XR>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </XR>
        </Canvas>
      </div>
    </KeyboardControls>
  );
}

export default App;
