// /static/js/log/logs.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const ui = {
    form: $("#logFilterForm"),
    btnReset: $("#btnReset"),
    btnApply: $("#btnApply"),

    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),
    userText: $("#filterUserText"),
    userValue: $("#filterUserValue"),

    fromDate: $("#filterFromDate"),
    toDate: $("#filterToDate"),

    logRaw: $("#logRaw"),
    logRender: $("#logRender"),
    logEmpty: $("#logEmpty"),
    logInfo: $("#logInfo"),

    btnProjectModal: $("#btnOpenProjectModal"),
    btnUserModal: $("#btnOpenUserModal"),

    projectModalEl: $("#projectSelectModal"),
    userModalEl: $("#userSelectModal"),

    projectModalList: $("#projectModalList"),
    userModalList: $("#userModalList"),

    projectModalSearch: $("#projectModalSearch"),
    userModalSearch: $("#userModalSearch"),

    projectNameHidden: $("#filterProjectNameHidden"),
    userNameHidden: $("#filterUserNameHidden"),
  };

  if (!ui.form || !ui.logRaw || !ui.logRender) return;

  // submit 막아서 페이지 이동(리로드) 방지
  ui.form.addEventListener("submit", (e) => e.preventDefault());

  const getCheckedTypes = () => {
    const checks = $$('input[name="types"]:checked');
    return checks.map((c) => c.value);
  };

  const parseYmd = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map((v) => parseInt(v, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const fmtYmd = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 오늘 기준 최근 7일 기본값 (오늘 포함)
  const setDefault7DaysIfEmpty = () => {
    const today = new Date();
    const from = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6,
    );
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (ui.fromDate && !ui.fromDate.value) ui.fromDate.value = fmtYmd(from);
    if (ui.toDate && !ui.toDate.value) ui.toDate.value = fmtYmd(to);
  };

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

  const decodeHtmlEntities = (s) => {
    if (!s) return "";
    const ta = document.createElement("textarea");
    ta.innerHTML = s;
    return ta.value;
  };

  // 원본 로그 아이템 읽기
  const rawItems = () => $$("#logRaw .log-item");

  const getItem = (el) => {
    const d = el.dataset;
    const metaDecoded = decodeHtmlEntities(d.meta ?? "");

    return {
      projectCode: (d.projectCode || "").trim(),
      projectName: (d.projectName || "").trim(),
      userCode: (d.userCode || "").trim(),
      userName: (d.userName || "").trim(),
      targetType: (d.targetType || "").trim(),
      targetCode: (d.targetCode || "").trim(),
      actionType: (d.actionType || "").trim(),
      meta: metaDecoded,
      title: (d.title || "").trim(),
      createdDate: (d.createdDate || "").trim(), // yyyy-MM-dd
      createdTime: (d.createdTime || "").trim(), // HH:mm
    };
  };

  // 필터 조건에 따라 list 뽑기
  const filterItems = () => {
    const pCode = ui.projectValue?.value?.trim() || "";
    const uCode = ui.userValue?.value?.trim() || "";

    const from = parseYmd(ui.fromDate?.value?.trim() || "");
    const to = parseYmd(ui.toDate?.value?.trim() || "");

    const types = getCheckedTypes();
    const typeAll = types.length === 0;

    if (from && to && from.getTime() > to.getTime()) {
      showToast("시작일이 종료일보다 클 수 없습니다.");
      return [];
    }

    const list = rawItems()
      .map((el) => getItem(el))
      .filter((it) => {
        let ok = true;

        if (pCode) ok = ok && it.projectCode === pCode;
        if (uCode) ok = ok && it.userCode === uCode;

        if (!typeAll) ok = ok && types.includes(it.targetType);

        if (from || to) {
          const cd = parseYmd(it.createdDate);
          if (!cd) return false;

          if (from) ok = ok && cd.getTime() >= from.getTime();
          if (to) ok = ok && cd.getTime() <= to.getTime();
        }

        return ok;
      });

    return list;
  };

  const shouldSkipLog = (it) => {
    if (it.actionType === "CREATE") return false;

    const metaStr = decodeHtmlEntities((it.meta ?? "").trim());
    if (!metaStr || metaStr === "null") return true;

    try {
      const obj = JSON.parse(metaStr);
      const changes = Array.isArray(obj.changes) ? obj.changes : [];

      if (changes.length === 0) return true;

      const hasRenderable = changes.some((c) => {
        const fieldKey = c.field ?? "";
        let before = normalizeValue(c.before);
        let after = normalizeValue(c.after);

        if (dateFields.has(fieldKey)) {
          before = formatLocalDateTime(before);
          after = formatLocalDateTime(after);
        }

        if (fieldKey === "description" || fieldKey === "content") {
          before = truncateText(stripHtml(before), 80);
          after = truncateText(stripHtml(after), 80);
        }

        return before !== after;
      });

      return !hasRenderable;
    } catch {
      return false;
    }
  };

  const actionLabelMap = {
    CREATE: "생성",
    UPDATE: "수정",
    DELETE: "삭제",
    REJECT: "반려",
    APPROVE: "승인",
  };

  const targetLabelMap = {
    ISSUE: "일감",
    NOTICE: "공지",
    DOC: "문서",
  };

  const fieldLabelMap = {
    title: "제목",
    description: "설명",
    content: "내용",
    priority: "우선순위",
    status: "상태",
    assignee: "담당자",
    type: "유형",
    parentIssue: "상위일감",
    dueAt: "마감기한",
    startedAt: "시작일",
    resolvedAt: "완료일",
    progress: "진척도",
    rejectReason: "반려사유",
  };

  const dateFields = new Set(["dueAt", "startedAt", "resolvedAt"]);

  const render = (list) => {
    ui.logRender.innerHTML = "";

    list = list.filter((it) => !shouldSkipLog(it));

    if (!list.length) {
      ui.logEmpty?.classList.remove("d-none");
      if (ui.logInfo) ui.logInfo.textContent = "0건";
      return;
    }

    ui.logEmpty?.classList.add("d-none");
    if (ui.logInfo) ui.logInfo.textContent = `${list.length}건`;

    const groups = new Map();
    list.forEach((it) => {
      const key = it.createdDate || "UNKNOWN";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    });

    const dates = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

    dates.forEach((dateKey) => {
      const dateHeader = document.createElement("div");
      dateHeader.className = "history-date";
      dateHeader.textContent = dateKey === "UNKNOWN" ? "-" : dateKey;
      ui.logRender.appendChild(dateHeader);

      groups.get(dateKey).forEach((it) => {
        const actionKor = actionLabelMap[it.actionType] || it.actionType || "";
        const user = it.userName || it.userCode || "";
        const project = it.projectName || "-";
        const timeOnly = it.createdTime || "";

        const card = document.createElement("div");
        card.className = "history-item";

        const head = document.createElement("div");
        head.className = "history-head";

        const targetKor = targetLabelMap[it.targetType] || it.targetType || "";
        head.innerHTML = `
          <span class="head-line">
            ${escapeHtml(timeOnly)} / ${escapeHtml(targetKor)} ${escapeHtml(actionKor)} / ${escapeHtml(user)}
          </span>
        `;

        const proj = document.createElement("div");
        proj.className = "history-project";
        const title = (it.title || "").trim();

        proj.innerHTML = `
          <span class="project-name">${escapeHtml(project)}</span>
          ${
            title
              ? `<a class="title-chip" href="${escapeHtml(buildDetailUrl(it))}">${escapeHtml(title)}</a>`
              : ""
          }
        `;

        const body = document.createElement("div");
        body.className = "history-body";

        if (it.actionType === "CREATE") {
          body.textContent = "생성되었습니다.";
        } else {
          const metaStr = (it.meta ?? "").trim();
          const ul = buildChangeList(metaStr);
          if (ul) body.appendChild(ul);
          else body.textContent = "";
        }

        card.appendChild(head);
        card.appendChild(proj);
        card.appendChild(body);

        ui.logRender.appendChild(card);
      });
    });
  };

  const buildChangeList = (metaStr) => {
    metaStr = decodeHtmlEntities((metaStr ?? "").trim());
    if (!metaStr || metaStr === "null") return null;

    try {
      const obj = JSON.parse(metaStr);
      const changes = Array.isArray(obj.changes) ? obj.changes : [];
      if (!changes.length) return null;

      const ul = document.createElement("ul");
      ul.className = "change-list";

      changes.forEach((c) => {
        const fieldKey = c.field ?? "";
        const label = fieldLabelMap[fieldKey] ?? fieldKey;

        let before = normalizeValue(c.before);
        let after = normalizeValue(c.after);

        if (dateFields.has(fieldKey)) {
          before = formatLocalDateTime(before);
          after = formatLocalDateTime(after);
        }

        if (fieldKey === "description" || fieldKey === "content") {
          before = truncateText(stripHtml(before), 80);
          after = truncateText(stripHtml(after), 80);
        }

        if (before === after) return;

        const ol = document.createElement("ol");
        ol.textContent = `${label} : ${before} >> ${after}`;
        ul.appendChild(ol);
      });

      return ul.childElementCount ? ul : null;
    } catch {
      return null;
    }
  };

  const normalizeValue = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).trim();
    if (s === "" || s === "-") return "";
    return s;
  };

  const formatLocalDateTime = (s) => {
    if (!s) return "";
    const str = String(s).trim();
    if (!str.includes("T")) return str;
    const [d, t] = str.split("T");
    if (!t) return d;
    const hhmm = t.slice(0, 5);
    return hhmm ? `${d} ${hhmm}` : d;
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = String(html);
    return (div.textContent || div.innerText || "").trim();
  };

  const truncateText = (s, maxLen) => {
    if (!s) return "";
    const str = String(s);
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + "...";
  };

  const escapeHtml = (s) => {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  // 서버 제출용 hidden 동기화
  const syncHiddenNames = () => {
    if (ui.projectNameHidden)
      ui.projectNameHidden.value = ui.projectText?.value?.trim() || "";
    if (ui.userNameHidden)
      ui.userNameHidden.value = ui.userText?.value?.trim() || "";
  };

  const applyFiltersClient = () => {
    syncHiddenNames();
    const list = filterItems();
    render(list);
  };

  // -------------------------
  // 모달
  // -------------------------
  const projectModal = ui.projectModalEl
    ? new bootstrap.Modal(ui.projectModalEl)
    : null;
  const userModal = ui.userModalEl ? new bootstrap.Modal(ui.userModalEl) : null;

  let projectCache = [];
  let userCache = [];

  // 프로젝트 모달: 평면 리스트 유지
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

  const ensureProjectCache = async () => {
    if (projectCache.length > 0) return true;

    const res = await fetch("/api/projects/modal", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("프로젝트 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();
    projectCache = data.map((p) => ({
      code: String(p.projectCode),
      name: p.projectName,
    }));
    return true;
  };

  // 사용자 모달: 트리(프로젝트별) + 검색
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
      header.textContent = p.projectName || "-";

      const content = document.createElement("div");
      content.className = "type-project-content";
      content.style.display = "none";

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";

        const scope = container.closest(".modal-body") || container;

        scope
          .querySelectorAll(".type-project-content")
          .forEach((el) => (el.style.display = "none"));
        scope
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

    (projects || []).forEach((p) => {
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

  const ensureUserCache = async () => {
    if (userCache.length > 0) return true;

    const res = await fetch("/api/users/modal/my-projects", {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      showToast("사용자 목록을 불러오지 못했습니다.");
      return false;
    }

    userCache = await res.json(); // project -> children 트리
    return true;
  };

  const openProjectModal = async () => {
    if (!projectModal) return;

    if (ui.projectModalSearch) ui.projectModalSearch.value = "";

    const ok = await ensureProjectCache();
    if (!ok) return;

    renderListButtons(ui.projectModalList, projectCache, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;
      syncHiddenNames();
      projectModal.hide();
    });

    projectModal.show();
  };

  const openUserModal = async () => {
    if (!userModal) return;

    if (ui.userModalSearch) ui.userModalSearch.value = "";

    const ok = await ensureUserCache();
    if (!ok) return;

    const selectedProjectCode = ui.projectValue?.value?.trim() || "";
    const projectFiltered = selectedProjectCode
      ? userCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : userCache;

    renderUserTree(
      projectFiltered,
      ui.userModalList,
      (picked, pCode, pName) => {
        ui.userText.value = picked.userName;
        ui.userValue.value = picked.userCode;

        // 프로젝트 미선택이면 자동 세팅(원하면 제거)
        if (!ui.projectValue?.value && pCode) {
          ui.projectValue.value = String(pCode);
          ui.projectText.value = pName || "";
        }

        syncHiddenNames();
        userModal.hide();
      },
    );

    userModal.show();
  };

  // 검색 이벤트
  ui.projectModalSearch?.addEventListener("input", async () => {
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = ui.projectModalSearch.value.trim().toLowerCase();
    const list = projectCache.filter((p) => p.name.toLowerCase().includes(q));

    renderListButtons(ui.projectModalList, list, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;
      syncHiddenNames();
      projectModal?.hide();
    });
  });

  ui.userModalSearch?.addEventListener("input", async () => {
    const ok = await ensureUserCache();
    if (!ok) return;

    const q = ui.userModalSearch.value.trim();
    const selectedProjectCode = ui.projectValue?.value?.trim() || "";

    const projectFiltered = selectedProjectCode
      ? userCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : userCache;

    const filtered = filterUserTree(projectFiltered, q);

    renderUserTree(filtered, ui.userModalList, (picked, pCode, pName) => {
      ui.userText.value = picked.userName;
      ui.userValue.value = picked.userCode;

      if (!ui.projectValue?.value && pCode) {
        ui.projectValue.value = String(pCode);
        ui.projectText.value = pName || "";
      }

      syncHiddenNames();
      userModal?.hide();
    });
  });

  // 이벤트 바인딩
  ui.btnApply?.addEventListener("click", (e) => {
    e.preventDefault();
    applyFiltersClient();
  });

  ui.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();

    if (ui.projectText) ui.projectText.value = "";
    if (ui.projectValue) ui.projectValue.value = "";
    if (ui.userText) ui.userText.value = "";
    if (ui.userValue) ui.userValue.value = "";

    $$('input[name="types"]').forEach((c) => (c.checked = false));

    if (ui.fromDate) ui.fromDate.value = "";
    if (ui.toDate) ui.toDate.value = "";
    setDefault7DaysIfEmpty();

    syncHiddenNames();
    applyFiltersClient();
  });

  ui.btnProjectModal?.addEventListener("click", openProjectModal);
  ui.btnUserModal?.addEventListener("click", openUserModal);

  // Enter로 submit 방지
  [ui.projectText, ui.userText, ui.fromDate, ui.toDate].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  const buildDetailUrl = (it) => {
    const code = encodeURIComponent(it.targetCode || "");
    if (it.targetType === "ISSUE") return `/issueInfo?issueCode=${code}`;
    if (it.targetType === "NOTICE") return `/noticeInfo?noticeCode=${code}`;
    return "#";
  };

  // 초기 렌더
  const cp = window.__CP__;
  if (!ui.projectValue?.value?.trim() && cp?.projectCode) {
    ui.projectValue.value = String(cp.projectCode);
    ui.projectText.value = cp.projectName || "";
    syncHiddenNames();
  }

  setDefault7DaysIfEmpty();
  applyFiltersClient();
})();
