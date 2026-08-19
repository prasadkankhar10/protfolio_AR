import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const DIALOGS: Record<string, { lines: { speakerIndex: number; text: string; duration: number }[] }[]> = {
  PIRATES: [
    {
      lines: [
        { speakerIndex: 0, text: "Yarr, this island be quieter than a ghost ship.", duration: 3000 },
        { speakerIndex: 1, text: "Aye. I miss the smell of gunpowder.", duration: 3000 },
        { speakerIndex: 0, text: "Patience, matey. Prasad's building something big.", duration: 3500 },
      ]
    },
    {
      lines: [
        { speakerIndex: 0, text: "Did ye see that developer walking around?", duration: 3500 },
        { speakerIndex: 1, text: "Aye, looking busy as always.", duration: 2500 },
        { speakerIndex: 0, text: "I wonder if he'll give us a bigger ship.", duration: 3000 },
      ]
    },
    {
      lines: [
        { speakerIndex: 0, text: "My peg leg is itching. Means a storm is brewing.", duration: 3500 },
        { speakerIndex: 1, text: "Ye don't even have a peg leg, you bilge rat!", duration: 3500 },
      ]
    }
  ],
  TOWN: [
    {
      lines: [
        { speakerIndex: 0, text: "Beautiful day for a walk in the portfolio.", duration: 3500 },
        { speakerIndex: 1, text: "Indeed. The rendering quality is fantastic today.", duration: 3500 },
        { speakerIndex: 0, text: "Prasad really outdid himself with the shaders.", duration: 4000 },
      ]
    },
    {
      lines: [
        { speakerIndex: 0, text: "Have you seen the new projects section?", duration: 3500 },
        { speakerIndex: 1, text: "Yes! The 3D integration is seamless.", duration: 3500 },
      ]
    }
  ],
  DUEL: [
    {
      lines: [
        { speakerIndex: 0, text: "Your stance is weak, defender!", duration: 2500 },
        { speakerIndex: 1, text: "Less talking, more swinging!", duration: 2500 },
      ]
    },
    {
      lines: [
        { speakerIndex: 0, text: "Is that all the magic you have?", duration: 2500 },
        { speakerIndex: 1, text: "I'm just getting warmed up!", duration: 2500 },
      ]
    }
  ]
};

export function NpcChatSystem() {
  const activeChatRef = useRef<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // If a chat is already happening, don't start a new one
      if (activeChatRef.current) return;

      const store = useGameStore.getState();
      const registry = store.npcRegistry;
      
      const availableNpcs = Object.values(registry).filter(npc => 
        npc.state !== 'INTERACTING' && npc.state !== 'CHATTING'
      );

      // Group by groupId
      const grouped: Record<string, typeof availableNpcs> = {};
      availableNpcs.forEach(npc => {
        if (npc.groupId) {
          if (!grouped[npc.groupId]) grouped[npc.groupId] = [];
          grouped[npc.groupId].push(npc);
        }
      });

      // Try to find a valid pair (distance < 10)
      let selectedPair: [typeof availableNpcs[0], typeof availableNpcs[0]] | null = null;
      let selectedGroup = '';

      const groups = Object.keys(grouped).sort(() => Math.random() - 0.5); // shuffle
      for (const group of groups) {
        if (grouped[group].length >= 2) {
          // Check all pairs in this group
          const members = grouped[group];
          for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
               const dist = members[i].position.distanceTo(members[j].position);
               if (dist < 10) {
                 selectedPair = [members[i], members[j]];
                 selectedGroup = group;
                 break;
               }
            }
            if (selectedPair) break;
          }
        }
        if (selectedPair) break;
      }

      if (selectedPair && DIALOGS[selectedGroup]) {
        // Start conversation
        activeChatRef.current = true;
        const [npc1, npc2] = selectedPair;
        
        // Pick random script
        const scripts = DIALOGS[selectedGroup];
        const script = scripts[Math.floor(Math.random() * scripts.length)];
        
        // Change state to CHATTING and set targets
        if (selectedGroup !== 'DUEL') {
          store.updateNpcState(npc1.id, npc1.position, 'CHATTING');
          store.updateNpcState(npc2.id, npc2.position, 'CHATTING');
          store.setNpcChatTarget(npc1.id, npc2.position);
          store.setNpcChatTarget(npc2.id, npc1.position);
        }

        let delay = 0;
        script.lines.forEach((line) => {
          setTimeout(() => {
            // Check if they got interrupted
            const currentStore = useGameStore.getState();
            const current1 = currentStore.npcRegistry[npc1.id];
            const current2 = currentStore.npcRegistry[npc2.id];
            
            // If interrupted by player, abort
            if ((current1 && current1.state === 'INTERACTING') || 
                (current2 && current2.state === 'INTERACTING')) {
                store.setNpcSpeechBubble(npc1.id, null);
                store.setNpcSpeechBubble(npc2.id, null);
                return;
            }

            const speakerId = line.speakerIndex === 0 ? npc1.id : npc2.id;
            store.setNpcSpeechBubble(npc1.id, null);
            store.setNpcSpeechBubble(npc2.id, null);
            store.setNpcSpeechBubble(speakerId, line.text);
          }, delay);
          delay += line.duration;
        });

        // Cleanup after script finishes
        setTimeout(() => {
          store.setNpcSpeechBubble(npc1.id, null);
          store.setNpcSpeechBubble(npc2.id, null);
          store.setNpcChatTarget(npc1.id, null);
          store.setNpcChatTarget(npc2.id, null);
          
          if (selectedGroup !== 'DUEL') {
             // Reset back to original state if they weren't interrupted
             const currentStore = useGameStore.getState();
             const current1 = currentStore.npcRegistry[npc1.id];
             const current2 = currentStore.npcRegistry[npc2.id];
             if (current1 && current1.state === 'CHATTING') store.updateNpcState(npc1.id, npc1.position, 'THINKING');
             if (current2 && current2.state === 'CHATTING') store.updateNpcState(npc2.id, npc2.position, 'THINKING');
          }
          activeChatRef.current = false;
        }, delay + 1000);
      }
      
    }, 8000); // Try to start a chat every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
