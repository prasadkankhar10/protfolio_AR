import React, { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment as DreiEnvironment, Stats, Sky } from '@react-three/drei';
import { EffectComposer, Outline, Selection, Bloom, Vignette } from '@react-three/postprocessing';
import { Environment } from './Environment';
import { AtmosphereManager } from './AtmosphereManager';
import { Character } from './Character';
import { CompanionOrb } from './CompanionOrb';
import { Birds } from './Birds';
import { Fireflies } from './Fireflies';
import { FreeCamManager } from './FreeCam';
import { Sea } from './Sea';
const ClericNPC = React.lazy(() => import('./ClericNPC').then(m => ({ default: m.ClericNPC })));
const BlueSoldierFemaleNPC = React.lazy(() => import('./BlueSoldierFemaleNPC').then(m => ({ default: m.BlueSoldierFemaleNPC })));
const BlueSoldierMaleNPC = React.lazy(() => import('./BlueSoldierMaleNPC').then(m => ({ default: m.BlueSoldierMaleNPC })));
const Casual3FemaleNPC = React.lazy(() => import('./Casual3FemaleNPC').then(m => ({ default: m.Casual3FemaleNPC })));
const Casual3MaleNPC = React.lazy(() => import('./Casual3MaleNPC').then(m => ({ default: m.Casual3MaleNPC })));
const CowboyFemaleNPC = React.lazy(() => import('./CowboyFemaleNPC').then(m => ({ default: m.CowboyFemaleNPC })));
const CowboyHairNPC = React.lazy(() => import('./CowboyHairNPC').then(m => ({ default: m.CowboyHairNPC })));
const CowboyMaleNPC = React.lazy(() => import('./CowboyMaleNPC').then(m => ({ default: m.CowboyMaleNPC })));
const ElfNPC = React.lazy(() => import('./ElfNPC').then(m => ({ default: m.ElfNPC })));
const GoblinFemaleNPC = React.lazy(() => import('./GoblinFemaleNPC').then(m => ({ default: m.GoblinFemaleNPC })));
const GoblinMaleNPC = React.lazy(() => import('./GoblinMaleNPC').then(m => ({ default: m.GoblinMaleNPC })));
const KnightGoldenFemaleNPC = React.lazy(() => import('./KnightGoldenFemaleNPC').then(m => ({ default: m.KnightGoldenFemaleNPC })));
const KnightGoldenMaleNPC = React.lazy(() => import('./KnightGoldenMaleNPC').then(m => ({ default: m.KnightGoldenMaleNPC })));
const KnightMaleNPC = React.lazy(() => import('./KnightMaleNPC').then(m => ({ default: m.KnightMaleNPC })));
const PirateFemaleNPC = React.lazy(() => import('./PirateFemaleNPC').then(m => ({ default: m.PirateFemaleNPC })));
const PirateMaleNPC = React.lazy(() => import('./PirateMaleNPC').then(m => ({ default: m.PirateMaleNPC })));
const VikingHelmetNPC = React.lazy(() => import('./VikingHelmetNPC').then(m => ({ default: m.VikingHelmetNPC })));
const VikingFemaleNPC = React.lazy(() => import('./VikingFemaleNPC').then(m => ({ default: m.VikingFemaleNPC })));
const VikingMaleNPC = React.lazy(() => import('./VikingMaleNPC').then(m => ({ default: m.VikingMaleNPC })));
const WitchNPC = React.lazy(() => import('./WitchNPC').then(m => ({ default: m.WitchNPC })));

const VikingBlacksmithNPC = React.lazy(() => import('./VikingBlacksmithNPC').then(m => ({ default: m.VikingBlacksmithNPC })));
const CowboyShopNPC = React.lazy(() => import('./CowboyShopNPC').then(m => ({ default: m.CowboyShopNPC })));
const CasualShopNPC = React.lazy(() => import('./CasualShopNPC').then(m => ({ default: m.CasualShopNPC })));
const WitchShopNPC = React.lazy(() => import('./WitchShopNPC').then(m => ({ default: m.WitchShopNPC })));
const GoblinFruitNPC = React.lazy(() => import('./GoblinFruitNPC').then(m => ({ default: m.GoblinFruitNPC })));
const WizardNPC = React.lazy(() => import('./WizardNPC').then(m => ({ default: m.WizardNPC })));
const MarketVisitorNPC = React.lazy(() => import('./MarketVisitorNPC').then(m => ({ default: m.MarketVisitorNPC })));
import { NpcChatSystem } from './NpcChatSystem';
import { RitualCenter } from './RitualCenter';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export const Scene = () => {
  const hasStarted = useGameStore((state) => state.hasStarted);
  const activeOutlineMesh = useGameStore((state) => state.activeOutlineMesh);

  return (
    <>
      {/* Postprocessing for Interactive Outlines */}
      <EffectComposer multisampling={0} autoClear={false}>
        <Outline 
           selection={activeOutlineMesh ? [activeOutlineMesh] : []}
           blur 
           visibleEdgeColor={0xffffff} 
           hiddenEdgeColor={0xffffff} 
           edgeStrength={3} 
        />
        <Bloom 
          intensity={1.2} 
          luminanceThreshold={0.85} 
          luminanceSmoothing={0.1} 
          mipmapBlur 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      <AtmosphereManager />

      <NpcChatSystem />
      <Physics debug={false}>
      <Suspense fallback={null}>
      {/* Marketplace NPCs */}
      <VikingBlacksmithNPC position={[121.5, 3.0, 1.2]} rotation={[0, -Math.PI/2, 0]} />
      <CowboyShopNPC position={[112.3, 3.0, 7.2]} rotation={[0, Math.PI, 0]} />
      <CasualShopNPC position={[103.8, 3.0, -7.5]} rotation={[0, Math.PI/2, 0]} />
      <WitchShopNPC position={[120.7, 3.0, -7.1]} rotation={[0, -Math.PI/2, 0]} />
      <GoblinFruitNPC position={[125.6, 3.0, 7.4]} rotation={[0, -Math.PI/2, 0]} />

        <Environment />
        <Sea />
        {hasStarted && (
          <>
            <Character />
            <CompanionOrb />
          </>
        )}
        
        
      {/* Market Visitors */}
      <MarketVisitorNPC modelFile="Casual3_Male.glb" startPosition={[115, 3.0, 0]} />
      <MarketVisitorNPC modelFile="Knight_Male.glb" startPosition={[112, 3.0, -3]} />
      <MarketVisitorNPC modelFile="Cowboy_Female.glb" startPosition={[118, 3.0, 5]} />

        {/* AI NPCs */}
        <ClericNPC roleName="Cleric" startPosition={new THREE.Vector3(101, 30, -76)} />
        
        <BlueSoldierFemaleNPC startPosition={new THREE.Vector3(10, 30, -10)} dialogId="world_guide_1" maxWanderRadius={5} />
        <BlueSoldierMaleNPC startPosition={new THREE.Vector3(-10, 30, 10)} dialogId="world_guide_1" maxWanderRadius={5} />
        <Casual3FemaleNPC startPosition={new THREE.Vector3(15, 30, 5)} maxWanderRadius={5} />
        <Casual3MaleNPC startPosition={new THREE.Vector3(-15, 30, -5)} maxWanderRadius={5} />
        <CowboyFemaleNPC startPosition={new THREE.Vector3(84, 30, 58)} dialogId="cowboy_events_1" maxWanderRadius={5} />
        <CowboyFemaleNPC startPosition={new THREE.Vector3(80, 30, 55)} dialogId="cowboy_events_1" maxWanderRadius={5} />
        <CowboyFemaleNPC startPosition={new THREE.Vector3(88, 30, 60)} dialogId="cowboy_events_1" maxWanderRadius={5} />
        <CowboyHairNPC startPosition={new THREE.Vector3(25, 30, 0)} maxWanderRadius={5} />
        <CowboyMaleNPC startPosition={new THREE.Vector3(84, 30, 58)} dialogId="cowboy_events_1" maxWanderRadius={5} />
        <CowboyMaleNPC startPosition={new THREE.Vector3(82, 30, 62)} dialogId="cowboy_events_1" maxWanderRadius={5} />
        <CowboyMaleNPC startPosition={new THREE.Vector3(86, 30, 54)} dialogId="cowboy_events_1" maxWanderRadius={5} />
        <ElfNPC startPosition={new THREE.Vector3(5, 30, 25)} dialogId="elf_tech_1" maxWanderRadius={5} />
        <GoblinFemaleNPC startPosition={new THREE.Vector3(-85, 30, -93)} dialogId="goblin_forest_1" maxWanderRadius={4} />
        <GoblinMaleNPC startPosition={new THREE.Vector3(-83, 30, -90)} dialogId="goblin_forest_2" maxWanderRadius={4} />
        <GoblinFemaleNPC startPosition={new THREE.Vector3(-87, 30, -91)} dialogId="goblin_forest_3" maxWanderRadius={4} />
        <GoblinMaleNPC startPosition={new THREE.Vector3(-84, 30, -95)} dialogId="goblin_forest_4" maxWanderRadius={4} />
        <ElfNPC startPosition={new THREE.Vector3(-55, 3, 76)} maxWanderRadius={0} startState="WATCHING" dialogId="world_guide_1" />
        <WizardNPC startPosition={new THREE.Vector3(-55, 3, 72)} maxWanderRadius={0} startState="WATCHING" dialogId="wizard_quest_1" />
        <KnightGoldenFemaleNPC startPosition={new THREE.Vector3(-64, 3, 74)} maxWanderRadius={0} startState="WATCHING" dialogId="knight_academics_1" />
        <KnightGoldenMaleNPC startPosition={new THREE.Vector3(-60, 3, 72)} dialogId="knight_academics_1" startState="SPARRING" sparringRole="ATTACKER" maxWanderRadius={5} />
        <KnightMaleNPC startPosition={new THREE.Vector3(-60, 3, 76)} startState="SPARRING" sparringRole="DEFENDER" maxWanderRadius={5} />
        {/* DOCK WORKERS ROUTINE (WITH SITTING) */}
        <PirateFemaleNPC startPosition={new THREE.Vector3(101, 30, 117)} startState="RESTING_SITTING" dialogId="pirate_web_1" />
        <PirateMaleNPC startPosition={new THREE.Vector3(103, 30, 117)} startState="WORKING_PORT" dialogId="pirate_web_1" />
        <PirateMaleNPC startPosition={new THREE.Vector3(104, 30, 115)} startState="WORKING_PORT" />
        <PirateFemaleNPC startPosition={new THREE.Vector3(102, 30, 118)} startState="WORKING_STORAGE" />
        <PirateFemaleNPC startPosition={new THREE.Vector3(100, 30, 116)} startState="WORKING_STORAGE" />
        <VikingHelmetNPC startPosition={new THREE.Vector3(40, 30, 0)} maxWanderRadius={5} />
        <VikingFemaleNPC startPosition={new THREE.Vector3(-40, 30, 0)} maxWanderRadius={5} />
        <VikingMaleNPC startPosition={new THREE.Vector3(20, 30, 20)} maxWanderRadius={5} />
        <WitchNPC startPosition={new THREE.Vector3(100, 30, -75)} dialogId="witch_creative_1" maxWanderRadius={5} />
        <WizardNPC startPosition={new THREE.Vector3(102, 30, -77)} dialogId="wizard_intro_1" maxWanderRadius={5} participatesInRitual={true} />
        <RitualCenter />
      </Suspense>
      </Physics>

      {/* Free Camera Mode */}
      <FreeCamManager />

      {/* Procedural Wildlife */}
      <Birds count={50} />
      <Fireflies count={150} />

      {/* Performance Monitor */}
      <Stats />
    </>
  );
};
