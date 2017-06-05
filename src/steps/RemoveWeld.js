
class RemoveWeld {
  constructor(workbench, hands, chip, suctionPad) {
    this._workbench = workbench;
    this._hands = hands;
    this._chip = chip;
    this._suctionPad = suctionPad;
  }

  setTrainer(trainer) {
    this._trainer = trainer;
  }

  reset() {
    const hands = this._hands;
    const workbench = this._workbench;
    const { suctionPad, suctionHelper } = this._suctionPad;
    const { cardboard, chip, chipWelding, physicalChip } = this._chip;

    // Fix scene: we want the chip to be nested in the cardboard but we don't
    // want it to be treated by the physics engine.
    chip.object3D.parent = cardboard.object3D;
    chip.object3D.updateMatrixWorld(true);

    this._trainer.addHandTargets([cardboard, physicalChip]);

    chipWelding.addEventListener('temperaturechanged', evt => {
      const { temperature } = evt.detail;
      if (temperature === 'burnt') {
        const { x, y, z } = chip.object3D.getWorldPosition();
        console.log(x, y, z);
        this._fatal(
          'It is too hot! You\'ve melted other components!',
          { x, y: y + 0.02, z }
        );
      }
    });

    hands.forEach(hand => {
      hand.addEventListener('gripup', () => {
        console.log(`${hand.id}: gripup`);
        const constraint = physicalChip.getAttribute('constraint');
        if (constraint && constraint.target === suctionHelper) {
          physicalChip.removeAttribute('constraint');
        }
      });

      hand.addEventListener('triggerup', () => {
        console.log(`${hand.id}: triggerup`);
        if (suctionPad.object3D.parent === hand.object3D) {
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
                this._chip.chip = null;
                physicalChip.setAttribute('dynamic-body', 'mass: 0.005');
                physicalChip.setAttribute('constraint', 'target', `#${suctionHelper.id}`);
                const that = this;
                physicalChip.addEventListener('collide', function _oncollide({ detail }) {
                  if (detail.body === workbench.body) {
                    const { x, y, z } = physicalChip.getAttribute('position');
                    const v = detail.target.velocity.length();
                    if (v > 0.7) {
                      physicalChip.setAttribute('color', 'red');
                      that._fatal(
                        'You broke the chip! Be more careful next time.',
                        {x, y: y + 0.02, z}
                      );
                    }
                    else {
                      that._success(
                        'Congratulations! You\'ve completed this step.',
                        {x, y: y + 0.02, z}
                      );
                    }
                    physicalChip.removeEventListener('collide', _oncollide);
                  }
                });
              }
              else if (chipWelding.temperature === 'cold') {
                const { x, y, z } = chipPosition;
                this._info(
                  'The chip weld is not warm enough.',
                  { x, y: y + 0.02, z }
                );
              }
            }
          }
          const physicalChipPosition = physicalChip.object3D.getWorldPosition();
          if (controlPosition.distanceTo(physicalChipPosition) < 0.01) {
            physicalChip.setAttribute('constraint', 'target', `#${suctionHelper.id}`);
          }
        }
      });

      hand.addEventListener('triggerdown', () => {
        console.log(`${hand.id}: triggerdown`);
        const constraint = physicalChip.getAttribute('constraint');
        if (constraint && constraint.target === suctionHelper) {
          physicalChip.removeAttribute('constraint');
        }
      });
    });
  }

  _info(text, anchor) {
    this._call('oninfo', { text, anchor });
  }

  _fatal(text, anchor) {
    this._call('onfatal', { text, anchor });
  }

  _success(text, anchor) {
    this._call('onsuccess', { text, anchor });
  }

  _call(callback, message) {
    if (typeof this[callback] === 'function') {
      this[callback](message);
    }
  }
}

RemoveWeld.fromTypicalScene = function (scene) {
  const workbench = scene.querySelector('#workbench');
  const hands = [
    scene.querySelector('#left-hand'),
    scene.querySelector('#right-hand')
  ];
  const chip = {
    cardboard: scene.querySelector('#cardboard'),
    chip: scene.querySelector('#chip'),
    physicalChip: scene.querySelector('#physical-chip'),
    chipWelding: scene.querySelector('[warming-guide]')
  };
  const suctionPad = {
    suctionPad: scene.querySelector('#suction-pad'),
    suctionHelper: scene.querySelector('#suction-pad > a-box')
  };
  return new RemoveWeld(workbench, hands, chip, suctionPad);
};

export { RemoveWeld };
