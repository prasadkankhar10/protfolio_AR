import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { dialogData } from '../../data/dialogs';

export const DialogOverlay: React.FC = () => {
  const activeDialogId = useGameStore((state) => state.activeDialogId);
  const setActiveDialog = useGameStore((state) => state.setActiveDialog);
  const [displayedLength, setDisplayedLength] = useState(0);

  const currentDialog = React.useMemo(() => {
    if (!activeDialogId) return null;
    let id = activeDialogId;
    let node = dialogData[id];
    
    // Resolve condition jumps immediately to prevent flashing
    while (node && node.conditionFlag && node.altNextId) {
      if (useGameStore.getState().dialogFlags[node.conditionFlag]) {
        id = node.altNextId;
        node = dialogData[id];
      } else {
        break;
      }
    }
    
    return node;
  }, [activeDialogId, useGameStore.getState().dialogFlags]);

  // Typewriter effect
  useEffect(() => {
    if (!currentDialog) {
      setDisplayedLength(0);
      return;
    }

    setDisplayedLength(0);
    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= currentDialog.text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 30); // Speed of typing

    return () => clearInterval(interval);
  }, [currentDialog]);

  const displayedText = currentDialog ? currentDialog.text.slice(0, displayedLength) : '';
  const isTyping = currentDialog ? displayedLength < currentDialog.text.length : false;

  const handleNext = React.useCallback(() => {
    if (!currentDialog) return;
    if (isTyping) {
      // Skip typing
      setDisplayedLength(currentDialog.text.length);
    } else {
      // Set flag if this dialog has one
      if (currentDialog.setFlag) {
        useGameStore.getState().setDialogFlag(currentDialog.setFlag, true);
      }

      if (currentDialog.nextId) {
        setActiveDialog(currentDialog.nextId, useGameStore.getState().activeDialogNpcId);
      } else {
        // Close dialog
        setActiveDialog(null);
      }
    }
  }, [isTyping, currentDialog, setActiveDialog]);

  // Keyboard controls for PointerLock mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  if (!currentDialog) return null;

  return (
    <div 
      className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-50 select-none"
      onClick={handleNext}
    >
      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-2xl relative cursor-pointer hover:bg-black/70 transition-colors">
        
        {/* NPC Name Badge */}
        <div className="absolute -top-4 left-6 bg-amber-500 text-black font-bold px-4 py-1 rounded-md shadow-lg text-sm tracking-wider uppercase">
          {currentDialog.npcName}
        </div>

        {/* Dialog Text */}
        <p className="text-white text-lg md:text-xl font-medium leading-relaxed min-h-[80px]">
          {displayedText}
        </p>

        {/* Next Indicator */}
        <div className="absolute bottom-4 right-6 animate-bounce">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div className="absolute top-2 right-4 text-xs text-white/40">
          {useGameStore.getState().isMobile 
            ? (isTyping ? "Tap to skip" : "Tap to continue") 
            : (isTyping ? "Press 'E' to skip" : "Press 'E' to continue")}
        </div>
      </div>
    </div>
  );
};
