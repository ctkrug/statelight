import { attach } from '../src/index.js';

document.documentElement.classList.remove('no-js');

const LIGHT_COLORS = {
  red: 'var(--sl-danger)',
  green: 'var(--sl-success)',
  yellow: 'var(--sl-accent-support)'
};
const NEXT_STATE = { red: 'green', green: 'yellow', yellow: 'red' };

const wordmarkLight = document.getElementById('wordmark-light');
const lightEl = document.getElementById('demo-light');
const labelEl = document.getElementById('demo-label');
const panelHost = document.getElementById('demo-panel-host');
const advanceBtn = document.getElementById('demo-advance');

// The entire "state machine" driving the hero demo: a plain object plus a
// lookup table, same as anything Statelight is meant to attach to.
const trafficLight = { state: 'red' };

function pulseWordmark() {
  wordmarkLight.classList.remove('is-pulsing');
  // Force a reflow so re-adding the class restarts the animation even if
  // it's already mid-run from a previous interaction.
  void wordmarkLight.offsetWidth;
  wordmarkLight.classList.add('is-pulsing');
}

function renderLight() {
  const color = LIGHT_COLORS[trafficLight.state];
  lightEl.style.background = color;
  lightEl.style.setProperty('--light-glow', color);
  labelEl.textContent = trafficLight.state;
}

attach(trafficLight, {
  label: 'traffic light',
  eventName: 'advance',
  container: panelHost,
  transitions: {
    red: { advance: 'green' },
    green: { advance: 'yellow' },
    yellow: { advance: 'red' }
  }
});

advanceBtn.addEventListener('click', () => {
  trafficLight.state = NEXT_STATE[trafficLight.state];
  renderLight();
  pulseWordmark();
});

renderLight();
pulseWordmark();
