document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("myBlockGrid");
  if (!grid) return;

  // ✅ 블록 추가 모달
  const addBtn = document.getElementById("btnAddBlock");
  const modalEl = document.getElementById("addBlockModal");
  const modal = (modalEl && window.bootstrap?.Modal) ? new bootstrap.Modal(modalEl) : null;

  if (addBtn && modal) {
    addBtn.addEventListener("click", () => modal.show());
  }

  // ✅ 블록 추가 (모달에 있는 버튼만, 이미 추가된 건 서버에서 제외됨)
  document.querySelectorAll(".add-block-item").forEach(btn => {
    btn.addEventListener("click", async () => {
      const type = btn.dataset.type;
      if (!type) return;

      const res = await fetch(`/my/blocks?blockType=${encodeURIComponent(type)}`, { method: "POST" });
      if (res.ok) location.reload();
      else console.warn("블록 추가 실패", await safeText(res));
    });
  });

  // ✅ 블록 삭제 (alert 금지)
  grid.querySelectorAll(".btnDelBlock").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const card = e.target.closest(".my-block");
      const blockCode = card?.dataset?.blockCode;
      if (!blockCode) return;

      const res = await fetch(`/my/blocks/${blockCode}`, { method: "DELETE" });

      if (res.ok) {
        card.remove();
        await saveOrder();
      } else {
        console.warn("블록 삭제 실패", await safeText(res));
      }
    });
  });

  // ✅ 드래그 정렬: 헤더 전체로 이동
  if (window.Sortable) {
    new Sortable(grid, {
      animation: 150,
      handle: ".my-block-header",

      // 헤더 내부 클릭 요소는 드래그 금지
      filter: "a, button",
      preventOnFilter: true,

      onEnd: async () => {
        await saveOrder();
      }
    });
  }

  // position 저장
  async function saveOrder() {
    const ids = Array.from(grid.querySelectorAll(".my-block"))
      .map(el => Number(el.dataset.blockCode))
      .filter(n => !isNaN(n));

    const res = await fetch("/my/blocks/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids)
    });

    if (!res.ok) console.warn("정렬 저장 실패", await safeText(res));
  }

  async function safeText(res) {
    try { return await res.text(); } catch { return ""; }
  }

  // ✅ 간트 bar 위치 계산 + tooltip
  initGantt();
});

function initGantt() {
  const rows = document.querySelectorAll(".gantt-row");
  if (!rows.length) return;

  // 프로젝트별 컬러 매핑
  const colorMap = new Map();
  let colorIdx = 0;

  rows.forEach(row => {
    const projectCode = row.dataset.project;
    if (projectCode && !colorMap.has(projectCode)) {
      colorMap.set(projectCode, colorIdx % 6);
      colorIdx++;
    }

    const barsWrap = row.querySelector(".gantt-bars");
    const weekStart = barsWrap?.dataset?.weekStart;
    if (!barsWrap || !weekStart) return;

    const bar = row.querySelector(".gantt-bar");
    if (!bar) return; // 빈행

    const startBase = new Date(weekStart + "T00:00:00");
    const weekMin = startBase;
    const weekMax = new Date(startBase); weekMax.setDate(weekMax.getDate() + 6);

    const s = bar.dataset.start;
    const e = bar.dataset.end;
    if (!s) return;

    const start = new Date(s + "T00:00:00");
    const end = e ? new Date(e + "T00:00:00") : start;

    // 주간 범위로 클립
    const clippedStart = (start < weekMin) ? weekMin : start;
    const clippedEnd = (end > weekMax) ? weekMax : end;

    // 완전히 범위 밖이면 숨김
    if (clippedEnd < weekMin || clippedStart > weekMax) {
      bar.style.display = "none";
      return;
    }

    const leftDays = Math.floor((clippedStart - weekMin) / 86400000);
    let spanDays = Math.floor((clippedEnd - clippedStart) / 86400000) + 1;
    if (spanDays < 1) spanDays = 1;

    const leftPct = (leftDays / 7) * 100;
    const widthPct = (spanDays / 7) * 100;

    bar.style.left = `calc(${leftPct}% + 6px)`;
    bar.style.width = `calc(${widthPct}% - 12px)`;

    // 색
    const idx = colorMap.get(projectCode) ?? 0;
    bar.classList.add(`pcolor-${idx}`);
  });

  // tooltip
  if (window.bootstrap?.Tooltip) {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      new bootstrap.Tooltip(el);
    });
  }
}


