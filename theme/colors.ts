export type ThemeMode = 'light' | 'dark';

export type ThemePreference = ThemeMode | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  destructive: string;
  destructiveText: string;
}

export const lightColors: ThemeColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  accent: '#208AEF',
  accentText: '#FFFFFF',
  destructive: '#DC2626',
  destructiveText: '#DC2626',
};

export const darkColors: ThemeColors = {
  background: '#121417',
  surface: '#1E2228',
  border: '#2A2F37',
  textPrimary: '#F2F4F7',
  textSecondary: '#9BA3AF',
  accent: '#3B9BFF',
  accentText: '#FFFFFF',
  destructive: '#F87171',
  destructiveText: '#F87171',
};
