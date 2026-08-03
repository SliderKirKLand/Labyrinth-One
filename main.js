import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { DRACOLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";
import { TransformControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/TransformControls.js";

const canvas = document.getElementById("three-canvas");
const stage = document.getElementById("viewerStage");
const statusEl = document.getElementById("status");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");
const rotateBtn = document.getElementById("rotateBtn");
const wireBtn = document.getElementById("wireBtn");
const resetBtn = document.getElementById("resetBtn");
const dropOverlay = document.getElementById("dropOverlay");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 2000);
const axesHelper = new THREE.AxesHelper(3);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);


const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.5;
controls.maxDistance = 200;
controls.target.set(0, 0.7, 0);
controls.enableRotate = true;
controls.update();

const transformControls = new TransformControls(
  camera,
  renderer.domElement
);

transformControls.setMode("rotate");
transformControls.setSpace("local");
transformControls.setSize(1.2);

scene.add(transformControls);

transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});

scene.add(new THREE.HemisphereLight(0xf4efff, 0x17131e, 1.25));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
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

const rim = new THREE.DirectionalLight(0x9b86ff, 1.1);
rim.position.set(-6, 3, -5);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.ShadowMaterial({ opacity: 0.28 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

let currentModel = null;

function makePlaceholder() {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.9, 0.28, 180, 24),
    new THREE.MeshStandardMaterial({ color: 0x8d7cf6, metalness: 0.38, roughness: 0.32 })
  );
  mesh.position.y = 1.1;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function disposeObject(object) {
  object.traverse(child => {
    if (!child.isMesh) return;
    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => material?.dispose());
  });
}

function frameObject(object) {
  object.rotation.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.position.set(0, 0, 0);
  object.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const initialBox = new THREE.Box3().setFromObject(object);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const maxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
  object.scale.setScalar(2.4 / maxDimension);

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;

  const radius = Math.max(size.length() * 0.62, 1.4);
  controls.target.set(0, size.y * 0.46, 0);
  camera.position.set(radius * 1.12, radius * 0.82, radius * 1.42);
  camera.near = Math.max(radius / 100, 0.01);
  camera.far = Math.max(radius * 50, 100);
  camera.updateProjectionMatrix();
  controls.update();
}

function setModel(object, label) {
  if (currentModel) {
    transformControls.detach();
    scene.remove(currentModel);
    disposeObject(currentModel);
  }

  currentModel = object;
  scene.add(currentModel);

  frameObject(currentModel);

  transformControls.attach(currentModel);
  transformControls.setMode("rotate");

  statusEl.innerHTML = label
    ? `Loaded <span class="name">${label}</span>`
    : "Showing demo mesh";
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const objLoader = new OBJLoader();
const fbxLoader = new FBXLoader();

function reportError(name, error) {
  console.error(error);
  statusEl.textContent = `Failed to load ${name}`;
}

function loadUrl(url, label) {
  statusEl.textContent = `Loading ${label}`;
  gltfLoader.load(url, gltf => setModel(gltf.scene, label), undefined, error => {
    reportError(label, error);
    setModel(makePlaceholder(), null);
  });
}

function loadFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  const url = URL.createObjectURL(file);
  statusEl.textContent = `Loading ${file.name}`;

  const success = object => {
    setModel(object, file.name);
    URL.revokeObjectURL(url);
  };
  const failure = error => {
    reportError(file.name, error);
    URL.revokeObjectURL(url);
  };

  if (extension === "glb" || extension === "gltf") {
    gltfLoader.load(url, gltf => success(gltf.scene), undefined, failure);
  } else if (extension === "obj") {
    objLoader.load(url, object => {
      object.traverse(child => {
        if (child.isMesh && (!child.material || child.material.type === "MeshBasicMaterial")) {
          child.material = new THREE.MeshStandardMaterial({ color: 0xd8d4e3, roughness: 0.6, metalness: 0.08 });
        }
      });
      success(object);
    }, undefined, failure);
  } else if (extension === "fbx") {
    fbxLoader.load(url, success, undefined, failure);
  } else {
    statusEl.textContent = `Unsupported format: .${extension}`;
    URL.revokeObjectURL(url);
  }
}

importBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (file) loadFile(file);
  fileInput.value = "";
});

rotateBtn.addEventListener("click", () => {
  controls.autoRotate = !controls.autoRotate;
  controls.autoRotateSpeed = 2.2;
  rotateBtn.classList.toggle("active", controls.autoRotate);
});

wireBtn.addEventListener("click", () => {
  if (!currentModel) return;
  const nextState = !wireBtn.classList.contains("active");
  currentModel.traverse(child => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => { if (material) material.wireframe = nextState; });
  });
  wireBtn.classList.toggle("active", nextState);
});

resetBtn.addEventListener("click", () => currentModel && frameObject(currentModel));

["dragenter", "dragover"].forEach(type => stage.addEventListener(type, event => {
  event.preventDefault();
  dropOverlay.classList.add("active");
}));

stage.addEventListener("dragleave", event => {
  if (!stage.contains(event.relatedTarget)) dropOverlay.classList.remove("active");
});

stage.addEventListener("drop", event => {
  event.preventDefault();
  dropOverlay.classList.remove("active");
  const file = event.dataTransfer.files[0];
  if (file) loadFile(file);
});

let dragging = false;
let lastPointer = { x: 0, y: 0 };
const rotateSpeed = 0.006;

renderer.domElement.addEventListener("pointerdown", event => {
  if (event.button !== 0 || !currentModel) return;
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener("pointermove", event => {
  if (!dragging || !currentModel) return;
  currentModel.rotation.y += (event.clientX - lastPointer.x) * rotateSpeed;
  currentModel.rotation.x += (event.clientY - lastPointer.y) * rotateSpeed;
  lastPointer = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener("pointerup", event => {
  dragging = false;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
});
renderer.domElement.addEventListener("pointercancel", () => { dragging = false; });

function resizeRenderer() {
  const width = Math.max(stage.clientWidth, 1);
  const height = Math.max(stage.clientHeight, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resizeRenderer).observe(stage);
window.addEventListener("resize", resizeRenderer);
resizeRenderer();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

loadUrl("apple.glb", "apple.glb");
