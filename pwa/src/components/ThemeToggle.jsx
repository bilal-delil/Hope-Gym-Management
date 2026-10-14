import { useTheme } from '../contexts/ThemeContext';
import { IconMoon, IconSun } from './icons';

export default function ThemeToggle({ className = '', label = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle__icon">
        {isDark ? <IconSun /> : <IconMoon />}
      </span>
      {label ? (
        <span className="theme-toggle__label">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      ) : null}
    </button>
  );
}
