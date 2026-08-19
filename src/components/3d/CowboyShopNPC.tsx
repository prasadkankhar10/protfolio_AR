import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame, useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useGameStore } from '../../store/useGameStore';
import { useNpcRegistry } from '../../hooks/useNpcRegistry';
import { NpcChatBubble } from './NpcChatBubble';

import { globalPlayerState } from './Character';

interface CowboyShopNPCProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function CowboyShopNPC({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.58
}: CowboyShopNPCProps) {
  const containerRef = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF('./models/NPCs/Cowboy_Hair.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions, mixer } = useAnimations(animations, containerRef);
  
  const npcId = useMemo(() => Math.random().toString(), []);
  const store = useGameStore();
  const stateRef = useRef<'THINKING' | 'WALKING' | 'INTERACTING' | 'CHATTING'>('THINKING');
  useNpcRegistry(npcId, 'CowboyShopNPC', containerRef, stateRef, 'MARKET');

  const setActiveDialog = useGameStore((state) => state.setActiveDialog);
  const activeDialogNpcId = useGameStore((state) => state.activeDialogNpcId);
  const activeDialogId = useGameStore((state) => state.activeDialogId);

  // Movement refs
  const targetPos = useRef(new THREE.Vector3(...position));
  const targetQuaternion = useRef(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)));
  const idleTimer = useRef(0);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const hasTalkedToPlayer = useRef(false);
  const barkTimer = useRef(Math.random() * 15);
  
  
  const waypoints = [
    new THREE.Vector3(105.2, 3.0, 7.7),
    new THREE.Vector3(115.0, 3.0, 9.5)
  ];
  const currentWaypointIndex = useRef(0);
  
  const pickRandomWaypoint = () => {
    targetPos.current.copy(waypoints[currentWaypointIndex.current]);
    currentWaypointIndex.current = (currentWaypointIndex.current + 1) % waypoints.length;
    stateRef.current = 'WALKING';
  };


  // Handle interaction
  useEffect(() => {
    if (activeDialogNpcId === npcId && stateRef.current !== 'INTERACTING') {
      stateRef.current = 'INTERACTING';
      // Dialog is already set by Character.tsx raycaster interaction or we can set it here if we trigger it by proximity
    } else if (activeDialogNpcId !== npcId && stateRef.current === 'INTERACTING') {
      stateRef.current = 'THINKING';
    }
  }, [activeDialogNpcId, npcId]);

  useFrame((rootState, delta) => {
    if (!containerRef.current) return;

    const shouldBeVisible = globalPlayerState.position.distanceTo(containerRef.current.position) < 90;
    if (containerRef.current.visible !== shouldBeVisible) {
      containerRef.current.visible = shouldBeVisible;
      if (typeof mixer !== 'undefined' && mixer) mixer.timeScale = shouldBeVisible ? 1 : 0;
    }
    if (!shouldBeVisible) return;

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

    let nextAnim = 'Idle';

    // Proximity interaction
    const playerPos = globalPlayerState.position;
    const distToPlayer = npcPos.distanceTo(playerPos);
    
    if (distToPlayer < 3.5 && stateRef.current !== 'INTERACTING' && !activeDialogNpcId && !hasTalkedToPlayer.current) {
      stateRef.current = 'INTERACTING';
      hasTalkedToPlayer.current = true;
      setActiveDialog('cowboy_shop_1', npcId);
    }

    if (stateRef.current === 'INTERACTING') {
      if (playerPos) {
        const dir = new THREE.Vector3().subVectors(playerPos, npcPos);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) {
          dir.normalize();
          const angle = Math.atan2(dir.x, dir.z);
          targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          containerRef.current.quaternion.slerp(targetQuaternion.current, 5 * delta);
        }
      }
      nextAnim = 'Idle';
      
      // Auto-exit if player walks away
      if (playerPos && distToPlayer > 5) {
         if (activeDialogId && activeDialogId.startsWith('cowboy')) {
           setActiveDialog(null);
         }
         stateRef.current = 'THINKING';
      }
    } else if (stateRef.current === 'CHATTING') {
      const chatTarget = store.npcChatTargets[npcId];
      if (chatTarget) {
        const dir = new THREE.Vector3().subVectors(chatTarget, npcPos);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) {
          dir.normalize();
          const angle = Math.atan2(dir.x, dir.z);
          targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          containerRef.current.quaternion.slerp(targetQuaternion.current, 5 * delta);
        }
      }
      nextAnim = 'Idle';
    } else if (stateRef.current === 'WALKING') {
      const dir = new THREE.Vector3().subVectors(targetPos.current, npcPos);
      dir.y = 0;
      const dist = dir.length();
      
      if (dist > 0.1) {
        dir.normalize();
        const moveSpeed = 1.5;
        containerRef.current.position.addScaledVector(dir, moveSpeed * delta);
        
        const angle = Math.atan2(dir.x, dir.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
        nextAnim = 'Walking_A';
      } else {
        stateRef.current = 'THINKING';
        idleTimer.current = 0;
      }
    } else if (stateRef.current === 'THINKING') {
      idleTimer.current += delta;
      barkTimer.current -= delta;
      if (barkTimer.current <= 0) {
        barkTimer.current = 10 + Math.random() * 20; // Every 10 to 30 seconds
        if (!store.npcSpeechBubbles[npcId]) {
           const barks = ["Howdy! Take a look at these goods!", "Best supplies in the west!", "Step right up!"];
           useGameStore.getState().setNpcSpeechBubble(npcId, barks[Math.floor(Math.random() * barks.length)]);
           setTimeout(() => {
              if (useGameStore.getState()) useGameStore.getState().setNpcSpeechBubble(npcId, null);
           }, 3000);
        }
      }
      if (idleTimer.current > 5) { // every 5 seconds, decide to walk if logic permits
         idleTimer.current = 0;
         pickRandomWaypoint();
      }
    }

    // Play animation
    const anims = {
      idle: actions['Idle'] || actions['CharacterArmature|Idle'] || actions['Idle_A'] || Object.values(actions)[0],
      walk: actions['Walk'] || actions['Walking_A'] || actions['CharacterArmature|Run'] || actions['Walking_B'] || actions['Walking_C']
    };
    
    const targetAction = nextAnim === 'Idle' ? anims.idle : anims.walk;
    
    if (targetAction && currentActionRef.current !== targetAction) {
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.2);
      }
      targetAction.reset().fadeIn(0.2).play();
      currentActionRef.current = targetAction;
    }
  });

  return (
    <group ref={containerRef} position={position} rotation={rotation} scale={scale} dispose={null}>
      <NpcChatBubble npcId={npcId} />
      <primitive object={clone} />
    </group>
  );
}

useGLTF.preload('./models/NPCs/Cowboy_Hair.glb');
