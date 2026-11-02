// 스프라이트 그리드 검증 + ASCII 미리보기: node tools/check-sprites.mjs [key ...]
import { spriteGrid, SPRITE_KEYS, hasAttackFrame } from '../js/sprites.js';
const keys = process.argv.slice(2).length ? process.argv.slice(2) : SPRITE_KEYS;
let bad = 0;
for (const k of keys) {
  for (const frame of hasAttackFrame(k) ? ['idle', 'attack'] : ['idle']) {
    try {
      const g = spriteGrid(k, frame);
      if (!g) { console.log('MISSING', k); bad++; continue; }
      if (process.argv.length > 2) {
        console.log(`── ${k} (${frame})`);
        for (const row of g) console.log(row.map(c => c ? (c === '#2b2340' ? '#' : '▒') : '·').join(''));
      }
    } catch (e) { console.log('ERR', k, frame, e.message); bad++; }
  }
}
console.log(`checked ${keys.length} sprites, errors=${bad}`);
process.exit(bad ? 1 : 0);
