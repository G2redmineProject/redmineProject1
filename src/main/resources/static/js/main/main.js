/* =========================================================
   main - /static/js/main/main.js
   ========================================================= */

/* =========================
   Google Chart (Donut)
   ========================= */
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initChart);

let chart, data;

function initChart() {
  const statusListCnt = window.__statusListCnt || [];
  const chartEl = document.getElementById("donutchart");
  if (!chartEl) return;

  if (!statusListCnt || statusListCnt.length === 0) {
    chartEl.innerHTML =
      "<div class='text-muted text-center py-5'>표시할 데이터가 없습니다.</div>";
    return;
  }

  const reversed = [...statusListCnt].reverse();

  data = new google.visualization.DataTable();
  data.addColumn("string", "상태");
  data.addColumn("number", "개수");
  data.addColumn({ type: "string", role: "tooltip" });

  reversed.forEach((item) => {
    const value = Number(item.codeNameCnt);
    data.addRow([item.codeName, value, `${item.codeName}: ${value}개`]);
  });

  chart = new google.visualization.PieChart(chartEl);
  drawChart();

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(drawChart, 120);
  });
}

function drawChart() {
  if (!chart || !data) return;

  const el = document.getElementById("donutchart");
  if (!el) return;

  const w = el.getBoundingClientRect().width;

  chart.draw(data, {
    pieHole: 0.4,
    colors: ["#3b9ff6", "#a3a3a3"],
    legend: { position: "top", textStyle: { fontSize: 13 } },
    pieSliceText: "value",
    pieSliceTextStyle: { fontSize: 16, bold: true },
    chartArea: {
      left: 10,
      top: 55,
      width: Math.max(w - 20, 0),
      height: "75%",
    },
  });
}

/* =========================
   Tooltip helpers
   ========================= */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ✅ 뱃지는 "뒤에" 붙이기
function buildTooltipHTML({ badgeText, mainText }) {
  const safeMain = escapeHtml(mainText || "");
  if (!badgeText) return `<div>${safeMain}</div>`;

  const safeBadge = escapeHtml(badgeText);

  return `
    <div style="display:flex; align-items:center; gap:8px;">
      <span>${safeMain}</span>
      <span class="admin-badge">${safeBadge}</span>
    </div>
  `.trim();
}

// ✅ 셀 안의 뱃지 텍스트가 섞이지 않게 "순수 텍스트"만 추출
function getPureTextForTooltip(el) {
  // 1) 일감현황 프로젝트 칸: span.proj-name 안 텍스트만 사용
  const issueProjName = el.querySelector(".proj-name");
  if (issueProjName) return (issueProjName.textContent || "").trim();

  // 2) 나머지(최근공지 등): 그대로 텍스트 사용
  return (el.textContent || "").trim();
}

/* =========================
   Ellipsis Tooltip (Bootstrap로 통일 + HTML(뱃지) 지원)
   ========================= */
function applyEllipsisTooltips(root = document) {
  const hasBS = !!(window.bootstrap && bootstrap.Tooltip);
  if (!hasBS) return;

  const targets = root.querySelectorAll(
    [
      "#mainIssueTable td:nth-child(2)",     // 일감현황 프로젝트 칸
      "#mainNoticeTable td.notice-td-proj",  // 최근공지 프로젝트 칸
      "#mainNoticeTable .notice-td-title"    // 최근공지 제목(span)
    ].join(",")
  );

  targets.forEach((el) => {
    if (el.offsetParent === null) return;

    const text = getPureTextForTooltip(el);
    if (!text) return;

    const isTruncated = el.scrollWidth > el.clientWidth;

    // 기존 인스턴스 정리
    const inst = bootstrap.Tooltip.getInstance(el);
    if (inst) inst.dispose();

    if (!isTruncated) {
      el.removeAttribute("data-bs-toggle");
      el.removeAttribute("data-bs-placement");
      el.removeAttribute("data-bs-title");
      el.removeAttribute("data-bs-html");
      return;
    }

    // ✅ 뱃지 포함 여부(일감현황 프로젝트 칸에서만)
    let badgeText = null;
    const inIssueTable = !!el.closest("#mainIssueTable");
    if (inIssueTable) {
      const hasAdminBadge = !!el.querySelector(".admin-badge");
      if (hasAdminBadge) badgeText = "관리자";
    }

    const html = buildTooltipHTML({ badgeText, mainText: text });

    el.setAttribute("data-bs-toggle", "tooltip");
    el.setAttribute("data-bs-placement", "top");
    el.setAttribute("data-bs-html", "true");
    el.setAttribute("data-bs-title", html);

    new bootstrap.Tooltip(el, {
      trigger: "hover",
      container: "body",
      html: true,
      // 필요 시:
      // sanitize: false,
    });
  });
}

/* =========================
   Main Notice Paging
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  initMainNoticePaging();
  requestAnimationFrame(() => applyEllipsisTooltips());
});

function initMainNoticePaging() {
  setupPager({
    itemSelector: "#mainNoticeTable tbody > tr.notice-item",
    pagerSelector: '.block-pager[data-pager-for="MAIN_NOTICE"]',
    pageSize: 5,
    dummyMode: "table",
    dummyColspan: 4,
  });
}

function setupPager({ itemSelector, pagerSelector, pageSize, dummyMode, dummyColspan }) {
  const pager = document.querySelector(pagerSelector);
  if (!pager) return;

  const pagesWrap = pager.querySelector(".pager-pages");
  const btnPrev = pager.querySelector(".pager-prev");
  const btnNext = pager.querySelector(".pager-next");

  const getRealItems = () =>
    Array.from(document.querySelectorAll(itemSelector)).filter((el) => !el.dataset.pagerDummy);

  let page = 0;

  function itemsContainer() {
    const first = document.querySelector(itemSelector);
    return first ? first.parentElement : null; // tbody
  }

  const clearDummies = () => {
    const container = itemsContainer();
    if (!container) return;
    container.querySelectorAll('[data-pager-dummy="1"]').forEach((el) => el.remove());
  };

  const appendDummies = (count) => {
    if (count <= 0) return;
    const container = itemsContainer();
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const tr = document.createElement("tr");
      tr.setAttribute("data-pager-dummy", "1");
      tr.className = "pager-dummy-tr";
      tr.innerHTML = `<td colspan="${dummyColspan || 1}">&nbsp;</td>`;
      container.appendChild(tr);
    }
  };

  const render = () => {
    const items = getRealItems();
    const totalPages = Math.ceil(items.length / pageSize);

    if (page > totalPages - 1) page = Math.max(totalPages - 1, 0);

    if (items.length <= pageSize) {
      pager.style.display = "none";
      clearDummies();
      items.forEach((el) => (el.style.display = ""));
      requestAnimationFrame(() => applyEllipsisTooltips());
      return;
    } else {
      pager.style.display = "";
    }

    const start = page * pageSize;
    const end = start + pageSize;

    clearDummies();

    items.forEach((el, idx) => {
      el.style.display = idx >= start && idx < end ? "" : "none";
    });

    appendDummies(pageSize - items.slice(start, end).length);

    if (btnPrev) btnPrev.disabled = page === 0;
    if (btnNext) btnNext.disabled = page === totalPages - 1;

    pagesWrap.innerHTML = "";

    const windowSize = 7;
    let s = Math.max(0, page - Math.floor(windowSize / 2));
    let e = s + windowSize - 1;
    if (e > totalPages - 1) {
      e = totalPages - 1;
      s = Math.max(0, e - (windowSize - 1));
    }

    for (let p = s; p <= e; p++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn btn-sm btn-outline-secondary pager-page" + (p === page ? " is-active" : "");
      btn.textContent = String(p + 1);
      btn.addEventListener("click", () => {
        page = p;
        render();
      });
      pagesWrap.appendChild(btn);
    }

    requestAnimationFrame(() => applyEllipsisTooltips());
  };

  btnPrev?.addEventListener("click", () => {
    page--;
    render();
  });

  btnNext?.addEventListener("click", () => {
    page++;
    render();
  });

  render();
}