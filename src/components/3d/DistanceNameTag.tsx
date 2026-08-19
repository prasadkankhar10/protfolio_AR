import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { globalPlayerState } from './Character';

interface DistanceNameTagProps {
  name: string;
  position?: [number, number, number];
}

export function DistanceNameTag({ name, position = [0, 4.0, 0] }: DistanceNameTagProps) {
  const [visible, setVisible] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Get world position of this tag
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    
    // Calculate distance to player
    const dist = worldPos.distanceTo(globalPlayerState.position);
    
    if (dist < 50 && !visible) {
      setVisible(true);
    } else if (dist >= 50 && visible) {
      setVisible(false);
    }
  });

  return (
    <group ref={groupRef}>
      {visible && (
        <Html position={position} center zIndexRange={[50, 0]}>
          <div className="bg-black/60 text-white/90 text-[10px] px-2 py-0.5 rounded-full font-mono whitespace-nowrap shadow-sm border border-white/10 pointer-events-none transition-opacity duration-300">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}
