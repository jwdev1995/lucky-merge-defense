// 보드 캔버스 포인터 입력: 탭 → 선택, 드래그(다른 칸에서 뗌) → 이동. p = 보드(플레이어) 번호
export function bindInput(canvas, renderer, ui, p = 0) {
  let downCell = -1;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    downCell = renderer.cellAt(e.clientX - r.left, e.clientY - r.top);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', (e) => {
    const r = canvas.getBoundingClientRect();
    const upCell = renderer.cellAt(e.clientX - r.left, e.clientY - r.top);
    const g = ui.game(p);
    if (g && downCell >= 0 && upCell >= 0 && upCell !== downCell && g.cells[downCell]) { ui.select(p, downCell); ui.tapCell(p, upCell); }
    else ui.tapCell(p, upCell);
    downCell = -1;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
