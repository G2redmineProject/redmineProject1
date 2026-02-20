// /js/issue/issue-list.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const pageSize = 10;
  let page = 1;

  const ui = {
    tbody: $("#issueTbody"),
    pagination: $("#issuePagination"),
    pageInfo: $("#issuePageInfo"),

    filterForm: $("#issueFilterForm"),

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
    typeText: $("#filterTypeText"),
    typeValue: $("#filterTypeValue"),

    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),

    btnProjectModal: $("#btnOpenProjectModal"),
    btnAssigneeModal: $("#btnOpenAssigneeModal"),
    btnCreatorModal: $("#btnOpenCreatorModal"),
    btnTypeModal: $("#btnOpenTypeModal"),

    projectModalEl: $("#projectSelectModal"),
    assigneeModalEl: $("#assigneeSelectModal"),
    creatorModalEl: $("#creatorSelectModal"),
    typeModalEl: $("#typeSelectModal"),

    projectModalList: $("#projectModalList"),
    assigneeModalList: $("#assigneeModalTree"),
    creatorModalList: $("#creatorModalTree"),
    typeModalTree: $("#typeModalTree"),

    projectModalSearch: $("#projectModalSearch"),
    assigneeModalSearch: $("#assigneeModalSearch"),
    creatorModalSearch: $("#creatorModalSearch"),
    typeModalSearch: $("#typeModalSearch"),

    btnCreate: $("#btnIssueCreate"),
  };

  if (!ui.tbody) return;

  // form submit 자체 방지 (원래 코드 유지)
  ui.filterForm?.addEventListener("submit", (e) => e.preventDefault());

  // -------------------------
  // 목록/페이지네이션 (원래 코드 유지)
  // -------------------------
  const rows = () => $$("#issueTbody tr.issueRow");
  const visibleRows = () => rows().filter((tr) => tr.dataset.filtered !== "1");

  const sameDay = (rowDate, filterDate) => {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return rowDate.slice(0, 10) === filterDate;
  };

  const getRow = (tr) => {
    const d = tr.dataset;
    return {
      issueCode: (d.issueCode || "").trim(),
      project: (d.project || "").trim(),
      projectCode: (d.projectCode || "").trim(),
      title: (d.title || "").trim().toLowerCase(),
      status: (d.status || "").trim(),
      priority: (d.priority || "").trim(),
      assigneeCode: (d.assigneeCode || "").trim(),
      creatorCode: (d.creatorCode || "").trim(),
      created: (d.created || "").trim(),
      due: (d.due || "").trim(),
      typeCode: (d.typeCode || "").trim(),
    };
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

  const renderPagination = (totalPages) => {
    ui.pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const addBtn = (label, nextPage, disabled, active) => {
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
        page = nextPage;
        render();
        closeMenusHard(); // 추가: 페이지 바뀌면 메뉴 닫기
      });

      li.appendChild(btn);
      ui.pagination.appendChild(li);
    };

    addBtn("이전", Math.max(1, page - 1), page === 1, false);
    for (let p = 1; p <= totalPages; p++)
      addBtn(String(p), p, false, p === page);
    addBtn("다음", Math.min(totalPages, page + 1), page === totalPages, false);
  };

  const render = () => {
    const list = visibleRows();
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    rows().forEach((tr) => (tr.style.display = "none"));

    const pageRows = list.slice(start, end);
    pageRows.forEach((tr, idx) => {
      tr.style.display = "";
      const noCell = tr.querySelector(".col-no");
      if (noCell) noCell.textContent = String(start + idx + 1);
    });

    renderPagination(totalPages);

    if (ui.pageInfo) {
      const from = total === 0 ? 0 : start + 1;
      const to = Math.min(end, total);
      ui.pageInfo.textContent = `${from}-${to} / ${total}`;
    }
  };

  // 조회 버튼 눌렀을 때만 필터 적용 (원래 코드 유지)
  const applyFiltersClient = () => {
    const pCode = ui.projectValue?.value?.trim() || "";
    const pName = ui.projectText?.value?.trim() || "";
    const title = ui.title?.value?.trim()?.toLowerCase() || "";
    const tCode = ui.typeValue?.value?.trim() || "";
    const sCode = ui.status?.value?.trim() || "";
    const prCode = ui.priority?.value?.trim() || "";
    const sLabel = sCode ? STATUS_LABEL[sCode] : "";
    const prLabel = prCode ? PRIORITY_LABEL[prCode] : "";
    const aCode = ui.assigneeValue?.value?.trim() || "";
    const cCode = ui.creatorValue?.value?.trim() || "";
    const created = ui.createdAt?.value?.trim() || "";
    const due = ui.dueAt?.value?.trim() || "";

    rows().forEach((tr) => {
      const d = getRow(tr);
      let ok = true;

      if (pCode)
        ok =
          ok && (d.projectCode ? d.projectCode === pCode : d.project === pName);
      if (title) ok = ok && d.title.includes(title);
      if (tCode) ok = ok && d.typeCode === tCode;
      if (sLabel) ok = ok && d.status === sLabel;
      if (prLabel) ok = ok && d.priority === prLabel;
      if (aCode) ok = ok && d.assigneeCode === aCode;
      if (cCode) ok = ok && d.creatorCode === cCode;

      ok = ok && sameDay(d.created, created);
      ok = ok && sameDay(d.due, due);

      tr.dataset.filtered = ok ? "0" : "1";
    });

    page = 1;
    render();
    closeMenusHard(); // 추가: 조회 후 메뉴 닫기
  };

  // -------------------------
  // 토스트 (원래 코드 유지)
  // -------------------------
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

    bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 }).show();
  };

  const renderListButtons = (listEl, items, onPick) => {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!items.length) {
      const div = document.createElement("div");
      div.className = "text-muted";
      div.textContent = "결과가 없습니다.";
      listEl.appendChild(div);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = it.name;
      btn.addEventListener("click", () => onPick(it));
      listEl.appendChild(btn);
    });
  };

  // -------------------------
  // 모달 인스턴스 (원래 코드 유지)
  // -------------------------
  const projectModal = ui.projectModalEl
    ? new bootstrap.Modal(ui.projectModalEl)
    : null;
  const assigneeModal = ui.assigneeModalEl
    ? new bootstrap.Modal(ui.assigneeModalEl)
    : null;
  const creatorModal = ui.creatorModalEl
    ? new bootstrap.Modal(ui.creatorModalEl)
    : null;
  const typeModal = ui.typeModalEl ? new bootstrap.Modal(ui.typeModalEl) : null;

  // -------------------------
  // 캐시 (원래 코드 유지)
  // -------------------------
  let projectCache = [];
  let assigneeCache = [];
  let creatorCache = [];
  let typeCache = [];

  const ensureProjectCache = async () => {
    if (projectCache.length) return true;

    const res = await fetch("/api/projects/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("프로젝트 목록을 불러오지 못했습니다.");
      return false;
    }

    projectCache = (await res.json()).map((p) => ({
      code: String(p.projectCode),
      name: p.projectName,
    }));

    return true;
  };

  const ensureAssigneeCache = async () => {
    if (assigneeCache.length) return true;

    const res = await fetch("/api/users/modal/assignees");
    if (!res.ok) {
      showToast("담당자 목록을 불러오지 못했습니다.");
      return false;
    }

    assigneeCache = await res.json();
    return true;
  };

  const ensureCreatorCache = async () => {
    if (creatorCache.length) return true;

    const res = await fetch("/api/users/modal/creators");
    if (!res.ok) {
      showToast("등록자 목록을 불러오지 못했습니다.");
      return false;
    }

    creatorCache = await res.json();
    return true;
  };

  const ensureTypeCache = async () => {
    if (typeCache.length) return true;

    const res = await fetch("/api/types/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("유형 목록을 불러오지 못했습니다.");
      return false;
    }

    typeCache = await res.json();
    return true;
  };

  // -------------------------
  // 프로젝트 모달 (원래 코드 유지)
  // -------------------------
  const openProjectModal = async () => {
    if (!projectModal) return;

    if (ui.projectModalSearch) ui.projectModalSearch.value = "";
    const ok = await ensureProjectCache();
    if (!ok) return;

    renderListButtons(ui.projectModalList, projectCache, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;

      // 프로젝트 변경 시 의존 필드 초기화
      ui.typeText.value = "";
      ui.typeValue.value = "";
      ui.assigneeText.value = "";
      ui.assigneeValue.value = "";
      ui.creatorText.value = "";
      ui.creatorValue.value = "";

      projectModal.hide();
    });

    projectModal.show();
    closeMenusHard(); // 추가: 모달 열 때 메뉴 닫기
  };

  ui.projectModalSearch?.addEventListener("input", async () => {
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = ui.projectModalSearch.value.trim().toLowerCase();

    renderListButtons(
      ui.projectModalList,
      projectCache.filter((p) => p.name.toLowerCase().includes(q)),
      (picked) => {
        ui.projectText.value = picked.name;
        ui.projectValue.value = picked.code;

        // 검색으로 골라도 동일하게 의존 필드 초기화
        ui.typeText.value = "";
        ui.typeValue.value = "";
        ui.assigneeText.value = "";
        ui.assigneeValue.value = "";
        ui.creatorText.value = "";
        ui.creatorValue.value = "";

        projectModal?.hide();
      },
    );
  });

  // -------------------------
  // 사용자(담당자/등록자) 모달: 트리 + 프로젝트 필터 + 검색 (원래 코드 유지)
  // -------------------------
  const renderUserTree = (projects, container, pickHandler) => {
    if (!container) return;
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    projects.forEach((p) => {
      const groupWrapper = document.createElement("div");
      groupWrapper.className = "type-project-group";

      const header = document.createElement("div");
      header.className = "type-project-header";
      header.textContent = p.projectName;

      const content = document.createElement("div");
      content.className = "type-project-content";
      content.style.display = "none";

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";

        document
          .querySelectorAll(".type-project-content")
          .forEach((el) => (el.style.display = "none"));
        document
          .querySelectorAll(".type-project-header")
          .forEach((el) => el.classList.remove("active"));

        if (!isOpen) {
          content.style.display = "block";
          header.classList.add("active");
        }
      });

      const ul = document.createElement("ul");
      (p.children || []).forEach((u) => {
        const li = document.createElement("li");
        const btn = document.createElement("div");
        btn.className = "type-item";
        btn.textContent = u.userName;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          pickHandler(u, p.projectCode, p.projectName);
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });

      content.appendChild(ul);
      groupWrapper.appendChild(header);
      groupWrapper.appendChild(content);
      container.appendChild(groupWrapper);
    });
  };

  const filterUserTree = (projects, keyword) => {
    if (!keyword || !keyword.trim()) return projects;

    const q = keyword.trim().toLowerCase();
    const result = [];

    projects.forEach((p) => {
      const matchedUsers = (p.children || []).filter((u) => {
        const name = (u.userName || "").toLowerCase().trim();
        return name.includes(q);
      });

      if (matchedUsers.length > 0) {
        result.push({
          projectCode: p.projectCode,
          projectName: p.projectName,
          children: matchedUsers,
        });
      }
    });

    return result;
  };

  const openUserModal = async (mode) => {
    const modal = mode === "assignee" ? assigneeModal : creatorModal;
    const listEl =
      mode === "assignee" ? ui.assigneeModalList : ui.creatorModalList;
    const searchEl =
      mode === "assignee" ? ui.assigneeModalSearch : ui.creatorModalSearch;

    if (!modal) return;
    if (searchEl) searchEl.value = "";

    const ok =
      mode === "assignee"
        ? await ensureAssigneeCache()
        : await ensureCreatorCache();
    if (!ok) return;

    const cache = mode === "assignee" ? assigneeCache : creatorCache;

    // 프로젝트 선택 시 해당 프로젝트만 보여주기
    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? cache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : cache;

    renderUserTree(
      projectFiltered,
      listEl,
      (picked, projectCode, projectName) => {
        if (mode === "assignee") {
          ui.assigneeText.value = picked.userName;
          ui.assigneeValue.value = picked.userCode;
        } else {
          ui.creatorText.value = picked.userName;
          ui.creatorValue.value = picked.userCode;
        }

        // 프로젝트 미선택 상태라면 자동 설정
        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        modal.hide();
      },
    );

    modal.show();
    closeMenusHard(); // 추가: 모달 열 때 메뉴 닫기
  };

  ui.assigneeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureAssigneeCache();
    if (!ok) return;

    const q = ui.assigneeModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? assigneeCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : assigneeCache;

    const filtered = filterUserTree(projectFiltered, q);

    renderUserTree(
      filtered,
      ui.assigneeModalList,
      (picked, projectCode, projectName) => {
        ui.assigneeText.value = picked.userName;
        ui.assigneeValue.value = picked.userCode;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        assigneeModal?.hide();
      },
    );
  });

  ui.creatorModalSearch?.addEventListener("input", async () => {
    const ok = await ensureCreatorCache();
    if (!ok) return;

    const q = ui.creatorModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";
    const projectFiltered = selectedProjectCode
      ? creatorCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : creatorCache;

    const filtered = filterUserTree(projectFiltered, q);

    renderUserTree(
      filtered,
      ui.creatorModalList,
      (picked, projectCode, projectName) => {
        ui.creatorText.value = picked.userName;
        ui.creatorValue.value = picked.userCode;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
        }

        creatorModal?.hide();
      },
    );
  });

  // -------------------------
  // 타입 모달: 프로젝트 그룹 아코디언 + 트리 + 프로젝트 선택 필터 + 검색 (원래 코드 유지)
  // -------------------------
  const buildTypeTreeForJS = (serverData) => {
    const projectMap = {};

    const convertType = (type, projectCode, projectName) => ({
      code: String(type.typeCode),
      name: type.typeName,
      projectCode,
      projectName,
      children: (type.children || []).map((child) =>
        convertType(child, projectCode, projectName),
      ),
    });

    (serverData || []).forEach((type) => {
      const pCode = String(type.projectCode);
      const pName = type.projectName || "기타 프로젝트";

      if (!projectMap[pCode]) {
        projectMap[pCode] = { code: pCode, name: pName, children: [] };
      }

      // 최상위 유형만 추가
      if (!type.parTypeCode) {
        projectMap[pCode].children.push(convertType(type, pCode, pName));
      }
    });

    return Object.values(projectMap).filter((p) => p.children.length > 0);
  };

  const renderTypeTree = (items, container) => {
    if (!container) return;
    container.innerHTML = "";

    const createNode = (type) => {
      const li = document.createElement("li");

      const div = document.createElement("div");
      div.className = "type-item";
      div.textContent = type.name;
      div.addEventListener("click", (e) => {
        e.stopPropagation();

        ui.typeText.value = type.name;
        ui.typeValue.value = type.code;

        // 유형 선택 시 프로젝트 자동 설정
        if (type.projectCode && type.projectName) {
          ui.projectValue.value = type.projectCode;
          ui.projectText.value = type.projectName;
        }

        typeModal?.hide();
      });

      li.appendChild(div);

      if (type.children && type.children.length > 0) {
        const ul = document.createElement("ul");
        type.children.forEach((c) => ul.appendChild(createNode(c)));
        li.appendChild(ul);
      }

      return li;
    };

    if (!items || items.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted">결과가 없습니다.</div>';
      return;
    }

    items.forEach((p) => {
      const groupWrapper = document.createElement("div");
      groupWrapper.className = "type-project-group";

      const projHeader = document.createElement("div");
      projHeader.className = "type-project-header";
      projHeader.textContent = p.name;
      groupWrapper.appendChild(projHeader);

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "type-project-content";
      contentWrapper.style.display = "none";

      projHeader.addEventListener("click", () => {
        const isOpen = contentWrapper.style.display === "block";

        document
          .querySelectorAll(".type-project-content")
          .forEach((el) => (el.style.display = "none"));
        document
          .querySelectorAll(".type-project-header")
          .forEach((el) => el.classList.remove("active"));

        if (!isOpen) {
          contentWrapper.style.display = "block";
          projHeader.classList.add("active");
        } else {
          contentWrapper.style.display = "none";
          projHeader.classList.remove("active");
        }
      });

      if (p.children && p.children.length > 0) {
        const rootUl = document.createElement("ul");
        p.children.forEach((t) => rootUl.appendChild(createNode(t)));
        contentWrapper.appendChild(rootUl);
      }

      groupWrapper.appendChild(contentWrapper);
      container.appendChild(groupWrapper);
    });
  };

  const openTypeModal = async () => {
    if (!typeModal) return;

    if (ui.typeModalSearch) ui.typeModalSearch.value = "";
    const ok = await ensureTypeCache();
    if (!ok) return;

    const selectedProjectCode = ui.projectValue?.value || "";
    const treeData = buildTypeTreeForJS(typeCache);
    const filteredTreeData = selectedProjectCode
      ? treeData.filter((p) => String(p.code) === String(selectedProjectCode))
      : treeData;

    renderTypeTree(filteredTreeData, ui.typeModalTree);

    typeModal.show();
    closeMenusHard(); // 추가: 모달 열 때 메뉴 닫기
  };

  ui.typeModalSearch?.addEventListener("input", async () => {
    const ok = await ensureTypeCache();
    if (!ok) return;

    const q = ui.typeModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";
    const treeData = buildTypeTreeForJS(typeCache);

    const projectFiltered = selectedProjectCode
      ? treeData.filter((p) => String(p.code) === String(selectedProjectCode))
      : treeData;

    if (!q) {
      renderTypeTree(projectFiltered, ui.typeModalTree);
      return;
    }

    // 트리 가지치기 검색 (type.name 기준)
    const searchInTree = (nodes) =>
      (nodes || [])
        .map((node) => {
          const nameHit = (node.name || "").toLowerCase().includes(q);
          const childHits = searchInTree(node.children || []);
          if (nameHit || childHits.length > 0)
            return { ...node, children: childHits };
          return null;
        })
        .filter(Boolean);

    const filtered = projectFiltered
      .map((proj) => ({ ...proj, children: searchInTree(proj.children || []) }))
      .filter((proj) => (proj.children || []).length > 0);

    renderTypeTree(filtered, ui.typeModalTree);
  });

  // -------------------------
  // 상세 이동 (원래 코드 유지)
  // -------------------------
  const goDetail = (tr) => {
    const issueCode = tr.dataset.issueCode;
    if (!issueCode) return;
    closeMenusHard(); // 추가: 이동 전에 메뉴 닫기
    location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
  };

  // -------------------------
  // ============ 컨텍스트 메뉴 추가 ============
  // - Bootstrap dropdown 기본 위치 깨지는 문제 해결: 메뉴를 body로 옮겨 fixed로 배치
  // - 서브메뉴는 왼쪽으로 펼침(prefer left)
  // - 뒤로가기(BFCache)/페이지 이동/submit/모달 열기 전에 무조건 닫기
  // - delete는 issue-info.js처럼 /issueDelete 폼 POST로 처리
  // ==========================================
  const MOVED = new WeakMap();

  const rememberAndMoveToBody = (el) => {
    if (!el || MOVED.has(el)) return;
    MOVED.set(el, { parent: el.parentNode, nextSibling: el.nextSibling });
    document.body.appendChild(el);
  };

  const restoreEl = (el) => {
    const st = MOVED.get(el);
    if (!st) return;

    const { parent, nextSibling } = st;
    if (nextSibling && nextSibling.parentNode === parent)
      parent.insertBefore(el, nextSibling);
    else parent.appendChild(el);

    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.zIndex = "";
    el.style.display = "";
    el.style.visibility = "";
    el.style.opacity = "";

    MOVED.delete(el);
  };

  const placeFixedBelowRight = (btn, menu, gap = 4) => {
    const rect = btn.getBoundingClientRect();
    const w = menu.offsetWidth || 220;
    const h = menu.offsetHeight || 320;

    let left = rect.right - w;
    let top = rect.bottom + gap;

    if (left < 8) left = 8;
    if (window.innerHeight - rect.bottom < h && rect.top > h)
      top = rect.top - h - gap;
    if (top < 8) top = 8;

    menu.style.position = "fixed";
    menu.style.zIndex = "9999";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  };

  const placeFixedSubmenuPreferLeft = (li, sub, gap = 6) => {
    const rect = li.getBoundingClientRect();
    const w = sub.offsetWidth || 220;
    const h = sub.offsetHeight || 320;

    let left = rect.left - w - gap;
    let top = rect.top;

    if (left < 8 && window.innerWidth - rect.right > w + gap)
      left = rect.right + gap;
    if (window.innerHeight - rect.top < h && rect.bottom > h)
      top = rect.bottom - h;

    if (left < 8) left = 8;
    if (top < 8) top = 8;

    sub.style.position = "fixed";
    sub.style.zIndex = "10000";
    sub.style.left = `${left}px`;
    sub.style.top = `${top}px`;
  };

  const closeSubmenus = (except = null) => {
    $$(".issue-submenu-menu.show").forEach((m) => {
      if (m === except) return;
      m.classList.remove("show");
      restoreEl(m);
    });
  };

  const closeAll = () => {
    $$('.issue-dropdown [data-bs-toggle="dropdown"]').forEach((btn) => {
      const inst = bootstrap.Dropdown.getInstance(btn);
      if (inst) inst.hide();
    });
    closeSubmenus(null);
  };

  const closeMenusHard = () => {
    closeAll();
    $$(".issue-dropdown-menu.show").forEach((m) => {
      m.classList.remove("show");
      restoreEl(m);
    });
  };

  const submitDeleteForm = (issueCode) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/issueDelete";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "issueCodes";
    input.value = issueCode;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  };

  // 뒤로가기(BFCache) 복귀 시 강제 닫기
  window.addEventListener("pageshow", () => {
    closeMenusHard();
  });

  // 링크 이동 전에 닫기 (캡처링)
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("javascript:"))
        return;
      if (a.target === "_blank") return;

      closeMenusHard();
    },
    true,
  );

  // submit 전에 닫기
  document.addEventListener(
    "submit",
    () => {
      closeMenusHard();
    },
    true,
  );

  // 모달 열기 전에 닫기
  document.addEventListener("show.bs.modal", () => closeMenusHard(), true);

  // 스크롤/리사이즈 시 닫기
  window.addEventListener("scroll", closeAll, true);
  window.addEventListener("resize", closeAll);

  // dropdown show/hide 핸들링 (body로 옮기고 fixed 위치 지정)
  document.addEventListener("show.bs.dropdown", (e) => {
    const dropdown = e.target;
    const btn = dropdown?.querySelector('[data-bs-toggle="dropdown"]');
    const menu = dropdown?.querySelector(".issue-dropdown-menu");
    if (!btn || !menu) return;

    bootstrap.Dropdown.getOrCreateInstance(btn, { autoClose: "outside" });

    const tr = dropdown.closest("tr.issueRow");
    if (tr?.dataset?.issueCode)
      menu.dataset.ownerIssueCode = tr.dataset.issueCode;

    requestAnimationFrame(() => {
      rememberAndMoveToBody(menu);
      menu.style.display = "block";
      placeFixedBelowRight(btn, menu, 4);
      menu.classList.add("show");
    });
  });

  document.addEventListener("hide.bs.dropdown", (e) => {
    closeSubmenus(null);

    const dropdown = e.target;
    const menu = dropdown?.querySelector(".issue-dropdown-menu");
    if (!menu) return;

    menu.classList.remove("show");
    restoreEl(menu);
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click", (e) => {
    const inside =
      e.target.closest(".issue-dropdown") ||
      e.target.closest(".issue-dropdown-menu") ||
      e.target.closest(".issue-submenu-menu");
    if (!inside) closeAll();
  });

  // 서브메뉴 토글
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".issue-submenu-toggle");
    if (!toggle) return;

    e.preventDefault();
    e.stopPropagation();

    const li = toggle.closest(".issue-submenu");
    const sub = li?.querySelector(".issue-submenu-menu");
    if (!li || !sub) return;

    const willOpen = !sub.classList.contains("show");
    if (!willOpen) {
      sub.classList.remove("show");
      restoreEl(sub);
      return;
    }

    closeSubmenus(sub);

    rememberAndMoveToBody(sub);
    sub.style.display = "block";
    sub.style.visibility = "hidden";
    sub.style.opacity = "0";
    sub.classList.add("show");

    requestAnimationFrame(() => {
      placeFixedSubmenuPreferLeft(li, sub, 6);
      sub.style.visibility = "visible";
      sub.style.opacity = "1";
    });
  });

  // 액션 처리 (edit / delete / status / priority / progress)
  const API = {
    status: "/api/issues/status",
    priority: "/api/issues/priority",
    progress: "/api/issues/progress",
  };

  const postJson = async (url, body) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("처리에 실패했습니다.");
    return res.json().catch(() => null);
  };

  document.addEventListener("click", async (e) => {
    const item = e.target.closest(".dropdown-item[data-action]");
    if (!item) return;
    if (item.classList.contains("issue-submenu-toggle")) return;

    e.stopPropagation();

    const action = item.dataset.action;
    const value = item.dataset.value;

    const tr = e.target.closest("tr.issueRow");
    let issueCode = tr?.dataset?.issueCode || "";

    const ownerMenu =
      e.target.closest(".issue-dropdown-menu") ||
      $$(".issue-dropdown-menu.show")[0] ||
      null;

    if (!issueCode && ownerMenu?.dataset?.ownerIssueCode) {
      issueCode = ownerMenu.dataset.ownerIssueCode;
    }
    if (!issueCode) return;

    try {
      if (action === "edit") {
        closeMenusHard();
        location.href = `/issueEdit?issueCode=${encodeURIComponent(issueCode)}`;
        return;
      }

      if (action === "delete") {
        if (!confirm("삭제하시겠습니까?")) return;
        closeMenusHard();
        submitDeleteForm(issueCode);
        return;
      }

      if (action === "status") {
        await postJson(API.status, { issueCode, statusId: value });
        showToast("상태가 변경되었습니다.");
        closeSubmenus(null);
        return;
      }

      if (action === "priority") {
        await postJson(API.priority, { issueCode, priority: value });
        showToast("우선순위가 변경되었습니다.");
        closeSubmenus(null);
        return;
      }

      if (action === "progress") {
        await postJson(API.progress, { issueCode, progress: Number(value) });
        showToast("진척도가 변경되었습니다.");
        closeSubmenus(null);
        return;
      }

      closeSubmenus(null);
    } catch (err) {
      showToast(err?.message || "처리에 실패했습니다.");
      closeSubmenus(null);
    }
  });

  // -------------------------
  // 이벤트 바인딩 (원래 코드 유지 + 메뉴 닫기만 추가)
  // -------------------------
  ui.btnApply?.addEventListener("click", (e) => {
    e.preventDefault();
    applyFiltersClient();
  });

  ui.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();

    ui.projectText.value = "";
    ui.projectValue.value = "";
    ui.title.value = "";
    ui.typeText.value = "";
    ui.typeValue.value = "";
    ui.status.value = "";
    ui.priority.value = "";
    ui.assigneeText.value = "";
    ui.assigneeValue.value = "";
    ui.creatorText.value = "";
    ui.creatorValue.value = "";
    ui.createdAt.value = "";
    ui.dueAt.value = "";

    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    page = 1;
    render();
    closeMenusHard(); // 추가
  });

  ui.btnProjectModal?.addEventListener("click", openProjectModal);
  ui.btnAssigneeModal?.addEventListener("click", () =>
    openUserModal("assignee"),
  );
  ui.btnCreatorModal?.addEventListener("click", () => openUserModal("creator"));
  ui.btnTypeModal?.addEventListener("click", openTypeModal);

  // 상세 (원래 코드 유지: 컨텍스트 메뉴 영역 클릭은 막음)
  ui.tbody.addEventListener("click", (e) => {
    // 컨텍스트 메뉴/버튼/링크 클릭은 상세 이동 금지
    if (
      e.target.closest("input, label, button, a") ||
      e.target.closest(".issue-actions") ||
      e.target.closest(".issue-dropdown") ||
      e.target.closest(".issue-dropdown-menu") ||
      e.target.closest(".issue-submenu-menu")
    ) {
      return;
    }

    const tr = e.target.closest("tr.issueRow");
    if (tr && tr.style.display !== "none") goDetail(tr);
  });

  // Enter로 submit 방지 (원래 코드 유지)
  [
    ui.title,
    ui.createdAt,
    ui.dueAt,
    ui.projectText,
    ui.assigneeText,
    ui.creatorText,
    ui.typeText,
  ].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  ui.btnCreate?.addEventListener("click", () => {
    closeMenusHard();
    location.href = "/issueInsert";
  });

  // 초기 렌더
  rows().forEach((tr) => (tr.dataset.filtered = "0"));
  render();
})();
