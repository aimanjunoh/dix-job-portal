/**
 * Insights Design System — Premium Analytics Visual Language
 * Single accent tonal color system with depth, transparency and layering.
 */

// Primary accent: Indigo (Tailwind 600)
const ACCENT = '#4f46e5';

// Tonal palette — same hue at different opacities
export const TONAL = [
  '#4f46e5', // 100% — primary
  '#6366f1', // ~80%
  '#818cf8', // ~60%
  '#a5b4fc', // ~40%
  '#c7d2fe', // ~20%
  '#e0e7ff', // ~10%
  '#eef2ff', // ~5%
];

// Contextual tones (muted, not bright)
export const CTX = {
  success: '#059669',   // emerald-600
  successLight: '#d1fae5',
  warning: '#d97706',   // amber-600
  warningLight: '#fef3c7',
  danger: '#dc2626',    // red-600
  dangerLight: '#fee2e2',
};

// Pie/Donut tonal slices — monochromatic with opacity variation
export const PIE_TONAL = [
  '#4f46e5',
  '#6366f1cc',
  '#818cf8aa',
  '#a5b4fc99',
  '#c7d2fe88',
  '#818cf866',
  '#6366f144',
  '#c7d2fe55',
];

// Chart grid & axis
export const GRID_STROKE = '#e5e7eb';
export const AXIS_COLOR = '#9ca3af';
export const LABEL_COLOR = '#6b7280';

// Tooltip styling — frosted glass
export const TOOLTIP_STYLE = {
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.5)',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  padding: '10px 14px',
  fontSize: '13px',
  color: '#374151',
};

// KPI card icon backgrounds — subtle gradients using accent
export const KPI_GRADIENTS = {
  primary: { from: '#4f46e5', to: '#6366f1' },
  secondary: { from: '#6366f1', to: '#818cf8' },
  success: { from: '#059669', to: '#10b981' },
  warning: { from: '#d97706', to: '#f59e0b' },
  danger: { from: '#dc2626', to: '#ef4444' },
  neutral: { from: '#6b7280', to: '#9ca3af' },
};

// SVG gradient definition component helper
export const gradientId = (name: string) => `grad-${name}`;

// Bar chart default config
export const BAR_RADIUS: [number, number, number, number] = [8, 8, 0, 0];
export const BAR_RADIUS_H: [number, number, number, number] = [0, 8, 8, 0];

// Axis tick config
export const TICK_FONT = { fontSize: 11, fill: LABEL_COLOR };
export const TICK_FONT_SM = { fontSize: 10, fill: LABEL_COLOR };
