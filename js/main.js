import { Game } from './game.js';
import { Renderer } from './render.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';
import { bindInput } from './input.js';

const canvas = document.getElementById('board');
const audio = new Audio();
const renderer = new Renderer(canvas);
let ui;
const game = new Game({
  sfx: (n) => audio.play(n),
  toast: (m) => ui && ui.toast(m, 'good'),
  banner: (b) => ui && ui.banner(b),
  end: (r) => ui && ui.end(r),
});
ui = new UI(game, renderer, audio);
bindInput(canvas, renderer, ui);
window.addEventListener('resize', () => renderer.resize());
window.__game = game; // 디버그/테스트용

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  game.update(dt);
  renderer.draw(game, dt);
  if (game.state !== 'title') ui.tick();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
