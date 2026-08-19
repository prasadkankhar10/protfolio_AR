import React from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';

interface NpcChatBubbleProps {
  npcId: string;
  position?: [number, number, number];
}

export function NpcChatBubble({ npcId, position = [0, 2.8, 0] }: NpcChatBubbleProps) {
  const text = useGameStore((s) => s.npcSpeechBubbles[npcId]);

  if (!text) return null;

  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '8px 14px',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'translate3d(0, 0, 0)',
          animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}
      >
        {text}
        
        {/* Tail of the bubble */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: -1
          }} 
        />
        
        <style>
          {`
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.8) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}
        </style>
      </div>
    </Html>
  );
}
