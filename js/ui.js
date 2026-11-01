import { RULES, RARITY, RARITY_INFO, UNITS, RECIPES, UPGRADE, SPEEDS } from './config.js';
import { fmt, pad2 } from './utils.js';
import { spriteImg } from './sprites.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(game, renderer, audio) {
    this.g = game; this.r = renderer; this.a = audio;
    this.selected = -1;
    this.bind();
    this.renderUpgrades(); this.renderRecipes();
    this.showBest();
    $('title-lineup').innerHTML = ['archer','mage','pyro','dragonknight','phoenix','chaoslord'].map(k => spriteImg(k, 44)).join('');
  }
  bind() {
    $('btn-start').onclick = () => this.startGame();
    $('btn-retry').onclick = () => this.startGame();
    $('btn-end-title').onclick = () => this.toTitle();
    $('btn-pause-title').onclick = () => this.toTitle();
    $('btn-pause').onclick = () => this.togglePause();
    $('btn-resume').onclick = () => this.togglePause();
    $('btn-mute').onclick = () => this.toggleMute();
    $('btn-speed').onclick = () => this.cycleSpeed();
    $('btn-summon').onclick = () => this.summon();
    $('btn-roulette').onclick = () => this.roulette();
    $('uc-close').onclick = () => this.select(-1);
    $('uc-merge').onclick = () => this.merge();
    $('uc-sell').onclick = () => this.sell();
    document.querySelectorAll('.tab').forEach(t => t.onclick = () => this.showTab(t.dataset.tab));
    $('btn-mute').textContent = this.a.muted ? '🔇' : '♪';
    window.addEventListener('keydown', (e) => this.onKey(e));
  }
  onKey(e) {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (this.g.state === 'title') { if (k === 'enter' || k === ' ') this.startGame(); return; }
    if (k === 'p' || (k === 'escape' && this.g.state === 'paused')) return this.togglePause();
    if (k === 'm') return this.toggleMute();
    if (this.g.state !== 'playing') return;
    if (k === 'q') this.summon();
    else if (k === 'r') this.roulette();
    else if (k === 'escape') this.select(-1);
    else if (k === 's' && this.selected >= 0) this.sell();
    else if (k === 'e' && this.selected >= 0) this.merge();
    else if (['1', '2', '3'].includes(k)) this.setSpeed(Number(k));
  }
  startGame() {
    this.a.ensure();
    this.g.start();
    this.select(-1);
    this.setSpeed(1);
    $('screen-title').classList.add('hidden'); $('screen-end').classList.add('hidden'); $('screen-pause').classList.add('hidden');
    $('hud').classList.remove('hidden'); $('controls').classList.remove('hidden');
    this.renderUpgrades(); this.renderRecipes();
  }
  toTitle() {
    this.g.reset(); this.select(-1);
    $('screen-end').classList.add('hidden'); $('screen-pause').classList.add('hidden');
    $('hud').classList.add('hidden'); $('controls').classList.add('hidden');
    $('screen-title').classList.remove('hidden');
    this.showBest();
  }
  togglePause() {
    if (this.g.state === 'playing') { this.g.state = 'paused'; $('screen-pause').classList.remove('hidden'); }
    else if (this.g.state === 'paused') { this.g.state = 'playing'; $('screen-pause').classList.add('hidden'); }
  }
  toggleMute() { const m = this.a.toggle(); $('btn-mute').textContent = m ? '🔇' : '♪'; }
  cycleSpeed() { const i = SPEEDS.indexOf(this.g.speed); this.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); }
  setSpeed(s) { this.g.speed = s; $('btn-speed').textContent = s + '×'; }

  // ---- 행동 ----
  summon() {
    const r = this.g.summon();
    if (!r.ok) { if (r.msg) { this.toast(r.msg, 'bad'); this.a.play('fail'); } return; }
    const info = RARITY_INFO[r.unit.rarity];
    this.toast(`${r.unit.icon} ${info.name} ${r.unit.name}`, RARITY.indexOf(r.unit.rarity) >= 2 ? 'good' : '');
    this.refreshCard();
  }
  roulette() {
    const r = this.g.roulette();
    if (!r.ok) { if (r.msg) { this.toast(r.msg, 'bad'); this.a.play('fail'); } return; }
    this.toast('🎰 ' + r.msg, r.prize.type === 'none' ? 'bad' : 'good');
    this.refreshCard();
  }
  merge() {
    if (this.selected < 0) return;
    const r = this.g.merge(this.selected);
    if (!r.ok) return this.toast(r.msg, 'bad');
    this.toast(`✨ 합성 → ${RARITY_INFO[r.unit.rarity].name} ${r.unit.name}!`, 'good');
    this.refreshCard(); this.renderRecipes();
  }
  sell() {
    if (this.selected < 0) return;
    const r = this.g.sell(this.selected);
    if (!r.ok) return;
    this.toast(`판매 +${r.gold}G`);
    if (r.left <= 0) this.select(-1); else this.refreshCard();
    this.renderRecipes();
  }
  craft(i) {
    const r = this.g.craft(i);
    if (!r.ok) return this.toast(r.msg, 'bad');
    this.toast(`🌟 신화 ${r.unit.name} 탄생!`, 'good');
    this.select(r.idx); this.renderRecipes();
  }
  upgrade(rarity) {
    const r = this.g.upgrade(rarity);
    if (!r.ok) { this.toast(r.msg, 'bad'); return; }
    this.toast(`${RARITY_INFO[rarity].name} 강화 Lv.${r.level}`, 'good');
    this.renderUpgrades(); this.refreshCard();
  }
  // 보드 탭
  tapCell(i) {
    if (this.g.state !== 'playing') return;
    if (i < 0) return this.select(-1);
    if (this.selected >= 0 && this.selected !== i && this.g.cells[this.selected]) {
      const r = this.g.move(this.selected, i);
      if (r.ok) { this.a.play('coin'); this.select(r.kind === 'swap' ? i : (r.kind === 'stack' ? i : i)); return; }
    }
    if (this.g.cells[i]) this.select(i); else this.select(-1);
  }
  select(i) {
    this.selected = i; this.r.selected = i;
    this.refreshCard();
  }
  refreshCard() {
    const c = this.selected >= 0 ? this.g.cells[this.selected] : null;
    if (!c) { $('unit-card').classList.add('hidden'); if (this.selected >= 0) { this.selected = -1; this.r.selected = -1; } return; }
    const u = UNITS[c.id], info = RARITY_INFO[u.rarity];
    $('unit-card').classList.remove('hidden');
    $('uc-icon').innerHTML = spriteImg(u.id, 40); $('uc-icon').style.borderColor = info.color;
    $('uc-name').textContent = u.name + (c.count > 1 ? ` ×${c.count}` : '');
    $('uc-rarity').textContent = info.name; $('uc-rarity').className = 'badge r-' + u.rarity;
    $('uc-desc').textContent = u.desc;
    const mult = this.g.dmgMult(u.rarity) * c.count;
    const typeName = { single: '단일', splash: '광역', chain: '연쇄', pierce: '관통', slow: '둔화', poison: '중독', burn: '화상' }[u.type];
    $('uc-stats').innerHTML = `<div>공격력<b>${fmt(u.dmg * mult)}</b></div><div>공속<b>${u.rate}/s</b></div><div>사거리<b>${u.range}</b></div><div>DPS<b>${fmt(this.g.unitDps(c))}</b></div>`
      + `<div>타입<b style="font-size:12px">${typeName}</b></div>${u.crit ? `<div>치명타<b>${Math.round(u.crit * 100)}%</b></div>` : ''}${u.radius ? `<div>범위<b>${u.radius}</b></div>` : ''}<div>판매가<b>${info.sell}G</b></div>`;
    const canMerge = this.g.canMerge(this.selected);
    $('uc-merge').disabled = !canMerge;
    $('uc-merge').textContent = u.rarity === 'legend' || u.rarity === 'mythic' ? '합성 불가(레시피)' : canMerge ? '합성 (E)' : `합성 ${c.count}/3`;
  }
  showTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-body').forEach(b => b.classList.toggle('hidden', b.id !== 'tab-' + name));
  }
  renderUpgrades() {
    const g = this.g;
    $('tab-upgrade').innerHTML = RARITY.map(r => {
      const lv = g.upgrades[r], max = lv >= UPGRADE.maxLevel, cost = g.upgradeCost(r);
      return `<div class="up-row"><span class="badge r-${r}">${RARITY_INFO[r].name}</span><span>공격력 +${Math.round(lv * UPGRADE.perLevel * 100)}%</span><span class="lvl">Lv.${lv}/${UPGRADE.maxLevel}</span><button class="btn" data-up="${r}" ${max ? 'disabled' : ''}>${max ? 'MAX' : cost + 'G'}</button></div>`;
    }).join('');
    $('tab-upgrade').querySelectorAll('[data-up]').forEach(b => b.onclick = () => this.upgrade(b.dataset.up));
    this.refreshUpgradeButtons();
  }
  refreshUpgradeButtons() {
    $('tab-upgrade').querySelectorAll('[data-up]').forEach(b => { const r = b.dataset.up; if (this.g.upgrades[r] < UPGRADE.maxLevel) b.disabled = this.g.gold < this.g.upgradeCost(r); });
  }
  renderRecipes() {
    $('tab-recipe').innerHTML = RECIPES.map((rc, i) => {
      const st = this.g.recipeStatus(rc), ok = st.every(s => s.have), res = UNITS[rc.result];
      return `<div class="recipe"><span class="res">${spriteImg(res.id, 36)}</span><div><b>${res.name}</b><div class="parts">${st.map(s => `<span class="part ${s.have ? 'have' : ''}">${spriteImg(s.id, 16)} ${UNITS[s.id].name}</span>`).join('')}</div></div><button class="btn ${ok ? 'primary' : ''}" data-craft="${i}" ${ok ? '' : 'disabled'}>조합</button></div>`;
    }).join('');
    $('tab-recipe').querySelectorAll('[data-craft]').forEach(b => b.onclick = () => this.craft(Number(b.dataset.craft)));
  }
  // ---- 프레임마다 ----
  tick() {
    const g = this.g;
    $('hud-gold').textContent = fmt(g.gold);
    $('hud-round').textContent = 'R.' + g.round + (g.isBossRound() ? ' 👹' : '');
    const t = Math.max(0, Math.ceil(g.roundTimer));
    $('hud-timer').textContent = '00:' + pad2(t);
    $('hud-units').textContent = `${g.unitCount()}/${RULES.unitCap}`;
    const n = g.enemies.length, pct = Math.min(100, n / RULES.enemyLimit * 100);
    $('enemy-fill').style.width = pct + '%'; $('enemy-text').textContent = `👾 ${n} / ${RULES.enemyLimit}`;
    const danger = n >= RULES.enemyLimit * 0.85;
    $('enemy-bar').classList.toggle('danger', danger); $('board-wrap').classList.toggle('danger', danger);
    const boss = g.boss && !g.boss.dead ? g.boss : null;
    $('boss-bar').classList.toggle('hidden', !boss);
    if (boss) { $('boss-fill').style.width = (boss.hp / boss.maxHp * 100) + '%'; $('boss-text').textContent = `${boss.icon} ${boss.name}  ${fmt(boss.hp)} / ${fmt(boss.maxHp)}`; }
    $('btn-summon').disabled = g.gold < RULES.summonCost || g.unitCount() >= RULES.unitCap;
    $('btn-roulette').disabled = g.gold < RULES.rouletteCost;
    this.refreshUpgradeButtons();
    if (this._lastSig !== this.cellSig()) { this._lastSig = this.cellSig(); this.renderRecipes(); this.refreshCard(); }
  }
  cellSig() { return this.g.cells.map(c => c ? c.id + c.count : '-').join(','); }
  // ---- 이벤트 ----
  toast(msg, kind = '') {
    const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg;
    const area = $('toast-area'); area.appendChild(el); while (area.children.length > 3) area.removeChild(area.firstChild);
    setTimeout(() => el.remove(), 1600);
  }
  banner({ text, kind }) {
    const b = $('banner'); b.className = kind; b.textContent = text; b.classList.remove('hidden');
    void b.offsetWidth; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(this._bt); this._bt = setTimeout(() => b.classList.add('hidden'), 950);
  }
  end({ result, reason }) {
    const g = this.g, won = result === 'won';
    this.a.play(won ? 'win' : 'lose');
    this.select(-1);
    $('end-title').textContent = won ? '🏆 승리!' : '💀 패배';
    $('end-reason').textContent = won ? '마왕을 쓰러뜨리고 40라운드를 지켜냈습니다!' : reason;
    const best = this.saveBest(g.round, won);
    $('end-stats').innerHTML = `<div>도달 라운드<b>${g.round}${won ? ' ✔' : ''}</b></div><div>처치<b>${g.stats.kills}</b></div><div>소환 / 합성<b>${g.stats.summons} / ${g.stats.merges}</b></div><div>최고 등급<b style="color:${RARITY_INFO[RARITY[g.stats.bestRarity]].color}">${RARITY_INFO[RARITY[g.stats.bestRarity]].name}</b></div><div>획득 골드<b>${fmt(g.stats.goldEarned)}</b></div><div>최고 기록<b>R.${best.round}${best.won ? ' 🏆' : ''}</b></div>`;
    setTimeout(() => $('screen-end').classList.remove('hidden'), 600);
  }
  saveBest(round, won) {
    let best = { round: 0, won: false };
    try { best = JSON.parse(localStorage.getItem('lmd-best') || 'null') || best; } catch (e) {}
    if (round > best.round || (won && !best.won)) best = { round: Math.max(round, best.round), won: best.won || won };
    try { localStorage.setItem('lmd-best', JSON.stringify(best)); } catch (e) {}
    return best;
  }
  showBest() {
    let best = null; try { best = JSON.parse(localStorage.getItem('lmd-best') || 'null'); } catch (e) {}
    $('best-record').textContent = best && best.round ? `최고 기록: 라운드 ${best.round}${best.won ? ' 🏆 클리어' : ''}` : '';
  }
}
