
class RemoveWeld {
  constructor(hands, chip, suctionPad) {
    this._hands = hands;
    this._chip = chip;
    this._suctionPad = suctionPad;
  }

  setTrainer(trainer) {
    this._trainer = trainer;
  }

  reset() {
    const hands = this._hands;
    const { suctionPad, suctionHelper } = this._suctionPad;
    const { cardboard, chip, chipWelding, physicalChip } = this._chip;

    // Fix scene: we want the chip to be nested in the cardboard but we don't
    // want it to be treated by the physics engine.
    chip.object3D.parent = cardboard.object3D;
    chip.object3D.updateMatrixWorld(true);

    this._trainer.addHandTargets([cardboard, physicalChip]);

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
}

RemoveWeld.fromTypicalScene = function (scene) {
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
  return new RemoveWeld(hands, chip, suctionPad);
};

export { RemoveWeld };
