export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
  };
  darkMode: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    hover: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue-based corporate theme',
    colors: {
      primary: '#1e40af', // Deep blue
      secondary: '#3b82f6', // Medium blue
      accent: '#6366f1', // Indigo
      success: '#059669', // Emerald green
      warning: '#d97706', // Amber
      error: '#dc2626', // Red
      chart1: '#1e40af', // Deep blue
      chart2: '#3b82f6', // Medium blue
      chart3: '#6366f1', // Indigo
      chart4: '#059669', // Emerald green
      chart5: '#d97706', // Amber
    },
    darkMode: {
      background: '#0f172a', // Slate 900
      surface: '#1e293b', // Slate 800
      text: '#f8fafc', // Slate 50
      textSecondary: '#cbd5e1', // Slate 300
      border: '#334155', // Slate 700
      hover: '#334155', // Slate 700
    },
  },
  {
    id: 'soft-pastels',
    name: 'Soft Pastels',
    description: 'Gentle, calming pastel colors',
    colors: {
      primary: '#a78bfa', // Soft purple
      secondary: '#93c5fd', // Soft blue
      accent: '#fbbf24', // Soft yellow
      success: '#86efac', // Soft green
      warning: '#fcd34d', // Soft amber
      error: '#fca5a5', // Soft red
      chart1: '#a78bfa', // Soft purple
      chart2: '#93c5fd', // Soft blue
      chart3: '#fbbf24', // Soft yellow
      chart4: '#86efac', // Soft green
      chart5: '#fcd34d', // Soft amber
    },
    darkMode: {
      background: '#1a1a2e', // Dark blue-gray
      surface: '#16213e', // Darker blue-gray
      text: '#f0f0f0', // Light gray
      textSecondary: '#b8b8b8', // Medium gray
      border: '#0f3460', // Dark blue
      hover: '#0f3460', // Dark blue
    },
  },
  {
    id: 'earth-tones',
    name: 'Earth Tones',
    description: 'Warm, natural earth-inspired colors',
    colors: {
      primary: '#92400e', // Brown
      secondary: '#a16207', // Amber
      accent: '#059669', // Green
      success: '#047857', // Dark green
      warning: '#d97706', // Orange
      error: '#b91c1c', // Dark red
      chart1: '#92400e', // Brown
      chart2: '#a16207', // Amber
      chart3: '#059669', // Green
      chart4: '#047857', // Dark green
      chart5: '#d97706', // Orange
    },
    darkMode: {
      background: '#1c1917', // Dark brown
      surface: '#292524', // Medium brown
      text: '#fafaf9', // Light stone
      textSecondary: '#d6d3d1', // Medium stone
      border: '#44403c', // Dark stone
      hover: '#44403c', // Dark stone
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Clean, sophisticated grayscale theme',
    colors: {
      primary: '#374151', // Dark gray
      secondary: '#6b7280', // Medium gray
      accent: '#9ca3af', // Light gray
      success: '#10b981', // Green accent
      warning: '#f59e0b', // Orange accent
      error: '#ef4444', // Red accent
      chart1: '#374151', // Dark gray
      chart2: '#6b7280', // Medium gray
      chart3: '#9ca3af', // Light gray
      chart4: '#10b981', // Green accent
      chart5: '#f59e0b', // Orange accent
    },
    darkMode: {
      background: '#000000', // Pure black
      surface: '#111111', // Near black
      text: '#ffffff', // Pure white
      textSecondary: '#cccccc', // Light gray
      border: '#333333', // Dark gray
      hover: '#222222', // Very dark gray
    },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool, refreshing ocean-inspired palette',
    colors: {
      primary: '#0c4a6e', // Deep blue
      secondary: '#0369a1', // Ocean blue
      accent: '#0891b2', // Teal
      success: '#0d9488', // Sea green
      warning: '#0ea5e9', // Sky blue
      error: '#0284c7', // Blue accent
      chart1: '#0c4a6e', // Deep blue
      chart2: '#0369a1', // Ocean blue
      chart3: '#0891b2', // Teal
      chart4: '#0d9488', // Sea green
      chart5: '#0ea5e9', // Sky blue
    },
    darkMode: {
      background: '#0a0f1c', // Very dark blue
      surface: '#0f1a2e', // Dark blue
      text: '#e0f2fe', // Light blue
      textSecondary: '#bae6fd', // Medium blue
      border: '#1e3a8a', // Dark blue
      hover: '#1e3a8a', // Dark blue
    },
  },
];

export const getThemeById = (id: string): Theme => {
  return themes.find(theme => theme.id === id) || themes[0];
};
