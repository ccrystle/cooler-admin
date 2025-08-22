'use client';

import { useState } from 'react';
import { SwatchIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { themes, Theme } from '../utils/themes';

interface ThemeSelectorProps {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (theme: Theme) => {
    onThemeChange(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <SwatchIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{selectedTheme.name}</span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Vibe</h3>
            <div className="space-y-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedTheme.id === theme.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{theme.name}</div>
                      <div className="text-sm text-gray-500">{theme.description}</div>
                    </div>
                    <div className="flex space-x-1">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: theme.colors.chart1 }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: theme.colors.chart2 }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: theme.colors.chart3 }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
