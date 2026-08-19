import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import type { ControlsType } from '../../App';
import { useGameStore } from '../../store/useGameStore';

export const FreeCamManager = () => {
  const isFreeCam = useGameStore((state) => state.isFreeCam);
  return isFreeCam ? <FreeCam /> : null;
};

export const FreeCam = () => {
  const { camera } = useThree();
  const [, get] = useKeyboardControls<ControlsType>();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const speed = 25;

  useEffect(() => {
    // Inherit rotation from the player camera when entering free cam
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ');
    
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        euler.current.y -= e.movementX * 0.002;
        euler.current.x -= e.movementY * 0.002;
        // Clamp pitch to straight up and down
        euler.current.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, euler.current.x));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera]);

  useFrame((state, delta) => {
    const { forward, back, left, right, jump, run } = get();
    const currentSpeed = run ? speed * 3 : speed;
    
    const direction = new THREE.Vector3();
    if (forward) direction.z -= 1;
    if (back) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;
    
    // Use Spacebar to fly straight up
    if (jump) direction.y += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
    }
    
    // Apply camera rotation so WASD moves relative to where we are looking
    const quat = new THREE.Quaternion().setFromEuler(euler.current);
    direction.applyQuaternion(quat);
    
    state.camera.position.addScaledVector(direction, currentSpeed * delta);
    state.camera.quaternion.copy(quat);

    // Update HUD Coordinates natively without React re-renders
    const xEl = document.getElementById('hud-x');
    const yEl = document.getElementById('hud-y');
    const zEl = document.getElementById('hud-z');
    const dirEl = document.getElementById('hud-dir');
    if (xEl && yEl && zEl) {
      xEl.innerText = state.camera.position.x.toFixed(1);
      yEl.innerText = state.camera.position.y.toFixed(1);
      zEl.innerText = state.camera.position.z.toFixed(1);
    }
    if (dirEl && state.camera) {
      const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
      const angle = Math.atan2(forwardVec.x, forwardVec.z);
      let dir = 'N';
      if (angle >= -Math.PI/4 && angle < Math.PI/4) dir = 'S';
      else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) dir = 'E';
      else if (angle >= -3*Math.PI/4 && angle < -Math.PI/4) dir = 'W';
      dirEl.innerText = dir;
    }
  });

  return null;
};
