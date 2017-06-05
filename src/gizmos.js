
function makePoints(points, options = {}) {
  options.size = options.size || 4;
  options.sizeAttenuation = options.sizeAttenuation === undefined ?
    false : options.sizeAttenuation;
  const geometry = new THREE.Geometry();
  points.forEach(({x, y, z}) => {
    geometry.vertices.push(new THREE.Vector3(x, y, z));
  });
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial(options)
  );
}

export { makePoints };
