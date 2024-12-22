import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-14 h-7 rounded-full p-1 relative bg-button-secondary-bg 
                transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 rounded-full 
                   transform transition-transform duration-200 ease-in-out
                   flex items-center justify-center
                   ${isDark ? "translate-x-7 bg-gray-800" : "translate-x-0 bg-yellow-400"}`}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-gray-200" />
        ) : (
          <Sun className="w-3 h-3 text-yellow-800" />
        )}
      </div>
    </button>
  );
}