import { RULES, RARITY, RARITY_INFO, UNITS, RECIPES, UPGRADE, SPEEDS, ELEMENTS, ELEMENT_ORDER, ELEMENT_SKILLS } from './config.js';
import { Match } from './match.js';
import { Renderer } from './render.js';
import { bindInput } from './input.js';
import { fmt, pad2 } from './utils.js';
import { spriteImg } from './sprites.js';

const $ = (id) => document.getElementById(id);
const elemBadge = (el) => el ? `<span class="badge elem" style="background:${ELEMENTS[el].color}">${ELEMENTS[el].name}</span>` : '';

// 화면 전체(HUD·보드 1~2개·카드·패널)를 관리한다. 보드마다 Renderer 1개, 게임 상태는 Match 1개.
export class UI {
  constructor(audio) {
    this.a = audio;
    this.players = 1;
    this.focus = 0;            // 강화/레시피 패널이 가리키는 플레이어
    this.selP = 0; this.selected = -1;
    this.pels = [...document.querySelectorAll('.player')].map((el, p) => ({
      p, el, canvas: el.querySelector('.board'), wrap: el.querySelector('.board-wrap'), banner: el.querySelector('.banner'), toasts: el.querySelector('.toast-area'),
      gold: el.querySelector('.p-gold'), units: el.querySelector('.p-units'), summon: el.querySelector('.p-summon'), roulette: el.querySelector('.p-roulette'), gift: el.querySelector('.p-gift'),
    }));
    this.renderers = this.pels.map(pe => new Renderer(pe.canvas));
    this.match = this.makeMatch(1);
    this.bind();
    this.renderUpgrades(); this.renderRecipes(); this.renderElements();
    this.showBest();
    $('title-lineup').innerHTML = ['archer', 'frost', 'pyro', 'dragonknight', 'phoenix', 'archangel'].map(k => spriteImg(k, 48)).join('');
    $('title-elements').innerHTML = ELEMENT_ORDER.map(e => elemBadge(e)).join('');
  }
  makeMatch(n) {
    return new Match(n, {
      sfx: (s) => this.a.play(s),
      toast: (p, m) => this.toast(m, 'good', p),
      banner: (p, b) => this.banner(p, b),
      end: (r) => this.end(r),
    });
  }
  get g() { return this.match.games[this.focus]; }
  game(p) { return this.match.games[p]; }
  get state() { return this.match.state; }

  bind() {
    $('btn-start').onclick = () => this.startGame(1);
    $('btn-start-coop').onclick = () => this.startGame(2);
    $('btn-retry').onclick = () => this.startGame(this.players);
    $('btn-end-title').onclick = () => this.toTitle();
    $('btn-pause-title').onclick = () => this.toTitle();
    $('btn-pause').onclick = () => this.togglePause();
    $('btn-resume').onclick = () => this.togglePause();
    $('btn-mute').onclick = () => this.toggleMute();
    $('btn-speed').onclick = () => this.cycleSpeed();
    $('uc-close').onclick = () => this.select(this.selP, -1);
    $('uc-merge').onclick = () => this.merge();
    $('uc-sell').onclick = () => this.sell();
    for (const pe of this.pels) {
      pe.summon.onclick = () => this.summon(pe.p);
      pe.roulette.onclick = () => this.roulette(pe.p);
      pe.gift.onclick = () => this.gift(pe.p);
      bindInput(pe.canvas, this.renderers[pe.p], this, pe.p);
    }
    document.querySelectorAll('.tab').forEach(t => t.onclick = () => this.showTab(t.dataset.tab));
    document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => this.setFocus(Number(b.dataset.ps)));
    $('btn-mute').textContent = this.a.muted ? '🔇' : '♪';
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('resize', () => this.resize());
  }
  resize() { for (const r of this.renderers) r.resize(); }
  onKey(e) {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (this.state === 'title') { if (k === 'enter' || k === ' ') this.startGame(1); return; }
    if (k === 'p' || (k === 'escape' && this.state === 'paused')) return this.togglePause();
    if (k === 'm') return this.toggleMute();
    if (this.state !== 'playing') return;
    if (k === 'q') this.summon(0);
    else if (k === 'r') this.roulette(0);
    else if (k === 'u' && this.players > 1) this.summon(1);
    else if (k === 'i' && this.players > 1) this.roulette(1);
    else if (k === 'escape') this.select(this.selP, -1);
    else if (k === 's' && this.selected >= 0) this.sell();
    else if (k === 'e' && this.selected >= 0) this.merge();
    else if (['1', '2', '3'].includes(k)) this.setSpeed(Number(k));
  }
  // ---- 화면 전환 ----
  startGame(n) {
    this.a.ensure();
    this.players = n;
    this.match = this.makeMatch(n);
    $('app').classList.toggle('coop', n > 1);
    this.pels[1].el.classList.toggle('hidden', n < 2);
    this.setFocus(0); this.select(0, -1);
    this.match.start();
    this.setSpeed(1);
    $('screen-title').classList.add('hidden'); $('screen-end').classList.add('hidden'); $('screen-pause').classList.add('hidden');
    $('hud').classList.remove('hidden'); $('controls').classList.remove('hidden');
    this.renderUpgrades(); this.renderRecipes();
    requestAnimationFrame(() => this.resize());
  }
  toTitle() {
    this.match.reset(); this.select(this.selP, -1);
    $('screen-end').classList.add('hidden'); $('screen-pause').classList.add('hidden');
    $('hud').classList.add('hidden'); $('controls').classList.add('hidden');
    $('screen-title').classList.remove('hidden');
    this.showBest();
  }
  togglePause() {
    if (this.state === 'playing') { this.match.pause(); $('screen-pause').classList.remove('hidden'); }
    else if (this.state === 'paused') { this.match.resume(); $('screen-pause').classList.add('hidden'); }
  }
  toggleMute() { const m = this.a.toggle(); $('btn-mute').textContent = m ? '🔇' : '♪'; }
  cycleSpeed() { const i = SPEEDS.indexOf(this.match.speed); this.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); }
  setSpeed(s) { this.match.speed = s; $('btn-speed').textContent = s + '×'; }
  setFocus(p) {
    this.focus = p;
    document.querySelectorAll('.pbtn').forEach(b => b.classList.toggle('active', Number(b.dataset.ps) === p));
    this.renderUpgrades(); this.renderRecipes();
  }

  // ---- 행동 ----
  summon(p) {
    const g = this.game(p); if (!g) return;
    const r = g.summon();
    if (!r.ok) { if (r.msg) { this.toast(r.msg, 'bad', p); this.a.play('fail'); } return; }
    const info = RARITY_INFO[r.unit.rarity];
    this.toast(`${info.name} ${r.unit.name} (${ELEMENTS[r.unit.element].name})`, RARITY.indexOf(r.unit.rarity) >= 2 ? 'good' : '', p);
    this.setFocus(p); this.refreshCard();
  }
  roulette(p) {
    const g = this.game(p); if (!g) return;
    const r = g.roulette();
    if (!r.ok) { if (r.msg) { this.toast(r.msg, 'bad', p); this.a.play('fail'); } return; }
    this.toast('🎰 ' + r.msg, r.prize.type === 'none' ? 'bad' : 'good', p);
    this.setFocus(p); this.refreshCard();
  }
  gift(p) {
    const to = 1 - p;
    const r = this.match.sendGold(p, to);
    if (!r.ok) { if (r.msg) { this.toast(r.msg, 'bad', p); this.a.play('fail'); } return; }
    this.toast(`P${to + 1}에게 ${r.amt}G 전달`, '', p);
    this.toast(`P${p + 1}에게서 ${r.amt}G 받음!`, 'good', to);
  }
  merge() {
    if (this.selected < 0) return;
    const g = this.game(this.selP);
    const r = g.merge(this.selected);
    if (!r.ok) return this.toast(r.msg, 'bad', this.selP);
    this.toast(`✨ 합성 → ${RARITY_INFO[r.unit.rarity].name} ${r.unit.name}!`, 'good', this.selP);
    this.refreshCard(); this.renderRecipes();
  }
  sell() {
    if (this.selected < 0) return;
    const g = this.game(this.selP);
    const r = g.sell(this.selected);
    if (!r.ok) return;
    this.toast(`판매 +${r.gold}G`, '', this.selP);
    if (r.left <= 0) this.select(this.selP, -1); else this.refreshCard();
    this.renderRecipes();
  }
  craft(i) {
    const g = this.g, p = this.focus;
    const r = g.craft(i);
    if (!r.ok) return this.toast(r.msg, 'bad', p);
    this.toast(`🌟 신화 ${r.unit.name} 탄생!`, 'good', p);
    this.select(p, r.idx); this.renderRecipes();
  }
  upgrade(rarity) {
    const r = this.g.upgrade(rarity);
    if (!r.ok) { this.toast(r.msg, 'bad', this.focus); return; }
    this.toast(`${RARITY_INFO[rarity].name} 강화 Lv.${r.level}`, 'good', this.focus);
    this.renderUpgrades(); this.refreshCard();
  }
  // 보드 탭 (p = 보드 번호)
  tapCell(p, i) {
    if (this.state !== 'playing') return;
    const g = this.game(p);
    if (i < 0) return this.select(p, -1);
    if (this.selP === p && this.selected >= 0 && this.selected !== i && g.cells[this.selected]) {
      const r = g.move(this.selected, i);
      if (r.ok) { this.a.play('coin'); this.select(p, i); return; }
    }
    if (g.cells[i]) this.select(p, i); else this.select(p, -1);
  }
  select(p, i) {
    this.selP = p; this.selected = i;
    this.renderers.forEach((r, k) => r.selected = k === p ? i : -1);
    if (i >= 0) this.setFocus(p);
    this.refreshCard();
  }
  refreshCard() {
    const g = this.game(this.selP);
    const c = g && this.selected >= 0 ? g.cells[this.selected] : null;
    if (!c) { $('unit-card').classList.add('hidden'); if (this.selected >= 0) { this.selected = -1; this.renderers.forEach(r => r.selected = -1); } return; }
    const u = UNITS[c.id], info = RARITY_INFO[u.rarity], el = ELEMENTS[u.element];
    $('unit-card').classList.remove('hidden');
    $('uc-owner').textContent = `P${this.selP + 1}`; $('uc-owner').className = `plabel coop-only p${this.selP + 1}`;
    $('uc-icon').innerHTML = spriteImg(u.id, 44); $('uc-icon').style.borderColor = info.color;
    $('uc-name').textContent = u.name + (c.count > 1 ? ` ×${c.count}` : '');
    $('uc-rarity').textContent = info.name; $('uc-rarity').className = 'badge r-' + u.rarity;
    $('uc-elem').textContent = el.name; $('uc-elem').style.background = el.color;
    const sk = ELEMENT_SKILLS[u.element];
    $('uc-desc').innerHTML = `${u.desc} · ${ELEMENTS[el.beats].name} 속성에 강함<br><span style="color:${el.color}">✦ ${sk.name} ${Math.round(sk.chance * 100)}%</span> ${sk.desc}`;
    const mult = g.dmgMult(u.rarity) * c.count;
    const typeName = { single: '단일', splash: '광역', chain: '연쇄', pierce: '관통', slow: '둔화', poison: '중독', burn: '화상' }[u.type];
    $('uc-stats').innerHTML = `<div>공격력<b>${fmt(u.dmg * mult)}</b></div><div>공속<b>${u.rate}/s</b></div><div>사거리<b>${u.range}</b></div><div>DPS<b>${fmt(g.unitDps(c))}</b></div>`
      + `<div>타입<b style="font-size:12px">${typeName}</b></div>${u.crit ? `<div>치명타<b>${Math.round(u.crit * 100)}%</b></div>` : ''}${u.radius ? `<div>범위<b>${u.radius}</b></div>` : ''}<div>판매가<b>${info.sell}G</b></div>`;
    const canMerge = g.canMerge(this.selected);
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
    const g = this.g;
    $('tab-upgrade').querySelectorAll('[data-up]').forEach(b => { const r = b.dataset.up; if (g.upgrades[r] < UPGRADE.maxLevel) b.disabled = g.gold < g.upgradeCost(r); });
  }
  renderRecipes() {
    const g = this.g;
    $('tab-recipe').innerHTML = RECIPES.map((rc, i) => {
      const st = g.recipeStatus(rc), ok = st.every(s => s.have), res = UNITS[rc.result];
      return `<div class="recipe"><span class="res">${spriteImg(res.id, 40)}</span><div><b>${res.name}</b> ${elemBadge(res.element)}<div class="parts">${st.map(s => `<span class="part ${s.have ? 'have' : ''}">${spriteImg(s.id, 18)} ${UNITS[s.id].name}</span>`).join('')}</div></div><button class="btn ${ok ? 'primary' : ''}" data-craft="${i}" ${ok ? '' : 'disabled'}>조합</button></div>`;
    }).join('');
    $('tab-recipe').querySelectorAll('[data-craft]').forEach(b => b.onclick = () => this.craft(Number(b.dataset.craft)));
  }
  renderElements() {
    $('tab-element').innerHTML = `<p class="muted small" style="margin:0 0 6px">유리 ×${RULES.elementAdv} · 불리 ×${RULES.elementDis}. 라운드마다 몬스터 속성이 순환하고, 보스는 고유 속성을 가집니다. 속성 스킬은 타격마다 확률로 발동하며 보스에게는 스턴·속박·밀치기가 30%만 적용됩니다.</p>`
      + ELEMENT_ORDER.map(e => {
        const el = ELEMENTS[e], units = Object.values(UNITS).filter(u => u.element === e);
        const sk = ELEMENT_SKILLS[e];
        return `<div class="elem-row-item">${elemBadge(e)}<span class="small"><span class="muted">${ELEMENTS[el.beats].name}에 강함 · </span><b>✦ ${sk.name}</b> <span class="muted">${Math.round(sk.chance * 100)}% — ${sk.desc}</span></span><span class="elem-units">${units.map(u => spriteImg(u.id, 22)).join('')}</span></div>`;
      }).join('');
  }
  // ---- 프레임 ----
  frame(dt) {
    this.match.update(dt);
    for (let p = 0; p < this.players; p++) this.renderers[p].draw(this.match.games[p]);
    if (this.state !== 'title') this.tick();
  }
  tick() {
    const m = this.match;
    $('hud-round').textContent = 'R.' + m.round + (m.isBossRound() ? ' 👹' : '');
    $('hud-timer').textContent = '00:' + pad2(Math.max(0, Math.ceil(m.roundTimer)));
    const re = m.games[0].roundElement;
    if (re && this._lastElem !== re) { this._lastElem = re; $('hud-elem').innerHTML = `몬스터 ${elemBadge(re)}`; }
    const n = m.totalEnemies(), lim = m.enemyLimit(), pct = Math.min(100, n / lim * 100);
    $('enemy-fill').style.width = pct + '%'; $('enemy-text').textContent = `👾 ${n} / ${lim}`;
    const danger = n >= lim * 0.85;
    $('enemy-bar').classList.toggle('danger', danger);
    const bosses = m.games.map(g => g.boss && !g.boss.dead ? g.boss : null);
    const anyBoss = bosses.some(Boolean);
    $('boss-bar').classList.toggle('hidden', !anyBoss);
    if (anyBoss) {
      const ratio = Math.min(...bosses.filter(Boolean).map(b => b.hp / b.maxHp));
      $('boss-fill').style.width = (ratio * 100) + '%';
      $('boss-text').textContent = this.players > 1
        ? bosses.map((b, p) => `P${p + 1} ${b ? fmt(b.hp) : '처치 ✔'}`).join('  ·  ') + `  (${m.games[0].enemies.find(e => e.boss)?.name || bosses.find(Boolean).name})`
        : `${bosses[0].icon} ${bosses[0].name}  ${fmt(bosses[0].hp)} / ${fmt(bosses[0].maxHp)}`;
    }
    for (let p = 0; p < this.players; p++) {
      const g = m.games[p], pe = this.pels[p];
      pe.gold.textContent = fmt(g.gold);
      pe.units.textContent = `${g.unitCount()}/${RULES.unitCap}`;
      pe.wrap.classList.toggle('danger', danger);
      pe.summon.disabled = g.gold < RULES.summonCost || g.unitCount() >= RULES.unitCap;
      pe.roulette.disabled = g.gold < RULES.rouletteCost;
      pe.gift.disabled = g.gold < RULES.giftGold;
    }
    this.refreshUpgradeButtons();
    const sig = this.cellSig();
    if (this._lastSig !== sig) { this._lastSig = sig; this.renderRecipes(); this.refreshCard(); }
  }
  cellSig() { return this.focus + '|' + this.g.cells.map(c => c ? c.id + c.count : '-').join(','); }
  // ---- 이벤트 ----
  toast(msg, kind = '', p = 0) {
    const area = this.pels[Math.min(p, this.players - 1)].toasts;
    const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg;
    area.appendChild(el); while (area.children.length > 3) area.removeChild(area.firstChild);
    setTimeout(() => el.remove(), 1600);
  }
  banner(p, { text, kind, element }) {
    const b = this.pels[p].banner; b.className = 'banner ' + kind;
    b.innerHTML = text + (element ? ` <span style="color:${ELEMENTS[element].color}">· ${ELEMENTS[element].name}</span>` : '');
    b.classList.remove('hidden');
    void b.offsetWidth; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(b._bt); b._bt = setTimeout(() => b.classList.add('hidden'), 950);
  }
  end({ result, reason }) {
    const m = this.match, won = result === 'won';
    this.a.play(won ? 'win' : 'lose');
    this.select(this.selP, -1);
    $('end-title').textContent = won ? '🏆 승리!' : '💀 패배';
    $('end-reason').textContent = won ? '마왕을 쓰러뜨리고 40라운드를 지켜냈습니다!' : reason;
    const best = this.saveBest(m.round, won);
    const stat = (g, label) => `${label ? `<div class="pstat-head"><span class="plabel p${g.index + 1}">${label}</span></div>` : ''}<div>처치<b>${g.stats.kills}</b></div><div>소환 / 합성<b>${g.stats.summons} / ${g.stats.merges}</b></div><div>최고 등급<b style="color:${RARITY_INFO[RARITY[g.stats.bestRarity]].color}">${RARITY_INFO[RARITY[g.stats.bestRarity]].name}</b></div><div>획득 골드<b>${fmt(g.stats.goldEarned)}</b></div>`;
    $('end-stats').innerHTML = `<div>도달 라운드<b>${m.round}${won ? ' ✔' : ''}</b></div><div>최고 기록<b>R.${best.round}${best.won ? ' 🏆' : ''}</b></div>`
      + m.games.map(g => stat(g, this.players > 1 ? `P${g.index + 1}` : '')).join('');
    setTimeout(() => $('screen-end').classList.remove('hidden'), 600);
  }
  bestKey() { return this.players > 1 ? 'lmd-best-coop' : 'lmd-best'; }
  saveBest(round, won) {
    let best = { round: 0, won: false };
    try { best = JSON.parse(localStorage.getItem(this.bestKey()) || 'null') || best; } catch (e) {}
    if (round > best.round || (won && !best.won)) best = { round: Math.max(round, best.round), won: best.won || won };
    try { localStorage.setItem(this.bestKey(), JSON.stringify(best)); } catch (e) {}
    return best;
  }
  showBest() {
    const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const s = read('lmd-best'), c = read('lmd-best-coop');
    const txt = [s && s.round ? `1인 최고: R.${s.round}${s.won ? ' 🏆' : ''}` : '', c && c.round ? `2인 최고: R.${c.round}${c.won ? ' 🏆' : ''}` : ''].filter(Boolean).join('  ·  ');
    $('best-record').textContent = txt;
  }
}
