/**
 * KPI Card Extension - Constants & Configuration
 * All static configuration: defaults, icons, gradient presets, preset keys.
 */
define([], function () {
	'use strict';

	const CONSTANTS = {
		DEFAULT_FONT_FAMILY: 'Open Sans',
		DEFAULT_ANIMATION_DURATION: 600,
		DEFAULT_VALUE_ANIMATION_DURATION: 1000,
		DEFAULT_DELTA_ANIMATION_DURATION: 600,
		DEFAULT_AREA_ANIMATION_DURATION: 800,
		DEFAULT_PULSE_ANIMATION_DELAY: 300,
		DEFAULT_PADDING: 8,
		DEFAULT_BORDER_RADIUS: 0,
		DEFAULT_BORDER_WIDTH: 0,
		DEFAULT_LINE_WIDTH: 1.5,
		DEFAULT_AREA_OPACITY: 0.2,
		DEFAULT_PULSE_RADIUS: 1.8,
		DEFAULT_GLOW_STD_DEV: 2,
		DEFAULT_DELTA_DECIMALS: 1,
		DEFAULT_DELTA_GAP: 6,
		DEFAULT_LABEL_GAP: 4,
		DEFAULT_HEADER_GAP: 2,
		DEFAULT_LABELS_GAP: 2,
		DEFAULT_SECTION_GAP: 1,
		DEFAULT_KPI_SECTION_HEIGHT: 60,
		DEFAULT_TREND_SECTION_HEIGHT: 40,
		DEFAULT_LABEL_MAX_WIDTH_PCT: 45,
		DEFAULT_END_LABEL_OFFSET: 8,
		DEFAULT_START_LABEL_RIGHT_PAD: 6,
		DEFAULT_TREND_WINDOW_POINTS: 60,
		DEFAULT_TREND_WINDOW_DAYS: 180,
		DEFAULT_BUTTON1_VALUE: 12,
		DEFAULT_BUTTON2_VALUE: 60,
		DEFAULT_BUTTON3_VALUE: 365,
		DEFAULT_BUTTON1_LABEL: '12P',
		DEFAULT_BUTTON2_LABEL: '60P',
		DEFAULT_BUTTON3_LABEL: '1Y',
		DEFAULT_BUTTON_STYLE: 'rounded',
		DEFAULT_BUTTON_ACTIVE_COLOR: '#3b82f6',
		DEFAULT_BUTTON_ACTIVE_LABEL_COLOR: '#ffffff',
		DEFAULT_DELTA_UP_COLOR: '#16a34a',
		DEFAULT_DELTA_DOWN_COLOR: '#dc2626',
		DEFAULT_DELTA_NEUTRAL_COLOR: '#9ca3af',
		DEFAULT_PULSE_MIN_COLOR: '#dc2626',
		DEFAULT_PULSE_MAX_COLOR: '#16a34a',
		DEFAULT_GLOW_COLOR: '#ffffff',
		DEFAULT_LINE_COLOR: '#3f51b5',
		DEFAULT_AREA_COLOR: '#3f51b5',
		DEFAULT_VALUE_COLOR: '#111111',
		DEFAULT_TITLE_COLOR: '#111111',
		DEFAULT_LABEL_COLOR: '#555555',
		DEFAULT_MEASURE_LABEL_COLOR: '#666666',
		DEFAULT_BACKGROUND_COLOR: 'transparent',
		DEFAULT_BORDER_COLOR: 'transparent',
		DEFAULT_TOOLTIP_BACKGROUND: 'rgba(0,0,0,0.75)',
		DEFAULT_TOOLTIP_COLOR: '#fff',
		DEFAULT_TOOLTIP_PADDING: '4px 6px',
		DEFAULT_TOOLTIP_BORDER_RADIUS: 4,
		DEFAULT_TOOLTIP_FONT_SIZE: 10,
		MIN_CONTAINER_WIDTH: 10,
		MIN_CONTAINER_HEIGHT: 120,
		MIN_CONTAINER_HEIGHT_TABLET: 50,
		MIN_CONTAINER_HEIGHT_MOBILE: 35,
		TABLET_BREAKPOINT_HEIGHT: 350,
		MOBILE_BREAKPOINT_HEIGHT: 200,
		RESIZE_DEBOUNCE_DELAY: 50,
		ANIMATION_TRIGGER_DELAY: 100,
		DELTA_ANIMATION_DELAY: 300,
		BUTTON_CLICK_DELAY: 100,
		RESIZE_TIMEOUT: 100,
		VALUE_PADDING_PERCENT: 0.1,
		RESPONSIVE_FONT_BASE_SIZE: 16,
		RESPONSIVE_TITLE_MIN_EM: 0.5,
		RESPONSIVE_TITLE_MAX_EM: 1.2,
		RESPONSIVE_VALUE_MIN_EM: 1.2,
		RESPONSIVE_VALUE_MAX_EM: 2.5,
		RESPONSIVE_DELTA_MIN_EM: 0.7,
		RESPONSIVE_DELTA_MAX_EM: 1.4,
		RESPONSIVE_MEASURE_LABEL_MIN_EM: 0.6,
		RESPONSIVE_MEASURE_LABEL_MAX_EM: 1.0,
		RESPONSIVE_LABEL_MIN_EM: 0.5,
		RESPONSIVE_LABEL_MAX_EM: 0.9,
		DATE_LABEL_HEIGHT: 20,
		RESPONSIVE_TREND_TOP_MIN: 10,
		RESPONSIVE_TREND_TOP_MAX: 30,
		RESPONSIVE_TREND_TOP_PERCENT: 0.03,
		HOVER_SCALE_MULTIPLIER: 1.05,
		HOVER_LINE_THICKNESS_MULTIPLIER: 1.5,
		EASING_POWER: 3,
		GRADIENT_ID_PREFIX: 'kpiGrad-',
		FILTER_ID: 'kpiGlow',
		TOOLTIP_CLASS: 'kpi-tooltip',
		PULSE_CLASS: 'kpi-pulse',
		DARK_MODE_CLASS: 'kpi-card--dark',
		EMPTY_CLASS: 'kpi-card--empty',
		ANIMATING_CLASS: 'kpi-card__value--animating',
		ACTIVE_CLASS: 'active',
		RESIZE_EVENT_NAMESPACE: 'kpi-card',
		QUICK_BTN_CLASS: 'kpi-card__quick-btn',
		SPARKLINE_INNER_CLASS: 'kpi-card__sparkline-inner',
		VALUE_CLASS: 'kpi-card__value',
		DELTA_CLASS: 'kpi-card__delta',
		SPARKLINE_CLASS: 'kpi-card__sparkline'
	};

	const EMOJI_ICON_MAP = {
		'trending-up': '↗',
		'trending-down': '↘',
		'chart': '📊',
		'target': '🎯',
		'star': '⭐',
		'fire': '🔥',
		'diamond': '💎',
		'trophy': '🏆',
		'money': '💰',
		'dollar': '💵',
		'euro': '💶',
		'yen': '💴',
		'pound': '💷',
		'bank': '🏦',
		'credit-card': '💳',
		'wallet': '👛',
		'coins': '🪙',
		'growth': '📈',
		'decline': '📉',
		'profit': '💹',
		'loss': '📉',
		'sales': '🛒',
		'revenue': '💼',
		'rocket': '🚀',
		'lightning': '⚡',
		'flag': '🚩',
		'medal': '🥇',
		'award': '🎖️',
		'check': '✅',
		'warning': '⚠️',
		'clock': '🕐',
		'calendar': '📅',
		'people': '👥',
		'person': '👤',
		'building': '🏢',
		'factory': '🏭',
		'globe': '🌍',
		'package': '📦',
		'truck': '🚚',
		'percentage': '💯',
		'idea': '💡',
		'lock': '🔒',
		'key': '🔑',
		'gear': '⚙️',
		'inbox': '📥',
		'email': '📧',
		'phone': '📱',
		'pin': '📍'
	};

	const MODERN_ICON_MAP = {
		'trend-up': {
			viewBox: '0 0 24 24',
			paths: [
				'M3 17l6-6 4 4 8-8',
				'M21 10v6h-6'
			]
		},
		'trend-down': {
			viewBox: '0 0 24 24',
			paths: [
				'M3 7l6 6 4-4 8 8',
				'M21 14v-6h-6'
			]
		},
		'bar-chart': {
			viewBox: '0 0 24 24',
			paths: [
				'M3 3v18',
				'M3 17h18',
				'M7 10v7',
				'M12 4v13',
				'M17 7v10'
			]
		},
		'pie-chart': {
			viewBox: '0 0 24 24',
			paths: [
				'M21.21 15.89A10 10 0 1 1 8.11 2.79',
				'M22 12A10 10 0 0 0 12 2v10z'
			]
		},
		'shield-dollar': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 2l7 4v5c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V6z',
				'M12 8v8',
				'M9.5 11h5'
			]
		},
		'wallet-card': {
			viewBox: '0 0 24 24',
			paths: [
				'M3 7h18v10H3z',
				'M16 3h-8a3 3 0 0 0-3 3v1',
				'M21 12h-4',
				'M17 12v4'
			]
		},
		'circle-check': {
			viewBox: '0 0 24 24',
			paths: [
				'M22 11.08V12a10 10 0 1 1-5.93-9.14',
				'M22 4L12 14.01l-3-3'
			]
		},
		'users': {
			viewBox: '0 0 24 24',
			paths: [
				'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
				'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
				'M23 21v-2a4 4 0 0 0-3-3.87',
				'M16 3.13a4 4 0 0 1 0 7.75'
			]
		},
		'activity': {
			viewBox: '0 0 24 24',
			paths: [
				'M22 12h-4l-3 9L9 3l-3 9H2'
			]
		},
		'dollar-sign': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 1v22',
				'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
			]
		},
		'target': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
				'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12',
				'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4'
			]
		},
		'arrow-up': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 19V5',
				'M5 12l7-7 7 7'
			]
		},
		'arrow-down': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 5v14',
				'M19 12l-7 7-7-7'
			]
		},
		'zap': {
			viewBox: '0 0 24 24',
			paths: [
				'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
			]
		},
		'flag': {
			viewBox: '0 0 24 24',
			paths: [
				'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z',
				'M4 22v-7'
			]
		},
		'package': {
			viewBox: '0 0 24 24',
			paths: [
				'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
				'M3.27 6.96L12 12.01l8.73-5.05',
				'M12 22.08V12'
			]
		},
		'clock': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
				'M12 6v6l4 2'
			]
		},
		'settings': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
				'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
			]
		},
		'globe': {
			viewBox: '0 0 24 24',
			paths: [
				'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
				'M2 12h20',
				'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
			]
		}
	};

	const EMOJI_ICON_OPTIONS = [
		{ value: 'trending-up',   label: '↗ Trending Up' },
		{ value: 'trending-down', label: '↘ Trending Down' },
		{ value: 'growth',        label: '📈 Growth' },
		{ value: 'decline',       label: '📉 Decline' },
		{ value: 'chart',         label: '📊 Chart' },
		{ value: 'profit',        label: '💹 Profit' },
		{ value: 'target',        label: '🎯 Target' },
		{ value: 'trophy',        label: '🏆 Trophy' },
		{ value: 'medal',         label: '🥇 Medal' },
		{ value: 'award',         label: '🎖️ Award' },
		{ value: 'star',          label: '⭐ Star' },
		{ value: 'fire',          label: '🔥 Fire' },
		{ value: 'lightning',     label: '⚡ Lightning' },
		{ value: 'rocket',        label: '🚀 Rocket' },
		{ value: 'flag',          label: '🚩 Flag' },
		{ value: 'check',         label: '✅ Check' },
		{ value: 'warning',       label: '⚠️ Warning' },
		{ value: 'idea',          label: '💡 Idea' },
		{ value: 'money',         label: '💰 Money Bag' },
		{ value: 'dollar',        label: '💵 Dollar' },
		{ value: 'euro',          label: '💶 Euro' },
		{ value: 'bank',          label: '🏦 Bank' },
		{ value: 'credit-card',   label: '💳 Credit Card' },
		{ value: 'wallet',        label: '👛 Wallet' },
		{ value: 'coins',         label: '🪙 Coins' },
		{ value: 'percentage',    label: '💯 Percentage' },
		{ value: 'revenue',       label: '💼 Briefcase' },
		{ value: 'sales',         label: '🛒 Sales Cart' },
		{ value: 'package',       label: '📦 Package' },
		{ value: 'truck',         label: '🚚 Truck' },
		{ value: 'building',      label: '🏢 Building' },
		{ value: 'factory',       label: '🏭 Factory' },
		{ value: 'people',        label: '👥 People' },
		{ value: 'person',        label: '👤 Person' },
		{ value: 'globe',         label: '🌍 Globe' },
		{ value: 'calendar',      label: '📅 Calendar' },
		{ value: 'clock',         label: '🕐 Clock' },
		{ value: 'gear',          label: '⚙️ Gear' },
		{ value: 'pin',           label: '📍 Pin' },
		{ value: 'diamond',       label: '💎 Diamond' }
	];

	const MODERN_ICON_OPTIONS = [
		{ value: 'trend-up',     label: 'Trend Up' },
		{ value: 'trend-down',   label: 'Trend Down' },
		{ value: 'arrow-up',     label: 'Arrow Up' },
		{ value: 'arrow-down',   label: 'Arrow Down' },
		{ value: 'activity',     label: 'Activity / Pulse' },
		{ value: 'bar-chart',    label: 'Bar Chart' },
		{ value: 'pie-chart',    label: 'Pie Chart' },
		{ value: 'target',       label: 'Target' },
		{ value: 'circle-check', label: 'Circle Check' },
		{ value: 'zap',          label: 'Zap / Lightning' },
		{ value: 'flag',         label: 'Flag' },
		{ value: 'dollar-sign',  label: 'Dollar Sign' },
		{ value: 'shield-dollar', label: 'Shield Dollar' },
		{ value: 'wallet-card',  label: 'Wallet Card' },
		{ value: 'package',      label: 'Package' },
		{ value: 'clock',        label: 'Clock' },
		{ value: 'users',        label: 'Users / People' },
		{ value: 'globe',        label: 'Globe' },
		{ value: 'settings',     label: 'Settings / Gear' }
	];

	const GRADIENT_PRESETS = [
		{ value: 'custom', label: 'Custom (manual)' },
		{ value: 'sunrise', label: 'Sunrise Glow', start: '#ff9a9e', end: '#fad0c4', direction: 'diagonal' },
		{ value: 'ocean', label: 'Ocean Deep', start: '#2193b0', end: '#6dd5ed', direction: 'vertical' },
		{ value: 'forest', label: 'Forest Haze', start: '#a8e063', end: '#56ab2f', direction: 'diagonal' },
		{ value: 'dusk', label: 'Dusk Purple', start: '#614385', end: '#516395', direction: 'horizontal' },
		{ value: 'lava', label: 'Lava Heat', start: '#ff512f', end: '#dd2476', direction: 'vertical' },
		{ value: 'aurora', label: 'Aurora Mint', start: '#00c6ff', end: '#0072ff', direction: 'diagonal' },
		{ value: 'pastel', label: 'Pastel Dream', start: '#fbc2eb', end: '#a6c1ee', direction: 'vertical' },
		{ value: 'charcoal', label: 'Charcoal Fade', start: '#232526', end: '#414345', direction: 'horizontal' }
	];

	const PRESET_ALLOWED_KEYS = [
		// Content & alignment
		'title', 'measureLabel', 'measureLabelPos', 'measureLabelGap', 'align',
		'showLabelDates', 'labelMaxWidthPct', 'endLabelOffsetPx', 'startLabelRightPadPx', 'labelsGapPx',
		// Secondary KPI styling
		'secondaryKpiPosition', 'secondaryLabel', 'secondaryColor', 'secondaryFontSize', 'secondaryFontFamily',
		// Typography
		'fontMode', 'valueFontSize', 'titleFontSize', 'deltaFontSize', 'measureLabelSize', 'labelFontSize',
		'valueFontFamily', 'titleFontFamily', 'deltaFontFamily', 'measureLabelFontFamily', 'labelFontFamily',
		// Colors & theme
		'theme', 'valueColor', 'titleColor', 'labelColor', 'measureLabelColor', 'backgroundColor', 'borderColor', 'darkMode',
		// Layout
		'borderWidth', 'borderRadius', 'padding', 'headerGapPx', 'cardElevation',
		'useGradient', 'gradientPreset', 'gradientStart', 'gradientEnd', 'gradientDirection',
		// Icons
		'showIcon', 'iconPack', 'iconType', 'iconCustom', 'iconSize', 'iconPosition',
		// Delta visual
		'showDelta', 'deltaDisplayType', 'deltaUseShortFormat', 'deltaDecimals', 'deltaFontSize', 'deltaFontFamily',
		'deltaUpColor', 'deltaDownColor', 'deltaNeutralColor', 'deltaGap', 'showStatusBadge',
		// Sections / layout ratios
		'kpiSectionHeight', 'trendSectionHeight', 'sectionGap',
		// Trend visuals
		'showTrend', 'trendPosition', 'trendMode', 'trendCorners', 'lineColor', 'lineWidth',
		'areaColor', 'areaOpacity', 'areaGradient', 'areaGradientType', 'areaGradStartColor', 'areaGradEndColor',
		'areaGradStartOpacity', 'areaGradEndOpacity', 'showQuickButtons',
		'button1Value', 'button1Label', 'button2Value', 'button2Label', 'button3Value', 'button3Label',
		'buttonStyle', 'buttonBackgroundColor', 'buttonLabelColor', 'buttonActiveColor', 'buttonActiveLabelColor',
		// Selection indicator visuals
		'selectedIndicator', 'selectedColor',
		// Number formatting
		'kpi1FormatType', 'kpi1FormatDecimals', 'kpi1FormatUseThousandSep', 'kpi1FormatPrefix', 'kpi1FormatSuffix',
		'kpi2FormatType', 'kpi2FormatDecimals', 'kpi2FormatUseThousandSep', 'kpi2FormatPrefix', 'kpi2FormatSuffix',
		// Effects & hover
		'showGlow', 'glowColor', 'glowStdDev', 'showTooltip', 'showMinMax',
		'pulseRadius', 'pulseMinColor', 'pulseMaxColor', 'hoverValueScale', 'hoverLineThickness', 'hoverLineThicknessMultiplier'
	];

	return {
		CONSTANTS: CONSTANTS,
		EMOJI_ICON_MAP: EMOJI_ICON_MAP,
		MODERN_ICON_MAP: MODERN_ICON_MAP,
		EMOJI_ICON_OPTIONS: EMOJI_ICON_OPTIONS,
		MODERN_ICON_OPTIONS: MODERN_ICON_OPTIONS,
		GRADIENT_PRESETS: GRADIENT_PRESETS,
		PRESET_ALLOWED_KEYS: PRESET_ALLOWED_KEYS
	};
});
