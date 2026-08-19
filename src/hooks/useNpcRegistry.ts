import { useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

export function useNpcRegistry(
  npcId: string,
  role: string,
  containerRef: React.MutableRefObject<THREE.Group | null>,
  stateRef: React.MutableRefObject<string>,
  groupId: string = 'DEFAULT'
) {
  const registerNpc = useGameStore((s) => s.registerNpc);
  const unregisterNpc = useGameStore((s) => s.unregisterNpc);
  const updateNpcState = useGameStore((s) => s.updateNpcState);
  
  // Register on mount, unregister on unmount
  useEffect(() => {
    registerNpc({ id: npcId, role, position: new THREE.Vector3(), state: stateRef.current, groupId });
    return () => {
      unregisterNpc(npcId);
    };
  }, [npcId, role, groupId, registerNpc, unregisterNpc, stateRef]);
  
  // Update state periodically by reading refs
  useEffect(() => {
    const interval = setInterval(() => {
       if (containerRef.current) {
         updateNpcState(npcId, containerRef.current.position, stateRef.current);
       }
    }, 500); // 2Hz update
    return () => clearInterval(interval);
  }, [npcId, updateNpcState, containerRef, stateRef]);
}
