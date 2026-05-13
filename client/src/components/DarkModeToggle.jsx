import { useTheme } from '@/hooks/useTheme';
import { HiSun, HiMoon } from 'react-icons/hi';

export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-xl text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:text-dark-400 dark:hover:text-yellow-400 dark:hover:bg-dark-800 transition-all"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <HiSun className="h-5 w-5" /> : <HiMoon className="h-5 w-5" />}
    </button>
  );
}
