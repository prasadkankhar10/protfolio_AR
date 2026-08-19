import { useGameStore } from '../../store/useGameStore';

export const MainMenu = () => {
  const setGameState = useGameStore((state) => state.setGameState);
  const setActiveSection = useGameStore((state) => state.setActiveSection);
  const hasStarted = useGameStore((state) => state.hasStarted);
  const setHasStarted = useGameStore((state) => state.setHasStarted);

  const handleStart = () => {
    if (!hasStarted) setHasStarted(true);
    setGameState('playing');
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-stone-200">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-serif tracking-widest uppercase mb-4 text-amber-500 drop-shadow-lg">
          Portfolio
        </h1>
        <p className="text-xl text-stone-400 font-light tracking-wider">
          An Interactive 3D Experience
        </p>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={handleStart}
          className="group relative px-6 py-3 border border-amber-600/50 bg-stone-900/80 hover:bg-amber-600/20 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 w-0 bg-amber-600/20 group-hover:w-full transition-all duration-500 ease-out" />
          <span className="relative text-lg tracking-widest uppercase font-semibold text-amber-500 group-hover:text-amber-400">
            {hasStarted ? 'Resume Game' : 'Start Exploring'}
          </span>
        </button>

        <button 
          onClick={() => setActiveSection('about')}
          className="px-6 py-3 border border-stone-800 bg-stone-900/50 hover:bg-stone-800/80 hover:text-white transition-all duration-300 text-stone-400 tracking-wider uppercase text-sm"
        >
          About Me
        </button>

        <button 
          onClick={() => setActiveSection('projects')}
          className="px-6 py-3 border border-stone-800 bg-stone-900/50 hover:bg-stone-800/80 hover:text-white transition-all duration-300 text-stone-400 tracking-wider uppercase text-sm"
        >
          Projects
        </button>

        <button 
          onClick={() => setActiveSection('contact')}
          className="px-6 py-3 border border-stone-800 bg-stone-900/50 hover:bg-stone-800/80 hover:text-white transition-all duration-300 text-stone-400 tracking-wider uppercase text-sm"
        >
          Contact
        </button>
      </div>
    </div>
  );
};
