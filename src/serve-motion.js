// Retarget a measured serve by its world-space joint directions. The mesh keeps
// its own bone lengths and bind rotations; the BVH's local axes are never copied.
export async function createServeMotion(THREE, model, options = {}) {
  const data = options.data ?? await fetch('assets/serve-mocap.json').then(response => {
    if (!response.ok) throw new Error(`Serve motion ${response.status}`);
    return response.json();
  });
  model.updateMatrixWorld(true);
  const boneNames = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
    'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
    'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
    'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
    'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'];
  const rig = Object.fromEntries(boneNames.map(name => [name, model.getObjectByName(name)]));
  const bind = {};
  for (const [name, bone] of Object.entries(rig)) {
    if (!bone) continue;
    bind[name] = {
      worldPosition: bone.getWorldPosition(new THREE.Vector3()),
      worldQuaternion: bone.getWorldQuaternion(new THREE.Quaternion()),
      localQuaternion: bone.quaternion.clone(),
      localPosition: bone.position.clone(),
    };
    bind[name].worldQuaternionInverse = bind[name].worldQuaternion.clone().invert();
  }
  if (!rig.Hips || !rig.RightArm || !rig.RightForeArm) throw new Error('Serve skeleton is incomplete');

  const points = Object.fromEntries(data.joints.map(name => [name, new THREE.Vector3()]));
  const stride = data.joints.length * 3;
  const frameCount = data.frames.length / stride;
  const axisX = new THREE.Vector3();
  const axisY = new THREE.Vector3();
  const axisZ = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const parentQ = new THREE.Quaternion();
  const desiredQ = new THREE.Quaternion();
  const baselineQ = new THREE.Quaternion();
  const alignQ = new THREE.Quaternion();
  const direction = new THREE.Vector3();
  const baselineDirection = new THREE.Vector3();
  const bindDirection = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const localPosition = new THREE.Vector3();
  const hipDelta = new THREE.Quaternion();
  const chestDelta = new THREE.Quaternion();
  const torsoDelta = new THREE.Quaternion();
  const limbDelta = new THREE.Quaternion();
  const elbowPole = new THREE.Vector3();
  const upperDirection = new THREE.Vector3();
  const lowerDirection = new THREE.Vector3();
  const armFrame = new THREE.Quaternion();

  function directionFrame(primary, pole, output) {
    axisX.copy(primary).normalize();
    axisY.copy(pole).addScaledVector(axisX, -pole.dot(axisX)).normalize();
    axisZ.crossVectors(axisX, axisY).normalize();
    matrix.makeBasis(axisX, axisY, axisZ);
    return output.setFromRotationMatrix(matrix);
  }

  function sample(seconds) {
    const cursor = Math.min(frameCount - 1, Math.max(0, seconds * data.fps));
    const first = Math.floor(cursor);
    const second = Math.min(frameCount - 1, first + 1);
    const fraction = cursor - first;
    for (let i = 0; i < data.joints.length; i++) {
      const a = first * stride + i * 3;
      const b = second * stride + i * 3;
      points[data.joints[i]].set(
        data.frames[a] + (data.frames[b] - data.frames[a]) * fraction,
        data.frames[a + 1] + (data.frames[b + 1] - data.frames[a + 1]) * fraction,
        data.frames[a + 2] + (data.frames[b + 2] - data.frames[a + 2]) * fraction,
      );
    }
  }
  function frame(left, right, lower, upper, output) {
    axisX.subVectors(left, right).normalize();
    axisY.subVectors(upper, lower).normalize();
    axisZ.crossVectors(axisX, axisY).normalize();
    axisY.crossVectors(axisZ, axisX).normalize();
    matrix.makeBasis(axisX, axisY, axisZ);
    return output.setFromRotationMatrix(matrix);
  }
  const bindHipFrameInverse = frame(bind.LeftUpLeg.worldPosition, bind.RightUpLeg.worldPosition,
    bind.Hips.worldPosition, bind.Spine2.worldPosition, new THREE.Quaternion()).invert();
  const bindChestFrameInverse = frame(bind.LeftArm.worldPosition, bind.RightArm.worldPosition,
    bind.Spine2.worldPosition, bind.Neck.worldPosition, new THREE.Quaternion()).invert();
  sample(0);
  const initialHip = points.Hips.clone();
  // Scale translation to the actual mesh's leg length, without stretching bones.
  const sourceLegLength = points.LeftHip.distanceTo(points.LeftKnee) + points.LeftKnee.distanceTo(points.LeftAnkle);
  const targetLegLength = bind.LeftUpLeg.worldPosition.distanceTo(bind.LeftLeg.worldPosition)
    + bind.LeftLeg.worldPosition.distanceTo(bind.LeftFoot.worldPosition);
  const movementScale = targetLegLength / sourceLegLength;

  function setWorldQuaternion(name, quaternion) {
    const bone = rig[name];
    if (!bone) return;
    bone.parent.updateWorldMatrix(true, false);
    bone.parent.getWorldQuaternion(parentQ).invert();
    bone.quaternion.copy(parentQ).multiply(quaternion).normalize();
    bone.updateWorldMatrix(false, false);
  }
  function applyBody(name, delta) {
    if (!bind[name]) return;
    desiredQ.copy(delta).multiply(bind[name].worldQuaternion);
    setWorldQuaternion(name, desiredQ);
  }
  function aim(name, childName, sourceStart, sourceEnd, parentDelta) {
    if (!bind[name] || !bind[childName]) return;
    bindDirection.subVectors(bind[childName].worldPosition, bind[name].worldPosition).normalize();
    baselineDirection.copy(bindDirection).applyQuaternion(parentDelta).normalize();
    direction.subVectors(points[sourceEnd], points[sourceStart]).normalize();
    baselineQ.copy(parentDelta).multiply(bind[name].worldQuaternion);
    alignQ.setFromUnitVectors(baselineDirection, direction);
    desiredQ.copy(alignQ).multiply(baselineQ);
    setWorldQuaternion(name, desiredQ);
  }
  function getDelta(name, output) {
    rig[name].getWorldQuaternion(output);
    return output.multiply(bind[name].worldQuaternionInverse);
  }
  const armChains = [
    ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'LeftCollar', 'LeftShoulder', 'LeftElbow', 'LeftWrist'],
    ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'RightCollar', 'RightShoulder', 'RightElbow', 'RightWrist'],
  ];
  const legChains = [
    ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'LeftHip', 'LeftKnee', 'LeftAnkle', 'LeftAnkleEnd'],
    ['RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'RightHip', 'RightKnee', 'RightAnkle', 'RightAnkleEnd'],
  ];
  const armBindings = armChains.map(([, arm, forearm, hand, , shoulder, elbow, wrist]) => {
    upperDirection.subVectors(bind[forearm].worldPosition, bind[arm].worldPosition).normalize();
    lowerDirection.subVectors(bind[hand].worldPosition, bind[forearm].worldPosition).normalize();
    elbowPole.crossVectors(upperDirection, lowerDirection).normalize();
    const upperFrameInverse = directionFrame(upperDirection, elbowPole, new THREE.Quaternion()).invert();
    const lowerFrameInverse = directionFrame(lowerDirection, elbowPole, new THREE.Quaternion()).invert();
    const poles = [];
    const previous = new THREE.Vector3(0, 0, 1);
    for (let f = 0; f < frameCount; f++) {
      sample(f / data.fps);
      upperDirection.subVectors(points[elbow], points[shoulder]).normalize();
      lowerDirection.subVectors(points[wrist], points[elbow]).normalize();
      elbowPole.crossVectors(upperDirection, lowerDirection);
      // A nearly straight elbow does not define a reliable bend plane. Maintain
      // the prior plane through extension and remove marker-induced sign flips.
      if (elbowPole.lengthSq() < .0025) elbowPole.copy(previous);
      else {
        elbowPole.normalize();
        if (f && elbowPole.dot(previous) < 0) elbowPole.negate();
        previous.copy(elbowPole);
      }
      poles.push(elbowPole.clone());
    }
    const smoothPoles = poles.map((pole, f) => {
      const smooth = new THREE.Vector3();
      for (let offset = -2; offset <= 2; offset++) {
        const weight = [1, 2, 3, 2, 1][offset + 2];
        smooth.addScaledVector(poles[Math.min(frameCount - 1, Math.max(0, f + offset))], weight);
      }
      return smooth.normalize();
    });
    return { arm, forearm, shoulder, elbow, wrist, upperFrameInverse, lowerFrameInverse, poles: smoothPoles };
  });
  function applyArm(binding, seconds) {
    const cursor = Math.min(frameCount - 1, Math.max(0, seconds * data.fps));
    const first = Math.floor(cursor);
    const next = Math.min(frameCount - 1, first + 1);
    elbowPole.copy(binding.poles[first]).lerp(binding.poles[next], cursor - first).normalize();
    upperDirection.subVectors(points[binding.elbow], points[binding.shoulder]).normalize();
    lowerDirection.subVectors(points[binding.wrist], points[binding.elbow]).normalize();
    directionFrame(upperDirection, elbowPole, armFrame);
    desiredQ.copy(armFrame).multiply(binding.upperFrameInverse).multiply(bind[binding.arm].worldQuaternion);
    setWorldQuaternion(binding.arm, desiredQ);
    directionFrame(lowerDirection, elbowPole, armFrame);
    desiredQ.copy(armFrame).multiply(binding.lowerFrameInverse).multiply(bind[binding.forearm].worldQuaternion);
    setWorldQuaternion(binding.forearm, desiredQ);
  }
  function update(seconds) {
    sample(seconds);
    frame(points.LeftHip, points.RightHip, points.Hips, points.Chest, hipDelta).multiply(bindHipFrameInverse);
    frame(points.LeftShoulder, points.RightShoulder, points.Chest, points.Neck, chestDelta).multiply(bindChestFrameInverse);
    worldPosition.subVectors(points.Hips, initialHip).multiplyScalar(movementScale).add(bind.Hips.worldPosition);
    rig.Hips.parent.updateWorldMatrix(true, false);
    localPosition.copy(worldPosition);
    rig.Hips.parent.worldToLocal(localPosition);
    rig.Hips.position.copy(localPosition);
    applyBody('Hips', hipDelta);
    torsoDelta.copy(hipDelta).slerp(chestDelta, .35);
    applyBody('Spine', torsoDelta);
    torsoDelta.copy(hipDelta).slerp(chestDelta, .68);
    applyBody('Spine1', torsoDelta);
    applyBody('Spine2', chestDelta);
    aim('Neck', 'Head', 'Neck', 'Head', chestDelta);
    // Head has a distinct end marker; use it without changing the neck length.
    getDelta('Neck', limbDelta);
    const headChild = rig.Head.children.find(child => child.isBone);
    if (headChild) {
      direction.subVectors(points.HeadEnd, points.Head).normalize();
      baselineDirection.set(0, 1, 0).applyQuaternion(limbDelta);
      alignQ.setFromUnitVectors(baselineDirection, direction);
      desiredQ.copy(alignQ).multiply(limbDelta).multiply(bind.Head.worldQuaternion);
      setWorldQuaternion('Head', desiredQ);
    }
    for (let i = 0; i < armChains.length; i++) {
      const [collar, arm, forearm, hand, sourceCollar, sourceShoulder] = armChains[i];
      aim(collar, arm, sourceCollar, sourceShoulder, chestDelta);
      applyArm(armBindings[i], seconds);
      // Marker wrists are noisy and do not capture finger motion. Keep a stable
      // local grip that follows the measured forearm; racket remains a child.
      rig[hand].quaternion.copy(bind[hand].localQuaternion);
      rig[hand].updateWorldMatrix(false, false);
    }
    for (const [thigh, shin, foot, toe, sourceHip, sourceKnee, sourceAnkle, sourceToe] of legChains) {
      aim(thigh, shin, sourceHip, sourceKnee, hipDelta);
      getDelta(thigh, limbDelta);
      aim(shin, foot, sourceKnee, sourceAnkle, limbDelta);
      getDelta(shin, limbDelta);
      aim(foot, toe, sourceAnkle, sourceToe, limbDelta);
    }
    model.updateMatrixWorld(true);
  }
  update(0);
  return {
    duration: data.duration,
    impactTime: data.impactTime,
    update,
    hips: rig.Hips,
    rightHand: rig.RightHand,
    leftHand: rig.LeftHand,
    rightForeArm: rig.RightForeArm,
    leftForeArm: rig.LeftForeArm,
    rig,
  };
}
