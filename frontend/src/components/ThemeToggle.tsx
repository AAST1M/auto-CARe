import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ThemeToggleProps {
  extraClasses?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ extraClasses = "" }) => {
  const { isDarkMode, toggleTheme } = useAppContext();

  return (
    <button 
      onClick={toggleTheme}
      className={`p-2 rounded-full glass-panel text-cyber-primary hover:bg-cyber-primary/10 transition-colors ${extraClasses}`}
      title="Toggle Theme"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
