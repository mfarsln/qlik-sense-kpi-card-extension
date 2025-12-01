/*
	KPI Card extension for Qlik Sense
	- Accepts exactly one measure for the KPI value and trend
	- Requires one date dimension (used only for the sparkline trend)
	- Renders sparkline without axes; shows only start/end date labels
*/

define([
	'qlik',
	'jquery',
	'text!./styles.css'
], function (qlik, $, stylesCss) {
	'use strict';

	// Session Storage Helper Functions
	function getSessionKey(elementId) {
		return 'kpi-card-selected-button-' + (elementId || 'default');
	}
	
	function saveSelectedButton(elementId, buttonValue) {
		try {
			sessionStorage.setItem(getSessionKey(elementId), buttonValue);
		} catch (e) {
			// Silently handle storage errors
		}
	}
	
	function getSelectedButton(elementId) {
		try {
			return sessionStorage.getItem(getSessionKey(elementId));
		} catch (e) {
			return null;
		}
	}

	// Constants
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
	'revenue': '💼'
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
	}
};

const EMOJI_ICON_OPTIONS = [
	{ value: 'trending-up', label: 'Trending Up' },
	{ value: 'trending-down', label: 'Trending Down' },
	{ value: 'chart', label: 'Chart' },
	{ value: 'target', label: 'Target' },
	{ value: 'star', label: 'Star' },
	{ value: 'fire', label: 'Fire' },
	{ value: 'diamond', label: 'Diamond' },
	{ value: 'trophy', label: 'Trophy' },
	{ value: 'money', label: 'Money Bag' },
	{ value: 'wallet', label: 'Wallet' },
	{ value: 'coins', label: 'Coins' },
	{ value: 'growth', label: 'Growth' },
	{ value: 'decline', label: 'Decline' },
	{ value: 'profit', label: 'Profit' },
	{ value: 'sales', label: 'Sales Cart' },
	{ value: 'revenue', label: 'Briefcase' }
];

const MODERN_ICON_OPTIONS = [
	{ value: 'trend-up', label: 'Trend Up' },
	{ value: 'trend-down', label: 'Trend Down' },
	{ value: 'bar-chart', label: 'Bar Chart' },
	{ value: 'pie-chart', label: 'Pie Chart' },
	{ value: 'shield-dollar', label: 'Shield Dollar' },
	{ value: 'wallet-card', label: 'Wallet Card' }
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
	// Number formatting (visual only)
	'useShortFormatKpi', 'kpiDecimalPlaces', 'valuePrefix', 'valuePrefixCustom', 'valueSuffix', 'valueSuffixCustom',
	'showSecondaryKpi', 'secondaryLabel', 'secondaryColor', 'secondaryFontSize', 'secondaryFontFamily', 'secondaryDecimalPlaces',
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
	// Effects & hover
	'showGlow', 'glowColor', 'glowStdDev', 'showTooltip', 'showMinMax',
	'pulseRadius', 'pulseMinColor', 'pulseMaxColor', 'hoverValueScale', 'hoverLineThickness', 'hoverLineThicknessMultiplier'
];

function decodeCustomMarkup(markup) {
	if (!markup) return '';
	let decoded = markup;
	try {
		decoded = decoded
			.replace(/\\u003c/gi, '<')
			.replace(/\\u003e/gi, '>')
			.replace(/\\u0026/gi, '&')
			.replace(/&lt;/gi, '<')
			.replace(/&gt;/gi, '>')
			.replace(/&amp;/gi, '&');
	} catch (e) {
		// ignore
	}
	return decoded;
}

function sanitizeSvgMarkup(markup, size) {
	if (!markup) return '';
	try {
		if (window.DOMParser) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(markup, 'image/svg+xml');
			const svg = doc.querySelector('svg');
			if (svg) {
				svg.setAttribute('width', size);
				svg.setAttribute('height', size);
				if (!svg.getAttribute('xmlns')) {
					svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
				}
				svg.setAttribute('preserveAspectRatio', svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet');
				return new XMLSerializer().serializeToString(svg);
			}
		}
	} catch (e) {
		// Ignore parser errors, fall back to original markup
	}
	return markup;
}

	function sanitizePresetProps(props) {
		const snapshot = {};
		if (!props) return snapshot;
		PRESET_ALLOWED_KEYS.forEach(function(key) {
			if (Object.prototype.hasOwnProperty.call(props, key)) {
				const value = props[key];
				if (typeof value !== 'function') {
					snapshot[key] = value;
				}
			}
		});
		return snapshot;
	}

	function serializePresetProps(props) {
		try {
			return JSON.stringify(sanitizePresetProps(props), null, 2);
		} catch (e) {
			console.error('KPI Card: Failed to serialize preset', e);
			return '';
		}
	}

	function parsePresetText(text) {
		if (!text || typeof text !== 'string') return null;
		try {
			return JSON.parse(text);
		} catch (e) {
			console.error('KPI Card: Invalid preset JSON', e);
			return null;
		}
	}

	function applyPresetToProps(targetProps, preset) {
		if (!targetProps || !preset || typeof preset !== 'object') return;
		PRESET_ALLOWED_KEYS.forEach(function(key) {
			if (Object.prototype.hasOwnProperty.call(preset, key)) {
				targetProps[key] = preset[key];
			}
		});
	}

	// Inject styles
	$('<style>').html(stylesCss + '\n' +
		'.kpi-tooltip{position:absolute;pointer-events:none;z-index:2;background:' + CONSTANTS.DEFAULT_TOOLTIP_BACKGROUND + ';color:' + CONSTANTS.DEFAULT_TOOLTIP_COLOR + ';padding:' + CONSTANTS.DEFAULT_TOOLTIP_PADDING + ';border-radius:' + CONSTANTS.DEFAULT_TOOLTIP_BORDER_RADIUS + 'px;font-size:' + CONSTANTS.DEFAULT_TOOLTIP_FONT_SIZE + 'px;white-space:nowrap;transform:translate(-50%,-120%);}\n' +
		'@keyframes kpi-pulse{0%{opacity:.9}50%{opacity:.35}100%{opacity:.9}}\n' +
		'.kpi-pulse{animation:kpi-pulse 1.6s infinite ease-in-out;}\n' +
		'/* Force remove Qlik theme borders */\n' +
		'.qv-object[data-qv-object="kpi-card"],.qv-object[data-qv-object="kpi-card"] *,.qv-object[data-qv-object="kpi-card"] .qv-object-content,.qv-object[data-qv-object="kpi-card"] .qv-object-body{border:none!important;outline:none!important;box-shadow:none!important;background:transparent!important;}\n' +
		'.lv-object[data-qv-object="kpi-card"],.lv-object[data-qv-object="kpi-card"] *,.lv-object[data-qv-object="kpi-card"] .lv-object-content{border:none!important;outline:none!important;box-shadow:none!important;background:transparent!important;}\n'
	).appendTo('head');

	/**
	 * Formats a number value with proper prefixes, suffixes, and scaling
	 * @param {number|null|undefined} value - The value to format
	 * @param {Object} qMeasureInfo - Qlik measure information
	 * @param {Object} layout - Layout configuration
	 * @param {boolean} isDelta - Whether this is a delta value (uses deltaUseShortFormat)
	 * @returns {string} Formatted number string
	 */
	function formatNumber(value, qMeasureInfo, layout, isDelta, customDecimals) {
		if (value === null || value === undefined) return '-';
		
		const fmt = (qMeasureInfo && qMeasureInfo.qNumFormat && qMeasureInfo.qNumFormat.qFmt) || null;
		let isPercent = false;
		let percentDecimals = null;
		
		// Check if format indicates percentage
		if (fmt && fmt.indexOf('%') !== -1) {
			isPercent = true;
			const match = fmt.match(/\.(\d+)[^%]*%/);
			if (match) percentDecimals = match[1].length;
		}
		
		// Check if suffix indicates percentage
		if (!isPercent && layout && layout.props) {
			const suffix = layout.props.valueSuffix === 'custom' ? 
				layout.props.valueSuffixCustom : layout.props.valueSuffix;
			if (suffix === '%') isPercent = true;
		}
		
		// Handle percentage formatting
		if (isPercent && typeof value === 'number' && isFinite(value)) {
			const scaled = (Math.abs(value) <= 1) ? (value * 100) : value;
			const decimals = (percentDecimals != null) ? percentDecimals : 0;
			const pctStr = (isFinite(scaled) && typeof decimals === 'number') ? 
				scaled.toFixed(decimals) : String(scaled);
			let result = pctStr + '%';
			
			// Apply prefix only; skip suffix to avoid double '%'
			if (layout && layout.props) {
				const prefix = layout.props.valuePrefix === 'custom' ? 
					layout.props.valuePrefixCustom : layout.props.valuePrefix;
				if (prefix) result = prefix + result;
			}
			return result;
		}
		
		// Format non-percentage values
		let formatted = '';
		try {
			if (typeof value === 'number' && fmt && qlik && qlik.formatNumber) {
				formatted = qlik.formatNumber(value, fmt);
			}
		} catch (e) {
			// Silently handle formatting errors
		}
		
		// Fallback formatting with scaling (only if useShortFormat is enabled)
		// For delta values, use deltaUseShortFormat; for KPI values, use useShortFormat
		const useShortFormat = isDelta ? 
			(layout && layout.props && layout.props.deltaUseShortFormat !== false) : 
			(layout && layout.props && layout.props.useShortFormat !== false); // Default to true for backward compatibility
		
		if (!formatted && typeof value === 'number') {
			const decimalsToUse = (typeof customDecimals === 'number') ? customDecimals :
				(isDelta ? (layout.props.deltaDecimalPlaces ?? layout.props.deltaDecimals ?? 2) : (layout.props.kpiDecimalPlaces ?? 2));
			if (useShortFormat) {
				// Use K, M, B abbreviations
				const abs = Math.abs(value);
				if (abs >= 1e9) {
					formatted = (value / 1e9).toFixed(decimalsToUse) + 'B';
				} else if (abs >= 1e6) {
					formatted = (value / 1e6).toFixed(decimalsToUse) + 'M';
				} else if (abs >= 1e3) {
					formatted = (value / 1e3).toFixed(decimalsToUse) + 'K';
				} else {
					formatted = value.toLocaleString(undefined, {
						minimumFractionDigits: decimalsToUse,
						maximumFractionDigits: decimalsToUse
					});
				}
			} else {
				// Use full number with thousand separators
				const abs = Math.abs(value);
				const localeOpts = {
					maximumFractionDigits: decimalsToUse,
					minimumFractionDigits: decimalsToUse
				};
				formatted = value.toLocaleString(undefined, localeOpts);
			}
		}
		
		if (!formatted) formatted = String(value);
		
		// Apply prefix and suffix (non-percent case)
		if (layout && layout.props) {
			const prefix = layout.props.valuePrefix === 'custom' ? 
				layout.props.valuePrefixCustom : layout.props.valuePrefix;
			const suffix = layout.props.valueSuffix === 'custom' ? 
				layout.props.valueSuffixCustom : layout.props.valueSuffix;
			formatted = (prefix || '') + formatted + (suffix || '');
		}
		
		return formatted;
	}

	/**
	 * Formats a date label (simple pass-through for now)
	 * @param {string} label - Date label to format
	 * @returns {string} Formatted date label
	 */
	function formatDate(label) {
		return label || '';
	}

	/**
	 * Animates a counter from start to end value with easing
	 * @param {HTMLElement} element - DOM element to animate
	 * @param {number} startValue - Starting value
	 * @param {number} endValue - Ending value
	 * @param {number} duration - Animation duration in milliseconds
	 * @param {Function} formatFunction - Function to format the displayed value
	 * @returns {Function} Function to stop the animation
	 */
	function animateCounter(element, startValue, endValue, duration, formatFunction) {
		if (!element || startValue === endValue) return function() {};
		
		let startTime = null;
		let isAnimating = true;
		
		function animate(currentTime) {
			if (!startTime) startTime = currentTime;
			const progress = Math.min((currentTime - startTime) / duration, 1);
			
			// Easing function (ease-out)
			const easeOut = 1 - Math.pow(1 - progress, CONSTANTS.EASING_POWER);
			
			const currentValue = startValue + (endValue - startValue) * easeOut;
			
			if (formatFunction) {
				element.textContent = formatFunction(currentValue);
			} else {
				element.textContent = Math.round(currentValue);
			}
			
			if (progress < 1 && isAnimating) {
				requestAnimationFrame(animate);
			} else {
				// Ensure final value is exact
				if (formatFunction) {
					element.textContent = formatFunction(endValue);
				} else {
					element.textContent = Math.round(endValue);
				}
			}
		}
		
		requestAnimationFrame(animate);
		
		// Return function to stop animation
		return function() { 
			isAnimating = false; 
		};
	}

	/**
	 * Computes aggregate value from data pairs based on mode
	 * @param {Array} dataPairs - Array of [label, value] pairs
	 * @param {string} mode - Aggregation mode ('sum', 'avg', 'min', 'max', 'last')
	 * @returns {number|null} Aggregated value or null if no valid data
	 */
	function computeAggregate(dataPairs, mode) {
		// Extract valid values
		const vals = dataPairs
			.map(pair => pair[1])
			.filter(val => val !== null && val !== undefined && !isNaN(val));
		
		if (!vals.length) return null;
		
		switch (mode) {
			case 'sum':
				return vals.reduce((sum, val) => sum + val, 0);
			case 'avg':
				return vals.reduce((sum, val) => sum + val, 0) / vals.length;
			case 'min':
				return Math.min(...vals);
			case 'max':
				return Math.max(...vals);
			case 'last':
			default:
				return vals[vals.length - 1];
		}
	}

	/**
	 * Filters rows based on window mode and properties
	 * @param {Array} rows - Array of row objects with dateNum property
	 * @param {Object} props - Properties containing window configuration
	 * @returns {Array} Filtered rows array
	 */
	function filterByWindow(rows, props) {
		if (!rows.length) return rows;
		
		const mode = props.trendWindowMode || 'all';
		if (mode === 'all') return rows;
		
		if (mode === 'lastNPoints') {
			const n = Math.max(1, Math.floor(props.trendWindowPoints || CONSTANTS.DEFAULT_TREND_WINDOW_POINTS));
			return rows.slice(Math.max(0, rows.length - n));
		}
		
		if (mode === 'lastNDays') {
			const days = Math.max(1, Math.floor(props.trendWindowDays || CONSTANTS.DEFAULT_TREND_WINDOW_DAYS));
			const end = rows[rows.length - 1].dateNum;
			
			if (!isFinite(end)) return rows;
			
			const startThreshold = end - days;
			const filteredRows = [];
			
			// Iterate backwards to find rows within the date range
			for (let i = rows.length - 1; i >= 0; i--) {
				const d = rows[i].dateNum;
				if (!isFinite(d)) continue;
				if (d >= startThreshold) {
					filteredRows.push(rows[i]);
				} else {
					break;
				}
			}
			
			filteredRows.reverse();
			return filteredRows.length ? filteredRows : rows;
		}
		
		return rows;
	}

	/**
	 * Builds SVG path string from points array
	 * @param {Array} points - Array of [x, y] coordinate pairs
	 * @param {boolean} smooth - Whether to use smooth curves
	 * @returns {string} SVG path string
	 */
	function buildPath(points, smooth) {
		if (!points.length) return '';
		
		let pathData = '';
		
		if (!smooth) {
			// Simple line path
			for (let i = 0; i < points.length; i++) {
				const point = points[i];
				if (point[1] === null) continue;
				
				if (pathData) {
					pathData += ' L' + point[0] + ',' + point[1];
				} else {
					pathData = 'M' + point[0] + ',' + point[1];
				}
			}
			return pathData;
		}
		
		// Smooth curve path
		let prevPoint = null;
		for (let i = 0; i < points.length; i++) {
			const point = points[i];
			if (point[1] === null) {
				prevPoint = null;
				continue;
			}
			
			if (!prevPoint) {
				pathData = 'M' + point[0] + ',' + point[1];
				prevPoint = point;
				continue;
			}
			
			const midX = (prevPoint[0] + point[0]) / 2;
			const midY = (prevPoint[1] + point[1]) / 2;
			pathData += ' Q' + prevPoint[0] + ',' + prevPoint[1] + ' ' + midX + ',' + midY;
			prevPoint = point;
		}
		
		if (prevPoint) {
			pathData += ' T' + prevPoint[0] + ',' + prevPoint[1];
		}
		
		return pathData;
	}

	// SVG Helper Functions
	/**
	 * Creates SVG filter for glow effect
	 * @param {Document} document - Document object
	 * @param {Object} opts - Options containing glow configuration
	 * @returns {SVGFilterElement} Created filter element
	 */
	function createGlowFilter(document, opts) {
		const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
		filter.setAttribute('id', CONSTANTS.FILTER_ID);
		filter.setAttribute('x', '-50%');
		filter.setAttribute('y', '-50%');
		filter.setAttribute('width', '200%');
		filter.setAttribute('height', '200%');
		
		const feGaussian = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
		feGaussian.setAttribute('stdDeviation', String(opts.glowStdDev || CONSTANTS.DEFAULT_GLOW_STD_DEV));
		feGaussian.setAttribute('result', 'coloredBlur');
		
		const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
		const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
		feMergeNode1.setAttribute('in', 'coloredBlur');
		const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
		feMergeNode2.setAttribute('in', 'SourceGraphic');
		
		feMerge.appendChild(feMergeNode1);
		feMerge.appendChild(feMergeNode2);
		filter.appendChild(feGaussian);
		filter.appendChild(feMerge);
		
		return filter;
	}

	/**
	 * Creates SVG gradient for area fill
	 * @param {Document} document - Document object
	 * @param {Object} opts - Options containing gradient configuration
	 * @returns {SVGGradientElement} Created gradient element
	 */
	function createAreaGradient(document, opts) {
		const gradId = CONSTANTS.GRADIENT_ID_PREFIX + Math.floor(Math.random() * 1e9);
		const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
		grad.setAttribute('id', gradId);
		
		if (opts.areaGradientType === 'vertical') {
			grad.setAttribute('x1', '0%');
			grad.setAttribute('y1', '0%');
			grad.setAttribute('x2', '0%');
			grad.setAttribute('y2', '100%');
		} else {
			grad.setAttribute('x1', '0%');
			grad.setAttribute('y1', '0%');
			grad.setAttribute('x2', '100%');
			grad.setAttribute('y2', '0%');
		}
		
		const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		stop1.setAttribute('offset', '0%');
		stop1.setAttribute('stop-color', opts.areaGradStartColor || (opts.areaColor || 'currentColor'));
		stop1.setAttribute('stop-opacity', String(
			(opts.areaGradStartOpacity != null ? opts.areaGradStartOpacity : opts.areaOpacity) != null ? 
			(opts.areaGradStartOpacity != null ? opts.areaGradStartOpacity : opts.areaOpacity) : 
			CONSTANTS.DEFAULT_AREA_OPACITY
		));
		
		const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		stop2.setAttribute('offset', '100%');
		stop2.setAttribute('stop-color', opts.areaGradEndColor || (opts.areaColor || 'currentColor'));
		stop2.setAttribute('stop-opacity', String((opts.areaGradEndOpacity != null ? opts.areaGradEndOpacity : 0)));
		
		grad.appendChild(stop1);
		grad.appendChild(stop2);
		
		return { gradient: grad, id: gradId };
	}

	/**
	 * Creates SVG path element for sparkline
	 * @param {Document} document - Document object
	 * @param {string} pathData - SVG path data string
	 * @param {Object} opts - Options containing styling configuration
	 * @returns {SVGPathElement} Created path element
	 */
	function createSparklinePath(document, pathData, opts) {
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', pathData);
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', (opts && opts.lineColor) || 'currentColor');
		path.setAttribute('stroke-width', String((opts && opts.lineWidth) || CONSTANTS.DEFAULT_LINE_WIDTH));
		
		if (opts && opts.showGlow) {
			path.setAttribute('filter', 'url(#' + CONSTANTS.FILTER_ID + ')');
		}
		
		return path;
	}

	/**
	 * Creates SVG area fill path
	 * @param {Document} document - Document object
	 * @param {string} pathData - Base path data
	 * @param {Array} points - Points array for area calculation
	 * @param {number} height - Container height
	 * @param {number} paddingTop - Top padding
	 * @param {Object} opts - Options containing styling configuration
	 * @param {string} gradId - Gradient ID if using gradient
	 * @returns {SVGPathElement} Created area path element
	 */
	function createAreaPath(document, pathData, points, height, paddingTop, opts, gradId) {
		if (!pathData || !points.length) return null;
		
		const first = points[0];
		const last = points[points.length - 1];
		if (!first || !last) return null;
		
		const areaPathData = pathData + 
			' L' + last[0] + ',' + (height + paddingTop) + 
			' L' + first[0] + ',' + (height + paddingTop) + 
			' Z';
		
		const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		area.setAttribute('d', areaPathData);
		
		if (opts.areaGradient && gradId) {
			area.setAttribute('fill', 'url(#' + gradId + ')');
		} else {
			const fill = (opts && opts.areaColor) || (opts && opts.lineColor) || 'currentColor';
			area.setAttribute('fill', fill);
			area.setAttribute('opacity', String((opts && opts.areaOpacity) != null ? opts.areaOpacity : CONSTANTS.DEFAULT_AREA_OPACITY));
		}
		
		if (opts && opts.showGlow) {
			area.setAttribute('filter', 'url(#' + CONSTANTS.FILTER_ID + ')');
		}
		
		return area;
	}

	/**
	 * Creates min/max pulse markers
	 * @param {Document} document - Document object
	 * @param {Array} dataPairs - Data pairs array
	 * @param {Array} points - Points array
	 * @param {Object} opts - Options containing styling configuration
	 * @returns {Array} Array of marker elements
	 */
	function createMinMaxMarkers(document, dataPairs, points, opts) {
		if (!opts.showMinMax) return [];
		
		let minIdx = -1, maxIdx = -1;
		let minVal = Infinity, maxVal = -Infinity;
		
		// Find min/max indices
		for (let i = 0; i < dataPairs.length; i++) {
			const val = dataPairs[i][1];
			if (val == null || isNaN(val)) continue;
			if (val < minVal) {
				minVal = val;
				minIdx = i;
			}
			if (val > maxVal) {
				maxVal = val;
				maxIdx = i;
			}
		}
		
		const markers = [];
		
		function addMarker(idx, color) {
			if (idx < 0 || points[idx][1] == null) return;
			
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', String(points[idx][0]));
			circle.setAttribute('cy', String(points[idx][1]));
			circle.setAttribute('r', String((opts && opts.pulseRadius) || CONSTANTS.DEFAULT_PULSE_RADIUS));
			circle.setAttribute('fill', color || 'currentColor');
			circle.setAttribute('class', CONSTANTS.PULSE_CLASS);
			
			if (opts && opts.showGlow) {
				circle.setAttribute('filter', 'url(#' + CONSTANTS.FILTER_ID + ')');
			}
			
			markers.push(circle);
		}
		
		// Always add markers immediately - animation is handled by CSS
		addMarker(minIdx, opts.pulseMinColor || CONSTANTS.DEFAULT_PULSE_MIN_COLOR);
		addMarker(maxIdx, opts.pulseMaxColor || CONSTANTS.DEFAULT_PULSE_MAX_COLOR);
		
		return markers;
	}

	/**
	 * Creates tooltip functionality for sparkline
	 * @param {jQuery} $container - Container element
	 * @param {SVGElement} svg - SVG element
	 * @param {Array} dataPairs - Data pairs array
	 * @param {Array} points - Points array
	 * @param {number} width - Container width
	 * @param {Object} opts - Options containing tooltip configuration
	 */
	function createTooltip($container, svg, dataPairs, points, width, opts) {
		if (!opts.showTooltip) return;
		
		const tooltip = document.createElement('div');
		tooltip.className = CONSTANTS.TOOLTIP_CLASS;
		tooltip.style.display = 'none';
		$container.css('position', 'relative')[0].appendChild(tooltip);
		
		svg.addEventListener('mousemove', function(ev) {
			const rect = svg.getBoundingClientRect();
			const mx = ev.clientX - rect.left;
			const ratio = (points.length === 1) ? 0 : Math.max(0, Math.min(1, mx / width));
			const idx = Math.round(ratio * (points.length - 1));
			
			if (idx < 0 || idx >= dataPairs.length) {
				tooltip.style.display = 'none';
				return;
			}
			
			const label = dataPairs[idx][0];
			const val = dataPairs[idx][1];
			
			if (val == null || isNaN(val) || points[idx][1] == null) {
				tooltip.style.display = 'none';
				return;
			}
			
			tooltip.innerHTML = label + ' • ' + (opts.formatValue ? opts.formatValue(val) : String(val));
			tooltip.style.left = points[idx][0] + 'px';
			tooltip.style.top = points[idx][1] + 'px';
			tooltip.style.display = 'block';
		});
		
		svg.addEventListener('mouseleave', function() {
			tooltip.style.display = 'none';
		});
	}

	/**
	 * Main sparkline building function - refactored for better performance and readability
	 * @param {jQuery} $container - Container element
	 * @param {Array} dataPairs - Array of [label, value] pairs
	 * @param {Object} opts - Options object containing styling and behavior configuration
	 */
	function buildSparkline($container, dataPairs, opts) {
		let width = $container.width();
		let height = $container.height();
		
		// Force width recalculation if width is 0 or very small
		if (!width || width < CONSTANTS.MIN_CONTAINER_WIDTH) {
			$container.css('width', '100%');
			width = $container.parent().width() || $container.width();
		}
		
		if (!width || !height) return;
		
		// Calculate padding and dimensions
		const paddingObj = {
			top: Math.max(0, (opts && opts.topPadPx) || 0),
			right: 0,
			bottom: Math.max(0, (opts && opts.bottomPadPx) || 0),
			left: 0
		};
		
		const w = Math.max(0, width - paddingObj.left - paddingObj.right);
		const h = Math.max(0, height - paddingObj.top - paddingObj.bottom);
		
		// Calculate Y scale range
		let minY = Infinity, maxY = -Infinity;
		for (let i = 0; i < dataPairs.length; i++) {
			const y = dataPairs[i][1];
			if (y === null || y === undefined || isNaN(y)) continue;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		
		if (!isFinite(minY) || !isFinite(maxY) || minY === maxY) {
			minY = maxY = isFinite(maxY) ? maxY : 0;
		}
		
		// Add padding to prevent extreme scaling
		const range = maxY - minY;
		if (range > 0) {
			const valuePadding = range * CONSTANTS.VALUE_PADDING_PERCENT;
			minY = minY - valuePadding;
			maxY = maxY + valuePadding;
		}
		
		// Scale functions
		const xScale = (i) => {
			if (dataPairs.length === 1) return w / 2;
			return (i / (dataPairs.length - 1)) * w;
		};
		
		const yScale = (v) => {
			if (minY === maxY) return (h / 2 + paddingObj.top);
			return (h - ((v - minY) / (maxY - minY)) * h) + paddingObj.top;
		};
		
		// Generate points
		const points = [];
		for (let j = 0; j < dataPairs.length; j++) {
			const val = dataPairs[j][1];
			const yv = (val === null || val === undefined || isNaN(val)) ? null : yScale(val);
			points.push([xScale(j), yv]);
		}
		
		// Create SVG
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', String(w));
		svg.setAttribute('height', String(h + paddingObj.top + paddingObj.bottom));
		svg.setAttribute('viewBox', '0 0 ' + w + ' ' + (h + paddingObj.top + paddingObj.bottom));
		
		// Create defs for filters and gradients
		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		
		if (opts && opts.showGlow) {
			defs.appendChild(createGlowFilter(document, opts));
		}
		
		let gradId = null;
		if (opts && opts.areaGradient) {
			const gradientResult = createAreaGradient(document, opts);
			defs.appendChild(gradientResult.gradient);
			gradId = gradientResult.id;
		}
		
		if (defs.childNodes.length) svg.appendChild(defs);
		
		// Build path and create elements
		const pathData = buildPath(points, !!(opts && opts.smooth));
		const path = createSparklinePath(document, pathData, opts);
		svg.appendChild(path);
		
		// Animate path drawing if enabled
		if (opts && opts.animateDraw) {
			const len = path.getTotalLength ? path.getTotalLength() : 0;
			if (len > 0) {
				path.style.transition = 'none';
				path.style.strokeDasharray = String(len);
				path.style.strokeDashoffset = String(len);
				setTimeout(() => {
					path.style.transition = 'stroke-dashoffset ' + String(opts.animDurationMs || CONSTANTS.DEFAULT_ANIMATION_DURATION) + 'ms ease';
					path.style.strokeDashoffset = '0';
				}, 0);
			}
		}
		
		// Create area fill if enabled
		if (opts && opts.mode === 'area' && pathData) {
			const area = createAreaPath(document, pathData, points, h, paddingObj.top, opts, gradId);
			if (area) {
				// Animate area fill if enabled
		if (opts && opts.animateArea) {
			area.style.opacity = '0';
					area.style.transition = 'opacity ' + String(opts.areaAnimDuration || CONSTANTS.DEFAULT_AREA_ANIMATION_DURATION) + 'ms ease';
					setTimeout(() => {
						area.style.opacity = String((opts && opts.areaOpacity) != null ? opts.areaOpacity : CONSTANTS.DEFAULT_AREA_OPACITY);
					}, 200);
				}
				svg.insertBefore(area, path);
			}
		}
		
		// Create min/max markers
		const markers = createMinMaxMarkers(document, dataPairs, points, opts);
		markers.forEach(marker => svg.appendChild(marker));
		
		// Add SVG to container
		$container.empty().append(svg);
		
		// Create tooltip
		createTooltip($container, svg, dataPairs, points, w, opts);
	}

	// Modern Theme System - Comprehensive themes for KPI, Trend, and Delta
	const THEMES = {
		custom: {},
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
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			titleColor: '#ffffff',
			valueColor: '#ffffff',
			labelColor: 'rgba(255, 255, 255, 0.8)',
			measureLabelColor: 'rgba(255, 255, 255, 0.9)',
			lineColor: '#60a5fa',
			areaColor: '#60a5fa',
			borderColor: 'rgba(255, 255, 255, 0.2)',
			deltaUpColor: '#34d399',
			deltaDownColor: '#f87171',
			deltaNeutralColor: 'rgba(255, 255, 255, 0.6)'
		}
	};

	/**
	 * Gets effective colors based on theme and custom overrides
	 * @param {Object} props - Properties containing color configuration
	 * @returns {Object} Object containing effective color values including delta colors
	 */
	function getEffectiveColors(props) {
		if (!props) props = {};
		const selectedTheme = props.theme || 'custom';
		const theme = THEMES[selectedTheme] || {};
		
		// Helper function to pick color from theme or UI override
		function pickFromThemeOrUi(key, fallback) { 
			// If theme is selected (not custom) and theme has this color, use theme value
			if (selectedTheme && selectedTheme !== 'custom' && theme[key] != null && theme[key] !== '') {
				return theme[key];
			}
			// If custom theme or theme doesn't have this color, use UI value
			if ((props && props[key]) != null && props[key] !== '') return props[key];
			// Finally fallback
			return fallback != null ? fallback : undefined;
		}
		
		return {
			backgroundColor: pickFromThemeOrUi('backgroundColor', CONSTANTS.DEFAULT_BACKGROUND_COLOR),
			titleColor: pickFromThemeOrUi('titleColor', CONSTANTS.DEFAULT_TITLE_COLOR),
			valueColor: pickFromThemeOrUi('valueColor', CONSTANTS.DEFAULT_VALUE_COLOR),
			labelColor: pickFromThemeOrUi('labelColor', CONSTANTS.DEFAULT_LABEL_COLOR),
			measureLabelColor: pickFromThemeOrUi('measureLabelColor', CONSTANTS.DEFAULT_MEASURE_LABEL_COLOR),
			lineColor: pickFromThemeOrUi('lineColor', CONSTANTS.DEFAULT_LINE_COLOR),
			areaColor: pickFromThemeOrUi('areaColor', pickFromThemeOrUi('lineColor', CONSTANTS.DEFAULT_AREA_COLOR)),
			borderColor: pickFromThemeOrUi('borderColor', CONSTANTS.DEFAULT_BORDER_COLOR),
			deltaUpColor: pickFromThemeOrUi('deltaUpColor', CONSTANTS.DEFAULT_DELTA_UP_COLOR),
			deltaDownColor: pickFromThemeOrUi('deltaDownColor', CONSTANTS.DEFAULT_DELTA_DOWN_COLOR),
			deltaNeutralColor: pickFromThemeOrUi('deltaNeutralColor', CONSTANTS.DEFAULT_DELTA_NEUTRAL_COLOR),
			gradientStart: pickFromThemeOrUi('gradientStart', props.gradientStart),
			gradientEnd: pickFromThemeOrUi('gradientEnd', props.gradientEnd)
		};
	}

	// Cache for field and variable lists - will be populated in paint
	var fieldListCache = [];
	var variableListCache = [];
	var responsiveObserverMap = {};
	var responsiveObserverState = {};
	/**
	 * Qlik variable list helper – normalizes common response shapes coming
	 * from both app.getList('VariableList') and app.variable.getAll().
	 */
	function extractVariableItems(source) {
		if (!source) {
			return [];
		}
		if (Array.isArray(source)) {
			return source;
		}
		if (source.qVariableList && Array.isArray(source.qVariableList.qItems)) {
			return source.qVariableList.qItems;
		}
		if (source.layout) {
			return extractVariableItems(source.layout);
		}
		return [];
	}
	var responsiveObserverRaf = {};

	function setupResponsiveObserver($element, layout, matrix) {
		if (typeof ResizeObserver === 'undefined' || !$element || !$element.length) {
			return;
		}
		const el = $element[0];
		if (!el) return;
		const elementId = (layout && layout.qInfo && layout.qInfo.qId) || el.getAttribute('data-qv-object') || el.id || 'kpi-card-default';
		const rect = el.getBoundingClientRect();
		const currentSize = { width: rect.width, height: rect.height };
		const existingState = responsiveObserverState[elementId] || {};
		responsiveObserverState[elementId] = {
			layout: layout,
			matrix: matrix,
			element: el,
			size: existingState.size || currentSize
		};
		
		if (!responsiveObserverMap[elementId]) {
			responsiveObserverMap[elementId] = new ResizeObserver(function(entries) {
				const state = responsiveObserverState[elementId];
				if (!state || !entries || !entries.length) return;
				const contentRect = entries[0].contentRect || {};
				const newWidth = contentRect.width;
				const newHeight = contentRect.height;
				const prevSize = state.size || {};
				if (Math.abs((prevSize.width || 0) - newWidth) < 0.5 &&
					Math.abs((prevSize.height || 0) - newHeight) < 0.5) {
					return;
				}
				state.size = { width: newWidth, height: newHeight };
				if (responsiveObserverRaf[elementId]) {
					cancelAnimationFrame(responsiveObserverRaf[elementId]);
				}
				responsiveObserverRaf[elementId] = requestAnimationFrame(function() {
					const stateSnapshot = responsiveObserverState[elementId];
					if (!stateSnapshot) return;
					const $el = $(stateSnapshot.element);
					safeExecute(renderCard, [$el, stateSnapshot.layout, stateSnapshot.matrix], 'ResponsiveResize');
				});
			});
			responsiveObserverMap[elementId].observe(el);
		}
	}
	
	var properties = {
		type: 'items', component: 'accordion', items: {
			data: { uses: 'data', items: { dimensions: { min: 1, max: 1 }, measures: { min: 1, max: 1 } } },
			sorting: { uses: 'sorting' },
			appearance: { uses: 'settings', items: {
				// Content & Numbers
				contentSection: { type: 'items', label: 'Content & Numbers', items: {
					title: { ref: 'props.title', label: 'Title', type: 'string', defaultValue: '' },
					measureLabel: { ref: 'props.measureLabel', label: 'Measure Label', type: 'string', defaultValue: '' },
					measureLabelPos: { ref: 'props.measureLabelPos', label: 'Measure Label Position', type: 'string', component: 'dropdown', options: [ { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' } ], defaultValue: 'bottom' },
					measureLabelGap: { ref: 'props.measureLabelGap', label: 'Label Gap (px)', type: 'number', defaultValue: 4 },
					align: { ref: 'props.align', label: 'Alignment', type: 'string', component: 'dropdown', options: [ { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' } ], defaultValue: 'left' },
					useShortFormat: { ref: 'props.useShortFormat', label: 'Use Short Format (K/M/B) for KPI Value', type: 'boolean', defaultValue: true },
					kpiDecimalPlaces: { ref: 'props.kpiDecimalPlaces', label: 'KPI Decimal Places', type: 'number', defaultValue: 0, min: 0, max: 6 },
					valuePrefix: { ref: 'props.valuePrefix', label: 'Value Prefix', type: 'string', component: 'dropdown', options: [ { value: '', label: 'None' }, { value: '₺', label: 'Turkish Lira (₺)' }, { value: '$', label: 'Dollar ($)' }, { value: '€', label: 'Euro (€)' }, { value: '£', label: 'Pound (£)' }, { value: '¥', label: 'Yen (¥)' }, { value: '₹', label: 'Rupee (₹)' }, { value: 'custom', label: 'Custom...' } ], defaultValue: '' },
					valuePrefixCustom: { ref: 'props.valuePrefixCustom', label: 'Custom Prefix', type: 'string', component: 'text', defaultValue: '', show: function(layout) { return layout.props.valuePrefix === 'custom'; } },
					valueSuffix: { ref: 'props.valueSuffix', label: 'Value Suffix', type: 'string', component: 'dropdown', options: [ { value: '', label: 'None' }, { value: '%', label: 'Percent (%)' }, { value: 'K', label: 'Thousands (K)' }, { value: 'M', label: 'Millions (M)' }, { value: 'B', label: 'Billions (B)' }, { value: 'custom', label: 'Custom...' } ], defaultValue: '' },
					valueSuffixCustom: { ref: 'props.valueSuffixCustom', label: 'Custom Suffix', type: 'string', component: 'text', defaultValue: '', show: function(layout) { return layout.props.valueSuffix === 'custom'; } },
					kpiAgg: { ref: 'props.kpiAgg', label: 'KPI Aggregation', type: 'string', component: 'dropdown', options: [ { value: 'last', label: 'Last' }, { value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' } ], defaultValue: 'last' },
					kpiScope: { ref: 'props.kpiScope', label: 'KPI Scope', type: 'string', component: 'dropdown', options: [ { value: 'full', label: 'Full data' }, { value: 'window', label: 'Trend window' } ], defaultValue: 'full' },
					showSecondaryKpi: { ref: 'props.showSecondaryKpi', label: 'Show Secondary KPI (previous period)', type: 'boolean', defaultValue: false },
					secondaryLabel: { ref: 'props.secondaryLabel', label: 'Secondary Label', type: 'string', defaultValue: 'Previous Period', show: function(d) { return d && d.props && d.props.showSecondaryKpi; } },
					secondaryColor: { ref: 'props.secondaryColor', label: 'Secondary Color', type: 'string', defaultValue: '#94a3b8', show: function(d) { return d && d.props && d.props.showSecondaryKpi; } },
					secondaryFontSize: { ref: 'props.secondaryFontSize', label: 'Secondary Font Size (px)', type: 'number', defaultValue: 16, min: 8, max: 48, show: function(d) { return d && d.props && d.props.showSecondaryKpi; } },
					secondaryFontFamily: { ref: 'props.secondaryFontFamily', label: 'Secondary Font Family', type: 'string', defaultValue: 'Open Sans', show: function(d) { return d && d.props && d.props.showSecondaryKpi; } },
					secondaryDecimalPlaces: { ref: 'props.secondaryDecimalPlaces', label: 'Secondary Decimal Places', type: 'number', defaultValue: 0, min: 0, max: 6, show: function(d) { return d && d.props && d.props.showSecondaryKpi; } }
				} },
				// Typography Section
				typographySection: { type: 'items', label: 'Typography', items: {
					// Font Mode
					fontMode: { ref: 'props.fontMode', label: 'Font Mode', type: 'string', component: 'dropdown', options: [ { value: 'static', label: 'Static (px)' }, { value: 'responsive', label: 'Responsive (em)' } ], defaultValue: 'static' },
					// Static Font Sizes
					staticFontSizes: { type: 'items', label: 'Static Font Sizes', items: {
						valueFontSize: { ref: 'props.valueFontSize', label: 'Value Font Size (px)', type: 'number', defaultValue: 28, show: function(layout) { return layout.props.fontMode === 'static'; } },
						titleFontSize: { ref: 'props.titleFontSize', label: 'Title Font Size (px)', type: 'number', defaultValue: 12, show: function(layout) { return layout.props.fontMode === 'static'; } },
						deltaFontSize: { ref: 'props.deltaFontSize', label: 'Delta Font Size (px)', type: 'number', defaultValue: 16, show: function(layout) { return layout.props.fontMode === 'static'; } },
						measureLabelSize: { ref: 'props.measureLabelSize', label: 'Measure Label Font Size (px)', type: 'number', defaultValue: 11, show: function(layout) { return layout.props.fontMode === 'static'; } },
						labelFontSize: { ref: 'props.labelFontSize', label: 'Date Label Font Size (px)', type: 'number', defaultValue: 10, show: function(layout) { return layout.props.fontMode === 'static'; } }
					} },
					// Font Families
					fontFamilies: { type: 'items', label: 'Font Families', items: {
						valueFontFamily: { ref: 'props.valueFontFamily', label: 'Value Font Family', type: 'string', defaultValue: 'Open Sans' },
						titleFontFamily: { ref: 'props.titleFontFamily', label: 'Title Font Family', type: 'string', defaultValue: 'Open Sans' },
						deltaFontFamily: { ref: 'props.deltaFontFamily', label: 'Delta Font Family', type: 'string', defaultValue: 'Open Sans' },
						measureLabelFontFamily: { ref: 'props.measureLabelFontFamily', label: 'Measure Label Font Family', type: 'string', defaultValue: 'Open Sans' },
						labelFontFamily: { ref: 'props.labelFontFamily', label: 'Date Label Font Family', type: 'string', defaultValue: 'Open Sans' }
					} }
				} },
				// Colors Section
				colorsSection: { type: 'items', label: 'Colors & Theme', items: {
					theme: { ref: 'props.theme', label: 'Theme', type: 'string', component: 'dropdown', options: [ { value: 'custom', label: 'Custom' }, { value: 'modernBlue', label: 'Modern Blue' }, { value: 'darkProfessional', label: 'Dark Professional' }, { value: 'gradientPurple', label: 'Gradient Purple' }, { value: 'minimalWhite', label: 'Minimal White' }, { value: 'oceanTeal', label: 'Ocean Teal' }, { value: 'sunsetWarm', label: 'Sunset Warm' }, { value: 'forestFresh', label: 'Forest Fresh' }, { value: 'royalGold', label: 'Royal Gold' }, { value: 'cyberNeon', label: 'Cyber Neon' }, { value: 'elegantGray', label: 'Elegant Gray' }, { value: 'glass', label: 'Glass Morphism' }, { value: 'slate', label: 'Slate' }, { value: 'ocean', label: 'Ocean' }, { value: 'sunset', label: 'Sunset' }, { value: 'emerald', label: 'Emerald' }, { value: 'violet', label: 'Violet' } ], defaultValue: 'custom' },
					valueColor: { ref: 'props.valueColor', label: 'Value Color', type: 'string', defaultValue: '#111111', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					titleColor: { ref: 'props.titleColor', label: 'Title Color', type: 'string', defaultValue: '#111111', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					dateLabelColor: { ref: 'props.labelColor', label: 'Date Label Color', type: 'string', defaultValue: '#555555', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					measureLabelColor: { ref: 'props.measureLabelColor', label: 'Measure Label Color', type: 'string', defaultValue: '#666666', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					backgroundColor: { ref: 'props.backgroundColor', label: 'Background', type: 'string', defaultValue: 'transparent', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					borderColor: { ref: 'props.borderColor', label: 'Border Color', type: 'string', defaultValue: 'transparent', show: function(d) { return d && d.props && d.props.theme === 'custom'; } }
				} },
				conditionalSection: { type: 'items', label: 'Conditional Formatting', items: {
					enableBackgroundCondition: { ref: 'props.enableBackgroundCondition', label: 'Enable Background Rule', type: 'boolean', defaultValue: false },
					backgroundConditionOperator: { ref: 'props.backgroundConditionOperator', label: 'Background Condition', type: 'string', component: 'dropdown', options: [ { value: 'gt', label: '> (greater than)' }, { value: 'gte', label: '≥ (greater equal)' }, { value: 'lt', label: '< (less than)' }, { value: 'lte', label: '≤ (less equal)' }, { value: 'eq', label: '= (equals)' }, { value: 'between', label: 'Between' } ], defaultValue: 'gt', show: function(d) { return d && d.props && d.props.enableBackgroundCondition; } },
					backgroundConditionValue: { ref: 'props.backgroundConditionValue', label: 'Background Threshold', type: 'number', expression: 'optional', defaultValue: 0, show: function(d) { return d && d.props && d.props.enableBackgroundCondition; } },
					backgroundConditionValue2: { ref: 'props.backgroundConditionValue2', label: 'Background Threshold (max)', type: 'number', expression: 'optional', defaultValue: 0, show: function(d) { return d && d.props && d.props.enableBackgroundCondition && d.props.backgroundConditionOperator === 'between'; } },
					backgroundConditionColor: { ref: 'props.backgroundConditionColor', label: 'Background Color', type: 'string', defaultValue: '#1f2937', show: function(d) { return d && d.props && d.props.enableBackgroundCondition; } }
				} },
				// Layout Section
				layoutSection: { type: 'items', label: 'Layout & Background', items: {
					borderWidth: { ref: 'props.borderWidth', label: 'Border Width (px)', type: 'number', defaultValue: 0 },
					borderRadius: { ref: 'props.borderRadius', label: 'Border Radius (px)', type: 'number', defaultValue: 0 },
					padding: { ref: 'props.padding', label: 'Padding (px)', type: 'number', defaultValue: 8 },
					headerGapPx: { ref: 'props.headerGapPx', label: 'Header Gap (px)', type: 'number', defaultValue: 2 },
					cardElevation: { ref: 'props.cardElevation', label: 'Card Elevation/Shadow', type: 'string', component: 'dropdown', options: [ { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' }, { value: 'neumorphic', label: 'Neumorphic' } ], defaultValue: 'none' },
					useGradient: { ref: 'props.useGradient', label: 'Use Gradient Background', type: 'boolean', defaultValue: false },
					gradientPreset: { ref: 'props.gradientPreset', label: 'Gradient Preset', type: 'string', component: 'dropdown', options: GRADIENT_PRESETS, defaultValue: 'custom', show: function(d) { return d && d.props && d.props.useGradient; } },
					gradientStart: { ref: 'props.gradientStart', label: 'Gradient Start Color', type: 'string', defaultValue: '#3b82f6', show: function(d) { return d && d.props && d.props.useGradient && (d.props.gradientPreset || 'custom') === 'custom'; } },
					gradientEnd: { ref: 'props.gradientEnd', label: 'Gradient End Color', type: 'string', defaultValue: '#8b5cf6', show: function(d) { return d && d.props && d.props.useGradient && (d.props.gradientPreset || 'custom') === 'custom'; } },
					gradientDirection: { ref: 'props.gradientDirection', label: 'Gradient Direction', type: 'string', component: 'dropdown', options: [ { value: 'vertical', label: 'Vertical (Top to Bottom)' }, { value: 'horizontal', label: 'Horizontal (Left to Right)' }, { value: 'diagonal', label: 'Diagonal (Top Left to Bottom Right)' }, { value: 'radial', label: 'Radial (Center)' } ], defaultValue: 'vertical', show: function(d) { return d && d.props && d.props.useGradient && (d.props.gradientPreset || 'custom') === 'custom'; } }
				} },
				iconSection: { type: 'items', label: 'Icons', items: {
					showIcon: { ref: 'props.showIcon', label: 'Show Icon', type: 'boolean', defaultValue: false },
					iconPack: { ref: 'props.iconPack', label: 'Icon Source', type: 'string', component: 'dropdown', options: [ { value: 'emoji', label: 'Emoji Set' }, { value: 'modern', label: 'Modern Line Icons' }, { value: 'custom', label: 'Custom (paste your own)' } ], defaultValue: 'emoji', show: function(d) { return d && d.props && d.props.showIcon; } },
					iconType: { ref: 'props.iconType', label: 'Icon Type', type: 'string', component: 'dropdown', options: function(d) { return (d && d.props && d.props.iconPack === 'modern') ? MODERN_ICON_OPTIONS : EMOJI_ICON_OPTIONS; }, defaultValue: 'chart', show: function(d) { return d && d.props && d.props.showIcon && d.props.iconPack !== 'custom'; } },
					iconCustom: { ref: 'props.iconCustom', label: 'Custom Icon Markup', type: 'string', component: 'textarea', defaultValue: '', show: function(d) { return d && d.props && d.props.showIcon && d.props.iconPack === 'custom'; } },
					iconSize: { ref: 'props.iconSize', label: 'Icon Size (px)', type: 'number', defaultValue: 24, min: 12, max: 64, show: function(d) { return d && d.props && d.props.showIcon; } },
					iconPosition: { ref: 'props.iconPosition', label: 'Icon Position', type: 'string', component: 'dropdown', options: [ { value: 'top-left', label: 'Top Left' }, { value: 'top-right', label: 'Top Right' }, { value: 'before-title', label: 'Before Title' }, { value: 'after-title', label: 'After Title' }, { value: 'value-right', label: 'Aligned with KPI Value (Right)' } ], defaultValue: 'top-right', show: function(d) { return d && d.props && d.props.showIcon; } }
				} },
				// Interaction Section (Moved from Layout)
				interactionSection: { type: 'items', label: 'Interaction / Actions', items: {
					enableClick: { ref: 'props.enableClick', label: 'Enable Click Interaction', type: 'boolean', defaultValue: false },
					clickAction: { ref: 'props.clickAction', label: 'Click Action', type: 'string', component: 'dropdown', options: [ { value: 'select-field-value', label: 'Select Value in a Field' }, { value: 'change-variable', label: 'Change Variable Value' }, { value: 'clear', label: 'Clear Selection' } ], defaultValue: 'select-field-value', show: function(d) { return d && d.props && d.props.enableClick; } },
					selectFieldName: { 
						ref: 'props.selectFieldName', 
						label: 'Field', 
						type: 'string', 
						component: 'dropdown', 
						options: function() {
							if (fieldListCache.length) {
								return fieldListCache.slice();
							}
							try {
								if (qlik && qlik.currApp) {
									return qlik.currApp().getList('FieldList').then(function(model) {
										return model.layout.qFieldList.qItems.map(function(item) {
											return {
												value: item.qName,
												label: item.qName
											};
										});
									}).catch(function() { return []; });
								}
							} catch (e) {
								return [];
							}
							return [];
						},
						defaultValue: '', 
						show: function(d) { return d && d.props && d.props.enableClick && d.props.clickAction === 'select-field-value'; } 
					},
					selectFieldValue: { ref: 'props.selectFieldValue', label: 'Value to Select', type: 'string', defaultValue: '', show: function(d) { return d && d.props && d.props.enableClick && d.props.clickAction === 'select-field-value'; } },
					variableName: { 
						ref: 'props.variableName', 
						label: 'Variable', 
						type: 'string', 
						component: 'dropdown', 
						options: function() {
							if (variableListCache.length) {
								return variableListCache.slice();
							}
							try {
								if (qlik && qlik.currApp) {
									const app = qlik.currApp();
									if (app.getList) {
										return app.getList('VariableList').then(function(model) {
											const varItems = extractVariableItems(model);
											return varItems.map(function(v) {
												return {
													value: v.qName,
													label: v.qName
												};
											});
										}).catch(function() { return []; });
									}
									if (app.variable && app.variable.getAll) {
										return app.variable.getAll().then(function(vars) {
											const varItems = extractVariableItems(vars);
											return varItems.map(function(v) {
												return {
													value: v.qName,
													label: v.qName
												};
											});
										}).catch(function() { return []; });
									}
								}
							} catch (e) {
								return [];
							}
							return [];
						},
						defaultValue: '', 
						show: function(d) { 
							return d && d.props && d.props.enableClick && d.props.clickAction === 'change-variable'; 
						} 
					},
					variableValue: { ref: 'props.variableValue', label: 'Variable Value', type: 'string', defaultValue: '', show: function(d) { return d && d.props && d.props.enableClick && d.props.clickAction === 'change-variable'; } },
					selectedIndicator: { ref: 'props.selectedIndicator', label: 'Selected Indicator Style', type: 'string', component: 'dropdown', options: [ { value: 'tapered-bar', label: 'Neon Bar (Modern)' }, { value: 'border', label: 'Full Border' }, { value: 'bottom-border', label: 'Bottom Border' }, { value: 'top-border', label: 'Top Border' }, { value: 'glow', label: 'Glow Effect' }, { value: 'background', label: 'Background Tint' } ], defaultValue: 'tapered-bar', show: function(d) { return d && d.props && d.props.enableClick; } },
					selectedColor: { ref: 'props.selectedColor', label: 'Selected Indicator Color', type: 'string', defaultValue: '#3b82f6', show: function(d) { return d && d.props && d.props.enableClick; } }
				} },
				// Responsive Layout Section
				responsiveLayoutSection: { type: 'items', label: 'Responsive Layout', items: {
					kpiSectionHeight: { ref: 'props.kpiSectionHeight', label: 'KPI Section Height (%)', type: 'number', defaultValue: 60, min: 20, max: 80 },
					trendSectionHeight: { ref: 'props.trendSectionHeight', label: 'Trend Section Height (%)', type: 'number', defaultValue: 40, min: 20, max: 80 },
					sectionGap: { ref: 'props.sectionGap', label: 'Section Gap (vh)', type: 'number', defaultValue: 1, min: 0, max: 5 }
				} },
				// Delta & Status Section
				deltaSection: { type: 'items', label: 'Delta & Status', items: {
					showDelta: { ref: 'props.showDelta', label: 'Show Delta vs Previous', type: 'boolean', defaultValue: true },
					deltaDisplayType: { ref: 'props.deltaDisplayType', label: 'Delta Display Type', type: 'string', component: 'dropdown', options: [ { value: 'percentage', label: 'Percentage (%)' }, { value: 'absolute', label: 'Absolute Amount' } ], defaultValue: 'percentage', show: function(layout) { return layout.props.showDelta; } },
					deltaUseShortFormat: { ref: 'props.deltaUseShortFormat', label: 'Use Short Format (K/M/B) for Delta', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.showDelta && d.props.deltaDisplayType === 'absolute'; } },
					deltaMode: { ref: 'props.deltaMode', label: 'Delta Mode', type: 'string', component: 'dropdown', options: [ { value: 'points', label: 'Previous N points (offset supported)' } ], defaultValue: 'points' },
					deltaPoints: { ref: 'props.deltaPoints', label: 'Window Size N (points)', type: 'number', defaultValue: 1 },
					deltaOffset: { ref: 'props.deltaOffset', label: 'Compare Offset (in windows)', type: 'number', defaultValue: 1 },
					deltaAgg: { ref: 'props.deltaAgg', label: 'Delta Aggregation', type: 'string', component: 'dropdown', options: [ { value: 'last', label: 'Last' }, { value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Average' } ], defaultValue: 'last' },
					deltaDecimals: { ref: 'props.deltaDecimals', label: 'Delta Decimals', type: 'number', defaultValue: 1 },
					deltaFontSize: { ref: 'props.deltaFontSize', label: 'Delta Font Size (px)', type: 'number', defaultValue: 0 },
					deltaFontFamily: { ref: 'props.deltaFontFamily', label: 'Delta Font Family', type: 'string', defaultValue: 'Open Sans' },
					deltaUpColor: { ref: 'props.deltaUpColor', label: 'Delta Up Color', type: 'string', defaultValue: '#16a34a', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					deltaDownColor: { ref: 'props.deltaDownColor', label: 'Delta Down Color', type: 'string', defaultValue: '#dc2626', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					deltaNeutralColor: { ref: 'props.deltaNeutralColor', label: 'Delta Neutral Color', type: 'string', defaultValue: '#9ca3af', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					deltaGap: { ref: 'props.deltaGap', label: 'Gap between Value and Delta (px)', type: 'number', defaultValue: 6 },
					showStatusBadge: { ref: 'props.showStatusBadge', label: 'Show Status Badge', type: 'boolean', defaultValue: false, show: function(d) { return d && d.props && d.props.showDelta; } }
				} },
				// Trend Section
				trendSection: { type: 'items', label: 'Trend', items: {
					showTrend: { ref: 'props.showTrend', label: 'Show Trend', type: 'boolean', defaultValue: true },
					trendPosition: { ref: 'props.trendPosition', label: 'Trend Position', type: 'string', component: 'dropdown', options: [ { value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' } ], defaultValue: 'bottom', show: function(layout) { return layout.props.showTrend; } },
					trendHeight: { ref: 'props.trendHeight', label: 'Trend Height (px) - Auto responsive if 0', type: 'number', defaultValue: 0, show: function(layout) { return false; } },
					trendTopMarginPx: { ref: 'props.trendTopMarginPx', label: 'Trend Top Margin (px) - Auto responsive if 0', type: 'number', defaultValue: 0, show: function(layout) { return false; } },
					trendMode: { ref: 'props.trendMode', label: 'Trend Mode', type: 'string', component: 'dropdown', options: [ { value: 'line', label: 'Line' }, { value: 'area', label: 'Area' } ], defaultValue: 'line', show: function(layout) { return layout.props.showTrend; } },
					trendCorners: { ref: 'props.trendCorners', label: 'Trend Corner Style', type: 'string', component: 'dropdown', options: [ { value: 'sharp', label: 'Sharp' }, { value: 'smooth', label: 'Smooth' } ], defaultValue: 'sharp', show: function(layout) { return layout.props.showTrend; } },
					lineColor: { ref: 'props.lineColor', label: 'Trend Line Color', type: 'string', defaultValue: '#3f51b5', show: function(d) { return d && d.props && d.props.showTrend && d.props.theme === 'custom'; } },
					lineWidth: { ref: 'props.lineWidth', label: 'Trend Line Width', type: 'number', defaultValue: 1.5, show: function(d) { return d && d.props && d.props.showTrend; } },
					areaColor: { ref: 'props.areaColor', label: 'Area Fill Color', type: 'string', defaultValue: '#3f51b5', show: function(d) { return d && d.props && d.props.showTrend && d.props.theme === 'custom'; } },
					areaOpacity: { ref: 'props.areaOpacity', label: 'Area Opacity (0-1)', type: 'number', defaultValue: 0.2, show: function(layout) { return layout.props.showTrend; } },
					areaGradient: { ref: 'props.areaGradient', label: 'Area Gradient Fill', type: 'boolean', defaultValue: false, show: function(layout) { return layout.props.showTrend; } },
					areaGradientType: { ref: 'props.areaGradientType', label: 'Gradient Type', type: 'string', component: 'dropdown', options: [ { value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' } ], defaultValue: 'vertical', show: function(d){ return d.props && d.props.areaGradient && d.props.showTrend; } },
					areaGradStartColor: { ref: 'props.areaGradStartColor', label: 'Gradient Start Color', type: 'string', defaultValue: '#3f51b5', show: function(d){ return d.props && d.props.areaGradient && d.props.showTrend; } },
					areaGradEndColor: { ref: 'props.areaGradEndColor', label: 'Gradient End Color', type: 'string', defaultValue: '#3f51b5', show: function(d){ return d.props && d.props.areaGradient && d.props.showTrend; } },
					areaGradStartOpacity: { ref: 'props.areaGradStartOpacity', label: 'Gradient Start Opacity', type: 'number', defaultValue: 0.2, show: function(d){ return d.props && d.props.areaGradient && d.props.showTrend; } },
					areaGradEndOpacity: { ref: 'props.areaGradEndOpacity', label: 'Gradient End Opacity', type: 'number', defaultValue: 0, show: function(d){ return d.props && d.props.areaGradient && d.props.showTrend; } },
					trendWindowMode: { ref: 'props.trendWindowMode', label: 'Trend Window', type: 'string', component: 'dropdown', options: [ { value: 'all', label: 'All data' }, { value: 'lastNPoints', label: 'Last N points' }, { value: 'lastNDays', label: 'Last N days' } ], defaultValue: 'all', show: function(layout) { return layout.props.showTrend; } },
					trendWindowPoints: { ref: 'props.trendWindowPoints', label: 'N (points)', type: 'number', defaultValue: 60, show: function (d) { return d.props && d.props.trendWindowMode === 'lastNPoints' && d.props.showTrend; } },
					trendWindowDays: { ref: 'props.trendWindowDays', label: 'N (days)', type: 'number', defaultValue: 180, show: function (d) { return d.props && d.props.trendWindowMode === 'lastNDays' && d.props.showTrend; } },
					showQuickButtons: { ref: 'props.showQuickButtons', label: 'Show Quick Trend Buttons', type: 'boolean', defaultValue: true, show: function(layout) { return layout.props.showTrend !== false; } },
					button1Value: { ref: 'props.button1Value', label: 'Button 1 Value (points)', type: 'number', defaultValue: 12, show: function(d) { return d.props.showQuickButtons; } },
					button1Label: { ref: 'props.button1Label', label: 'Button 1 Label', type: 'string', defaultValue: '12P', show: function(d) { return d.props.showQuickButtons; } },
					button2Value: { ref: 'props.button2Value', label: 'Button 2 Value (points)', type: 'number', defaultValue: 60, show: function(d) { return d.props.showQuickButtons; } },
					button2Label: { ref: 'props.button2Label', label: 'Button 2 Label', type: 'string', defaultValue: '60P', show: function(d) { return d.props.showQuickButtons; } },
					button3Value: { ref: 'props.button3Value', label: 'Button 3 Value (points)', type: 'number', defaultValue: 365, show: function(d) { return d.props.showQuickButtons; } },
					button3Label: { ref: 'props.button3Label', label: 'Button 3 Label', type: 'string', defaultValue: '1Y', show: function(d) { return d.props.showQuickButtons; } },
					buttonStyle: { ref: 'props.buttonStyle', label: 'Button Style', type: 'string', component: 'dropdown', options: [ { value: 'minimal', label: 'Minimal' }, { value: 'rounded', label: 'Rounded' }, { value: 'pill', label: 'Pill' } ], defaultValue: 'rounded', show: function(d) { return d.props.showQuickButtons; } },
					buttonBackgroundColor: { ref: 'props.buttonBackgroundColor', label: 'Inactive Button Background Color', type: 'string', defaultValue: 'rgba(255,255,255,0.1)', show: function(d) { return d.props.showQuickButtons; } },
					buttonLabelColor: { ref: 'props.buttonLabelColor', label: 'Inactive Button Label Color', type: 'string', defaultValue: '', show: function(d) { return d.props.showQuickButtons; } },
					buttonActiveColor: { ref: 'props.buttonActiveColor', label: 'Active Button Background Color', type: 'string', defaultValue: '#3b82f6', show: function(d) { return d.props.showQuickButtons; } },
					buttonActiveLabelColor: { ref: 'props.buttonActiveLabelColor', label: 'Active Button Label Color', type: 'string', defaultValue: '#ffffff', show: function(d) { return d.props.showQuickButtons; } },
					defaultButton: { ref: 'props.defaultButton', label: 'Default Selected Button', type: 'string', component: 'dropdown', options: [ { value: 'button1', label: 'Button 1 (12P)' }, { value: 'button2', label: 'Button 2 (60P)' }, { value: 'button3', label: 'Button 3 (1Y)' } ], defaultValue: 'button2', show: function(d) { return d.props.showQuickButtons; } },
					currentSelectedButton: { ref: 'props.currentSelectedButton', label: 'Current Selected Button (Internal)', type: 'string', defaultValue: 'button2', show: function(d) { return false; } }
				} },
				// Labels Section
				labelsSection: { type: 'items', label: 'Labels', items: {
					showLabelDates: { ref: 'props.showLabelDates', label: 'Show start/end date labels', type: 'boolean', defaultValue: true },
					labelMaxWidthPct: { ref: 'props.labelMaxWidthPct', label: 'Date Label Max Width (%)', type: 'number', defaultValue: 45 },
					endLabelOffsetPx: { ref: 'props.endLabelOffsetPx', label: 'End Label Left Offset (px)', type: 'number', defaultValue: 8 },
					startLabelRightPadPx: { ref: 'props.startLabelRightPadPx', label: 'Start Label Right Padding (px)', type: 'number', defaultValue: 6 },
					endLabelRightPadPx: { ref: 'props.endLabelRightPadPx', label: 'End Label Right Padding (px)', type: 'number', defaultValue: 8 },
					labelsGapPx: { ref: 'props.labelsGapPx', label: 'Labels Top Gap (px)', type: 'number', defaultValue: 2 }
				} },
				// Effects Section
				effectsSection: { type: 'items', label: 'Effects', items: {
					showGlow: { ref: 'props.showGlow', label: 'Glow Effect', type: 'boolean', defaultValue: false },
					glowColor: { ref: 'props.glowColor', label: 'Glow Color', type: 'string', defaultValue: '#ffffff' },
					glowStdDev: { ref: 'props.glowStdDev', label: 'Glow Strength', type: 'number', defaultValue: 2 },
					showTooltip: { ref: 'props.showTooltip', label: 'Show Tooltip on Hover', type: 'boolean', defaultValue: true },
					showMinMax: { ref: 'props.showMinMax', label: 'Highlight Min/Max with Pulse', type: 'boolean', defaultValue: true },
					pulseRadius: { ref: 'props.pulseRadius', label: 'Pulse Radius (px)', type: 'number', defaultValue: 1.8 },
					pulseMinColor: { ref: 'props.pulseMinColor', label: 'Pulse Min Color', type: 'string', defaultValue: '#dc2626' },
					pulseMaxColor: { ref: 'props.pulseMaxColor', label: 'Pulse Max Color', type: 'string', defaultValue: '#16a34a' },
					hoverValueScale: { ref: 'props.hoverValueScale', label: 'Value Hover Scale Effect', type: 'boolean', defaultValue: true },
					hoverLineThickness: { ref: 'props.hoverLineThickness', label: 'Line Hover Thickness Effect', type: 'boolean', defaultValue: true },
					hoverLineThicknessMultiplier: { ref: 'props.hoverLineThicknessMultiplier', label: 'Line Thickness Multiplier', type: 'number', defaultValue: 1.5, show: function(d) { return d.props.hoverLineThickness; } },
					darkMode: { ref: 'props.darkMode', label: 'Dark Mode', type: 'boolean', defaultValue: false }
				} },
				// Animations Section
				animationsSection: { type: 'items', label: 'Animations', items: {
					animateDraw: { ref: 'props.animateDraw', label: 'Animate Line Draw', type: 'boolean', defaultValue: true },
					animDurationMs: { ref: 'props.animDurationMs', label: 'Animation Duration (ms)', type: 'number', defaultValue: 600 },
					animatePulse: { ref: 'props.animatePulse', label: 'Animate Pulse Points', type: 'boolean', defaultValue: true },
					pulseAnimDelay: { ref: 'props.pulseAnimDelay', label: 'Pulse Animation Delay (ms)', type: 'number', defaultValue: 300, show: function(d){ return d.props && d.props.animatePulse; } },
					animateArea: { ref: 'props.animateArea', label: 'Animate Area Fill', type: 'boolean', defaultValue: false },
					areaAnimDuration: { ref: 'props.areaAnimDuration', label: 'Area Animation Duration (ms)', type: 'number', defaultValue: 800, show: function(d){ return d.props && d.props.animateArea; } },
					animateValue: { ref: 'props.animateValue', label: 'Animate KPI Value', type: 'boolean', defaultValue: true },
					valueAnimDuration: { ref: 'props.valueAnimDuration', label: 'Value Animation Duration (ms)', type: 'number', defaultValue: 1000, show: function(d){ return d.props && d.props.animateValue; } },
					animateDelta: { ref: 'props.animateDelta', label: 'Animate Delta Change', type: 'boolean', defaultValue: false },
					deltaAnimDuration: { ref: 'props.deltaAnimDuration', label: 'Delta Animation Duration (ms)', type: 'number', defaultValue: 600, show: function(d){ return d.props && d.props.animateDelta; } }
				} },
			} },
			presetsPanel: { type: 'items', label: 'Config Presets', items: {
				presetInfo: { component: 'text', label: 'Workflow: 1) Capture to copy current visual settings as JSON, 2) paste into another card and press Apply.' },
				configPresetAction: { 
					ref: 'props.configPresetAction', 
					label: 'Preset Actions', 
					type: 'string', 
					component: 'buttongroup', 
					options: [
						{ value: 'capture', label: '1) Capture' },
						{ value: 'apply', label: '2) Apply' }
					],
					defaultValue: '',
					change: function(data, handler) {
						const actionValue = data && data.props ? data.props.configPresetAction : '';
						if (!data || !data.props) return;
						try {
							if (actionValue === 'capture') {
								data.props.configPresetText = serializePresetProps(data.props);
							} else if (actionValue === 'apply') {
								const parsed = parsePresetText(data.props.configPresetText);
								if (parsed) {
									applyPresetToProps(data.props, parsed);
								}
							}
						} catch (e) {
							console.error('KPI Card preset action error', e);
						} finally {
							data.props.configPresetAction = '';
							if (handler && typeof handler === 'function') {
								handler();
							}
						}
					}
				},
				configPresetText: { ref: 'props.configPresetText', label: 'Preset JSON', type: 'string', component: 'textarea', rows: 10, maxlength: 200000, defaultValue: '' }
			} },
			aboutPanel: { type: 'items', label: 'About', items: {
				aboutDescription: { component: 'text', label: 'KPI Card delivers a modern KPI + trend experience with responsive typography, theming, quick presets, and click actions. Contact: https://www.linkedin.com/in/mfarsln/' }
			} }
		}
	};

	var resizeRaf = null; function deferred(callback) { if (resizeRaf) cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(function () { setTimeout(callback, 0); }); }

	/**
	 * Computes delta change between current and previous periods
	 * @param {Array} rows - Array of row objects with valNum property
	 * @param {number} points - Number of points to include in each period
	 * @param {string} agg - Aggregation method ('sum', 'avg', 'last')
	 * @param {number} offset - Offset in periods to compare against
	 * @returns {Object|null} Object with curr and prev values, or null if insufficient data
	 */
	function computeDeltaFromRows(rows, points, agg, offset) {
		if (!rows.length) return null;
		
		const take = Math.max(1, Math.floor(points || 1));
		const winOffset = Math.max(1, Math.floor(offset || 1));
		const endIdx = rows.length - 1;
		const startCurr = Math.max(0, endIdx - take + 1);
		const prevEnd = Math.max(0, startCurr - (winOffset * take));
		const prevStart = Math.max(0, prevEnd - take + 1);
		
		// Helper function to collect valid values from a range
		function collect(start, end) {
			const arr = [];
			for (let i = start; i <= end && i < rows.length; i++) {
				const v = rows[i].valNum;
				if (v !== null && v !== undefined && !isNaN(v)) {
					arr.push(v);
				}
			}
			return arr;
		}
		
		const currVals = collect(startCurr, endIdx);
		const prevVals = collect(prevStart, prevEnd);
		
		if (!currVals.length || !prevVals.length) return null;
		
		// Helper function to aggregate values
		function aggVals(list) {
			if (agg === 'sum') {
				return list.reduce((sum, val) => sum + val, 0);
			}
			if (agg === 'avg') {
				return list.reduce((sum, val) => sum + val, 0) / list.length;
			}
			return list[list.length - 1]; // 'last'
		}
		
		return {
			curr: aggVals(currVals),
			prev: aggVals(prevVals)
		};
	}

	/**
	 * Processes matrix data into rows with proper sorting
	 * @param {Array} matrix - Qlik matrix data
	 * @returns {Array} Processed and sorted rows
	 */
	function processMatrixData(matrix) {
		const rows = matrix.map(row => ({
			dateText: row[0].qText,
			dateNum: row[0].qNum,
			valNum: row[1].qNum
		}));
		
		// Sort by date number
		rows.sort((a, b) => {
			const aDate = isFinite(a.dateNum) ? a.dateNum : 0;
			const bDate = isFinite(b.dateNum) ? b.dateNum : 0;
			return aDate - bDate;
		});
		
		return rows;
	}

	/**
	 * Sets up trend window based on quick button configuration
	 * Uses sessionStorage for persistence across selections
	 * @param {Object} layout - Layout configuration
	 * @param {string} elementId - Unique element identifier for session storage
	 */
	function setupTrendWindow(layout, elementId) {
		if (!layout.props.showQuickButtons || layout.props.showTrend === false) return;
		
		// Priority: sessionStorage > currentSelectedButton > defaultButton
		const sessionButton = getSelectedButton(elementId);
		const selectedButton = sessionButton || layout.props.currentSelectedButton || layout.props.defaultButton || 'button2';
		let selectedPoints;
		
		switch (selectedButton) {
			case 'button1':
				selectedPoints = layout.props.button1Value || CONSTANTS.DEFAULT_BUTTON1_VALUE;
				break;
			case 'button2':
				selectedPoints = layout.props.button2Value || CONSTANTS.DEFAULT_BUTTON2_VALUE;
				break;
			case 'button3':
				selectedPoints = layout.props.button3Value || CONSTANTS.DEFAULT_BUTTON3_VALUE;
				break;
			default:
				selectedPoints = CONSTANTS.DEFAULT_BUTTON2_VALUE;
		}
		
		layout.props.trendWindowMode = 'lastNPoints';
		layout.props.trendWindowPoints = selectedPoints;
		
		// Update currentSelectedButton to match session storage
		if (sessionButton) {
			layout.props.currentSelectedButton = sessionButton;
		}
	}

	/**
	 * Calculates responsive font sizes based on container dimensions
	 * @param {Object} layout - Layout configuration
	 * @param {number} containerWidth - Container width
	 * @param {number} containerHeight - Container height
	 * @returns {Object} Font size calculations
	 */
	function calculateResponsiveFonts(layout, containerWidth, containerHeight) {
		const isResponsive = layout.props.fontMode === 'responsive';
		const secondaryRatio = 0.45;
		
		if (!isResponsive) {
			const valuePxStatic = layout.props.valueFontSize || 28;
			return {
				titleFontSize: (layout.props.titleFontSize || 12) + 'px',
				valueFontSize: valuePxStatic + 'px',
				deltaFontSize: (layout.props.deltaFontSize || 16) + 'px',
				measureLabelFontSize: (layout.props.measureLabelSize || 11) + 'px',
				labelFontSize: (layout.props.labelFontSize || 10) + 'px',
				secondaryFontSize: (layout.props.secondaryFontSize || (valuePxStatic * secondaryRatio)) + 'px'
			};
		}
		
		function clamp(value, min, max) {
			return Math.max(min, Math.min(max, value));
		}
		
		const shortSide = Math.max(80, Math.min(containerWidth, containerHeight));
		const valuePx = clamp(shortSide * 0.125, 14, 96);
		const titlePx = clamp(valuePx * 0.48, 11, valuePx * 0.78);
		const deltaPx = clamp(valuePx * 0.65, 12, valuePx * 0.95);
		const measureLabelPx = clamp(valuePx * 0.4, 10, valuePx * 0.65);
		const dateLabelPx = clamp(valuePx * 0.36, 9, valuePx * 0.6);
		const secondaryPx = clamp(valuePx * secondaryRatio, 10, valuePx * 0.72);
		
		return {
			titleFontSize: Math.round(titlePx) + 'px',
			valueFontSize: Math.round(valuePx) + 'px',
			deltaFontSize: Math.round(deltaPx) + 'px',
			measureLabelFontSize: Math.round(measureLabelPx) + 'px',
			labelFontSize: Math.round(dateLabelPx) + 'px',
			secondaryFontSize: Math.round(secondaryPx) + 'px'
		};
	}

	/**
	 * Main render function - refactored for better performance and readability
	 * @param {jQuery} $element - Target element
	 * @param {Object} layout - Layout configuration
	 * @param {Array} matrix - Qlik matrix data
	 */
	function renderCard($element, layout, matrix) {
		const measInfo = layout.qHyperCube.qMeasureInfo[0];
		
		// Process matrix data
		const rows = processMatrixData(matrix);
		
		// Set up trend window based on quick buttons
		const renderElementId = (layout && layout.qInfo && layout.qInfo.qId) || $element.attr('id') || $element.data('qv-object') || 'default';
		setupTrendWindow(layout, renderElementId);
		
		// Process data and calculate values
		const fullRows = rows.slice(0);
		const windowRows = filterByWindow(rows, layout.props);
		const dataPairs = windowRows.map(row => [row.dateText, row.valNum]);
		
		const aggRowsForKpi = (layout.props.kpiScope === 'window') ? windowRows : fullRows;
		const kpiPairs = aggRowsForKpi.map(row => [row.dateText, row.valNum]);
		const currentVal = computeAggregate(kpiPairs, layout.props.kpiAgg || 'last');
		
		// Calculate labels and styling
		const startLabel = dataPairs.length ? formatDate(dataPairs[0][0]) : '';
		const endLabel = dataPairs.length ? formatDate(dataPairs[dataPairs.length - 1][0]) : '';
		const colors = getEffectiveColors(layout.props);
		const alignCss = (layout.props.align === 'center') ? 'center' : 
			(layout.props.align === 'right' ? 'right' : 'left');
		
		// Container dimensions and styling
		const elementNode = $element && $element[0];
		const elementId = (layout && layout.qInfo && layout.qInfo.qId) || (elementNode && elementNode.getAttribute && elementNode.getAttribute('data-qv-object')) || (elementNode && elementNode.id) || 'kpi-card-default';
		let containerWidth = $element.width() || window.innerWidth;
		let containerHeight = $element.height() || window.innerHeight;
		if (elementNode && elementNode.getBoundingClientRect) {
			const elementRect = elementNode.getBoundingClientRect();
			if (elementRect && elementRect.width && elementRect.height) {
				containerWidth = elementRect.width;
				containerHeight = elementRect.height;
			} else if (elementNode.parentElement && elementNode.parentElement.getBoundingClientRect) {
				const parentRect = elementNode.parentElement.getBoundingClientRect();
				if (parentRect && parentRect.width && parentRect.height) {
					containerWidth = parentRect.width;
					containerHeight = parentRect.height;
				}
			}
		}
		containerWidth = Math.max(1, containerWidth);
		containerHeight = Math.max(1, containerHeight);
		
		if (layout.props.fontMode === 'responsive') {
			const state = responsiveObserverState[elementId] || {};
			state.size = { width: containerWidth, height: containerHeight };
			state.layout = layout;
			state.matrix = matrix;
			state.element = elementNode || state.element;
			responsiveObserverState[elementId] = state;
		}
		const showTrend = layout.props.showTrend !== false; // Default to true if not set
		const kpiSectionHeight = layout.props.kpiSectionHeight || CONSTANTS.DEFAULT_KPI_SECTION_HEIGHT;
		const trendSectionHeight = showTrend ? (layout.props.trendSectionHeight || CONSTANTS.DEFAULT_TREND_SECTION_HEIGHT) : 0;
		
		// Adjust grid template based on whether trend is shown
		const gridTemplateRows = showTrend ? 
			`${kpiSectionHeight}% ${trendSectionHeight}%` : 
			`100%`;
		const containerStyle = `position:relative;width:100%;height:100%;display:grid;grid-template-rows:${gridTemplateRows};gap:0;align-items:stretch;`;
		const darkModeClass = layout.props.darkMode ? ' ' + CONSTANTS.DARK_MODE_CLASS : '';
		
		// Calculate responsive font sizes
		const fontSizes = calculateResponsiveFonts(layout, containerWidth, containerHeight);
		
		// Generate HTML content
		const backgroundOverride = getConditionalBackground(layout, currentVal);
		const titleHtml = generateTitleHtml(layout, colors, fontSizes);
		const valueHtml = generateValueHtml(layout, colors, fontSizes, currentVal, measInfo);
		const deltaData = computeDeltaFromRows(fullRows, layout.props.deltaPoints, layout.props.deltaAgg || 'last', layout.props.deltaOffset);
		const deltaHtml = generateDeltaHtml(layout, colors, fontSizes, fullRows, measInfo, deltaData);
		const secondaryValue = layout.props.showSecondaryKpi && deltaData ? deltaData.prev : null;
		const secondaryHtml = generateSecondaryKpiHtml(layout, colors, fontSizes, secondaryValue, measInfo);
		const measureLabelHtml = generateMeasureLabelHtml(layout, colors, fontSizes);
		const labelsHtml = generateLabelsHtml(layout, colors, fontSizes, startLabel, endLabel);
		const sparkHtml = generateSparklineHtml(layout, containerHeight, trendSectionHeight);
		const quickButtonsHtml = generateQuickButtonsHtml(layout, renderElementId);
		
		// Build final HTML
		const html = buildFinalHtml(
			darkModeClass, containerStyle, layout, colors,
			titleHtml, valueHtml, deltaHtml, measureLabelHtml,
			labelsHtml, sparkHtml, quickButtonsHtml, secondaryHtml, backgroundOverride, fullRows, deltaData
		);
		
		// Render to DOM
		$element.html(html);
		
		setupResponsiveObserver($element, layout, matrix);
		
		// Set up sparkline (only if trend is shown)
		if (layout.props.showTrend !== false) {
			setupSparkline($element, dataPairs, layout, measInfo, colors);
		}
		
		// Set up event handlers
		setupEventHandlers($element, layout, matrix);
		
		// Trigger animations
		triggerAnimations($element, layout, currentVal, measInfo);
	}

	/**
	 * Generates icon HTML based on icon type
	 * @param {string} iconType - Icon type
	 * @param {string} position - Icon position
	 * @param {Object} colors - Color configuration
	 * @returns {string} Icon HTML
	 */
	function generateIconHtml(layout, position, colors) {
		if (!layout.props.showIcon) return '';
		
		const selectedPosition = layout.props.iconPosition || 'top-right';
		if (position !== selectedPosition) return '';
		
		const iconPack = layout.props.iconPack || 'emoji';
		const iconSize = layout.props.iconSize || (position.startsWith('top') ? 24 : 18);
		const iconColor = colors.valueColor || '#111111';
		
		let iconMarkup = '';
		if (iconPack === 'custom') {
		let customIcon = decodeCustomMarkup(layout.props.iconCustom || '').trim();
			if (!customIcon) return '';

		// Attempt to extract the first SVG tag to avoid editor wrappers
		const svgMatch = customIcon.match(/<svg[\s\S]*?<\/svg>/i);
		if (svgMatch) {
			customIcon = svgMatch[0];
		}

		iconMarkup = sanitizeSvgMarkup(customIcon, iconSize);
		} else if (iconPack === 'modern') {
			const iconType = layout.props.iconType || 'trend-up';
			if (MODERN_ICON_MAP[iconType]) {
				const iconDef = MODERN_ICON_MAP[iconType];
				const paths = iconDef.paths.map(function(d) {
					return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${Math.max(1.5, iconSize / 16)}" stroke-linecap="round" stroke-linejoin="round"></path>`;
				}).join('');
				iconMarkup = `<svg width="${iconSize}" height="${iconSize}" viewBox="${iconDef.viewBox}" stroke="${iconColor}" fill="none">${paths}</svg>`;
			} else {
				iconMarkup = `<span style="font-size:${iconSize}px;line-height:1;">${EMOJI_ICON_MAP.chart}</span>`;
			}
		} else {
			const iconType = layout.props.iconType || 'chart';
			const emojiIcon = EMOJI_ICON_MAP[iconType] || EMOJI_ICON_MAP.chart;
			iconMarkup = `<span style="font-size:${iconSize}px;line-height:1;">${emojiIcon}</span>`;
		}
		
		let style = `--icon-size:${iconSize}px;`;
		switch (position) {
			case 'top-left':
				style += `position:absolute;top:8px;left:8px;font-size:${iconSize}px;opacity:0.75;z-index:5;`;
				break;
			case 'top-right':
				style += `position:absolute;top:8px;right:8px;font-size:${iconSize}px;opacity:0.75;z-index:5;`;
				break;
			case 'before-title':
				style += `display:inline-flex;align-items:center;margin-right:6px;opacity:0.9;`;
				break;
			case 'after-title':
				style += `display:inline-flex;align-items:center;margin-left:6px;opacity:0.9;`;
				break;
			case 'value-right':
				style += `display:inline-flex;align-items:center;justify-content:center;opacity:0.95;`;
				break;
			default:
				style += `display:inline-flex;align-items:center;margin-right:6px;opacity:0.9;`;
		}
		
		const extraClass = position === 'value-right' ? ' kpi-card__icon--value' : '';
		return `<span class="kpi-card__icon${extraClass}" style="${style}">${iconMarkup}</span>`;
	}

	function evaluateCondition(value, operator, v1, v2) {
		if (value === null || value === undefined || isNaN(value)) return false;
		const numValue = Number(value);
		const a = Number(v1);
		const b = Number(v2);
		switch (operator) {
			case 'gte': return numValue >= a;
			case 'gt': return numValue > a;
			case 'lte': return numValue <= a;
			case 'lt': return numValue < a;
			case 'eq': return numValue === a;
			case 'between':
				if (isNaN(a) || isNaN(b)) return false;
				const min = Math.min(a, b);
				const max = Math.max(a, b);
				return numValue >= min && numValue <= max;
			default:
				return false;
		}
	}

	function getConditionalBackground(layout, currentVal) {
		if (!layout.props.enableBackgroundCondition) return null;
		const op = layout.props.backgroundConditionOperator || 'gt';
		const v1 = layout.props.backgroundConditionValue;
		const v2 = layout.props.backgroundConditionValue2;
		if (!evaluateCondition(currentVal, op, v1, v2)) return null;
		return layout.props.backgroundConditionColor || '#1f2937';
	}

	
	/**
	 * Checks if the card is currently selected in Qlik Sense
	 * @param {Object} layout - Layout configuration
	 * @returns {boolean|Promise<boolean>} True if selected (can be async)
	 */
	function checkIfSelected(layout) {
		if (!layout || !layout.props.enableClick) {
			return false;
		}
		
		const clickAction = layout.props.clickAction || 'select-field-value';
		// console.log('KPI Card: Checking selection status. Action:', clickAction);
		
		// For select-field-value: Check if the specified field has the specified value selected
		if (clickAction === 'select-field-value' && layout.props.selectFieldName && layout.props.selectFieldName.trim() !== '') {
			try {
				if (qlik) {
					const app = qlik.currApp();
					if (app) {
						// Use selectionState instead of field.getSelected
						const selectionState = app.selectionState();
						const selections = selectionState.selections;
						const fieldName = layout.props.selectFieldName;
						
						// Find if our field is in the selections
						const fieldSelection = selections.filter(function(s) { return s.fieldName === fieldName; })[0];
						
						if (!fieldSelection) {
							return false;
						}
						
						const expectedValue = layout.props.selectFieldValue;
						
						// If no specific value is required, any selection on this field counts as selected
						if (expectedValue === undefined || expectedValue === null || (typeof expectedValue === 'string' && expectedValue.trim() === '')) {
							return true;
						}
						
						// Check if expected value is in the selected values
						// Normalize expected value to string and trim
						const expectedValStr = String(expectedValue).trim().toLowerCase();
						
						const isMatch = fieldSelection.selectedValues.some(function(item) {
							const itemVal = item.qName; // selectedValues usually has qName
							return itemVal && String(itemVal).trim().toLowerCase() === expectedValStr;
						});
						
						return isMatch;
					}
				}
			} catch (e) {
				console.error('KPI Card: Error checking field selection', e);
				return false;
			}
		}
		
		// For change-variable: Check if the variable has the specified value
		if (clickAction === 'change-variable' && layout.props.variableName && layout.props.variableName.trim() !== '') {
			try {
				if (qlik) {
					const app = qlik.currApp();
					if (app) {
						return app.variable.getContent(layout.props.variableName).then(function(result) {
							// console.log('KPI Card: Variable content:', result);
							// Handle different return structures of getContent
							let currentContent = '';
							if (result) {
								if (typeof result === 'string' || typeof result === 'number') {
									currentContent = result.toString();
								} else if (result.qContent) {
									if (result.qContent.qString !== undefined) {
										currentContent = result.qContent.qString;
									} else {
										currentContent = result.qContent.toString();
									}
								} else if (result.qString !== undefined) {
									currentContent = result.qString;
								}
							}

							const expectedValue = layout.props.variableValue;
							
							// If no specific value is required, any non-empty value counts
							if (expectedValue === undefined || expectedValue === null || (typeof expectedValue === 'string' && expectedValue.trim() === '')) {
								return currentContent !== '';
							}
							
							// Check if variable value matches expected value (case-insensitive)
							const isMatch = String(currentContent).trim().toLowerCase() === String(expectedValue).trim().toLowerCase();
							return isMatch;
						}).catch(function() {
							return false;
						});
					}
				}
			} catch (e) {
				console.error('KPI Card: Error checking variable content', e);
				return false;
			}
		}
		
		return false;
	}
	
	/**
	 * Gets selected indicator style based on selected indicator type
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @returns {string} Selected indicator style
	 */
	function getSelectedIndicatorStyle(layout, colors) {
		const indicatorType = layout.props.selectedIndicator || 'bottom-border';
		const selectedColor = layout.props.selectedColor || '#3b82f6';
		
		// Convert hex color to rgba for background tint
		function hexToRgba(hex, alpha) {
			if (!hex || hex.length < 7) return `rgba(59, 130, 246, ${alpha})`;
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}
		
		switch (indicatorType) {
			case 'border':
				return `border:3px solid ${selectedColor} !important;`;
			case 'bottom-border':
				return `border-bottom:4px solid ${selectedColor} !important;`;
			case 'top-border':
				return `border-top:4px solid ${selectedColor} !important;`;
			case 'glow':
				return `box-shadow:0 0 20px ${selectedColor}, inset 0 0 20px ${hexToRgba(selectedColor, 0.25)} !important;`;
			case 'background':
				return `background:${hexToRgba(selectedColor, 0.15)} !important;`;
			default:
				return `border-bottom:4px solid ${selectedColor} !important;`;
		}
	}
	
	/**
	 * Generates status badge HTML based on delta
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Array} fullRows - Full rows data
	 * @returns {string} Status badge HTML
	 */
	function generateStatusBadgeHtml(layout, colors, fullRows, precomputedDelta) {
		if (!layout.props.showStatusBadge || !layout.props.showDelta) return '';
		
		const delta = precomputedDelta || computeDeltaFromRows(fullRows, layout.props.deltaPoints, layout.props.deltaAgg || 'last', layout.props.deltaOffset);
		if (!delta) return '';
		
		const diff = delta.curr - delta.prev;
		const displayType = layout.props.deltaDisplayType || 'percentage';
		
		let status, badgeColor, badgeText;
		if (displayType === 'absolute') {
			if (diff > 0) {
				status = 'positive';
				badgeColor = colors.deltaUpColor;
				badgeText = '▲';
			} else if (diff < 0) {
				status = 'negative';
				badgeColor = colors.deltaDownColor;
				badgeText = '▼';
			} else {
				status = 'neutral';
				badgeColor = colors.deltaNeutralColor;
				badgeText = '■';
			}
		} else {
			if (delta.prev === 0) return '';
			const pct = (diff / Math.abs(delta.prev)) * 100;
			if (pct > 0) {
				status = 'positive';
				badgeColor = colors.deltaUpColor;
				badgeText = '▲';
			} else if (pct < 0) {
				status = 'negative';
				badgeColor = colors.deltaDownColor;
				badgeText = '▼';
			} else {
				status = 'neutral';
				badgeColor = colors.deltaNeutralColor;
				badgeText = '■';
			}
		}
		
		return `<div class="kpi-card__status-badge" style="width:32px;height:32px;border-radius:50%;background:${badgeColor};opacity:0.25;display:flex;align-items:center;justify-content:center;font-size:16px;color:${badgeColor};border:2px solid ${badgeColor};">${badgeText}</div>`;
	}
	
	/**
	 * Generates title HTML
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @returns {string} Title HTML
	 */
	function generateTitleHtml(layout, colors, fontSizes) {
		if (!layout.props || !layout.props.title) return '';
		
		const iconBefore = generateIconHtml(layout, 'before-title', colors);
		const iconAfter = generateIconHtml(layout, 'after-title', colors);
		const titleContent = `${iconBefore}${layout.props.title}${iconAfter}`;
		
		return `<div class="kpi-card__title" style="font-size:${fontSizes.titleFontSize};font-family:${layout.props.titleFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.titleColor};">${titleContent}</div>`;
	}

	/**
	 * Generates value HTML
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @param {number} currentVal - Current value
	 * @param {Object} measInfo - Measure information
	 * @returns {string} Value HTML
	 */
	function generateValueHtml(layout, colors, fontSizes, currentVal, measInfo) {
		const animationStyle = layout.props.animateValue ? 
			`opacity:0;transform:scale(0.8);transition:opacity ${layout.props.valueAnimDuration || CONSTANTS.DEFAULT_VALUE_ANIMATION_DURATION}ms ease,transform ${layout.props.valueAnimDuration || CONSTANTS.DEFAULT_VALUE_ANIMATION_DURATION}ms ease;` : '';
		
		const displayValue = layout.props.animateValue ? '0' : formatNumber(currentVal, measInfo, layout, false, layout.props.kpiDecimalPlaces ?? 0);
		
		return `<div class="kpi-card__value" style="font-size:${fontSizes.valueFontSize};font-family:${layout.props.valueFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.valueColor};display:inline-block;${animationStyle}">${displayValue}</div>`;
	}

	/**
	 * Generates delta HTML
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @param {Array} fullRows - Full rows data
	 * @param {Object} measInfo - Measure information
	 * @returns {string} Delta HTML
	 */
	function generateDeltaHtml(layout, colors, fontSizes, fullRows, measInfo, precomputedDelta) {
		if (!layout.props.showDelta) return '';
		
		const delta = precomputedDelta || computeDeltaFromRows(fullRows, layout.props.deltaPoints, layout.props.deltaAgg || 'last', layout.props.deltaOffset);
		if (!delta) return '';
		
		const diff = delta.curr - delta.prev;
		const displayType = layout.props.deltaDisplayType || 'percentage';
		const decimals = layout.props.deltaDecimals || CONSTANTS.DEFAULT_DELTA_DECIMALS;
		const factor = Math.pow(10, decimals);
		
		// Use colors passed from getEffectiveColors (theme-aware)
		let displayValue, sign, col;
		
		if (displayType === 'absolute') {
			// Absolute change - use delta format setting
			const absDiff = Math.abs(diff);
			displayValue = formatNumber(absDiff, measInfo, layout, true); // isDelta = true
			sign = diff > 0 ? '▲' : (diff < 0 ? '▼' : '■');
			col = diff > 0 ? colors.deltaUpColor : (diff < 0 ? colors.deltaDownColor : colors.deltaNeutralColor);
		} else {
			// Percentage change
			if (delta.prev === 0) return '';
			const pct = (diff / Math.abs(delta.prev)) * 100;
			displayValue = (Math.round(pct * factor) / factor).toFixed(decimals) + '%';
			sign = pct > 0 ? '▲' : (pct < 0 ? '▼' : '■');
			col = pct > 0 ? colors.deltaUpColor : (pct < 0 ? colors.deltaDownColor : colors.deltaNeutralColor);
		}
		
		// Set initial animation state if delta animation is enabled
		const animationStyle = layout.props.animateDelta ? 
			`opacity:0;transform:translateX(-10px);transition:opacity ${layout.props.deltaAnimDuration || CONSTANTS.DEFAULT_DELTA_ANIMATION_DURATION}ms ease,transform ${layout.props.deltaAnimDuration || CONSTANTS.DEFAULT_DELTA_ANIMATION_DURATION}ms ease;` : '';
		
		return `<div class="kpi-card__delta" style="display:inline-block;margin-left:${layout.props.deltaGap || CONSTANTS.DEFAULT_DELTA_GAP}px;color:${col};font-size:${fontSizes.deltaFontSize};font-family:${layout.props.deltaFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};${animationStyle}">${sign} ${displayValue}</div>`;
	}

	/**
	 * Generates secondary KPI HTML (previous period)
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @param {number|null} secondaryValue - Secondary value to display
	 * @param {Object} measInfo - Measure information
	 * @returns {string} Secondary KPI HTML
	 */
	function generateSecondaryKpiHtml(layout, colors, fontSizes, secondaryValue, measInfo) {
		if (!layout.props.showSecondaryKpi) return '';
		
		const label = layout.props.secondaryLabel || 'Previous Period';
		const color = layout.props.secondaryColor || '#94a3b8';
		const primarySizePx = parseFloat(fontSizes.valueFontSize) || layout.props.valueFontSize || 28;
		const fallbackSecondaryPx = layout.props.secondaryFontSize || (primarySizePx * 0.45);
		const fallbackFontSize = fallbackSecondaryPx + 'px';
		const fontSizeValue = fontSizes.secondaryFontSize || fallbackFontSize;
		const fontFamily = layout.props.secondaryFontFamily || layout.props.valueFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY;
		const decimals = layout.props.secondaryDecimalPlaces ?? layout.props.kpiDecimalPlaces ?? 0;
		const formatted = (secondaryValue !== null && secondaryValue !== undefined) ? formatNumber(secondaryValue, measInfo, layout, false, decimals) : '-';
		const italicLabel = `<span style="font-style:italic;">${label}</span>`;
		
		return `<div class="kpi-card__secondary" style="margin-top:4px;color:${color};font-size:${fontSizeValue};font-family:${fontFamily};opacity:0.9;">${italicLabel}: ${formatted}</div>`;
	}

	/**
	 * Generates measure label HTML
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @returns {string} Measure label HTML
	 */
	function generateMeasureLabelHtml(layout, colors, fontSizes) {
		if (!layout.props || !layout.props.measureLabel) return '';
		
		return `<div class="kpi-card__measure-label" style="font-size:${fontSizes.measureLabelFontSize};font-family:${layout.props.measureLabelFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.measureLabelColor};display:inline-block;">${layout.props.measureLabel}</div>`;
	}

	/**
	 * Generates labels HTML
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @param {string} startLabel - Start label
	 * @param {string} endLabel - End label
	 * @returns {string} Labels HTML
	 */
	function generateLabelsHtml(layout, colors, fontSizes, startLabel, endLabel) {
		if (!layout.props || !layout.props.showLabelDates) return '';
		
		const maxWidthPct = Math.max(0, Math.min(50, layout.props.labelMaxWidthPct || CONSTANTS.DEFAULT_LABEL_MAX_WIDTH_PCT));
		const endOffset = layout.props.endLabelOffsetPx || CONSTANTS.DEFAULT_END_LABEL_OFFSET;
		const startRightPad = layout.props.startLabelRightPadPx != null ? layout.props.startLabelRightPadPx : (layout.props.endLabelRightPadPx || 0);
		const padding = layout.props.padding || CONSTANTS.DEFAULT_PADDING;
		
		return `<div class="kpi-card__labels" style="position:absolute; bottom:8px; left:${padding}px; right:${padding}px; z-index:1; font-size:${fontSizes.labelFontSize};font-family:${layout.props.labelFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.labelColor};">` +
			`<span class="kpi-card__label kpi-card__label--start" style="max-width:${maxWidthPct}%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:${Math.max(0, startRightPad)}px;">${startLabel}</span>` +
			`<span class="kpi-card__label kpi-card__label--end" style="max-width:${maxWidthPct}%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:${Math.max(0, endOffset)}px;text-align:right;">${endLabel}</span>` +
			`</div>`;
	}

	/**
	 * Generates sparkline HTML
	 * @param {Object} layout - Layout configuration
	 * @param {number} containerHeight - Container height
	 * @param {number} trendSectionHeight - Trend section height percentage
	 * @returns {string} Sparkline HTML
	 */
	function generateSparklineHtml(layout, containerHeight, trendSectionHeight) {
		const dateLabelHeight = layout.props.showLabelDates ? CONSTANTS.DATE_LABEL_HEIGHT : 0;
		const availableTrendHeight = Math.max(CONSTANTS.MIN_CONTAINER_HEIGHT, (containerHeight * (trendSectionHeight / 100)) - dateLabelHeight - 20);
		const borderRadius = layout.props.borderRadius ? 
			`-webkit-clip-path:inset(0 round ${layout.props.borderRadius}px);clip-path:inset(0 round ${layout.props.borderRadius}px);` : '';
		
		return `<div class="kpi-card__sparkline" style="position:relative; width:100%; height:${availableTrendHeight}px; z-index:3; overflow:hidden;${borderRadius}"><div class="kpi-card__sparkline-inner"></div></div>`;
	}

	/**
	 * Generates quick buttons HTML
	 * @param {Object} layout - Layout configuration
	 * @param {string} elementId - Unique element identifier for session storage
	 * @returns {string} Quick buttons HTML
	 */
	function generateQuickButtonsHtml(layout, elementId) {
		if (!layout.props.showQuickButtons || layout.props.showTrend === false) return '';
		
		const buttonStyle = layout.props.buttonStyle || CONSTANTS.DEFAULT_BUTTON_STYLE;
		const buttonClass = `kpi-card__quick-btn kpi-card__quick-btn--${buttonStyle}`;
		const activeColor = layout.props.buttonActiveColor || CONSTANTS.DEFAULT_BUTTON_ACTIVE_COLOR;
		const activeLabelColor = layout.props.buttonActiveLabelColor || '#ffffff';
		const inactiveBackgroundColor = layout.props.buttonBackgroundColor || 'rgba(255,255,255,0.1)';
		const inactiveLabelColor = layout.props.buttonLabelColor || '';
		
		let buttonStyleCss = '';
		switch (buttonStyle) {
			case 'minimal':
				buttonStyleCss = `background:${inactiveBackgroundColor};border:1px solid rgba(255,255,255,0.2);color:${inactiveLabelColor || 'inherit'};`;
				break;
			case 'pill':
				buttonStyleCss = `background:${inactiveBackgroundColor};border:none;border-radius:20px;color:${inactiveLabelColor || 'inherit'};`;
				break;
			default: // rounded
				buttonStyleCss = `background:${inactiveBackgroundColor};border:none;border-radius:6px;color:${inactiveLabelColor || 'inherit'};`;
		}
		
		// Priority: sessionStorage > currentSelectedButton > defaultButton
		const sessionButton = getSelectedButton(elementId);
		const currentButton = sessionButton || layout.props.currentSelectedButton || layout.props.defaultButton || 'button2';
		const isButton1Active = (currentButton === 'button1') ? CONSTANTS.ACTIVE_CLASS : '';
		const isButton2Active = (currentButton === 'button2') ? CONSTANTS.ACTIVE_CLASS : '';
		const isButton3Active = (currentButton === 'button3') ? CONSTANTS.ACTIVE_CLASS : '';
		
		return `<div class="kpi-card__quick-buttons" style="display:flex;gap:4px;">` +
			`<button class="${buttonClass} ${isButton1Active}" data-value="${layout.props.button1Value || CONSTANTS.DEFAULT_BUTTON1_VALUE}" data-active-color="${activeColor}" data-active-label-color="${activeLabelColor}" style="${buttonStyleCss}padding:4px 8px;font-size:10px;cursor:pointer;transition:all 0.2s ease;">${layout.props.button1Label || CONSTANTS.DEFAULT_BUTTON1_LABEL}</button>` +
			`<button class="${buttonClass} ${isButton2Active}" data-value="${layout.props.button2Value || CONSTANTS.DEFAULT_BUTTON2_VALUE}" data-active-color="${activeColor}" data-active-label-color="${activeLabelColor}" style="${buttonStyleCss}padding:4px 8px;font-size:10px;cursor:pointer;transition:all 0.2s ease;">${layout.props.button2Label || CONSTANTS.DEFAULT_BUTTON2_LABEL}</button>` +
			`<button class="${buttonClass} ${isButton3Active}" data-value="${layout.props.button3Value || CONSTANTS.DEFAULT_BUTTON3_VALUE}" data-active-color="${activeColor}" data-active-label-color="${activeLabelColor}" style="${buttonStyleCss}padding:4px 8px;font-size:10px;cursor:pointer;transition:all 0.2s ease;">${layout.props.button3Label || CONSTANTS.DEFAULT_BUTTON3_LABEL}</button>` +
			`</div>`;
	}

	/**
	 * Builds final HTML structure
	 * @param {string} darkModeClass - Dark mode CSS class
	 * @param {string} containerStyle - Container style
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {string} titleHtml - Title HTML
	 * @param {string} valueHtml - Value HTML
	 * @param {string} deltaHtml - Delta HTML
	 * @param {string} measureLabelHtml - Measure label HTML
	 * @param {string} labelsHtml - Labels HTML
	 * @param {string} sparkHtml - Sparkline HTML
	 * @param {string} quickButtonsHtml - Quick buttons HTML
	 * @param {Array} fullRows - Full rows data for status badge
	 * @returns {string} Final HTML
	 */
	function buildFinalHtml(darkModeClass, containerStyle, layout, colors, titleHtml, valueHtml, deltaHtml, measureLabelHtml, labelsHtml, sparkHtml, quickButtonsHtml, secondaryHtml, backgroundOverride, fullRows, deltaData) {
		const padding = layout.props.padding || CONSTANTS.DEFAULT_PADDING;
		const borderWidth = layout.props.borderWidth || CONSTANTS.DEFAULT_BORDER_WIDTH;
		const borderRadius = layout.props.borderRadius || CONSTANTS.DEFAULT_BORDER_RADIUS;
		
		// Determine alignment CSS values
		const alignValue = layout.props.align || 'left';
		const alignItemsCss = alignValue === 'center' ? 'center' : (alignValue === 'right' ? 'flex-end' : 'flex-start');
		
		// Build value block with measure label positioning
		const valueWithDelta = `<div style="position:relative; z-index:1; display:inline-flex;align-items:baseline;">${valueHtml}${deltaHtml}</div>`;
		const inlineIconHtml = generateIconHtml(layout, 'value-right', colors);
		const valueContent = inlineIconHtml ? `<div class="kpi-card__value-row">${valueWithDelta}${inlineIconHtml}</div>` : valueWithDelta;
		const headerGap = layout.props.headerGapPx || CONSTANTS.DEFAULT_HEADER_GAP;
		
		let valueBlock;
		switch (layout.props.measureLabelPos) {
			case 'top':
				valueBlock = `<div style="display:flex;flex-direction:column;align-items:${alignItemsCss}">${measureLabelHtml}<div style="height:${headerGap}px"></div>${valueContent}</div>`;
				break;
			case 'left':
				valueBlock = `<div style="display:flex;align-items:baseline;gap:${headerGap}px;justify-content:${alignItemsCss}">${measureLabelHtml}${valueContent}</div>`;
				break;
			case 'right':
				valueBlock = `<div style="display:flex;align-items:baseline;gap:${headerGap}px;justify-content:${alignItemsCss}">${valueContent}${measureLabelHtml}</div>`;
				break;
			default:
				valueBlock = `<div style="display:flex;flex-direction:column;align-items:${alignItemsCss}">${valueContent}<div style="height:${headerGap}px"></div>${measureLabelHtml}</div>`;
		}
		
		// Build content wrapper with title and value block, aligned together
		// Add gap between title and value block if title exists
		const titleGap = titleHtml ? `<div style="height:${headerGap}px"></div>` : '';
		const contentWrapper = `<div style="display:flex;flex-direction:column;align-items:${alignItemsCss};width:100%;">${titleHtml}${titleGap}${valueBlock}${secondaryHtml}</div>`;
		
		const showTrend = layout.props.showTrend !== false; // Default to true if not set
		const kpiBorderStyle = showTrend ? 
			`border-bottom:none;border-bottom-left-radius:0;border-bottom-right-radius:0;` : 
			``;
		const trendBorderStyle = showTrend ? 
			`border-top:none;border-top-left-radius:0;border-top-right-radius:0;` : 
			``;
		
		// Add glass morphism effect if glass theme is selected
		const isGlassTheme = layout.props.theme === 'glass';
		const glassEffect = isGlassTheme ? 'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 8px 32px 0 rgba(31, 38, 135, 0.37);' : '';
		const glassEffectTrend = isGlassTheme ? 'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' : '';
		
		// Generate gradient background if enabled - apply to MAIN CONTAINER only
		const gradientEnabled = layout.props.useGradient === true;
		let containerBackgroundStyle = `background:${colors.backgroundColor};`;
		if (gradientEnabled) {
			let gradientStart = colors.gradientStart || layout.props.gradientStart || colors.backgroundColor;
			let gradientEnd = colors.gradientEnd || layout.props.gradientEnd || colors.backgroundColor;
			let gradientDirection = layout.props.gradientDirection || 'vertical';
			const presetName = layout.props.gradientPreset || 'custom';
			if (presetName !== 'custom') {
				const preset = GRADIENT_PRESETS.find(p => p.value === presetName);
				if (preset) {
					gradientStart = preset.start;
					gradientEnd = preset.end;
					gradientDirection = preset.direction || 'vertical';
				}
			}
			let gradientCss = '';
			switch (gradientDirection) {
				case 'horizontal':
					gradientCss = `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`;
					break;
				case 'diagonal':
					gradientCss = `linear-gradient(to bottom right, ${gradientStart}, ${gradientEnd})`;
					break;
				case 'radial':
					gradientCss = `radial-gradient(circle, ${gradientStart}, ${gradientEnd})`;
					break;
				default: // vertical
					gradientCss = `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})`;
			}
			containerBackgroundStyle = `background:${gradientCss} !important;`;
		}
		if (backgroundOverride) {
			containerBackgroundStyle = `background:${backgroundOverride} !important;`;
		}
		
		// Section backgrounds should be transparent when gradient or conditional background is used
		const sectionBackgroundStyle = (gradientEnabled || backgroundOverride) ? 'background:transparent !important;' : `background:${colors.backgroundColor};`;
		
		// Generate elevation/shadow styles - apply to MAIN CONTAINER
		let containerElevationStyle = '';
		const elevation = layout.props.cardElevation || 'none';
		switch (elevation) {
			case 'subtle':
				containerElevationStyle = 'box-shadow:0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);';
				break;
			case 'medium':
				containerElevationStyle = 'box-shadow:0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);';
				break;
			case 'strong':
				containerElevationStyle = 'box-shadow:0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);';
				break;
			case 'neumorphic':
				containerElevationStyle = 'box-shadow:8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7);';
				break;
		}
		
		// Generate icon HTML for top positions
		let topIconHtml = '';
		if (layout.props.showIcon && (layout.props.iconPosition === 'top-left' || layout.props.iconPosition === 'top-right')) {
			topIconHtml = generateIconHtml(layout, layout.props.iconPosition, colors);
		}
		
		// Generate status badge
		const statusBadgeHtml = generateStatusBadgeHtml(layout, colors, fullRows, deltaData);
		const chromeHtml = (statusBadgeHtml || quickButtonsHtml) ? `<div class="kpi-card__chrome">${quickButtonsHtml}${statusBadgeHtml}</div>` : '';
		
		// Click interaction style - apply to ENTIRE CARD
		const qlikEditMode = (qlik && qlik.navigation && typeof qlik.navigation.getMode === 'function' && qlik.navigation.getMode() !== 'analysis');
		const clickEnabled = layout.props.enableClick && !qlikEditMode;
		const clickStyle = clickEnabled ? 'cursor:pointer;transition:all 0.2s ease;' : '';
		const clickClass = clickEnabled ? ' kpi-card--clickable' : '';
		
		// Check if card is selected (for visual feedback)
		// Note: Async checks will be handled in paint function after render
		const isSelected = false; // Will be updated async if needed
		const selectedClass = '';
		const selectedIndicatorStyle = '';
		
		// Apply border ONLY to the main container, remove from child sections to avoid internal borders
		const trendSectionHtml = showTrend ? 
			`<div class="kpi-card__trend-section" style="position:relative;${sectionBackgroundStyle}border:none;border-radius:${borderRadius}px;${trendBorderStyle}${glassEffectTrend}">${sparkHtml}${labelsHtml}</div>` : 
			``;
		
		// Ensure border style is solid if border width > 0, otherwise force 0
		const borderStyle = borderWidth > 0 ? 
			`border: ${borderWidth}px solid ${colors.borderColor} !important;` : 
			'border: 0 !important;';
		
		// Selection indicator bar (modern tapered effect)
		const selectionBarHtml = `<div class="kpi-card__selection-bar" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:70%;height:0;transition:all 0.3s ease;z-index:20;pointer-events:none;border-radius:999px 999px 0 0;"></div>`;
		
		// Store border properties in data attributes for restoration after interaction
		return `<div class="kpi-card${darkModeClass}${isGlassTheme ? ' kpi-card--glass' : ''}${clickClass}${selectedClass}" data-border-width="${borderWidth}" data-border-color="${colors.borderColor}" style="${containerStyle}${containerBackgroundStyle}${containerElevationStyle}${clickStyle}${selectedIndicatorStyle}border-radius:${borderRadius}px;overflow:hidden;${borderStyle}">` +
			`<div class="kpi-card__kpi-section" style="position:relative;padding:${padding}px;${sectionBackgroundStyle}border:none;border-radius:${borderRadius}px;${kpiBorderStyle}${glassEffect}">${topIconHtml}${chromeHtml}${contentWrapper}</div>` +
			trendSectionHtml +
			selectionBarHtml +
			`</div>`;
	}

	/**
	 * Sets up sparkline rendering
	 * @param {jQuery} $element - Target element
	 * @param {Array} dataPairs - Data pairs
	 * @param {Object} layout - Layout configuration
	 * @param {Object} measInfo - Measure information
	 * @param {Object} colors - Color configuration
	 */
	function setupSparkline($element, dataPairs, layout, measInfo, colors) {
		const showTrend = layout.props.showTrend !== false; // Default to true if not set
		if (!showTrend) return; // Skip sparkline setup if trend is hidden
		
		const $sparklineHost = $element.find(`.${CONSTANTS.SPARKLINE_INNER_CLASS}`);
		if (!$sparklineHost.length) return; // Exit if sparkline container doesn't exist
		
		$sparklineHost.css('color', colors.lineColor);
		
		const opts = {
			lineColor: colors.lineColor,
			lineWidth: layout.props.lineWidth,
			mode: layout.props.trendMode,
			areaColor: colors.areaColor,
			areaOpacity: layout.props.areaOpacity,
			smooth: (layout.props.trendCorners === 'smooth'),
			showTooltip: layout.props.showTooltip,
			showMinMax: layout.props.showMinMax,
			minColor: CONSTANTS.DEFAULT_PULSE_MIN_COLOR,
			maxColor: CONSTANTS.DEFAULT_PULSE_MAX_COLOR,
			topPadPx: 8,
			bottomPadPx: 8,
			pulseRadius: Math.max(1.2, (layout.props.pulseRadius || CONSTANTS.DEFAULT_PULSE_RADIUS) * 0.7),
			pulseMinColor: layout.props.pulseMinColor,
			pulseMaxColor: layout.props.pulseMaxColor,
			showGlow: layout.props.showGlow,
			glowColor: layout.props.glowColor,
			glowStdDev: layout.props.glowStdDev,
			animateDraw: layout.props.animateDraw,
			animDurationMs: layout.props.animDurationMs,
			animatePulse: layout.props.animatePulse,
			pulseAnimDelay: layout.props.pulseAnimDelay,
			animateArea: layout.props.animateArea,
			areaAnimDuration: layout.props.areaAnimDuration,
			areaGradient: layout.props.areaGradient,
			areaGradientType: layout.props.areaGradientType,
			areaGradStartColor: layout.props.areaGradStartColor,
			areaGradEndColor: layout.props.areaGradEndColor,
			areaGradStartOpacity: layout.props.areaGradStartOpacity,
			areaGradEndOpacity: layout.props.areaGradEndOpacity,
			formatValue: function(v) { return formatNumber(v, measInfo, layout); }
		};
		
		buildSparkline($sparklineHost, dataPairs, opts);
	}

	/**
	 * Sets up event handlers
	 * @param {jQuery} $element - Target element
	 * @param {Object} layout - Layout configuration
	 * @param {Array} matrix - Matrix data
	 */
	function setupEventHandlers($element, layout, matrix) {
		const qlikEditMode = (qlik && qlik.navigation && typeof qlik.navigation.getMode === 'function' && qlik.navigation.getMode() !== 'analysis');
		const clickEnabled = layout.props.enableClick && !qlikEditMode;
		// Resize listener for responsive updates
		$(window).off(`resize.${CONSTANTS.RESIZE_EVENT_NAMESPACE}`).on(`resize.${CONSTANTS.RESIZE_EVENT_NAMESPACE}`, () => {
			setTimeout(() => {
				renderCard($element, layout, matrix);
			}, CONSTANTS.RESIZE_DEBOUNCE_DELAY);
		});
		
		// Quick buttons event handlers
		if (layout.props.showQuickButtons && layout.props.showTrend !== false) {
			const elementId = $element.attr('id') || $element.data('qv-object') || 'default';
			
			$element.find(`.${CONSTANTS.QUICK_BTN_CLASS}`).off('click').on('click', function() {
				const value = parseInt($(this).data('value'));
				const activeColor = $(this).data('active-color') || CONSTANTS.DEFAULT_BUTTON_ACTIVE_COLOR;
				
				// Determine which button was clicked
				let selectedButton;
				if (value === (layout.props.button1Value || CONSTANTS.DEFAULT_BUTTON1_VALUE)) {
					selectedButton = 'button1';
				} else if (value === (layout.props.button2Value || CONSTANTS.DEFAULT_BUTTON2_VALUE)) {
					selectedButton = 'button2';
				} else if (value === (layout.props.button3Value || CONSTANTS.DEFAULT_BUTTON3_VALUE)) {
					selectedButton = 'button3';
				}
				
				// Save to session storage for persistence
				if (selectedButton) {
					saveSelectedButton(elementId, selectedButton);
				}
				
				// Update trend window points
				layout.props.trendWindowMode = 'lastNPoints';
				layout.props.trendWindowPoints = value;
				
				// Update current selected button setting
				layout.props.currentSelectedButton = selectedButton;
				
				// Visual feedback
				const activeLabelColor = $(this).data('active-label-color') || '#ffffff';
				$element.find(`.${CONSTANTS.QUICK_BTN_CLASS}`).removeClass(CONSTANTS.ACTIVE_CLASS).css({
					'--active-color': '',
					'--active-label-color': ''
				});
				$(this).addClass(CONSTANTS.ACTIVE_CLASS).css({
					'--active-color': activeColor,
					'--active-label-color': activeLabelColor
				});
				
				// Re-render with new window
				setTimeout(() => {
					renderCard($element, layout, matrix);
				}, CONSTANTS.BUTTON_CLICK_DELAY);
			});
			
			// Apply active color to initially active button
			$element.find(`.${CONSTANTS.QUICK_BTN_CLASS}.${CONSTANTS.ACTIVE_CLASS}`).each(function() {
				const activeColor = $(this).data('active-color') || CONSTANTS.DEFAULT_BUTTON_ACTIVE_COLOR;
				const activeLabelColor = $(this).data('active-label-color') || '#ffffff';
				$(this).css({
					'--active-color': activeColor,
					'--active-label-color': activeLabelColor
				});
			});
		}
		
		// Hover effects
		if (layout.props.hoverValueScale) {
			$element.find(`.${CONSTANTS.VALUE_CLASS}`).hover(
				function() {
					$(this).css('transform', `scale(${CONSTANTS.HOVER_SCALE_MULTIPLIER})`);
				},
				function() {
					$(this).css('transform', 'scale(1)');
				}
			);
		}
		
		if (layout.props.hoverLineThickness) {
			const multiplier = layout.props.hoverLineThicknessMultiplier || CONSTANTS.HOVER_LINE_THICKNESS_MULTIPLIER;
			$element.find(`.${CONSTANTS.SPARKLINE_CLASS}`).hover(
				function() {
					$(this).find('svg path').css('stroke-width', (layout.props.lineWidth || CONSTANTS.DEFAULT_LINE_WIDTH) * multiplier);
				},
				function() {
					$(this).find('svg path').css('stroke-width', layout.props.lineWidth || CONSTANTS.DEFAULT_LINE_WIDTH);
				}
			);
		}
		
		// Click interaction - apply to ENTIRE CARD
		if (clickEnabled) {
			const clickAction = layout.props.clickAction || 'select-field-value';
			
			$element.find('.kpi-card').off('click.kpi-interaction').on('click.kpi-interaction', function(e) {
				// Don't trigger if clicking on quick buttons
				if ($(e.target).closest('.kpi-card__quick-buttons').length) {
					return;
				}
				
				// Add click animation to entire card
				$(this).css('transform', 'scale(0.98)');
				setTimeout(() => {
					$(this).css('transform', 'scale(1)');
				}, 150);
				
				// Trigger Qlik Sense selection based on click action
				if (qlik && layout.qHyperCube) {
					try {
						const app = qlik.currApp();
						if (app) {
							switch (clickAction) {
								case 'select-field-value':
									// Select specific value in a field
									if (layout.props.selectFieldName && layout.props.selectFieldName.trim() !== '') {
										const fieldValue = layout.props.selectFieldValue || '';
										const field = app.field(layout.props.selectFieldName);
										if (field) {
											if (fieldValue.trim() !== '') {
												// Select the specific value
												field.selectValues([fieldValue], true, true);
											} else {
												// If no value specified, select all
												field.selectAll();
											}
										}
									}
									break;
								case 'change-variable':
									// Change variable value
									if (layout.props.variableName && layout.props.variableName.trim() !== '') {
										const varValue = layout.props.variableValue || '';
										app.variable.setContent(layout.props.variableName, varValue);
									}
									break;
								case 'clear':
									// Clear all selections
									app.clearAll();
									break;
							}
						}
					} catch (e) {
						// Silently handle selection errors
					}
				}
			});
			
			// Add hover effect to entire card
			$element.find('.kpi-card').hover(
				function() {
					$(this).css('transform', 'translateY(-2px)');
				},
				function() {
					$(this).css('transform', 'translateY(0)');
				}
			);
			
			// Check selection status after render (for async checks)
			// Also set up periodic check for selection changes
			function updateSelectionIndicator() {
				const selectionResult = checkIfSelected(layout);
				
				function applySelectionEffect(selected) {
					const $card = $element.find('.kpi-card').first();
					const $bar = $element.find('.kpi-card__selection-bar');
					if (!$card.length || !$card[0]) return;
					
					const layoutBw = parseInt($card.attr('data-border-width'), 10) || 0;
					const layoutBc = $card.attr('data-border-color') || 'transparent';
					
					function restoreLayoutBorder() {
						if (layoutBw > 0) {
							$card[0].style.setProperty('border', `${layoutBw}px solid ${layoutBc}`, 'important');
						} else {
							$card[0].style.setProperty('border', '0', 'important');
						}
					}
					
					// Clear existing indicator styles
					['border', 'border-bottom', 'border-top', 'border-left', 'border-right', 'box-shadow'].forEach(function(prop) {
						$card[0].style.removeProperty(prop);
					});
					if ($bar && $bar.length) {
						$bar.css({
							height: '0',
							opacity: '0',
							boxShadow: 'none',
							background: 'transparent'
						});
					}
					
					if (selected) {
						$card.addClass('kpi-card--selected');
						const indicatorType = layout.props.selectedIndicator || 'tapered-bar';
						const selectedColor = layout.props.selectedColor || '#3b82f6';
						
						if (indicatorType === 'tapered-bar') {
							if ($bar && $bar.length) {
								$bar.css({
									height: '6px',
									opacity: '1',
									background: `radial-gradient(ellipse at center, ${selectedColor} 0%, ${selectedColor} 35%, transparent 80%)`,
									boxShadow: `0 0 12px 2px ${selectedColor}`,
									left: '50%',
									transform: 'translateX(-50%)',
									width: '70%'
								});
							}
							restoreLayoutBorder();
						} else {
							const indicatorStyle = getSelectedIndicatorStyle(layout, {});
							const styleParts = indicatorStyle.split(';').filter(function(s) { return s.trim(); });
							styleParts.forEach(function(stylePart) {
								const parts = stylePart.split(':');
								if (parts.length === 2) {
									const prop = parts[0].trim().replace(/!important/gi, '').trim();
									const value = parts[1].trim().replace(/!important/gi, '').trim();
									$card[0].style.setProperty(prop, value, 'important');
								}
							});
						}
					} else {
						$card.removeClass('kpi-card--selected');
						restoreLayoutBorder();
					}
				}
				
				if (selectionResult && typeof selectionResult.then === 'function') {
					selectionResult.then(applySelectionEffect).catch(function() {});
				} else {
					applySelectionEffect(selectionResult === true);
				}
			}
			
			// Initial check
			updateSelectionIndicator();
			
			// Set up periodic check (every 500ms) to update selection indicator
			const selectionCheckInterval = setInterval(function() {
				if (!$element || $element.length === 0) {
					clearInterval(selectionCheckInterval);
					return;
				}
				updateSelectionIndicator();
			}, 500);
			
			// Clean up interval when element is removed
			$element.on('remove', function() {
				clearInterval(selectionCheckInterval);
			});
		}
	}

	/**
	 * Validates input data and parameters
	 * @param {Object} layout - Layout configuration
	 * @param {Array} matrix - Matrix data
	 * @returns {Object} Validation result with isValid flag and error message
	 */
	function validateInputs(layout, matrix) {
		// Check layout structure
		if (!layout || !layout.qHyperCube) {
			return { isValid: false, error: 'Invalid layout structure' };
		}
		
		// Check matrix data
		if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
			return { isValid: false, error: 'No data available' };
		}
		
		// Check for required dimensions and measures
		const hc = layout.qHyperCube;
		if (!hc.qSize || hc.qSize.qcx < 2) {
			return { isValid: false, error: 'Add 1 date dimension and 1 measure' };
		}
		
		// Validate matrix structure
		for (let i = 0; i < matrix.length; i++) {
			const row = matrix[i];
			if (!row || !Array.isArray(row) || row.length < 2) {
				return { isValid: false, error: 'Invalid data structure' };
			}
			
			if (!row[0] || !row[1]) {
				return { isValid: false, error: 'Missing dimension or measure data' };
			}
		}
		
		return { isValid: true };
	}

	/**
	 * Safely executes a function with error handling
	 * @param {Function} fn - Function to execute
	 * @param {Array} args - Arguments to pass to the function
	 * @param {string} context - Context description for error logging
	 * @returns {*} Function result or null if error
	 */
	function safeExecute(fn, args = [], context = 'Unknown') {
		try {
			return fn.apply(null, args);
		} catch (err) {
			console.error(`KPI Card ${context} Error:`, err);
			return null;
		}
	}

	/**
	 * Triggers animations
	 * @param {jQuery} $element - Target element
	 * @param {Object} layout - Layout configuration
	 * @param {number} currentVal - Current value
	 * @param {Object} measInfo - Measure information
	 */
	function triggerAnimations($element, layout, currentVal, measInfo) {
		// Value animation
		if (layout.props.animateValue) {
			setTimeout(() => {
				const $valueElement = $element.find(`.${CONSTANTS.VALUE_CLASS}`);
				$valueElement.css({opacity: '1', transform: 'scale(1)'});
				
				const startValue = 0;
				const endValue = currentVal;
				const duration = layout.props.valueAnimDuration || CONSTANTS.DEFAULT_VALUE_ANIMATION_DURATION;
				
				const formatFunction = (value) => formatNumber(value, measInfo, layout);
				animateCounter($valueElement[0], startValue, endValue, duration, formatFunction);
			}, CONSTANTS.ANIMATION_TRIGGER_DELAY);
		}
		
		// Delta animation
		if (layout.props.animateDelta && layout.props.showDelta) {
			setTimeout(() => {
				$element.find(`.${CONSTANTS.DELTA_CLASS}`).css({opacity: '1', transform: 'translateX(0)'});
			}, CONSTANTS.DELTA_ANIMATION_DELAY);
		}
	}

	// Function to update field and variable lists
	function updateFieldAndVariableLists() {
		try {
			if (qlik && qlik.currApp) {
				const app = qlik.currApp();
				if (app) {
					// Get field list
					if (app.getList) {
						app.getList('FieldList').then(function(list) {
							if (list && list.qFieldList && list.qFieldList.qItems) {
								fieldListCache = list.qFieldList.qItems.map(function(item) {
									return { value: item.qName, label: item.qName };
								});
								// Update properties dynamically - navigate through the structure
								try {
									if (properties && properties.items && properties.items.appearance && properties.items.appearance.items) {
										const interactionSection = properties.items.appearance.items.interactionSection;
										if (interactionSection && interactionSection.items) {
											if (interactionSection.items.selectFieldName) {
												// Replace function with array to ensure dropdown is populated
												interactionSection.items.selectFieldName.options = fieldListCache.slice();
											}
										}
									}
								} catch (e) {
									// Ignore property update errors
								}
							}
						}).catch(function() {
							// Ignore errors
						});
					}
					
					// Get variable list (try VariableList first, fall back to legacy getAll)
					function updateVariableOptions(varItems) {
						if (varItems && varItems.length > 0) {
							variableListCache = varItems.map(function(v) {
								return { value: v.qName, label: v.qName };
							});
							try {
								if (properties && properties.items && properties.items.appearance && properties.items.appearance.items) {
									const interactionSection = properties.items.appearance.items.interactionSection;
									if (interactionSection && interactionSection.items && interactionSection.items.variableName) {
										interactionSection.items.variableName.options = variableListCache.slice();
									}
								}
							} catch (e) {
								// Ignore property update errors
							}
						}
					}
					
					if (app.getList) {
						app.getList('VariableList').then(function(model) {
							const varItems = extractVariableItems(model);
							updateVariableOptions(varItems);
						}).catch(function() {
							// Ignore errors and fall back
						});
					} else if (app.variable && app.variable.getAll) {
						app.variable.getAll().then(function(vars) {
							const varItems = extractVariableItems(vars);
							updateVariableOptions(varItems);
						}).catch(function() {
							// Ignore errors
						});
					}
				}
			}
		} catch (e) {
			// Ignore errors
		}
	}
	
	return {
		initialProperties: { qHyperCubeDef: { qDimensions: [], qMeasures: [], qInterColumnSortOrder: [], qNoOfLeftDims: 1, qSuppressMissing: true, qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 2, qHeight: 1000 }] }, props: { showLabelDates: true, align: 'left', fontMode: 'static', valueFontSize: 28, valueFontFamily: 'Open Sans', titleFontSize: 12, titleFontFamily: 'Open Sans', deltaFontSize: 16, deltaFontFamily: 'Open Sans', labelFontSize: 10, labelFontFamily: 'Open Sans', measureLabelSize: 11, measureLabelFontFamily: 'Open Sans', measureLabelPos: 'bottom', measureLabelGap: 4, theme: 'custom', valueColor: '#111111', titleColor: '#111111', labelColor: '#555555', measureLabelColor: '#666666', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, borderRadius: 0, padding: 8, cardElevation: 'none', useGradient: false, gradientPreset: 'custom', gradientStart: '#3b82f6', gradientEnd: '#8b5cf6', gradientDirection: 'vertical', showIcon: false, iconPack: 'emoji', iconType: 'chart', iconSize: 24, iconCustom: '', iconPosition: 'top-right', showStatusBadge: false, enableClick: false, clickAction: 'select-field-value', selectFieldName: '', selectFieldValue: '', variableName: '', variableValue: '', selectedIndicator: 'bottom-border', selectedColor: '#3b82f6', kpiSectionHeight: 60, trendSectionHeight: 40, sectionGap: 1, useShortFormatKpi: true, useShortFormatDelta: true, kpiDecimalPlaces: 0, secondaryDecimalPlaces: 0, showDelta: true, deltaDisplayType: 'percentage', deltaMode: 'points', deltaPoints: 1, deltaOffset: 1, deltaAgg: 'last', deltaDecimals: 1, deltaUpColor: '#16a34a', deltaDownColor: '#dc2626', deltaNeutralColor: '#9ca3af', deltaGap: 6, showTrend: true, trendPosition: 'bottom', trendHeight: 0, trendTopMarginPx: 0, pulseRadius: 1.8, pulseMinColor: '#dc2626', pulseMaxColor: '#16a34a', showGlow: false, glowColor: '#ffffff', glowStdDev: 2, animateDraw: true, animDurationMs: 600, animatePulse: true, pulseAnimDelay: 300, animateArea: false, areaAnimDuration: 800, animateValue: true, valueAnimDuration: 1000, animateDelta: false, deltaAnimDuration: 600, trendMode: 'line', trendCorners: 'sharp', lineColor: '#3f51b5', lineWidth: 1.5, areaColor: '#3f51b5', areaOpacity: 0.2, labelMaxWidthPct: 45, endLabelOffsetPx: 8, startLabelRightPadPx: 6, kpiAgg: 'last', kpiScope: 'full', showSecondaryKpi: false, secondaryLabel: 'Previous Period', secondaryColor: '#94a3b8', secondaryFontSize: 16, secondaryFontFamily: 'Open Sans', trendWindowMode: 'lastNPoints', trendWindowPoints: 60, trendWindowDays: 180, showTooltip: true, showMinMax: true, labelsGapPx: 2, areaGradient: false, areaGradientType: 'vertical', areaGradStartColor: '#3f51b5', areaGradEndColor: '#3f51b5', areaGradStartOpacity: 0.2, areaGradEndOpacity: 0, showQuickButtons: true, button1Value: 12, button1Label: '12P', button2Value: 60, button2Label: '60P', button3Value: 365, button3Label: '1Y', buttonStyle: 'rounded', buttonBackgroundColor: 'rgba(255,255,255,0.1)', buttonLabelColor: '', buttonActiveColor: '#3b82f6', buttonActiveLabelColor: '#ffffff', defaultButton: 'button2', currentSelectedButton: 'button2', valuePrefix: '', valuePrefixCustom: '', valueSuffix: '', valueSuffixCustom: '', hoverValueScale: true, hoverLineThickness: true, hoverLineThicknessMultiplier: 1.5, darkMode: false, enableBackgroundCondition: false, backgroundConditionOperator: 'gt', backgroundConditionValue: 0, backgroundConditionValue2: 0, backgroundConditionColor: '#1f2937', configPresetAction: '', configPresetText: '' } },
		definition: properties,
		support: { snapshot: true, export: true, exportData: true },
		paint: function ($element, layout) {
			// Update field and variable lists on first paint
			if (fieldListCache.length === 0 || variableListCache.length === 0) {
				updateFieldAndVariableLists();
			}
			const validation = validateInputs(layout, layout.qHyperCube?.qDataPages?.[0]?.qMatrix);
			if (!validation.isValid) {
				$element.html(`<div class="${CONSTANTS.EMPTY_CLASS}">${validation.error}</div>`);
				return qlik.Promise && qlik.Promise.resolve ? qlik.Promise.resolve() : Promise.resolve();
			}
			
			const matrix = layout.qHyperCube.qDataPages[0].qMatrix;
			safeExecute(renderCard, [$element, layout, matrix], 'Paint');
			
			return qlik.Promise && qlik.Promise.resolve ? qlik.Promise.resolve() : Promise.resolve();
		},
		
		resize: function ($element, layout) {
			const validation = validateInputs(layout, layout.qHyperCube?.qDataPages?.[0]?.qMatrix);
			if (!validation.isValid) {
				return qlik.Promise && qlik.Promise.resolve ? qlik.Promise.resolve() : Promise.resolve();
			}
			
			const matrix = layout.qHyperCube.qDataPages[0].qMatrix;
			
			// Re-render for responsive fonts
			setTimeout(() => {
				safeExecute(renderCard, [$element, layout, matrix], 'Resize');
			}, CONSTANTS.RESIZE_TIMEOUT);
			
			return qlik.Promise && qlik.Promise.resolve ? qlik.Promise.resolve() : Promise.resolve();
		}
	};
});
