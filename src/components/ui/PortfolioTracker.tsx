import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { 
  X, Map, BookOpen, User, Code, GraduationCap, Gamepad2, 
  BrainCircuit, Users, Paintbrush, Lock
} from 'lucide-react';

const PORTFOLIO_SECTIONS = [
  { 
    id: 'profile', 
    flag: 'learned_profile', 
    title: 'Origins & Profile',
    icon: <User className="w-6 h-6" />,
    hint: 'Seek the Wizard of Origins near the center to learn of his past.',
    content: 'Prasad Anil Kankhar is a creator originating from Buldhana, Maharashtra, building a brand that blends technology, creativity, emotional storytelling, and personal growth. He is a disciplined soul, strict vegetarian, and practitioner of artistic handwriting.'
  },
  { 
    id: 'academics', 
    flag: 'learned_academics', 
    title: 'Academics & Leadership',
    icon: <GraduationCap className="w-6 h-6" />,
    hint: 'The Golden Knights guard the knowledge of his training.',
    content: 'Pursuing a B.Tech in Computer Science at MIT, Chhatrapati Sambhajinagar. He serves as the Technical Coordinator for ACTS and the Campus Mantri for GeeksforGeeks, and is a Google Student Ambassador.'
  },
  { 
    id: 'tech', 
    flag: 'learned_tech', 
    title: 'Technical Expertise',
    icon: <Code className="w-6 h-6" />,
    hint: 'Find the Elf of Engineering in the forests for his tools.',
    content: 'Master of C++, JavaScript, React, Node.js, and Firebase. He builds virtual worlds in Unreal Engine and is currently expanding into Unity and C#. He prefers highly concise, direct communication.'
  },
  { 
    id: 'web', 
    flag: 'learned_web', 
    title: 'Web & Software Engineering',
    icon: <BookOpen className="w-6 h-6" />,
    hint: 'The Pirates of the Web sail the southern coasts.',
    content: 'Built "Nishtha" (open-source habit-tracking), "Sadhana" (massive discipline platform with gamification), "Vyuham" (Chrome dashboard), and "TraceMate Pro" (AR tracing PWA).'
  },
  { 
    id: 'ai', 
    flag: 'learned_ai', 
    title: 'Artificial Intelligence',
    icon: <BrainCircuit className="w-6 h-6" />,
    hint: 'The Cleric of Artificial Intelligence awaits near the ruins.',
    content: 'Engineered a Professional Assessment Platform using NLP for scenario-driven answers. Conducts research on Advanced Multi-Concept Memory Models. Created "Butler AI" (self-coding agent) and "Akṣayanidhi" (local-first AI photo archive).'
  },
  { 
    id: 'games', 
    flag: 'learned_games', 
    title: 'Game Development',
    icon: <Gamepad2 className="w-6 h-6" />,
    hint: 'The Goblin Tinkerers hide in the valleys making games.',
    content: 'Built "On the Way", a joyful delivery-themed mobile game perfect for ages 12 to 30 with dynamic physics and engaging levels.'
  },
  { 
    id: 'events', 
    flag: 'learned_events', 
    title: 'Community Building',
    icon: <Users className="w-6 h-6" />,
    hint: 'The Community Sheriff patrols the eastern plains.',
    content: 'Organized an AI & ML Career Guidance Session for over 220 students. Orchestrated a massive "Among Us IRL" physical game event for a campus festival.'
  },
  { 
    id: 'creative', 
    flag: 'learned_creative', 
    title: 'Creative Expression',
    icon: <Paintbrush className="w-6 h-6" />,
    hint: 'The Witch of the Arts resides in the western groves.',
    content: 'A rare blend of technical ambition, creative thinking, and emotional intelligence. He writes original, authentic Shayari in Roman Hindi and Devanagari. No copied spells here—only pure, purpose-driven storytelling.'
  },
];

export const PortfolioTracker: React.FC = () => {
  const isTrackerOpen = useGameStore(state => state.isTrackerOpen);
  const setTrackerOpen = useGameStore(state => state.setTrackerOpen);
  const dialogFlags = useGameStore(state => state.dialogFlags);
  
  const [activeTab, setActiveTab] = useState<'map' | 'journal'>('journal');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('profile');

  if (!isTrackerOpen) return null;

  const discoveredCount = PORTFOLIO_SECTIONS.filter(s => dialogFlags[s.flag]).length;
  const progressPercent = (discoveredCount / PORTFOLIO_SECTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setTrackerOpen(false)}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-emerald-500/10">
        
        {/* Close Button */}
        <button 
          onClick={() => setTrackerOpen(false)}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Sidebar */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-slate-950/50">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-black text-white tracking-wider uppercase flex items-center gap-2">
              <Map className="w-6 h-6 text-emerald-400" />
              World Tracker
            </h2>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/60 font-medium mb-2 uppercase tracking-widest">
                <span>Discovery Progress</span>
                <span>{discoveredCount} / {PORTFOLIO_SECTIONS.length}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {PORTFOLIO_SECTIONS.map((section) => {
              const isDiscovered = dialogFlags[section.flag];
              const isSelected = selectedSectionId === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => { setActiveTab('journal'); setSelectedSectionId(section.id); }}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex items-center gap-4 group ${
                    isSelected 
                      ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                      : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isDiscovered ? (isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-emerald-400/70 group-hover:text-emerald-400') : 'bg-white/5 text-white/20'
                  }`}>
                    {isDiscovered ? section.icon : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isDiscovered ? 'text-white' : 'text-white/40'}`}>
                      {isDiscovered ? section.title : 'Undiscovered Memory'}
                    </h3>
                    <p className="text-xs text-white/40 truncate">
                      {isDiscovered ? 'Click to read' : 'Talk to NPCs to unlock'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Tabs */}
          <div className="flex p-4 gap-2 border-b border-white/10 bg-black/20">
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-6 py-2 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${
                activeTab === 'journal' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              Journal View
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-6 py-2 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${
                activeTab === 'map' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              Island Map
            </button>
          </div>

          {/* Details Panel */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12">
            {activeTab === 'journal' ? (
              <div className="h-full flex flex-col justify-center max-w-2xl mx-auto animate-in slide-in-from-right-8 duration-300">
                {PORTFOLIO_SECTIONS.map((section) => {
                  if (section.id !== selectedSectionId) return null;
                  const isDiscovered = dialogFlags[section.flag];
                  
                  if (!isDiscovered) {
                    return (
                      <div key={section.id} className="text-center space-y-6 opacity-60">
                        <div className="w-24 h-24 mx-auto bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center">
                          <Lock className="w-10 h-10 text-white/30" />
                        </div>
                        <h1 className="text-3xl font-black text-white/50 uppercase tracking-widest">Memory Locked</h1>
                        <p className="text-lg text-emerald-400/80 font-mono italic max-w-md mx-auto">
                          "{section.hint}"
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={section.id} className="space-y-6">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                          {section.icon}
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                          {section.title}
                        </h1>
                      </div>
                      <div className="h-px w-full bg-gradient-to-r from-emerald-500/50 to-transparent" />
                      <p className="text-xl text-slate-300 leading-relaxed font-medium">
                        {section.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-6 animate-in zoom-in-95 duration-300">
                {/* CSS Styled Map Representation */}
                <div className="relative w-full max-w-lg aspect-square bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl p-8 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 opacity-20" 
                    style={{ backgroundImage: 'radial-gradient(circle at center, #10b981 0%, transparent 70%)' }} />
                  
                  {/* Map Nodes */}
                  <div className="grid grid-cols-3 grid-rows-3 gap-8 w-full h-full relative z-10">
                    <div className="col-start-2 row-start-1 flex flex-col items-center justify-end">
                      <div className="w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-pulse" />
                      <span className="text-[10px] uppercase font-bold text-blue-400 mt-2 tracking-widest">Blue Soldiers</span>
                    </div>
                    
                    <div className="col-start-1 row-start-2 flex flex-col items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-purple-400 shadow-[0_0_15px_#c084fc] animate-pulse" />
                      <span className="text-[10px] uppercase font-bold text-purple-400 mt-2 tracking-widest text-center">Witch / Goblins</span>
                    </div>

                    <div className="col-start-2 row-start-2 flex flex-col items-center justify-center relative">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_#34d399]">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 mt-2 tracking-widest">The Well</span>
                    </div>

                    <div className="col-start-3 row-start-2 flex flex-col items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_15px_#fbbf24] animate-pulse" />
                      <span className="text-[10px] uppercase font-bold text-amber-400 mt-2 tracking-widest text-center">Cowboys / Knights</span>
                    </div>

                    <div className="col-start-2 row-start-3 flex flex-col items-center justify-start">
                      <div className="w-4 h-4 rounded-full bg-red-400 shadow-[0_0_15px_#f87171] animate-pulse" />
                      <span className="text-[10px] uppercase font-bold text-red-400 mt-2 tracking-widest">Pirates</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/40 uppercase tracking-widest font-bold">Island of Prasad</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
