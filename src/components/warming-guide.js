import { makePoints } from '../gizmos';

const warmingGuide = {
  attribute: 'warming-guide',
  schema: {
    control: { type: 'selector' },
    path: {
      default: [],
      parse(v) {
        if (Array.isArray(v)) {
          return v;
        }
        const stringList = v.split(',');
        const vectorList = stringList.map(toHeatPoint);
        return vectorList;

        function toHeatPoint(str) {
          const heatPoint = str.trim().split(/\s+/m)
          .map(parseFloat).reduce((obj, n, i) => {
            obj[['x', 'y', 'z'][i]] = n;
            return obj;
          }, {});
          heatPoint.t = 0;
          return heatPoint;
        }
      }
    },
    gain: { type: 'number', default: 10 },
    loose: { type: 'number', default: 1 },
    optimal: {
      default: { min: 232, max: 533 },
      parse(v) {
        if (v.min !== undefined && v.max !== undefined) {
          return v;
        }

        return v.split(/\s+/m).map(parseFloat).reduce(toRange, {});

        function toRange(obj, v, i) {
          obj[['min', 'max'][i]] = v;
          return obj;
        }
      }
    }
  },
  init() {
    this.data.path.forEach(point => {
      this.el.object3D.add(makePoints([point], { color: 0xbbbbbb }))
    });
    this.el.object3D.add(this._points);
  },
  tick(t, dt) {
    this._warmPoints(dt/1000);
    this._colorPoints();
    this._calculateGlobalState();
  },
  _colorPoints() {
    this.el.object3D.children.forEach((point, index) => {
      const { t } = this.data.path[index];
      let color;
      if (t < this.data.optimal.min) {
        const progress = t / this.data.optimal.min;
        color = this._cool.clone().lerp(this._minOptimal, progress);
      }
      else if (t < this.data.optimal.max){
        color = this._optimal;
      }
      else {
        color = this._hot;
      }
      point.material.color.copy(color);
    });
  },
  _warmPoints(dts) {
    const controlEl = this.data.control;
    const controlPoint = controlEl.components['control-point'];
    const controlPosition = controlPoint.getWorldPosition();
    if (!controlPosition) { return; }
    this.data.path.forEach(({ x, y, z, t }, index) => {
      const point = this.el.object3D.localToWorld(new THREE.Vector3(x, y, z));
      if (point.distanceTo(controlPosition) < 0.02) {
        this.data.path[index].t += this.data.gain * dts;
      }
      else {
        this.data.path[index].t = Math.max(0, t - this.data.loose * dts);
      }
    });
  },
  _calculateGlobalState() {
    const individualStates = { cold: 0, burnt: 0, optimal: 0 };
    const { min, max } = this.data.optimal;
    this.data.path.forEach(({ t }) => {
      if (t < min) {
        individualStates.cold++;
      }
      else if (t >= max) {
        individualStates.burnt++;
      }
      else {
        individualStates.optimal++;
      }
    });
    let temperature;
    if (individualStates.optimal === this.data.path.length) {
      temperature = 'optimal';
    }
    else if (individualStates.burnt > 0) {
      temperature = 'burnt';
    }
    else {
      temperature = 'cold';
    }
    const previous = this.el.temperature;
    if (temperature !== previous) {
      this.el.emit('temperaturechanged', { temperature, previous });
      this.el.temperature = temperature;
    }
  },
  _cool: new THREE.Color(0xbbbbbb),
  _minOptimal: new THREE.Color(0xff760d),
  _optimal: new THREE.Color(0xd0ff00),
  _hot: new THREE.Color(0xe30400)
};

export { warmingGuide };
