// 매치: 보드(Game) 1~2개를 같은 라운드 시계로 묶어 진행한다. 라운드 타이머·몬스터 한도·승패는 여기서만 판정.
//  - 1인: 보드 1개. 2인 협동(한 기기): 보드 2개, 몬스터 수는 합산, 둘 다 보스를 잡아야 다음 라운드.
import { RULES } from './config.js';
import { Game } from './game.js';

export class Match {
  constructor(players = 1, hooks = {}) {
    this.hooks = hooks;
    this.players = players;
    this.games = Array.from({ length: players }, (_, p) => new Game({
      sfx: hooks.sfx,
      toast: (m) => hooks.toast && hooks.toast(p, m),
      banner: (b) => hooks.banner && hooks.banner(p, b),
    }, p));
    this.reset();
  }
  emit(ev, data) { if (this.hooks[ev]) this.hooks[ev](data); }
  reset() {
    this.state = 'title'; this.round = 0; this.roundTimer = 0; this.speed = 1; this.time = 0;
    this.warned = false; this.result = null;
    for (const g of this.games) { g.reset(); g.bossHpMult = this.players > 1 ? RULES.coopBossHpMult : 1; }
  }
  start() { this.reset(); this.setState('playing'); this.startRound(1); }
  setState(s) { this.state = s; for (const g of this.games) g.state = s; }
  pause() { if (this.state === 'playing') this.setState('paused'); }
  resume() { if (this.state === 'paused') this.setState('playing'); }

  enemyLimit() { return Math.round(RULES.enemyLimit * (this.players > 1 ? RULES.coopLimitMult : 1)); }
  totalEnemies() { return this.games.reduce((s, g) => s + g.enemies.length, 0); }
  isBossRound(r = this.round) { return r > 0 && r % RULES.bossEvery === 0; }
  startRound(r) {
    this.round = r; this.roundTimer = RULES.roundTime;
    for (const g of this.games) { g.round = r; g.roundTimer = this.roundTimer; g.startRound(r); }
  }
  // 협동: 골드 지원
  sendGold(from, to, amt = RULES.giftGold) {
    const a = this.games[from], b = this.games[to];
    if (!a || !b || a === b) return { ok: false };
    if (a.gold < amt) return { ok: false, msg: '골드가 부족합니다' };
    a.gold -= amt; b.gold += amt; b.stats.goldEarned += amt;
    this.emit('sfx', 'coin');
    return { ok: true, amt };
  }

  update(rawDt) {
    if (this.state !== 'playing') return;
    const dt = Math.min(rawDt, 0.05) * this.speed;
    this.time += dt;
    for (const g of this.games) { g.roundTimer = this.roundTimer; g.tick(dt); }
    // 패배: 몬스터 합산 한도
    const n = this.totalEnemies(), lim = this.enemyLimit();
    if (n >= lim) return this.end('lost', `몬스터가 ${lim}마리를 넘었습니다`);
    if (!this.warned && n >= lim * 0.85) { this.warned = true; for (const g of this.games) g.emit('toast', '⚠ 몬스터가 너무 많습니다!'); this.emit('sfx', 'warn'); }
    if (n < lim * 0.7) this.warned = false;
    // 승리: 최종 라운드 보스를 모든 보드에서 처치
    if (this.round >= RULES.maxRound && this.games.every(g => g.bossDown)) return this.end('won');
    // 라운드 타이머
    this.roundTimer -= dt;
    if (this.roundTimer <= 0) {
      const stuck = this.games.find(g => g.boss && !g.boss.dead);
      if (stuck) return this.end('lost', `${stuck.boss.name}을(를) 제한 시간 안에 처치하지 못했습니다${this.players > 1 ? ` (P${stuck.index + 1} 보드)` : ''}`);
      const bonus = RULES.roundBonusBase + this.round;
      for (const g of this.games) { g.gold += bonus; g.stats.goldEarned += bonus; g.emit('toast', `라운드 ${this.round} 클리어 +${bonus}G`); }
      if (this.round >= RULES.maxRound) return this.end('won');
      this.startRound(this.round + 1);
    }
  }
  end(result, reason = '') {
    if (this.state !== 'playing') return;
    this.setState(result);
    this.result = { result, reason };
    this.emit('end', { result, reason });
  }
}
