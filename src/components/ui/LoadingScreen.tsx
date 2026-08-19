import { useProgress } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const LoadingScreen = () => {
  const { progress, active, loaded, total } = useProgress();
  const setIsLoaded = useGameStore((state) => state.setIsLoaded);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progress === 100 && !active && total > 0) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 1,
        delay: 0.5,
        onComplete: () => {
          setIsLoaded(true);
        }
      });
    }
  }, [progress, active, total, setIsLoaded]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-stone-200"
    >
      <div className="text-4xl font-serif mb-8 tracking-widest uppercase">Medieval Realm</div>
      
      <div className="w-64 h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
        <div 
          className="h-full bg-amber-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="mt-4 text-sm font-mono text-stone-500">
        {Math.round(progress)}% ({loaded}/{total})
      </div>
    </div>
  );
};
