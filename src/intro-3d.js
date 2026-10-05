import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function createServeScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.286, 1.286, 1.5, -1.5, 0.1, 20);
  camera.position.set(0, 1.51, 6);
  camera.lookAt(0, 1.4, 0);

  const gltf = await new GLTFLoader().loadAsync('assets/serve-model.glb');
  const model = gltf.scene;
  model.traverse(object => {
    if (!object.isMesh) return;
    object.material = new THREE.MeshBasicMaterial({ color: 0x0a0d0b, side: THREE.DoubleSide });
    object.frustumCulled = false;
  });
  scene.add(model);

  const hand = model.getObjectByName('RightHand');
  let racket;
  if (hand) {
    racket = new THREE.Group();
    const dark = new THREE.MeshBasicMaterial({ color: 0x0a0d0b, side: THREE.DoubleSide });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.021, 0.43, 8), dark);
    handle.position.y = 0.21;
    racket.add(handle);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.016, 7, 32), dark);
    hoop.scale.y = 1.28;
    hoop.position.y = 0.63;
    racket.add(hoop);
    for (let i = -2; i <= 2; i++) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.38, 5), dark);
      line.position.set(i * 0.052, 0.63, 0);
      racket.add(line);
    }
    for (let i = -2; i <= 2; i++) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.3, 5), dark);
      line.rotation.z = Math.PI / 2;
      line.position.set(0, 0.63 + i * 0.066, 0);
      racket.add(line);
    }
    racket.position.set(0.0, 0.02, 0);
    racket.rotation.set(0, 0, 0.18);
    racket.scale.setScalar(55);
    hand.add(racket);
  }

  const mixer = new THREE.AnimationMixer(model);
  mixer.clipAction(gltf.animations[0]).play();
  const worldRotation = new THREE.Quaternion();
  const screenRotation = new THREE.Quaternion();
  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)), false);
  }
  function render(ms) {
    mixer.setTime(Math.min(ms / 1000, 3.46));
    if (racket) {
      model.updateMatrixWorld(true);
      hand.getWorldQuaternion(worldRotation);
      const tilt = ms < 1800 ? -0.25 : Math.min(0.9, -0.25 + (ms - 1800) / 1300);
      screenRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
      racket.quaternion.copy(worldRotation).invert().multiply(screenRotation);
    }
    renderer.render(scene, camera);
  }
  resize();
  render(0);
  return { render, resize, dispose: () => { renderer.dispose(); model.traverse(object => { if (object.isMesh) object.material.dispose(); }); } };
}
