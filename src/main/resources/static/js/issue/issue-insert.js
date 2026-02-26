// /static/js/issue/issue-insert.js
(() => {
  const $ = (s) => document.querySelector(s);

  const form = $("#issueInsertForm");

  const createdView = $("#createdDateView");
  const dueView = $("#dueDateView");
  const createdAt = $("#createdAt");
  const dueAt = $("#dueAt");

  const priority = $("#priority");

  const projectText = $("#projectText");
  const projectCode = $("#projectCode");

  const typeText = $("#typeText");
  const typeCode = $("#typeCode");
  const typeEndAtView = $("#typeEndAtView");
  const typeStartAtView = $("#typeStartAtView");

  const parIssueText = $("#parIssueText");
  const parIssueCode = $("#parIssueCode");

  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");

  const fileInp = $("#uploadFile");
  const label = $("#selectedFileName");

  // 2개 제출 버튼
  const btnSaveContinue = $("#btnWlSaveContinue");
  const btnSaveClose = $("#btnWlSaveClose");

  const projectModalEl = $("#projectSelectModal");
  const assigneeModalEl = $("#assigneeSelectModal");
  const parIssueModalEl = $("#parIssueSelectModal");
  const typeModalEl = $("#typeSelectModal");

  const projectModal = projectModalEl
    ? new bootstrap.Modal(projectModalEl)
    : null;
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;
  const parIssueModal = parIssueModalEl
    ? new bootstrap.Modal(parIssueModalEl)
    : null;
  const typeModal = typeModalEl ? new bootstrap.Modal(typeModalEl) : null;

  const projectList = $("#projectModalList");
  const assigneeBox = $("#assigneeModalTree");

  const parIssueTreeEl = $("#parIssueModalTree");
  const typeTreeEl = $("#typeModalTree");

  const projectSearch = $("#projectModalSearch");
  const assigneeSearch = $("#assigneeModalSearch");
  const parIssueSearch = $("#parIssueModalSearch");
  const typeSearch = $("#typeModalSearch");

  const btnProject = $("#btnOpenProjectModal");
  const btnAssignee = $("#btnOpenAssigneeModal");
  const btnParIssue = $("#btnOpenParIssueModal");
  const btnType = $("#btnOpenTypeModal");

  const btnBack = $("#btnBack");
  const btnReset = $("#btnReset");

  // 상태 select (id가 statusCode)
  const statusSel = $("#statusCode");

  // 제출 기본 모드 (Enter로 submit되면 continue로 간주)
  let submitMode = "continue"; // "continue" | "close"

  const pad2 = (n) => String(n).padStart(2, "0");
  const toDate = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const toDT = (dateStr) => (dateStr ? `${dateStr}T00:00` : "");
  const addDays = (base, days) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };

  const PRIORITY_DAYS = { OA1: 2, OA2: 7, OA3: 14, OA4: 21 };
  const getPriorityDays = () => PRIORITY_DAYS[priority?.value] ?? null;

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

  const fetchJson = async (url, failMsg) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      showToast(failMsg);
      return null;
    }
    return res.json();
  };

  /* =========================================================
     등록 후 계속: 유지 필드 저장/복원(sessionStorage)
     ========================================================= */
  const KEEP_KEY = "issueInsert_keep_v1";

  const saveKeepFields = () => {
    try {
      const payload = {
        projectCode: projectCode?.value || "",
        projectText: projectText?.value || "",
        typeCode: typeCode?.value || "",
        typeText: typeText?.value || "",
        title: $("#title")?.value || "",
        statusCode: statusSel?.value || "",
        priority: priority?.value || "",
        typeStart: selectedTypeStartDate || "",
        typeEnd: selectedTypeEndDate || "",
      };
      sessionStorage.setItem(KEEP_KEY, JSON.stringify(payload));
    } catch (_) {}
  };

  const clearKeepFields = () => {
    try {
      sessionStorage.removeItem(KEEP_KEY);
    } catch (_) {}
  };

  const restoreKeepFields = () => {
    try {
      const raw = sessionStorage.getItem(KEEP_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;

      if (projectCode && data.projectCode) projectCode.value = data.projectCode;
      if (projectText && data.projectText) projectText.value = data.projectText;

      if (typeCode) typeCode.value = data.typeCode || "";
      if (typeText) typeText.value = data.typeText || "";

      const titleInp = $("#title");
      if (titleInp) titleInp.value = data.title || "";

      if (statusSel) statusSel.value = data.statusCode || "";
      if (priority) priority.value = data.priority || "";

      applyTypeDateLimit(data.typeStart || "", data.typeEnd || "");

      if (priority?.value) {
        setDueByPriority();
        syncDueHidden();
      }

      return data;
    } catch (_) {
      return null;
    }
  };

  const shouldRestore = () => {
    const params = new URLSearchParams(location.search);
    return params.get("keep") === "1";
  };

  /* =========================================================
     제출 버튼 분기(continue/close) -> hidden input으로 서버에 전달
     ========================================================= */
  const ensureAfterActionInput = () => {
    if (!form) return null;
    let el = form.querySelector('input[name="afterAction"]');
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = "afterAction";
      form.appendChild(el);
    }
    return el;
  };

  const setAfterAction = (mode) => {
    submitMode = mode === "close" ? "close" : "continue";
    const el = ensureAfterActionInput();
    if (el) el.value = submitMode;
  };

  /* =========================================================
     권한 상태 (2개 버튼 모두 반영)
     ========================================================= */
  const setCanCreate = (canWrite) => {
    const v = canWrite ? "true" : "false";
    if (btnSaveContinue) btnSaveContinue.dataset.canCreate = v;
    if (btnSaveClose) btnSaveClose.dataset.canCreate = v;
  };

  const refreshCanCreate = async (projCode) => {
    if (!projCode) {
      setCanCreate(false);
      return;
    }

    const data = await fetchJson(
      `/api/authority/issue/canWrite?projectCode=${encodeURIComponent(projCode)}`,
      "권한 정보를 불러오지 못했습니다.",
    );

    if (!data || data.success !== true) {
      setCanCreate(false);
      return;
    }
    setCanCreate(!!data.canWrite);
  };

  /* =========================================================
     날짜 / 마감기한 / 유형 시작/종료일 제한
     ========================================================= */
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

    if (selectedTypeStartDate && out < selectedTypeStartDate)
      out = selectedTypeStartDate;
    if (selectedTypeEndDate && out > selectedTypeEndDate)
      out = selectedTypeEndDate;
    return out;
  };

  const applyTypeDateLimit = (startDateStr, endDateStr) => {
    selectedTypeStartDate = startDateStr || "";
    selectedTypeEndDate = endDateStr || "";

    if (typeStartAtView)
      typeStartAtView.textContent = selectedTypeStartDate || "-";
    if (typeEndAtView) typeEndAtView.textContent = selectedTypeEndDate || "-";

    if (dueView) {
      if (selectedTypeStartDate) dueView.min = selectedTypeStartDate;
      else dueView.removeAttribute("min");

      if (selectedTypeEndDate) dueView.max = selectedTypeEndDate;
      else dueView.removeAttribute("max");
    }

    if (dueView?.value) {
      const before = dueView.value;
      const after = clampByTypeDateRange(before);

      if (before !== after) {
        dueView.value = after;
        syncDueHidden();
        showToast("마감기한이 유형 기간 범위를 벗어나 조정되었습니다.");
      }
    }
  };

  const setCreatedToday = () => {
    const str = toDate(new Date());
    if (createdView) createdView.value = str;
    if (createdAt) createdAt.value = toDT(str);
  };

  const setDueByPriority = () => {
    if (!dueView || !dueAt || !priority) return;

    const days = getPriorityDays();
    if (!days) {
      dueView.value = "";
      dueAt.value = "";
      return;
    }

    let dueStr = toDate(addDays(new Date(), days));
    dueStr = clampByTypeDateRange(dueStr);

    dueView.value = dueStr;
    dueAt.value = toDT(dueStr);
  };

  const syncDueHidden = () => {
    if (!dueView || !dueAt) return;

    if (!dueView.value) {
      if (!priority?.value) return;
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
     파일 표시
     ========================================================= */
  const renderSelectedFileName = () => {
    if (!label) return;
    const f = fileInp?.files?.[0];
    label.textContent = f ? `선택된 파일: ${f.name}` : "선택된 파일 없음";
  };

  /* =========================================================
     공용 렌더(프로젝트 리스트)
     ========================================================= */
  const renderList = (listEl, items, onPick) => {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = it.label;
      btn.addEventListener("click", () => onPick(it));
      listEl.appendChild(btn);
    });
  };

  /* =========================================================
     담당자 렌더
     ========================================================= */
  const renderAssigneeBox = (container, projectName, users, onPick) => {
    if (!container) return;
    container.innerHTML = "";

    if (!users || users.length === 0) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "결과가 없습니다.";
      container.appendChild(empty);
      return;
    }

    const group = document.createElement("div");
    group.className = "assignee-project-group";

    const header = document.createElement("div");
    header.className = "assignee-project-header";
    header.textContent = projectName || "참여자 목록";

    const content = document.createElement("div");
    content.className = "assignee-project-content";

    users.forEach((u) => {
      const item = document.createElement("div");
      item.className = "assignee-item";
      item.textContent = u.userName;

      item.addEventListener("click", () => onPick(u));
      content.appendChild(item);
    });

    group.appendChild(header);
    group.appendChild(content);
    container.appendChild(group);
  };

  /* =========================================================
     상위일감 선택/초기화 유틸
     ========================================================= */
  let parentTreeRootsCache = null;

  const clearParentIssueSelection = () => {
    if (parIssueText) parIssueText.value = "";
    if (parIssueCode) parIssueCode.value = "";
    if (parIssueSearch) parIssueSearch.value = "";
    if (parIssueTreeEl) parIssueTreeEl.innerHTML = "";
    parentTreeRootsCache = null;
  };

  const clearOnlyProjectDependents = () => {
    clearParentIssueSelection();

    if (assigneeText) assigneeText.value = "";
    if (assigneeCode) assigneeCode.value = "";
    if (assigneeSearch) assigneeSearch.value = "";

    assigneeCache = [];
    assigneeCacheProjectCode = "";
  };

  /* =========================================================
     유형 트리 렌더
     ========================================================= */
  const buildTypeTreeForJS = (serverData, pCode, pName) => {
    const convert = (node) => ({
      code: String(node.typeCode),
      name: node.typeName,
      startAt: node.startAt ?? node.start_at ?? null,
      endAt: node.endAt ?? node.end_at ?? null,
      children: (node.children || []).map(convert),
    });

    const roots = (serverData || []).map(convert);

    return [
      {
        code: String(pCode || ""),
        name: pName || "프로젝트",
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
      const pickedTypeName = node.name;
      const pickedTypeCode = String(node.code);

      const pickedStartDate = normalizeDateOnly(node.startAt);
      const pickedEndDate = normalizeDateOnly(node.endAt);

      typeText.value = pickedTypeName;
      typeCode.value = pickedTypeCode;

      clearParentIssueSelection();

      applyTypeDateLimit(pickedStartDate, pickedEndDate);
      if (priority?.value) setDueByPriority();

      if (typeSearch) typeSearch.value = "";
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

      row.classList.remove("is-open");
      childUl.style.display = "none";

      arrow.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = row.classList.toggle("is-open");
        childUl.style.display = open ? "block" : "none";
      });

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
      content.style.display = "block";

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

  /* =========================================================
     캐시
     ========================================================= */
  let projectCache = [];

  let typeCacheProjectCode = "";
  let typeRawCache = [];

  let assigneeCacheProjectCode = "";
  let assigneeCache = [];

  const ensureProjects = async () => {
    if (projectCache.length) return true;

    const data = await fetchJson(
      "/api/projects/modal/create",
      "프로젝트 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    projectCache = data.map((p) => ({
      value: String(p.projectCode),
      label: p.projectName,
    }));
    return true;
  };

  const ensureAssigneesByProject = async (projCode) => {
    if (!projCode) return false;

    if (assigneeCache.length && assigneeCacheProjectCode === String(projCode))
      return true;

    const data = await fetchJson(
      `/api/users/modal?projectCode=${encodeURIComponent(projCode)}`,
      "담당자 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    assigneeCache = Array.isArray(data) ? data : [];
    assigneeCacheProjectCode = String(projCode);
    return true;
  };

  const ensureTypesByProject = async (projCode) => {
    if (!projCode) return false;

    if (typeRawCache.length && typeCacheProjectCode === String(projCode))
      return true;

    const data = await fetchJson(
      `/api/types/modal/by-project?projectCode=${encodeURIComponent(projCode)}`,
      "유형 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    typeRawCache = Array.isArray(data) ? data : data.list || [];
    typeCacheProjectCode = String(projCode);
    return true;
  };

  /* =========================================================
     상위일감 모달
     ========================================================= */
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

  const renderParIssueTreeLikeTypeModal = (treeRoots) => {
    if (!parIssueTreeEl) return;

    parIssueTreeEl.innerHTML = "";

    if (!treeRoots || treeRoots.length === 0) {
      parIssueTreeEl.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    const groupWrapper = document.createElement("div");
    groupWrapper.className = "type-project-group";

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

    const createLeafRow = (node) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "type-item pi-item";

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

      row.addEventListener("click", (e) => {
        e.stopPropagation();

        if (parIssueText) parIssueText.value = node.title;
        if (parIssueCode) parIssueCode.value = node.id;

        if (parIssueSearch) parIssueSearch.value = "";
        parIssueModal?.hide();
      });

      li.appendChild(row);
      return li;
    };

    const createParentNode = (node) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "type-item pi-item pi-parent-item";

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
        childUl.appendChild(hasKids ? createParentNode(c) : createLeafRow(c));
      });

      row.classList.remove("is-open");
      childUl.style.display = "none";

      arrow.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = row.classList.toggle("is-open");
        childUl.style.display = open ? "block" : "none";
      });

      row.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (parIssueText) parIssueText.value = node.title;
        if (parIssueCode) parIssueCode.value = node.id;

        if (parIssueSearch) parIssueSearch.value = "";
        parIssueModal?.hide();
      });

      li.appendChild(row);
      li.appendChild(childUl);
      return li;
    };

    treeRoots.forEach((n) => {
      const hasKids = Array.isArray(n.children) && n.children.length > 0;
      rootUl.appendChild(hasKids ? createParentNode(n) : createLeafRow(n));
    });

    content.appendChild(rootUl);
    groupWrapper.appendChild(content);
    parIssueTreeEl.appendChild(groupWrapper);
  };

  const openParIssueModalTree = async () => {
    if (!parIssueModal) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }

    const tCode = typeCode?.value?.trim();
    if (!tCode) {
      showToast("유형을 먼저 선택해 주세요.");
      return;
    }

    const raw = await fetchJson(
      `/api/issues/parents?projectCode=${encodeURIComponent(projCode)}&typeCode=${encodeURIComponent(tCode)}`,
      "상위일감 목록을 불러오지 못했습니다.",
    );
    if (!raw) return;

    parentTreeRootsCache = raw;

    if (parIssueSearch) parIssueSearch.value = "";

    const tree = normalizeIssueTree(parentTreeRootsCache);
    renderParIssueTreeLikeTypeModal(tree);

    parIssueModal.show();
  };

  const refreshParIssueTree = () => {
    if (!parentTreeRootsCache) return;

    const tree = normalizeIssueTree(parentTreeRootsCache);
    const filtered = filterIssueTree(tree, parIssueSearch?.value);

    renderParIssueTreeLikeTypeModal(filtered);
  };

  /* =========================================================
     프로젝트 변경 시 의존 필드 초기화
     ========================================================= */
  const clearProjectDependentFields = () => {
    clearOnlyProjectDependents();

    if (typeText) typeText.value = "";
    if (typeCode) typeCode.value = "";

    applyTypeDateLimit("", "");

    typeRawCache = [];
    typeCacheProjectCode = "";
  };

  /* =========================================================
     모달 오픈/갱신
     ========================================================= */
  const openProjectModal = async () => {
    if (!projectModal || !projectList) return;
    if (!(await ensureProjects())) return;

    const q = (projectSearch?.value || "").trim().toLowerCase();
    const filtered = q
      ? projectCache.filter((p) => p.label.toLowerCase().includes(q))
      : projectCache;

    renderList(projectList, filtered, async (picked) => {
      const prev = projectCode?.value || "";

      projectText.value = picked.label;
      projectCode.value = picked.value;

      if (projectSearch) projectSearch.value = "";
      projectModal.hide();

      if (prev && prev !== picked.value) clearProjectDependentFields();
      await refreshCanCreate(picked.value);
    });

    projectModal.show();
  };

  const refreshProjectList = async () => {
    if (!projectList) return;
    if (!(await ensureProjects())) return;

    const q = (projectSearch?.value || "").trim().toLowerCase();
    const filtered = q
      ? projectCache.filter((p) => p.label.toLowerCase().includes(q))
      : projectCache;

    renderList(projectList, filtered, async (picked) => {
      const prev = projectCode?.value || "";

      projectText.value = picked.label;
      projectCode.value = picked.value;

      if (projectSearch) projectSearch.value = "";
      projectModal?.hide();

      if (prev && prev !== picked.value) clearProjectDependentFields();
      await refreshCanCreate(picked.value);
    });
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal || !assigneeBox) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }

    if (assigneeSearch) assigneeSearch.value = "";
    if (!(await ensureAssigneesByProject(projCode))) return;

    const projectName = projectText?.value?.trim() || "참여자 목록";
    renderAssigneeBox(assigneeBox, projectName, assigneeCache, (u) => {
      assigneeText.value = u.userName;
      assigneeCode.value = u.userCode;
      assigneeModal?.hide();
    });

    assigneeModal.show();
  };

  const refreshAssigneeBox = async () => {
    if (!assigneeBox) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      assigneeBox.innerHTML = "";
      const msg = document.createElement("div");
      msg.className = "text-muted";
      msg.textContent = "프로젝트를 먼저 선택해 주세요.";
      assigneeBox.appendChild(msg);
      return;
    }

    if (!(await ensureAssigneesByProject(projCode))) return;

    const q = (assigneeSearch?.value || "").trim().toLowerCase();
    const filtered = q
      ? assigneeCache.filter((u) =>
          (u.userName || "").toLowerCase().includes(q),
        )
      : assigneeCache;

    const projectName = projectText?.value?.trim() || "참여자 목록";
    renderAssigneeBox(assigneeBox, projectName, filtered, (u) => {
      assigneeText.value = u.userName;
      assigneeCode.value = u.userCode;
      assigneeModal?.hide();
    });
  };

  const openTypeModal = async () => {
    if (!typeModal || !typeTreeEl) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      showToast("프로젝트를 먼저 선택해 주세요.");
      return;
    }

    const projName = projectText?.value?.trim() || "";

    if (!(await ensureTypesByProject(projCode))) return;

    if (typeSearch) typeSearch.value = "";

    const treeData = buildTypeTreeForJS(typeRawCache, projCode, projName);
    renderTypeTree(treeData, typeTreeEl);
    typeModal.show();
  };

  const refreshTypeTree = async () => {
    if (!typeTreeEl) return;

    const projCode = projectCode?.value?.trim();
    if (!projCode) {
      typeTreeEl.innerHTML =
        '<div class="p-4 text-center text-muted">프로젝트를 먼저 선택해 주세요.</div>';
      return;
    }

    const projName = projectText?.value?.trim() || "";

    if (!(await ensureTypesByProject(projCode))) return;

    const treeData = buildTypeTreeForJS(typeRawCache, projCode, projName);
    const filtered = filterTypeTree(treeData, typeSearch?.value);

    renderTypeTree(filtered, typeTreeEl);
  };

  /* =========================================================
     이벤트 바인딩
     ========================================================= */
  btnProject?.addEventListener("click", openProjectModal);
  btnAssignee?.addEventListener("click", openAssigneeModal);
  btnType?.addEventListener("click", openTypeModal);
  btnParIssue?.addEventListener("click", openParIssueModalTree);

  projectSearch?.addEventListener("input", () => refreshProjectList());
  assigneeSearch?.addEventListener("input", () => refreshAssigneeBox());
  typeSearch?.addEventListener("input", () => refreshTypeTree());
  parIssueSearch?.addEventListener("input", refreshParIssueTree);

  priority?.addEventListener("change", () => {
    setDueByPriority();
    syncDueHidden();
  });

  dueView?.addEventListener("change", syncDueHidden);
  dueView?.addEventListener("input", () => {
    if (!dueView.value) syncDueHidden();
  });

  fileInp?.addEventListener("change", renderSelectedFileName);

  const withTs = (url) => {
    try {
      const u = new URL(url, location.origin);
      u.searchParams.set("_ts", String(Date.now()));
      return u.toString();
    } catch (_) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}_ts=${Date.now()}`;
    }
  };

  const safeBack = () => {
    const returnUrlEl = document.getElementById("issueReturnUrl");
    const returnUrl = (returnUrlEl?.value || "").trim();
    if (returnUrl.startsWith("/")) {
      location.replace(withTs(returnUrl));
      return;
    }

    // referrer 기준으로 분기
    const ref = document.referrer || "";

    if (ref.includes("/issueList")) return location.replace(withTs(ref));
    if (ref.includes("/kanbanboard")) return location.replace(withTs(ref));
    if (ref.includes("/ganttChart")) return location.replace(withTs(ref));
    if (ref.includes("/calendar")) return location.replace(withTs(ref));

    // 애매하면 목록으로
    location.replace(withTs("/issueList"));
  };

  btnBack?.addEventListener("click", safeBack);

  // 버튼 클릭 시 제출모드 세팅 (submit에서 e.submitter로 최종 확정하지만, 혹시 모를 경우 대비)
  btnSaveContinue?.addEventListener("click", () => {
    setAfterAction("continue");
  });

  btnSaveClose?.addEventListener("click", () => {
    setAfterAction("close");
  });

  btnReset?.addEventListener("click", () => {
    form?.reset();

    if (projectText) projectText.value = "";
    if (projectCode) projectCode.value = "";

    clearProjectDependentFields();

    setCreatedToday();
    setDueByPriority();
    renderSelectedFileName();

    setCanCreate(false);

    clearKeepFields();
    setAfterAction("continue");
  });

  form?.addEventListener("submit", (e) => {
    // 어떤 버튼으로 submit됐는지(Enter면 null일 수 있음)
    const submitter = e.submitter;

    if (submitter === btnSaveClose) setAfterAction("close");
    else if (submitter === btnSaveContinue) setAfterAction("continue");
    else setAfterAction(submitMode || "continue");

    if (createdAt && !createdAt.value) setCreatedToday();

    if (!projectCode.value) {
      e.preventDefault();
      showToast("프로젝트를 선택해 주세요.");
      return;
    }
    if (!$("#title")?.value.trim()) {
      e.preventDefault();
      showToast("제목을 입력해 주세요.");
      return;
    }
    if (!statusSel?.value) {
      e.preventDefault();
      showToast("상태를 선택해 주세요.");
      return;
    }
    if (!priority?.value) {
      e.preventDefault();
      showToast("우선순위를 선택해 주세요.");
      return;
    }

    syncDueHidden();

    if (!typeCode?.value) {
      e.preventDefault();
      showToast("유형을 선택해 주세요.");
      return;
    }

    if (
      selectedTypeStartDate &&
      dueView?.value &&
      dueView.value < selectedTypeStartDate
    ) {
      e.preventDefault();
      showToast("마감기한은 유형 시작일 이전으로 설정할 수 없습니다.");
      return;
    }

    if (
      selectedTypeEndDate &&
      dueView?.value &&
      dueView.value > selectedTypeEndDate
    ) {
      e.preventDefault();
      showToast("마감기한은 유형 종료일 이후로 설정할 수 없습니다.");
      return;
    }

    // 권한 체크: 실제 submit 버튼 기준(Enter면 continue 버튼 기준)
    const can =
      submitter?.dataset?.canCreate ??
      btnSaveContinue?.dataset?.canCreate ??
      "false";

    if (String(can) !== "true") {
      e.preventDefault();
      showToast("권한이 없습니다.");
      return;
    }

    // 최종: continue면 유지값 저장, close면 유지값 제거
    if (submitMode === "continue") saveKeepFields();
    else clearKeepFields();
  });

  /* =========================================================
     초기화
     ========================================================= */
  const init = async () => {
    setCreatedToday();
    renderSelectedFileName();
    setCanCreate(false);

    setAfterAction("continue");
    applyTypeDateLimit("", "");

    if (shouldRestore()) {
      restoreKeepFields();
      const url = new URL(location.href);
      url.searchParams.delete("keep");
      history.replaceState({}, "", url.toString());
    } else {
      clearKeepFields();
    }

    const cp = window.__CP__;
    if (!projectCode?.value?.trim() && cp?.projectCode) {
      projectCode.value = String(cp.projectCode);
      projectText.value = cp.projectName || "";
    }

    const p = projectCode?.value?.trim();
    if (p) await refreshCanCreate(p);

    syncDueHidden();
  };

  init();
})();
