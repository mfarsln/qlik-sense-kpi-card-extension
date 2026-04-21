/**
 * KPI Card Extension - Controller
 * Data processing, renderCard orchestration, event handlers, init.
 */
define(['qlik', 'jquery', './constants', './themes', './formatters', './chart', './renderer', './properties'],
function (qlik, $, constantsModule, themesModule, formatters, chart, renderer, propertiesModule) {
	'use strict';

	var CONSTANTS             = constantsModule.CONSTANTS;

	// Themes
	var getEffectiveColors    = themesModule.getEffectiveColors;

	// Formatters
	var getSelectedButton     = formatters.getSelectedButton;
	var saveSelectedButton    = formatters.saveSelectedButton;
	var formatDate            = formatters.formatDate;
	var hexToRgba             = formatters.hexToRgba;
	var formatWithCustomSettings = formatters.formatWithCustomSettings;
	var formatNumber          = formatters.formatNumber;
	var serializePresetProps  = formatters.serializePresetProps;
	var parsePresetText       = formatters.parsePresetText;
	var applyPresetToProps    = formatters.applyPresetToProps;

	// Chart
	var filterByWindow        = chart.filterByWindow;
	var computeAggregate      = chart.computeAggregate;
	var buildSparkline        = chart.buildSparkline;
	var animateCounter        = chart.animateCounter;

	// Renderer
	var generateIconHtml         = renderer.generateIconHtml;
	var getConditionalBackground  = renderer.getConditionalBackground;
	var checkIfSelected           = renderer.checkIfSelected;
	var getSelectedIndicatorStyle = renderer.getSelectedIndicatorStyle;
	var generateStatusBadgeHtml  = renderer.generateStatusBadgeHtml;
	var generateTitleHtml         = renderer.generateTitleHtml;
	var generateValueHtml         = renderer.generateValueHtml;
	var generateDeltaHtml         = renderer.generateDeltaHtml;
	var generateSecondaryKpiHtml  = renderer.generateSecondaryKpiHtml;
	var generateMeasureLabelHtml  = renderer.generateMeasureLabelHtml;
	var generateLabelsHtml        = renderer.generateLabelsHtml;
	var generateSparklineHtml     = renderer.generateSparklineHtml;
	var generateQuickButtonsHtml  = renderer.generateQuickButtonsHtml;
	var buildFinalHtml            = renderer.buildFinalHtml;

	// ── Controller Code ───────────────────────────────────────────────────────
	// Cache for field and variable lists - will be populated in paint
	var fieldListCache = [];
	var variableListCache = [];
	var properties = propertiesModule.definition;
	var responsiveObserverMap = {};
	var responsiveObserverState = {};

	// Initialization state tracking for robust extension loading
	var extensionInitialized = false;
	var initializationPromise = null;
	var initializationAttempts = 0;
	var MAX_INIT_ATTEMPTS = 3;
	var INIT_RETRY_DELAY = 500;
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

	/**
	 * Gets adaptive minimum trend height based on container size
	 * Allows trend to scale down on smaller screens (tablet/mobile)
	 * @param {number} containerHeight - Total container height in pixels
	 * @returns {number} Appropriate minimum height for the trend section
	 */
	function getAdaptiveMinTrendHeight(containerHeight) {
		if (containerHeight < CONSTANTS.MOBILE_BREAKPOINT_HEIGHT) {
			return CONSTANTS.MIN_CONTAINER_HEIGHT_MOBILE;
		}
		if (containerHeight < CONSTANTS.TABLET_BREAKPOINT_HEIGHT) {
			return CONSTANTS.MIN_CONTAINER_HEIGHT_TABLET;
		}
		return CONSTANTS.MIN_CONTAINER_HEIGHT;
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
		const rows = matrix.map(row => {
			const obj = {
				dateText: row[0].qText,
				dateNum: row[0].qNum,
				valNum: row[1].qNum,
				valText: row[1].qText || ''
			};
			// Include second measure value if present
			if (row.length > 2 && row[2]) {
				obj.val2Num = row[2].qNum;
				obj.val2Text = row[2].qText || '';
			}
			return obj;
		});

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
		const kpiAgg = layout.props.kpiAgg || 'last';
		const currentVal = computeAggregate(kpiPairs, kpiAgg);
		// For 'last' aggregation, use Qlik's pre-formatted text (qText) for perfect formatting
		const primaryFormattedText = (kpiAgg === 'last' && aggRowsForKpi.length > 0) ? aggRowsForKpi[aggRowsForKpi.length - 1].valText : null;
		
		// Calculate labels and styling
		const startLabel = dataPairs.length ? formatDate(dataPairs[0][0]) : '';
		const endLabel = dataPairs.length ? formatDate(dataPairs[dataPairs.length - 1][0]) : '';
		const colors = getEffectiveColors(layout.props);
		const alignCss = (layout.props.align === 'center') ? 'center' : 
			(layout.props.align === 'right' ? 'right' : 'left');
		
		// Container dimensions and styling
		const elementNode = $element && $element[0];
		const elementId = (layout && layout.qInfo && layout.qInfo.qId) || (elementNode && elementNode.getAttribute && elementNode.getAttribute('data-qv-object')) || (elementNode && elementNode.id) || 'kpi-card-default';
		let containerWidth = $element.width() || Math.min(window.innerWidth, 600);
		let containerHeight = $element.height() || Math.min(window.innerHeight, 300);
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
		const trendSectionHeight = showTrend ? (layout.props.trendSectionHeight || CONSTANTS.DEFAULT_TREND_SECTION_HEIGHT) : 0;

		// Single section layout - no grid needed, trend is absolutely positioned
		const containerStyle = '';
		const darkModeClass = layout.props.darkMode ? ' ' + CONSTANTS.DARK_MODE_CLASS : '';
		
		// Calculate responsive font sizes
		const fontSizes = calculateResponsiveFonts(layout, containerWidth, containerHeight);
		
		// Generate HTML content
		const backgroundOverride = getConditionalBackground(layout, currentVal);
		const titleHtml = generateTitleHtml(layout, colors, fontSizes);

		// Custom format settings from layout.props
		const kpi1Fmt = {
			type: layout.props.kpi1FormatType || 'auto',
			decimals: layout.props.kpi1FormatDecimals !== undefined ? layout.props.kpi1FormatDecimals : 2,
			useThousandSep: layout.props.kpi1FormatUseThousandSep !== false,
			prefix: layout.props.kpi1FormatPrefix || '',
			suffix: layout.props.kpi1FormatSuffix || ''
		};
		const kpi2Fmt = {
			type: layout.props.kpi2FormatType || 'auto',
			decimals: layout.props.kpi2FormatDecimals !== undefined ? layout.props.kpi2FormatDecimals : 2,
			useThousandSep: layout.props.kpi2FormatUseThousandSep !== false,
			prefix: layout.props.kpi2FormatPrefix || '',
			suffix: layout.props.kpi2FormatSuffix || ''
		};

		// Format primary KPI value using custom settings
		const kpi1Formatted = formatWithCustomSettings(currentVal, kpi1Fmt, measInfo);
		const valueHtml = generateValueHtml(layout, colors, fontSizes, currentVal, measInfo, kpi1Formatted);
		const deltaData = computeDeltaFromRows(fullRows, layout.props.deltaPoints, layout.props.deltaAgg || 'last', layout.props.deltaOffset);
		const deltaHtml = generateDeltaHtml(layout, colors, fontSizes, fullRows, measInfo, deltaData, kpi1Fmt);
		// Secondary KPI: use second measure from Data>Measures if available
		const hasSecondMeasure = layout.qHyperCube.qMeasureInfo.length > 1;
		const secondaryMeasInfo = hasSecondMeasure ? layout.qHyperCube.qMeasureInfo[1] : null;
		let secondaryValue = null;
		let secondaryFormattedText = null;
		if (hasSecondMeasure && fullRows.length > 0) {
			const sec2Pairs = aggRowsForKpi.filter(r => r.val2Num !== undefined).map(r => [r.dateText, r.val2Num]);
			secondaryValue = sec2Pairs.length > 0 ? computeAggregate(sec2Pairs, kpiAgg) : null;
			if (kpiAgg === 'last' && aggRowsForKpi.length > 0) {
				const lastRow = aggRowsForKpi[aggRowsForKpi.length - 1];
				if (lastRow.val2Text) secondaryFormattedText = lastRow.val2Text;
			}
		}
		// Format secondary KPI value using custom settings
		const kpi2FormattedFinal = formatWithCustomSettings(secondaryValue, kpi2Fmt, secondaryMeasInfo);
		const secondaryHtml = generateSecondaryKpiHtml(layout, colors, fontSizes, secondaryValue, secondaryMeasInfo, kpi2FormattedFinal);
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
		triggerAnimations($element, layout, currentVal, measInfo, kpi1Fmt);
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
			showBarMinMax: layout.props.showBarMinMax !== false,
			minColor: CONSTANTS.DEFAULT_PULSE_MIN_COLOR,
			maxColor: CONSTANTS.DEFAULT_PULSE_MAX_COLOR,
			topPadPx: 8,
			bottomPadPx: 0,
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
			// Forecast options
			showForecast: layout.props.showForecast,
			forecastPeriods: layout.props.forecastPeriods,
			forecastMethod: layout.props.forecastMethod,
			forecastMovingAvgPeriods: layout.props.forecastMovingAvgPeriods,
			forecastLineStyle: layout.props.forecastLineStyle,
			forecastUseThemeColor: layout.props.forecastUseThemeColor,
			forecastColor: layout.props.forecastColor,
			forecastOpacity: layout.props.forecastOpacity,
			showConfidenceInterval: layout.props.showConfidenceInterval,
			confidenceLevel: layout.props.confidenceLevel,
			barGradient: layout.props.barGradient,
			barGradientStart: (layout.props.barGradient && layout.props.barGradientAuto !== false)
				? colors.lineColor
				: (layout.props.barGradientStart || colors.lineColor),
			barGradientEnd: (layout.props.barGradient && layout.props.barGradientAuto !== false)
				? hexToRgba(colors.lineColor, 0.35)
				: (layout.props.barGradientEnd || colors.lineColor),
			formatValue: function(v) { return formatNumber(v, measInfo); }
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
			// IMPORTANT: Use the same elementId format as renderCard/generateQuickButtonsHtml for session storage consistency
			const elementId = (layout && layout.qInfo && layout.qInfo.qId) || $element.attr('id') || $element.data('qv-object') || 'default';
			
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
						$bar.removeClass('active').css({
							height: '0',
							opacity: '0',
							boxShadow: 'none',
							background: 'transparent',
							left: '0',
							right: '0',
							width: 'auto',
							transform: 'none'
						});
					}
					
					if (selected) {
						$card.addClass('kpi-card--selected');
						const indicatorType = layout.props.selectedIndicator || 'tapered-bar';
						const selectedColor = layout.props.selectedColor || '#3b82f6';
						
						if (indicatorType === 'tapered-bar') {
							if ($bar && $bar.length) {
								// Modern elegant selection bar with gradient and soft glow - centered at bottom
								$bar.addClass('active').css({
									height: '3px',
									opacity: '1',
									background: `linear-gradient(90deg, transparent 0%, ${selectedColor}66 20%, ${selectedColor} 50%, ${selectedColor}66 80%, transparent 100%)`,
									boxShadow: `0 0 12px 2px ${selectedColor}88, 0 0 24px 4px ${selectedColor}44, 0 -2px 8px 0 ${selectedColor}`,
									left: '50%',
									right: 'auto',
									transform: 'translateX(-50%)',
									width: '50%',
									borderRadius: '2px 2px 0 0'
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
		
		// Check for required dimensions and measures (1 dim + 1-2 measures)
		const hc = layout.qHyperCube;
		if (!hc.qSize || hc.qSize.qcx < 2) {
			return { isValid: false, error: 'Add 1 date dimension and at least 1 measure' };
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
	function triggerAnimations($element, layout, currentVal, measInfo, kpi1Fmt) {
		// Value animation
		if (layout.props.animateValue) {
			setTimeout(() => {
				const $valueElement = $element.find(`.${CONSTANTS.VALUE_CLASS}`);
				$valueElement.css({opacity: '1', transform: 'scale(1)'});

				const startValue = 0;
				const endValue = currentVal;
				const duration = layout.props.valueAnimDuration || CONSTANTS.DEFAULT_VALUE_ANIMATION_DURATION;

				const formatFunction = (value) => formatWithCustomSettings(value, kpi1Fmt, measInfo);
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

	/**
	 * Helper function to update property options
	 */
	function updatePropertyOptions(propertyName, options) {
		try {
			if (properties && properties.items && properties.items.appearance && properties.items.appearance.items) {
				const interactionSection = properties.items.appearance.items.interactionSection;
				if (interactionSection && interactionSection.items && interactionSection.items[propertyName]) {
					interactionSection.items[propertyName].options = options.slice();
				}
			}
		} catch (e) {
			console.warn('KPI Card: Error updating property options:', e);
		}
	}

	/**
	 * Initializes the extension by loading field and variable lists
	 * Returns a promise that resolves when initialization is complete
	 * Includes retry logic for handling race conditions on first load
	 */
	function initializeExtension() {
		// Return existing promise if initialization is in progress
		if (initializationPromise) {
			return initializationPromise;
		}

		var PromiseImpl = (typeof qlik !== 'undefined' && qlik && qlik.Promise) || Promise;

		initializationPromise = new PromiseImpl(function(resolve) {
			function attemptInitialization() {
				initializationAttempts++;

				// Check if qlik is available
				if (typeof qlik === 'undefined' || !qlik) {
					console.warn('KPI Card: qlik object not available (attempt ' + initializationAttempts + '/' + MAX_INIT_ATTEMPTS + ')');
					if (initializationAttempts < MAX_INIT_ATTEMPTS) {
						setTimeout(attemptInitialization, INIT_RETRY_DELAY);
						return;
					}
					resolve({ success: false, error: 'qlik not available' });
					return;
				}

				// Check if currApp is available and callable
				if (!qlik.currApp || typeof qlik.currApp !== 'function') {
					console.warn('KPI Card: qlik.currApp not available (attempt ' + initializationAttempts + '/' + MAX_INIT_ATTEMPTS + ')');
					if (initializationAttempts < MAX_INIT_ATTEMPTS) {
						setTimeout(attemptInitialization, INIT_RETRY_DELAY);
						return;
					}
					resolve({ success: false, error: 'qlik.currApp not available' });
					return;
				}

				var app;
				try {
					app = qlik.currApp();
				} catch (e) {
					console.warn('KPI Card: Error calling qlik.currApp() (attempt ' + initializationAttempts + '/' + MAX_INIT_ATTEMPTS + '):', e);
					if (initializationAttempts < MAX_INIT_ATTEMPTS) {
						setTimeout(attemptInitialization, INIT_RETRY_DELAY);
						return;
					}
					resolve({ success: false, error: 'qlik.currApp() threw error' });
					return;
				}

				if (!app) {
					console.warn('KPI Card: qlik.currApp() returned null/undefined (attempt ' + initializationAttempts + '/' + MAX_INIT_ATTEMPTS + ')');
					if (initializationAttempts < MAX_INIT_ATTEMPTS) {
						setTimeout(attemptInitialization, INIT_RETRY_DELAY);
						return;
					}
					resolve({ success: false, error: 'app is null' });
					return;
				}

				// Load both field and variable lists
				var promises = [];

				// Load field list
				if (app.getList) {
					var fieldPromise = app.getList('FieldList')
						.then(function(list) {
							if (list && list.qFieldList && list.qFieldList.qItems) {
								fieldListCache = list.qFieldList.qItems.map(function(item) {
									return { value: item.qName, label: item.qName };
								});
								updatePropertyOptions('selectFieldName', fieldListCache);
							}
						})
						.catch(function(err) {
							console.warn('KPI Card: Error loading field list:', err);
						});
					promises.push(fieldPromise);

					// Load variable list
					var varPromise = app.getList('VariableList')
						.then(function(model) {
							var varItems = extractVariableItems(model);
							if (varItems && varItems.length > 0) {
								variableListCache = varItems.map(function(v) {
									return { value: v.qName, label: v.qName };
								});
								updatePropertyOptions('variableName', variableListCache);
							}
						})
						.catch(function(err) {
							console.warn('KPI Card: Error loading variable list:', err);
							// Try fallback method
							if (app.variable && app.variable.getAll) {
								return app.variable.getAll()
									.then(function(vars) {
										var varItems = extractVariableItems(vars);
										if (varItems && varItems.length > 0) {
											variableListCache = varItems.map(function(v) {
												return { value: v.qName, label: v.qName };
											});
											updatePropertyOptions('variableName', variableListCache);
										}
									})
									.catch(function(err2) {
										console.warn('KPI Card: Fallback variable loading also failed:', err2);
									});
							}
						});
					promises.push(varPromise);
				}

				// Wait for all lists to load
				PromiseImpl.all(promises)
					.then(function() {
						extensionInitialized = true;
						resolve({ success: true });
					})
					.catch(function(err) {
						console.warn('KPI Card: Initialization error:', err);
						resolve({ success: false, error: err });
					});
			}

			attemptInitialization();
		});

		return initializationPromise;
	}

	// Keep backward compatibility - updateFieldAndVariableLists now calls initializeExtension
	function updateFieldAndVariableLists() {
		initializeExtension();
	}
	// ── Paint / Resize entry points ──────────────────────────────────────────
	function paintExtension(self, $element, layout) {
		var PromiseImpl = (qlik && qlik.Promise) || Promise;
		if (!extensionInitialized && !initializationPromise) { initializeExtension(); }
		try {
			var hc = layout && layout.qHyperCube;
			if (hc && hc.qSize && hc.qDataPages && hc.qDataPages[0] && hc.qDataPages[0].qMatrix) {
				var expectedCols = hc.qSize.qcx;
				var actualCols = hc.qDataPages[0].qMatrix[0] ? hc.qDataPages[0].qMatrix[0].length : 0;
				if (actualCols > 0 && actualCols < expectedCols && self.backendApi && self.backendApi.applyPatches) {
					self.backendApi.applyPatches([{ qOp: 'replace', qPath: '/qHyperCubeDef/qInitialDataFetch/0/qWidth', qValue: String(expectedCols) }], true);
					return PromiseImpl.resolve();
				}
			}
		} catch (e) { console.warn('KPI Card: qWidth patch skipped:', e); }
		var matrix = null;
		try {
			if (layout && layout.qHyperCube && layout.qHyperCube.qDataPages && layout.qHyperCube.qDataPages[0] && layout.qHyperCube.qDataPages[0].qMatrix) {
				matrix = layout.qHyperCube.qDataPages[0].qMatrix;
			}
		} catch (e) { console.warn('KPI Card: Error accessing matrix data:', e); }
		var validation = validateInputs(layout, matrix);
		if (!validation.isValid) {
			$element.html('<div class="' + CONSTANTS.EMPTY_CLASS + '">' + validation.error + '</div>');
			return PromiseImpl.resolve();
		}
		try {
			safeExecute(renderCard, [$element, layout, matrix], 'Paint');
		} catch (err) {
			console.error('KPI Card Paint Error:', err);
			$element.html('<div class="' + CONSTANTS.EMPTY_CLASS + '">Error rendering card</div>');
		}
		return PromiseImpl.resolve();
	}

	function resizeExtension(self, $element, layout) {
		var matrix = (layout && layout.qHyperCube && layout.qHyperCube.qDataPages && layout.qHyperCube.qDataPages[0]) ? layout.qHyperCube.qDataPages[0].qMatrix : null;
		var validation = validateInputs(layout, matrix);
		if (!validation.isValid) { return (qlik.Promise && qlik.Promise.resolve) ? qlik.Promise.resolve() : Promise.resolve(); }
		setTimeout(function() { safeExecute(renderCard, [$element, layout, matrix], 'Resize'); }, CONSTANTS.RESIZE_TIMEOUT);
		return (qlik.Promise && qlik.Promise.resolve) ? qlik.Promise.resolve() : Promise.resolve();
	}

	return {
		paintExtension: paintExtension,
		resizeExtension: resizeExtension,
		renderCard: renderCard,
		setupSparkline: setupSparkline,
		setupEventHandlers: setupEventHandlers,
		validateInputs: validateInputs,
		safeExecute: safeExecute,
		triggerAnimations: triggerAnimations,
		initializeExtension: initializeExtension,
		updateFieldAndVariableLists: updateFieldAndVariableLists,
		setupResponsiveObserver: setupResponsiveObserver,
		getAdaptiveMinTrendHeight: getAdaptiveMinTrendHeight,
		processMatrixData: processMatrixData,
		setupTrendWindow: setupTrendWindow,
		calculateResponsiveFonts: calculateResponsiveFonts,
		computeDeltaFromRows: computeDeltaFromRows
	};
});