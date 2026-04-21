/**
 * KPI Card Extension - Themes
 * All built-in color themes + getEffectiveColors resolver.
 */
define(['./constants'], function (constantsModule) {
	'use strict';

	var CONSTANTS = constantsModule.CONSTANTS;

	// ── Theme Definitions ────────────────────────────────────────────────────
	const THEMES = {
		custom: {},

		// ── Original / Classic ──────────────────────────────────────────────
		// Modern Blue - Clean and professional
		modernBlue: {
			backgroundColor: '#ffffff',
			titleColor: '#64748b',
			valueColor: '#0f172a',
			labelColor: '#94a3b8',
			measureLabelColor: '#64748b',
			lineColor: '#3b82f6',
			areaColor: '#3b82f6',
			borderColor: '#e2e8f0',
			deltaUpColor: '#10b981',
			deltaDownColor: '#ef4444',
			deltaNeutralColor: '#94a3b8'
		},
		// Dark Professional - Elegant dark theme
		darkProfessional: {
			backgroundColor: '#1e293b',
			titleColor: '#cbd5e1',
			valueColor: '#f1f5f9',
			labelColor: '#94a3b8',
			measureLabelColor: '#cbd5e1',
			lineColor: '#60a5fa',
			areaColor: '#60a5fa',
			borderColor: '#334155',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#94a3b8'
		},
		// Gradient Purple - Modern purple gradient
		gradientPurple: {
			backgroundColor: '#faf5ff',
			titleColor: '#6b21a8',
			valueColor: '#4c1d95',
			labelColor: '#9333ea',
			measureLabelColor: '#7c3aed',
			lineColor: '#a855f7',
			areaColor: '#c084fc',
			borderColor: '#e9d5ff',
			deltaUpColor: '#10b981',
			deltaDownColor: '#f43f5e',
			deltaNeutralColor: '#a78bfa'
		},
		// Minimal White - Clean minimal design
		minimalWhite: {
			backgroundColor: '#ffffff',
			titleColor: '#6b7280',
			valueColor: '#111827',
			labelColor: '#9ca3af',
			measureLabelColor: '#6b7280',
			lineColor: '#6366f1',
			areaColor: '#818cf8',
			borderColor: '#e5e7eb',
			deltaUpColor: '#059669',
			deltaDownColor: '#dc2626',
			deltaNeutralColor: '#9ca3af'
		},
		// Ocean Teal - Fresh ocean theme
		oceanTeal: {
			backgroundColor: '#f0fdfa',
			titleColor: '#0f766e',
			valueColor: '#134e4a',
			labelColor: '#14b8a6',
			measureLabelColor: '#0d9488',
			lineColor: '#14b8a6',
			areaColor: '#5eead4',
			borderColor: '#ccfbf1',
			deltaUpColor: '#10b981',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#94a3b8'
		},
		// Sunset Warm - Warm orange/red tones
		sunsetWarm: {
			backgroundColor: '#fff7ed',
			titleColor: '#9a3412',
			valueColor: '#7c2d12',
			labelColor: '#ea580c',
			measureLabelColor: '#c2410c',
			lineColor: '#f97316',
			areaColor: '#fb923c',
			borderColor: '#fed7aa',
			deltaUpColor: '#10b981',
			deltaDownColor: '#dc2626',
			deltaNeutralColor: '#fb923c'
		},
		// Forest Fresh - Natural green theme
		forestFresh: {
			backgroundColor: '#f0fdf4',
			titleColor: '#166534',
			valueColor: '#14532d',
			labelColor: '#16a34a',
			measureLabelColor: '#15803d',
			lineColor: '#22c55e',
			areaColor: '#4ade80',
			borderColor: '#bbf7d0',
			deltaUpColor: '#10b981',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#86efac'
		},
		// Royal Gold - Luxurious gold theme
		royalGold: {
			backgroundColor: '#fffbeb',
			titleColor: '#92400e',
			valueColor: '#78350f',
			labelColor: '#d97706',
			measureLabelColor: '#b45309',
			lineColor: '#f59e0b',
			areaColor: '#fbbf24',
			borderColor: '#fef3c7',
			deltaUpColor: '#10b981',
			deltaDownColor: '#ef4444',
			deltaNeutralColor: '#fbbf24'
		},
		// Cyber Neon - Modern neon cyber theme
		cyberNeon: {
			backgroundColor: '#0a0e27',
			titleColor: '#a78bfa',
			valueColor: '#e0e7ff',
			labelColor: '#818cf8',
			measureLabelColor: '#a78bfa',
			lineColor: '#8b5cf6',
			areaColor: '#a78bfa',
			borderColor: '#312e81',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#818cf8'
		},
		// Elegant Gray - Sophisticated gray theme
		elegantGray: {
			backgroundColor: '#f9fafb',
			titleColor: '#4b5563',
			valueColor: '#111827',
			labelColor: '#6b7280',
			measureLabelColor: '#4b5563',
			lineColor: '#6366f1',
			areaColor: '#818cf8',
			borderColor: '#e5e7eb',
			deltaUpColor: '#10b981',
			deltaDownColor: '#ef4444',
			deltaNeutralColor: '#9ca3af'
		},
		// Slate - Original dark slate
		slate: {
			backgroundColor: '#0f172a',
			titleColor: '#e2e8f0',
			valueColor: '#f8fafc',
			labelColor: '#94a3b8',
			measureLabelColor: '#cbd5e1',
			lineColor: '#38bdf8',
			areaColor: '#38bdf8',
			borderColor: 'transparent',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#94a3b8'
		},
		// Ocean - Original ocean theme
		ocean: {
			backgroundColor: '#0b132b',
			titleColor: '#d8e2dc',
			valueColor: '#eaeaea',
			labelColor: '#a3b6c4',
			measureLabelColor: '#c7ced6',
			lineColor: '#5bc0be',
			areaColor: '#5bc0be',
			borderColor: 'transparent',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#a3b6c4'
		},
		// Sunset - Original sunset theme
		sunset: {
			backgroundColor: '#1f0a24',
			titleColor: '#ffd7ba',
			valueColor: '#ffe5d9',
			labelColor: '#f8edeb',
			measureLabelColor: '#fec5bb',
			lineColor: '#ff7b7b',
			areaColor: '#ff7b7b',
			borderColor: 'transparent',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#fec5bb'
		},
		// Emerald - Original emerald theme
		emerald: {
			backgroundColor: '#062925',
			titleColor: '#d1fae5',
			valueColor: '#ecfdf5',
			labelColor: '#a7f3d0',
			measureLabelColor: '#6ee7b7',
			lineColor: '#34d399',
			areaColor: '#34d399',
			borderColor: 'transparent',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#6ee7b7'
		},
		// Violet - Original violet theme
		violet: {
			backgroundColor: '#1a102a',
			titleColor: '#e9d5ff',
			valueColor: '#faf5ff',
			labelColor: '#d8b4fe',
			measureLabelColor: '#c4b5fd',
			lineColor: '#a78bfa',
			areaColor: '#a78bfa',
			borderColor: 'transparent',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#c4b5fd'
		},
		// Glass Morphism - Modern glass effect theme
		glass: {
			backgroundColor: 'rgba(255, 255, 255, 0.08)',
			titleColor: 'rgba(255, 255, 255, 0.9)',
			valueColor: '#ffffff',
			labelColor: 'rgba(255, 255, 255, 0.7)',
			measureLabelColor: 'rgba(255, 255, 255, 0.8)',
			lineColor: 'rgba(255, 255, 255, 0.9)',
			areaColor: 'rgba(255, 255, 255, 0.3)',
			borderColor: 'rgba(255, 255, 255, 0.18)',
			deltaUpColor: '#4ade80',
			deltaDownColor: '#fb7185',
			deltaNeutralColor: 'rgba(255, 255, 255, 0.6)'
		},

		// ── Corporate ────────────────────────────────────────────────────────
		// Corporate Navy - Deep navy, authoritative
		corporateNavy: {
			backgroundColor: '#0a1628',
			titleColor: '#7eb8e0',
			valueColor: '#e8f4fd',
			labelColor: '#5a8fad',
			measureLabelColor: '#7eb8e0',
			lineColor: '#4a9eca',
			areaColor: '#4a9eca',
			borderColor: '#1a2e48',
			deltaUpColor: '#4ade80',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#5a8fad'
		},
		// Charcoal Steel - Dark charcoal with steel blue accents
		charcoalSteel: {
			backgroundColor: '#1c1c2e',
			titleColor: '#8ab4d4',
			valueColor: '#dce8f0',
			labelColor: '#5a7a94',
			measureLabelColor: '#8ab4d4',
			lineColor: '#4a9eca',
			areaColor: '#4a9eca',
			borderColor: '#2e2e44',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#5a7a94'
		},

		// ── Pastel / Soft ─────────────────────────────────────────────────────
		// Rose Quartz - Soft feminine rose tones
		roseQuartz: {
			backgroundColor: '#fff0f3',
			titleColor: '#9d4360',
			valueColor: '#6b1f3a',
			labelColor: '#c4698a',
			measureLabelColor: '#b55577',
			lineColor: '#e879a0',
			areaColor: '#f4b8cf',
			borderColor: '#ffd6e0',
			deltaUpColor: '#10b981',
			deltaDownColor: '#f43f5e',
			deltaNeutralColor: '#c4698a'
		},
		// Lavender Soft - Calming lavender pastels
		lavenderSoft: {
			backgroundColor: '#f5f3ff',
			titleColor: '#7c6fcd',
			valueColor: '#4c3d9a',
			labelColor: '#a89ad8',
			measureLabelColor: '#8b7bc8',
			lineColor: '#9d8ee8',
			areaColor: '#c4baef',
			borderColor: '#e0d9ff',
			deltaUpColor: '#10b981',
			deltaDownColor: '#f43f5e',
			deltaNeutralColor: '#a89ad8'
		},
		// Peach Blush - Warm apricot tones
		peachBlush: {
			backgroundColor: '#fff8f5',
			titleColor: '#a0522d',
			valueColor: '#7b3520',
			labelColor: '#d4845a',
			measureLabelColor: '#bf6040',
			lineColor: '#f0845a',
			areaColor: '#f5b49a',
			borderColor: '#fddccc',
			deltaUpColor: '#10b981',
			deltaDownColor: '#ef4444',
			deltaNeutralColor: '#d4845a'
		},

		// ── Distinctive / Bold ───────────────────────────────────────────────
		// Midnight Gold - Jet black with gold luxury accents
		midnightGold: {
			backgroundColor: '#0d0d0d',
			titleColor: '#c9a227',
			valueColor: '#f4c542',
			labelColor: '#8a6e1a',
			measureLabelColor: '#c9a227',
			lineColor: '#f4c542',
			areaColor: '#f4c542',
			borderColor: '#2a2200',
			deltaUpColor: '#4ade80',
			deltaDownColor: '#f87171',
			deltaNeutralColor: '#8a6e1a'
		},
		// Nord Light - Scandinavian clean arctic palette
		nordLight: {
			backgroundColor: '#eceff4',
			titleColor: '#4c566a',
			valueColor: '#2e3440',
			labelColor: '#7b88a1',
			measureLabelColor: '#4c566a',
			lineColor: '#5e81ac',
			areaColor: '#81a1c1',
			borderColor: '#d8dee9',
			deltaUpColor: '#a3be8c',
			deltaDownColor: '#bf616a',
			deltaNeutralColor: '#7b88a1'
		},
		// Arctic Frost - Icy blue-white clean design
		arcticFrost: {
			backgroundColor: '#e8f4f8',
			titleColor: '#2980b9',
			valueColor: '#1a5276',
			labelColor: '#5dade2',
			measureLabelColor: '#2980b9',
			lineColor: '#3498db',
			areaColor: '#85c1e9',
			borderColor: '#aed6f1',
			deltaUpColor: '#27ae60',
			deltaDownColor: '#e74c3c',
			deltaNeutralColor: '#5dade2'
		},
		deepMagenta: {
			backgroundColor: '#fff0f6',
			titleColor: '#831843',
			valueColor: '#9d174d',
			labelColor: '#be185d',
			measureLabelColor: '#9d174d',
			lineColor: '#e11d48',
			areaColor: '#fb7185',
			borderColor: '#fda4af',
			deltaUpColor: '#15803d',
			deltaDownColor: '#b91c1c',
			deltaNeutralColor: '#be185d'
		}
	};

	// Theme dropdown options (used by properties panel)
	const THEME_OPTIONS = [
		{ value: 'custom', label: 'Custom' },
		// Classic
		{ value: 'modernBlue', label: 'Modern Blue' },
		{ value: 'darkProfessional', label: 'Dark Professional' },
		{ value: 'gradientPurple', label: 'Gradient Purple' },
		{ value: 'minimalWhite', label: 'Minimal White' },
		{ value: 'oceanTeal', label: 'Ocean Teal' },
		{ value: 'sunsetWarm', label: 'Sunset Warm' },
		{ value: 'forestFresh', label: 'Forest Fresh' },
		{ value: 'royalGold', label: 'Royal Gold' },
		{ value: 'cyberNeon', label: 'Cyber Neon' },
		{ value: 'elegantGray', label: 'Elegant Gray' },
		{ value: 'glass', label: 'Glass Morphism' },
		{ value: 'slate', label: 'Slate' },
		{ value: 'ocean', label: 'Ocean' },
		{ value: 'sunset', label: 'Sunset' },
		{ value: 'emerald', label: 'Emerald' },
		{ value: 'violet', label: 'Violet' },
		// Corporate
		{ value: 'corporateNavy', label: 'Corporate Navy' },
		{ value: 'charcoalSteel', label: 'Charcoal Steel' },
		// Pastel
		{ value: 'roseQuartz', label: 'Rose Quartz' },
		{ value: 'lavenderSoft', label: 'Lavender Soft' },
		{ value: 'peachBlush', label: 'Peach Blush' },
		// Distinctive
		{ value: 'midnightGold', label: 'Midnight Gold' },
		{ value: 'nordLight', label: 'Nord Light' },
		{ value: 'arcticFrost', label: 'Arctic Frost' },
		{ value: 'deepMagenta', label: 'Deep Magenta' }
	];

	/**
	 * Gets effective colors based on theme and custom overrides.
	 * @param {Object} props - Extension properties
	 * @returns {Object} Resolved color map
	 */
	function getEffectiveColors(props) {
		if (!props) props = {};
		const selectedTheme = props.theme || 'custom';
		const theme = THEMES[selectedTheme] || {};

		function pickFromThemeOrUi(key, fallback) {
			if (selectedTheme && selectedTheme !== 'custom' && theme[key] != null && theme[key] !== '') {
				return theme[key];
			}
			if ((props && props[key]) != null && props[key] !== '') return props[key];
			return fallback != null ? fallback : undefined;
		}

		return {
			backgroundColor:    pickFromThemeOrUi('backgroundColor',    CONSTANTS.DEFAULT_BACKGROUND_COLOR),
			titleColor:         pickFromThemeOrUi('titleColor',         CONSTANTS.DEFAULT_TITLE_COLOR),
			valueColor:         pickFromThemeOrUi('valueColor',         CONSTANTS.DEFAULT_VALUE_COLOR),
			labelColor:         pickFromThemeOrUi('labelColor',         CONSTANTS.DEFAULT_LABEL_COLOR),
			measureLabelColor:  pickFromThemeOrUi('measureLabelColor',  CONSTANTS.DEFAULT_MEASURE_LABEL_COLOR),
			lineColor:          pickFromThemeOrUi('lineColor',          CONSTANTS.DEFAULT_LINE_COLOR),
			areaColor:          pickFromThemeOrUi('areaColor', pickFromThemeOrUi('lineColor', CONSTANTS.DEFAULT_AREA_COLOR)),
			borderColor:        pickFromThemeOrUi('borderColor',        CONSTANTS.DEFAULT_BORDER_COLOR),
			deltaUpColor:       pickFromThemeOrUi('deltaUpColor',       CONSTANTS.DEFAULT_DELTA_UP_COLOR),
			deltaDownColor:     pickFromThemeOrUi('deltaDownColor',     CONSTANTS.DEFAULT_DELTA_DOWN_COLOR),
			deltaNeutralColor:  pickFromThemeOrUi('deltaNeutralColor',  CONSTANTS.DEFAULT_DELTA_NEUTRAL_COLOR),
			gradientStart:      pickFromThemeOrUi('gradientStart',      props.gradientStart),
			gradientEnd:        pickFromThemeOrUi('gradientEnd',        props.gradientEnd)
		};
	}

	return {
		THEMES: THEMES,
		THEME_OPTIONS: THEME_OPTIONS,
		getEffectiveColors: getEffectiveColors
	};
});
