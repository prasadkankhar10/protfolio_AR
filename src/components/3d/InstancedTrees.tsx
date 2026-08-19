import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

interface InstancedTreesProps {
  spawnMatrices: THREE.Matrix4[];
}

export const InstancedTrees = ({ spawnMatrices }: InstancedTreesProps) => {
  const { nodes, materials } = useGLTF('./models/trees.glb') as any;

  // We have 6 unique trees in the GLB
  const treeMeshes = useMemo(() => [
    { geometry: nodes.Tree_01.geometry, material: materials._trees_normal },
    { geometry: nodes.Tree_02.geometry, material: materials._trees_normal },
    { geometry: nodes.Tree_03.geometry, material: materials._trees_normal },
    { geometry: nodes.Pine_Tree_03.geometry, material: materials['17___Default'] },
    { geometry: nodes.Pine_Tree_02.geometry, material: materials['17___Default'] },
    { geometry: nodes.Pine_Tree_01.geometry, material: materials['17___Default'] },
  ], [nodes, materials]);

  // Distribute the matrices randomly among the 6 trees
  const distributions = useMemo(() => {
    const dist: THREE.Matrix4[][] = [[], [], [], [], [], []];
    
    spawnMatrices.forEach((matrix) => {
      // Pick a random tree variant (0-5)
      const randomIndex = Math.floor(Math.random() * 6);
      dist[randomIndex].push(matrix);
    });
    
    return dist;
  }, [spawnMatrices]);

  return (
    <group>
      {treeMeshes.map((tree, index) => {
        const count = distributions[index].length;
        if (count === 0) return null;
        
        return (
          <instancedMesh
            key={index}
            args={[tree.geometry, tree.material, count]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              distributions[index].forEach((matrix, i) => {
                self.setMatrixAt(i, matrix);
              });
              self.instanceMatrix.needsUpdate = true;
            }}
          />
        );
      })}
    </group>
  );
};

useGLTF.preload('./models/trees.glb');
