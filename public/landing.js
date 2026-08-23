const themeToggleEl = document.getElementById('theme-toggle');

const THEME_STORAGE_KEY = 'dealership-dashboard-theme';

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleEl.setAttribute('aria-pressed', String(theme === 'dark'));
};

const initTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const preferred = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(preferred);
};

themeToggleEl.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
});

initTheme();
