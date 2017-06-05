
function distance(a, b) {
  return a.object3D.getWorldPosition().distanceTo(
    b.object3D.getWorldPosition()
  );
}

export { distance };
