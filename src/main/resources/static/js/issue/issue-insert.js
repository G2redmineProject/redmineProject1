(() => {
  const $ = (sel) => document.querySelector(sel);

  const form = $("#issueInsertForm");

  const createdDateView = $("#createdDateView");
  const dueDateView = $("#dueDateView");
  const createdAtHidden = $("#createdAt");
  const dueAtHidden = $("#dueAt");

  const prioritySel = $("#priority");

  const projectText = $("#projectText");
  const projectCode = $("#projectCode");
  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");

  const btnBack = $("#btnBack");
  const btnReset = $("#btnReset");

  // 모달
  const projectModalEl = $("#projectSelectModal");
  const assigneeModalEl = $("#assigneeSelectModal");
  const projectModal = projectModalEl ? new bootstrap.Modal(projectModalEl) : null;
  const assigneeModal = assigneeModalEl ? new bootstrap.Modal(assigneeModalEl) : null;

  const projectListEl = $("#projectModalList");
  const assigneeListEl = $("#assigneeModalList");
  const projectSearchEl = $("#projectModalSearch");
  const assigneeSearchEl = $("#assigneeModalSearch");

  // 캐시
  let projectCache = [];
  let userCache = [];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toDateValue(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function toLocalDateTimeValue(dateStr) {
    if (!dateStr) return "";
    return `${dateStr}T00:00`;
  }

  function addDays(baseDate, days) {
    const d = new Date(baseDate.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  // 우선순위: 라벨/코드 둘 다 대응
  // - select value가 "긴급" 같은 라벨이면 그대로 매칭
  // - select value가 "OA1" 코드면 코드로 매칭
  const priorityDaysByLabel = { 긴급: 2, 높음: 7, 보통: 14, 낮음: 21 };
  const priorityDaysByCode = { OA1: 2, OA2: 7, OA3: 14, OA4: 21 };

  function getPriorityDays(value) {
    if (!value) return null;
    return priorityDaysByLabel[value] ?? priorityDaysByCode[value] ?? null;
  }

  function setCreatedToday() {
    const today = new Date();
    const dateStr = toDateValue(today);
    if (createdDateView) createdDateView.value = dateStr;
    if (createdAtHidden) createdAtHidden.value = toLocalDateTimeValue(dateStr);
  }

  function applyDueByPriority() {
    if (!prioritySel || !dueDateView || !dueAtHidden) return;

    const days = getPriorityDays(prioritySel.value);

    // 우선순위가 선택되지 않았으면 마감기한 자동 세팅하지 않음
    if (!days) {
      dueDateView.value = "";
      dueAtHidden.value = "";
      return;
    }

    const base = new Date(); // 등록일 기준
    const due = addDays(base, days);
    const dueStr = toDateValue(due);
    dueDateView.value = dueStr;
    dueAtHidden.value = toLocalDateTimeValue(dueStr);
  }

  function syncDueHidden() {
    if (!dueAtHidden || !dueDateView) return;
    dueAtHidden.value = toLocalDateTimeValue(dueDateView.value);
  }

  function renderList(listEl, items, onPick) {
    listEl.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = item.label;
      btn.addEventListener("click", () => onPick(item));
      listEl.appendChild(btn);
    });
  }

  async function ensureProjectCache() {
    if (projectCache.length > 0) return true;

    const res = await fetch("/api/projects/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      alert("프로젝트 목록을 불러오지 못했습니다.");
      return false;
    }

    const projects = await res.json();
    projectCache = projects.map((p) => ({
      value: String(p.projectCode),
      label: p.projectName,
    }));

    return true;
  }

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
      value: String(u.userCode),
      label: u.userName,
    }));

    return true;
  }

  function filterItems(items, q) {
    if (!q) return items;
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) => String(it.label).toLowerCase().includes(qq));
  }

  async function openProjectModal() {
    if (!projectModal || !projectListEl) return;

    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = (projectSearchEl?.value || "").trim();
    const items = filterItems(projectCache, q);

    renderList(projectListEl, items, (picked) => {
      projectText.value = picked.label;
      projectCode.value = picked.value;
      if (projectSearchEl) projectSearchEl.value = "";
      projectModal.hide();
    });

    projectModal.show();
  }

  async function openAssigneeModal() {
    if (!assigneeModal || !assigneeListEl) return;

    const ok = await ensureUserCache();
    if (!ok) return;

    const q = (assigneeSearchEl?.value || "").trim();
    const items = filterItems(userCache, q);

    renderList(assigneeListEl, items, (picked) => {
      assigneeText.value = picked.label;
      assigneeCode.value = picked.value;
      if (assigneeSearchEl) assigneeSearchEl.value = "";
      assigneeModal.hide();
    });

    assigneeModal.show();
  }

  // 검색 입력 시: 모달을 다시 show하지 말고 리스트만 갱신
  async function refreshProjectListOnly() {
    if (!projectListEl) return;
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = (projectSearchEl?.value || "").trim();
    const items = filterItems(projectCache, q);

    renderList(projectListEl, items, (picked) => {
      projectText.value = picked.label;
      projectCode.value = picked.value;
      if (projectSearchEl) projectSearchEl.value = "";
      projectModal?.hide();
    });
  }

  async function refreshAssigneeListOnly() {
    if (!assigneeListEl) return;
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = (assigneeSearchEl?.value || "").trim();
    const items = filterItems(userCache, q);

    renderList(assigneeListEl, items, (picked) => {
      assigneeText.value = picked.label;
      assigneeCode.value = picked.value;
      if (assigneeSearchEl) assigneeSearchEl.value = "";
      assigneeModal?.hide();
    });
  }

  // 이벤트 바인딩
  const btnOpenProjectModal = $("#btnOpenProjectModal");
  if (btnOpenProjectModal) {
    btnOpenProjectModal.addEventListener("click", async () => {
      if (projectSearchEl) projectSearchEl.value = "";
      await openProjectModal();
    });
  }

  const btnOpenAssigneeModal = $("#btnOpenAssigneeModal");
  if (btnOpenAssigneeModal) {
    btnOpenAssigneeModal.addEventListener("click", async () => {
      if (assigneeSearchEl) assigneeSearchEl.value = "";
      await openAssigneeModal();
    });
  }

  if (projectSearchEl) {
    projectSearchEl.addEventListener("input", refreshProjectListOnly);
  }

  if (assigneeSearchEl) {
    assigneeSearchEl.addEventListener("input", refreshAssigneeListOnly);
  }

  if (prioritySel) {
    prioritySel.addEventListener("change", applyDueByPriority);
  }

  if (dueDateView) {
    dueDateView.addEventListener("change", syncDueHidden);
  }

  if (btnBack) {
    btnBack.addEventListener("click", () => history.back());
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (form) form.reset();

      projectText.value = "";
      projectCode.value = "";
      assigneeText.value = "";
      assigneeCode.value = "";

      setCreatedToday();
      applyDueByPriority();
    });
  }

  // submit 직전 hidden 값 보정 + 필수 체크
  if (form) {
    form.addEventListener("submit", (e) => {
      // createdAt 오늘
      if (createdAtHidden && !createdAtHidden.value) {
        setCreatedToday();
      }

      // dueAt 동기화
      if (dueDateView && dueAtHidden) {
        if (dueDateView.value) {
          syncDueHidden();
        } else {
          applyDueByPriority();
        }
      }

      // 프로젝트 필수
      if (!projectCode.value) {
        e.preventDefault();
        alert("프로젝트를 선택해 주세요.");
        return;
      }

      // 제목 필수
      const title = $("#title");
      if (!title || !title.value.trim()) {
        e.preventDefault();
        alert("제목을 입력해 주세요.");
        return;
      }

      // 상태 필수
      const statusCode = $("#statusCode");
      if (!statusCode || !statusCode.value) {
        e.preventDefault();
        alert("상태를 선택해 주세요.");
        return;
      }

      // 우선순위 필수
      if (!prioritySel || !prioritySel.value) {
        e.preventDefault();
        alert("우선순위를 선택해 주세요.");
        return;
      }
    });
  }

  // 초기 세팅
  setCreatedToday();
})();
