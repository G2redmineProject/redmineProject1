// /static/js/issue/issue-edit.js
(() => {
  const $ = (s) => document.querySelector(s);

  const form = $("#issueEditForm");

  const titleInp = $("#title");
  const descInp = $("#editor");

  const statusSel = $("#statusId");
  const prioritySel = $("#priority");
  const progressInp = $("#progress");

  const uploadFileInp = $("#uploadFile");

  const createdView = $("#createdDateView"); // readonly
  const dueView = $("#dueDateView");
  const startedView = $("#startedDateView");
  const resolvedView = $("#resolvedDateView");

  const createdAt = $("#createdAt");
  const dueAt = $("#dueAt");
  const startedAt = $("#startedAt");
  const resolvedAt = $("#resolvedAt");

  const btnBack = $("#btnBack");
  const btnReset = $("#btnReset");

  // --- 일감/프로젝트 정보 ---
  const issueCodeEl = $("#issueCode");

  const projectCodeEl = $("#projectCode");
  const projectTextEl = $("#projectText");

  // --- 상위일감 ---
  const parIssueText = $("#parIssueText");
  const parIssueCode = $("#parIssueCode");
  const btnOpenParIssueModal = $("#btnOpenParIssueModal");
  const btnClearParIssue = $("#btnClearParIssue");

  const parIssueModalEl = $("#parIssueSelectModal");
  const parIssueModal = parIssueModalEl
    ? new bootstrap.Modal(parIssueModalEl)
    : null;
  const parIssueSearchEl = $("#parIssueModalSearch");
  const parIssueTreeEl = $("#parIssueModalTree");

  const toDT = (d) => (d ? `${d}T00:00` : "");

  /* =========================================================
     Toast
     ========================================================= */
  const showToast = (message) => {
    const toastId = "commonToast";
    let toastEl = document.getElementById(toastId);

    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = toastId;
      toastEl.className = "toast align-items-center text-bg-dark border-0";
      toastEl.setAttribute("role", "alert");
      toastEl.setAttribute("aria-live", "assertive");
      toastEl.setAttribute("aria-atomic", "true");
      toastEl.style.position = "fixed";
      toastEl.style.right = "16px";
      toastEl.style.bottom = "16px";
      toastEl.style.zIndex = "1080";

      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body" id="commonToastBody"></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      document.body.appendChild(toastEl);
    }

    const bodyEl = document.getElementById("commonToastBody");
    if (bodyEl) bodyEl.textContent = message;

    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
    t.show();
  };

  let lastDueToastAt = 0;
  const showDueAutoToast = () => {
    const now = Date.now();
    if (now - lastDueToastAt < 1200) return;
    lastDueToastAt = now;
    showToast(
      "마감기한이 삭제되어 우선순위 기준으로 자동 설정되어 저장됩니다.",
    );
  };

  /* =========================================================
     날짜/우선순위 유틸
     ========================================================= */
  const pad2 = (n) => String(n).padStart(2, "0");
  const toDate = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const addDays = (base, days) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };

  const PRIORITY_DAYS = { OA1: 2, OA2: 7, OA3: 14, OA4: 21 };
  const getPriorityDays = () => PRIORITY_DAYS[prioritySel?.value] ?? null;

  const isBefore = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(`${a}T00:00:00`);
    const db = new Date(`${b}T00:00:00`);
    return da.getTime() < db.getTime();
  };

  const todayYmd = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
      now.getDate(),
    )}`;
  };

  const isOverdue = () => {
    const due = (dueView?.value || "").trim();
    if (!due) return false;
    return isBefore(due, todayYmd());
  };

  /* =========================================================
     공통 fetch
     ========================================================= */
  const fetchJson = async (url, failMsg) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      showToast(failMsg);
      return null;
    }
    return res.json();
  };

  /* =========================================================
     유형 시작/종료일 제한 (등록 화면과 동일)
     - dueDateView.min/max 적용(선택 방지)
     ========================================================= */
  const typeStartAtView = $("#typeStartAtView"); // HTML에 추가됨
  const typeEndAtView = $("#typeEndAtView");

  let selectedTypeStartDate = ""; // "YYYY-MM-DD"
  let selectedTypeEndDate = ""; // "YYYY-MM-DD"

  const normalizeDateOnly = (v) => {
    if (!v) return "";
    const s = String(v).trim();
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return toDate(d);
  };

  const clampByTypeDateRange = (dateStr) => {
    if (!dateStr) return dateStr;

    let out = dateStr;

    if (selectedTypeStartDate && out < selectedTypeStartDate) {
      out = selectedTypeStartDate;
    }
    if (selectedTypeEndDate && out > selectedTypeEndDate) {
      out = selectedTypeEndDate;
    }
    return out;
  };

  const applyTypeDateLimit = (startDateStr, endDateStr) => {
    selectedTypeStartDate = startDateStr || "";
    selectedTypeEndDate = endDateStr || "";

    if (typeStartAtView)
      typeStartAtView.textContent = selectedTypeStartDate || "-";
    if (typeEndAtView) typeEndAtView.textContent = selectedTypeEndDate || "-";

    // 선택 방지 (캘린더 min/max)
    if (dueView) {
      if (selectedTypeStartDate) dueView.min = selectedTypeStartDate;
      else dueView.removeAttribute("min");

      if (selectedTypeEndDate) dueView.max = selectedTypeEndDate;
      else dueView.removeAttribute("max");
    }

    // 이미 선택된 값이 범위 밖이면 자동 조정
    if (dueView?.value) {
      const before = dueView.value;
      const after = clampByTypeDateRange(before);

      if (before !== after) {
        dueView.value = after;
        syncDueWithPriority();
        showToast("마감기한이 유형 기간 범위를 벗어나 조정되었습니다.");
      }
    }
  };

  const setDueByPriority = () => {
    if (!dueView || !dueAt || !prioritySel) return;

    const days = getPriorityDays();
    if (!days) return;

    let dueStr = toDate(addDays(new Date(), days));
    dueStr = clampByTypeDateRange(dueStr);

    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  const syncDueWithPriority = () => {
    if (!dueView || !dueAt) return;

    if (!dueView.value) {
      if (!prioritySel?.value) return;
      showDueAutoToast();
      setDueByPriority();
      return;
    }

    if (selectedTypeStartDate && dueView.value < selectedTypeStartDate) {
      dueView.value = selectedTypeStartDate;
      showToast("마감기한은 유형 시작일 이전으로 설정할 수 없습니다.");
    }

    if (selectedTypeEndDate && dueView.value > selectedTypeEndDate) {
      dueView.value = selectedTypeEndDate;
      showToast("마감기한은 유형 종료일 이후로 설정할 수 없습니다.");
    }

    dueAt.value = toDT(dueView.value);
  };

  /* =========================================================
     초기값 백업
     ========================================================= */
  const typeText = $("#typeText");
  const getTypeCodeInput = () => {
    const list = document.querySelectorAll('input[name="typeCode"]');
    if (list.length === 0) return $("#typeCode");
    return list[list.length - 1];
  };
  const typeCode = getTypeCodeInput();

  const initial = {
    title: titleInp?.value || "",
    description: descInp?.value || "",
    statusId: statusSel?.value || "",
    priority: prioritySel?.value || "",
    progress: progressInp?.value || "",
    due: dueView?.value || "",
    started: startedView?.value || "",
    resolved: resolvedView?.value || "",
    assigneeName: $("#assigneeText")?.value || "",
    assigneeCode: $("#assigneeCode")?.value || "",
    parIssueText: parIssueText?.value || "",
    parIssueCode: parIssueCode?.value || "",
    parIssueNameEnabled: parIssueCode?.getAttribute("name") === "parIssueCode",
    typeText: typeText?.value || "",
    typeCode: typeCode?.value || "",
    projectCode: projectCodeEl?.value || "",
    projectText: projectTextEl?.value || "",
  };

  /* =========================================================
     hidden 날짜 동기화
     ========================================================= */
  const syncHiddenDates = () => {
    if (createdAt && createdView) createdAt.value = toDT(createdView.value);
    syncDueWithPriority();
    if (startedAt && startedView) startedAt.value = toDT(startedView.value);

    if (resolvedAt && resolvedView) {
      resolvedAt.value =
        statusSel?.value === "OB5" ? toDT(resolvedView.value) : "";
    }
  };

  /* =========================================================
     상태 UI 제어 (완료일: OB5에서만 입력 가능)
     ========================================================= */
  const toggleResolvedByStatus = () => {
    if (!resolvedView) return;
    const isDone = statusSel?.value === "OB5";
    resolvedView.disabled = !isDone;

    if (!isDone) resolvedView.value = "";
    if (!isDone && resolvedAt) resolvedAt.value = "";
  };

  let lastOverdueToastAt = 0;
  const blockProgressIfOverdue = (withToast = false) => {
    if (!progressInp) return false;
    if (!isOverdue()) return false;

    progressInp.value = "100";
    progressInp.min = "100";
    progressInp.max = "100";
    progressInp.readOnly = true;

    if (withToast) {
      const now = Date.now();
      if (now - lastOverdueToastAt >= 900) {
        lastOverdueToastAt = now;
        showToast("마감기한이 지나 진척도를 수정할 수 없습니다.");
      }
    }
    return true;
  };

  const setProgressByStatus = () => {
    if (!statusSel || !progressInp) return;

    if (blockProgressIfOverdue(false)) return;

    const s = statusSel.value;
    progressInp.readOnly = false;

    if (s === "OB1") {
      progressInp.value = "0";
      progressInp.min = "0";
      progressInp.max = "0";
      progressInp.readOnly = true;
      return;
    }

    if (s === "OB2") {
      progressInp.min = "0";
      progressInp.max = "90";
      let v = Number(progressInp.value);
      if (Number.isNaN(v)) v = 0;
      if (v < 0) v = 0;
      if (v > 90) v = 90;
      progressInp.value = String(v);
      return;
    }

    if (s === "OB3") {
      progressInp.value = "95";
      progressInp.min = "95";
      progressInp.max = "95";
      progressInp.readOnly = true;
      return;
    }

    if (s === "OB4") {
      progressInp.value = "50";
      progressInp.min = "50";
      progressInp.max = "50";
      progressInp.readOnly = true;
      return;
    }

    if (s === "OB5") {
      progressInp.value = "100";
      progressInp.min = "100";
      progressInp.max = "100";
      progressInp.readOnly = true;
      return;
    }

    progressInp.min = "0";
    progressInp.max = "100";
  };

  const clampProgress = () => {
    if (!statusSel || !progressInp) return;
    if (statusSel.value !== "OB2") return;

    let v = Number(progressInp.value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 90) v = 90;
    progressInp.value = String(v);
  };

  const onStatusChange = () => {
    const s = statusSel?.value || "";

    if (s && s !== "OB1" && !startedView?.value) {
      showToast("신규가 아닌 상태로 변경하려면 시작일을 먼저 등록해야 합니다.");
      statusSel.value = "OB1";
    }

    toggleResolvedByStatus();
    setProgressByStatus();
    syncHiddenDates();
  };

  /* =========================================================
     유형 모달 (프로젝트 고정)
     ========================================================= */
  const typeModalEl = $("#typeSelectModal");
  const typeModal = typeModalEl ? new bootstrap.Modal(typeModalEl) : null;

  const typeTreeEl = $("#typeModalTree");
  const typeSearchEl = $("#typeModalSearch");
  const btnOpenTypeModal = $("#btnOpenTypeModal");
  const btnClearType = $("#btnClearType"); // HTML에 없으면 null이어도 OK

  let typeRawCache = []; // 서버 원본(트리)
  let typeCacheProjectCode = "";

  const buildTypeTreeForJS = (serverData, projectCode, projectName) => {
    const convert = (node) => ({
      code: String(node.typeCode),
      name: node.typeName,

      // startAt/endAt 서버에서 내려오면 바로 사용
      startAt: node.startAt ?? node.start_at ?? node.typeStartAt ?? null,
      endAt: node.endAt ?? node.end_at ?? node.typeEndAt ?? null,

      children: (node.children || []).map(convert),
    });

    const roots = (serverData || []).map(convert);

    return [
      {
        code: String(projectCode || ""),
        name: projectName || "프로젝트",
        children: roots,
      },
    ];
  };

  const renderTypeTree = (projects, container) => {
    if (!container) return;
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    const makeArrow = (isParent) => {
      const arrow = document.createElement("span");
      arrow.className = isParent ? "ti-arrow is-parent" : "ti-arrow";
      return arrow;
    };

    const pickType = (node) => {
      if (typeText) typeText.value = node.name;
      if (typeCode) typeCode.value = String(node.code);

      const startDate = normalizeDateOnly(node.startAt);
      const endDate = normalizeDateOnly(node.endAt);

      applyTypeDateLimit(startDate, endDate);

      // 우선순위가 있는데 due가 비어있으면 자동 설정
      if (prioritySel?.value && !dueView?.value) setDueByPriority();

      syncHiddenDates();

      if (typeSearchEl) typeSearchEl.value = "";
      typeModal?.hide();
    };

    const createLeafRow = (node, depth) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "type-item ti-item";

      const indent = document.createElement("span");
      indent.className = "ti-indent";
      indent.style.width = `${depth * 18}px`;

      const arrow = makeArrow(false);

      const title = document.createElement("span");
      title.className = "ti-title";
      title.textContent = node.name;

      row.appendChild(indent);
      row.appendChild(arrow);
      row.appendChild(title);

      row.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickType(node);
      });

      li.appendChild(row);
      return li;
    };

    const createParentNode = (node, depth) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "type-item ti-item ti-parent-item";

      const indent = document.createElement("span");
      indent.className = "ti-indent";
      indent.style.width = `${depth * 18}px`;

      const arrow = makeArrow(true);

      const title = document.createElement("span");
      title.className = "ti-title";
      title.textContent = node.name;

      row.appendChild(indent);
      row.appendChild(arrow);
      row.appendChild(title);

      const childUl = document.createElement("ul");
      childUl.className = "ti-children-ul";

      (node.children || []).forEach((c) => {
        const hasKids = Array.isArray(c.children) && c.children.length > 0;
        childUl.appendChild(
          hasKids
            ? createParentNode(c, depth + 1)
            : createLeafRow(c, depth + 1),
        );
      });

      // 기본 닫힘
      row.classList.remove("is-open");
      childUl.style.display = "none";

      // (1) 화살표 클릭만 토글
      arrow.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = row.classList.toggle("is-open");
        childUl.style.display = open ? "block" : "none";
      });

      // (2) 행 클릭은 선택(부모도 선택)
      row.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickType(node);
      });

      li.appendChild(row);
      li.appendChild(childUl);
      return li;
    };

    projects.forEach((p) => {
      const groupWrapper = document.createElement("div");
      groupWrapper.className = "type-project-group";

      const header = document.createElement("div");
      header.className = "type-project-header active";
      header.textContent = p.name;

      const content = document.createElement("div");
      content.className = "type-project-content";
      content.style.display = "block"; // 수정화면은 프로젝트 고정이라 항상 펼침

      const rootUl = document.createElement("ul");
      rootUl.className = "ti-tree-root";

      (p.children || []).forEach((t) => {
        const hasKids = Array.isArray(t.children) && t.children.length > 0;
        rootUl.appendChild(
          hasKids ? createParentNode(t, 0) : createLeafRow(t, 0),
        );
      });

      content.appendChild(rootUl);
      groupWrapper.appendChild(header);
      groupWrapper.appendChild(content);
      container.appendChild(groupWrapper);
    });
  };

  const filterTypeTree = (projects, q) => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return projects;

    const filterNode = (node) => {
      const hit = (node.name || "").toLowerCase().includes(query);
      const kids = (node.children || []).map(filterNode).filter(Boolean);
      if (hit || kids.length) return { ...node, children: kids };
      return null;
    };

    return (projects || [])
      .map((p) => {
        const children = (p.children || []).map(filterNode).filter(Boolean);
        return { ...p, children };
      })
      .filter((p) => (p.children || []).length > 0);
  };

  const ensureTypes = async () => {
    const projCode = String(projectCodeEl?.value || "").trim();
    if (!projCode) {
      showToast("프로젝트 정보가 없어 유형을 불러올 수 없습니다.");
      return false;
    }

    if (typeRawCache.length && typeCacheProjectCode === projCode) return true;

    const data = await fetchJson(
      `/api/types/modal/by-project?projectCode=${encodeURIComponent(projCode)}`,
      "유형 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    typeRawCache = Array.isArray(data) ? data : data.list || [];
    typeCacheProjectCode = projCode;
    return true;
  };

  const refreshTypeTree = async () => {
    if (!typeTreeEl) return;

    const ok = await ensureTypes();
    if (!ok) return;

    const projCode = String(projectCodeEl?.value || "").trim();
    const projName = String(projectTextEl?.value || "").trim();

    const treeData = buildTypeTreeForJS(typeRawCache, projCode, projName);
    const filtered = filterTypeTree(treeData, typeSearchEl?.value);

    renderTypeTree(filtered, typeTreeEl);
  };

  const openTypeModal = async () => {
    if (!typeModal) return;
    if (typeSearchEl) typeSearchEl.value = "";
    await refreshTypeTree();
    typeModal.show();
  };

  const clearType = () => {
    if (typeText) typeText.value = "";
    if (typeCode) typeCode.value = "";
    applyTypeDateLimit("", "");
    syncHiddenDates();
  };

  const findTypeNodeByCode = (nodes, codeStr) => {
    const stack = Array.isArray(nodes) ? [...nodes] : [];
    while (stack.length) {
      const n = stack.shift();
      if (!n) continue;

      const code = String(n.typeCode ?? n.code ?? "");
      if (code && code === codeStr) return n;

      const kids = Array.isArray(n.children) ? n.children : [];
      if (kids.length) stack.unshift(...kids);
    }
    return null;
  };

  const applyTypeDateRangeFromCurrentTypeCode = async () => {
    const cur = String(typeCode?.value || "").trim();
    if (!cur) {
      applyTypeDateLimit("", "");
      return;
    }

    const ok = await ensureTypes();
    if (!ok) return;

    const node = findTypeNodeByCode(typeRawCache, cur);

    const startDate = normalizeDateOnly(
      node?.startAt ?? node?.start_at ?? node?.typeStartAt,
    );
    const endDate = normalizeDateOnly(
      node?.endAt ?? node?.end_at ?? node?.typeEndAt,
    );

    applyTypeDateLimit(startDate, endDate);
    syncHiddenDates();
  };

  const hydrateTypeTextIfEmpty = async () => {
    const cur = String(typeCode?.value || "").trim();
    if (!cur) return;
    if (!typeText) return;
    if (typeText.value) return;

    const ok = await ensureTypes();
    if (!ok) return;

    const node = findTypeNodeByCode(typeRawCache, cur);
    if (node) typeText.value = String(node.typeName || "").trim();
  };

  /* =========================================================
     담당자 모달 (리스트 렌더)
     ========================================================= */
  const assigneeModalEl = $("#assigneeSelectModal");
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;

  const assigneeTextEl = $("#assigneeText");
  const assigneeCodeEl = $("#assigneeCode");
  const btnOpenAssigneeModal = $("#btnOpenAssigneeModal");
  const assigneeListEl = $("#assigneeModalList");
  const assigneeSearchEl = $("#assigneeModalSearch");

  let userCache = [];
  let userCacheProjectCode = "";

  const ensureUserCache = async () => {
    const projCode = String(projectCodeEl?.value || "").trim();
    if (!projCode) {
      showToast("프로젝트 정보가 없습니다.");
      return false;
    }

    if (userCache.length && userCacheProjectCode === projCode) return true;

    const data = await fetchJson(
      `/api/users/modal?projectCode=${encodeURIComponent(projCode)}`,
      "사용자 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    userCache = (Array.isArray(data) ? data : []).map((u) => ({
      value: String(u.userCode),
      label: u.userName,
    }));
    userCacheProjectCode = projCode;

    return true;
  };

  const renderUsers = (items) => {
    if (!assigneeListEl) return;
    assigneeListEl.innerHTML = "";

    if (!items.length) {
      assigneeListEl.innerHTML =
        '<div class="text-muted">결과가 없습니다.</div>';
      return;
    }

    const group = document.createElement("div");
    group.className = "assignee-project-group";

    const header = document.createElement("div");
    header.className = "assignee-project-header";
    header.textContent = projectTextEl?.value?.trim() || "참여자 목록";

    const content = document.createElement("div");
    content.className = "assignee-project-content";

    items.forEach((u) => {
      const item = document.createElement("div");
      item.className = "assignee-item";
      item.textContent = u.label;

      item.addEventListener("click", () => {
        if (assigneeTextEl) assigneeTextEl.value = u.label;
        if (assigneeCodeEl) assigneeCodeEl.value = u.value;
        if (assigneeSearchEl) assigneeSearchEl.value = "";
        assigneeModal?.hide();
      });

      content.appendChild(item);
    });

    group.appendChild(header);
    group.appendChild(content);
    assigneeListEl.appendChild(group);
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal) return;

    const projCode = String(projectCodeEl?.value || "").trim();
    if (!projCode) {
      showToast("프로젝트 정보가 없습니다.");
      return;
    }

    const ok = await ensureUserCache();
    if (!ok) return;

    if (assigneeSearchEl) assigneeSearchEl.value = "";
    renderUsers(userCache);
    assigneeModal.show();
  };

  /* =========================================================
     상위일감 모달 (유형모달 톤 + 아코디언 + 정렬 고정)
     ========================================================= */
  let parentTreeRootsCache = null;

  const childrenSetFromTree = (roots, selfId) => {
    const set = new Set();
    if (!selfId) return set;

    const stack = Array.isArray(roots) ? [...roots] : [];
    let selfNode = null;

    while (stack.length) {
      const n = stack.shift();
      if (!n) continue;

      if (Number(n.issueCode) === Number(selfId)) {
        selfNode = n;
        break;
      }
      const kids = Array.isArray(n.children) ? n.children : [];
      if (kids.length) stack.unshift(...kids);
    }

    const walk = (node) => {
      const kids = Array.isArray(node?.children) ? node.children : [];
      kids.forEach((c) => {
        set.add(Number(c.issueCode));
        walk(c);
      });
    };

    if (selfNode) walk(selfNode);
    return set;
  };

  const buildForbiddenSet = (rawRoots, selfIdNum) => {
    const set = new Set();
    if (!selfIdNum) return set;

    set.add(Number(selfIdNum));
    const kids = childrenSetFromTree(rawRoots, selfIdNum);
    kids.forEach((v) => set.add(Number(v)));
    return set;
  };

  const normalizeIssueTree = (roots) => {
    const convert = (n) => ({
      id: String(n.issueCode),
      title: String(n.title ?? "").trim(),
      assignee: String(n.name ?? "미지정").trim(),
      children: (n.children || []).map(convert),
    });
    return (roots || []).map(convert);
  };

  const filterIssueTree = (nodes, q) => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return nodes;

    const filterNode = (node) => {
      const hitTitle = (node.title || "").toLowerCase().includes(query);
      const hitAssignee = (node.assignee || "").toLowerCase().includes(query);
      const kids = (node.children || []).map(filterNode).filter(Boolean);

      if (hitTitle || hitAssignee || kids.length)
        return { ...node, children: kids };
      return null;
    };

    return (nodes || []).map(filterNode).filter(Boolean);
  };

  const renderParIssueTreeLikeTypeModal = (treeRoots, forbiddenSet) => {
    if (!parIssueTreeEl) return;

    parIssueTreeEl.innerHTML = "";

    if (!treeRoots || treeRoots.length === 0) {
      parIssueTreeEl.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    const groupWrapper = document.createElement("div");
    groupWrapper.className = "type-project-group";

    // 헤더는 "유형명"이 있을 때만 표시(프로젝트명 안 뜨게)
    const typeName = String(typeText?.value || "").trim();
    if (typeName) {
      const header = document.createElement("div");
      header.className = "type-project-header active";
      header.textContent = typeName;
      groupWrapper.appendChild(header);
    }

    const content = document.createElement("div");
    content.className = "type-project-content";
    content.style.display = "block";

    const rootUl = document.createElement("ul");
    rootUl.className = "pi-tree-root";

    const makeArrow = (isParent) => {
      const arrow = document.createElement("span");
      arrow.className = isParent ? "pi-arrow is-parent" : "pi-arrow";
      return arrow;
    };

    const createLeafRow = (node, depth) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "type-item pi-item";
      row.dataset.depth = String(depth);

      const arrow = makeArrow(false);

      const title = document.createElement("span");
      title.className = "pi-title";
      title.textContent = node.title;

      const meta = document.createElement("span");
      meta.className = "pi-meta";
      meta.textContent = node.assignee;

      row.appendChild(arrow);
      row.appendChild(title);
      row.appendChild(meta);

      const isForbidden = forbiddenSet?.has(Number(node.id));
      if (isForbidden) row.classList.add("pi-disabled");

      row.addEventListener("click", (e) => {
        e.stopPropagation();

        if (isForbidden) {
          showToast(
            "자기 자신 또는 하위 일감은 상위일감으로 선택할 수 없습니다.",
          );
          return;
        }

        if (parIssueText) parIssueText.value = node.title;
        if (parIssueCode) {
          parIssueCode.value = node.id;
          parIssueCode.setAttribute("name", "parIssueCode");
        }

        parIssueModal?.hide();
      });

      li.appendChild(row);
      return li;
    };

    const createParentNode = (node, depth) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "type-item pi-item pi-parent-item";
      row.dataset.depth = String(depth);

      const arrow = makeArrow(true);

      const title = document.createElement("span");
      title.className = "pi-title";
      title.textContent = node.title;

      const meta = document.createElement("span");
      meta.className = "pi-meta";
      meta.textContent = node.assignee;

      row.appendChild(arrow);
      row.appendChild(title);
      row.appendChild(meta);

      const childUl = document.createElement("ul");
      childUl.className = "pi-children-ul";

      (node.children || []).forEach((c) => {
        const hasKids = Array.isArray(c.children) && c.children.length > 0;
        childUl.appendChild(
          hasKids
            ? createParentNode(c, depth + 1)
            : createLeafRow(c, depth + 1),
        );
      });

      // 기본 닫힘
      row.classList.remove("is-open");
      childUl.style.display = "none";

      const isForbidden = forbiddenSet?.has(Number(node.id));
      if (isForbidden) row.classList.add("pi-disabled");

      // (1) 화살표 클릭만 토글
      arrow.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = row.classList.toggle("is-open");
        childUl.style.display = open ? "block" : "none";
      });

      // (2) 행 클릭은 선택(부모도 선택) + 금지항목 처리
      row.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isForbidden) {
          showToast(
            "자기 자신 또는 하위 일감은 상위일감으로 선택할 수 없습니다.",
          );
          return;
        }

        if (parIssueText) parIssueText.value = node.title;
        if (parIssueCode) {
          parIssueCode.value = node.id;
          parIssueCode.setAttribute("name", "parIssueCode");
        }

        parIssueModal?.hide();
      });

      li.appendChild(row);
      li.appendChild(childUl);
      return li;
    };

    treeRoots.forEach((n) => {
      const hasKids = Array.isArray(n.children) && n.children.length > 0;
      rootUl.appendChild(
        hasKids ? createParentNode(n, 0) : createLeafRow(n, 0),
      );
    });

    content.appendChild(rootUl);
    groupWrapper.appendChild(content);
    parIssueTreeEl.appendChild(groupWrapper);
  };

  const openParIssueModal = async () => {
    if (!parIssueModal) return;

    const projectCode = String(projectCodeEl?.value || "").trim();
    if (!projectCode) {
      showToast("프로젝트 정보가 없습니다.");
      return;
    }

    const tCode = String(typeCode?.value || "").trim();
    if (!tCode) {
      showToast("유형을 먼저 선택해 주세요.");
      return;
    }

    const raw = await fetchJson(
      `/api/issues/parents?projectCode=${encodeURIComponent(projectCode)}&typeCode=${encodeURIComponent(tCode)}`,
      "상위일감 목록을 불러오지 못했습니다.",
    );
    if (!raw) return;

    parentTreeRootsCache = raw;

    const selfId = Number(issueCodeEl?.value);
    const forbidden = buildForbiddenSet(parentTreeRootsCache, selfId);

    if (parIssueSearchEl) parIssueSearchEl.value = "";

    const tree = normalizeIssueTree(parentTreeRootsCache);
    renderParIssueTreeLikeTypeModal(tree, forbidden);

    parIssueModal.show();
  };

  const refreshParIssueTree = () => {
    if (!parentTreeRootsCache) return;

    const selfId = Number(issueCodeEl?.value);
    const forbidden = buildForbiddenSet(parentTreeRootsCache, selfId);

    const tree = normalizeIssueTree(parentTreeRootsCache);
    const filtered = filterIssueTree(tree, parIssueSearchEl?.value);

    renderParIssueTreeLikeTypeModal(filtered, forbidden);
  };

  const clearParIssue = () => {
    if (!parIssueText || !parIssueCode) return;

    parIssueText.value = "";
    parIssueCode.value = "";
    parIssueCode.removeAttribute("name");
  };

  /* =========================================================
     검증
     ========================================================= */
  const validateBeforeSubmit = () => {
    const s = statusSel?.value || "";

    if (!typeCode?.value) {
      showToast("유형을 선택해 주세요.");
      btnOpenTypeModal?.focus();
      return false;
    }

    syncDueWithPriority();

    // 기간 범위 최종 방어
    if (
      selectedTypeStartDate &&
      dueView?.value &&
      dueView.value < selectedTypeStartDate
    ) {
      showToast("마감기한은 유형 시작일 이전으로 설정할 수 없습니다.");
      dueView?.focus();
      return false;
    }

    if (
      selectedTypeEndDate &&
      dueView?.value &&
      dueView.value > selectedTypeEndDate
    ) {
      showToast("마감기한은 유형 종료일 이후로 설정할 수 없습니다.");
      dueView?.focus();
      return false;
    }

    if (s && s !== "OB1" && !startedView?.value) {
      showToast("신규가 아닌 상태로 저장하려면 시작일을 입력해야 합니다.");
      startedView?.focus();
      return false;
    }

    if (s === "OB5" && !resolvedView?.value) {
      showToast("완료로 저장하려면 완료일을 입력해야 합니다.");
      resolvedView?.focus();
      return false;
    }

    if (resolvedView?.value && startedView?.value) {
      if (isBefore(resolvedView.value, startedView.value)) {
        showToast("완료일은 시작일보다 빠를 수 없습니다.");
        resolvedView?.focus();
        return false;
      }
    }

    if (s === "OB3") {
      const hasFile = uploadFileInp?.files?.length > 0;
      if (!hasFile) {
        showToast("해결로 저장하려면 첨부파일을 등록해야 합니다.");
        uploadFileInp?.focus();
        return false;
      }
    }

    if (s !== "OB5") {
      if (resolvedView) resolvedView.value = "";
      if (resolvedAt) resolvedAt.value = "";
    }

    if (isOverdue()) {
      if (progressInp) progressInp.value = "100";
    }

    if (s === "OB2") clampProgress();
    setProgressByStatus();
    syncHiddenDates();
    return true;
  };

  /* =========================================================
     bind
     ========================================================= */
  statusSel?.addEventListener("change", onStatusChange);

  prioritySel?.addEventListener("change", () => {
    setDueByPriority();
    syncHiddenDates();
    setProgressByStatus();
  });

  progressInp?.addEventListener("input", () => {
    if (blockProgressIfOverdue(true)) return;
    clampProgress();
    syncHiddenDates();
  });

  progressInp?.addEventListener("focus", () => {
    blockProgressIfOverdue(true);
  });

  dueView?.addEventListener("change", () => {
    syncHiddenDates();
    setProgressByStatus();
  });

  dueView?.addEventListener("input", () => {
    if (!dueView.value) {
      syncHiddenDates();
      setProgressByStatus();
    }
  });

  startedView?.addEventListener("change", () => {
    if (statusSel?.value && statusSel.value !== "OB1" && !startedView.value) {
      showToast("신규가 아닌 상태에서는 시작일을 비울 수 없습니다.");
      statusSel.value = "OB1";
    }
    onStatusChange();
  });

  resolvedView?.addEventListener("change", syncHiddenDates);

  btnOpenAssigneeModal?.addEventListener("click", openAssigneeModal);

  assigneeSearchEl?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = (assigneeSearchEl.value || "").trim().toLowerCase();
    renderUsers(
      q
        ? userCache.filter((u) => u.label.toLowerCase().includes(q))
        : userCache,
    );
  });

  btnOpenParIssueModal?.addEventListener("click", openParIssueModal);
  btnClearParIssue?.addEventListener("click", clearParIssue);
  parIssueSearchEl?.addEventListener("input", refreshParIssueTree);

  btnOpenTypeModal?.addEventListener("click", openTypeModal);
  btnClearType?.addEventListener("click", clearType);
  typeSearchEl?.addEventListener("input", refreshTypeTree);

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", async () => {
    if (titleInp) titleInp.value = initial.title;
    if (descInp) descInp.value = initial.description;

    if (statusSel) statusSel.value = initial.statusId;
    if (prioritySel) prioritySel.value = initial.priority;
    if (progressInp) progressInp.value = initial.progress;

    if (dueView) dueView.value = initial.due;
    if (startedView) startedView.value = initial.started;
    if (resolvedView) resolvedView.value = initial.resolved;

    const assigneeText2 = $("#assigneeText");
    const assigneeCode2 = $("#assigneeCode");
    if (assigneeText2) assigneeText2.value = initial.assigneeName;
    if (assigneeCode2) assigneeCode2.value = initial.assigneeCode;

    if (parIssueText) parIssueText.value = initial.parIssueText;
    if (parIssueCode) parIssueCode.value = initial.parIssueCode;

    if (typeText) typeText.value = initial.typeText;
    if (typeCode) typeCode.value = initial.typeCode;

    if (projectTextEl) projectTextEl.value = initial.projectText;
    if (projectCodeEl) projectCodeEl.value = initial.projectCode;

    userCache = [];
    userCacheProjectCode = "";
    typeRawCache = [];
    typeCacheProjectCode = "";
    parentTreeRootsCache = null;

    if (parIssueCode) {
      if (initial.parIssueNameEnabled && initial.parIssueCode)
        parIssueCode.setAttribute("name", "parIssueCode");
      else parIssueCode.removeAttribute("name");
    }

    await hydrateTypeTextIfEmpty();
    await applyTypeDateRangeFromCurrentTypeCode();

    onStatusChange();
    syncHiddenDates();
  });

  form?.addEventListener("submit", (e) => {
    if (!validateBeforeSubmit()) e.preventDefault();
  });

  /* =========================================================
     init
     ========================================================= */
  const init = async () => {
    setProgressByStatus();
    toggleResolvedByStatus();

    if (parIssueCode) {
      const hasValue = String(parIssueCode.value || "").trim().length > 0;
      if (!hasValue) parIssueCode.removeAttribute("name");
    }

    await hydrateTypeTextIfEmpty();
    await applyTypeDateRangeFromCurrentTypeCode();

    syncHiddenDates();
  };

  init();
})();
