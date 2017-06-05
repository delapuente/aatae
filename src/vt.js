import * as components from './components';
import { VirtualTrainer } from './vtrainer';
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
  scene.addEventListener('loaded', () => {
    const vt = VirtualTrainer.fromTypicalScene(scene);
    vt.setStep(RemoveWeld.fromTypicalScene(scene));
    vt.start();
  });
});
