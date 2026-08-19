import React, { useEffect, useRef } from 'react';
import { Joystick } from 'react-joystick-component';
import { useGameStore } from '../../store/useGameStore';
import { Hand, Map, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export const MobileControls: React.FC = () => {
  const isMobile = useGameStore(state => state.isMobile);
  const setVirtualJoystick = useGameStore(state => state.setVirtualJoystick);
  const setVirtualCameraDelta = useGameStore(state => state.setVirtualCameraDelta);
  const setVirtualButton = useGameStore(state => state.setVirtualButton);
  const fireInteractEvent = useGameStore(state => state.fireInteractEvent);
  const activeOutlineMesh = useGameStore(state => state.activeOutlineMesh);
  const toggleTracker = useGameStore(state => state.toggleTracker);
  
  const cameraTouchId = useRef<number | null>(null);
  const lastTouch = useRef<{x: number, y: number} | null>(null);
  
  // D-Pad Touch Tracking
  const dpadRef = useRef<HTMLDivElement>(null);
  const dpadTouchId = useRef<number | null>(null);
  const [activeDPad, setActiveDPad] = React.useState({ up: false, down: false, left: false, right: false });

  const processDPadTouch = (touch: React.Touch) => {
    if (!dpadRef.current) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    const threshold = 20; // 20px deadzone in center
    const up = dy < -threshold;
    const down = dy > threshold;
    const left = dx < -threshold;
    const right = dx > threshold;
    
    setActiveDPad({ up, down, left, right });
    setVirtualJoystick(
      right ? 1 : left ? -1 : 0,
      up ? 1 : down ? -1 : 0 // Up is positive for Character.tsx logic
    );
  };

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none user-select-none">
      
      {/* Right Half: Camera Touch Zone */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto touch-none"
        onTouchStart={(e) => {
          // Only register a new touch if we aren't already tracking one
          if (cameraTouchId.current === null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              const touch = e.changedTouches[i];
              cameraTouchId.current = touch.identifier;
              lastTouch.current = { x: touch.clientX, y: touch.clientY };
              break; // Track the first valid touch in this zone
            }
          }
        }}
        onTouchMove={(e) => {
          if (cameraTouchId.current !== null && lastTouch.current) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              const touch = e.changedTouches[i];
              if (touch.identifier === cameraTouchId.current) {
                const dx = touch.clientX - lastTouch.current.x;
                const dy = touch.clientY - lastTouch.current.y;
                setVirtualCameraDelta(dx, dy);
                lastTouch.current = { x: touch.clientX, y: touch.clientY };
                break;
              }
            }
          }
        }}
        onTouchEnd={(e) => {
          if (cameraTouchId.current !== null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === cameraTouchId.current) {
                cameraTouchId.current = null;
                lastTouch.current = null;
                setVirtualCameraDelta(0, 0);
                break;
              }
            }
          }
        }}
        onTouchCancel={(e) => {
          if (cameraTouchId.current !== null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === cameraTouchId.current) {
                cameraTouchId.current = null;
                lastTouch.current = null;
                setVirtualCameraDelta(0, 0);
                break;
              }
            }
          }
        }}
      />

      {/* Map / Journal Button (Top Left) */}
      <div className="absolute top-6 left-6 pointer-events-auto">
        <button
          onClick={toggleTracker}
          className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shadow-xl active:scale-95 active:bg-slate-800 transition-all"
        >
          <Map className="w-6 h-6" />
        </button>
      </div>

      {/* Left 8-Way D-Pad */}
      <div 
        ref={dpadRef}
        className="absolute bottom-12 left-8 w-40 h-40 grid grid-cols-3 grid-rows-3 gap-1 pointer-events-auto opacity-70 touch-none"
        onTouchStart={(e) => {
          if (dpadTouchId.current === null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              dpadTouchId.current = e.changedTouches[i].identifier;
              processDPadTouch(e.changedTouches[i]);
              break;
            }
          }
        }}
        onTouchMove={(e) => {
          if (dpadTouchId.current !== null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === dpadTouchId.current) {
                processDPadTouch(e.changedTouches[i]);
                break;
              }
            }
          }
        }}
        onTouchEnd={(e) => {
          if (dpadTouchId.current !== null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === dpadTouchId.current) {
                dpadTouchId.current = null;
                setActiveDPad({ up: false, down: false, left: false, right: false });
                setVirtualJoystick(0, 0);
                break;
              }
            }
          }
        }}
        onTouchCancel={(e) => {
          if (dpadTouchId.current !== null) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === dpadTouchId.current) {
                dpadTouchId.current = null;
                setActiveDPad({ up: false, down: false, left: false, right: false });
                setVirtualJoystick(0, 0);
                break;
              }
            }
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        
        {/* Top-Left */}
        <div className={`border border-white/30 rounded-tl-xl flex items-center justify-center text-white shadow-sm transition-colors ${activeDPad.up && activeDPad.left ? 'bg-white/40' : 'bg-white/10'}`}></div>
        
        {/* UP */}
        <div className={`border-2 border-white/50 rounded-t flex items-center justify-center text-white shadow-lg transition-colors ${activeDPad.up && !activeDPad.left && !activeDPad.right ? 'bg-white/40' : 'bg-white/20'}`}>
          <ChevronUp size={24} />
        </div>

        {/* Top-Right */}
        <div className={`border border-white/30 rounded-tr-xl flex items-center justify-center text-white shadow-sm transition-colors ${activeDPad.up && activeDPad.right ? 'bg-white/40' : 'bg-white/10'}`}></div>
        
        {/* LEFT */}
        <div className={`border-2 border-white/50 rounded-l flex items-center justify-center text-white shadow-lg transition-colors ${activeDPad.left && !activeDPad.up && !activeDPad.down ? 'bg-white/40' : 'bg-white/20'}`}>
          <ChevronLeft size={24} />
        </div>
        
        {/* Center (Empty) */}
        <div className="bg-black/10 rounded-full shadow-inner"></div>

        {/* RIGHT */}
        <div className={`border-2 border-white/50 rounded-r flex items-center justify-center text-white shadow-lg transition-colors ${activeDPad.right && !activeDPad.up && !activeDPad.down ? 'bg-white/40' : 'bg-white/20'}`}>
          <ChevronRight size={24} />
        </div>

        {/* Bottom-Left */}
        <div className={`border border-white/30 rounded-bl-xl flex items-center justify-center text-white shadow-sm transition-colors ${activeDPad.down && activeDPad.left ? 'bg-white/40' : 'bg-white/10'}`}></div>
        
        {/* DOWN */}
        <div className={`border-2 border-white/50 rounded-b flex items-center justify-center text-white shadow-lg transition-colors ${activeDPad.down && !activeDPad.left && !activeDPad.right ? 'bg-white/40' : 'bg-white/20'}`}>
          <ChevronDown size={24} />
        </div>

        {/* Bottom-Right */}
        <div className={`border border-white/30 rounded-br-xl flex items-center justify-center text-white shadow-sm transition-colors ${activeDPad.down && activeDPad.right ? 'bg-white/40' : 'bg-white/10'}`}></div>
      </div>

      {/* Right Action Buttons */}
      <div className="absolute bottom-12 right-12 flex flex-col gap-4 pointer-events-auto">
        <button 
          className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm active:bg-white/40 active:scale-95 transition-all touch-none"
          onTouchStart={() => setVirtualButton('run', true)}
          onTouchEnd={() => setVirtualButton('run', false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          SPRINT
        </button>
        <button 
          className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm active:bg-white/40 active:scale-95 transition-all touch-none"
          onTouchStart={() => setVirtualButton('jump', true)}
          onTouchEnd={() => setVirtualButton('jump', false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          JUMP
        </button>
      </div>

      {/* Center Interact Button */}
      {activeOutlineMesh && (
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 pointer-events-auto">
          <button 
            className="w-20 h-20 rounded-full bg-amber-500/80 border-4 border-amber-300 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95 transition-all touch-none animate-bounce"
            onTouchStart={() => fireInteractEvent()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <Hand size={32} />
          </button>
        </div>
      )}
    </div>
  );
};
