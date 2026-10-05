// Bind-relative tennis grip. Only finger bones are controlled: the measured
// wrist and forearm motion, racket socket, and bone lengths stay independent.
function createHandGrip(THREE, model, side, configurations) {
  const hand = model.getObjectByName(`${side}Hand`);
  if (!hand) return { apply() {}, restore() {}, controlledBones: [] };
  model.updateMatrixWorld(true);
  const localFlexAxis = new THREE.Vector3(1, 0, 0);
  const localAdductionAxis = new THREE.Vector3(0, 0, 1);
  const localOppositionAxis = new THREE.Vector3(0, 1, 0);
  const degrees = Math.PI / 180;
  const curlDelta = new THREE.Quaternion();
  const inwardDelta = new THREE.Quaternion();
  const oppositionDelta = new THREE.Quaternion();
  const controls = [];
  const basePositions = [];
  for (const [finger, configuration] of Object.entries(configurations)) {
    for (let segment = 1; segment <= 3; segment++) {
      const bone = model.getObjectByName(`${side}Hand${finger}${segment}`);
      if (!bone) continue;
      const bindQuaternion = bone.quaternion.clone();
      curlDelta.setFromAxisAngle(localFlexAxis, configuration.curl[segment - 1] * degrees);
      const targetQuaternion = bindQuaternion.clone();
      if (segment === 1) {
        inwardDelta.setFromAxisAngle(localAdductionAxis, configuration.inward * degrees);
        targetQuaternion.multiply(inwardDelta);
        if (configuration.opposition) {
          oppositionDelta.setFromAxisAngle(localOppositionAxis, configuration.opposition * degrees);
          targetQuaternion.multiply(oppositionDelta);
        }
        if (finger !== 'Thumb') basePositions.push(hand.worldToLocal(bone.getWorldPosition(new THREE.Vector3())));
      }
      targetQuaternion.multiply(curlDelta).normalize();
      controls.push({ bone, bindQuaternion, targetQuaternion });
    }
  }
  const gripCenterLocal = new THREE.Vector3();
  for (const position of basePositions) gripCenterLocal.add(position);
  if (basePositions.length) gripCenterLocal.multiplyScalar(1 / basePositions.length);
  // The socket is expressed in this skeleton's own hand units, not world meters.
  // It is a suggested palm contact point; this module never moves the racket.
  const handLength = gripCenterLocal.y;
  gripCenterLocal.y *= .72;
  gripCenterLocal.z += handLength * .19;

  function apply(strength = 1) {
    const amount = Math.min(1, Math.max(0, strength));
    for (const { bone, bindQuaternion, targetQuaternion } of controls) {
      bone.quaternion.copy(bindQuaternion).slerp(targetQuaternion, amount);
    }
    hand.updateWorldMatrix(true, true);
  }
  function restore() { apply(0); }
  apply();
  return {
    apply,
    restore,
    gripCenterLocal,
    palmNormalLocal: new THREE.Vector3(0, 0, 1),
    controlledBones: controls.map(({ bone }) => bone.name),
  };
}

export function createServeGrip(THREE, model) {
  return createHandGrip(THREE, model, 'Right', {
    // Index stays slightly separated rather than closing into the other fingers.
    Index: { curl: [44, 70, 45], inward: 25 },
    Middle: { curl: [52, 78, 44], inward: 4 },
    Ring: { curl: [58, 85, 48], inward: -4 },
    Pinky: { curl: [62, 85, 50], inward: -20 },
    Thumb: { curl: [0, 60, 60], inward: 10, opposition: -60 },
  });
}

export function createTossGrip(THREE, model) {
  return createHandGrip(THREE, model, 'Left', {
    Index: { curl: [30, 48, 25], inward: 12 },
    Middle: { curl: [38, 52, 28], inward: 4 },
    Ring: { curl: [42, 57, 30], inward: -4 },
    Pinky: { curl: [48, 62, 32], inward: -14 },
    Thumb: { curl: [0, 34, 25], inward: 8, opposition: -36 },
  });
}
