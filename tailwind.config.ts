import type { Config } from 'tailwindcss';

export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Command Center Palette
                navy: {
                    900: '#0a0f1c', // Deep background
                    800: '#111827', // Card background
                    700: '#1f2937', // Borders
                },
                slate: {
                    500: '#64748b', // Muted text
                    400: '#94a3b8', // Secondary text
                    300: '#cbd5e1', // Primary text
                    200: '#e2e8f0', // Headings
                },
                // Strategic Status Colors
                action: {
                    primary: '#3b82f6', // Bright Blue (Primary Action)
                    hover: '#2563eb',
                },
                status: {
                    success: '#10b981', // Green (Under Capacity)
                    warning: '#f59e0b', // Amber (Near Capacity)
                    danger: '#ef4444',  // Red (Over Capacity)
                },
                // Brand / Strategic
                gold: {
                    DEFAULT: '#fbbf24', // Strategic Highlight
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'], // For data/metrics
            },
            boxShadow: {
                'glow': '0 0 15px rgba(59, 130, 246, 0.5)', // Blue glow for active elements
            },
        },
    },
    plugins: [],
} satisfies Config;
