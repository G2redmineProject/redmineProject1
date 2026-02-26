(() => {
  const MAIN_URL = "/G2main";

  // 화면 1프레임이라도 보이게 하고 이동
  requestAnimationFrame(() => {
    window.location.replace(MAIN_URL);
  });
})();