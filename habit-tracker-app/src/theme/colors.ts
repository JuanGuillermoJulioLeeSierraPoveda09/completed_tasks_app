export const lightColors = {
    //Fondos
    background: '#F9F9F7',
    surface: '#FFFFFF',
    surfaceMuted: '#F9FAFB',
    fill: '#F3F4F6',
    border: '#E5E7EB',

    // Texto
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    //Contraste
    inverse: '#000000',
    onInverse: '#FFFFFF',

    //App
    primary: '#00B763',
    onPrimary: '#FFFFFF',
    primarySoft: '#E6F8EF',

    //Estados
    inactive: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    dangerBorder: '#FEE2E2',

    //Capas
    overlay: 'rgba(0,0,0,0.5)',
    shadow: '#000000',
};

export type ThemeColors = Record<keyof typeof lightColors, string>;

export const darkColors: ThemeColors = {
    //Fondos
    background: '#121413',
    surface: '#1C1F1E',
    surfaceMuted: '#171A19',
    fill: '#262A28',
    border: '#2E3331',

    //Texto
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',

    //Contraste
    inverse: '#FFFFFF',
    onInverse: '#111111',

    //App
    primary: '#00B763',
    onPrimary: '#FFFFFF',
    primarySoft: '#0F3324',

    //Estados
    inactive: '#3A403D',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#F87171',
    dangerSoft: '#3A1A1A',
    dangerBorder: '#5A2323',

    //Capas
    overlay: 'rgba(0,0,0,0.65)',
    shadow: '#000000'
};