import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useRapier } from '@react-three/rapier';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { globalPlayerState } from './Character';
import { useGameStore } from '../../store/useGameStore';
import { DistanceNameTag } from './DistanceNameTag';

// GC Optimization: Pre-allocate Vector3s outside of the render loop
const _dirToStart = new THREE.Vector3();
const _testPos = new THREE.Vector3();
const _dirToPlayer = new THREE.Vector3();
const _dirToTarget = new THREE.Vector3();
const _forwardRayOrigin = new THREE.Vector3();
const _leftShoulder = new THREE.Vector3();
const _rightShoulder = new THREE.Vector3();
const _snapRayOrigin = new THREE.Vector3();
const _distVectorStart = new THREE.Vector2();
const _distVectorEnd = new THREE.Vector2();


interface CowboyFemaleNPCProps {
  colorTint?: string;
  roleName?: string;
  startPosition?: THREE.Vector3;
  maxWanderRadius?: number;
  dialogId?: string;
}

export const CowboyFemaleNPC = ({ 
  colorTint, 
  startPosition, 
  roleName = "Cowboy Female",
  maxWanderRadius,
  dialogId
}: CowboyFemaleNPCProps) => {
  const { scene, animations } = useGLTF('./models/NPCs/Cowboy_Female.glb');
  const containerRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const { world } = useRapier(); 
  
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasShownDialog, setHasShownDialog] = useState(false);
  const startPosRef = useRef<THREE.Vector3 | null>(null);
  
  const setActiveDialog = useGameStore(state => state.setActiveDialog);
  const activeDialogNpcId = useGameStore(state => state.activeDialogNpcId);
  const setActiveOutlineMesh = useGameStore(state => state.setActiveOutlineMesh);
  const npcId = useMemo(() => Math.random().toString(), []);

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  
  useEffect(() => {
    if (isInteracting && dialogId && !activeDialogNpcId && !hasShownDialog) {
       setActiveDialog(dialogId, npcId);
       setHasShownDialog(true);
    } else if (!isInteracting) {
       if (activeDialogNpcId === npcId) {
         setActiveDialog(null);
       }
       setHasShownDialog(false);
    }

    if (isInteracting && meshGroupRef.current) {
      setActiveOutlineMesh(meshGroupRef.current);
    } else if (!isInteracting) {
      if (useGameStore.getState().activeOutlineMesh === meshGroupRef.current) {
        setActiveOutlineMesh(null);
      }
    }
  }, [isInteracting, dialogId, activeDialogNpcId, setActiveDialog, npcId, hasShownDialog, setActiveOutlineMesh]);
  
  useEffect(() => {
    if (containerRef.current && startPosition) {
      containerRef.current.position.copy(startPosition);
      startPosRef.current = startPosition.clone();
    } else if (containerRef.current) {
      startPosRef.current = containerRef.current.position.clone();
    }
  }, []);

  const { actions, mixer } = useAnimations(animations, modelRef);

  // Dynamic animation resolver (Fixes missing animations)
  const anims = useMemo(() => {
    const getAnim = (names: string[]) => {
      for (const n of names) {
        const found = animations.find(a => a.name.toLowerCase() === n || a.name.toLowerCase().includes(n));
        if (found) return found.name;
      }
      return animations.length > 0 ? animations[0].name : '';
    };
    
    return { 
      idle: getAnim(['idle_weapon', 'idle', 'characterarmature|idle']), 
      walk: getAnim(['walk', 'characterarmature|walk']), 
      run: getAnim(['run', 'characterarmature|run', 'fastrun', 'sprint']), 
      wave: getAnim(['victory', 'wave', 'spell', 'characterarmature|wave', 'attack', 'cheer']),
      carry: getAnim(['walk_carry', 'carry', 'characterarmature|walk_carry', 'characterarmature|carry']),
      sit: getAnim(['sitdown', 'sit_down', 'sit', 'characterarmature|sitdown', 'characterarmature|sit_down']),
      stand: getAnim(['standup', 'stand_up', 'stand', 'characterarmature|standup', 'characterarmature|stand_up']),
      pickup: getAnim(['pickup', 'pick_up', 'characterarmature|pickup', 'characterarmature|pick_up'])
    };
  }, [animations]);

  const stateRef = useRef<'THINKING' | 'WALKING' | 'ESCAPING' | 'INTERACTING' | 'SUMMONED' | 'FARMING' | 'WALKING_TO_DEPOSIT' | 'DEPOSITING'>('THINKING');
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetIsFarmRef = useRef(false);
  const farmTimer = useRef(0);
  
  const historyPositions = useRef<THREE.Vector3[]>([]);
  const historyTimer = useRef(0);
  const escapeTimer = useRef(0);
  const interactTimer = useRef(0);
  const idleTimer = useRef(0);
  const failedTargetCount = useRef(0);

  const currentAnim = useRef('');
  const targetQuaternion = useRef(new THREE.Quaternion());
  const downDir = useMemo(() => new THREE.Vector3(0, -1, 0), []);

  useEffect(() => {
    if (anims.idle && !currentAnim.current) {
      currentAnim.current = anims.idle;
      actions[anims.idle]?.reset().fadeIn(0.2).play();
    }
  }, [anims.idle, actions]);

  const startupTimer = useRef(0);

  useFrame((rootState, delta) => {
    if (!containerRef.current || !currentAnim.current) return;
    if (startupTimer.current < 1.0) { startupTimer.current += delta; return; }

    const shouldBeVisible = globalPlayerState.position.distanceTo(containerRef.current.position) < 90;
    if (containerRef.current.visible !== shouldBeVisible) {
      containerRef.current.visible = shouldBeVisible;
      mixer.timeScale = shouldBeVisible ? 1 : 0;
    }
    if (!shouldBeVisible) return; // Halt all heavy AI logic and physics updates!


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

    // Teleport to spawn if wandering too far (anti-fall/escape bounds)
    if (startPosRef.current && npcPos.distanceTo(startPosRef.current) > 300) {
      npcPos.copy(startPosRef.current);
      if (typeof targetPosRef !== 'undefined' && targetPosRef) targetPosRef.current = null;
    }

    let nextAnim = currentAnim.current;
    let nextState = stateRef.current;

    
    const distToPlayer = npcPos.distanceTo(globalPlayerState.position);
    if (distToPlayer < 3.5) {
      if (stateRef.current !== 'INTERACTING') {
        nextState = 'INTERACTING';
        interactTimer.current = 0;
        targetPosRef.current = null; // Fix: Clear previous path on interrupt
        if (!isInteracting) setIsInteracting(true);
      }
    } else if (stateRef.current === 'INTERACTING') {
      nextState = 'THINKING';
      if (isInteracting) setIsInteracting(false);
    }
    
    if (stateRef.current === 'THINKING') {
      nextAnim = anims.idle; // Fix: Always default to idle when thinking
      idleTimer.current += delta;
    } else if (stateRef.current !== 'FARMING' && stateRef.current !== 'DEPOSITING') {
      idleTimer.current = 0;
    }

    

    // --- OFF-SCREEN RESET ESCAPE PLAN ---
    if (stateRef.current === 'ESCAPING') {
       nextAnim = anims.idle;
       
       // Check if camera is looking at the NPC
       const frustum = new THREE.Frustum();
       const projScreenMatrix = new THREE.Matrix4();
       projScreenMatrix.multiplyMatrices(rootState.camera.projectionMatrix, rootState.camera.matrixWorldInverse);
       frustum.setFromProjectionMatrix(projScreenMatrix);
       
       if (!frustum.containsPoint(npcPos)) {
          // Player is not looking! Safely reset!
          if (startPosRef.current) {
             npcPos.copy(startPosRef.current);
          }
          nextState = 'THINKING';
          failedTargetCount.current = 0;
       }
       
   
    // SEA / FALL CATCHER: If they wander into the water or fall off the map
    if (npcPos.y < 0.8) {
      if (startPosRef.current) {
         npcPos.copy(startPosRef.current);
      }
      nextState = 'THINKING';
      targetPosRef.current = null;
    }

    if (stateRef.current !== nextState) stateRef.current = nextState;
       if (currentAnim.current !== nextAnim && actions[nextAnim]) {
         actions[currentAnim.current]?.fadeOut(0.2);
         actions[nextAnim]?.reset().fadeIn(0.2).play();
         currentAnim.current = nextAnim;
       }
       return; // Skip all other logic while waiting to reset
    }

    // Normal wandering: immediately try to find a target!
    
    
    // Normal wandering: immediately try to find a target!
    if (stateRef.current === 'THINKING' && !targetPosRef.current) {
        const dist = 5.0 + Math.random() * 10.0; 
        
        let pickTargetX = 0;
        let pickTargetZ = 0;
        let needsToGoHome = false;
        
        if (maxWanderRadius && startPosRef.current) {
          const distFromStart = _distVectorStart.set(npcPos.x, npcPos.z).distanceTo(_distVectorEnd.set(startPosRef.current.x, startPosRef.current.z));
          if (distFromStart > maxWanderRadius * 0.8) {
             needsToGoHome = true;
             const dirToStart = _dirToStart.subVectors(startPosRef.current, npcPos);
             dirToStart.y = 0;
             if (dirToStart.lengthSq() > 0.001) dirToStart.normalize();
             pickTargetX = npcPos.x + dirToStart.x * dist;
             pickTargetZ = npcPos.z + dirToStart.z * dist;
          }
        }
        
        if (!needsToGoHome) {
          const angle = Math.random() * Math.PI * 2;
          pickTargetX = npcPos.x + Math.cos(angle) * dist;
          pickTargetZ = npcPos.z + Math.sin(angle) * dist;
        }
        
        const testPos = _testPos.set(pickTargetX, 100, pickTargetZ);
        const ray = new RAPIER.Ray(testPos, downDir);
        const hit = world.castRay(ray, 200, true);
        
        if (hit && hit.timeOfImpact < 200) {
          targetPosRef.current = testPos.clone().add(downDir.clone().multiplyScalar(hit.timeOfImpact));
          nextState = 'WALKING';
        }
    } 
    
    if (stateRef.current === 'INTERACTING') {
      interactTimer.current += delta;
      const dirToPlayer = _dirToPlayer.subVectors(globalPlayerState.position, npcPos);
      dirToPlayer.y = 0;
      if (dirToPlayer.lengthSq() > 0.001) {
        dirToPlayer.normalize();
        const angle = Math.atan2(dirToPlayer.x, dirToPlayer.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
      }
      
      if (interactTimer.current < 2.0 && anims.wave) {
        nextAnim = anims.wave;
      } else {
        nextAnim = anims.idle;
      }
    } else if ((stateRef.current === 'WALKING' || stateRef.current === 'SUMMONED') && targetPosRef.current) {
      const dirToTarget = _dirToTarget.subVectors(targetPosRef.current, npcPos);
      dirToTarget.y = 0; 
      const distToTarget = dirToTarget.length();
      
      if (distToTarget > 0.001) {
        dirToTarget.normalize();
      }

      
      
      
      // --- WIDE-SHOULDER ROOMBA PATHFINDING ---
      const shoulderWidth = 0.35;
      const forwardRayOrigin = _forwardRayOrigin.set(npcPos.x, npcPos.y + 0.6, npcPos.z);
      const leftShoulder = _leftShoulder.set(npcPos.x - dirToTarget.z * shoulderWidth, npcPos.y + 0.6, npcPos.z + dirToTarget.x * shoulderWidth);
      const rightShoulder = _rightShoulder.set(npcPos.x + dirToTarget.z * shoulderWidth, npcPos.y + 0.6, npcPos.z - dirToTarget.x * shoulderWidth);
      
      const fHit = world.castRayAndGetNormal(new RAPIER.Ray(forwardRayOrigin, dirToTarget), 1.0, true);
      const lHit = world.castRayAndGetNormal(new RAPIER.Ray(leftShoulder, dirToTarget), 1.0, true);
      const rHit = world.castRayAndGetNormal(new RAPIER.Ray(rightShoulder, dirToTarget), 1.0, true);
      
      // Determine if a hit is a steep wall (normal.y < 0.7). Hills/stairs (>= 0.7) are ignored!
      const isWall = (hit: any) => hit && hit.timeOfImpact < 1.0 && hit.normal && hit.normal.y < 0.7;
      const isBlocked = isWall(fHit) || isWall(lHit) || isWall(rHit);
      
      if (isBlocked && stateRef.current !== 'SUMMONED') {
        // Roomba logic: Immediately stop and pick a new target!
        nextState = 'THINKING';
        targetPosRef.current = null;
        nextAnim = anims.idle;
        
        // Count consecutive failures to detect if we are trapped
        failedTargetCount.current += 1;
        if (failedTargetCount.current > 4) {
           nextState = 'ESCAPING';
        }
      } else if (distToTarget < 1.0) {
        nextState = 'THINKING';
        targetPosRef.current = null;
        nextAnim = anims.idle;
        failedTargetCount.current = 0; // Reset failures on success!
      } else {
        const angle = Math.atan2(dirToTarget.x, dirToTarget.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
        
        const speed = (stateRef.current === 'SUMMONED') ? 5.0 : 2.0;
        npcPos.addScaledVector(dirToTarget, speed * delta);
        
        nextAnim = (stateRef.current === 'SUMMONED') ? anims.run : anims.walk;
      }
    }
    // GRAVITY & GROUND SNAPPING (Runs every frame for EVERY NPC)
    // Cast from slightly above the NPC to prevent them from teleporting onto tree canopies above them!
    const snapRayOrigin = _snapRayOrigin.set(npcPos.x, npcPos.y + 2.0, npcPos.z);
    const snapRay = new RAPIER.Ray(snapRayOrigin, downDir);
    const snapHit = world.castRay(snapRay, 50.0, true);
    
    if (snapHit && snapHit.timeOfImpact < 50.0) {
      const hitY = snapRayOrigin.y - snapHit.timeOfImpact;
      // CRITICAL FIX: Clamp the lerp t-value to 1.0 to prevent massive overshoot on lag spikes
      npcPos.y = THREE.MathUtils.lerp(npcPos.y, hitY, Math.min(1, 15 * delta));
    }

    if (stateRef.current !== nextState) stateRef.current = nextState;
    if (currentAnim.current !== nextAnim && actions[nextAnim]) {
      actions[currentAnim.current]?.fadeOut(0.2);
      actions[nextAnim]?.reset().fadeIn(0.2).play();
      currentAnim.current = nextAnim;
    }
  });

  const greetings = useMemo(() => ["What are ye lookin' at?", "Outta my way!", "I don't have time for you!"], []);
  const currentGreeting = useRef(greetings[0]);
  useEffect(() => {
    if (isInteracting) currentGreeting.current = greetings[Math.floor(Math.random() * greetings.length)];
  }, [isInteracting, greetings]);

  return (
    <group ref={containerRef} scale={0.58}>
      <group ref={modelRef} name={roleName}>
        <group ref={meshGroupRef}>
          <primitive object={clone} />
        </group>
      </group>
      
      {/* Debug Name Tag */}
      <DistanceNameTag name="Cowboy_Female" />

      {/* Interaction Dialog */}
      {isInteracting && (
        <Html position={[0, 3.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border-b-4 border-emerald-500 w-64 transform transition-all animate-in zoom-in duration-200 pointer-events-none">
            <p className="text-emerald-600 font-black text-sm mb-1 uppercase tracking-wider">{roleName}</p>
            <p className="text-slate-700 text-sm font-medium leading-relaxed">"{currentGreeting.current}"</p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-4 border-r-4 border-emerald-500 transform rotate-45"></div>
          </div>
        </Html>
      )}
    </group>
  );
};
