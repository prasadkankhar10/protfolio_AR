import React from 'react';
import { Smartphone } from 'lucide-react';

export const RotateDeviceOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white portrait-overlay portrait:flex landscape:hidden">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center p-6 bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
        <div className="relative">
          <Smartphone size={80} className="text-amber-400 animate-[spin_3s_ease-in-out_infinite]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-wider uppercase text-amber-400">Rotate Device</h2>
          <p className="text-slate-300 font-medium leading-relaxed">
            For the best experience, please rotate your phone to landscape mode.
          </p>
        </div>
      </div>
    </div>
  );
};
