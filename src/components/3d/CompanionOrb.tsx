import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { globalPlayerState } from './Character';
import { useGameStore } from '../../store/useGameStore';
import { NpcChatBubble } from './NpcChatBubble';

const DIALOGUE_LINES = [
  "Watch your step, it's a long way down!",
  "The Knights say there's a powerful artifact hidden in the ruins...",
  "I sense strong magic coming from that strange wizard up there.",
  "Did you know the Vikings built their houses by hand?",
  "Let's explore that mountain over there!",
  "Goblins might look silly, but they're surprisingly sneaky.",
  "It's peaceful right now, but stay alert.",
  "I wonder what those cowboys are arguing about...",
  "Hey! Listen!",
  "The pirate ship looks deserted, but you never know...",
  "The air feels different in this part of the island."
];

export function CompanionOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const npcId = 'companion_orb';
  const [hasDialogue, setHasDialogue] = useState(false);

  useEffect(() => {
    // Random dialogue timer
    const interval = setInterval(() => {
      // 30% chance to say something every 15 seconds
      if (Math.random() < 0.3) {
        const line = DIALOGUE_LINES[Math.floor(Math.random() * DIALOGUE_LINES.length)];
        useGameStore.getState().setNpcSpeechBubble(npcId, line);
        setHasDialogue(true);
        
        // Clear it after 5 seconds
        setTimeout(() => {
          useGameStore.getState().setNpcSpeechBubble(npcId, '');
          setHasDialogue(false);
        }, 5000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !lightRef.current) return;

    // Right shoulder is 0.8 on X
    const offset = new THREE.Vector3(0.8, 1.8, 0.5);
    
    // Check for NaN to prevent disappearing forever
    if (isNaN(globalPlayerState.quaternion.x) || isNaN(globalPlayerState.position.x)) return;
    
    offset.applyQuaternion(globalPlayerState.quaternion);
    const targetPos = new THREE.Vector3().copy(globalPlayerState.position).add(offset);
    
    // Add some bobbing
    targetPos.y += Math.sin(state.clock.elapsedTime * 2) * 0.15;

    // Smoothly lerp to the target position
    meshRef.current.position.lerp(targetPos, 5 * delta);
    lightRef.current.position.copy(meshRef.current.position);
    
    // Light flicker effect
    lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
  });

  return (
    <group>
      {/* Sparkles effect around the orb */}
      <Sparkles 
        position={meshRef.current?.position || new THREE.Vector3()} 
        count={20} 
        scale={0.5} 
        size={2} 
        speed={0.4} 
        opacity={0.5} 
        color="#ffaa00" 
      />
      
      <Trail
        width={0.8}
        color="#ffaa00"
        length={20}
        decay={2}
        local={false}
        stride={0}
        interval={1}
        attenuation={(t) => t * t * t} // Tapers off beautifully
      >
        <mesh ref={meshRef} frustumCulled={false}>
          {/* Inner bright core */}
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff" 
            emissiveIntensity={2}
            toneMapped={false}
          />
          
          {/* Outer glowing translucent shell */}
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
              color="#ff5500"
              emissive="#ff3300"
              emissiveIntensity={4}
              transparent={true}
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          
          {hasDialogue && <NpcChatBubble npcId={npcId} position={[0, 0.4, 0]} />}
        </mesh>
      </Trail>
      
      <pointLight 
        ref={lightRef} 
        color="#ff7700" 
        intensity={2} 
        distance={8} 
        decay={2}
      />
    </group>
  );
}
