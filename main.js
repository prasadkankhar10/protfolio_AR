import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let container;
let camera, scene, renderer;
let controller, reticle;
let orbitControls;

let hitTestSource = null;
let hitTestSourceRequested = false;

let islandModelGroup;
let placed = false;

// Touch gesture state
let initialDistance = null;
let initialScale = 1;
let lastX = 0;

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  camera.position.set(0, 1.5, 2); // Pull camera back so we can see the model in 3D mode

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(1, 2, 1);
  scene.add(dirLight);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Orbit controls for laptop/desktop preview
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.target.set(0, 0, 0);

  // AR Button setup (make hit-test optional so older phones can still use force-spawn)
  const arButton = ARButton.createButton(renderer, { 
    optionalFeatures: ['hit-test', 'dom-overlay'],
    domOverlay: { root: document.getElementById('ui-container') }
  });
  document.body.appendChild(arButton);

  // UI Flow Logic
  renderer.xr.addEventListener('sessionstart', () => {
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('ui-container').classList.remove('hidden');
    document.getElementById('instructions').style.opacity = '1';
    
    // In AR, we remove the model until the user places it
    if(islandModelGroup) {
      scene.remove(islandModelGroup);
    }
    placed = false;
  });

  renderer.xr.addEventListener('sessionend', () => {
    document.getElementById('onboarding-screen').style.display = 'flex';
    document.getElementById('ui-container').classList.add('hidden');
    
    // Returning to desktop mode, show the model again
    if(islandModelGroup) {
      islandModelGroup.position.set(0, -0.5, 0);
      islandModelGroup.scale.set(0.05, 0.05, 0.05);
      scene.add(islandModelGroup);
    }
  });

  // Reticle setup (shows where to place object)
  const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
  reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Loading Manager Setup
  const manager = new THREE.LoadingManager();
  
  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
    const progressEl = document.getElementById('loading-progress');
    if(progressEl) progressEl.innerText = percent + '%';
  };

  manager.onLoad = function () {
    const loadingScreen = document.getElementById('loading-screen');
    const onboardingScreen = document.getElementById('onboarding-screen');
    
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      onboardingScreen.classList.remove('hidden');
    }, 500);
  };

  // Loading Models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);
  
  islandModelGroup = new THREE.Group(); 
  islandModelGroup.scale.set(0.05, 0.05, 0.05);
  // Put it slightly below the camera for preview mode
  islandModelGroup.position.set(0, -0.5, 0);

  loader.load('./island6_model.glb', (gltf) => {
    const island = gltf.scene;
    islandModelGroup.add(island);
    
    // Load trees
    loader.load('./trees.glb', (treeGltf) => {
      const trees = [];
      treeGltf.scene.traverse((child) => {
         if(child.name.includes('Tree') && child.isMesh) {
            trees.push(child);
         }
      });

      island.traverse((node) => {
        if (node.name && node.name.includes('tree_swapn')) {
          if (trees.length > 0) {
            const randomTree = trees[Math.floor(Math.random() * trees.length)].clone();
            randomTree.position.copy(node.position);
            randomTree.rotation.copy(node.rotation);
            randomTree.scale.copy(node.scale);
            node.parent.add(randomTree);
          }
        }
      });
      
      // Add to scene immediately so laptop users can view it in 3D
      if(!renderer.xr.isPresenting) {
        scene.add(islandModelGroup);
      }
    });
  });

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  window.addEventListener('resize', onWindowResize);
  setupTouchGestures();
}

function setupTouchGestures() {
  const dom = renderer.domElement;
  
  dom.addEventListener('touchstart', (e) => {
    if (!placed || !renderer.xr.isPresenting) return;
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches);
      initialScale = islandModelGroup.scale.x;
    } else if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
    }
  });

  dom.addEventListener('touchmove', (e) => {
    if (!placed || !renderer.xr.isPresenting) return;
    if (e.touches.length === 2 && initialDistance) {
      const currentDistance = getDistance(e.touches);
      const scaleFactor = currentDistance / initialDistance;
      const newScale = initialScale * scaleFactor;
      islandModelGroup.scale.set(newScale, newScale, newScale);
    } else if (e.touches.length === 1) {
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - lastX;
      islandModelGroup.rotation.y += deltaX * 0.01;
      lastX = currentX;
    }
  });

  dom.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialDistance = null;
    }
  });
}

function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onSelect() {
  if (!placed && islandModelGroup) {
    if (reticle.visible) {
      // Place exactly on the detected physical floor
      islandModelGroup.position.setFromMatrixPosition(reticle.matrix);
    } else {
      // Fallback: Force spawn on a virtual floor 1.5m below the camera
      const xrCamera = renderer.xr.getCamera(camera);
      const cameraPosition = new THREE.Vector3();
      xrCamera.getWorldPosition(cameraPosition);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.5); // Virtual floor plane at y = -1.5
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), xrCamera);
      
      const target = new THREE.Vector3();
      const intersection = raycaster.ray.intersectPlane(plane, target);
      
      if (intersection) {
        islandModelGroup.position.copy(target);
      } else {
        // If looking above horizon, just drop it 2m in front
        const cameraDirection = new THREE.Vector3();
        xrCamera.getWorldDirection(cameraDirection);
        islandModelGroup.position.copy(cameraPosition).add(cameraDirection.multiplyScalar(2));
        islandModelGroup.position.y -= 1.5; 
      }
      
      // Make it face the user
      islandModelGroup.lookAt(cameraPosition.x, islandModelGroup.position.y, cameraPosition.z);
    }
    
    scene.add(islandModelGroup);
    placed = true;
    reticle.visible = false;
    
    const instructions = document.getElementById('instructions');
    if(instructions) instructions.style.opacity = '0';
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  // Update orbit controls if we are not in AR
  if (!renderer.xr.isPresenting) {
    orbitControls.update();
  }

  if (frame && !placed) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          hitTestSource = source;
        });
      });
      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
        placed = false; 
        if(islandModelGroup && islandModelGroup.parent) {
          scene.remove(islandModelGroup);
        }
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}
