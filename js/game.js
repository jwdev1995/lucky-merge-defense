// 게임 로직 (DOM 비의존). UI/렌더러는 상태를 읽고, hooks로 이벤트를 받는다.
import { BOARD, RULES, RARITY, RARITY_INFO, UPGRADE, SUMMON_ODDS, ROULETTE, UNITS, RECIPES, ENEMIES, BOSSES, WAVE } from './config.js';
import { rand, pick, weighted, dist, shuffle } from './utils.js';

const PERIM = 2 * (BOARD.cols - 1) + 2 * (BOARD.rows - 1); // 22
export const GRID_CELLS = BOARD.gridCols * BOARD.gridRows;

export function pathPos(t) {
  const W = BOARD.cols - 1, H = BOARD.rows - 1;
  t = ((t % PERIM) + PERIM) % PERIM;
  if (t < W) return { x: 0.5 + t, y: 0.5 };
  if (t < W + H) return { x: 0.5 + W, y: 0.5 + (t - W) };
  if (t < 2 * W + H) return { x: 0.5 + W - (t - W - H), y: 0.5 + H };
  return { x: 0.5, y: 0.5 + H - (t - 2 * W - H) };
}
export function cellCenter(i) {
  const c = i % BOARD.gridCols, r = Math.floor(i / BOARD.gridCols);
  return { x: BOARD.gridX + c + 0.5, y: BOARD.gridY + r + 0.5 };
}
export const unitsOfRarity = (r) => Object.values(UNITS).filter(u => u.rarity === r);
export const nextRarity = (r) => RARITY[RARITY.indexOf(r) + 1] || null;

let _id = 1;

export class Game {
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.reset();
  }
  emit(ev, data) { if (this.hooks[ev]) this.hooks[ev](data); }

  reset() {
    this.state = 'title';
    this.gold = RULES.startGold;
    this.round = 0;
    this.roundTimer = 0;
    this.cells = Array(GRID_CELLS).fill(null);     // {id, count, cd}
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.upgrades = { common: 0, rare: 0, epic: 0, legend: 0, mythic: 0 };
    this.spawnQueue = [];
    this.spawnClock = 0;
    this.time = 0;
    this.speed = 1;
    this.boss = null;
    this.stats = { kills: 0, summons: 0, merges: 0, crafts: 0, bestRarity: 0, goldEarned: 0 };
    this.warned = false;
  }

  start() {
    this.reset();
    this.state = 'playing';
    this.startRound(1);
  }

  // ---------- 상태 질의 ----------
  unitCount() { return this.cells.reduce((s, c) => s + (c ? c.count : 0), 0); }
  emptyCells() { return this.cells.map((c, i) => c ? -1 : i).filter(i => i >= 0); }
  isBossRound(r = this.round) { return r % RULES.bossEvery === 0; }
  upgradeCost(rarity) { return Math.round(RARITY_INFO[rarity].upCost * Math.pow(UPGRADE.costGrowth, this.upgrades[rarity])); }
  dmgMult(rarity) { return 1 + UPGRADE.perLevel * this.upgrades[rarity]; }
  unitDps(cell) {
    const u = UNITS[cell.id];
    const critAvg = u.crit ? 1 + u.crit * (RULES.critMult - 1) : 1;
    return u.dmg * u.rate * cell.count * this.dmgMult(u.rarity) * critAvg;
  }
  recipeStatus(recipe) {
    return recipe.parts.map(p => ({ id: p, have: this.cells.some(c => c && c.id === p) }));
  }

  // ---------- 플레이어 행동 ----------
  placeUnit(id, preferCell = -1) {
    if (this.unitCount() >= RULES.unitCap) return { ok: false, msg: `유닛 상한 ${RULES.unitCap}개` };
    let idx = -1;
    if (preferCell >= 0 && !this.cells[preferCell]) idx = preferCell;
    if (idx < 0) {
      const stacks = this.cells.map((c, i) => c && c.id === id && c.count < RULES.stackMax ? i : -1).filter(i => i >= 0);
      if (stacks.length) idx = pick(stacks);
    }
    if (idx < 0) { const empt = this.emptyCells(); if (empt.length) idx = pick(empt); }
    if (idx < 0) return { ok: false, msg: '빈 칸이 없습니다' };
    if (this.cells[idx]) this.cells[idx].count++; else this.cells[idx] = { id, count: 1, cd: 0 };
    const u = UNITS[id];
    this.stats.bestRarity = Math.max(this.stats.bestRarity, RARITY.indexOf(u.rarity));
    const p = cellCenter(idx);
    this.effects.push({ kind: 'ring', x: p.x, y: p.y, color: RARITY_INFO[u.rarity].color, t: 0, dur: 0.5 });
    if (RARITY.indexOf(u.rarity) >= 3) this.effects.push({ kind: 'flash', color: RARITY_INFO[u.rarity].color, t: 0, dur: 0.6 });
    return { ok: true, idx, unit: u };
  }
  summon() {
    if (this.state !== 'playing') return { ok: false, msg: '' };
    if (this.gold < RULES.summonCost) return { ok: false, msg: '골드가 부족합니다' };
    if (this.unitCount() >= RULES.unitCap) return { ok: false, msg: `유닛 상한 ${RULES.unitCap}개` };
    const rarity = weighted(Object.keys(SUMMON_ODDS), k => SUMMON_ODDS[k]);
    const unit = pick(unitsOfRarity(rarity));
    const r = this.placeUnit(unit.id);
    if (!r.ok) return r;
    this.gold -= RULES.summonCost;
    this.stats.summons++;
    this.emit('sfx', 'summon_' + rarity);
    return r;
  }
  roulette() {
    if (this.state !== 'playing') return { ok: false, msg: '' };
    if (this.gold < RULES.rouletteCost) return { ok: false, msg: '골드가 부족합니다' };
    this.gold -= RULES.rouletteCost;
    const prize = weighted(ROULETTE, p => p.weight);
    let res = { ok: true, prize, msg: prize.label };
    if (prize.type === 'gold') { this.gold += prize.value; this.stats.goldEarned += prize.value; this.emit('sfx', 'coin'); }
    else if (prize.type === 'unit') {
      const unit = pick(unitsOfRarity(prize.rarity));
      const r = this.placeUnit(unit.id);
      if (!r.ok) { this.gold += RARITY_INFO[prize.rarity].sell; res.msg = `${unit.name} — 자리가 없어 ${RARITY_INFO[prize.rarity].sell}G로 환급`; }
      else { res.unit = unit; res.idx = r.idx; res.msg = `${RARITY_INFO[prize.rarity].name} ${unit.name} 획득!`; this.emit('sfx', 'summon_' + prize.rarity); }
    } else this.emit('sfx', 'fail');
    return res;
  }
  canMerge(i) {
    const c = this.cells[i];
    return !!(c && c.count >= RULES.stackMax && nextRarity(UNITS[c.id].rarity) && UNITS[c.id].rarity !== 'legend');
  }
  merge(i) {
    if (!this.canMerge(i)) return { ok: false, msg: '같은 유닛 3개가 필요합니다' };
    const c = this.cells[i];
    const nr = nextRarity(UNITS[c.id].rarity);
    const unit = pick(unitsOfRarity(nr));
    this.cells[i] = { id: unit.id, count: 1, cd: 0 };
    this.stats.merges++;
    this.stats.bestRarity = Math.max(this.stats.bestRarity, RARITY.indexOf(nr));
    const p = cellCenter(i);
    this.effects.push({ kind: 'burst', x: p.x, y: p.y, color: RARITY_INFO[nr].color, t: 0, dur: 0.7 });
    this.effects.push({ kind: 'pop', cell: i, t: 0, dur: 0.4 });
    if (RARITY.indexOf(nr) >= 3) this.effects.push({ kind: 'flash', color: RARITY_INFO[nr].color, t: 0, dur: 0.6 });
    this.emit('sfx', 'merge');
    return { ok: true, unit, idx: i };
  }
  sell(i) {
    const c = this.cells[i]; if (!c) return { ok: false };
    const u = UNITS[c.id];
    this.gold += RARITY_INFO[u.rarity].sell;
    c.count--; if (c.count <= 0) this.cells[i] = null;
    this.emit('sfx', 'coin');
    return { ok: true, gold: RARITY_INFO[u.rarity].sell, left: c.count };
  }
  move(a, b) {
    if (a === b) return { ok: false };
    const A = this.cells[a], B = this.cells[b];
    if (!A) return { ok: false };
    if (!B) { this.cells[b] = A; this.cells[a] = null; return { ok: true, kind: 'move' }; }
    if (B.id === A.id && A.count + B.count <= RULES.stackMax) { B.count += A.count; this.cells[a] = null; return { ok: true, kind: 'stack' }; }
    this.cells[a] = B; this.cells[b] = A; return { ok: true, kind: 'swap' };
  }
  craft(ri) {
    const rc = RECIPES[ri];
    const st = this.recipeStatus(rc);
    if (!st.every(s => s.have)) return { ok: false, msg: '재료 유닛이 부족합니다' };
    const freed = [];
    const used = [];
    for (const p of rc.parts) {
      const i = this.cells.findIndex((c, k) => c && c.id === p && !used.includes(k));
      used.push(i);
      this.cells[i].count--; if (this.cells[i].count <= 0) { this.cells[i] = null; freed.push(i); }
    }
    let idx = freed.length ? freed[0] : (this.emptyCells()[0] ?? -1);
    if (idx < 0) { // 롤백
      for (let k = 0; k < rc.parts.length; k++) { const i = used[k]; if (this.cells[i]) this.cells[i].count++; else this.cells[i] = { id: rc.parts[k], count: 1, cd: 0 }; }
      return { ok: false, msg: '빈 칸이 필요합니다' };
    }
    this.cells[idx] = { id: rc.result, count: 1, cd: 0 };
    this.stats.crafts++; this.stats.bestRarity = 4;
    const p = cellCenter(idx);
    this.effects.push({ kind: 'burst', x: p.x, y: p.y, color: RARITY_INFO.mythic.color, t: 0, dur: 1 });
    this.effects.push({ kind: 'flash', color: RARITY_INFO.mythic.color, t: 0, dur: 1 });
    this.emit('sfx', 'mythic');
    return { ok: true, unit: UNITS[rc.result], idx };
  }
  upgrade(rarity) {
    if (this.upgrades[rarity] >= UPGRADE.maxLevel) return { ok: false, msg: '최대 레벨' };
    const cost = this.upgradeCost(rarity);
    if (this.gold < cost) return { ok: false, msg: '골드가 부족합니다' };
    this.gold -= cost; this.upgrades[rarity]++;
    this.emit('sfx', 'upgrade');
    return { ok: true, level: this.upgrades[rarity] };
  }

  // ---------- 라운드 / 스폰 ----------
  startRound(r) {
    this.round = r;
    this.roundTimer = RULES.roundTime;
    this.spawnClock = 0;
    this.spawnQueue = [];
    const bossDef = BOSSES.find(b => b.round === r);
    const n = bossDef ? 8 : WAVE.count(r);
    const mix = WAVE.mix(r);
    const hpScale = Math.pow(WAVE.hpGrowth, r - 1);
    for (let i = 0; i < n; i++) {
      const type = weighted(Object.keys(mix), k => mix[k]);
      this.spawnQueue.push({ type, at: (i / n) * RULES.spawnWindow + rand(0, 0.3), hpScale });
    }
    this.spawnQueue.sort((a, b) => a.at - b.at);
    if (bossDef) {
      this.spawnQueue.unshift({ type: 'boss', at: 0.6, hpScale: 1, bossDef });
      this.emit('banner', { text: `BOSS  ${bossDef.icon} ${bossDef.name}`, kind: 'boss' });
      this.emit('sfx', 'boss');
    } else this.emit('banner', { text: `ROUND ${r}`, kind: 'round' });
  }
  spawn(q) {
    const def = ENEMIES[q.type];
    const e = { id: _id++, type: q.type, sprite: q.type, icon: def.icon, name: def.name, t: 0, laps: 0, speed: def.speed * RULES.enemySpeed,
      size: def.size, gold: def.gold, shield: !!def.shield, boss: !!def.boss, slow: 0, slowUntil: 0, dots: [], flash: 0, dead: false };
    if (q.bossDef) { e.hp = e.maxHp = q.bossDef.hp; e.icon = q.bossDef.icon; e.sprite = q.bossDef.sprite; e.name = q.bossDef.name; e.gold = RULES.bossGoldBase + this.round * 5; this.boss = e; }
    else e.hp = e.maxHp = Math.round(def.hp * q.hpScale);
    this.enemies.push(e);
  }

  // ---------- 전투 ----------
  progress(e) { return e.laps * PERIM + e.t; }
  enemyPos(e) { return pathPos(e.t); }
  hit(e, dmg, src) {
    if (e.dead) return;
    if (e.shield) dmg = Math.max(1, dmg * (1 - RULES.shieldReduce));
    e.hp -= dmg; e.flash = 0.08;
    if (e.hp <= 0) this.kill(e);
  }
  kill(e) {
    if (e.dead) return;
    e.dead = true;
    this.stats.kills++;
    this.gold += e.gold; this.stats.goldEarned += e.gold;
    const p = this.enemyPos(e);
    this.effects.push({ kind: 'death', x: p.x, y: p.y, color: e.boss ? '#ffd166' : '#cfd6ff', t: 0, dur: e.boss ? 1.2 : 0.45, big: e.boss });
    if (e.gold >= 2) this.effects.push({ kind: 'text', x: p.x, y: p.y - 0.2, text: `+${e.gold}G`, color: '#ffd166', t: 0, dur: 0.9 });
    if (e.boss) {
      this.boss = null;
      this.emit('sfx', 'bosskill');
      this.emit('banner', { text: `보스 처치! +${e.gold}G`, kind: 'win' });
      const chest = this.chest();
      if (chest) this.emit('toast', chest);
      if (this.round >= RULES.maxRound) this.end('won');
    }
  }
  chest() {
    // 보스 보상 상자: 영웅 70% / 전설 30%
    const rarity = Math.random() < 0.3 ? 'legend' : 'epic';
    const unit = pick(unitsOfRarity(rarity));
    const r = this.placeUnit(unit.id);
    if (!r.ok) { this.gold += RARITY_INFO[rarity].sell; return `보상 상자: ${unit.name} (자리 없음 → ${RARITY_INFO[rarity].sell}G 환급)`; }
    return `보상 상자: ${RARITY_INFO[rarity].name} ${unit.name} 획득!`;
  }
  applyAttack(cell, idx, target) {
    const u = UNITS[cell.id];
    const base = u.dmg * cell.count * this.dmgMult(u.rarity);
    const crit = u.crit && Math.random() < u.crit;
    const dmg = base * (crit ? RULES.critMult : 1);
    const tp = this.enemyPos(target);
    const alive = this.enemies.filter(e => !e.dead);
    const applyStatus = (e) => {
      if (u.slow) { e.slow = Math.max(e.slow, u.slow); e.slowUntil = Math.max(e.slowUntil, this.time + u.slowDur); }
      if (u.dot) e.dots.push({ dps: u.dot * cell.count * this.dmgMult(u.rarity), until: this.time + u.dotDur, kind: u.type });
    };
    if (u.radius) {
      for (const e of alive) { const p = this.enemyPos(e); if (dist(p.x, p.y, tp.x, tp.y) <= u.radius) { this.hit(e, dmg); applyStatus(e); } }
      this.effects.push({ kind: 'ring', x: tp.x, y: tp.y, color: RARITY_INFO[u.rarity].color, t: 0, dur: 0.3, r: u.radius });
    } else { this.hit(target, dmg); applyStatus(target); }
    if (u.pierce) {
      const others = alive.filter(e => e !== target).map(e => ({ e, d: Math.abs(this.progress(e) - this.progress(target)) })).filter(o => o.d < 1.6).sort((a, b) => a.d - b.d).slice(0, u.pierce - 1);
      for (const o of others) this.hit(o.e, dmg * 0.7);
    }
    if (u.chain) {
      let cur = target; const hitSet = new Set([target]); const pts = [tp];
      for (let k = 1; k < u.chain; k++) {
        const cp = this.enemyPos(cur);
        let best = null, bd = 1.8;
        for (const e of alive) { if (hitSet.has(e)) continue; const p = this.enemyPos(e); const d = dist(p.x, p.y, cp.x, cp.y); if (d < bd) { bd = d; best = e; } }
        if (!best) break;
        hitSet.add(best); this.hit(best, dmg * 0.6); applyStatus(best); cur = best; pts.push(this.enemyPos(best));
      }
      this.effects.push({ kind: 'chain', pts, color: '#ffe66d', t: 0, dur: 0.2 });
    }
    if (crit) this.effects.push({ kind: 'text', x: tp.x, y: tp.y - 0.3, text: 'CRIT', color: '#ff5c7a', t: 0, dur: 0.6 });
  }

  // ---------- 메인 업데이트 ----------
  update(rawDt) {
    if (this.state !== 'playing') return;
    const dt = Math.min(rawDt, 0.05) * this.speed;
    this.time += dt;
    // 스폰
    this.spawnClock += dt;
    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.spawnClock) this.spawn(this.spawnQueue.shift());
    // 적 이동 / DoT
    for (const e of this.enemies) {
      if (e.dead) continue;
      const slow = this.time < e.slowUntil ? e.slow : 0;
      e.t += e.speed * (1 - slow) * dt;
      if (e.t >= PERIM) { e.t -= PERIM; e.laps++; }
      if (e.flash > 0) e.flash -= dt;
      if (e.dots.length) {
        let total = 0; e.dots = e.dots.filter(d => d.until > this.time);
        for (const d of e.dots) total += d.dps;
        if (total) this.hit(e, total * dt);
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    // 유닛 공격
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i]; if (!c) continue;
      const u = UNITS[c.id];
      c.cd -= dt; if (c.cd > 0) continue;
      const p = cellCenter(i);
      let best = null, bp = -1;
      for (const e of this.enemies) {
        const ep = this.enemyPos(e);
        if (dist(ep.x, ep.y, p.x, p.y) <= u.range) { const pr = this.progress(e) + (e.boss ? 1e6 : 0); if (pr > bp) { bp = pr; best = e; } }
      }
      if (!best) { c.cd = 0.05; continue; }
      c.cd = 1 / u.rate;
      const ep = this.enemyPos(best);
      this.projectiles.push({ x: p.x, y: p.y, target: best, cell: c, idx: i, speed: 11, color: RARITY_INFO[u.rarity].color, type: u.type, tx: ep.x, ty: ep.y });
      this.emit('sfx', 'shot');
    }
    // 투사체
    for (const pr of this.projectiles) {
      if (!pr.target.dead) { const tp = this.enemyPos(pr.target); pr.tx = tp.x; pr.ty = tp.y; }
      const d = dist(pr.x, pr.y, pr.tx, pr.ty);
      const step = pr.speed * dt;
      if (d <= step) {
        pr.done = true;
        if (!pr.target.dead) this.applyAttack(pr.cell, pr.idx, pr.target);
        else { // 대상이 죽었으면 근처 광역만 적용
          const u = UNITS[pr.cell.id];
          if (u.radius) { const near = this.enemies.find(e => dist(this.enemyPos(e).x, this.enemyPos(e).y, pr.tx, pr.ty) <= u.radius); if (near) this.applyAttack(pr.cell, pr.idx, near); }
        }
      } else { pr.x += (pr.tx - pr.x) / d * step; pr.y += (pr.ty - pr.y) / d * step; }
    }
    this.projectiles = this.projectiles.filter(p => !p.done);
    // 이펙트
    for (const f of this.effects) f.t += dt;
    this.effects = this.effects.filter(f => f.t < f.dur);
    // 패배 조건
    if (this.enemies.length >= RULES.enemyLimit) return this.end('lost', `몬스터가 ${RULES.enemyLimit}마리를 넘었습니다`);
    if (!this.warned && this.enemies.length >= RULES.enemyLimit * 0.85) { this.warned = true; this.emit('toast', '⚠ 몬스터가 너무 많습니다!'); this.emit('sfx', 'warn'); }
    if (this.enemies.length < RULES.enemyLimit * 0.7) this.warned = false;
    // 라운드 타이머
    this.roundTimer -= dt;
    if (this.roundTimer <= 0) {
      if (this.boss && !this.boss.dead) return this.end('lost', `${this.boss.name}을(를) 제한 시간 안에 처치하지 못했습니다`);
      const bonus = RULES.roundBonusBase + this.round;
      this.gold += bonus; this.stats.goldEarned += bonus;
      this.emit('toast', `라운드 ${this.round} 클리어 +${bonus}G`);
      if (this.round >= RULES.maxRound) return this.end('won');
      this.startRound(this.round + 1);
    }
  }
  end(result, reason = '') {
    if (this.state !== 'playing') return;
    this.state = result;
    this.emit('end', { result, reason });
  }
}
