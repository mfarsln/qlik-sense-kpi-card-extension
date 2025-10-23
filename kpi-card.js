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
	 * Formats a number with Qlik-style auto scaling (K, M, B) and percentage support
	 * @param {number} value - The value to format
	 * @param {Object} qMeasureInfo - Qlik measure information
	 * @param {Object} layout - Layout configuration
	 * @returns {string} Formatted number string
	 */
	function formatNumberWithAutoScaling(value, qMeasureInfo, layout) {
		if (value === null || value === undefined || !isFinite(value)) return '-';
		
		const fmt = (qMeasureInfo && qMeasureInfo.qNumFormat && qMeasureInfo.qNumFormat.qFmt) || '';
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
			const decimals = (percentDecimals != null) ? percentDecimals : 2;
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
		
		// Try to use Qlik's formatting first for non-percentage values
		let formatted = '';
		try {
			if (typeof value === 'number' && fmt && qlik && qlik.formatNumber) {
				formatted = qlik.formatNumber(value, fmt);
			}
		} catch (e) {
			// Silently handle formatting errors
		}
		
		// If Qlik formatting didn't work or returned raw number, apply our scaling
		if (!formatted || (!formatted.includes('K') && !formatted.includes('M') && !formatted.includes('B') && Math.abs(value) >= 1000)) {
			const abs = Math.abs(value);
			
			if (abs >= 1e9) {
				const scaled = value / 1e9;
				formatted = scaled.toFixed(1) + 'B';
			} else if (abs >= 1e6) {
				const scaled = value / 1e6;
				formatted = scaled.toFixed(1) + 'M';
			} else if (abs >= 1e3) {
				const scaled = value / 1e3;
				formatted = scaled.toFixed(1) + 'K';
			} else {
				formatted = Math.round(value).toString();
			}
		}
		
		return formatted;
	}

	/**
	 * Formats a number value with proper prefixes, suffixes, and scaling
	 * @param {number|null|undefined} value - The value to format
	 * @param {Object} qMeasureInfo - Qlik measure information
	 * @param {Object} layout - Layout configuration
	 * @returns {string} Formatted number string
	 */
	function formatNumber(value, qMeasureInfo, layout) {
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
		
		// Fallback formatting with scaling
		if (!formatted && typeof value === 'number') {
			const abs = Math.abs(value);
			if (abs >= 1e9) {
				formatted = (value / 1e9).toFixed(1) + 'B';
			} else if (abs >= 1e6) {
				formatted = (value / 1e6).toFixed(1) + 'M';
			} else if (abs >= 1e3) {
				formatted = (value / 1e3).toFixed(1) + 'K';
			} else {
				formatted = String(value);
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
	 * @param {Object} qMeasureInfo - Qlik measure information for auto scaling
	 * @param {Object} layout - Layout configuration for percentage formatting
	 * @returns {Function} Function to stop the animation
	 */
	function animateCounter(element, startValue, endValue, duration, formatFunction, qMeasureInfo, layout) {
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
				// Use auto scaling for animation to prevent decimal issues
				const animatedValue = formatNumberWithAutoScaling(currentValue, qMeasureInfo, layout);
				element.textContent = animatedValue;
			} else {
				element.textContent = Math.round(currentValue);
			}
			
			if (progress < 1 && isAnimating) {
				requestAnimationFrame(animate);
			} else {
				// Ensure final value uses exact formatting
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

	// Color palettes
	const PALETTES = {
		custom: {},
		slate: {
			backgroundColor: '#0f172a',
			titleColor: '#e2e8f0',
			valueColor: '#f8fafc',
			labelColor: '#94a3b8',
			measureLabelColor: '#cbd5e1',
			lineColor: '#38bdf8',
			areaColor: '#38bdf8',
			borderColor: 'transparent'
		},
		ocean: {
			backgroundColor: '#0b132b',
			titleColor: '#d8e2dc',
			valueColor: '#eaeaea',
			labelColor: '#a3b6c4',
			measureLabelColor: '#c7ced6',
			lineColor: '#5bc0be',
			areaColor: '#5bc0be',
			borderColor: 'transparent'
		},
		sunset: {
			backgroundColor: '#1f0a24',
			titleColor: '#ffd7ba',
			valueColor: '#ffe5d9',
			labelColor: '#f8edeb',
			measureLabelColor: '#fec5bb',
			lineColor: '#ff7b7b',
			areaColor: '#ff7b7b',
			borderColor: 'transparent'
		},
		emerald: {
			backgroundColor: '#062925',
			titleColor: '#d1fae5',
			valueColor: '#ecfdf5',
			labelColor: '#a7f3d0',
			measureLabelColor: '#6ee7b7',
			lineColor: '#34d399',
			areaColor: '#34d399',
			borderColor: 'transparent'
		},
		violet: {
			backgroundColor: '#1a102a',
			titleColor: '#e9d5ff',
			valueColor: '#faf5ff',
			labelColor: '#d8b4fe',
			measureLabelColor: '#c4b5fd',
			lineColor: '#a78bfa',
			areaColor: '#a78bfa',
			borderColor: 'transparent'
		}
	};
	
	const TREND_PALETTES = {
		custom: {},
		blue: { lineColor: '#1d4ed8', areaColor: '#60a5fa' },
		purple: { lineColor: '#7c3aed', areaColor: '#c4b5fd' },
		green: { lineColor: '#059669', areaColor: '#6ee7b7' },
		orange: { lineColor: '#ea580c', areaColor: '#fdba74' },
		red: { lineColor: '#dc2626', areaColor: '#fca5a5' }
	};

	/**
	 * Gets effective colors based on palette and custom overrides
	 * @param {Object} props - Properties containing color configuration
	 * @returns {Object} Object containing effective color values
	 */
	function getEffectiveColors(props) {
		const pal = PALETTES[props.colorPalette || 'custom'] || {};
		const trendPal = TREND_PALETTES[props.trendPalette || 'custom'] || {};
		
		// Helper function to pick color from UI or palette
		function pickFromUiOrPalette(key, fallback) { 
			// If custom value exists, use it first
			if ((props && props[key]) != null && props[key] !== '') return props[key];
			// Then use palette value
			if (props.colorPalette !== 'custom' && pal[key] != null) return pal[key];
			// Finally fallback
			return fallback != null ? fallback : undefined;
		}
		
		// Helper function to pick trend color from UI or palette
		function pickTrendFromUiOrPalette(key, fallback) { 
			// If custom value exists, use it first (regardless of palette selection)
			if ((props && props[key]) != null && props[key] !== '') return props[key];
			// Then use trend palette (only if not custom)
			if (props.trendPalette !== 'custom' && trendPal[key] != null) return trendPal[key];
			// Then use main palette (only if not custom)
			if (props.colorPalette !== 'custom' && pal[key] != null) return pal[key];
			// Finally fallback
			return fallback != null ? fallback : undefined;
		}
		
		return {
			backgroundColor: pickFromUiOrPalette('backgroundColor', CONSTANTS.DEFAULT_BACKGROUND_COLOR),
			titleColor: pickFromUiOrPalette('titleColor', CONSTANTS.DEFAULT_TITLE_COLOR),
			valueColor: pickFromUiOrPalette('valueColor', CONSTANTS.DEFAULT_VALUE_COLOR),
			labelColor: pickFromUiOrPalette('labelColor', CONSTANTS.DEFAULT_LABEL_COLOR),
			measureLabelColor: pickFromUiOrPalette('measureLabelColor', CONSTANTS.DEFAULT_MEASURE_LABEL_COLOR),
			lineColor: pickTrendFromUiOrPalette('lineColor', CONSTANTS.DEFAULT_LINE_COLOR),
			areaColor: pickTrendFromUiOrPalette('areaColor', pickTrendFromUiOrPalette('lineColor', CONSTANTS.DEFAULT_AREA_COLOR)),
			borderColor: pickFromUiOrPalette('borderColor', CONSTANTS.DEFAULT_BORDER_COLOR)
		};
	}

	var properties = {
		type: 'items', component: 'accordion', items: {
			data: { uses: 'data', items: { dimensions: { min: 1, max: 1 }, measures: { min: 1, max: 1 } } },
			sorting: { uses: 'sorting' },
			appearance: { uses: 'settings', items: {
				// KPI Section
				kpiSection: { type: 'items', label: 'KPI', items: {
					title: { ref: 'props.title', label: 'Title', type: 'string', defaultValue: '' },
					measureLabel: { ref: 'props.measureLabel', label: 'Measure Label', type: 'string', defaultValue: '' },
					measureLabelPos: { ref: 'props.measureLabelPos', label: 'Measure Label Position', type: 'string', component: 'dropdown', options: [ { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' } ], defaultValue: 'bottom' },
					measureLabelGap: { ref: 'props.measureLabelGap', label: 'Label Gap (px)', type: 'number', defaultValue: 4 },
					align: { ref: 'props.align', label: 'Alignment', type: 'string', component: 'dropdown', options: [ { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' } ], defaultValue: 'left' },
					kpiAgg: { ref: 'props.kpiAgg', label: 'KPI Aggregation', type: 'string', component: 'dropdown', options: [ { value: 'last', label: 'Last' }, { value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' } ], defaultValue: 'last' },
					kpiScope: { ref: 'props.kpiScope', label: 'KPI Scope', type: 'string', component: 'dropdown', options: [ { value: 'full', label: 'Full data' }, { value: 'window', label: 'Trend window' } ], defaultValue: 'full' }
				} },
				// Fonts Section
				fontsSection: { type: 'items', label: 'Fonts', items: {
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
				colorsSection: { type: 'items', label: 'Colors', items: {
					colorPalette: { ref: 'props.colorPalette', label: 'Color Palette', type: 'string', component: 'dropdown', options: [ { value: 'custom', label: 'Custom' }, { value: 'slate', label: 'Slate' }, { value: 'ocean', label: 'Ocean' }, { value: 'sunset', label: 'Sunset' }, { value: 'emerald', label: 'Emerald' }, { value: 'violet', label: 'Violet' } ], defaultValue: 'custom' },
					valueColor: { ref: 'props.valueColor', label: 'Value Color', type: 'string', defaultValue: '#111111' },
					titleColor: { ref: 'props.titleColor', label: 'Title Color', type: 'string', defaultValue: '#111111' },
					dateLabelColor: { ref: 'props.labelColor', label: 'Date Label Color', type: 'string', defaultValue: '#555555' },
					measureLabelColor: { ref: 'props.measureLabelColor', label: 'Measure Label Color', type: 'string', defaultValue: '#666666' },
					backgroundColor: { ref: 'props.backgroundColor', label: 'Background', type: 'string', defaultValue: 'transparent' },
					borderColor: { ref: 'props.borderColor', label: 'Border Color', type: 'string', defaultValue: 'transparent' },
					valuePrefix: { ref: 'props.valuePrefix', label: 'Value Prefix', type: 'string', component: 'dropdown', options: [ { value: '', label: 'None' }, { value: '₺', label: 'Turkish Lira (₺)' }, { value: '$', label: 'Dollar ($)' }, { value: '€', label: 'Euro (€)' }, { value: '£', label: 'Pound (£)' }, { value: '¥', label: 'Yen (¥)' }, { value: '₹', label: 'Rupee (₹)' }, { value: 'custom', label: 'Custom...' } ], defaultValue: '' },
					valuePrefixCustom: { ref: 'props.valuePrefixCustom', label: 'Custom Prefix', type: 'string', component: 'text', defaultValue: '', show: function(layout) { return layout.props.valuePrefix === 'custom'; } },
					valueSuffix: { ref: 'props.valueSuffix', label: 'Value Suffix', type: 'string', component: 'dropdown', options: [ { value: '', label: 'None' }, { value: '%', label: 'Percent (%)' }, { value: 'K', label: 'Thousands (K)' }, { value: 'M', label: 'Millions (M)' }, { value: 'B', label: 'Billions (B)' }, { value: 'custom', label: 'Custom...' } ], defaultValue: '' },
					valueSuffixCustom: { ref: 'props.valueSuffixCustom', label: 'Custom Suffix', type: 'string', component: 'text', defaultValue: '', show: function(layout) { return layout.props.valueSuffix === 'custom'; } }
				} },
				// Layout Section
				layoutSection: { type: 'items', label: 'Layout', items: {
					borderWidth: { ref: 'props.borderWidth', label: 'Border Width (px)', type: 'number', defaultValue: 0 },
					borderRadius: { ref: 'props.borderRadius', label: 'Border Radius (px)', type: 'number', defaultValue: 0 },
					padding: { ref: 'props.padding', label: 'Padding (px)', type: 'number', defaultValue: 8 },
					headerGapPx: { ref: 'props.headerGapPx', label: 'Header Gap (px)', type: 'number', defaultValue: 2 }
				} },
				// Responsive Layout Section
				responsiveLayoutSection: { type: 'items', label: 'Responsive Layout', items: {
					kpiSectionHeight: { ref: 'props.kpiSectionHeight', label: 'KPI Section Height (%)', type: 'number', defaultValue: 60, min: 20, max: 80 },
					trendSectionHeight: { ref: 'props.trendSectionHeight', label: 'Trend Section Height (%)', type: 'number', defaultValue: 40, min: 20, max: 80 },
					sectionGap: { ref: 'props.sectionGap', label: 'Section Gap (vh)', type: 'number', defaultValue: 1, min: 0, max: 5 }
				} },
				// Delta Section
				deltaSection: { type: 'items', label: 'Delta Change', items: {
					showDelta: { ref: 'props.showDelta', label: 'Show Delta vs Previous', type: 'boolean', defaultValue: true },
					deltaMode: { ref: 'props.deltaMode', label: 'Delta Mode', type: 'string', component: 'dropdown', options: [ { value: 'points', label: 'Previous N points (offset supported)' } ], defaultValue: 'points' },
					deltaPoints: { ref: 'props.deltaPoints', label: 'Window Size N (points)', type: 'number', defaultValue: 1 },
					deltaOffset: { ref: 'props.deltaOffset', label: 'Compare Offset (in windows)', type: 'number', defaultValue: 1 },
					deltaAgg: { ref: 'props.deltaAgg', label: 'Delta Aggregation', type: 'string', component: 'dropdown', options: [ { value: 'last', label: 'Last' }, { value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Average' } ], defaultValue: 'last' },
					deltaDecimals: { ref: 'props.deltaDecimals', label: 'Delta Decimals', type: 'number', defaultValue: 1 },
					deltaFontSize: { ref: 'props.deltaFontSize', label: 'Delta Font Size (px)', type: 'number', defaultValue: 0 },
					deltaFontFamily: { ref: 'props.deltaFontFamily', label: 'Delta Font Family', type: 'string', defaultValue: 'Open Sans' },
					deltaUpColor: { ref: 'props.deltaUpColor', label: 'Delta Up Color', type: 'string', defaultValue: '#16a34a' },
					deltaDownColor: { ref: 'props.deltaDownColor', label: 'Delta Down Color', type: 'string', defaultValue: '#dc2626' },
					deltaNeutralColor: { ref: 'props.deltaNeutralColor', label: 'Delta Neutral Color', type: 'string', defaultValue: '#9ca3af' },
					deltaGap: { ref: 'props.deltaGap', label: 'Gap between Value and Delta (px)', type: 'number', defaultValue: 6 }
				} },
				// Trend Section
				trendSection: { type: 'items', label: 'Trend', items: {
					trendPosition: { ref: 'props.trendPosition', label: 'Trend Position', type: 'string', component: 'dropdown', options: [ { value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' } ], defaultValue: 'bottom' },
					trendHeight: { ref: 'props.trendHeight', label: 'Trend Height (px) - Auto responsive if 0', type: 'number', defaultValue: 0, show: function(layout) { return false; } },
					trendTopMarginPx: { ref: 'props.trendTopMarginPx', label: 'Trend Top Margin (px) - Auto responsive if 0', type: 'number', defaultValue: 0, show: function(layout) { return false; } },
					trendMode: { ref: 'props.trendMode', label: 'Trend Mode', type: 'string', component: 'dropdown', options: [ { value: 'line', label: 'Line' }, { value: 'area', label: 'Area' } ], defaultValue: 'line' },
					trendCorners: { ref: 'props.trendCorners', label: 'Trend Corner Style', type: 'string', component: 'dropdown', options: [ { value: 'sharp', label: 'Sharp' }, { value: 'smooth', label: 'Smooth' } ], defaultValue: 'sharp' },
					trendPalette: { ref: 'props.trendPalette', label: 'Trend Palette', type: 'string', component: 'dropdown', options: [ { value: 'custom', label: 'Custom' }, { value: 'blue', label: 'Blue' }, { value: 'purple', label: 'Purple' }, { value: 'green', label: 'Green' }, { value: 'orange', label: 'Orange' }, { value: 'red', label: 'Red' } ], defaultValue: 'custom' },
					lineColor: { ref: 'props.lineColor', label: 'Trend Line Color', type: 'string', defaultValue: '#3f51b5' },
					lineWidth: { ref: 'props.lineWidth', label: 'Trend Line Width', type: 'number', defaultValue: 1.5 },
					areaColor: { ref: 'props.areaColor', label: 'Area Fill Color', type: 'string', defaultValue: '#3f51b5' },
					areaOpacity: { ref: 'props.areaOpacity', label: 'Area Opacity (0-1)', type: 'number', defaultValue: 0.2 },
					areaGradient: { ref: 'props.areaGradient', label: 'Area Gradient Fill', type: 'boolean', defaultValue: false },
					areaGradientType: { ref: 'props.areaGradientType', label: 'Gradient Type', type: 'string', component: 'dropdown', options: [ { value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' } ], defaultValue: 'vertical', show: function(d){ return d.props && d.props.areaGradient; } },
					areaGradStartColor: { ref: 'props.areaGradStartColor', label: 'Gradient Start Color', type: 'string', defaultValue: '#3f51b5', show: function(d){ return d.props && d.props.areaGradient; } },
					areaGradEndColor: { ref: 'props.areaGradEndColor', label: 'Gradient End Color', type: 'string', defaultValue: '#3f51b5', show: function(d){ return d.props && d.props.areaGradient; } },
					areaGradStartOpacity: { ref: 'props.areaGradStartOpacity', label: 'Gradient Start Opacity', type: 'number', defaultValue: 0.2, show: function(d){ return d.props && d.props.areaGradient; } },
					areaGradEndOpacity: { ref: 'props.areaGradEndOpacity', label: 'Gradient End Opacity', type: 'number', defaultValue: 0, show: function(d){ return d.props && d.props.areaGradient; } },
					trendWindowMode: { ref: 'props.trendWindowMode', label: 'Trend Window', type: 'string', component: 'dropdown', options: [ { value: 'all', label: 'All data' }, { value: 'lastNPoints', label: 'Last N points' }, { value: 'lastNDays', label: 'Last N days' } ], defaultValue: 'all' },
					trendWindowPoints: { ref: 'props.trendWindowPoints', label: 'N (points)', type: 'number', defaultValue: 60, show: function (d) { return d.props && d.props.trendWindowMode === 'lastNPoints'; } },
					trendWindowDays: { ref: 'props.trendWindowDays', label: 'N (days)', type: 'number', defaultValue: 180, show: function (d) { return d.props && d.props.trendWindowMode === 'lastNDays'; } }
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
				// Quick Buttons Section
				quickButtonsSection: { type: 'items', label: 'Quick Trend Buttons', items: {
					showQuickButtons: { ref: 'props.showQuickButtons', label: 'Show Quick Trend Buttons', type: 'boolean', defaultValue: true },
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
				} }
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
		if (!layout.props.showQuickButtons) return;
		
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
		
		if (!isResponsive) {
			return {
				titleFontSize: (layout.props.titleFontSize || 12) + 'px',
				valueFontSize: (layout.props.valueFontSize || 28) + 'px',
				deltaFontSize: (layout.props.deltaFontSize || 16) + 'px',
				measureLabelFontSize: (layout.props.measureLabelSize || 11) + 'px',
				labelFontSize: (layout.props.labelFontSize || 10) + 'px'
			};
		}
		
		// Responsive calculations using container dimensions
		const titleEm = Math.max(
			CONSTANTS.RESPONSIVE_TITLE_MIN_EM,
			Math.min(
				CONSTANTS.RESPONSIVE_TITLE_MAX_EM,
				(containerWidth * 0.0008) + (containerHeight * 0.0005) + 0.6
			)
		);
		
		const valueEm = Math.max(
			CONSTANTS.RESPONSIVE_VALUE_MIN_EM,
			Math.min(
				CONSTANTS.RESPONSIVE_VALUE_MAX_EM,
				(containerWidth * 0.0025) + (containerHeight * 0.002) + 1.0
			)
		);
		
		const deltaEm = Math.max(
			CONSTANTS.RESPONSIVE_DELTA_MIN_EM,
			Math.min(
				CONSTANTS.RESPONSIVE_DELTA_MAX_EM,
				(containerWidth * 0.0015) + (containerHeight * 0.0012) + 0.8
			)
		);
		
		const measureLabelEm = Math.max(
			CONSTANTS.RESPONSIVE_MEASURE_LABEL_MIN_EM,
			Math.min(
				CONSTANTS.RESPONSIVE_MEASURE_LABEL_MAX_EM,
				(containerWidth * 0.0011) + (containerHeight * 0.0006) + 0.6
			)
		);
		
		const labelEm = Math.max(
			CONSTANTS.RESPONSIVE_LABEL_MIN_EM,
			Math.min(
				CONSTANTS.RESPONSIVE_LABEL_MAX_EM,
				(containerWidth * 0.0006) + (containerHeight * 0.0004) + 0.5
			)
		);
		
		return {
			titleFontSize: titleEm + 'em',
			valueFontSize: valueEm + 'em',
			deltaFontSize: deltaEm + 'em',
			measureLabelFontSize: measureLabelEm + 'em',
			labelFontSize: labelEm + 'em'
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
		const elementId = $element.attr('id') || $element.data('qv-object') || 'default';
		setupTrendWindow(layout, elementId);
		
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
		const containerHeight = $element.height() || window.innerHeight;
		const containerWidth = $element.width() || window.innerWidth;
		const kpiSectionHeight = layout.props.kpiSectionHeight || CONSTANTS.DEFAULT_KPI_SECTION_HEIGHT;
		const trendSectionHeight = layout.props.trendSectionHeight || CONSTANTS.DEFAULT_TREND_SECTION_HEIGHT;
		
		const containerStyle = `position:relative;width:100%;height:100%;text-align:${alignCss};display:grid;grid-template-rows:${kpiSectionHeight}% ${trendSectionHeight}%;gap:0;align-items:stretch;`;
		const darkModeClass = layout.props.darkMode ? ' ' + CONSTANTS.DARK_MODE_CLASS : '';
		
		// Calculate responsive font sizes
		const fontSizes = calculateResponsiveFonts(layout, containerWidth, containerHeight);
		
		// Generate HTML content
		const titleHtml = generateTitleHtml(layout, colors, fontSizes);
		const valueHtml = generateValueHtml(layout, colors, fontSizes, currentVal, measInfo);
		const deltaHtml = generateDeltaHtml(layout, colors, fontSizes, fullRows);
		const measureLabelHtml = generateMeasureLabelHtml(layout, colors, fontSizes);
		const labelsHtml = generateLabelsHtml(layout, colors, fontSizes, startLabel, endLabel);
		const sparkHtml = generateSparklineHtml(layout, containerHeight, trendSectionHeight);
		const quickButtonsHtml = generateQuickButtonsHtml(layout, elementId);
		
		// Build final HTML
		const html = buildFinalHtml(
			darkModeClass, containerStyle, layout, colors,
			titleHtml, valueHtml, deltaHtml, measureLabelHtml,
			labelsHtml, sparkHtml, quickButtonsHtml
		);
		
		// Render to DOM
		$element.html(html);
		
		// Set up sparkline
		setupSparkline($element, dataPairs, layout, measInfo, colors);
		
		// Set up event handlers
		setupEventHandlers($element, layout, matrix);
		
		// Trigger animations
		triggerAnimations($element, layout, currentVal, measInfo);
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
		
		return `<div class="kpi-card__title" style="font-size:${fontSizes.titleFontSize};font-family:${layout.props.titleFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.titleColor};">${layout.props.title}</div>`;
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
		
		const displayValue = layout.props.animateValue ? '0' : formatNumber(currentVal, measInfo, layout);
		
		return `<div class="kpi-card__value" style="font-size:${fontSizes.valueFontSize};font-family:${layout.props.valueFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.valueColor};display:inline-block;${animationStyle}">${displayValue}</div>`;
	}

	/**
	 * Generates delta HTML
	 * @param {Object} layout - Layout configuration
	 * @param {Object} colors - Color configuration
	 * @param {Object} fontSizes - Font size configuration
	 * @param {Array} fullRows - Full rows data
	 * @returns {string} Delta HTML
	 */
	function generateDeltaHtml(layout, colors, fontSizes, fullRows) {
		if (!layout.props.showDelta) return '';
		
		const delta = computeDeltaFromRows(fullRows, layout.props.deltaPoints, layout.props.deltaAgg || 'last', layout.props.deltaOffset);
		if (!delta || delta.prev === 0) return '';
		
		const diff = delta.curr - delta.prev;
		const pct = (diff / Math.abs(delta.prev)) * 100;
		const sign = pct > 0 ? '▲' : (pct < 0 ? '▼' : '■');
		const col = pct > 0 ? layout.props.deltaUpColor : (pct < 0 ? layout.props.deltaDownColor : layout.props.deltaNeutralColor);
		const decimals = layout.props.deltaDecimals || CONSTANTS.DEFAULT_DELTA_DECIMALS;
		const factor = Math.pow(10, decimals);
		const pctStr = (Math.round(pct * factor) / factor).toFixed(decimals) + '%';
		
		// Set initial animation state if delta animation is enabled
		const animationStyle = layout.props.animateDelta ? 
			`opacity:0;transform:translateX(-10px);transition:opacity ${layout.props.deltaAnimDuration || CONSTANTS.DEFAULT_DELTA_ANIMATION_DURATION}ms ease,transform ${layout.props.deltaAnimDuration || CONSTANTS.DEFAULT_DELTA_ANIMATION_DURATION}ms ease;` : '';
		
		return `<div class="kpi-card__delta" style="display:inline-block;margin-left:${layout.props.deltaGap || CONSTANTS.DEFAULT_DELTA_GAP}px;color:${col};font-size:${fontSizes.deltaFontSize};font-family:${layout.props.deltaFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};${animationStyle}">${sign} ${pctStr}</div>`;
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
		if (!layout.props.showQuickButtons) return '';
		
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
		
		return `<div class="kpi-card__quick-buttons" style="position:absolute;top:8px;right:8px;z-index:10;display:flex;gap:4px;">` +
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
	 * @returns {string} Final HTML
	 */
	function buildFinalHtml(darkModeClass, containerStyle, layout, colors, titleHtml, valueHtml, deltaHtml, measureLabelHtml, labelsHtml, sparkHtml, quickButtonsHtml) {
		const padding = layout.props.padding || CONSTANTS.DEFAULT_PADDING;
		const borderWidth = layout.props.borderWidth || CONSTANTS.DEFAULT_BORDER_WIDTH;
		const borderRadius = layout.props.borderRadius || CONSTANTS.DEFAULT_BORDER_RADIUS;
		const alignCss = (layout.props.align === 'center') ? 'center' : (layout.props.align === 'right' ? 'right' : 'left');
		
		// Build value block with measure label positioning
		const valueWithDelta = `<div style="position:relative; z-index:1; display:inline-flex;align-items:baseline;">${valueHtml}${deltaHtml}</div>`;
		const headerGap = layout.props.headerGapPx || CONSTANTS.DEFAULT_HEADER_GAP;
		
		let valueBlock;
		switch (layout.props.measureLabelPos) {
			case 'top':
				valueBlock = `<div>${measureLabelHtml}<div style="height:${headerGap}px"></div>${valueWithDelta}</div>`;
				break;
			case 'left':
				valueBlock = `<div style="display:flex;align-items:baseline;gap:${headerGap}px;justify-content:${alignCss}">${measureLabelHtml}${valueWithDelta}</div>`;
				break;
			case 'right':
				valueBlock = `<div style="display:flex;align-items:baseline;gap:${headerGap}px;justify-content:${alignCss}">${valueWithDelta}${measureLabelHtml}</div>`;
				break;
			default:
				valueBlock = `<div>${valueWithDelta}<div style="height:${headerGap}px"></div>${measureLabelHtml}</div>`;
		}
		
		return `<div class="kpi-card${darkModeClass}" style="${containerStyle}">` +
			`<div class="kpi-card__kpi-section" style="position:relative;padding:${padding}px;background:${colors.backgroundColor};border:${borderWidth}px solid ${colors.borderColor};border-radius:${borderRadius}px;border-bottom:none;border-bottom-left-radius:0;border-bottom-right-radius:0;">${titleHtml}${valueBlock}${quickButtonsHtml}</div>` +
			`<div class="kpi-card__trend-section" style="position:relative;background:${colors.backgroundColor};border:${borderWidth}px solid ${colors.borderColor};border-radius:${borderRadius}px;border-top:none;border-top-left-radius:0;border-top-right-radius:0;">${sparkHtml}${labelsHtml}</div>` +
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
		const $sparklineHost = $element.find(`.${CONSTANTS.SPARKLINE_INNER_CLASS}`);
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
		// Resize listener for responsive updates
		$(window).off(`resize.${CONSTANTS.RESIZE_EVENT_NAMESPACE}`).on(`resize.${CONSTANTS.RESIZE_EVENT_NAMESPACE}`, () => {
			setTimeout(() => {
				renderCard($element, layout, matrix);
			}, CONSTANTS.RESIZE_DEBOUNCE_DELAY);
		});
		
		// Quick buttons event handlers
		if (layout.props.showQuickButtons) {
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
				animateCounter($valueElement[0], startValue, endValue, duration, formatFunction, measInfo, layout);
			}, CONSTANTS.ANIMATION_TRIGGER_DELAY);
		}
		
		// Delta animation
		if (layout.props.animateDelta && layout.props.showDelta) {
			setTimeout(() => {
				$element.find(`.${CONSTANTS.DELTA_CLASS}`).css({opacity: '1', transform: 'translateX(0)'});
			}, CONSTANTS.DELTA_ANIMATION_DELAY);
		}
	}

	return {
		initialProperties: { qHyperCubeDef: { qDimensions: [], qMeasures: [], qInterColumnSortOrder: [], qNoOfLeftDims: 1, qSuppressMissing: true, qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 2, qHeight: 1000 }] }, props: { showLabelDates: true, align: 'left', fontMode: 'static', valueFontSize: 28, valueFontFamily: 'Open Sans', titleFontSize: 12, titleFontFamily: 'Open Sans', deltaFontSize: 16, deltaFontFamily: 'Open Sans', labelFontSize: 10, labelFontFamily: 'Open Sans', measureLabelSize: 11, measureLabelFontFamily: 'Open Sans', measureLabelPos: 'bottom', measureLabelGap: 4, valueColor: '#111111', titleColor: '#111111', labelColor: '#555555', measureLabelColor: '#666666', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, borderRadius: 0, padding: 8, kpiSectionHeight: 60, trendSectionHeight: 40, sectionGap: 1, showDelta: true, deltaMode: 'points', deltaPoints: 1, deltaOffset: 1, deltaAgg: 'last', deltaDecimals: 1, deltaUpColor: '#16a34a', deltaDownColor: '#dc2626', deltaNeutralColor: '#9ca3af', deltaGap: 6, trendPosition: 'bottom', trendHeight: 0, trendTopMarginPx: 0, pulseRadius: 1.8, pulseMinColor: '#dc2626', pulseMaxColor: '#16a34a', showGlow: false, glowColor: '#ffffff', glowStdDev: 2, animateDraw: true, animDurationMs: 600, animatePulse: true, pulseAnimDelay: 300, animateArea: false, areaAnimDuration: 800, animateValue: true, valueAnimDuration: 1000, animateDelta: false, deltaAnimDuration: 600, trendMode: 'line', trendCorners: 'sharp', trendPalette: 'custom', lineColor: '#3f51b5', lineWidth: 1.5, areaColor: '#3f51b5', areaOpacity: 0.2, labelMaxWidthPct: 45, endLabelOffsetPx: 8, startLabelRightPadPx: 6, kpiAgg: 'last', kpiScope: 'full', trendWindowMode: 'lastNPoints', trendWindowPoints: 60, trendWindowDays: 180, colorPalette: 'custom', showTooltip: true, showMinMax: true, labelsGapPx: 2, areaGradient: false, areaGradientType: 'vertical', areaGradStartColor: '#3f51b5', areaGradEndColor: '#3f51b5', areaGradStartOpacity: 0.2, areaGradEndOpacity: 0, showQuickButtons: true, button1Value: 12, button1Label: '12P', button2Value: 60, button2Label: '60P', button3Value: 365, button3Label: '1Y', buttonStyle: 'rounded', buttonBackgroundColor: 'rgba(255,255,255,0.1)', buttonLabelColor: '', buttonActiveColor: '#3b82f6', buttonActiveLabelColor: '#ffffff', defaultButton: 'button2', currentSelectedButton: 'button2', valuePrefix: '', valuePrefixCustom: '', valueSuffix: '', valueSuffixCustom: '', hoverValueScale: true, hoverLineThickness: true, hoverLineThicknessMultiplier: 1.5, darkMode: false } },
		definition: properties,
		support: { snapshot: true, export: true, exportData: true },
		paint: function ($element, layout) {
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
