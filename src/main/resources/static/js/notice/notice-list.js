// /static/js/notice/notice-list.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const pageSize = 10;
  let page = 1;

  const ui = {
    tbody: $("#noticeTbody"),
    pagination: $("#noticePagination"),
    pageInfo: $("#noticePageInfo"),

    filterForm: $("#noticeFilterForm"),

    projectText: $("#filterProjectText"),
    projectValue: $("#filterProjectValue"),
    title: $("#filterTitle"),

    creatorText: $("#filterCreatorText"),
    creatorValue: $("#filterCreatorValue"),

    createdAt: $("#filterCreatedAt"),

    btnApply: $("#btnApplyFilters"),
    btnReset: $("#btnResetFilters"),

    btnProjectModal: $("#btnOpenProjectModal"),
    btnCreatorModal: $("#btnOpenCreatorModal"),

    projectModalEl: $("#projectSelectModal"),
    creatorModalEl: $("#creatorSelectModal"),

    projectModalList: $("#projectModalList"),
    creatorModalTree: $("#creatorModalTree"),

    projectModalSearch: $("#projectModalSearch"),
    creatorModalSearch: $("#creatorModalSearch"),

    btnCreate: $("#btnNoticeCreate"),

    // 서버 제출용 hidden (HTML에 존재)
    projectNameHidden: $("#filterProjectNameHidden"),
    creatorNameHidden: $("#filterCreatorNameHidden"),
  };

  if (!ui.tbody) return;

  ui.filterForm?.addEventListener("submit", (e) => e.preventDefault());

  // -------------------------
  // 목록/페이지네이션
  // -------------------------
  const rows = () => $$("#noticeTbody tr.noticeRow");
  const visibleRows = () => rows().filter((tr) => tr.dataset.filtered !== "1");

  const sameDay = (rowDate, filterDate) => {
    if (!filterDate) return true;
    if (!rowDate) return false;
    return rowDate.slice(0, 10) === filterDate;
  };

  const getRow = (tr) => {
    const d = tr.dataset;
    return {
      noticeCode: (d.noticeCode || "").trim(),
      project: (d.project || "").trim(),
      projectCode: (d.projectCode || "").trim(),
      title: (d.title || "").trim().toLowerCase(),
      creatorCode: (d.creatorCode || "").trim(),
      created: (d.created || "").trim(),
    };
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

  const applyFiltersClient = () => {
    const pCode = ui.projectValue?.value?.trim() || "";
    const pName = ui.projectText?.value?.trim() || "";
    const title = ui.title?.value?.trim()?.toLowerCase() || "";
    const cCode = ui.creatorValue?.value?.trim() || "";
    const created = ui.createdAt?.value?.trim() || "";

    rows().forEach((tr) => {
      const d = getRow(tr);
      let ok = true;

      if (pCode)
        ok =
          ok && (d.projectCode ? d.projectCode === pCode : d.project === pName);
      if (title) ok = ok && d.title.includes(title);
      if (cCode) ok = ok && d.creatorCode === cCode;
      ok = ok && sameDay(d.created, created);

      tr.dataset.filtered = ok ? "0" : "1";
    });

    if (ui.projectNameHidden)
      ui.projectNameHidden.value = ui.projectText?.value?.trim() || "";
    if (ui.creatorNameHidden)
      ui.creatorNameHidden.value = ui.creatorText?.value?.trim() || "";

    page = 1;
    render();
  };

  // -------------------------
  // 토스트
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

    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
    t.show();
  };

  // -------------------------
  // 모달 인스턴스
  // -------------------------
  const projectModal = ui.projectModalEl
    ? new bootstrap.Modal(ui.projectModalEl)
    : null;
  const creatorModal = ui.creatorModalEl
    ? new bootstrap.Modal(ui.creatorModalEl)
    : null;

  // -------------------------
  // 캐시
  // -------------------------
  let projectCache = [];
  let creatorTreeCache = [];

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

  const ensureCreatorTreeCache = async () => {
    if (creatorTreeCache.length) return true;

    const res = await fetch("/api/users/modal/notices/creators", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      showToast("등록자 목록을 불러오지 못했습니다.");
      return false;
    }

    const data = await res.json();

    // data가 이미 트리면 그대로, 평면이면 트리로 변환 시도
    // 1) 트리 형태(projectName + children)면 pass
    if (Array.isArray(data) && data.length && data[0].children) {
      creatorTreeCache = data;
      return true;
    }

    // 2) 평면(user list)만 내려오는 경우: "기타" 한 그룹으로 묶어버림
    //    (가능하면 서버를 트리로 바꾸는 게 깔끔)
    if (Array.isArray(data)) {
      creatorTreeCache = [
        {
          projectCode: "",
          projectName: "등록자",
          children: data.map((u) => ({
            userCode: u.userCode ?? u.code,
            userName: u.userName ?? u.name,
          })),
        },
      ];
      return true;
    }

    creatorTreeCache = [];
    return true;
  };

  // -------------------------
  // 프로젝트 모달
  // -------------------------
  const renderProjectButtons = (items, onPick) => {
    if (!ui.projectModalList) return;
    ui.projectModalList.innerHTML = "";

    if (!items.length) {
      const div = document.createElement("div");
      div.className = "text-muted";
      div.textContent = "결과가 없습니다.";
      ui.projectModalList.appendChild(div);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = it.name;
      btn.addEventListener("click", () => onPick(it));
      ui.projectModalList.appendChild(btn);
    });
  };

  const openProjectModal = async () => {
    if (!projectModal) return;
    if (ui.projectModalSearch) ui.projectModalSearch.value = "";

    const ok = await ensureProjectCache();
    if (!ok) return;

    renderProjectButtons(projectCache, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;
      if (ui.projectNameHidden) ui.projectNameHidden.value = picked.name;

      // 프로젝트 바꾸면 등록자 선택도 초기화(일감 목록 톤 유지)
      ui.creatorText.value = "";
      ui.creatorValue.value = "";
      if (ui.creatorNameHidden) ui.creatorNameHidden.value = "";

      projectModal.hide();
    });

    projectModal.show();
  };

  ui.projectModalSearch?.addEventListener("input", async () => {
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = ui.projectModalSearch.value.trim().toLowerCase();
    const list = projectCache.filter((p) => p.name.toLowerCase().includes(q));

    renderProjectButtons(list, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectValue.value = picked.code;
      if (ui.projectNameHidden) ui.projectNameHidden.value = picked.name;

      ui.creatorText.value = "";
      ui.creatorValue.value = "";
      if (ui.creatorNameHidden) ui.creatorNameHidden.value = "";

      projectModal.hide();
    });
  });

  // -------------------------
  // 등록자 모달(트리)
  // -------------------------
  const renderCreatorTree = (projects, container, pickHandler) => {
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
      header.textContent = p.projectName || "프로젝트";

      const content = document.createElement("div");
      content.className = "type-project-content";
      content.style.display = "none";

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";

        document
          .querySelectorAll("#creatorModalTree .type-project-content")
          .forEach((el) => (el.style.display = "none"));
        document
          .querySelectorAll("#creatorModalTree .type-project-header")
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

  const filterCreatorTree = (projects, keyword) => {
    if (!keyword || !keyword.trim()) return projects;

    const q = keyword.trim().toLowerCase();
    const result = [];

    projects.forEach((p) => {
      const matched = (p.children || []).filter((u) =>
        String(u.userName || "")
          .toLowerCase()
          .includes(q),
      );

      if (matched.length > 0) {
        result.push({
          projectCode: p.projectCode,
          projectName: p.projectName,
          children: matched,
        });
      }
    });

    return result;
  };

  const openCreatorModal = async () => {
    if (!creatorModal) return;
    if (ui.creatorModalSearch) ui.creatorModalSearch.value = "";

    const ok = await ensureCreatorTreeCache();
    if (!ok) return;

    // 프로젝트 선택 시 해당 프로젝트만 보여주기
    const selectedProjectCode = ui.projectValue?.value || "";
    const base = selectedProjectCode
      ? creatorTreeCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : creatorTreeCache;

    renderCreatorTree(
      base,
      ui.creatorModalTree,
      (picked, projectCode, projectName) => {
        ui.creatorText.value = picked.userName;
        ui.creatorValue.value = picked.userCode;
        if (ui.creatorNameHidden) ui.creatorNameHidden.value = picked.userName;

        // 프로젝트 미선택이면 자동 셋
        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
          if (ui.projectNameHidden)
            ui.projectNameHidden.value = projectName || "";
        }

        creatorModal.hide();
      },
    );

    creatorModal.show();
  };

  ui.creatorModalSearch?.addEventListener("input", async () => {
    const ok = await ensureCreatorTreeCache();
    if (!ok) return;

    const q = ui.creatorModalSearch.value.trim().toLowerCase();
    const selectedProjectCode = ui.projectValue?.value || "";

    const base = selectedProjectCode
      ? creatorTreeCache.filter(
          (p) => String(p.projectCode) === String(selectedProjectCode),
        )
      : creatorTreeCache;

    const filtered = filterCreatorTree(base, q);

    renderCreatorTree(
      filtered,
      ui.creatorModalTree,
      (picked, projectCode, projectName) => {
        ui.creatorText.value = picked.userName;
        ui.creatorValue.value = picked.userCode;
        if (ui.creatorNameHidden) ui.creatorNameHidden.value = picked.userName;

        if (!ui.projectValue?.value && projectCode) {
          ui.projectValue.value = projectCode;
          ui.projectText.value = projectName || "";
          if (ui.projectNameHidden)
            ui.projectNameHidden.value = projectName || "";
        }

        creatorModal.hide();
      },
    );
  });

  // -------------------------
  // 상세 이동
  // -------------------------
  const goDetail = (tr) => {
    const noticeCode = tr.dataset.noticeCode;
    if (!noticeCode) return;
    location.href = `/noticeInfo?noticeCode=${encodeURIComponent(noticeCode)}`;
  };

  // -------------------------
  // 이벤트 바인딩
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
    ui.creatorText.value = "";
    ui.creatorValue.value = "";
    ui.createdAt.value = "";

    if (ui.projectNameHidden) ui.projectNameHidden.value = "";
    if (ui.creatorNameHidden) ui.creatorNameHidden.value = "";

    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    page = 1;
    render();
  });

  ui.btnProjectModal?.addEventListener("click", openProjectModal);
  ui.btnCreatorModal?.addEventListener("click", openCreatorModal);

  ui.tbody.addEventListener("click", (e) => {
    if (e.target.closest("input, label, button, a")) return;
    const tr = e.target.closest("tr.noticeRow");
    if (tr && tr.style.display !== "none") goDetail(tr);
  });

  [ui.title, ui.createdAt, ui.projectText, ui.creatorText].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  ui.btnCreate?.addEventListener("click", () => {
    location.href = "/noticeCreate";
  });

  // 초기 렌더
  const cp = window.__CP__;
  if (!ui.projectValue?.value?.trim() && cp?.projectCode) {
    ui.projectValue.value = String(cp.projectCode);
    ui.projectText.value = cp.projectName || "";
    if (ui.projectNameHidden) ui.projectNameHidden.value = ui.projectText.value;

    applyFiltersClient(); // render 포함
  } else {
    rows().forEach((tr) => (tr.dataset.filtered = "0"));
    render();
  }
})();
