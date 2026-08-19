import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { globalPlayerState } from './Character';

export const Birds = ({ count = 50 }) => {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const tailRef = useRef<THREE.InstancedMesh>(null);
  const leftWingRef = useRef<THREE.InstancedMesh>(null);
  const rightWingRef = useRef<THREE.InstancedMesh>(null);
  
  // Reusable vectors
  const _dir = useMemo(() => new THREE.Vector3(), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);
  const _separation = useMemo(() => new THREE.Vector3(), []);
  const _alignment = useMemo(() => new THREE.Vector3(), []);
  const _cohesion = useMemo(() => new THREE.Vector3(), []);
  const _push = useMemo(() => new THREE.Vector3(), []);
  const _playerScatter = useMemo(() => new THREE.Vector3(), []);
  
  // Create skeletal structure
  const skeleton = useMemo(() => {
    const root = new THREE.Object3D(); 
    const body = new THREE.Object3D();
    root.add(body);
    
    const tailPivot = new THREE.Object3D();
    tailPivot.position.set(0, 0, -0.7);
    const tail = new THREE.Object3D();
    tailPivot.add(tail);
    root.add(tailPivot);
    
    const leftPivot = new THREE.Object3D();
    leftPivot.position.set(0.1, 0, 0); 
    const leftWing = new THREE.Object3D();
    leftPivot.add(leftWing);
    root.add(leftPivot);
    
    const rightPivot = new THREE.Object3D();
    rightPivot.position.set(-0.1, 0, 0); 
    const rightWing = new THREE.Object3D();
    rightPivot.add(rightWing);
    root.add(rightPivot);
    
    return { root, body, tailPivot, tail, leftPivot, rightPivot, leftWing, rightWing };
  }, []);

  // Initialize advanced birds
  const birds = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const flockId = Math.floor(Math.random() * 3); // Assign to one of 3 flocks
      let colorStr = '#ffffff'; // Flock 0: Seagulls (White)
      if (flockId === 1) colorStr = '#1a1a1a'; // Flock 1: Crows (Black)
      else if (flockId === 2) colorStr = '#7b858f'; // Flock 2: Pigeons (Grey)
      
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 400,
          60 + Math.random() * 50,
          (Math.random() - 0.5) * 400
        ),
        velocity: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        target: new THREE.Vector3(
          (Math.random() - 0.5) * 400,
          60 + Math.random() * 50,
          (Math.random() - 0.5) * 400
        ),
        speed: 0.15 + Math.random() * 0.2, 
        baseSpeed: 0.15 + Math.random() * 0.2,
        turnSpeed: 0.01 + Math.random() * 0.02, 
        flapSpeed: 15 + Math.random() * 10,
        flapPhase: Math.random() * Math.PI * 2,
        yOffset: Math.random() * Math.PI * 2, 
        color: new THREE.Color(colorStr),
        flockId: flockId,
        // Burst & Glide State
        isGliding: false,
        burstTimer: Math.random() * 3.0,
        panicTimer: 0,
      });
    }
    return temp;
  }, [count]);

  // Setup colors
  useEffect(() => {
    if (!bodyRef.current || !leftWingRef.current) return;
    birds.forEach((bird, i) => {
      bodyRef.current!.setColorAt(i, bird.color);
      tailRef.current!.setColorAt(i, bird.color);
      leftWingRef.current!.setColorAt(i, bird.color);
      rightWingRef.current!.setColorAt(i, bird.color);
    });
    bodyRef.current!.instanceColor!.needsUpdate = true;
    tailRef.current!.instanceColor!.needsUpdate = true;
    leftWingRef.current!.instanceColor!.needsUpdate = true;
    rightWingRef.current!.instanceColor!.needsUpdate = true;
  }, [birds]);

  // Gorgeous Stylized Minimalist Geometries
  const geos = useMemo(() => {
    // 1. Body: Sleek diamond that tapers to a beak and tail
    const bodyGeo = new THREE.BufferGeometry();
    const bodyVerts = new Float32Array([
      // Front Right Top
      0, 0, 1.0,      0.1, 0, 0,      0, 0.15, 0.2,
      // Front Left Top
      0, 0, 1.0,      0, 0.15, 0.2,   -0.1, 0, 0,
      // Back Right Top
      0, 0.15, 0.2,   0.1, 0, 0,      0, 0, -0.8,
      // Back Left Top
      0, 0.15, 0.2,   0, 0, -0.8,     -0.1, 0, 0,
      // Front Right Bottom
      0, 0, 1.0,      0, -0.1, 0.2,   0.1, 0, 0,
      // Front Left Bottom
      0, 0, 1.0,      -0.1, 0, 0,     0, -0.1, 0.2,
      // Back Right Bottom
      0, -0.1, 0.2,   0.1, 0, 0,      0, 0, -0.8,
      // Back Left Bottom
      0, -0.1, 0.2,   0, 0, -0.8,     -0.1, 0, 0,
    ]);
    bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyVerts, 3));
    bodyGeo.computeVertexNormals();
    
    // 2. Tail: V-shaped double-sided plane
    const tailGeo = new THREE.BufferGeometry();
    const tailVerts = new Float32Array([
      0, 0, 0,       0.3, 0, -0.5,    -0.3, 0, -0.5
    ]);
    tailGeo.setAttribute('position', new THREE.BufferAttribute(tailVerts, 3));
    tailGeo.computeVertexNormals();
    
    // 3. Left Wing: Swept triangle
    const leftWingGeo = new THREE.BufferGeometry();
    const lWingVerts = new Float32Array([
      0, 0, 0.3,    -1.5, 0, -0.3,   0, 0, -0.1
    ]);
    leftWingGeo.setAttribute('position', new THREE.BufferAttribute(lWingVerts, 3));
    leftWingGeo.computeVertexNormals();
    
    // 4. Right Wing: Swept triangle
    const rightWingGeo = new THREE.BufferGeometry();
    const rWingVerts = new Float32Array([
      0, 0, 0.3,    0, 0, -0.1,      1.5, 0, -0.3
    ]);
    rightWingGeo.setAttribute('position', new THREE.BufferAttribute(rWingVerts, 3));
    rightWingGeo.computeVertexNormals();
    
    return { bodyGeo, tailGeo, leftWingGeo, rightWingGeo };
  }, []);

  // Shared wandering targets for distinct flocks
  const flocks = useMemo(() => {
    return [
      { target: new THREE.Vector3(0, 100, 0), velocity: new THREE.Vector3(1, 0, 0).normalize() },
      { target: new THREE.Vector3(100, 80, 100), velocity: new THREE.Vector3(0, 0, 1).normalize() },
      { target: new THREE.Vector3(-100, 120, -100), velocity: new THREE.Vector3(-1, 0, -1).normalize() },
    ];
  }, []);

  useFrame((state, delta) => {
    if (!bodyRef.current || !tailRef.current || !leftWingRef.current || !rightWingRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Update flock leaders
    flocks.forEach(flock => {
       if (Math.random() < 0.02) {
          flock.velocity.add(new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*0.5, (Math.random()-0.5)*2)).normalize();
       }
       flock.target.addScaledVector(flock.velocity, 0.4);
       
       // Soft boundary constraints
       if (flock.target.x > 300) flock.velocity.x -= 0.05;
       if (flock.target.x < -300) flock.velocity.x += 0.05;
       if (flock.target.z > 300) flock.velocity.z -= 0.05;
       if (flock.target.z < -300) flock.velocity.z += 0.05;
       if (flock.target.y > 150) flock.velocity.y -= 0.05;
       if (flock.target.y < 50) flock.velocity.y += 0.05;
       flock.velocity.normalize();
    });
    
    birds.forEach((bird, i) => {
      // --- STATE MACHINE (Burst & Glide) ---
      bird.burstTimer -= delta;
      if (bird.panicTimer > 0) {
        bird.panicTimer -= delta;
        bird.isGliding = false; 
      } else if (bird.burstTimer <= 0) {
        bird.isGliding = !bird.isGliding;
        bird.burstTimer = bird.isGliding ? 1.5 + Math.random() * 2.5 : 0.8 + Math.random() * 1.5;
      }
      
      if (bird.velocity.y < -0.3) bird.isGliding = false;
      
      // --- WAYPOINT & BOIDS ---
      // Steer towards shared flock target
      _dir.subVectors(flocks[bird.flockId].target, bird.position).normalize().multiplyScalar(0.4);
      
      let numFlockmates = 0;
      _separation.set(0,0,0);
      _alignment.set(0,0,0);
      _cohesion.set(0,0,0);
      
      birds.forEach((other, j) => {
        if (i !== j && bird.flockId === other.flockId) { // Only flock with own group
          const dist = bird.position.distanceTo(other.position);
          if (dist < 40) {
            _alignment.add(other.velocity);
            _cohesion.add(other.position);
            if (dist < 8) {
              _push.subVectors(bird.position, other.position).normalize().divideScalar(dist);
              _separation.add(_push);
            }
            numFlockmates++;
          }
        }
      });
      
      if (numFlockmates > 0) {
        _alignment.divideScalar(numFlockmates).normalize();
        _cohesion.divideScalar(numFlockmates).sub(bird.position).normalize();
        _dir.addScaledVector(_alignment, 1.2); // Strong alignment for tight groups
        _dir.addScaledVector(_cohesion, 1.0);  // Strong cohesion
        _dir.addScaledVector(_separation, 1.5); // Push away gently if too close
      }
      
      // --- PLAYER SCATTERING ---
      const playerDist = bird.position.distanceTo(globalPlayerState.position);
      if (playerDist < 80) {
        _playerScatter.subVectors(bird.position, globalPlayerState.position).normalize();
        _playerScatter.y += 1.5; 
        _playerScatter.normalize();
        _dir.addScaledVector(_playerScatter, 10.0);
        
        bird.panicTimer = 2.0; 
        bird.speed = Math.min(bird.speed + 0.08, 0.7);
      } else if (bird.panicTimer <= 0) {
        bird.speed = THREE.MathUtils.lerp(bird.speed, bird.baseSpeed, 0.02);
      }
      
      _dir.normalize();
      
      // --- FLIGHT PHYSICS ---
      const bankAngle = bird.velocity.clone().cross(_dir).y;
      bird.velocity.lerp(_dir, bird.turnSpeed).normalize();
      bird.position.addScaledVector(bird.velocity, bird.speed);
      
      const renderY = bird.position.y + Math.sin(time * 2 + bird.yOffset) * 0.5; 
      skeleton.root.position.set(bird.position.x, renderY, bird.position.z);
      
      _lookTarget.copy(bird.position).add(bird.velocity);
      skeleton.root.lookAt(_lookTarget.x, renderY + bird.velocity.y * 1.5, _lookTarget.z);
      skeleton.root.rotateZ(bankAngle * 12.0); 
      
      // --- ASYMMETRICAL WING FLAPPING ---
      let flap = 0;
      if (bird.isGliding) {
        flap = 0.15;
      } else {
        bird.flapPhase += bird.flapSpeed * delta * (bird.panicTimer > 0 ? 1.5 : 1.0);
        flap = Math.sin(bird.flapPhase) - 0.25 * Math.sin(2 * bird.flapPhase);
        flap *= 0.6; 
      }
      
      const wingSweep = 0.1;
      
      skeleton.leftPivot.rotation.set(0, -wingSweep, flap);
      skeleton.rightPivot.rotation.set(0, wingSweep, -flap); 
      
      skeleton.tailPivot.rotation.y = bankAngle * 2.0;
      skeleton.tailPivot.rotation.x = -bird.velocity.y * 0.5;
      
      skeleton.root.updateMatrixWorld(true);
      
      bodyRef.current!.setMatrixAt(i, skeleton.body.matrixWorld);
      tailRef.current!.setMatrixAt(i, skeleton.tail.matrixWorld);
      leftWingRef.current!.setMatrixAt(i, skeleton.leftWing.matrixWorld);
      rightWingRef.current!.setMatrixAt(i, skeleton.rightWing.matrixWorld);
    });
    
    bodyRef.current!.instanceMatrix.needsUpdate = true;
    tailRef.current!.instanceMatrix.needsUpdate = true;
    leftWingRef.current!.instanceMatrix.needsUpdate = true;
    rightWingRef.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geos.bodyGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.5} flatShading={true} />
      </instancedMesh>
      
      <instancedMesh ref={tailRef} args={[geos.tailGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.5} flatShading={true} side={THREE.DoubleSide} />
      </instancedMesh>
      
      <instancedMesh ref={leftWingRef} args={[geos.leftWingGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.5} flatShading={true} side={THREE.DoubleSide} />
      </instancedMesh>
      
      <instancedMesh ref={rightWingRef} args={[geos.rightWingGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.5} flatShading={true} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
};
