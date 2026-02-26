// /js/notice/notice-create.js
(() => {
  const $ = (s) => document.querySelector(s);

  const ui = {
    form: $("#noticeCreateForm"),

    projectText: $("#projectText"),
    projectCode: $("#projectCode"),
    btnProjectModal: $("#btnOpenProjectModal"),

    title: $("#title"),
    titleCounter: $("#titleCounter"),

    content: $("#content"),
    contentCounter: $("#contentCounter"),

    btnBack: $("#btnBack"),
    btnReset: $("#btnReset"),
    btnSave: $("#btnSave"),

    projectInvalidMsg: $("#projectInvalidMsg"),
    titleInvalidMsg: $("#titleInvalidMsg"),
    contentInvalidMsg: $("#contentInvalidMsg"),

    projectModalEl: $("#projectSelectModal"),
    projectModalList: $("#projectModalList"),
    projectModalSearch: $("#projectModalSearch"),
  };

  if (!ui.form) return;

  const projectModal = ui.projectModalEl
    ? new bootstrap.Modal(ui.projectModalEl)
    : null;

  let projectCache = [];
  let editor = null;
  let isSubmitting = false;

  const ensureToastContainer = () => {
    const id = "toastContainer";
    let el = document.getElementById(id);
    if (el) return el;

    el = document.createElement("div");
    el.id = id;
    el.className = "toast-container position-fixed bottom-0 end-0 p-3";
    el.style.zIndex = "1080";
    document.body.appendChild(el);
    return el;
  };

  const showToast = (message) => {
    const container = ensureToastContainer();

    const toastEl = document.createElement("div");
    toastEl.className = "toast align-items-center text-bg-dark border-0";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"></div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

    toastEl.querySelector(".toast-body").textContent = message;
    container.appendChild(toastEl);

    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 });
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    t.show();
  };

  const hasTrue = (v) => {
    const s = String(v ?? "").toLowerCase();
    return s === "true" || s === "Y" || s === "1";
  };

  const clearInvalid = () => {
    ui.projectText?.classList.remove("is-invalid");
    ui.title?.classList.remove("is-invalid");

    ui.projectInvalidMsg && (ui.projectInvalidMsg.textContent = "");
    ui.titleInvalidMsg && (ui.titleInvalidMsg.textContent = "");
    ui.contentInvalidMsg && (ui.contentInvalidMsg.textContent = "");
  };

  const setInvalid = (el, msgEl, msg) => {
    if (el) el.classList.add("is-invalid");
    if (msgEl) msgEl.textContent = msg;
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

  const ensureProjectCache = async () => {
    if (projectCache.length > 0) return true;

    const res = await fetch("/api/projects/modal/noticeCreate", {
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

  const openProjectModal = async () => {
    if (!projectModal) return;

    if (ui.projectModalSearch) ui.projectModalSearch.value = "";

    const ok = await ensureProjectCache();
    if (!ok) return;

    renderListButtons(ui.projectModalList, projectCache, async (picked) => {
      ui.projectText.value = picked.name;
      ui.projectCode.value = picked.code;

      // 권한 갱신
      try {
        const res = await fetch(
          `/api/authority/notice/canWrite?projectCode=${encodeURIComponent(picked.code)}`,
          {
            headers: { Accept: "application/json" },
          },
        );
        const data = await res.json().catch(() => ({}));
        const canWrite = !!data.canWrite;

        if (ui.btnSave) ui.btnSave.dataset.canWrite = String(canWrite);

        if (!canWrite) showToast("이 프로젝트는 공지 등록 권한이 없습니다.");
      } catch (e) {
        if (ui.btnSave) ui.btnSave.dataset.canWrite = "false";
        showToast("권한 확인 중 오류가 발생했습니다.");
      }

      ui.projectText.classList.remove("is-invalid");
      ui.projectInvalidMsg && (ui.projectInvalidMsg.textContent = "");

      projectModal.hide();
    });

    projectModal.show();
  };

  ui.projectModalSearch?.addEventListener("input", async () => {
    const ok = await ensureProjectCache();
    if (!ok) return;

    const q = ui.projectModalSearch.value.trim().toLowerCase();
    const list = projectCache.filter((p) => p.name.toLowerCase().includes(q));

    renderListButtons(ui.projectModalList, list, (picked) => {
      ui.projectText.value = picked.name;
      ui.projectCode.value = picked.code;
      projectModal?.hide();
    });
  });

  ui.btnProjectModal?.addEventListener("click", openProjectModal);

  const updateTitleCounter = () => {
    const len = (ui.title?.value || "").length;
    if (ui.titleCounter) ui.titleCounter.textContent = `${len} / 200`;
  };

  const getContentTextLen = () => {
    if (!editor) return (ui.content?.value || "").trim().length;
    const plain = editor
      .getData()
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ");
    return plain.trim().length;
  };

  const updateContentCounter = () => {
    const len = getContentTextLen();
    if (ui.contentCounter) ui.contentCounter.textContent = `${len} / 5000`;
  };

  ui.title?.addEventListener("input", () => {
    ui.title.classList.remove("is-invalid");
    ui.titleInvalidMsg && (ui.titleInvalidMsg.textContent = "");
    updateTitleCounter();
  });

  ui.projectText?.addEventListener("click", () => {
    if (!ui.projectCode?.value) openProjectModal();
  });

  ui.btnBack?.addEventListener("click", () => {
    location.href = "/noticeList";
  });

  ui.btnReset?.addEventListener("click", () => {
    if (ui.projectText) ui.projectText.value = "";
    if (ui.projectCode) ui.projectCode.value = "";
    if (ui.title) ui.title.value = "";

    if (editor) editor.setData("");
    else if (ui.content) ui.content.value = "";

    clearInvalid();
    updateTitleCounter();
    updateContentCounter();
  });

  const initEditor = async () => {
    if (!window.ClassicEditor || !ui.content) return;

    try {
      editor = await ClassicEditor.create(ui.content, {
        toolbar: [
          "heading",
          "|",
          "bold",
          "italic",
          "link",
          "bulletedList",
          "numberedList",
          "|",
          "blockQuote",
          "undo",
          "redo",
        ],
      });

      editor.model.document.on("change:data", () => {
        ui.contentInvalidMsg && (ui.contentInvalidMsg.textContent = "");
        updateContentCounter();
      });

      updateContentCounter();
    } catch (e) {
      editor = null;
      updateContentCounter();
    }
  };

  const validate = () => {
    clearInvalid();

    const projectCode = ui.projectCode?.value?.trim() || "";
    const title = ui.title?.value?.trim() || "";
    const contentTextLen = getContentTextLen();

    if (!projectCode) {
      setInvalid(
        ui.projectText,
        ui.projectInvalidMsg,
        "프로젝트를 선택해주세요.",
      );
      showToast("프로젝트를 선택해주세요.");
      ui.projectText?.focus();
      return false;
    }

    if (!title) {
      setInvalid(ui.title, ui.titleInvalidMsg, "공지 제목을 입력해주세요.");
      showToast("공지 제목을 입력해주세요.");
      ui.title?.focus();
      return false;
    }

    if (contentTextLen === 0) {
      ui.contentInvalidMsg &&
        (ui.contentInvalidMsg.textContent = "공지 내용을 입력해주세요.");
      showToast("공지 내용을 입력해주세요.");
      if (editor) editor.editing.view.focus();
      else ui.content?.focus();
      return false;
    }

    if (title.length > 200) {
      setInvalid(
        ui.title,
        ui.titleInvalidMsg,
        "제목은 200자 이내로 입력해주세요.",
      );
      showToast("제목은 200자 이내로 입력해주세요.");
      ui.title?.focus();
      return false;
    }

    if (contentTextLen > 5000) {
      ui.contentInvalidMsg &&
        (ui.contentInvalidMsg.textContent =
          "내용은 5000자 이내로 입력해주세요.");
      showToast("내용은 5000자 이내로 입력해주세요.");
      if (editor) editor.editing.view.focus();
      else ui.content?.focus();
      return false;
    }

    return true;
  };

  ui.form.addEventListener("submit", (e) => {
    const canWrite = hasTrue(ui.btnSave?.dataset?.canWrite);
    if (!canWrite) {
      e.preventDefault();
      showToast("권한이 없습니다.");
      return;
    }

    if (isSubmitting) {
      e.preventDefault();
      return;
    }

    if (!validate()) {
      e.preventDefault();
      return;
    }

    if (editor && ui.content) ui.content.value = editor.getData();

    // 중복 제출 방지
    isSubmitting = true;
    if (ui.btnSave) {
      ui.btnSave.disabled = true;
      ui.btnSave.textContent = "등록 중...";
    }
  });

  // Enter 제출 방지(제목/프로젝트 입력 영역)
  [ui.projectText, ui.title].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  // 초기 렌더
  const cp = window.__CP__;
  if (!ui.projectCode?.value?.trim() && cp?.projectCode) {
    ui.projectCode.value = String(cp.projectCode);
    ui.projectText.value = cp.projectName || "";

    fetch(
      `/api/authority/notice/canWrite?projectCode=${encodeURIComponent(ui.projectCode.value)}`,
      {
        headers: { Accept: "application/json" },
      },
    )
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        const canWrite = !!d.canWrite;
        if (ui.btnSave) ui.btnSave.dataset.canWrite = String(canWrite);
        if (!canWrite) showToast("이 프로젝트는 공지 등록 권한이 없습니다.");
      })
      .catch(() => {
        if (ui.btnSave) ui.btnSave.dataset.canWrite = "false";
      });
  }

  updateTitleCounter();
  updateContentCounter();
  initEditor();
})();
