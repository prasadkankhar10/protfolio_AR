import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Sphere, Torus, Icosahedron, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

export type SpellType = 'arcane' | 'holy' | 'nature' | 'fire' | 'water' | 'void' | 'ultimate_arcane' | 'ultimate_dark' | 'ultimate_holy';

interface SpellEffectProps {
  color?: string;
  duration?: number;
  type?: SpellType;
  scaleMultiplier?: number;
}

export const SpellEffect = ({ color = '#00ffcc', duration = 3.0, type = 'arcane', scaleMultiplier = 1.0 }: SpellEffectProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Extra refs for animated geometries
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const timer = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    timer.current += delta;
    const progress = Math.min(1.0, timer.current / duration);
    
    // Smooth scale in and out
    const scale = progress < 0.2 ? (progress / 0.2) * 8.0 : (1 - progress) * 2.5;
    groupRef.current.scale.setScalar(Math.max(0.01, scale * scaleMultiplier));
    
    // Float forward and up slightly depending on magic type
    groupRef.current.position.z = progress * 2.0;
    groupRef.current.position.y = 1.2 + Math.sin(progress * Math.PI) * 0.5;
    
    // Animate Core
    if (coreRef.current) {
        coreRef.current.rotation.x += delta * 2;
        coreRef.current.rotation.y += delta * 3;
    }

    // Animate Rings
    if (ring1Ref.current && ring2Ref.current) {
        ring1Ref.current.rotation.x += delta * 5;
        ring1Ref.current.rotation.y += delta * 2;
        
        ring2Ref.current.rotation.y -= delta * 4;
        ring2Ref.current.rotation.z += delta * 3;
    }
    
    // Pulse intensity
    if (materialRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 20) * 0.5;
      materialRef.current.color.copy(baseColor).multiplyScalar(pulse);
    }
    
    // Pulse light
    if (lightRef.current) {
       lightRef.current.intensity = (progress < 0.2 ? (progress/0.2) * 20 : (1 - progress) * 10) + Math.random() * 2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0.5]}>
      
      {/* --- ARCANE MAGIC (Wizard) --- */}
      {type === 'arcane' && (
        <>
          <Icosahedron ref={coreRef} args={[0.15, 0]}>
            <meshBasicMaterial ref={materialRef} color={color} wireframe />
          </Icosahedron>
          <Torus ref={ring1Ref} args={[0.25, 0.01, 16, 32]}>
             <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </Torus>
          <Torus ref={ring2Ref} args={[0.35, 0.01, 16, 32]} rotation={[Math.PI/2, 0, 0]}>
             <meshBasicMaterial color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </Torus>
          <Sparkles count={100} scale={2.0} size={4} speed={4} opacity={0.9} color={color} />
        </>
      )}

      {/* --- HOLY MAGIC (Cleric) --- */}
      {type === 'holy' && (
        <>
          <Sphere ref={coreRef} args={[0.18, 32, 32]}>
            <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </Sphere>
          <Torus ref={ring1Ref} args={[0.4, 0.02, 16, 64]} rotation={[Math.PI/2, 0, 0]}>
             <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </Torus>
          <Sparkles count={80} scale={1.5} size={6} speed={1} opacity={1} color="#ffffff" />
        </>
      )}

      {/* --- NATURE/DARK MAGIC (Witch) --- */}
      {type === 'nature' && (
        <>
          <Sphere args={[0.15, 16, 16]}>
            <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.8} />
          </Sphere>
          <Icosahedron ref={ring1Ref} args={[0.3, 1]}>
             <meshBasicMaterial color={color} wireframe transparent opacity={0.5} blending={THREE.AdditiveBlending} />
          </Icosahedron>
          <Sparkles count={150} scale={2.5} size={5} speed={5} opacity={0.7} color={color} noise={2} />
        </>
      )}

      {/* --- FIRE MAGIC --- */}
      {type === 'fire' && (
        <>
          <Icosahedron ref={coreRef} args={[0.2, 0]}>
            <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </Icosahedron>
          <Torus ref={ring1Ref} args={[0.3, 0.05, 8, 16]} rotation={[Math.PI/4, Math.PI/4, 0]}>
             <meshBasicMaterial color="#ff5500" wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </Torus>
          <Torus ref={ring2Ref} args={[0.35, 0.02, 8, 16]} rotation={[-Math.PI/4, -Math.PI/4, 0]}>
             <meshBasicMaterial color="#ffcc00" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </Torus>
          <Sparkles count={200} scale={2.5} size={8} speed={8} opacity={1} color="#ffaa00" />
        </>
      )}

      {/* --- WATER MAGIC --- */}
      {type === 'water' && (
        <>
          <Sphere ref={coreRef} args={[0.15, 32, 32]}>
            <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
          </Sphere>
          <Sphere ref={ring1Ref} args={[0.25, 32, 32]}>
            <meshBasicMaterial color="#aaddff" wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </Sphere>
          <Sphere ref={ring2Ref} args={[0.35, 32, 32]}>
            <meshBasicMaterial color="#0088ff" wireframe transparent opacity={0.1} blending={THREE.AdditiveBlending} />
          </Sphere>
          <Sparkles count={60} scale={3.0} size={3} speed={0.5} opacity={0.6} color="#ffffff" noise={1} />
        </>
      )}

      {/* --- VOID MAGIC --- */}
      {type === 'void' && (
        <>
          <Icosahedron ref={coreRef} args={[0.15, 2]}>
            <meshBasicMaterial color="#000000" />
          </Icosahedron>
          <Icosahedron ref={ring1Ref} args={[0.2, 1]}>
             <meshBasicMaterial ref={materialRef} color={color} wireframe transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </Icosahedron>
          <Torus ref={ring2Ref} args={[0.3, 0.01, 16, 32]} rotation={[Math.PI/2, 0, 0]}>
             <meshBasicMaterial color="#aa00ff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
          </Torus>
          <Sparkles count={120} scale={1.5} size={2} speed={-5} opacity={0.9} color={color} />
        </>
      )}

      {/* --- ULTIMATE: GALACTIC RIFT (Wizard) --- */}
      {type === 'ultimate_arcane' && (
        <>
          <Sphere args={[0.2, 32, 32]}>
            <meshBasicMaterial color="#000000" />
          </Sphere>
          <Torus ref={ring1Ref} args={[0.5, 0.05, 16, 64]} rotation={[Math.PI/3, Math.PI/4, 0]}>
             <meshBasicMaterial color="#ff00ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </Torus>
          <Torus ref={ring2Ref} args={[0.7, 0.02, 16, 64]} rotation={[-Math.PI/3, -Math.PI/4, 0]}>
             <meshBasicMaterial color="#5500ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </Torus>
          <Torus args={[0.9, 0.01, 16, 64]} rotation={[Math.PI/2, 0, 0]}>
             <meshBasicMaterial color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </Torus>
          <Sparkles count={400} scale={4.0} size={8} speed={-10} opacity={1} color="#ff00ff" />
        </>
      )}

      {/* --- ULTIMATE: ELDRITCH STORM (Witch) --- */}
      {type === 'ultimate_dark' && (
        <>
          {/* Towering cyclone */}
          <Cylinder args={[0.8, 0.2, 3.0, 16]} position={[0, 1.5, 0]}>
            <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </Cylinder>
          <Cylinder ref={coreRef} args={[0.5, 0.1, 2.5, 16]} position={[0, 1.2, 0]}>
            <meshBasicMaterial color="#00ff00" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
          </Cylinder>
          <Icosahedron ref={ring1Ref} args={[0.6, 1]} position={[0, 0, 0]}>
             <meshBasicMaterial color="#000000" wireframe transparent opacity={0.8} />
          </Icosahedron>
          <Sparkles count={500} scale={[2.0, 4.0, 2.0]} size={10} speed={15} opacity={0.9} color="#aaff00" noise={3} />
        </>
      )}

      {/* --- ULTIMATE: DIVINE ASCENSION (Cleric) --- */}
      {type === 'ultimate_holy' && (
        <>
          {/* Pillar of light */}
          <Cylinder args={[0.4, 0.4, 4.0, 32]} position={[0, 2.0, 0]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
          </Cylinder>
          <Torus ref={ring1Ref} args={[0.8, 0.05, 16, 64]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]}>
             <meshBasicMaterial color="#ffd700" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </Torus>
          <Torus ref={ring2Ref} args={[1.2, 0.02, 16, 64]} rotation={[Math.PI/2, 0, 0]} position={[0, 1.0, 0]}>
             <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </Torus>
          <Sparkles count={300} scale={[1.5, 4.0, 1.5]} size={6} speed={-2} opacity={1} color="#ffffff" />
        </>
      )}

      {/* Dynamic Lighting */}
      <pointLight ref={lightRef} color={color} distance={15} decay={2} intensity={0} />
    </group>
  );
};
