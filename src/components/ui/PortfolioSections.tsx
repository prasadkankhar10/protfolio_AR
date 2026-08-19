import { useGameStore } from '../../store/useGameStore';
import { X } from 'lucide-react';

export const PortfolioSections = () => {
  const activeSection = useGameStore((state) => state.activeSection);
  const setActiveSection = useGameStore((state) => state.setActiveSection);

  if (activeSection === 'none') return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-stone-900 border border-stone-800 shadow-2xl p-10 rounded-sm custom-scrollbar">
        
        <button 
          onClick={() => setActiveSection('none')}
          className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors"
        >
          <X size={32} />
        </button>

        {activeSection === 'about' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-serif text-amber-500 mb-6 uppercase tracking-wider">About Me</h2>
            <div className="space-y-4 text-stone-300 leading-relaxed">
              <p>
                Welcome to my interactive portfolio. I am a passionate developer focused on creating immersive and engaging digital experiences.
              </p>
              <p>
                This portfolio demonstrates my ability to integrate modern web technologies (React, Three.js, Rapier Physics) into a cohesive, game-like environment.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-serif text-amber-500 mb-6 uppercase tracking-wider">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-stone-950 p-6 border border-stone-800 hover:border-amber-600/50 transition-colors">
                  <h3 className="text-xl text-stone-200 mb-2 font-semibold">Project Title {i}</h3>
                  <p className="text-stone-400 text-sm mb-4">A brief description of the project, highlighting the core technologies and features.</p>
                  <button className="text-amber-600 hover:text-amber-400 text-sm uppercase tracking-wider font-semibold">
                    View Project →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-serif text-amber-500 mb-6 uppercase tracking-wider">Contact</h2>
            <p className="text-stone-300 mb-8">Feel free to reach out for collaborations or inquiries.</p>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Name</label>
                <input type="text" className="w-full bg-stone-950 border border-stone-800 p-3 text-white focus:outline-none focus:border-amber-600 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Email</label>
                <input type="email" className="w-full bg-stone-950 border border-stone-800 p-3 text-white focus:outline-none focus:border-amber-600 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Message</label>
                <textarea rows={4} className="w-full bg-stone-950 border border-stone-800 p-3 text-white focus:outline-none focus:border-amber-600 transition-colors resize-none"></textarea>
              </div>
              <button className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold uppercase tracking-wider transition-colors">
                Send Message
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
