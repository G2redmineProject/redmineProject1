(() => {
  const $ = (s) => document.querySelector(s);

  const ui = {
    form: $("#noticeEditForm"),
    projectText: $("#projectText"),
    projectCode: $("#projectCode"),

    title: $("#title"),
    titleCounter: $("#titleCounter"),

    content: $("#content"),
    contentCounter: $("#contentCounter"),

    btnBack: $("#btnBack"),
    btnReset: $("#btnReset"),
    btnSave: $("#btnSave"),

    titleInvalidMsg: $("#titleInvalidMsg"),
    contentInvalidMsg: $("#contentInvalidMsg"),
  };

  if (!ui.form) return;

  let editor = null;
  let isSubmitting = false;

  // 초기값 스냅샷 (되돌리기용)
  const initial = {
    title: ui.title?.value || "",
    content: ui.content?.value || "",
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

  const clearInvalid = () => {
    ui.title?.classList.remove("is-invalid");
    ui.titleInvalidMsg && (ui.titleInvalidMsg.textContent = "");
    ui.contentInvalidMsg && (ui.contentInvalidMsg.textContent = "");
  };

  const setInvalid = (el, msgEl, msg) => {
    if (el) el.classList.add("is-invalid");
    if (msgEl) msgEl.textContent = msg;
  };

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

  ui.btnBack?.addEventListener("click", () => {
    const noticeCode = $("#noticeCode")?.value;
    if (noticeCode) {
      location.href = `/noticeInfo?noticeCode=${encodeURIComponent(noticeCode)}`;
    } else {
      location.href = "/noticeList";
    }
  });

  ui.btnReset?.addEventListener("click", () => {
    if (ui.title) ui.title.value = initial.title;

    if (editor) editor.setData(initial.content);
    else if (ui.content) ui.content.value = initial.content;

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

      // 초기 content 스냅샷을 에디터 데이터로 갱신 (create와 동일한 UI)
      initial.content = editor.getData();

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

    const title = ui.title?.value?.trim() || "";
    const contentTextLen = getContentTextLen();

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
    if (isSubmitting) {
      e.preventDefault();
      return;
    }

    const canModify = (ui.btnSave?.dataset.canModify || "false").toLowerCase();
    if (canModify !== "true") {
      e.preventDefault();
      showToast("수정 권한이 없습니다.");
      return;
    }

    if (!validate()) {
      e.preventDefault();
      return;
    }

    if (editor && ui.content) ui.content.value = editor.getData();

    isSubmitting = true;
    if (ui.btnSave) {
      ui.btnSave.disabled = true;
      ui.btnSave.textContent = "수정 중...";
    }
  });

  // Enter 제출 방지(제목)
  [ui.title].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  updateTitleCounter();
  updateContentCounter();
  initEditor();
})();
