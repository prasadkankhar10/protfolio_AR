import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Leva } from 'leva';

export const HUD = () => {
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const isMobile = useGameStore((state) => state.isMobile);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(!!document.pointerLockElement);
      if (!document.pointerLockElement && gameState === 'playing' && !useGameStore.getState().debugMenuOpen) {
        setGameState('menu');
      }
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [gameState, setGameState]);

  const debugMenuOpen = useGameStore((state) => state.debugMenuOpen);
  const setDebugMenuOpen = useGameStore((state) => state.setDebugMenuOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        const willOpen = !useGameStore.getState().debugMenuOpen;
        setDebugMenuOpen(willOpen);
        if (willOpen && document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDebugMenuOpen]);

  const requestLock = () => {
    document.body.requestPointerLock();
  };

  if (gameState !== 'playing') return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between" style={{ pointerEvents: (isLocked || isMobile) ? 'none' : 'auto' }}>
      
      {!isLocked && !debugMenuOpen && !isMobile && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer z-50"
          onClick={requestLock}
        >
          <div className="bg-stone-900 border border-amber-500/50 p-8 text-center animate-pulse">
            <p className="text-amber-500 text-xl tracking-widest uppercase font-serif mb-2">Click to Play</p>
            <p className="text-stone-400 text-sm">Lock mouse to look around</p>
          </div>
        </div>
      )}
      
      {!isLocked && debugMenuOpen && !isMobile && (
        <div 
          className="absolute inset-0 cursor-pointer z-0"
          onClick={requestLock}
        >
          {/* Clickable background to re-lock pointer when in debug mode */}
        </div>
      )}

      {/* Removed Crosshair as per user request */}

      {!isMobile && (
        <div className="p-6 flex flex-col gap-2">
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10 w-fit">
            <span className="text-stone-300 font-mono text-sm tracking-wider uppercase">
              <span className="text-amber-500 font-bold">W A S D</span> Move
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10 w-fit">
            <span className="text-stone-300 font-mono text-sm tracking-wider uppercase">
              <span className="text-amber-500 font-bold">Shift</span> Run
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10 w-fit">
            <span className="text-stone-300 font-mono text-sm tracking-wider uppercase">
              <span className="text-amber-500 font-bold">Scroll</span> Zoom
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10 w-fit">
            <span className="text-stone-300 font-mono text-sm tracking-wider uppercase">
              <span className="text-amber-500 font-bold">M</span> Map / Journal
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm border border-white/10 w-fit">
            <span className="text-stone-300 font-mono text-sm tracking-wider uppercase">
              <span className="text-amber-500 font-bold">` (Backtick)</span> Debug Menu
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-20 right-6 pointer-events-auto z-50" style={{ display: debugMenuOpen ? 'block' : 'none' }}>
        {/* Leva handles its own styling but we wrap it to control positioning and visibility manually just in case */}
      </div>
      <Leva hidden={!debugMenuOpen} collapsed={false} />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-6 py-2 border border-white/20 rounded-md shadow-xl">
          <p className="text-stone-300 font-mono text-sm tracking-widest font-semibold flex gap-3">
            <span className="text-red-400">X <span id="hud-x" className="text-white">0.0</span></span>
            <span className="text-green-400">Y <span id="hud-y" className="text-white">0.0</span></span>
            <span className="text-blue-400">Z <span id="hud-z" className="text-white">0.0</span></span>
            <span className="text-amber-400 ml-2 border-l border-white/20 pl-4">Facing <span id="hud-dir" className="text-white">N</span></span>
          </p>
        </div>
      </div>

      <div className="absolute top-6 right-6">
        <button 
          onClick={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setGameState('menu');
          }}
          className="px-4 py-2 bg-black/60 hover:bg-amber-600/80 backdrop-blur-md border border-white/20 text-white font-semibold uppercase tracking-wider text-sm transition-all pointer-events-auto"
        >
          Menu (Esc)
        </button>
      </div>
    </div>
  );
};

