import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { InstancedTrees } from './InstancedTrees';
import { DynamicLamps } from './DynamicLamps';
import { useControls } from 'leva';
import { globalPlayerState } from './Character';
import { useGameStore } from '../../store/useGameStore';

const lampPresets: Record<string, { color: string, intensity: number }> = {
  'Warm Vintage': { color: '#ffaa00', intensity: 2.5 },
  'Neon Cyberpunk': { color: '#00ffff', intensity: 4.0 },
  'Ghostly Blue': { color: '#88aaff', intensity: 2.0 },
  'Magical Purple': { color: '#d58be8', intensity: 3.5 },
  'Vampire Red': { color: '#ff0000', intensity: 5.0 },
  'Emerald Magic': { color: '#00ff88', intensity: 3.0 },
  'Pure White': { color: '#ffffff', intensity: 3.0 }
};

export const Environment = () => {
  const { scene } = useGLTF('./models/island6_model.glb');
  const windFanRef = useRef<THREE.Object3D | null>(null);
  const wellMeshRef = useRef<THREE.Object3D | null>(null);

  // Safely clone the scene so we don't permanently mutate the useGLTF cache!
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  const { treeSpacing, treeExclusionRadius } = useControls('Forest Generation', {
    treeSpacing: { value: 6, min: 2, max: 20, step: 0.5, label: 'Tree Spacing (m)' },
    treeExclusionRadius: { value: 2, min: 0, max: 10, step: 0.1, label: 'Exclusion Radius' }
  });

  const { fanSpeed } = useControls('Windmill', {
    fanSpeed: { value: 2.0, min: 0, max: 10, step: 0.1, label: 'Fan Speed' }
  });

  const [{ lampPreset, lampColor, lampIntensity }, setLamp] = useControls('Street Lamp', () => ({
    lampPreset: {
      options: Object.keys(lampPresets),
      value: 'Warm Vintage',
      onChange: (v) => {
        if (v && lampPresets[v]) {
          setLamp({ lampColor: lampPresets[v].color, lampIntensity: lampPresets[v].intensity });
        }
      }
    },
    lampColor: { value: '#ffaa00', label: 'Lamp Color' },
    lampIntensity: { value: 2.5, min: 0, max: 10, step: 0.1, label: 'Glow Intensity' }
  })) as any; // Cast to any to avoid complex Leva conditional return types

  const lightMeshRef = useRef<THREE.Mesh | null>(null);

  // Optimize tree placement - run ONLY when spacing changes
  const { treeMatrices, extractedFarmPlots, extractedDepositPlots, lampPositions } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const acceptedPositions: THREE.Vector3[] = [];
    const farmPlotsFound: THREE.Vector3[] = [];
    const depositPlotsFound: THREE.Vector3[] = [];
    const lampPlotsFound: THREE.Vector3[] = [];

    // Force absolute world matrix update on the CLONE
    clonedScene.updateMatrixWorld(true);

    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Massive optimization: The island is the ground, it only needs to receive shadows from trees/characters!
        child.castShadow = false;
        child.receiveShadow = true;
      }

      const name = child.name.toLowerCase();
      const materialName = child.material?.name?.toLowerCase() || '';
      
      // Hide the default sea mesh since we are rendering a custom animated one in Sea.tsx
      if (name === 'sea') {
        child.visible = false;
      }
      
      // Grab the wind fan so we can animate it
      if (name.includes('wind_fan')) {
        windFanRef.current = child;
      }

      // Grab the well so we can make it interactive
      if (name.includes('well')) {
        wellMeshRef.current = child;
      }
      
      // Extract ALL street lamps for the Dynamic Light Culling System
      // We check both the object's name AND the material's name!
      if (name.includes('light1111') || name.includes('lamp') || name.includes('lantern') || materialName.includes('lamp_material')) {
        const position = new THREE.Vector3();
        child.getWorldPosition(position);
        
        // Massive optimization: Give the physical lamp bulb a glowing emissive material.
        // This looks like light is glowing, but costs zero performance!
        if (child.material) {
           child.material = child.material.clone();
           child.material.emissive = new THREE.Color(lampColor);
           child.material.emissiveIntensity = 3.0; // Glow brightly
        }

        lampPlotsFound.push(position.clone());
        lightMeshRef.current = child; // Keep reference to one of them just in case
      }

      // Add glow to Window materials
      if (name.includes('window') || materialName.includes('window')) {
        if (child.material) {
           child.material = child.material.clone();
           // Give windows a warm, inviting glow
           child.material.emissive = new THREE.Color('#ffcc88');
           child.material.emissiveIntensity = 2.0; 
        }
      }
      
      // Find Farm Dirt nodes
      if (name.includes('farm_dirt') || name.includes('farm_secondage')) {
        const position = new THREE.Vector3();
        child.getWorldPosition(position);
        farmPlotsFound.push(position.clone());
      }
      
      // Find Deposit nodes (Barn or Mill)
      if (name.includes('bigbarn') || name.includes('mill-wind')) {
        const position = new THREE.Vector3();
        child.getWorldPosition(position);
        // Add some offset so they don't clip entirely into the barn
        position.z += 2.0; 
        depositPlotsFound.push(position.clone());
      }

      // Find the hidden cubes (handles Blender naming and typos)
      const isNormalTree = name.includes('tree_swapn') || name.includes('tree_spawn') || name.includes('treespawn');
      const isDenseTree = name.includes('1treetree');
      
      if (isNormalTree || isDenseTree) {
        const position = new THREE.Vector3();
        const rotation = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        child.matrixWorld.decompose(position, rotation, scale);
        
        // --- SPATIAL DISTANCE FILTER ---
        // Dense trees have an ultra-tight spacing requirement to allow for extremely thick forests
        const requiredSpacing = isDenseTree ? 0.1 : treeSpacing;
        
        let isTooClose = false;
        for (const existingPos of acceptedPositions) {
          if (position.distanceTo(existingPos) < requiredSpacing) {
            isTooClose = true;
            break;
          }
        }

        // If the tree is far enough away from all other trees, we spawn it!
        if (!isTooClose) {
          acceptedPositions.push(position.clone());

          // Add random rotation on the Y axis so they face different directions
          const randomRotation = Math.random() * Math.PI * 2;
          rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), randomRotation));

          // Add random scaling so trees range from 100% to 140% of their base size
          const randomScale = 1.0 + Math.random() * 0.4;
          const treeScale = 1.0 * randomScale; 
          scale.set(treeScale, treeScale, treeScale);
          
          const spawnMatrix = new THREE.Matrix4();
          spawnMatrix.compose(position, rotation, scale);
          
          matrices.push(spawnMatrix);
        }

        // CRITICAL: Actually REMOVE the invisible box from the CLONED scene so the physics engine
        // does not build invisible walls that the camera constantly bumps into!
        setTimeout(() => {
          if (child.parent) child.parent.remove(child);
        }, 0);
      }
    });

    return { 
      treeMatrices: matrices, 
      extractedFarmPlots: farmPlotsFound, 
      extractedDepositPlots: depositPlotsFound, 
      lampPositions: lampPlotsFound 
    };
  }, [clonedScene, treeSpacing, treeExclusionRadius, lampColor]);

  const setFarmPlots = useGameStore(state => state.setFarmPlots);
  const setDepositPlots = useGameStore(state => state.setDepositPlots);
  
  // Apply glowing emissive material to the light1111 mesh dynamically
  useEffect(() => {
    if (lightMeshRef.current) {
      const mesh = lightMeshRef.current;
      if (mesh.material) {
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        // Clone the material so we don't accidentally mutate other objects sharing it
        if (!mesh.userData.materialCloned) {
          mesh.material = material.clone();
          mesh.userData.materialCloned = true;
        }
        
        const activeMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (activeMaterial && 'emissive' in activeMaterial) {
          (activeMaterial as THREE.MeshStandardMaterial).emissive = new THREE.Color(lampColor);
          (activeMaterial as THREE.MeshStandardMaterial).emissiveIntensity = lampIntensity;
        }
      }
    }
  }, [lampColor, lampIntensity]);

  useEffect(() => {
    if (extractedFarmPlots.length > 0) {
      setFarmPlots(extractedFarmPlots);
    }
    if (extractedDepositPlots.length > 0) {
      setDepositPlots(extractedDepositPlots);
    }
  }, [extractedFarmPlots, extractedDepositPlots, setFarmPlots, setDepositPlots]);

  // Animate the Windmill Fan continuously
  useFrame((state, delta) => {
    if (windFanRef.current) {
      // Rotate locally around Z axis
      windFanRef.current.rotation.z += fanSpeed * delta;
    }
  });

  // --- WELL INTERACTION LOGIC ---
  const [isNearWell, setIsNearWell] = useState(false);
  
  const setActiveDialog = useGameStore(state => state.setActiveDialog);
  const activeDialogNpcId = useGameStore(state => state.activeDialogNpcId);
  const setActiveOutlineMesh = useGameStore(state => state.setActiveOutlineMesh);
  const wellId = useMemo(() => Math.random().toString(), []);

  useFrame(() => {
    if (!wellMeshRef.current) return;
    const wellPos = new THREE.Vector3();
    wellMeshRef.current.getWorldPosition(wellPos);
    
    const distToPlayer = wellPos.distanceTo(globalPlayerState.position);
    
    if (distToPlayer < 4.5) { // Slightly larger radius for the well since it's a big object
      if (!isNearWell) setIsNearWell(true);
    } else {
      if (isNearWell) setIsNearWell(false);
    }
  });

  // Highlight the well when the player is near
  useEffect(() => {
    if (isNearWell && wellMeshRef.current) {
      setActiveOutlineMesh(wellMeshRef.current);
    } else if (!isNearWell) {
      if (useGameStore.getState().activeOutlineMesh === wellMeshRef.current) {
        setActiveOutlineMesh(null);
      }
    }
  }, [isNearWell, setActiveOutlineMesh]);

  const triggerInteractEvent = useGameStore(state => state.triggerInteractEvent);

  // Press E to interact or use Mobile Button
  useEffect(() => {
    const triggerWell = () => {
       setActiveDialog('well_interaction', wellId);
       const summonRole = Math.random() > 0.5 ? 'BlueSoldier Female' : 'BlueSoldier Male';
       useGameStore.getState().summonNpc(summonRole);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNearWell && (e.key === 'e' || e.key === 'E')) {
         triggerWell();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNearWell, setActiveDialog, wellId]);

  // Mobile Interaction Listener
  useEffect(() => {
    if (isNearWell && triggerInteractEvent > 0) {
       setActiveDialog('well_interaction', wellId);
       const summonRole = Math.random() > 0.5 ? 'BlueSoldier Female' : 'BlueSoldier Male';
       useGameStore.getState().summonNpc(summonRole);
    }
  }, [triggerInteractEvent]); // Only triggers when the counter increments

  // Close dialog if walking away
  useEffect(() => {
    if (!isNearWell && activeDialogNpcId === wellId) {
      setActiveDialog(null);
    }
  }, [isNearWell, activeDialogNpcId, setActiveDialog, wellId]);

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={clonedScene} />
      </RigidBody>
      
      {/* Dynamic Light Culling System for 100+ Lamps */}
      {lampPositions.length > 0 && (
         <DynamicLamps 
            lampPositions={lampPositions} 
            lampColor={lampColor} 
            lampIntensity={lampIntensity} 
         />
      )}

      {/* Render the hyper-optimized instanced trees */}
      {treeMatrices.length > 0 && <InstancedTrees spawnMatrices={treeMatrices} />}
    </>
  );
};

// Preload the model to avoid pop-in
useGLTF.preload('./models/island6_model.glb');
