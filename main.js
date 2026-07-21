// viewer.js
// Three.js model viewer: import a custom model (.glb/.gltf/.obj/.fbx)
// and orbit/zoom/pan around it with the mouse.
//
// Expects these elements to exist in the host HTML:
//   <canvas id="three-canvas"></canvas>
//   <div id="status"></div>
//   <button id="importBtn"></button>
//   <input id="fileInput" type="file" />
//   <button id="rotateBtn"></button>
//   <button id="wireBtn"></button>
//   <button id="resetBtn"></button>
//   <div id="dropOverlay"></div>

import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { DRACOLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";

// ---------- DOM ----------
const canvas      = document.getElementById("three-canvas");
const statusEl     = document.getElementById("status");
const importBtn    = document.getElementById("importBtn");
const fileInput    = document.getElementById("fileInput");
const rotateBtn    = document.getElementById("rotateBtn");
const wireBtn      = document.getElementById("wireBtn");
const resetBtn     = document.getElementById("resetBtn");
const dropOverlay  = document.getElementById("dropOverlay");

// ---------- scene ----------
const scene = new THREE.Scene();
// no scene.background / fog — keeping the scene transparent so the page's
// CSS background shows through behind the canvas

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.01,
  2000
);
camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // transparent clear — lets the CSS background show through
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---------- controls (mouse spin / zoom / pan) ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.5;
controls.maxDistance = 200;
controls.target.set(0, 0.7, 0);
controls.enableRotate = false; // left-drag rotates the MODEL instead of orbiting the camera (see drag handlers below)
controls.update();

// ---------- lighting ----------
const hemi = new THREE.HemisphereLight(0xfff2e0, 0x14110d, 0.9);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 8, 4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 40;
key.shadow.camera.left = -10;
key.shadow.camera.right = 10;
key.shadow.camera.top = 10;
key.shadow.camera.bottom = -10;
key.shadow.bias = -0.0005;
scene.add(key);

const rim = new THREE.DirectionalLight(0xd98a4f, 0.6);
rim.position.set(-6, 3, -5);
scene.add(rim);

// ---------- ground ----------
const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// grid removed

// ---------- default placeholder mesh ----------
let currentModel = null;

function makePlaceholder() {
  const geo = new THREE.TorusKnotGeometry(0.9, 0.28, 180, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd98a4f,
    metalness: 0.35,
    roughness: 0.35,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 1.1;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function setModel(object3d, label) {
  if (currentModel) {
    scene.remove(currentModel);
    disposeObject(currentModel);
  }
  currentModel = object3d;
  scene.add(currentModel);
  frameObject(currentModel);
  wireBtn.classList.remove("active");
  statusEl.innerHTML = label
    ? `Loaded <span class="name">${label}</span>`
    : "Showing default mesh";
}

function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material?.dispose();
    }
  });
}

// fit camera + ground shadow to whatever model is loaded
function frameObject(object3d) {
  object3d.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(object3d);
  const size = new THREE.Vector3();
  box.getSize(size);

  // normalize scale so the model's largest dimension is ~2.2 units
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 2.2 / maxDim;
  object3d.scale.setScalar(scale);

  // re-measure after scaling, then sit it on the ground (y=0)
  const box2 = new THREE.Box3().setFromObject(object3d);
  const size2 = new THREE.Vector3();
  box2.getSize(size2);
  const center2 = new THREE.Vector3();
  box2.getCenter(center2);

  object3d.position.x += -center2.x;
  object3d.position.z += -center2.z;
  object3d.position.y += -box2.min.y;

  const radius = size2.length() * 0.6;
  controls.target.set(0, size2.y * 0.45, 0);
  camera.position.set(radius * 1.1, radius * 0.8, radius * 1.4);
  camera.near = Math.max(radius / 100, 0.01);
  camera.far = Math.max(radius * 50, 100);
  camera.updateProjectionMatrix();
  controls.update();
}

setModel(makePlaceholder(), null);

// ---------- loaders ----------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const objLoader = new OBJLoader();
const fbxLoader = new FBXLoader();

function loadFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const url = URL.createObjectURL(file);
  statusEl.innerHTML = `<span class="spinner"></span> Loading <span class="name">${file.name}</span>`;

  const onError = (err) => {
    console.error(err);
    statusEl.innerHTML = `<span style="color:#e07a5f">Failed to load ${file.name}</span>`;
    URL.revokeObjectURL(url);
  };

  if (ext === "glb" || ext === "gltf") {
    gltfLoader.load(
      url,
      (gltf) => {
        setModel(gltf.scene, file.name);
        URL.revokeObjectURL(url);
      },
      undefined,
      onError
    );
  } else if (ext === "obj") {
    objLoader.load(
      url,
      (obj) => {
        // OBJ files have no materials by default — give them one so they're visible
        obj.traverse((c) => {
          if (c.isMesh && (!c.material || c.material.type === "MeshBasicMaterial")) {
            c.material = new THREE.MeshStandardMaterial({
              color: 0xcfcac0,
              roughness: 0.6,
              metalness: 0.1,
            });
          }
        });
        setModel(obj, file.name);
        URL.revokeObjectURL(url);
      },
      undefined,
      onError
    );
  } else if (ext === "fbx") {
    fbxLoader.load(
      url,
      (obj) => {
        setModel(obj, file.name);
        URL.revokeObjectURL(url);
      },
      undefined,
      onError
    );
  } else {
    statusEl.innerHTML = `<span style="color:#e07a5f">Unsupported format: .${ext}</span>`;
    URL.revokeObjectURL(url);
  }
}

// ---------- UI wiring ----------
importBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
  fileInput.value = "";
});

rotateBtn.addEventListener("click", () => {
  controls.autoRotate = !controls.autoRotate;
  rotateBtn.classList.toggle("active", controls.autoRotate);
});

wireBtn.addEventListener("click", () => {
  if (!currentModel) return;
  const next = !wireBtn.classList.contains("active");
  currentModel.traverse((c) => {
    if (c.isMesh) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => { if (m) m.wireframe = next; });
    }
  });
  wireBtn.classList.toggle("active", next);
});

resetBtn.addEventListener("click", () => {
  if (currentModel) frameObject(currentModel);
});

// drag & drop import
["dragenter", "dragover"].forEach((evt) =>
  window.addEventListener(evt, (e) => {
    e.preventDefault();
    dropOverlay.classList.add("active");
  })
);
["dragleave", "drop"].forEach((evt) =>
  window.addEventListener(evt, (e) => {
    e.preventDefault();
    if (evt === "dragleave" && e.target !== dropOverlay) return;
    dropOverlay.classList.remove("active");
  })
);
window.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// ---------- drag-to-rotate the model (left-click + drag) ----------
let isDragging = false;
let lastPointer = { x: 0, y: 0 };
const dragRotateSpeed = 0.006; // radians per pixel of mouse movement — raise for more sensitivity

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || !currentModel) return; // left mouse button only
  isDragging = true;
  lastPointer = { x: e.clientX, y: e.clientY };
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener("pointermove", (e) => {
  if (!isDragging || !currentModel) return;
  const deltaX = e.clientX - lastPointer.x;
  const deltaY = e.clientY - lastPointer.y;
  currentModel.rotation.y += deltaX * dragRotateSpeed; // drag left/right -> spin around Y
  currentModel.rotation.x += deltaY * dragRotateSpeed; // drag up/down   -> spin around X
  lastPointer = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener("pointerup", (e) => {
  isDragging = false;
  renderer.domElement.releasePointerCapture(e.pointerId);
});

renderer.domElement.addEventListener("pointerleave", () => {
  isDragging = false;
});

// resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- render loop ----------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();