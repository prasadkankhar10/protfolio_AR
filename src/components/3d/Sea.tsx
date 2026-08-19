import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export const Sea: React.FC = () => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Load the model and extract the 'sea' node
  const { nodes } = useGLTF('./models/island6_model.glb') as any;
  const seaNode = nodes['sea']; 
  
  // Load the normal map for realistic ripples
  const normalMap = useTexture('./textures/water_normal.jpg');
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(20, 20); 

  // Clone texture for the massive outer ocean so we can tile it differently
  const outerNormalMap = useMemo(() => {
    const tex = normalMap.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(250, 250); // Tile much more for the 2000m ring
    return tex;
  }, [normalMap]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (normalMap) {
      normalMap.offset.x = time * 0.05;
      normalMap.offset.y = time * 0.03;
      
      outerNormalMap.offset.x = time * 0.05;
      outerNormalMap.offset.y = time * 0.03;
    }
  });

  if (!seaNode) return null;

  return (
    <group>
      {/* 1. The Custom Sea Mesh (Inner Coastline) */}
      <mesh 
        geometry={seaNode.geometry} 
        position={seaNode.position} 
        rotation={seaNode.rotation} 
        scale={seaNode.scale}
      >
        <meshStandardMaterial 
          ref={materialRef}
          color="#006994"
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* 2. The Infinite Horizon Ocean (Outer Ring) */}
      <mesh 
        position={[0, seaNode.position.y - 0.5, 0]} // Slightly below to prevent z-fighting
        rotation={[-Math.PI / 2, 0, 0]} 
      >
        <planeGeometry args={[4000, 4000]} /> 
        <meshStandardMaterial 
          color="#006994"
          normalMap={outerNormalMap}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
};

useGLTF.preload('./models/island6_model.glb');
useTexture.preload('./textures/water_normal.jpg');
