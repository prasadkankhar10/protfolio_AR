import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame, useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useGameStore } from '../../store/useGameStore';
import { useNpcRegistry } from '../../hooks/useNpcRegistry';
import { NpcChatBubble } from './NpcChatBubble';

interface MarketVisitorNPCProps {
  modelFile: string;
  startPosition?: [number, number, number];
}

const SHOP_LOCATIONS = [
  { standPos: new THREE.Vector3(119.5, 3.0, 1.2), lookAt: new THREE.Vector3(121.5, 3.0, 1.2), type: 'VikingBlacksmithNPC' },
  { standPos: new THREE.Vector3(105.8, 3.0, -7.5), lookAt: new THREE.Vector3(103.8, 3.0, -7.5), type: 'CasualShopNPC' },
  { standPos: new THREE.Vector3(118.7, 3.0, -7.1), lookAt: new THREE.Vector3(120.7, 3.0, -7.1), type: 'WitchShopNPC' },
  { standPos: new THREE.Vector3(123.6, 3.0, 7.4), lookAt: new THREE.Vector3(125.6, 3.0, 7.4), type: 'GoblinFruitNPC' },
  { standPos: new THREE.Vector3(110.0, 3.0, 5.5), lookAt: new THREE.Vector3(110.0, 3.0, 8.5), type: 'CowboyShopNPC' }
];

interface ChatLine {
  speaker: 'visitor' | 'shopkeeper';
  text: string;
  duration: number;
}

const CONVERSATIONS: Record<string, ChatLine[][]> = {
  'VikingBlacksmithNPC': [
    [
      { speaker: 'visitor', text: "Do you have any sturdy shields?", duration: 3 },
      { speaker: 'shopkeeper', text: "Only the finest forged steel here!", duration: 3 },
      { speaker: 'visitor', text: "I'll take one. Here's your coin.", duration: 3 },
      { speaker: 'shopkeeper', text: "May it serve you well in battle.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Is that sword balanced?", duration: 3 },
      { speaker: 'shopkeeper', text: "Lift it yourself! Light as a feather.", duration: 3 },
      { speaker: 'visitor', text: "Impressive craftsmanship.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Can you repair my armor?", duration: 3 },
      { speaker: 'shopkeeper', text: "Leave it with me for an hour.", duration: 3 },
      { speaker: 'visitor', text: "Thanks, I'll be back.", duration: 3 }
    ],
    [
      { speaker: 'shopkeeper', text: "Need a new weapon?", duration: 3 },
      { speaker: 'visitor', text: "Just looking today, thanks.", duration: 3 }
    ]
  ],
  'CasualShopNPC': [
    [
      { speaker: 'visitor', text: "Are these wooden shields durable?", duration: 3 },
      { speaker: 'shopkeeper', text: "Reinforced with iron banding!", duration: 3 },
      { speaker: 'visitor', text: "I'll take the round one.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "I lost my shield in the woods.", duration: 3 },
      { speaker: 'shopkeeper', text: "You're lucky to be alive! Buy a backup.", duration: 3 },
      { speaker: 'visitor', text: "Good point. I'll take two.", duration: 3 }
    ],
    [
      { speaker: 'shopkeeper', text: "Best defense in the market!", duration: 3 },
      { speaker: 'visitor', text: "They do look sturdy...", duration: 3 },
      { speaker: 'shopkeeper', text: "Feel the weight! They won't break.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Do you paint custom crests?", duration: 3 },
      { speaker: 'shopkeeper', text: "For a few extra coins, yes.", duration: 3 }
    ]
  ],
  'WitchShopNPC': [
    [
      { speaker: 'visitor', text: "Are these apples fresh?", duration: 3 },
      { speaker: 'shopkeeper', text: "Picked this morning, magically preserved!", duration: 3 },
      { speaker: 'visitor', text: "I'll take a dozen.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Do you have healing potions?", duration: 3 },
      { speaker: 'shopkeeper', text: "Sold out, but I have stamina drafts.", duration: 3 },
      { speaker: 'visitor', text: "I guess that will do.", duration: 3 }
    ],
    [
      { speaker: 'shopkeeper', text: "Care for a magical brew?", duration: 3 },
      { speaker: 'visitor', text: "Is it safe to drink?", duration: 3 },
      { speaker: 'shopkeeper', text: "Mostly!", duration: 3 },
      { speaker: 'visitor', text: "Uh... I'll pass.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Smells like brimstone...", duration: 3 },
      { speaker: 'shopkeeper', text: "That's just my latest experiment.", duration: 3 }
    ]
  ],
  'GoblinFruitNPC': [
    [
      { speaker: 'visitor', text: "How much for the oranges?", duration: 3 },
      { speaker: 'shopkeeper', text: "Three coins for a bag!", duration: 3 },
      { speaker: 'visitor', text: "Deal. Here you go.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "These look a bit bruised...", duration: 3 },
      { speaker: 'shopkeeper', text: "Still tastes sweet! Discount for you!", duration: 3 },
      { speaker: 'visitor', text: "Alright, you've convinced me.", duration: 3 }
    ],
    [
      { speaker: 'shopkeeper', text: "Sweetest fruit in the market!", duration: 3 },
      { speaker: 'visitor', text: "Can I try a sample?", duration: 3 },
      { speaker: 'shopkeeper', text: "No freebies!", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Got any exotic fruits?", duration: 3 },
      { speaker: 'shopkeeper', text: "Try the glowing ones!", duration: 3 },
      { speaker: 'visitor', text: "I think I'll stick to apples.", duration: 3 }
    ]
  ],
  'CowboyShopNPC': [
    [
      { speaker: 'visitor', text: "Got any sturdy rope?", duration: 3 },
      { speaker: 'shopkeeper', text: "Best woven hemp in the west!", duration: 3 },
      { speaker: 'visitor', text: "I'll take 50 feet.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "Do you sell camping gear?", duration: 3 },
      { speaker: 'shopkeeper', text: "Everything you need for the wild.", duration: 3 },
      { speaker: 'visitor', text: "Let me see a bedroll.", duration: 3 }
    ],
    [
      { speaker: 'shopkeeper', text: "Need supplies for the road?", duration: 3 },
      { speaker: 'visitor', text: "Yeah, travelling light though.", duration: 3 },
      { speaker: 'shopkeeper', text: "I've got compact rations right here.", duration: 3 }
    ],
    [
      { speaker: 'visitor', text: "How much for the lantern?", duration: 3 },
      { speaker: 'shopkeeper', text: "Five coins, oil included.", duration: 3 },
      { speaker: 'visitor', text: "I'll take it.", duration: 3 }
    ]
  ]
};

export function MarketVisitorNPC({ modelFile, startPosition = [115, 3.0, 0] }: MarketVisitorNPCProps) {
  const containerRef = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(`./models/NPCs/${modelFile}`);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions, mixer } = useAnimations(animations, containerRef);
  
  const npcId = useMemo(() => Math.random().toString(), []);
  const store = useGameStore();
  const stateRef = useRef<'THINKING' | 'WALKING' | 'BROWSING' | 'BUYING'>('THINKING');
  useNpcRegistry(npcId, 'VISITOR', containerRef, stateRef, 'MARKET');

  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const timer = useRef(0);
  
  const currentShopIndex = useRef(-1);
  const targetPos = useRef(new THREE.Vector3(...startPosition));
  const targetQuaternion = useRef(new THREE.Quaternion());

  // Conversation state
  const activeScript = useRef<ChatLine[]>([]);
  
  useEffect(() => {
    return () => {
      // Free up any shop we might have claimed when we unmount
      if (currentShopIndex.current >= 0 && currentShopIndex.current < SHOP_LOCATIONS.length) {
         useGameStore.getState().setShopOccupied(SHOP_LOCATIONS[currentShopIndex.current].type, false);
      }
    };
  }, []);
  const currentLineIndex = useRef(0);
  const chatTargetId = useRef<string | null>(null);

  useFrame((rootState, delta) => {
    if (!containerRef.current) return;

    const shouldBeVisible = rootState.camera.position.distanceTo(containerRef.current.position) < 90;
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

    if (stateRef.current === 'THINKING') {
      timer.current -= delta;
      if (timer.current <= 0) {
        // Pick a new random unoccupied shop
        const availableShops = SHOP_LOCATIONS.filter((s, idx) => !useGameStore.getState().occupiedShops[s.type] && idx !== currentShopIndex.current);
        if (availableShops.length > 0) {
           const shop = availableShops[Math.floor(Math.random() * availableShops.length)];
           currentShopIndex.current = SHOP_LOCATIONS.indexOf(shop);
           useGameStore.getState().setShopOccupied(shop.type, true);
           targetPos.current.copy(shop.standPos);
           stateRef.current = 'WALKING';
        } else {
           // All shops busy, wait a bit
           timer.current = 1.0;
        }
      }
    } else if (stateRef.current === 'WALKING') {
      const dir = new THREE.Vector3().subVectors(targetPos.current, npcPos);
      dir.y = 0;
      const dist = dir.length();
      
      if (dist > 0.5) {
        dir.normalize();
        const moveSpeed = 1.8;
        containerRef.current.position.addScaledVector(dir, moveSpeed * delta);
        
        const angle = Math.atan2(dir.x, dir.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
        nextAnim = 'Walking_A';
      } else {
        stateRef.current = 'BROWSING';
        timer.current = 2 + Math.random() * 3; // Browse for 2-5 seconds
        
        // Face the shopkeeper
        const lookDir = new THREE.Vector3().subVectors(SHOP_LOCATIONS[currentShopIndex.current].lookAt, npcPos);
        lookDir.y = 0;
        lookDir.normalize();
        const lookAngle = Math.atan2(lookDir.x, lookDir.z);
        targetQuaternion.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), lookAngle);
      }
    } else if (stateRef.current === 'BROWSING') {
      containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
      timer.current -= delta;
      
      if (timer.current <= 0) {
        stateRef.current = 'BUYING';
        
        // Find shopkeeper ID
        const targetType = SHOP_LOCATIONS[currentShopIndex.current].type;
        const registry = useGameStore.getState().npcRegistry;
        const shopkeeperId = Object.keys(registry).find(id => registry[id].role === targetType);
        chatTargetId.current = shopkeeperId || null;
        
        // Pick random script
        const scripts = CONVERSATIONS[targetType] || [];
        if (scripts.length > 0) {
           activeScript.current = scripts[Math.floor(Math.random() * scripts.length)];
        } else {
           activeScript.current = [];
        }
        
        currentLineIndex.current = 0;
        timer.current = 0; // Trigger first line immediately
      }
    } else if (stateRef.current === 'BUYING') {
      containerRef.current.quaternion.slerp(targetQuaternion.current, 10 * delta);
      timer.current -= delta;
      nextAnim = 'Idle';
      
      if (timer.current <= 0) {
         // Clear previous bubbles safely
         useGameStore.getState().setNpcSpeechBubble(npcId, null);
         if (chatTargetId.current) useGameStore.getState().setNpcSpeechBubble(chatTargetId.current, null);

         if (currentLineIndex.current < activeScript.current.length) {
            const line = activeScript.current[currentLineIndex.current];
            const speakerId = line.speaker === 'visitor' ? npcId : chatTargetId.current;
            if (speakerId) {
               useGameStore.getState().setNpcSpeechBubble(speakerId, line.text);
            }
            timer.current = line.duration;
            currentLineIndex.current++;
         } else {
            // End of script
            stateRef.current = 'THINKING';
            timer.current = 1 + Math.random() * 3; // Think for 1-4 seconds before moving on
            
            // Free the shop
            const targetType = SHOP_LOCATIONS[currentShopIndex.current].type;
            useGameStore.getState().setShopOccupied(targetType, false);
         }
      }
    }

    // Play animation
    const anims = {
      idle: actions['Idle'] || actions['CharacterArmature|Idle'] || actions['Idle_A'] || Object.values(actions)[0],
      walk: actions['Walk'] || actions['Walking_A'] || actions['CharacterArmature|Run'] || actions['Walking_B'] || actions['Walking_C'],
      interact: actions['PickUp'] || actions['CharacterArmature|PickUp'] || actions['Wave'] || actions['Punch'] || actions['Interact'] || actions['Idle']
    };
    
    let targetAction = anims.idle;
    if (nextAnim === 'Walking_A') targetAction = anims.walk;
    else if (nextAnim === 'Interact') targetAction = anims.interact;
    
    if (targetAction && currentActionRef.current !== targetAction) {
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.2);
      }
      targetAction.reset().fadeIn(0.2).play();
      currentActionRef.current = targetAction;
    }
  });

  return (
    <group ref={containerRef} position={startPosition} scale={0.58} dispose={null}>
      <NpcChatBubble npcId={npcId} />
      <primitive object={clone} />
    </group>
  );
}

// Preload dynamic visitor models
useGLTF.preload('./models/NPCs/Casual3_Male.glb');
useGLTF.preload('./models/NPCs/Knight_Male.glb');
useGLTF.preload('./models/NPCs/Cowboy_Female.glb');
