/* Unit-radius tennis ball. Rotate the returned group, not its children. */
export function createTennisBall(THREE) {
  const width = 1024;
  const height = 512;
  const colourCanvas = document.createElement('canvas');
  const reliefCanvas = document.createElement('canvas');
  colourCanvas.width = reliefCanvas.width = width;
  colourCanvas.height = reliefCanvas.height = height;
  const colourContext = colourCanvas.getContext('2d');
  const reliefContext = reliefCanvas.getContext('2d');
  const colourPixels = colourContext.createImageData(width, height);
  const reliefPixels = reliefContext.createImageData(width, height);

  // Stable, tileable noise gives the felt the same appearance on every visit.
  let seed = 0x7a38cd21;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const noiseGrids = [8, 24, 80].map(size => ({
    size,
    values: Float32Array.from({ length: size * size }, random),
  }));
  const smooth = value => value * value * (3 - 2 * value);
  const noise = (grid, u, v) => {
    const gx = u * grid.size;
    const gy = v * grid.size;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const tx = smooth(gx - ix);
    const ty = smooth(gy - iy);
    const sample = (x, y) => grid.values[
      ((y + grid.size) % grid.size) * grid.size + (x + grid.size) % grid.size
    ];
    const first = sample(ix, iy) * (1 - tx) + sample(ix + 1, iy) * tx;
    const second = sample(ix, iy + 1) * (1 - tx) + sample(ix + 1, iy + 1) * tx;
    return first * (1 - ty) + second * ty;
  };
  const mix = (a, b, t) => a + (b - a) * t;

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    const latitude = (v - 0.5) * Math.PI;
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width;
      const longitude = u * Math.PI * 2;
      const index = (y * width + x) * 4;
      const grain = random() - 0.5;
      const mottling = (noise(noiseGrids[0], u, v) - 0.5) * 10
        + (noise(noiseGrids[1], u, v) - 0.5) * 8
        + (noise(noiseGrids[2], u, v) - 0.5) * 5;

      // One continuous, curved seam divides the two felt panels. Measuring
      // perpendicular to the curve keeps its width consistent on the sphere.
      const seamLatitude = 0.64 * Math.cos(longitude * 2);
      const slope = -1.28 * Math.sin(longitude * 2);
      const perpendicularDistance = Math.abs(latitude - seamLatitude)
        / Math.sqrt(1 + (slope / Math.max(0.3, Math.cos(seamLatitude))) ** 2);
      const seamHalfWidth = 0.022 + grain * 0.0008;
      const edge = Math.min(1, Math.max(0,
        (seamHalfWidth + 0.004 - perpendicularDistance) / 0.008));
      const seam = smooth(edge);
      const recessedEdge = Math.exp(-(((perpendicularDistance - 0.028) / 0.005) ** 2));

      // Yellow-green wool with subtle natural colour variation. The seam is
      // warm off-white rubber, with a shallow dark groove beside the felt.
      colourPixels.data[index] = mix(186 + mottling + grain * 11 - recessedEdge * 16,
        221 + grain * 5, seam);
      colourPixels.data[index + 1] = mix(199 + mottling + grain * 10 - recessedEdge * 17,
        220 + grain * 5, seam);
      colourPixels.data[index + 2] = mix(49 + mottling * 0.45 + grain * 6 - recessedEdge * 9,
        195 + grain * 5, seam);
      colourPixels.data[index + 3] = 255;

      const relief = mix(144 + grain * 37 + mottling * 1.4 - recessedEdge * 14,
        86 + grain * 4, seam);
      reliefPixels.data[index] = relief;
      reliefPixels.data[index + 1] = relief;
      reliefPixels.data[index + 2] = relief;
      reliefPixels.data[index + 3] = 255;
    }
  }
  colourContext.putImageData(colourPixels, 0, 0);
  reliefContext.putImageData(reliefPixels, 0, 0);

  const map = new THREE.CanvasTexture(colourCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  const bumpMap = new THREE.CanvasTexture(reliefCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    bumpMap,
    bumpScale: 0.007,
    roughness: 0.96,
    metalness: 0,
  });
  const group = new THREE.Group();
  group.name = 'felt-tennis-ball';
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), material);
  sphere.name = 'felt-and-inset-seam';
  group.add(sphere);

  // Sparse short fibres break the perfectly smooth silhouette. They share
  // one buffer and one draw call, and the random lengths avoid a spiky outline.
  const fibreCount = 2200;
  const fibrePositions = new Float32Array(fibreCount * 6);
  for (let index = 0; index < fibreCount; index += 1) {
    const y = random() * 2 - 1;
    const azimuth = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    const x = ring * Math.cos(azimuth);
    const z = ring * Math.sin(azimuth);
    const base = index * 6;
    const length = 0.001 + random() * 0.003;
    fibrePositions.set([x, y, z, x * (1 + length), y * (1 + length), z * (1 + length)], base);
  }
  const fibreGeometry = new THREE.BufferGeometry();
  fibreGeometry.setAttribute('position', new THREE.BufferAttribute(fibrePositions, 3));
  const fibres = new THREE.LineSegments(fibreGeometry, new THREE.LineBasicMaterial({
    color: 0xc2cd67,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    toneMapped: true,
  }));
  fibres.name = 'fine-felt-fibres';
  group.add(fibres);
  group.userData.dispose = () => {
    sphere.geometry.dispose();
    material.dispose();
    map.dispose();
    bumpMap.dispose();
    fibreGeometry.dispose();
    fibres.material.dispose();
  };
  return group;
}
