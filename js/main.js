import { Audio } from './audio.js';
import { UI } from './ui.js';

const audio = new Audio();
const ui = new UI(audio);
// 디버그/테스트용 핸들
window.__ui = ui;
Object.defineProperty(window, '__match', { get: () => ui.match });
Object.defineProperty(window, '__game', { get: () => ui.match.games[0] });

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  ui.frame(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
