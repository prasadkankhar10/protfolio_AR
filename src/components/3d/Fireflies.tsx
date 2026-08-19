import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Fireflies = ({ count = 150 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Pre-calculate the starting positions and organic movement speeds
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 400, // Spread across the massive island
          Math.random() * 15 + 1,     // Height between 1 and 16 meters
          (Math.random() - 0.5) * 400
        ),
        factor: Math.random() * 100, // Random time offset so they don't sync up
        speed: Math.random() * 0.01 + 0.005,
        xFactor: Math.random() - 0.5,
        yFactor: Math.random() - 0.5,
        zFactor: Math.random() - 0.5,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    particles.forEach((particle, i) => {
      const t = particle.factor + state.clock.elapsedTime * (particle.speed * 50);
      
      // Pure mathematical wandering motion using Sine/Cosine waves
      particle.position.x += Math.sin(t) * particle.xFactor * 0.05;
      particle.position.y += Math.sin(t) * particle.yFactor * 0.05;
      particle.position.z += Math.cos(t) * particle.zFactor * 0.05;
      
      // Prevent them from sinking underground
      if (particle.position.y < 0.5) particle.position.y = 0.5;
      
      dummy.position.copy(particle.position);
      
      // Make them pulse in size/brightness as they fly
      const scale = 0.5 + Math.sin(t * 3) * 0.5;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Tiny glowing spheres */}
      <sphereGeometry args={[0.15, 4, 4]} />
      {/* MeshBasicMaterial is unlit, making it appear to glow in the dark */}
      <meshBasicMaterial color="#ffffaa" transparent opacity={0.8} />
    </instancedMesh>
  );
};
