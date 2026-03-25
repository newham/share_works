// ── Share Works 主题切换 ──────────────────────────────────────────
(function () {
  const STORAGE_KEY = 'sw-theme';

  // 主题颜色映射（用于实时更新按钮上的色块）
  const COLOR_MAP = {
    '':        '#6366f1',
    'sky':     '#0ea5e9',
    'emerald': '#10b981',
    'rose':    '#f43f5e',
    'orange':  '#f97316',
    'amber':   '#f59e0b',
    'teal':    '#14b8a6',
    'indigo':  '#4338ca',
    'fuchsia': '#d946ef',
    'slate':   '#475569',
    'brown':   '#92400e',
  };

  function applyTheme(theme, name) {
    // 设置 html 属性（CSS [data-theme] 选择器）
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // 更新按钮色块和文字
    const swatch = document.getElementById('currentSwatch');
    const label  = document.getElementById('currentThemeName');
    if (swatch) swatch.style.background = COLOR_MAP[theme] || COLOR_MAP[''];
    if (label)  label.textContent = name || '紫色';

    // 更新选中态
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  function init() {
    const btn      = document.getElementById('themeBtn');
    const dropdown = document.getElementById('themeDropdown');
    if (!btn || !dropdown) return;

    // 恢复上次选择
    const saved     = localStorage.getItem(STORAGE_KEY) || '';
    const savedName = document.querySelector(`.theme-option[data-theme="${saved}"]`)?.dataset.name || '紫色';
    applyTheme(saved, savedName);

    // 开关下拉
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });

    // 点击选项
    dropdown.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      const name  = opt.dataset.name;
      applyTheme(theme, name);
      localStorage.setItem(STORAGE_KEY, theme);
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    // 点击外部关闭
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
