import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useRapier } from '@react-three/rapier';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { SpellEffect } from './SpellEffect';
import { globalPlayerState } from './Character';
import { useGameStore } from '../../store/useGameStore';

interface ClericNPCProps {
  colorTint?: string;
  roleName?: string;
  startPosition?: THREE.Vector3;
}

export const ClericNPC = ({ 
  colorTint, 
  startPosition, 
  roleName = "Cleric"
}: ClericNPCProps) => {
  const { scene, animations } = useGLTF('./models/NPCs/Cleric.glb');
  const containerRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const { world } = useRapier(); 
  
  // Hardcoded scale for the Cleric model to match player size
  const scale = 0.688645;
  
  // React state for the dialog box (only triggers ONCE when approached)
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [activeSpell, setActiveSpell] = useState({ type: 'holy' as any, color: '#ffd700', duration: 3.0, scaleMultiplier: 1.0 });
  
  const activeRitual = useGameStore((state) => state.activeRitual);
  const ritualState = useGameStore((state) => state.ritualState);
  
  // 1. CLONING SYSTEM
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (colorTint) {
      clone.traverse((node: any) => {
        if (node.isMesh && node.material) {
          node.material = node.material.clone();
          if (node.material.color) {
            node.material.color.lerp(new THREE.Color(colorTint), 0.5);
          }
        }
      });
    }
  }, [clone, colorTint]);

  // Set initial position once on mount to prevent React from resetting it on re-renders
  useEffect(() => {
    if (containerRef.current && startPosition) {
      containerRef.current.position.copy(startPosition);
    }
  }, []);

  const { actions, mixer } = useAnimations(animations, modelRef);

  // Hardcoded mappings for Cleric.gltf
  const anims = useMemo(() => {
    return {
      idle: 'Idle_Weapon',
      walk: 'Walk',
      run: 'Run',
      wave: 'Spell1', // We use Spell1 as a fun greeting wave for the cleric
      spell: 'Spell1', // Use it for casting too
    };
  }, []);

  // 3. AI RAYCAST WANDERER BRAIN
  const stateRef = useRef<'THINKING' | 'WALKING' | 'PRACTICING' | 'INTERACTING' | 'SUMMONED' | 'RITUAL' | 'ESCAPING'>('THINKING');
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  
  // Stuck Detection Variables (History Tracker)
  const historyPositions = useRef<THREE.Vector3[]>([]);
  const historyTimer = useRef(0);
  const escapeTimer = useRef(0);
  const interactTimer = useRef(0);
  const idleTimer = useRef(0);

  // Initialize with dynamic idle animation safely
  const currentAnim = useRef('');
  
  const targetQuaternion = useRef(new THREE.Quaternion());
  const downDir = useMemo(() => new THREE.Vector3(0, -1, 0), []);

  useEffect(() => {
    if (anims.idle && !currentAnim.current) {
      currentAnim.current = anims.idle;
      actions[anims.idle]?.reset().fadeIn(0.2).play();
    }
  }, [anims.idle, actions]);

  // Wait a few frames for the scene to load before starting to wander
  const startupTimer = useRef(0);

  useFrame((rootState, delta) => {
    if (!containerRef.current || !currentAnim.current) return;

    if (startupTimer.current < 1.0) {
      startupTimer.current += delta;
      return;
    }

    const npcPos = containerRef.current.position;
    // --- SHADOW CULLING ---
    const distToCam = rootState.camera.position.distanceTo(npcPos);
    const shouldCastShadow = distToCam < 35; 
    if (clone.userData.isShadowCulled !== shouldCastShadow) {
      clone.userData.isShadowCulled = shouldCastShadow;
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = shouldCastShadow;
          // receiveShadow is kept true so they still look grounded when far away
          if (child.receiveShadow === undefined || child.receiveShadow === false) {
             child.receiveShadow = true;
          }
        }
      });
    }

    let nextAnim = currentAnim.current;
    let nextState = stateRef.current;

    // --- SAFETY TELEPORT (Fall protection) ---
    if (npcPos.y < 1.0) {
      npcPos.set(startPosition?.x ?? 101, 3.2, startPosition?.z ?? -76);
      nextState = 'THINKING';
      targetPosRef.current = null;
      historyPositions.current = [];
    }

    // --- PROXIMITY SENSOR (PLAYER INTERACTION) ---
    const distToPlayer = npcPos.distanceTo(globalPlayerState.position);
    if (distToPlayer < 3.5) {
      if (stateRef.current !== 'INTERACTING') {
        nextState = 'INTERACTING';
        interactTimer.current = 0; // Reset interaction timer
        if (!isInteracting) setIsInteracting(true);
      }
    } else if (stateRef.current === 'INTERACTING') {
      nextState = 'THINKING';
      if (isInteracting) setIsInteracting(false);
    }
    
    // Sync React State for SpellEffect
    if (nextState === 'PRACTICING' && !isPracticing) setIsPracticing(true);
    if (nextState !== 'PRACTICING' && isPracticing) setIsPracticing(false);

    // --- STUCK / PACING DETECTION SYSTEM (HISTORY TRACKER) ---
    if (stateRef.current === 'WALKING' || stateRef.current === 'ESCAPING') {
      historyTimer.current += delta;
      if (historyTimer.current > 1.0) { // Record position every 1 second
        historyTimer.current = 0;
        historyPositions.current.push(npcPos.clone());
        
        // Keep the last 6 seconds of history
        if (historyPositions.current.length > 6) {
          historyPositions.current.shift();
        }

        // If we have 6 seconds of history, check if we are trapped pacing in a small area
        if (historyPositions.current.length === 6) {
          const oldestPos = historyPositions.current[0];
          // Ignore Y height, only care if X/Z moved
          const p1 = new THREE.Vector2(npcPos.x, npcPos.z);
          const p2 = new THREE.Vector2(oldestPos.x, oldestPos.z);
          
          if (p1.distanceTo(p2) < 2.0) {
            // TELEPORT directly to the target as requested
            if (targetPosRef.current) {
               npcPos.copy(targetPosRef.current);
            }
            
            // Reset brain
            nextState = 'THINKING';
            targetPosRef.current = null;
            historyPositions.current = []; // Flush history
          }
        }
      }
    } else {
      historyPositions.current = []; // Reset history if thinking
    }

    // --- RITUAL OVERRIDE ---
    if (activeRitual) {
       nextState = 'RITUAL';
       const ritualTarget = new THREE.Vector3(75.5, npcPos.y, -75);
       const dirToTarget = new THREE.Vector3().subVectors(ritualTarget, npcPos);
       
       if (ritualState === 'gathering') {
          if (dirToTarget.lengthSq() > 0.1) {
             nextAnim = anims.walk || anims.run || anims.idle;
             dirToTarget.normalize();
             containerRef.current.position.add(dirToTarget.clone().multiplyScalar(3 * delta));
             const angle = Math.atan2(dirToTarget.x, dirToTarget.z);
             targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
             containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
          } else {
             nextAnim = anims.idle;
             // Turn to face center
             const centerVec = new THREE.Vector3(72, npcPos.y, -77);
             const dirToCenter = new THREE.Vector3().subVectors(centerVec, npcPos).normalize();
             const angle = Math.atan2(dirToCenter.x, dirToCenter.z);
             targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
             containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
          }
       } else if (ritualState === 'channeling' || ritualState === 'climax') {
          nextAnim = anims.spell || anims.wave || anims.idle;
          const centerVec = new THREE.Vector3(72, npcPos.y, -77);
          const dirToCenter = new THREE.Vector3().subVectors(centerVec, npcPos).normalize();
          const angle = Math.atan2(dirToCenter.x, dirToCenter.z);
          targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
       }
    } else if (stateRef.current === 'RITUAL') {
       // Ritual ended, go back to normal
       nextState = 'THINKING';
    }

    // --- AI THINKING PHASE ---
    if (stateRef.current === 'THINKING') {
      nextAnim = anims.idle;
      if (!idleTimer.current) idleTimer.current = 0;
      idleTimer.current += delta;
      
      if (idleTimer.current > (3.0 + Math.random() * 5.0)) {
         if (Math.random() < 0.4) {
            nextState = 'PRACTICING';
            idleTimer.current = 0;
             if (Math.random() < 0.1) {
                setActiveSpell({ type: 'ultimate_holy', color: '#ffffff', duration: 6.0, scaleMultiplier: 3.0 });
             } else {
                const spells = [
                   { type: 'holy', color: '#ffd700' },
                   { type: 'water', color: '#00bfff' },
                   { type: 'nature', color: '#77ff00' }
                ];
                const pick = spells[Math.floor(Math.random() * spells.length)];
                setActiveSpell({ ...pick, duration: 3.0, scaleMultiplier: 1.0 });
             }
         } else {
            const centerX = 101;
            const centerZ = -76;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 10.0; // Stay within 10 units of center
            
            const testPos = new THREE.Vector3(
               centerX + Math.cos(angle) * dist,
               100,
               centerZ + Math.sin(angle) * dist
            );

      // 1. DOWNWARD RAYCAST (RAPIER)
      const ray = new RAPIER.Ray(testPos, downDir);
      const hit = world.castRay(ray, 200, true);
      
      if (hit && hit.timeOfImpact < 200) {
        const hitPoint = testPos.clone().add(downDir.clone().multiplyScalar(hit.timeOfImpact));
        targetPosRef.current = hitPoint;
        nextState = 'WALKING';
      }
      idleTimer.current = 0;
         }
      }
    } else if (stateRef.current === 'PRACTICING') {
         nextAnim = anims.spell || anims.wave || anims.idle;
         if (!idleTimer.current) idleTimer.current = 0;
         idleTimer.current += delta;
         const targetVec = new THREE.Vector3(101, npcPos.y, -76);
         const dirToTarget = new THREE.Vector3().subVectors(targetVec, npcPos);
         if (dirToTarget.lengthSq() > 0.1) {
            dirToTarget.normalize();
            const angle = Math.atan2(dirToTarget.x, dirToTarget.z);
            targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            containerRef.current.quaternion.slerp(targetQuaternion.current, 5 * delta);
         }
         if (idleTimer.current > activeSpell.duration) {
            nextState = 'THINKING';
            idleTimer.current = 0;
         }
    }
    
    // --- AI INTERACTING PHASE ---
    if (stateRef.current === 'INTERACTING') {
      interactTimer.current += delta;
      
      // Turn to face the player smoothly
      const dirToPlayer = new THREE.Vector3().subVectors(globalPlayerState.position, npcPos);
      dirToPlayer.y = 0;
      if (dirToPlayer.lengthSq() > 0.001) {
        dirToPlayer.normalize();
        const angle = Math.atan2(dirToPlayer.x, dirToPlayer.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
      }
      
      // Wave for 2 seconds, then go to Idle
      if (interactTimer.current < 2.0 && anims.wave) {
        nextAnim = anims.wave;
      } else {
        nextAnim = anims.idle;
      }
    }
    // --- AI WALKING & ESCAPING PHASE ---
    else if ((stateRef.current === 'WALKING' || stateRef.current === 'ESCAPING') && targetPosRef.current) {
      const dirToTarget = new THREE.Vector3().subVectors(targetPosRef.current, npcPos);
      dirToTarget.y = 0; 
      const distToTarget = dirToTarget.length();
      
      if (distToTarget > 0.001) {
        dirToTarget.normalize();
      }

      // If we successfully escaped for 2 seconds
      if (stateRef.current === 'ESCAPING') {
        escapeTimer.current += delta;
        if (escapeTimer.current > 2.0) {
          nextState = 'THINKING';
        }
      }

      // 2. FORWARD RAYCAST (WHISKER SYSTEM FOR CORNER AVOIDANCE)
      const forwardRayOrigin = new THREE.Vector3(npcPos.x, npcPos.y + 1.0, npcPos.z);
      
      const leftDir = dirToTarget.clone().applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/6);
      const rightDir = dirToTarget.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/6);

      const forwardHit = world.castRay(new RAPIER.Ray(forwardRayOrigin, dirToTarget), 1.5, true);
      const leftHit = world.castRay(new RAPIER.Ray(forwardRayOrigin, leftDir), 1.0, true);
      const rightHit = world.castRay(new RAPIER.Ray(forwardRayOrigin, rightDir), 1.0, true);
      
      const isBlocked = (forwardHit && forwardHit.timeOfImpact < 1.5) || 
                        (leftHit && leftHit.timeOfImpact < 1.0) || 
                        (rightHit && rightHit.timeOfImpact < 1.0);

      if (isBlocked && stateRef.current !== 'ESCAPING') {
        nextState = 'THINKING';
        targetPosRef.current = null;
        nextAnim = anims.idle;
      } 
      else if (distToTarget < 1.0) {
        nextState = 'THINKING';
        targetPosRef.current = null;
        nextAnim = anims.idle;
      } else {
        // TURN TO FACE TARGET
        const angle = Math.atan2(dirToTarget.x, dirToTarget.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
        
        // MOVE FORWARD - Slower relaxed pacing speed
        const speed = stateRef.current === 'ESCAPING' ? 5.0 : 2.0;
        npcPos.addScaledVector(dirToTarget, speed * delta);
        
        // 3. TERRAIN SNAPPING (RAPIER)
        const snapRayOrigin = new THREE.Vector3(npcPos.x, npcPos.y + 2.0, npcPos.z);
        const snapRay = new RAPIER.Ray(snapRayOrigin, downDir);
        const snapHit = world.castRay(snapRay, 50.0, true);
        
        if (snapHit && snapHit.timeOfImpact < 50.0) {
          const hitY = snapRayOrigin.y - snapHit.timeOfImpact;
          npcPos.y = THREE.MathUtils.lerp(npcPos.y, hitY, 10 * delta);
        }
        
        nextAnim = stateRef.current === 'ESCAPING' ? anims.run : anims.walk;
      }
    }

    if (stateRef.current !== nextState) {
      stateRef.current = nextState;
    }

    if (currentAnim.current !== nextAnim) {
      actions[currentAnim.current]?.fadeOut(0.2);
      actions[nextAnim]?.reset().fadeIn(0.2).play();
      currentAnim.current = nextAnim;
    }
  });

  // Array of random fun greetings
  const greetings = useMemo(() => [
    "Blessings upon you! The wind is strong today.",
    "Stay on the path, traveler. The woods are deep.",
    "Do you seek healing? I am just taking a walk.",
    "May the light guide your way across this island.",
    "Be careful near the cliffs. My magic can only do so much!"
  ], []);

  // Pick a random greeting when interacting starts
  const currentGreeting = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    if (isInteracting) return greetings[Math.floor(Math.random() * greetings.length)];
    return greetings[0];
  }, [isInteracting, greetings]);

  return (
    <group ref={containerRef} scale={scale}>
      {isPracticing && !activeRitual && <SpellEffect color={activeSpell.color} duration={activeSpell.duration} type={activeSpell.type} scaleMultiplier={activeSpell.scaleMultiplier} />}
      {(activeRitual && (ritualState === 'channeling' || ritualState === 'climax')) && (
        <SpellEffect color="#ffd700" duration={8.0} type="holy" scaleMultiplier={1.5} />
      )}
      <primitive ref={modelRef} object={clone} />

      {/* DIALOG BOX (Only renders when player is nearby and NPC is stopped) */}
      {/* Position elevated to 3.5 so it is cleanly above the NPC's head */}
      {isInteracting && (
        <Html position={[0, 3.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border-b-4 border-amber-500 w-64 transform transition-all animate-in zoom-in duration-200 pointer-events-none">
            <p className="text-amber-600 font-black text-sm mb-1 uppercase tracking-wider">{roleName}</p>
            <p className="text-slate-700 text-sm font-medium leading-relaxed">
              "{currentGreeting}"
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-4 border-r-4 border-amber-500 transform rotate-45"></div>
          </div>
        </Html>
      )}
    </group>
  );
};
