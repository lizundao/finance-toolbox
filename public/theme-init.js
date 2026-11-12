/* 主题与语言初始化：在样式加载前同步执行，避免浅色主题闪屏。
   放在 public/ 由 Vite 原样复制到 dist，以便严格 CSP 下仍可执行。 */
(function () {
  try {
    if (localStorage.getItem('finance-toolbox-theme') === 'light') {
      document.documentElement.dataset.theme = 'light';
    }
    if (localStorage.getItem('finance-toolbox-locale') === 'en') {
      document.documentElement.lang = 'en';
    }
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略即可 */
  }
})();
