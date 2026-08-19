import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { globalPlayerState } from './Character';

interface DynamicLampsProps {
  lampPositions: THREE.Vector3[];
  lampColor: string;
  lampIntensity: number;
}

const MAX_LIGHTS = 3; // Strict limit to prevent WebGL from crashing
const CULL_DISTANCE = 25; // How far before light fades out

export const DynamicLamps = ({ lampPositions, lampColor, lampIntensity }: DynamicLampsProps) => {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(() => {
    if (lampPositions.length === 0) return;

    // 1. Calculate distance from player to all lamps
    const playerPos = globalPlayerState.position;
    
    // Create an array of { index, distance }
    const distances = lampPositions.map((pos, i) => {
      // Use distanceToSquared for performance (avoids Math.sqrt)
      return { index: i, distSq: pos.distanceToSquared(playerPos) };
    });

    // 2. Sort by distance (closest first)
    distances.sort((a, b) => a.distSq - b.distSq);

    // 3. Update the 3 PointLights to sit at the closest 3 lamps
    for (let i = 0; i < MAX_LIGHTS; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;

      if (i < distances.length) {
        const closestLamp = distances[i];
        const dist = Math.sqrt(closestLamp.distSq);
        
        if (dist < CULL_DISTANCE) {
          // Snap light position to the lamp
          light.position.copy(lampPositions[closestLamp.index]);
          
          // Smooth fade in/out based on distance
          const fadeFactor = 1.0 - (dist / CULL_DISTANCE);
          // Easing function for smoother fade
          const easedFade = fadeFactor * fadeFactor;
          
          light.intensity = lampIntensity * easedFade;
          light.visible = true;
        } else {
          // Too far, hide it to save GPU
          light.visible = false;
          light.intensity = 0;
        }
      } else {
        // Less lamps exist than MAX_LIGHTS
        light.visible = false;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_LIGHTS }).map((_, i) => (
        <pointLight
          key={i}
          ref={(el) => (lightRefs.current[i] = el)}
          color={lampColor}
          distance={20}
          castShadow
          visible={false}
          intensity={0}
        />
      ))}
    </group>
  );
};
