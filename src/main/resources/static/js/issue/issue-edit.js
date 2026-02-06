// /js/issue/issue-edit.js
(() => {
  const $ = (s) => document.querySelector(s);

  const form = $("#issueEditForm");

  const titleInp = $("#title");
  const descInp = $("#description");

  const statusSel = $("#statusId");
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

  // --- 상위일감(Parent issue) ---
  const issueCodeEl = $("#issueCode");
  const projectCodeEl = $("#projectCode");

  const parIssueText = $("#parIssueText");
  const parIssueCode = $("#parIssueCode");
  const btnOpenParIssueModal = $("#btnOpenParIssueModal");
  const btnClearParIssue = $("#btnClearParIssue");

  const parIssueModalEl = $("#parIssueSelectModal");
  const parIssueModal = parIssueModalEl
    ? new bootstrap.Modal(parIssueModalEl)
    : null;
  const parIssueSearchEl = $("#parIssueModalSearch");
  const parIssueTbody = $("#parIssueModalList");

  const toDT = (d) => (d ? `${d}T00:00` : "");

  // --- 담당자 모달 ---
  const assigneeModalEl = $("#assigneeSelectModal");
  const assigneeModal = assigneeModalEl
    ? new bootstrap.Modal(assigneeModalEl)
    : null;
  const assigneeText = $("#assigneeText");
  const assigneeCode = $("#assigneeCode");
  const btnOpenAssigneeModal = $("#btnOpenAssigneeModal");
  const assigneeListEl = $("#assigneeModalList");
  const assigneeSearchEl = $("#assigneeModalSearch");

  let userCache = [];
  const parentIssueCacheByProject = new Map();

  const initial = {
    title: titleInp?.value || "",
    description: descInp?.value || "",
    statusId: statusSel?.value || "",
    progress: progressInp?.value || "",
    due: dueView?.value || "",
    started: startedView?.value || "",
    resolved: resolvedView?.value || "",
    assigneeName: assigneeText?.value || "",
    assigneeCode: assigneeCode?.value || "",
    parIssueText: parIssueText?.value || "",
    parIssueCode: parIssueCode?.value || "",
    parIssueNameEnabled: parIssueCode?.getAttribute("name") === "parIssueCode",
  };

  const syncHiddenDates = () => {
    if (createdAt && createdView) createdAt.value = toDT(createdView.value);
    if (dueAt && dueView) dueAt.value = toDT(dueView.value);
    if (startedAt && startedView) startedAt.value = toDT(startedView.value);

    if (resolvedAt && resolvedView) {
      resolvedAt.value =
        statusSel?.value === "OB5" ? toDT(resolvedView.value) : "";
    }
  };

  // 완료 상태일 때만 완료일 입력 가능
  const toggleResolvedByStatus = () => {
    if (!resolvedView) return;
    const isDone = statusSel?.value === "OB5";
    resolvedView.disabled = !isDone;

    if (!isDone) resolvedView.value = "";
    if (!isDone && resolvedAt) resolvedAt.value = "";
  };

  const setProgressByStatus = () => {
    if (!statusSel || !progressInp) return;
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
      alert("신규가 아닌 상태로 변경하려면 시작일을 먼저 등록해야 합니다.");
      statusSel.value = "OB1";
    }

    toggleResolvedByStatus();
    setProgressByStatus();
    syncHiddenDates();
  };

  // -------------------------
  // 담당자 모달
  // -------------------------
  const ensureUserCache = async () => {
    if (userCache.length) return true;
    const res = await fetch("/api/users/modal", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      alert("사용자 목록을 불러오지 못했습니다.");
      return false;
    }
    const data = await res.json();
    userCache = data.map((u) => ({
      value: String(u.userCode),
      label: u.userName,
    }));
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
    items.forEach((u) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "list-group-item list-group-item-action";
      b.textContent = u.label;
      b.addEventListener("click", () => {
        assigneeText.value = u.label;
        assigneeCode.value = u.value;
        assigneeSearchEl.value = "";
        assigneeModal?.hide();
      });
      assigneeListEl.appendChild(b);
    });
  };

  const openAssigneeModal = async () => {
    if (!assigneeModal) return;
    const ok = await ensureUserCache();
    if (!ok) return;
    assigneeSearchEl.value = "";
    renderUsers(userCache);
    assigneeModal.show();
  };

  // -------------------------
  // 상위일감 모달(테이블)
  // -------------------------
  const fetchJson = async (url, failMsg) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      alert(failMsg);
      return null;
    }
    return res.json();
  };

  const ensureParentIssues = async (projectCode) => {
    if (!projectCode) return false;
    if (parentIssueCacheByProject.has(projectCode)) return true;

    const data = await fetchJson(
      `/api/issues/parents?projectCode=${encodeURIComponent(projectCode)}`,
      "상위일감 목록을 불러오지 못했습니다.",
    );
    if (!data) return false;

    // 서버 응답: { issueCode, title, name }
    const list = data.map((i) => ({
      issueCode: Number(i.issueCode),
      title: i.title ?? "",
      assignee: (i.name ?? "미지정").trim(),
    }));

    parentIssueCacheByProject.set(projectCode, list);
    return true;
  };

  const renderParIssueTable = (items) => {
    if (!parIssueTbody) return;
    parIssueTbody.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.className = "text-muted";
      td.textContent = "결과가 없습니다.";
      tr.appendChild(td);
      parIssueTbody.appendChild(tr);
      return;
    }

    items.forEach((it) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const tdTitle = document.createElement("td");
      tdTitle.textContent = it.title;

      const tdAssignee = document.createElement("td");
      tdAssignee.textContent = it.assignee;

      tr.appendChild(tdTitle);
      tr.appendChild(tdAssignee);

      tr.addEventListener("click", () => {
        const selfId = Number(issueCodeEl?.value);
        if (!Number.isNaN(selfId) && it.issueCode === selfId) {
          alert("자기 자신을 상위일감으로 선택할 수 없습니다.");
          return;
        }

        // 선택 시 name 복구해서 서버로 전송되게 함
        if (parIssueCode) parIssueCode.setAttribute("name", "parIssueCode");

        parIssueText.value = it.title;
        parIssueCode.value = String(it.issueCode);

        if (parIssueSearchEl) parIssueSearchEl.value = "";
        parIssueModal?.hide();
      });

      parIssueTbody.appendChild(tr);
    });
  };

  const filterParIssue = (items, q) => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) => (it.title || "").toLowerCase().includes(qq));
  };

  const openParIssueModal = async () => {
    if (!parIssueModal) return;

    const projectCode = projectCodeEl?.value;
    if (!projectCode) {
      alert("프로젝트 정보가 없습니다.");
      return;
    }

    const ok = await ensureParentIssues(projectCode);
    if (!ok) return;

    const list = parentIssueCacheByProject.get(projectCode) || [];
    parIssueSearchEl.value = "";
    renderParIssueTable(list);

    parIssueModal.show();
  };

  const clearParIssue = () => {
    if (!parIssueText || !parIssueCode) return;

    parIssueText.value = "";
    parIssueCode.value = "";

    // 해제 시 name 제거 => 서버에 파라미터가 안 가서 parIssueCode = null
    parIssueCode.removeAttribute("name");
  };

  // -------------------------
  // 검증
  // -------------------------
  const validateBeforeSubmit = () => {
    const s = statusSel?.value || "";

    if (s && s !== "OB1" && !startedView?.value) {
      alert("신규가 아닌 상태로 저장하려면 시작일을 입력해야 합니다.");
      startedView?.focus();
      return false;
    }

    if (s === "OB5" && !resolvedView?.value) {
      alert("완료로 저장하려면 완료일을 입력해야 합니다.");
      resolvedView?.focus();
      return false;
    }

    if (s === "OB5") {
      const hasFile = uploadFileInp?.files?.length > 0;
      if (!hasFile) {
        alert("완료로 저장하려면 첨부파일을 등록해야 합니다.");
        uploadFileInp?.focus();
        return false;
      }
    }

    if (s !== "OB5") {
      if (resolvedView) resolvedView.value = "";
      if (resolvedAt) resolvedAt.value = "";
    }

    if (s === "OB2") clampProgress();
    setProgressByStatus();
    syncHiddenDates();
    return true;
  };

  // -------------------------
  // bind
  // -------------------------
  statusSel?.addEventListener("change", onStatusChange);

  progressInp?.addEventListener("input", () => {
    clampProgress();
    syncHiddenDates();
  });

  dueView?.addEventListener("change", syncHiddenDates);

  startedView?.addEventListener("change", () => {
    if (statusSel?.value && statusSel.value !== "OB1" && !startedView.value) {
      alert("신규가 아닌 상태에서는 시작일을 비울 수 없습니다.");
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

  parIssueSearchEl?.addEventListener("input", async () => {
    const projectCode = projectCodeEl?.value;
    if (!projectCode) return;

    const ok = await ensureParentIssues(projectCode);
    if (!ok) return;

    const list = parentIssueCacheByProject.get(projectCode) || [];
    const q = parIssueSearchEl.value || "";
    renderParIssueTable(filterParIssue(list, q));
  });

  btnBack?.addEventListener("click", () => history.back());

  btnReset?.addEventListener("click", () => {
    if (titleInp) titleInp.value = initial.title;
    if (descInp) descInp.value = initial.description;

    if (statusSel) statusSel.value = initial.statusId;
    if (progressInp) progressInp.value = initial.progress;

    if (dueView) dueView.value = initial.due;
    if (startedView) startedView.value = initial.started;
    if (resolvedView) resolvedView.value = initial.resolved;

    if (assigneeText) assigneeText.value = initial.assigneeName;
    if (assigneeCode) assigneeCode.value = initial.assigneeCode;

    if (parIssueText) parIssueText.value = initial.parIssueText;
    if (parIssueCode) parIssueCode.value = initial.parIssueCode;

    // 초기 상태가 상위일감 있었다면 name 유지, 없었다면 제거
    if (parIssueCode) {
      if (initial.parIssueNameEnabled && initial.parIssueCode)
        parIssueCode.setAttribute("name", "parIssueCode");
      else parIssueCode.removeAttribute("name");
    }

    onStatusChange();
    syncHiddenDates();
  });

  form?.addEventListener("submit", (e) => {
    if (!validateBeforeSubmit()) e.preventDefault();
  });

  // init
  setProgressByStatus();
  toggleResolvedByStatus();
  syncHiddenDates();
  // 초기 상위일감 값이 비어있으면 name 제거
  if (parIssueCode) {
    const hasValue = String(parIssueCode.value || "").trim().length > 0;
    if (!hasValue) parIssueCode.removeAttribute("name");
  }
})();
