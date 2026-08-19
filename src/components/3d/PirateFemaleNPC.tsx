import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useRapier } from '@react-three/rapier';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { globalPlayerState } from './Character';
import { useGameStore } from '../../store/useGameStore';
import { useNpcRegistry } from '../../hooks/useNpcRegistry';
import { NpcChatBubble } from './NpcChatBubble';

export type PirateState = 'RESTING_SITTING' | 'RESTING_STANDING' | 'WALKING_TO_PORT' | 'WORKING_PORT' | 'WALKING_TO_STORAGE' | 'WORKING_STORAGE' | 'WALKING_TO_WAYPOINT' | 'WORKING_WAYPOINT' | 'WALKING_TO_HOUSE' | 'INTERACTING' | 'ESCAPING' | 'CHATTING';

interface PirateFemaleNPCProps {
  colorTint?: string;
  roleName?: string;
  startPosition?: THREE.Vector3;
  maxWanderRadius?: number;
  dialogId?: string;
  startState?: PirateState;
}

export const PirateFemaleNPC = ({ 
  colorTint, 
  startPosition, 
  roleName = "Pirate Female",
  maxWanderRadius,
  dialogId,
  startState = 'RESTING_SITTING'
}: PirateFemaleNPCProps) => {
  const { scene, animations } = useGLTF('./models/NPCs/Pirate_Female.glb');
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
  const store = useGameStore();
  

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
      walk_carry: getAnim(['walk_carry', 'characterarmature|walk_carry', 'walk', 'characterarmature|walk']), 
      run: getAnim(['run', 'characterarmature|run', 'fastrun', 'sprint']), 
      wave: getAnim(['victory', 'wave', 'spell', 'characterarmature|wave', 'attack', 'cheer']),
      work: getAnim(['pickup', 'pick_up', 'punch', 'attack']),
      sit: getAnim(['sitdown', 'sit_down', 'sit', 'idle']),
      stand: getAnim(['standup', 'stand_up', 'stand', 'idle'])
    };
  }, [animations]);

  const stateRef = useRef<PirateState>(startState);
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const interactTimer = useRef(0);
  const failedTargetCount = useRef(0);
  const workTimer = useRef(0);

  const currentAnim = useRef('');
  const targetQuaternion = useRef(new THREE.Quaternion());
  const downDir = useMemo(() => new THREE.Vector3(0, -1, 0), []);

  useEffect(() => {
    if (anims.idle && !currentAnim.current) {
      currentAnim.current = anims.idle;
      actions[anims.idle]?.reset().fadeIn(0.2).play();
    }
  }, [anims.idle, actions]);

  const startupTimer = useRef(-Math.random() * 5.0);
  const speedFactor = useMemo(() => 1.5 + Math.random() * 1.0, []);

  useNpcRegistry(npcId, 'PIRATE_FEMALE', containerRef, stateRef, 'PIRATES');
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
        if (!isInteracting) setIsInteracting(true);
      }
    } else if (stateRef.current === 'INTERACTING') {
      nextState = 'RESTING_SITTING'; // Fallback to resting
      if (isInteracting) setIsInteracting(false);
    }
    
    if (npcPos.y < 0.8) {
      if (startPosRef.current) npcPos.copy(startPosRef.current);
      nextState = 'RESTING_SITTING';
      targetPosRef.current = null;
    }

    // Dynamic Target Helper via Bounding Box (handles baked coordinates perfectly)
    const getTargetPos = (namePart: string, offsetDir: THREE.Vector3) => {
        let foundNode: THREE.Object3D | null = null;
        rootState.scene.traverse((child) => {
            if (!foundNode && child.name && child.name.toLowerCase().includes(namePart.toLowerCase())) {
                foundNode = child;
            }
        });
        if (foundNode) {
            const box = new THREE.Box3().setFromObject(foundNode);
            if (!box.isEmpty()) {
                const center = new THREE.Vector3();
                box.getCenter(center);
                return center.add(offsetDir.clone().multiplyScalar(2.0)); // 2.0m offset
            }
        }
        return null;
    };

    if (stateRef.current === 'INTERACTING') {
      interactTimer.current += delta;
      const dirToPlayer = new THREE.Vector3().subVectors(globalPlayerState.position, npcPos);
      dirToPlayer.y = 0;
      if (dirToPlayer.lengthSq() > 0.001) {
        dirToPlayer.normalize();
        const angle = Math.atan2(dirToPlayer.x, dirToPlayer.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
      }
      nextAnim = (interactTimer.current < 2.0 && anims.wave) ? anims.wave : anims.idle;
      
    } else if (stateRef.current === 'CHATTING') {
      const targetPos = store.npcChatTargets[npcId];
      if (targetPos) {
        const dir = new THREE.Vector3().subVectors(targetPos, npcPos);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) {
          dir.normalize();
          const angle = Math.atan2(dir.x, dir.z);
          targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          containerRef.current.quaternion.slerp(targetQuaternion.current, 5 * delta);
        }
      }
      if (anims.idle) nextAnim = anims.idle;
    } else if (stateRef.current === 'RESTING_SITTING') {
        nextAnim = anims.sit;
        workTimer.current += delta;
        if (workTimer.current > (5.0 + Math.random() * 15.0)) {
            nextState = 'RESTING_STANDING';
            workTimer.current = 0;
        }
    } else if (stateRef.current === 'RESTING_STANDING') {
        nextAnim = anims.stand;
        workTimer.current += delta;
        // Wait 1.5 seconds to finish standing up before walking
        if (workTimer.current > 1.5) {
            targetPosRef.current = new THREE.Vector3(113.3 + (Math.random() * 2 - 1), 30.0, 124.3 + (Math.random() * 2 - 1)); // Port with jitter
            nextState = 'WALKING_TO_PORT';
            workTimer.current = 0;
        }
    } else if (stateRef.current === 'WORKING_PORT') {
        nextAnim = anims.work || anims.idle;
        workTimer.current += delta;
        if (workTimer.current > (5.0 + Math.random() * 15.0)) {
            targetPosRef.current = new THREE.Vector3(110.0 + (Math.random() * 2 - 1), 30.0, 111.0 + (Math.random() * 2 - 1)); // Storage with jitter
            nextState = 'WALKING_TO_STORAGE';
            workTimer.current = 0;
        }
    } else if (stateRef.current === 'WORKING_STORAGE') {
        nextAnim = anims.work || anims.idle;
        workTimer.current += delta;
        if (workTimer.current > (5.0 + Math.random() * 15.0)) {
            // WAYPOINT WITH RANDOM JITTER
            targetPosRef.current = new THREE.Vector3(101.0 + (Math.random() * 2 - 1), 30.0, 119.0 + (Math.random() * 2 - 1));
            nextState = 'WALKING_TO_WAYPOINT';
            workTimer.current = 0;
        }
    } else if (stateRef.current === 'WORKING_WAYPOINT') {
        nextAnim = anims.idle;
        workTimer.current += delta;
        if (workTimer.current > (5.0 + Math.random() * 10.0)) {
            targetPosRef.current = new THREE.Vector3(97.0 + (Math.random() * 2 - 1), 30.0, 104.0 + (Math.random() * 2 - 1));
            nextState = 'WALKING_TO_HOUSE';
            workTimer.current = 0;
        }
    } else if (stateRef.current.startsWith('WALKING_TO_') && targetPosRef.current) {
      const dirToTarget = new THREE.Vector3().subVectors(targetPosRef.current, npcPos);
      dirToTarget.y = 0; 
      const distToTarget = dirToTarget.length();
      
      if (distToTarget > 0.001) {
        dirToTarget.normalize();
      }

      const shoulderWidth = 0.35;
      const forwardRayOrigin = new THREE.Vector3(npcPos.x, npcPos.y + 0.6, npcPos.z);
      const leftShoulder = new THREE.Vector3(npcPos.x - dirToTarget.z * shoulderWidth, npcPos.y + 0.6, npcPos.z + dirToTarget.x * shoulderWidth);
      const rightShoulder = new THREE.Vector3(npcPos.x + dirToTarget.z * shoulderWidth, npcPos.y + 0.6, npcPos.z - dirToTarget.x * shoulderWidth);
      
      const fHit = world.castRayAndGetNormal(new RAPIER.Ray(forwardRayOrigin, dirToTarget), 1.0, true);
      const lHit = world.castRayAndGetNormal(new RAPIER.Ray(leftShoulder, dirToTarget), 1.0, true);
      const rHit = world.castRayAndGetNormal(new RAPIER.Ray(rightShoulder, dirToTarget), 1.0, true);
      
      const isWall = (hit: any) => hit && hit.timeOfImpact < 2.0 && hit.normal && hit.normal.y < 0.7;
      
      let moveDir = dirToTarget.clone();
      let isBlocked = false;
      
      if (isWall(fHit) || isWall(lHit) || isWall(rHit)) {
        isBlocked = true;
        let bestHit = fHit;
        if (!isWall(bestHit)) bestHit = lHit;
        if (!isWall(bestHit)) bestHit = rHit;
        
        const hitNormal = new THREE.Vector3(bestHit!.normal.x, 0, bestHit!.normal.z).normalize();
        
        // Find tangents to walk along the wall
        const tangent1 = new THREE.Vector3(hitNormal.z, 0, -hitNormal.x);
        const tangent2 = new THREE.Vector3(-hitNormal.z, 0, hitNormal.x);
        
        // Pick the tangent that takes us closest to the target
        if (tangent1.dot(dirToTarget) > tangent2.dot(dirToTarget)) {
           moveDir.copy(tangent1);
        } else {
           moveDir.copy(tangent2);
        }
        
        // Push away from the wall to prevent clipping
        const pushFactor = Math.max(0.5, 2.0 - bestHit!.timeOfImpact);
        moveDir.addScaledVector(hitNormal, pushFactor).normalize();
      }
      
      if (isBlocked) {
        failedTargetCount.current += 1;
        if (failedTargetCount.current > 180) { // Wait 3 seconds before giving up and teleporting
           if (targetPosRef.current) {
               npcPos.copy(targetPosRef.current);
               npcPos.y = 30.0; 
           }
           failedTargetCount.current = 0;
           if (stateRef.current === 'WALKING_TO_PORT') nextState = 'WORKING_PORT';
           else if (stateRef.current === 'WALKING_TO_STORAGE') nextState = 'WORKING_STORAGE';
           else if (stateRef.current === 'WALKING_TO_HOUSE') nextState = 'RESTING_SITTING';
           else if (stateRef.current === 'WALKING_TO_WAYPOINT') nextState = 'WORKING_WAYPOINT';
           targetPosRef.current = null;
           workTimer.current = 0;
        } else {
           // We are dodging! 
           const angle = Math.atan2(moveDir.x, moveDir.z);
           targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
           containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
           npcPos.addScaledVector(moveDir, speedFactor * delta);
           
           if (stateRef.current === 'WALKING_TO_STORAGE') {
               nextAnim = anims.walk_carry || anims.walk;
           } else {
               nextAnim = anims.walk;
           }
        }
      } else if (distToTarget < 1.0) {
        if (stateRef.current === 'WALKING_TO_PORT') nextState = 'WORKING_PORT';
        else if (stateRef.current === 'WALKING_TO_STORAGE') nextState = 'WORKING_STORAGE';
        else if (stateRef.current === 'WALKING_TO_HOUSE') nextState = 'RESTING_SITTING';
           else if (stateRef.current === 'WALKING_TO_WAYPOINT') nextState = 'WORKING_WAYPOINT';
        
        targetPosRef.current = null;
        workTimer.current = 0;
        failedTargetCount.current = 0; 
      } else {
        const angle = Math.atan2(moveDir.x, moveDir.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
        
        npcPos.addScaledVector(moveDir, speedFactor * delta);
        
        if (stateRef.current === 'WALKING_TO_STORAGE') {
            nextAnim = anims.walk_carry || anims.walk;
        } else {
            nextAnim = anims.walk;
        }
        failedTargetCount.current = 0;
      }
    }

    // GRAVITY & GROUND SNAPPING
    const snapRayOrigin = new THREE.Vector3(npcPos.x, npcPos.y + 0.5, npcPos.z);
    const snapRay = new RAPIER.Ray(snapRayOrigin, downDir);
    const snapHit = world.castRay(snapRay, 50.0, true);
    
    if (snapHit && snapHit.timeOfImpact < 50.0) {
      const hitY = snapRayOrigin.y - snapHit.timeOfImpact;
      npcPos.y = THREE.MathUtils.lerp(npcPos.y, hitY, Math.min(1, 15 * delta));
    }

    if (stateRef.current !== nextState) stateRef.current = nextState;
    if (currentAnim.current !== nextAnim && actions[nextAnim]) {
      actions[currentAnim.current]?.fadeOut(0.2);
      
      const action = actions[nextAnim];
      if (action) {
         action.reset().fadeIn(0.2);
         if (nextState === 'RESTING_SITTING' || nextState === 'RESTING_STANDING') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
         } else {
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;
         }
         action.play();
      }
      currentAnim.current = nextAnim;
    }


  });

  const greetings = useMemo(() => ["Arrr matey!", "Busy workin' here!", "Cargo won't move itself!"], []);
  const currentGreeting = useRef(greetings[0]);
  useEffect(() => {
    if (isInteracting) currentGreeting.current = greetings[Math.floor(Math.random() * greetings.length)];
  }, [isInteracting, greetings]);

  return (
    <group ref={containerRef} scale={0.58}>
      <NpcChatBubble npcId={npcId} />
      <group ref={modelRef} name={roleName}>
        <group ref={meshGroupRef}>
          <primitive object={clone} />
        </group>
      </group>
      
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
