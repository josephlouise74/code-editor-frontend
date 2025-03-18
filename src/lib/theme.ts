/**
 * Global theme configuration for the application
 * This allows for consistent styling across components and easy theme changes
 */
export const theme = {
  // Colors
  primary: 'red-600',
  secondary: 'gray-800',
  accent: 'red-500',

  // Text styles
  textPrimary: 'text-gray-800 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-300',
  textGradient: 'bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700',
  labelText: 'text-gray-700 dark:text-gray-300',
  errorText: 'text-red-500 text-sm',

  // Border styles
  borderPrimary: 'border-red-600 dark:border-red-800',
  borderSecondary: 'border-gray-200 dark:border-gray-700',

  // Button styles
  buttonPrimary: 'bg-red-600 text-white',
  buttonSecondary: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white',
  buttonHover: 'hover:bg-red-700 dark:hover:bg-red-700',
  buttonShadow: 'shadow-md hover:shadow-lg hover:shadow-red-600/30',

  // Input styles
  inputBorder: 'border-gray-300 dark:border-gray-700',
  inputFocus: 'focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900',

  // Icon styles
  iconColor: 'text-red-500 dark:text-red-400',

  // Link styles
  linkText: 'text-red-500 dark:text-red-400',
  linkHover: 'hover:text-red-400 dark:hover:text-red-300 transition-colors duration-200',
  linkUnderline: 'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-red-500 hover:after:w-full after:transition-all after:duration-300 after:-bottom-1',

  // Shadow styles
  shadowPrimary: 'shadow-red-500/10',
  shadowSecondary: 'shadow-gray-500/10',
};

/**
 * Helper function to get theme values with custom variants
 * @param key The base theme key
 * @param variant Optional variant (e.g., 'light', 'dark', 'hover')
 */
export const getThemeValue = (key: keyof typeof theme, variant?: string) => {
  const baseValue = theme[key];
  if (!variant) return baseValue;

  // Handle variants
  if (variant === 'hover' && key.startsWith('button')) {
    return theme[`${key}Hover` as keyof typeof theme] || baseValue;
  }

  return baseValue;
};