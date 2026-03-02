import { vars } from 'nativewind';

/**
 * Theme tokens — brass/amber warm palette (same as JustForToday).
 */
export const lightTheme = vars({
  '--radius': '14',
  '--background': '252 249 242',
  '--foreground': '36 32 24',
  '--card': '255 253 247',
  '--card-foreground': '36 32 24',
  '--primary': '180 140 60',
  '--primary-foreground': '255 255 255',
  '--secondary': '245 238 220',
  '--secondary-foreground': '140 105 40',
  '--muted': '245 241 232',
  '--muted-foreground': '128 120 105',
  '--accent': '212 178 106',
  '--accent-foreground': '100 75 25',
  '--destructive': '200 50 50',
  '--destructive-foreground': '255 255 255',
  '--border': '230 222 205',
  '--input': '245 241 232',
  '--input-foreground': '36 32 24',
  '--ring': '180 140 60',
  '--modal-overlay': '0 0 0',
  '--modal-content': '255 253 247',
  '--modal-content-foreground': '36 32 24',
  '--modal-border': '230 222 205',
});

export const themeColors = {
  light: {
    card: '#FFFDF7',
    background: '#FCF9F2',
    secondary: '#F5EEDC',
    muted: '#F5F1E8',
    border: '#E6DEC5',
  },
  dark: {
    card: '#262119',
    background: '#16120C',
    secondary: '#322A1C',
    muted: '#302A1E',
    border: '#413828',
  },
};

export const darkTheme = vars({
  '--radius': '14',
  '--background': '22 18 12',
  '--foreground': '240 235 225',
  '--card': '38 33 25',
  '--card-foreground': '240 235 225',
  '--primary': '212 178 106',
  '--primary-foreground': '30 25 16',
  '--secondary': '50 42 28',
  '--secondary-foreground': '230 215 170',
  '--muted': '48 42 30',
  '--muted-foreground': '180 170 150',
  '--accent': '160 125 60',
  '--accent-foreground': '240 230 200',
  '--destructive': '220 80 80',
  '--destructive-foreground': '30 25 16',
  '--border': '65 56 40',
  '--input': '48 42 30',
  '--input-foreground': '240 235 225',
  '--ring': '212 178 106',
  '--modal-overlay': '0 0 0',
  '--modal-content': '38 33 25',
  '--modal-content-foreground': '240 235 225',
  '--modal-border': '65 56 40',
});
