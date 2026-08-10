import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let controller, reticle;

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

  // AR Button setup (requires hit-test feature)
  const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
  document.body.appendChild(arButton);

  // UI Flow Logic
  renderer.xr.addEventListener('sessionstart', () => {
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('ui-container').classList.remove('hidden');
    document.getElementById('instructions').style.opacity = '1';
  });

  renderer.xr.addEventListener('sessionend', () => {
    document.getElementById('onboarding-screen').style.display = 'flex';
    document.getElementById('ui-container').classList.add('hidden');
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
  const loader = new GLTFLoader(manager);
  
  islandModelGroup = new THREE.Group(); 
  // initial sensible scale for AR (can be overridden by pinch zoom)
  islandModelGroup.scale.set(0.05, 0.05, 0.05);

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
        // Spawn node name looks like "1treetree_swapn..."
        if (node.name && node.name.includes('tree_swapn')) {
          if (trees.length > 0) {
            // Pick random tree variant
            const randomTree = trees[Math.floor(Math.random() * trees.length)].clone();
            
            // Match position of the spawn node
            randomTree.position.copy(node.position);
            randomTree.rotation.copy(node.rotation);
            randomTree.scale.copy(node.scale);
            
            // Add tree to island parent to keep local transforms valid
            node.parent.add(randomTree);
          }
        }
      });
      console.log("Trees spawned successfully");
    });
  });

  // Controller for placing
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  window.addEventListener('resize', onWindowResize);
  
  // Touch gestures for scaling and rotating
  setupTouchGestures();
}

function setupTouchGestures() {
  const dom = renderer.domElement;
  
  dom.addEventListener('touchstart', (e) => {
    if (!placed) return;
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches);
      initialScale = islandModelGroup.scale.x;
    } else if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
    }
  });

  dom.addEventListener('touchmove', (e) => {
    if (!placed) return;
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
  if (reticle.visible && !placed && islandModelGroup) {
    islandModelGroup.position.setFromMatrixPosition(reticle.matrix);
    scene.add(islandModelGroup);
    placed = true;
    reticle.visible = false;
    document.getElementById('instructions').style.opacity = '0';
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
        placed = false; // Reset if they close AR session
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
