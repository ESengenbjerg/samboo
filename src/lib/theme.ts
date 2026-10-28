import { DarkTheme, DefaultTheme } from 'expo-router';

// Values mirror the color variables in global.css.
// Comma syntax is used because React Native's color parser does not support "hsl(h s% l%)".
export const THEME = {
  light: {
    background: 'hsl(27, 39%, 95%)', // --off-white
    foreground: 'hsl(79, 78%, 13%)', // --dark-green
    card: 'hsl(0, 0%, 100%)', // white
    primary: 'hsl(40, 82%, 61%)', // --yellow
    border: 'hsl(25, 15%, 84%)', // --light-greige
    destructive: 'hsl(358, 65%, 50%)', // --red
  },
  dark: {
    background: 'hsl(79, 78%, 13%)', // --dark-green
    foreground: 'hsl(27, 39%, 95%)', // --off-white
    card: 'hsl(80, 55%, 18%)', // --deep-green
    primary: 'hsl(40, 82%, 61%)', // --yellow
    border: 'hsl(88, 39%, 26%)', // --medium-green
    destructive: 'hsl(358, 65%, 50%)', // --red
  },
};

export const NAV_THEME: Record<'light' | 'dark', typeof DefaultTheme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
