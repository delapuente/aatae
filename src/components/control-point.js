import { makePoints } from '../gizmos';

const controlPoint = {
  attribute: 'control-point',
  schema: { type: 'vec3' },
  init() {
    this._point = makePoints([this.data], { color: 0xffff00 });
    this.el.object3D.add(this._point);
  },
  getWorldPosition() {
    const { x, y, z } = this.data;
    const v = new THREE.Vector3(x, y, z);
    return this.el.object3D.localToWorld(v);
  }
};

export { controlPoint };
