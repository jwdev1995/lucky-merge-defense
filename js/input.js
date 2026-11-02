// 보드 캔버스 포인터 입력. p = 보드(플레이어) 번호
//  - 탭: 선택 / 선택 후 다른 칸 탭: 이동
//  - 드래그: 유닛이 손가락을 따라오고(렌더러 drag), 놓는 칸에 이동·겹치기·교환
export function bindInput(canvas, renderer, ui, p = 0) {
  let down = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener('pointerdown', (e) => {
    const { x, y } = pos(e);
    down = { cell: renderer.cellAt(x, y), x, y, dragging: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return;
    const { x, y } = pos(e), g = ui.game(p);
    if (!down.dragging) {
      if (down.cell < 0 || !g || !g.cells[down.cell] || ui.state !== 'playing' || Math.hypot(x - down.x, y - down.y) < 8) return;
      down.dragging = true; ui.select(p, down.cell);
    }
    renderer.drag = { from: down.cell, x, y, over: renderer.cellAt(x, y) };
  });
  const finish = (e) => {
    if (!down) return;
    const { x, y } = pos(e), over = renderer.cellAt(x, y);
    if (down.dragging) { renderer.drag = null; if (over >= 0 && over !== down.cell) ui.tapCell(p, over); }
    else ui.tapCell(p, over);
    down = null;
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', () => { renderer.drag = null; down = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
