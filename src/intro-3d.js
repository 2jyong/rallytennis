import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createTennisBall } from './tennis-ball.js';
import { createServeMotion } from './serve-motion.js';
import { createServeGrip, createTossGrip } from './serve-grip.js';

const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
export const introTiming = { tossRelease: 1100, impact: 1900, cover: 2650, seamEnd: 2920, end: 3750 };

export async function createServeScene(playerCanvas, ballCanvas) {
  const playerRenderer = new THREE.WebGLRenderer({ canvas: playerCanvas, alpha: true, antialias: true });
  playerRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  playerRenderer.setClearColor(0xffffff, 0);
  const playerScene = new THREE.Scene();
  const playerCamera = new THREE.OrthographicCamera(-1.286, 1.286, 1.5, -1.5, 0.1, 20);
  playerCamera.position.set(0, 1.51, 6);
  playerCamera.lookAt(0, 1.4, 0);

  const gltf = await new GLTFLoader().loadAsync('assets/serve-model.glb');
  const model = gltf.scene;
  const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0d0b, side: THREE.DoubleSide });
  model.traverse(object => { if (object.isMesh) { object.material = silhouetteMaterial; object.frustumCulled = false; } });
  playerScene.add(model);
  const motion = await createServeMotion(THREE, model);
  const grip = createServeGrip(THREE, model);
  const tossGrip = createTossGrip(THREE, model);
  const hand = motion.rightHand || model.getObjectByName('RightHand');
  const forearm = motion.rightForeArm || model.getObjectByName('RightForeArm');
  const leftHand = motion.leftHand || model.getObjectByName('LeftHand');

  const racket = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.021, 0.27, 8), silhouetteMaterial);
  handle.position.y = 0.13;
  racket.add(handle);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.011, 7, 40), silhouetteMaterial);
  hoop.scale.y = 1.34;
  hoop.position.y = 0.46;
  racket.add(hoop);
  for (let i = -3; i <= 3; i++) {
    const offset = i * 0.036;
    const vertical = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.37 * Math.sqrt(1 - (offset / 0.15) ** 2), 4), silhouetteMaterial);
    vertical.position.set(offset, 0.46, 0);
    racket.add(vertical);
    const horizontal = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.28 * Math.sqrt(1 - (offset / 0.201) ** 2), 4), silhouetteMaterial);
    horizontal.rotation.z = Math.PI / 2;
    horizontal.position.set(0, 0.46 + offset, 0);
    racket.add(horizontal);
  }
  const racketHead = new THREE.Object3D();
  racketHead.position.y = 0.46;
  racket.add(racketHead);

  // One grip is calibrated at contact and inherits the wrist for the whole serve.
  motion.update(motion.impactTime);
  model.updateMatrixWorld(true);
  const handRotation = hand.getWorldQuaternion(new THREE.Quaternion());
  const shaft = hand.getWorldPosition(new THREE.Vector3()).sub(forearm.getWorldPosition(new THREE.Vector3())).normalize();
  const side = new THREE.Vector3().crossVectors(shaft, new THREE.Vector3(0, 0, 1)).normalize();
  const face = new THREE.Vector3().crossVectors(side, shaft).normalize();
  const gripRotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, shaft, face));
  racket.quaternion.copy(handRotation).invert().multiply(gripRotation);
  if (grip.gripCenterLocal) racket.position.copy(grip.gripCenterLocal);
  const handScale = hand.getWorldScale(new THREE.Vector3());
  racket.scale.set(1 / handScale.x, 1 / handScale.y, 1 / handScale.z);
  hand.add(racket);
  model.updateMatrixWorld(true);
  const contactWorld = racketHead.getWorldPosition(new THREE.Vector3());

  const ballRenderer = new THREE.WebGLRenderer({ canvas: ballCanvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  ballRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  ballRenderer.setClearColor(0xffffff, 0);
  ballRenderer.outputColorSpace = THREE.SRGBColorSpace;
  ballRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  ballRenderer.toneMappingExposure = 1.04;
  const ballScene = new THREE.Scene();
  const ballCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
  ballCamera.position.z = 2000;
  const ball = createTennisBall(THREE);
  const heldAnchor = new THREE.Object3D();
  const leftScale = leftHand.getWorldScale(new THREE.Vector3());
  heldAnchor.position.copy(tossGrip.gripCenterLocal);
  heldAnchor.position.z += 0.018 / leftScale.z;
  leftHand.add(heldAnchor);
  motion.update(introTiming.tossRelease / introTiming.impact * motion.impactTime);
  model.updateMatrixWorld(true);
  const releaseWorld = heldAnchor.getWorldPosition(new THREE.Vector3());
  motion.update(0);
  const impactRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler((introTiming.impact - introTiming.tossRelease) * 0.0012, (introTiming.impact - introTiming.tossRelease) * 0.0016, 0.25));
  const spinAxis = new THREE.Vector3(0.6, 0.78, 0.18).normalize();
  const spinRotation = new THREE.Quaternion();
  ballScene.add(ball);
  ballScene.add(new THREE.HemisphereLight(0xffffff, 0x58662c, 1.7));
  const key = new THREE.DirectionalLight(0xfffae9, 3.1);
  key.position.set(-400, 600, 1000);
  ballScene.add(key);
  const fill = new THREE.DirectionalLight(0xdde8d0, 0.65);
  fill.position.set(600, -200, 700);
  ballScene.add(fill);
  let width = 1;
  let height = 1;
  let contact = { x: 0, y: 0 };
  let release = { x: 0, y: 0 };
  const heldWorld = new THREE.Vector3();
  function project(point) {
    const projected = point.clone().project(playerCamera);
    const rect = playerCanvas.getBoundingClientRect();
    return { x: rect.left + (projected.x + 1) * rect.width / 2, y: rect.top + (1 - projected.y) * rect.height / 2 };
  }
  function resize() {
    const rect = playerCanvas.getBoundingClientRect();
    playerRenderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
    width = window.innerWidth;
    height = window.innerHeight;
    ballRenderer.setSize(width, height, false);
    ballCamera.left = -width / 2;
    ballCamera.right = width / 2;
    ballCamera.top = height / 2;
    ballCamera.bottom = -height / 2;
    ballCamera.position.z = Math.max(2000, Math.hypot(width / 2, height / 2) * 3);
    ballCamera.far = ballCamera.position.z * 2;
    ballCamera.updateProjectionMatrix();
    playerCamera.updateMatrixWorld(true);
    contact = project(contactWorld);
    release = project(releaseWorld);
  }
  function render(ms) {
    const motionTime = ms <= introTiming.impact
      ? ms / introTiming.impact * motion.impactTime
      : Math.min(motion.duration, motion.impactTime + (ms - introTiming.impact) / 1000);
    if (ms < introTiming.impact + 450) {
      motion.update(motionTime);
      tossGrip.apply(1 - 0.55 * smooth((ms - introTiming.tossRelease) / 240));
      playerRenderer.render(playerScene, playerCamera);
    }
    let radius = 4.4;
    let x = release.x;
    let y = release.y;
    if (ms < introTiming.tossRelease) {
      const held = project(heldAnchor.getWorldPosition(heldWorld));
      x = held.x;
      y = held.y;
      ball.rotation.set(0, 0, 0.25);
    } else if (ms < introTiming.impact) {
      const p = clamp((ms - introTiming.tossRelease) / (introTiming.impact - introTiming.tossRelease));
      x += (contact.x - x) * p;
      y += (contact.y - y) * p - Math.sin(Math.PI * p) * 62;
      ball.rotation.set((ms - introTiming.tossRelease) * 0.0012, (ms - introTiming.tossRelease) * 0.0016, 0.25);
    } else {
      const p = clamp((ms - introTiming.impact) / (introTiming.cover - introTiming.impact));
      const targetRadius = Math.hypot(width / 2, height / 2) + 80;
      radius = 4.4 * (targetRadius / 4.4) ** p;
      const move = smooth(p / 0.72);
      x = contact.x + (width / 2 - contact.x) * move;
      y = contact.y + (height / 2 - contact.y) * move;
      const spin = Math.min(ms - introTiming.impact, introTiming.cover - introTiming.impact) / 1000;
      spinRotation.setFromAxisAngle(spinAxis, spin * 22);
      ball.quaternion.copy(impactRotation).multiply(spinRotation);
    }
    ball.position.set(x - width / 2, height / 2 - y, 0);
    ball.scale.setScalar(radius);
    ball.children[0].material.bumpScale = 0.007 * radius;
    ballRenderer.render(ballScene, ballCamera);
  }
  resize();
  render(0);
  return { render, resize, timing: introTiming, dispose: () => { playerRenderer.dispose(); ballRenderer.dispose(); silhouetteMaterial.dispose(); ball.userData.dispose(); } };
}
