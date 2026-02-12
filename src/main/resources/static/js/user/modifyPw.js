// /static/js/user/modifyPw.js
// ✅ 비밀번호 변경: 공백/불일치 시 포커스 + 안내 메시지

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("modifyPwForm");
  if (!form) return;

  const alertBox = document.getElementById("pwAlert");
  const currentPw = document.getElementById("currentPw");
  const newPw = document.getElementById("newPw");
  const confirmPw = document.getElementById("confirmPw");

  function showAlert(msg) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.textContent = "";
    alertBox.classList.add("d-none");
  }

  // 입력 시작하면 안내 숨김
  [currentPw, newPw, confirmPw].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", hideAlert);
  });

  form.addEventListener("submit", (e) => {
    hideAlert();

    const cur = (currentPw?.value ?? "").trim();
    const npw = (newPw?.value ?? "").trim();
    const cpw = (confirmPw?.value ?? "").trim();

    // 1) 현재 비밀번호 공백
    if (!cur) {
      e.preventDefault();
      showAlert("현재 비밀번호를 입력해주세요.");
      currentPw?.focus();
      return;
    }

    // 2) 새 비밀번호 공백
    if (!npw) {
      e.preventDefault();
      showAlert("새 비밀번호를 입력해주세요.");
      newPw?.focus();
      return;
    }

    // 3) 확인 공백
    if (!cpw) {
      e.preventDefault();
      showAlert("새 비밀번호 확인을 입력해주세요.");
      confirmPw?.focus();
      return;
    }

    // 4) 새 비밀번호 불일치
    if (npw !== cpw) {
      e.preventDefault();
      showAlert("새 비밀번호와 확인이 일치하지 않습니다.");
      confirmPw?.focus();
      confirmPw?.select?.();
      return;
    }
  });
});
