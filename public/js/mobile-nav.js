// ── 移动端导航抽屉 ───────────────────────────────────────────────
(function () {
  var btn       = document.getElementById('hamburgerBtn');
  var drawer    = document.getElementById('navDrawer');
  var overlay   = document.getElementById('navOverlay');
  var closeBtn  = document.getElementById('navCloseBtn');
  var drawerThemes = document.getElementById('drawerThemes');

  function open() {
    drawer && drawer.classList.add('open');
    overlay && overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer && drawer.classList.remove('open');
    overlay && overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (btn)      btn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay)  overlay.addEventListener('click', close);

  // 主题列表（直接硬编码，不依赖 nav-desktop 的 DOM）
  var THEMES = [
    { theme: '',       name: '紫色',   color: '#6366f1' },
    { theme: 'sky',     name: '天蓝',   color: '#0ea5e9' },
    { theme: 'emerald', name: '翠绿',   color: '#10b981' },
    { theme: 'rose',    name: '玫瑰',   color: '#f43f5e' },
    { theme: 'orange',  name: '橙色',   color: '#f97316' },
    { theme: 'amber',   name: '金黄',   color: '#f59e0b' },
    { theme: 'teal',    name: '青色',   color: '#14b8a6' },
    { theme: 'indigo',  name: '靛蓝',   color: '#4338ca' },
    { theme: 'fuchsia', name: '品红',   color: '#d946ef' },
    { theme: 'slate',   name: '石板灰', color: '#475569' },
    { theme: 'brown',   name: '深棕',   color: '#92400e' },
  ];

  function applyTheme(theme, name, color) {
    // 更新 desktop header 里的 theme-picker（如果存在）
    var swatch = document.getElementById('currentSwatch');
    var label  = document.getElementById('currentThemeName');
    if (swatch) swatch.style.background = color;
    if (label)  label.textContent = name;

    // 同步所有 .theme-option 的 active 状态
    document.querySelectorAll('.theme-option').forEach(function (o) {
      o.classList.toggle('active', o.dataset.theme === theme);
    });

    // 应用主题到 html
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('sw-theme', theme);
  }

  function syncDrawerThemes() {
    if (!drawerThemes) return;
    drawerThemes.innerHTML = '';

    var saved = localStorage.getItem('sw-theme') || '';

    THEMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'theme-option' + (saved === t.theme ? ' active' : '');
      btn.dataset.theme = t.theme;
      btn.dataset.name   = t.name;
      btn.innerHTML = '<span class="theme-dot" style="background:' + t.color + '"></span>' + t.name;
      btn.addEventListener('click', function () {
        applyTheme(t.theme, t.name, t.color);
        close();
      });
      drawerThemes.appendChild(btn);
    });

    // 初始化：应用已保存的主题（同步 header 状态）
    var savedObj = THEMES.find(function (t) { return t.theme === saved; }) || THEMES[0];
    applyTheme(saved, savedObj.name, savedObj.color);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncDrawerThemes);
  } else {
    syncDrawerThemes();
  }
})();
