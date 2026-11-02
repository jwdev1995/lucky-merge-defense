import { BOARD, UNITS, RARITY_INFO, ELEMENTS, ELEMENT_SKILLS } from './config.js';
import { cellCenter, pathPos, GRID_CELLS } from './game.js';
import { sprite } from './sprites.js';

const COLORS = { cell: 'rgba(18,22,46,.82)', cellLine: '#3b4470', sel: '#ffd166' };
const ATK_DUR = 0.28; // 공격 모션 길이(초)
const MARGIN = 0.32;  // 보드 바깥 장식 여백(칸 단위)
// 결정적 난수 (배경 장식이 프레임마다 바뀌지 않도록)
function prng(seed) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.cell = 50; this.dpr = 1; this.w = 0; this.h = 0;
    this.selected = -1;
    this.resize();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    this.w = r.width; this.h = r.height;
    this.cell = Math.min(r.width / (BOARD.cols + MARGIN * 2), r.height / (BOARD.rows + MARGIN * 2));
    this.ox = (r.width - this.cell * BOARD.cols) / 2; this.oy = (r.height - this.cell * BOARD.rows) / 2;
    this.bg = null; this.drag = null;
  }
  // ── 배경: 밤의 초원 타일 + 돌길 + 나무·덤불·등불 (오프스크린 캐시) ──
  buildBg() {
    const cs = this.cell, W = this.w, H = this.h, dpr = this.dpr, rnd = prng(20261102);
    const c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    const px = Math.max(2, cs / 16);
    // 잔디 타일
    const T = cs / 4;
    for (let y = 0; y < H + T; y += T) for (let x = 0; x < W + T; x += T) {
      const k = (Math.floor(x / T) + Math.floor(y / T)) % 2; ctx.fillStyle = k ? '#1c3a30' : '#1f4036'; ctx.fillRect(x, y, T + 0.5, T + 0.5);
    }
    for (let i = 0; i < (W * H) / 220; i++) { // 풀잎 플렉
      const x = rnd() * W, y = rnd() * H; ctx.fillStyle = rnd() < 0.5 ? '#2a5a46' : '#245040';
      ctx.fillRect(x, y, px, px * 2); if (rnd() < 0.5) ctx.fillRect(x + px, y - px, px, px);
    }
    // 돌길 (둘레 1칸)
    const o = this.toPx(0, 0), b = this.toPx(BOARD.cols, BOARD.rows), g0 = this.toPx(BOARD.gridX, BOARD.gridY), g1 = this.toPx(BOARD.gridX + BOARD.gridCols, BOARD.gridY + BOARD.gridRows);
    ctx.fillStyle = '#4a4660'; ctx.fillRect(o.x, o.y, b.x - o.x, b.y - o.y);
    for (let y = o.y; y < b.y; y += px * 3) for (let x = o.x; x < b.x; x += px * 4) { // 자갈
      if (x + px * 4 > g0.x && x < g1.x && y + px * 3 > g0.y && y < g1.y) continue;
      const v = rnd(); ctx.fillStyle = v < 0.3 ? '#555170' : v < 0.6 ? '#423e58' : '#4a4660';
      ctx.fillRect(x + (rnd() < 0.5 ? px : 0), y, px * 3, px * 2);
    }
    ctx.strokeStyle = '#2d2a40'; ctx.lineWidth = px; ctx.strokeRect(o.x + px / 2, o.y + px / 2, b.x - o.x - px, b.y - o.y - px);
    // 안쪽 잔디(배치 그리드) 되살리기 + 테두리
    for (let y = g0.y; y < g1.y; y += T) for (let x = g0.x; x < g1.x; x += T) {
      const k = (Math.floor(x / T) + Math.floor(y / T)) % 2; ctx.fillStyle = k ? '#1c3a30' : '#1f4036'; ctx.fillRect(x, y, Math.min(T, g1.x - x), Math.min(T, g1.y - y));
    }
    ctx.strokeStyle = '#2d2a40'; ctx.strokeRect(g0.x + px / 2, g0.y + px / 2, g1.x - g0.x - px, g1.y - g0.y - px);
    // 꽃 (잔디 위)
    const flower = (x, y) => { const col = ['#ff9fcb', '#ffd166', '#f4f6ff', '#9fe8ff'][Math.floor(rnd() * 4)]; ctx.fillStyle = col; ctx.fillRect(x - px, y, px * 3, px); ctx.fillRect(x, y - px, px, px * 3); ctx.fillStyle = '#ffe66d'; ctx.fillRect(x, y, px, px); };
    for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H; const onPath = x > o.x && x < b.x && y > o.y && y < b.y && !(x > g0.x && x < g1.x && y > g0.y && y < g1.y); if (!onPath) flower(x, y); }
    // 나무 (네 모서리 여백) / 덤불 / 바위
    const tree = (x, y, sz) => {
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - sz * 0.12, y, sz * 0.24, sz * 0.5);
      ctx.fillStyle = '#1c3a30'; ctx.beginPath(); ctx.arc(x, y - sz * 0.25, sz * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f7a55'; ctx.beginPath(); ctx.arc(x, y - sz * 0.3, sz * 0.48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#48a06f'; ctx.beginPath(); ctx.arc(x - sz * 0.15, y - sz * 0.42, sz * 0.26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6fd18f'; ctx.fillRect(x - sz * 0.28, y - sz * 0.52, px, px); ctx.fillRect(x + sz * 0.05, y - sz * 0.3, px, px);
    };
    const bush = (x, y, sz) => { ctx.fillStyle = '#1c3a30'; ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2f7a55'; ctx.beginPath(); ctx.arc(x, y - sz * 0.12, sz * 0.85, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#48a06f'; ctx.fillRect(x - sz * 0.4, y - sz * 0.4, px, px); };
    const rock = (x, y, sz) => { ctx.fillStyle = '#2d2a40'; ctx.beginPath(); ctx.ellipse(x, y, sz, sz * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6a6686'; ctx.beginPath(); ctx.ellipse(x, y - sz * 0.15, sz * 0.8, sz * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d89aa'; ctx.fillRect(x - sz * 0.3, y - sz * 0.4, px, px); };
    const m = cs * MARGIN;
    tree(o.x - m * 0.5, o.y + m * 0.1, cs * 0.6); tree(b.x + m * 0.5, o.y + m * 0.1, cs * 0.55); tree(o.x - m * 0.5, b.y + m * 0.3, cs * 0.55); tree(b.x + m * 0.5, b.y + m * 0.3, cs * 0.6);
    for (let i = 0; i < 10; i++) { const side = Math.floor(rnd() * 4), t = rnd(); const x = side < 2 ? o.x + t * (b.x - o.x) : (side === 2 ? o.x - m * 0.5 : b.x + m * 0.5), y = side < 2 ? (side === 0 ? o.y - m * 0.5 : b.y + m * 0.5) : o.y + t * (b.y - o.y); if (Math.abs(x - o.x) < cs * 0.6 && Math.abs(y - o.y) < cs * 0.6) continue; (rnd() < 0.6 ? bush : rock)(x, y, cs * (0.1 + rnd() * 0.08)); }
    // 등불 (위·아래 중앙 여백) — 불빛은 draw()에서 깜빡임
    const lamp = (x, y) => { ctx.fillStyle = '#2d2a40'; ctx.fillRect(x - px, y - cs * 0.22, px * 2, cs * 0.3); ctx.fillStyle = '#ffd166'; ctx.fillRect(x - px * 1.5, y - cs * 0.3, px * 3, px * 2.5); ctx.fillStyle = '#fff1b8'; ctx.fillRect(x - px * 0.5, y - cs * 0.28, px, px); };
    this.lamps = [{ x: (o.x + b.x) / 2, y: o.y - m * 0.35 }, { x: (o.x + b.x) / 2, y: b.y + m * 0.75 }];
    for (const l of this.lamps) lamp(l.x, l.y);
    // 비네트
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(8,10,22,0)'); v.addColorStop(1, 'rgba(8,10,22,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    this.bg = c;
  }
  toPx(x, y) { return { x: this.ox + x * this.cell, y: this.oy + y * this.cell }; }
  cellAt(px, py) {
    const gx = (px - this.ox) / this.cell - BOARD.gridX, gy = (py - this.oy) / this.cell - BOARD.gridY;
    const c = Math.floor(gx), r = Math.floor(gy);
    if (c < 0 || r < 0 || c >= BOARD.gridCols || r >= BOARD.gridRows) return -1;
    return r * BOARD.gridCols + c;
  }

  draw(g) {
    const ctx = this.ctx, cs = this.cell;
    if (!this.w) this.resize();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (!this.bg) this.buildBg();
    ctx.drawImage(this.bg, 0, 0, this.w, this.h);
    // 등불 불빛 깜빡임
    for (const l of this.lamps) { const f = 0.8 + Math.sin(g.time * 7 + l.y) * 0.1 + Math.sin(g.time * 13) * 0.06; const gr = ctx.createRadialGradient(l.x, l.y - cs * 0.27, 0, l.x, l.y - cs * 0.27, cs * 0.9 * f); gr.addColorStop(0, 'rgba(255,209,102,.35)'); gr.addColorStop(1, 'rgba(255,209,102,0)'); ctx.fillStyle = gr; ctx.fillRect(l.x - cs, l.y - cs * 1.3, cs * 2, cs * 2); }
    // 경로 방향 (점선 흐름)
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = Math.max(4, cs * 0.16); ctx.setLineDash([cs * 0.3, cs * 0.3]); ctx.lineDashOffset = -(g.time * cs * 0.6) % (cs * 0.6);
    ctx.beginPath(); const a = this.toPx(0.5, 0.5), b = this.toPx(BOARD.cols - 0.5, BOARD.rows - 0.5);
    ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.stroke(); ctx.setLineDash([]);
    // 스폰 지점
    { const p = this.toPx(0.5, 0.5); ctx.fillStyle = 'rgba(255,92,122,.25)'; ctx.beginPath(); ctx.arc(p.x, p.y, cs * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff5c7a'; ctx.font = `${cs * 0.26}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('IN', p.x, p.y); }
    // 그리드 칸
    for (let i = 0; i < GRID_CELLS; i++) {
      const c = cellCenter(i), p = this.toPx(c.x - 0.5, c.y - 0.5), pad = cs * 0.06;
      const cellObj = g.cells[i];
      ctx.fillStyle = COLORS.cell; this.rr(p.x + pad, p.y + pad, cs - pad * 2, cs - pad * 2, cs * 0.14); ctx.fill();
      let stroke = COLORS.cellLine, lw = 1.5;
      if (cellObj && g.canMerge(i)) { stroke = COLORS.sel; lw = 2 + Math.sin(g.time * 8) * 1; }
      if (i === this.selected) { stroke = COLORS.sel; lw = 3; }
      ctx.strokeStyle = stroke; ctx.lineWidth = lw; this.rr(p.x + pad, p.y + pad, cs - pad * 2, cs - pad * 2, cs * 0.14); ctx.stroke();
      if (i === this.selected && cellObj) { const u = UNITS[cellObj.id]; const cc = this.toPx(c.x, c.y); ctx.strokeStyle = 'rgba(255,209,102,.5)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cc.x, cc.y, u.range * cs, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    }
    // 유닛 (공격 중인 유닛이 다른 칸 위로 튀어나오므로 칸을 모두 그린 뒤)
    for (let i = 0; i < GRID_CELLS; i++) if (g.cells[i]) { const dragging = this.drag && this.drag.from === i; if (dragging) ctx.globalAlpha = 0.35; this.drawUnit(g, i, g.cells[i]); ctx.globalAlpha = 1; }
    // 체인 이펙트 (적 아래)
    for (const f of g.effects) if (f.kind === 'chain') { ctx.strokeStyle = f.color; ctx.lineWidth = 3 * (1 - f.t / f.dur); ctx.beginPath(); f.pts.forEach((pt, k) => { const p = this.toPx(pt.x, pt.y); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke(); }
    // 적
    const sorted = [...g.enemies].sort((x, y) => x.size - y.size);
    for (const e of sorted) this.drawEnemy(g, e);
    // 투사체
    for (const pr of g.projectiles) {
      const p = this.toPx(pr.x, pr.y);
      ctx.fillStyle = pr.color; ctx.shadowColor = pr.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, cs * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }
    // 이펙트
    for (const f of g.effects) this.drawEffect(g, f);
    // 상단 플래시 (전설+ 소환)
    for (const f of g.effects) if (f.kind === 'flash') { ctx.fillStyle = f.color; ctx.globalAlpha = 0.25 * (1 - f.t / f.dur); ctx.fillRect(0, 0, this.w, this.h); ctx.globalAlpha = 1; }
    // 드래그: 대상 칸 강조 + 손가락을 따라오는 유닛
    if (this.drag && g.cells[this.drag.from]) this.drawDrag(g, this.drag);
  }
  drawDrag(g, d) {
    const ctx = this.ctx, cs = this.cell, src = g.cells[d.from], u = UNITS[src.id];
    if (d.over >= 0 && d.over !== d.from) {
      const dst = g.cells[d.over];
      const kind = !dst ? 'move' : (dst.id === src.id && dst.count + src.count <= 3) ? 'stack' : 'swap';
      const c = cellCenter(d.over), p = this.toPx(c.x - 0.5, c.y - 0.5), pad = cs * 0.06;
      ctx.fillStyle = kind === 'swap' ? 'rgba(255,209,102,.18)' : 'rgba(94,227,154,.22)';
      this.rr(p.x + pad, p.y + pad, cs - pad * 2, cs - pad * 2, cs * 0.14); ctx.fill();
      ctx.strokeStyle = kind === 'swap' ? '#ffd166' : '#5ee39a'; ctx.lineWidth = 3; this.rr(p.x + pad, p.y + pad, cs - pad * 2, cs - pad * 2, cs * 0.14); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.font = `bold ${cs * 0.16}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(kind === 'move' ? '이동' : kind === 'stack' ? '겹치기' : '교환', p.x + cs / 2, p.y + cs - pad - 2);
    }
    const r = cs * 0.36 * 1.15, sz = r * 2.0, img = sprite(u.id, 4);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(d.x, d.y + r * 1.1, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = RARITY_INFO[u.rarity].color; ctx.shadowBlur = 18;
    ctx.fillStyle = '#10131f'; ctx.beginPath(); ctx.arc(d.x, d.y - r * 0.3, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = RARITY_INFO[u.rarity].color; ctx.lineWidth = Math.max(2, cs * 0.05); ctx.stroke();
    ctx.imageSmoothingEnabled = false; if (img) ctx.drawImage(img, d.x - sz / 2, d.y - r * 0.3 - sz / 2, sz, sz);
    ctx.restore();
  }
  // ── 정령 오라: 속성색 글로우 + 궤도 입자 ──
  drawAura(x, y, r, element, t, seed) {
    const ctx = this.ctx, el = ELEMENTS[element], col = el.color;
    const gr = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.6); gr.addColorStop(0, col + '55'); gr.addColorStop(1, col + '00');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  // 속성 입자 1개 (오라·스킬 이펙트 공용). s = 크기, k = 인덱스, ph = 0..1 진행
  particle(element, px, py, s, k, t, ph = 0) {
    const ctx = this.ctx;
    if (element === 'fire') { ctx.fillStyle = k % 2 ? '#ffe84a' : '#ff6b3d'; const q = s * (1.2 - ph); ctx.fillRect(px - q / 2, py - q / 2, q, q); }
    else if (element === 'water') { ctx.fillStyle = '#9fe8ff'; ctx.beginPath(); ctx.arc(px, py, s * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(px - s * 0.3, py - s * 0.4, s * 0.3, s * 0.3); }
    else if (element === 'wind') { ctx.strokeStyle = '#7ee8c9'; ctx.lineWidth = Math.max(1.5, s * 0.35); ctx.beginPath(); ctx.arc(px, py, s * 1.2, t * 4 + k, t * 4 + k + 1.4); ctx.stroke(); }
    else if (element === 'earth') { ctx.save(); ctx.translate(px, py); ctx.rotate(t * 3 + k); ctx.fillStyle = k % 2 ? '#6fd18f' : '#c9924a'; ctx.fillRect(-s * 0.7, -s * 0.35, s * 1.4, s * 0.7); ctx.restore(); }
    else if (element === 'thunder') { ctx.strokeStyle = '#ffe84a'; ctx.lineWidth = Math.max(1.5, s * 0.3); ctx.beginPath(); ctx.moveTo(px - s * 0.6, py - s); ctx.lineTo(px + s * 0.2, py - s * 0.1); ctx.lineTo(px - s * 0.2, py + s * 0.1); ctx.lineTo(px + s * 0.6, py + s); ctx.stroke(); }
    else if (element === 'light') { const tw = 0.6 + Math.abs(Math.sin(t * 5 + k * 1.7)) * 0.9; ctx.strokeStyle = '#fff6d6'; ctx.lineWidth = Math.max(1.5, s * 0.3); ctx.beginPath(); ctx.moveTo(px - s * tw, py); ctx.lineTo(px + s * tw, py); ctx.moveTo(px, py - s * tw); ctx.lineTo(px, py + s * tw); ctx.stroke(); }
    else { const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * 0.55; ctx.fillStyle = '#b48cff'; ctx.beginPath(); ctx.arc(px, py, s * (0.8 + Math.sin(t * 3 + k) * 0.3), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = a0; ctx.fillStyle = '#e4d4ff'; ctx.fillRect(px - s * 0.2, py - s * 0.2, s * 0.4, s * 0.4); }
  }
  drawSpirits(x, y, r, element, t, seed) {
    const ctx = this.ctx, n = 3;
    ctx.save();
    for (let k = 0; k < n; k++) {
      const a = t * 1.5 + seed + k * Math.PI * 2 / n, ph = ((t * 0.7 + k * 0.37 + seed * 0.1) % 1);
      let px = x + Math.cos(a) * r * 1.15, py = y + Math.sin(a) * r * 0.55;
      ctx.globalAlpha = 0.85;
      if (element === 'fire') { py = y + r * 0.7 - ph * r * 1.5; px = x + Math.cos(a) * r * 0.8; ctx.globalAlpha = 1 - ph; }
      if (element === 'wind') { ctx.strokeStyle = '#7ee8c9'; ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.beginPath(); ctx.arc(x, y, r * (1.1 + k * 0.1), a, a + 0.9); ctx.stroke(); continue; }
      if (element === 'thunder' && Math.sin(t * 11 + k * 2.1 + seed) < 0.2) continue;
      this.particle(element, px, py, r * 0.14, k, t, ph);
    }
    ctx.restore();
  }
  // 스킬 발동 이펙트: 속성색 링 + 입자 6개 (번개는 하늘에서 내리꽂는 번개, 땅은 갈라진 바닥)
  drawSkill(f) {
    const ctx = this.ctx, cs = this.cell, k = f.t / f.dur, p = this.toPx(f.x, f.y), col = ELEMENTS[f.element].color, R = cs * 0.5;
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, R * (0.2 + k), 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + f.t * 2; this.particle(f.element, p.x + Math.cos(a) * R * k, p.y + Math.sin(a) * R * k * 0.6 - (f.element === 'fire' ? k * R : 0), cs * 0.07, i, f.t, k); }
    if (f.element === 'thunder' && k < 0.5) { ctx.strokeStyle = '#fff8c4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x + cs * 0.15, p.y - cs * 1.1); ctx.lineTo(p.x - cs * 0.08, p.y - cs * 0.5); ctx.lineTo(p.x + cs * 0.1, p.y - cs * 0.45); ctx.lineTo(p.x - cs * 0.05, p.y); ctx.stroke(); }
    if (f.element === 'earth') { ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.4; ctx.beginPath(); ctx.moveTo(p.x, p.y + cs * 0.15); ctx.lineTo(p.x + Math.cos(a) * R * 0.7, p.y + cs * 0.15 + Math.sin(a) * R * 0.3); ctx.stroke(); } }
    if (f.element === 'light') { ctx.fillStyle = 'rgba(255,246,214,.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.6 * (1 - k), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  // 속성 배지 (작은 원 + 한 글자)
  badge(x, y, r, element) {
    const ctx = this.ctx, el = ELEMENTS[element]; if (!el) return;
    ctx.fillStyle = el.color; ctx.strokeStyle = '#2b2340'; ctx.lineWidth = Math.max(1, r * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = element === 'light' || element === 'thunder' || element === 'wind' ? '#2b2340' : '#fff';
    ctx.font = `bold ${r * 1.3}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(el.short, x, y + r * 0.08);
  }
  drawUnit(g, i, cellObj) {
    const ctx = this.ctx, cs = this.cell, u = UNITS[cellObj.id], col = RARITY_INFO[u.rarity].color;
    const c = cellCenter(i), p = this.toPx(c.x, c.y);
    let scale = 1;
    for (const f of g.effects) if (f.kind === 'pop' && f.cell === i) { const k = f.t / f.dur; scale = k < 0.5 ? k * 2.4 : 1.2 - (k - 0.5) * 0.4; }
    const r = cs * 0.36 * scale;
    // 공격 모션: 대상 방향으로 돌진 → 복귀, 가로로 살짝 늘어남. 대기 중엔 숨쉬기 바운스.
    const atk = cellObj.atk ?? 9, k = Math.min(1, atk / ATK_DUR), lunge = Math.sin(k * Math.PI);
    const dir = cellObj.atkDir || 0, dx = Math.cos(dir) * lunge * cs * 0.16, dy = Math.sin(dir) * lunge * cs * 0.16;
    const bobK = Math.sin(g.time * 2.4 + i * 1.3), bob = -cs * 0.02 - bobK * cs * 0.022;   // 정령처럼 떠 있음
    const sx = 1 + lunge * 0.14, sy = 1 - lunge * 0.10;
    // 바닥 그림자 (높이 올라갈수록 작아짐)
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 1.05, r * (0.72 - bobK * 0.08), r * (0.26 - bobK * 0.04), 0, 0, Math.PI * 2); ctx.fill();
    const cy = p.y + bob;
    this.drawAura(p.x, cy, r, u.element, g.time, i);
    ctx.save();
    if (u.rarity === 'mythic' || u.rarity === 'legend') { ctx.shadowColor = col; ctx.shadowBlur = 10 + Math.sin(g.time * 5) * 5; }
    ctx.fillStyle = '#10131f'; ctx.beginPath(); ctx.arc(p.x, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, cs * 0.05); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(p.x + dx, cy + dy); ctx.scale(sx * (cellObj.face || 1), sy);
    const img = sprite(u.id, 4, null, atk < ATK_DUR * 0.75 ? 'attack' : 'idle'), sz = r * 2.0;
    if (img) ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
    this.drawSpirits(p.x, cy, r, u.element, g.time, i * 1.7);
    this.badge(p.x - r * 0.78, cy + r * 0.78, cs * 0.1, u.element);
    if (cellObj.count > 1) {
      const bx = p.x + r * 0.75, by = cy - r * 0.75;
      ctx.fillStyle = cellObj.count >= 3 ? '#ffd166' : '#fff'; ctx.beginPath(); ctx.arc(bx, by, cs * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10131f'; ctx.font = `bold ${cs * 0.17}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('×' + cellObj.count, bx, by + 1);
    }
  }
  drawEnemy(g, e) {
    const ctx = this.ctx, cs = this.cell, pos = pathPos(e.t), p = this.toPx(pos.x, pos.y), r = e.size * cs;
    const ahead = pathPos(e.t + 0.2), face = ahead.x < pos.x - 0.01 ? -1 : 1;
    const walk = Math.sin(g.time * (e.boss ? 4 : 9) + (e.bob || 0));
    ctx.save();
    if (e.boss) { ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 16; }
    const slowed = g.time < e.slowUntil, burning = e.dots.some(d => d.kind === 'burn'), poisoned = e.dots.some(d => d.kind === 'poison');
    const stunned = g.time < e.stunUntil, rooted = g.time < e.rootUntil, cursed = g.time < e.curseUntil;
    if (slowed) { ctx.fillStyle = 'rgba(78,168,255,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.05, 0, Math.PI * 2); ctx.fill(); }
    if (cursed) { ctx.fillStyle = 'rgba(155,107,255,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.1, 0, Math.PI * 2); ctx.fill(); }
    if (rooted) { ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.75, r * 0.9, r * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#6fd18f'; for (let i = 0; i < 3; i++) ctx.fillRect(p.x - r * 0.6 + i * r * 0.6, p.y + r * 0.5 - (i % 2) * r * 0.2, 3, 6); }
    if (poisoned) { ctx.fillStyle = 'rgba(94,227,154,.3)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.0, 0, Math.PI * 2); ctx.fill(); }
    if (burning) { ctx.fillStyle = 'rgba(255,120,40,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.0, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0;
    ctx.imageSmoothingEnabled = false;
    const img = e.flash > 0 ? sprite(e.sprite, 4, '#ffffff') : sprite(e.sprite, 4), sz = r * 2.1;
    // 걷기: 위아래 바운스 + 살짝 기울기, 보스는 숨쉬기
    ctx.translate(p.x, p.y + (e.boss ? 0 : walk * cs * 0.03));
    ctx.scale(face * (e.boss ? 1 + walk * 0.03 : 1), e.boss ? 1 - walk * 0.03 : 1);
    if (!e.boss) ctx.rotate(walk * 0.08);
    if (img) ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
    if (stunned) { for (let i = 0; i < 3; i++) { const a = g.time * 6 + i * 2.1; this.particle('thunder', p.x + Math.cos(a) * r * 0.7, p.y - r * 1.15 + Math.sin(a) * r * 0.2, cs * 0.06, i, g.time); } }
    if (e.element) this.badge(p.x - r * 0.85, p.y - r * 0.85, cs * (e.boss ? 0.11 : 0.085), e.element);
    if (e.hp < e.maxHp) {
      const w = r * 1.8, h = Math.max(3, cs * 0.07), x = p.x - w / 2, y = p.y - r - h - 2;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = e.boss ? '#ff5c7a' : '#5ee39a'; ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
    }
  }
  drawEffect(g, f) {
    const ctx = this.ctx, cs = this.cell, k = f.t / f.dur;
    if (f.kind === 'ring') { const p = this.toPx(f.x, f.y); ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, (f.r ? f.r * cs : cs * 0.6) * (0.3 + k * 0.7), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (f.kind === 'burst' || f.kind === 'death') {
      const p = this.toPx(f.x, f.y), n = f.kind === 'burst' ? 10 : (f.big ? 16 : 6), R = (f.kind === 'burst' ? 0.9 : f.big ? 1.2 : 0.45) * cs;
      ctx.fillStyle = f.color; ctx.globalAlpha = 1 - k;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + f.t; const d = R * k; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, cs * 0.06 * (1 - k) + 1, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    else if (f.kind === 'skill') this.drawSkill(f);
    else if (f.kind === 'text') { const p = this.toPx(f.x, f.y - k * 0.5); ctx.fillStyle = f.color; ctx.globalAlpha = 1 - k; ctx.font = `bold ${cs * (f.small ? 0.18 : 0.26)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.strokeText(f.text, p.x, p.y); ctx.fillText(f.text, p.x, p.y); ctx.globalAlpha = 1; }
  }
}
