let scene,
    cardboard,
    chip,
    physicalChip,
    chipWelding,
    leftHand,
    rightHand,
    tools,
    suctionPad,
    workbench;

window.addEventListener('DOMContentLoaded', () => {
  scene = document.querySelector('a-scene');
  scene.addEventListener('loaded', () => {
    cardboard = document.getElementById('cardboard');
    chip = document.getElementById('chip');
    physicalChip = document.getElementById('physicalChip');
    chipWelding = chip.querySelector('[warm-guide]');
    leftHand = document.getElementById('left-hand');
    rightHand = document.getElementById('right-hand');
    suctionPad = document.getElementById('suction-pad');
    workbench = document.getElementById('workbench');

    tools = document.querySelectorAll('.tool');

    chipWelding
    .addEventListener('temperaturechanged', ({ detail: {temperature, old} }) => {
      console.log(`The state changed from ${old} to ${temperature}`);
    });

    [leftHand, rightHand].forEach(hand => {
      hand.addEventListener('gripdown', () => {
        console.log(`${hand.id}: gripdown`);
        [cardboard, physicalChip].forEach(piece => {
          if (distance(hand, piece) < 0.15) {
            piece.setAttribute('constraint', 'target', `#${hand.id}`);
          }
        });
        for (let i = 0, l = tools.length; i < l; i++) {
          let tool = tools[i];
          if (distance(hand, tool) < 0.10) {
            tool._oldvalues = tool._oldvalues || {};
            tool._oldvalues.position = tool.getAttribute('position');
            tool._oldvalues.rotation = tool.getAttribute('rotation');
            ['position', 'rotation'].forEach(handheldProperty => {
              const dataName = `data-handheld-${handheldProperty}`;
              const handheldValue = tool.getAttribute(dataName);
              if (handheldValue) {
                tool.setAttribute(handheldProperty, handheldValue);
              }
            });
            hand.object3D.children.forEach(child => child.visible = false);
            hand.appendChild(tool);
          }
        }
      });

      hand.addEventListener('gripup', () => {
        console.log(`${hand.id}: gripup`);
        [cardboard, physicalChip].forEach(piece => {
          const constraint = piece.getAttribute('constraint');
          if (constraint && constraint.target === hand) {
            piece.removeAttribute('constraint');
          }
        });
        for (let i = 0, l = tools.length; i < l; i++) {
          let tool = tools[i];
          if (tool.parentNode === hand) {
            tool.sceneEl.appendChild(tool);
            hand.object3D.children.forEach(child => child.visible = true);
            tool.setAttribute('position', tool._oldvalues.position);
            tool.setAttribute('rotation', tool._oldvalues.rotation);
          }
        }
        const constraint2 = physicalChip.getAttribute('constraint');
        if (constraint2 && constraint2.target === suctionPad) {
          physicalChip.removeAttribute('constraint');
        }
      });

      hand.addEventListener('triggerup', () => {
        console.log(`${hand.id}: triggerup`);
        if (suctionPad.parentNode === hand) {
          const {x, y, z} = suctionPad.getAttribute('control-point');
          const localPosition = new THREE.Vector3(x, y, z);
          const controlPosition = suctionPad.object3D.localToWorld(localPosition);
          if (chip) {
            const chipPosition = chip.object3D.getWorldPosition();
            if (controlPosition.distanceTo(chipPosition) < 0.01) {
              if (chipWelding.temperature === 'optimal') {
                physicalChip.removeAttribute('dynamic-body');
                chip.object3D.getWorldPosition(physicalChip.object3D.position);
                chip.parentNode.removeChild(chip);
                chip = null;
                physicalChip.setAttribute('dynamic-body', 'mass: 0.005');
                physicalChip.setAttribute('constraint', `target: #${suctionPad.id}`);
                physicalChip.addEventListener('collide', ({ detail }) => {
                  if (detail.body === workbench.body) {
                    const v = detail.target.velocity.length();
                    if (v > 0.7) {
                      physicalChip.setAttribute('color', 'red');
                    }
                  }
                });
              }
              else {
                console.log('así no vas a ningún lado');
              }
            }
          }
          const physicalChipPosition = physicalChip.object3D.getWorldPosition();
          if (controlPosition.distanceTo(physicalChipPosition) < 0.01) {
            physicalChip.setAttribute('constraint', 'target', `#${suctionPad.id}`);
          }
        }
      });

      hand.addEventListener('triggerdown', () => {
        console.log(`${hand.id}: triggerdown`);
        const constraint = physicalChip.getAttribute('constraint');
        if (constraint && constraint.target === suctionPad) {
          physicalChip.removeAttribute('constraint');
        }
      });
    });

    chip.object3D.parent = cardboard.object3D;
    chip.object3D.updateMatrixWorld(true);
  });
});

AFRAME.registerComponent('eata-vt', {
  dependencies: ['physics'],
  init() {
    // Nesting does not seem to work
  }
});

AFRAME.registerComponent('control-point', {
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
});

AFRAME.registerComponent('warm-guide', {
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
    const old = this.el.temperature;
    if (temperature !== old) {
      this.el.emit('temperaturechanged', { temperature, old });
      this.el.temperature = temperature;
    }
  },
  _cool: new THREE.Color(0xbbbbbb),
  _minOptimal: new THREE.Color(0xff760d),
  _optimal: new THREE.Color(0xd0ff00),
  _hot: new THREE.Color(0xe30400)
});

function distance(a, b) {
  return a.object3D.getWorldPosition().distanceTo(
    b.object3D.getWorldPosition()
  );
}

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
