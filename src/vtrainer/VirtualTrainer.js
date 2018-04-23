
import { distance } from '../helpers';

class VirtualTrainer {
  constructor(hands, tools, ui) {
    this._hands = hands;
    this._tools = tools;
    this._ui = ui;
    this._setupInteractions();
  }

  _setupInteractions() {
    this._hands.forEach(hand => {
      hand.addEventListener('gripdown', () => {
        console.log(`${hand.id}: gripdown on tool`);
        for (let i = 0, l = this._tools.length; i < l; i++) {
          let tool = this._tools[i];
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
            tool.object3D.parent = hand.object3D;
          }
        }
      });

      hand.addEventListener('gripup', () => {
        console.log(`${hand.id}: gripup on tool`);
        for (let i = 0, l = this._tools.length; i < l; i++) {
          let tool = this._tools[i];
          if (tool.object3D.parent === hand.object3D) {
            tool.sceneEl.appendChild(tool);
            hand.object3D.children.forEach(child => child.visible = true);
            tool.setAttribute('position', tool._oldvalues.position);
            tool.setAttribute('rotation', tool._oldvalues.rotation);
          }
        }
      });

    });
  }

  addHandTargets(targets) {
    // TODO: Avoid adding the listener twice for the same target.
    this._hands.forEach(hand => {
      hand.addEventListener('gripdown', () => {
        console.log(`${hand.id}: gripdown on hand target`);
        for (let i = 0, l = targets.length; i < l; i++) {
          const piece = targets[i];
          if (distance(hand, piece) < 0.15) {
            piece.setAttribute('constraint', 'target', `#${hand.id}`);
          }
        }
      });

      hand.addEventListener('gripup', () => {
        console.log(`${hand.id}: gripup on hand target`);
        for (let i = 0, l = targets.length; i < l; i++) {
          const piece = targets[i];
          const constraint = piece.getAttribute('constraint');
          if (constraint && constraint.target === hand) {
            piece.removeAttribute('constraint');
          }
        }
      });

    });
  }

  setStep(step) {
    this._step = step;
    this._step.setTrainer(this);
    this._step.oninfo = this._ui.info.bind(this._ui);
    this._step.onsuccess = this._ui.success.bind(this._ui);
    this._step.onfatal = message => {
      this._ui.fatal(message);
      // TODO: Emit an event when the message dissappears and listen for it.
      // Then, reload.
    };
  }

  start() {
    this._step.reset();
  }
}

VirtualTrainer.fromTypicalScene = function (scene, ui) {
  const hands = [
    scene.querySelector('#left-hand'),
    scene.querySelector('#right-hand')
  ];
  const tools = scene.querySelectorAll('.tool');
  return new VirtualTrainer(hands, tools, ui);
};

export { VirtualTrainer };
