import * as components from './components';
import { VirtualTrainer, UI } from './vtrainer';
import { RemoveWeld } from './steps';

function registerAll(components) {
  Object.keys(components).forEach(name => {
    const component = components[name];
    AFRAME.registerComponent(component.attribute, component);
  });
}

registerAll(components);

window.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  const ui = new UI(
    document.querySelector('[ui-dialog]'),
    document.querySelector('#dialog')
  );
  scene.addEventListener('loaded', () => {
    const vt = VirtualTrainer.fromTypicalScene(scene, ui);
    vt.setStep(RemoveWeld.fromTypicalScene(scene));
    vt.start();
  });
});
