export function bindInput(canvas, renderer, ui) {
  let downCell = -1, downAt = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    downCell = renderer.cellAt(e.clientX - r.left, e.clientY - r.top); downAt = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', (e) => {
    const r = canvas.getBoundingClientRect();
    const upCell = renderer.cellAt(e.clientX - r.left, e.clientY - r.top);
    // 드래그(다른 칸에서 뗌) → 이동, 탭 → 선택
    if (downCell >= 0 && upCell >= 0 && upCell !== downCell && ui.g.cells[downCell]) { ui.select(downCell); ui.tapCell(upCell); }
    else ui.tapCell(upCell);
    downCell = -1;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
