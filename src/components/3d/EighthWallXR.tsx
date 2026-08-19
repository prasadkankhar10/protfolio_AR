import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// 8th Wall requires THREE to be available globally
(window as any).THREE = THREE;

declare const XR8: any;

export function EighthWallXR({ active, onReady }: { active: boolean, onReady?: () => void }) {
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    if (!active) return;
    
    // We must disable React Three Fiber's automatic camera updates
    // so that 8th Wall can take over the projection matrix.
    camera.matrixAutoUpdate = false;

    const onxrloaded = () => {
      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer.pipelineModule(), 
        XR8.Threejs.pipelineModule(),
        {
          name: 'r3f-sync',
          onStart: () => {
            if (onReady) onReady();
          },
          onUpdate: () => {
            const xrScene = XR8.Threejs.xrScene();
            if (!xrScene) return;
            const xrCamera = xrScene.camera;
            
            // Sync React Three Fiber's camera with 8th Wall's physical camera
            camera.position.copy(xrCamera.position);
            camera.quaternion.copy(xrCamera.quaternion);
            camera.projectionMatrix.copy(xrCamera.projectionMatrix);
            camera.updateMatrixWorld(true);
            
            // Sync environment/lighting if needed
            scene.background = xrScene.scene.background;
          }
        }
      ]);

      XR8.run({
        canvas: gl.domElement,
        allowedDevices: XR8.XrConfig.device().ANY,
      });
    };

    if ((window as any).XR8) {
      onxrloaded();
    } else {
      window.addEventListener('xrloaded', onxrloaded);
    }

    return () => {
      if ((window as any).XR8) {
        XR8.stop();
        XR8.clearCameraPipelineModules();
      }
      camera.matrixAutoUpdate = true;
      if (scene.background instanceof THREE.Texture) {
         scene.background = null;
      }
    };
  }, [active, gl, camera, scene, onReady]);

  return null;
}
