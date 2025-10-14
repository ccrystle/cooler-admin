'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import ThemeSelector from './ThemeSelector';
import DarkModeToggle from './DarkModeToggle';
import { Theme } from '../utils/themes';

interface NavigationProps {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
}

export default function Navigation({
  selectedTheme,
  onThemeChange,
  isDarkMode,
  onToggleDarkMode,
  showBackButton = false,
  backButtonText = 'Back',
  onBackClick
}: NavigationProps) {
  const pathname = usePathname();

  return (
    <div className={`shadow transition-colors duration-200 ${
      isDarkMode 
        ? `bg-[${selectedTheme.darkMode.surface}] border-b border-[${selectedTheme.darkMode.border}]`
        : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            {showBackButton && onBackClick ? (
              <button
                onClick={onBackClick}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                title={backButtonText}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            ) : null}
            
            <ChartBarIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Cooler Admin Dashboard</h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex space-x-8">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/anomalies"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                pathname === '/anomalies'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Anomalies
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <ThemeSelector 
              selectedTheme={selectedTheme}
              onThemeChange={onThemeChange}
            />
            <DarkModeToggle 
              isDarkMode={isDarkMode}
              onToggle={onToggleDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
