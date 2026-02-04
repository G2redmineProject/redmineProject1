(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const pageSize = 10;

  const rowsAll = () => $$("#issueTbody tr.issueRow");
  const rowsVisible = () => rowsAll().filter((tr) => tr.dataset.filtered !== "1");

  const ui = {
    chkAll: $("#chkAll"),
    pagination: $("#issuePagination"),
    pageInfo: $("#issuePageInfo"),

    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),
    title: $("#filterTitle"),
    status: $("#filterStatus"),
    priority: $("#filterPriority"),

    assigneeText: $("#filterAssigneeText"),
    assigneeValue: $("#filterAssigneeValue"),

    creatorText: $("#filterCreatorText"),
    creatorValue: $("#filterCreatorValue"),

    createdAt: $("#filterCreatedAt"),
    dueAt: $("#filterDueAt"),

    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),

    btnProjectModal: $("#btnOpenProjectModal"),
    btnAssigneeModal: $("#btnOpenAssigneeModal"),
    btnCreatorModal: $("#btnOpenCreatorModal"),

    projectModalEl: $("#projectSelectModal"),
    assigneeModalEl: $("#assigneeSelectModal"),
    creatorModalEl: $("#creatorSelectModal"),

    projectModalList: $("#projectModalList"),
    assigneeModalList: $("#assigneeModalList"),
    creatorModalList: $("#creatorModalList"),

    projectModalSearch: $("#projectModalSearch"),
    assigneeModalSearch: $("#assigneeModalSearch"),
    creatorModalSearch: $("#creatorModalSearch"),
  };

  const STATUS_LABEL = {
    OB1: "신규",
    OB2: "진행",
    OB3: "해결",
    OB4: "반려",
    OB5: "완료",
  };

  const PRIORITY_LABEL = {
    OA1: "긴급",
    OA2: "높음",
    OA3: "보통",
    OA4: "낮음",
  };

  let currentPage = 1;

  const projectModal = new bootstrap.Modal(ui.projectModalEl);
  const assigneeModal = new bootstrap.Modal(ui.assigneeModalEl);
  const creatorModal = new bootstrap.Modal(ui.creatorModalEl);

  // 프로젝트 모달 캐시
  let projectCache = [];

  // 유저 모달(담당자/등록자) 캐시
  let userCache = [];

  function rowData(tr) {
    const d = tr.dataset;
    return {
      project: (d.project || "").trim(),
      projectCode: (d.projectCode || "").trim(),
      title: (d.title || "").trim(),
      status: (d.status || "").trim(),
      priority: (d.priority || "").trim(),

      // 이름(표시용)
      assignee: (d.assignee || "").trim(),
      creator: (d.creator || "").trim(),

      // 코드(필터용)
      assigneeCode: (d.assigneeCode || "").trim(),
      creatorCode: (d.creatorCode || "").trim(),

      created: (d.created || "").trim(),
      due: (d.due || "").trim(),
    };
  }

  function sameDay(rowDate, filterDate) {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return rowDate.slice(0, 10) === filterDate;
  }

  // 프로젝트 모달 렌더
  function renderProjectModalList(items) {
    ui.projectModalList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      ui.projectModalList.appendChild(empty);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = it.name;
      btn.addEventListener("click", () => {
        ui.projectText.value = it.name;
        ui.projectValue.value = String(it.code);
        projectModal.hide();
      });
      ui.projectModalList.appendChild(btn);
    });
  }

  async function openProjectModal() {
    ui.projectModalSearch.value = "";

    if (projectCache.length === 0) {
      const res = await fetch("/api/projects/modal", {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        alert("프로젝트 목록을 불러오지 못했습니다.");
        return;
      }

      const projects = await res.json();
      projectCache = projects.map((p) => ({
        code: p.projectCode,
        name: p.projectName,
      }));
    }

    renderProjectModalList(projectCache);
    projectModal.show();
  }

  // 유저 캐시 로드
  async function ensureUserCache() {
    if (userCache.length > 0) return true;

    const res = await fetch("/api/users/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      alert("사용자 목록을 불러오지 못했습니다.");
      return false;
    }

    const users = await res.json();
    userCache = users.map((u) => ({
      code: String(u.userCode),
      name: u.userName,
    }));
    return true;
  }

  // 유저 모달 렌더 (미할당 옵션 제거 버전)
  function renderUserModalList(listEl, items, onPick) {
    listEl.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((u) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = u.name;
      btn.addEventListener("click", () => onPick(u));
      listEl.appendChild(btn);
    });
  }

  async function openAssigneeModal() {
    ui.assigneeModalSearch.value = "";

    const ok = await ensureUserCache();
    if (!ok) return;

    renderUserModalList(ui.assigneeModalList, userCache, (picked) => {
      ui.assigneeText.value = picked.name;
      ui.assigneeValue.value = picked.code;
      assigneeModal.hide();
    });

    assigneeModal.show();
  }

  async function openCreatorModal() {
    ui.creatorModalSearch.value = "";

    const ok = await ensureUserCache();
    if (!ok) return;

    renderUserModalList(ui.creatorModalList, userCache, (picked) => {
      ui.creatorText.value = picked.name;
      ui.creatorValue.value = picked.code;
      creatorModal.hide();
    });

    creatorModal.show();
  }

  function bindProjectModalSearch() {
    ui.projectModalSearch.addEventListener("input", () => {
      const q = ui.projectModalSearch.value.trim().toLowerCase();
      const filtered = projectCache.filter((p) =>
        String(p.name).toLowerCase().includes(q)
      );
      renderProjectModalList(filtered);
    });
  }

  // 담당자/등록자 모달 검색
  function bindUserModalSearch() {
    ui.assigneeModalSearch.addEventListener("input", async () => {
      const ok = await ensureUserCache();
      if (!ok) return;

      const q = ui.assigneeModalSearch.value.trim().toLowerCase();
      const filtered = userCache.filter((u) =>
        String(u.name).toLowerCase().includes(q)
      );

      renderUserModalList(ui.assigneeModalList, filtered, (picked) => {
        ui.assigneeText.value = picked.name;
        ui.assigneeValue.value = picked.code;
        assigneeModal.hide();
      });
    });

    ui.creatorModalSearch.addEventListener("input", async () => {
      const ok = await ensureUserCache();
      if (!ok) return;

      const q = ui.creatorModalSearch.value.trim().toLowerCase();
      const filtered = userCache.filter((u) =>
        String(u.name).toLowerCase().includes(q)
      );

      renderUserModalList(ui.creatorModalList, filtered, (picked) => {
        ui.creatorText.value = picked.name;
        ui.creatorValue.value = picked.code;
        creatorModal.hide();
      });
    });
  }

  function applyFilters() {
    const pCode = ui.projectValue.value.trim();
    const t = ui.title.value.trim().toLowerCase();

    const sCode = ui.status.value.trim();
    const prCode = ui.priority.value.trim();
    const sLabel = sCode ? STATUS_LABEL[sCode] : "";
    const prLabel = prCode ? PRIORITY_LABEL[prCode] : "";

    const aCode = ui.assigneeValue.value.trim();
    const cCode = ui.creatorValue.value.trim();

    const created = ui.createdAt.value.trim();
    const due = ui.dueAt.value.trim();

    rowsAll().forEach((tr) => {
      const d = rowData(tr);
      let ok = true;

      if (pCode) {
        if (d.projectCode) {
          if (d.projectCode !== pCode) ok = false;
        } else {
          if (d.project !== ui.projectText.value.trim()) ok = false;
        }
      }

      if (t && !d.title.toLowerCase().includes(t)) ok = false;

      if (sLabel && d.status !== sLabel) ok = false;
      if (prLabel && d.priority !== prLabel) ok = false;

      if (aCode && (d.assigneeCode || "") !== aCode) ok = false;
      if (cCode && (d.creatorCode || "") !== cCode) ok = false;

      if (!sameDay(d.created, created)) ok = false;
      if (!sameDay(d.due, due)) ok = false;

      tr.dataset.filtered = ok ? "0" : "1";
    });

    currentPage = 1;
    ui.chkAll.checked = false;
    renderPage();
  }

  function resetFilters() {
    ui.projectText.value = "";
    ui.projectValue.value = "";
    ui.title.value = "";
    ui.status.value = "";
    ui.priority.value = "";
    ui.assigneeText.value = "";
    ui.assigneeValue.value = "";
    ui.creatorText.value = "";
    ui.creatorValue.value = "";
    ui.createdAt.value = "";
    ui.dueAt.value = "";

    rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
    ui.chkAll.checked = false;
    currentPage = 1;
    renderPage();
  }

  function renderPagination(totalPages) {
    ui.pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const makeItem = (label, page, disabled, active) => {
      const li = document.createElement("li");
      li.className = "page-item";
      if (disabled) li.classList.add("disabled");
      if (active) li.classList.add("active");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-link";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        if (disabled) return;
        currentPage = page;
        ui.chkAll.checked = false;
        renderPage();
      });

      li.appendChild(btn);
      return li;
    };

    ui.pagination.appendChild(
      makeItem("이전", Math.max(1, currentPage - 1), currentPage === 1, false)
    );

    for (let p = 1; p <= totalPages; p++) {
      ui.pagination.appendChild(makeItem(String(p), p, false, p === currentPage));
    }

    ui.pagination.appendChild(
      makeItem("다음", Math.min(totalPages, currentPage + 1), currentPage === totalPages, false)
    );
  }

  function renderPage() {
    const visible = rowsVisible();
    const total = visible.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    rowsAll().forEach((tr) => {
      tr.style.display = "none";
    });

    visible.slice(start, end).forEach((tr) => {
      tr.style.display = "";
    });

    renderPagination(totalPages);

    if (ui.pageInfo) {
      const from = total === 0 ? 0 : start + 1;
      const to = Math.min(end, total);
      ui.pageInfo.textContent = `${from}-${to} / ${total}`;
    }
  }

  function getCurrentPageRows() {
    return rowsAll().filter((tr) => tr.style.display !== "none");
  }

  function setCurrentPageChecks(checked) {
    getCurrentPageRows().forEach((tr) => {
      const cb = tr.querySelector(".row-check");
      if (cb) cb.checked = checked;
    });
  }

  function syncChkAllState() {
    const cbs = getCurrentPageRows()
      .map((tr) => tr.querySelector(".row-check"))
      .filter(Boolean);

    if (cbs.length === 0) {
      ui.chkAll.checked = false;
      return;
    }

    ui.chkAll.checked = cbs.every((cb) => cb.checked);
  }

  ui.btnApply.addEventListener("click", applyFilters);
  ui.btnReset.addEventListener("click", resetFilters);

  ui.btnProjectModal.addEventListener("click", openProjectModal);
  ui.btnAssigneeModal.addEventListener("click", openAssigneeModal);
  ui.btnCreatorModal.addEventListener("click", openCreatorModal);

  bindProjectModalSearch();
  bindUserModalSearch();

  ui.chkAll.addEventListener("change", (e) => {
    setCurrentPageChecks(e.target.checked);
  });

  $("#issueTbody").addEventListener("change", (e) => {
    if (e.target && e.target.classList.contains("row-check")) {
      syncChkAllState();
    }
  });

  ["#filterTitle", "#filterProjectText", "#filterAssigneeText", "#filterCreatorText"].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });
  });

  const btnIssueCreate = document.querySelector("#btnIssueCreate");
  if (btnIssueCreate) {
    btnIssueCreate.addEventListener("click", () => {
      window.location.href = "/issueInsert";
    });
  }
  
  const btnIssueDelete = document.querySelector("#btnIssueDelete");
  const deleteForm = document.querySelector("#issueDeleteForm");

  if (btnIssueDelete && deleteForm) {
    btnIssueDelete.addEventListener("click", () => {
      const checked = Array.from(document.querySelectorAll(".row-check:checked"))
        .map((cb) => cb.value)
        .filter((v) => v && v.trim() !== "");

      if (checked.length === 0) {
        alert("삭제할 일감을 선택해 주세요.");
        return;
      }

      if (!confirm(`${checked.length}건을 삭제할까요?`)) return;

      // 기존 hidden 제거 후 다시 생성
      deleteForm.innerHTML = "";

      checked.forEach((code) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "issueCodes"; // 컨트롤러에서 받을 파라미터명
        input.value = code;
        deleteForm.appendChild(input);
      });

      deleteForm.submit();
    });
  }



  // 초기 화면
  rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
  renderPage();
})();
