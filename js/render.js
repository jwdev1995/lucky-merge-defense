import { BOARD, UNITS, RARITY_INFO, RULES } from './config.js';
import { cellCenter, pathPos, GRID_CELLS } from './game.js';

const COLORS = { path: '#1c2140', pathLine: '#2a3160', cell: '#242a4a', cellLine: '#343c66', sel: '#ffd166' };
const emojiFont = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

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
    this.cell = Math.min(r.width / BOARD.cols, r.height / BOARD.rows);
    this.ox = (r.width - this.cell * BOARD.cols) / 2; this.oy = (r.height - this.cell * BOARD.rows) / 2;
  }
  toPx(x, y) { return { x: this.ox + x * this.cell, y: this.oy + y * this.cell }; }
  cellAt(px, py) {
    const gx = (px - this.ox) / this.cell - BOARD.gridX, gy = (py - this.oy) / this.cell - BOARD.gridY;
    const c = Math.floor(gx), r = Math.floor(gy);
    if (c < 0 || r < 0 || c >= BOARD.gridCols || r >= BOARD.gridRows) return -1;
    return r * BOARD.gridCols + c;
  }

  draw(g, dtReal) {
    const ctx = this.ctx, cs = this.cell;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    // 경로
    ctx.fillStyle = COLORS.path; ctx.fillRect(this.ox, this.oy, cs * BOARD.cols, cs * BOARD.rows);
    ctx.strokeStyle = COLORS.pathLine; ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD.cols; i++) { const p = this.toPx(i, 0); ctx.beginPath(); ctx.moveTo(p.x, this.oy); ctx.lineTo(p.x, this.oy + cs * BOARD.rows); ctx.stroke(); }
    for (let j = 0; j <= BOARD.rows; j++) { const p = this.toPx(0, j); ctx.beginPath(); ctx.moveTo(this.ox, p.y); ctx.lineTo(this.ox + cs * BOARD.cols, p.y); ctx.stroke(); }
    // 경로 방향 화살표 (점선 흐름)
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = Math.max(4, cs * 0.16); ctx.setLineDash([cs * 0.3, cs * 0.3]); ctx.lineDashOffset = -(g.time * cs * 0.6) % (cs * 0.6);
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
      if (cellObj) this.drawUnit(g, i, cellObj);
      if (i === this.selected && cellObj) { const u = UNITS[cellObj.id]; const cc = this.toPx(c.x, c.y); ctx.strokeStyle = 'rgba(255,209,102,.5)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cc.x, cc.y, u.range * cs, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    }
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
  }
  rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  drawUnit(g, i, cellObj) {
    const ctx = this.ctx, cs = this.cell, u = UNITS[cellObj.id], col = RARITY_INFO[u.rarity].color;
    const c = cellCenter(i), p = this.toPx(c.x, c.y);
    let scale = 1;
    for (const f of g.effects) if (f.kind === 'pop' && f.cell === i) { const k = f.t / f.dur; scale = k < 0.5 ? k * 2.4 : 1.2 - (k - 0.5) * 0.4; }
    const r = cs * 0.36 * scale;
    ctx.save();
    if (u.rarity === 'mythic' || u.rarity === 'legend') { ctx.shadowColor = col; ctx.shadowBlur = 10 + Math.sin(g.time * 5) * 5; }
    ctx.fillStyle = '#10131f'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, cs * 0.05); ctx.stroke();
    ctx.font = `${r * 1.15}px ${emojiFont}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(u.icon, p.x, p.y + r * 0.05);
    ctx.restore();
    if (cellObj.count > 1) {
      const bx = p.x + r * 0.75, by = p.y - r * 0.75;
      ctx.fillStyle = cellObj.count >= 3 ? '#ffd166' : '#fff'; ctx.beginPath(); ctx.arc(bx, by, cs * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10131f'; ctx.font = `bold ${cs * 0.17}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('×' + cellObj.count, bx, by + 1);
    }
  }
  drawEnemy(g, e) {
    const ctx = this.ctx, cs = this.cell, pos = pathPos(e.t), p = this.toPx(pos.x, pos.y), r = e.size * cs;
    ctx.save();
    if (e.boss) { ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 16; }
    ctx.font = `${r * 1.7}px ${emojiFont}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const slowed = g.time < e.slowUntil, burning = e.dots.some(d => d.kind === 'burn'), poisoned = e.dots.some(d => d.kind === 'poison');
    if (slowed) { ctx.fillStyle = 'rgba(78,168,255,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.05, 0, Math.PI * 2); ctx.fill(); }
    if (poisoned) { ctx.fillStyle = 'rgba(94,227,154,.3)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.0, 0, Math.PI * 2); ctx.fill(); }
    if (burning) { ctx.fillStyle = 'rgba(255,120,40,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.0, 0, Math.PI * 2); ctx.fill(); }
    if (e.flash > 0) { try { ctx.filter = 'brightness(2.2) saturate(0.2)'; } catch (err) {} }
    ctx.fillText(e.icon, p.x, p.y + r * 0.08);
    ctx.filter = 'none';
    ctx.restore();
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
    else if (f.kind === 'text') { const p = this.toPx(f.x, f.y - k * 0.5); ctx.fillStyle = f.color; ctx.globalAlpha = 1 - k; ctx.font = `bold ${cs * 0.26}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.text, p.x, p.y); ctx.globalAlpha = 1; }
  }
}
