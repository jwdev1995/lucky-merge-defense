// 헤드리스 밸런스 시뮬레이터: 단순 봇 전략으로 N판 플레이 → 도달 라운드 분포
import { Game } from '../js/game.js';
import { UNITS, RECIPES, RARITY } from '../js/config.js';

function playOne(strategy = 'greedy', maxSec = 1200) {
  const g = new Game({});
  g.start();
  let t = 0, acc = 0, maxE = 0;
  while (g.state === 'playing' && t < maxSec) {
    const dt = 1 / 30; g.update(dt); t += dt; acc += dt; if (g.enemies.length > maxE) maxE = g.enemies.length;
    if (acc >= 0.5) { // 0.5초마다 봇 행동
      acc = 0;
      for (let i = 0; i < g.cells.length; i++) if (g.canMerge(i)) g.merge(i);
      RECIPES.forEach((rc, i) => { if (g.recipeStatus(rc).every(s => s.have)) g.craft(i); });
      // 강화: 보유 유닛이 많은 등급에 투자 (골드 여유 시)
      if (strategy === 'greedy') {
        while (g.gold >= 20 && g.unitCount() < 20) { const r = g.summon(); if (!r.ok) break; }
        if (g.unitCount() >= 20) {
          // 가장 낮은 등급 단일 유닛 판매 → 자리 확보
          const idx = g.cells.map((c, i) => c ? { i, r: RARITY.indexOf(UNITS[c.id].rarity), n: c.count } : null).filter(Boolean).sort((a, b) => a.r - b.r || a.n - b.n)[0];
          if (idx && idx.r <= 1) g.sell(idx.i);
        }
        const counts = {}; for (const c of g.cells) if (c) counts[UNITS[c.id].rarity] = (counts[UNITS[c.id].rarity] || 0) + c.count;
        const best = Object.entries(counts).sort((a, b) => b[1] * (RARITY.indexOf(b[0]) + 1) - a[1] * (RARITY.indexOf(a[0]) + 1))[0];
        if (best && g.gold >= g.upgradeCost(best[0]) + 40) g.upgrade(best[0]);
      }
    }
  }
  return { state: g.state, round: g.round, maxE, best: RARITY[g.stats.bestRarity], kills: g.stats.kills, t: Math.round(t) };
}
const N = Number(process.argv[2] || 30);
const res = []; for (let i = 0; i < N; i++) res.push(playOne());
const rounds = res.map(r => r.round).sort((a, b) => a - b);
const won = res.filter(r => r.state === 'won').length;
const hist = {}; for (const r of res) hist[r.round] = (hist[r.round] || 0) + 1;
console.log(`games=${N} won=${won} median=${rounds[Math.floor(N / 2)]} min=${rounds[0]} max=${rounds[N - 1]}`);
console.log('round hist', Object.entries(hist).map(([k, v]) => `${k}:${v}`).join(' '));
console.log('maxEnemies avg', Math.round(res.reduce((s, r) => s + r.maxE, 0) / N), 'max', Math.max(...res.map(r => r.maxE)));
console.log('best rarity', res.reduce((m, r) => (m[r.best] = (m[r.best] || 0) + 1, m), {}));
