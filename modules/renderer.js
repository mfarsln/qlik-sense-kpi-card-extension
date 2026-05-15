/**
 * KPI Card Extension - HTML Renderer
 * All HTML generation functions for KPI card components.
 * Depends on: constants, formatters (no jQuery needed here).
 */
define(['qlik', './constants', './formatters', './chart'], function (qlik, constantsModule, formatters, chart) {
	'use strict';

	var CONSTANTS        = constantsModule.CONSTANTS;
	var EMOJI_ICON_MAP   = constantsModule.EMOJI_ICON_MAP;
	var MODERN_ICON_MAP  = constantsModule.MODERN_ICON_MAP;
	var GRADIENT_PRESETS = constantsModule.GRADIENT_PRESETS;

	// Pull needed formatters
	var decodeCustomMarkup       = formatters.decodeCustomMarkup;
	var sanitizeSvgMarkup        = formatters.sanitizeSvgMarkup;
	var formatWithCustomSettings = formatters.formatWithCustomSettings;
	var formatNumber             = formatters.formatNumber;
	var formatShort              = formatters.formatShort;
	var formatDate               = formatters.formatDate;
	var hexToRgba                = formatters.hexToRgba;
	var getSelectedButton        = formatters.getSelectedButton;
	var getSelectedScopeButton   = formatters.getSelectedScopeButton;

	// ── HTML Generation Functions ─────────────────────────────────────────────

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
				// Outer shadows get clipped by Qlik's wrapper (overflow:hidden), so use a wide
				// inset for ambient interior glow. Large blur (60–110px) + low alpha keeps it
				// from reading as a gradient background — just a hint of "lit".
				return `box-shadow:inset 0 0 60px ${selectedColor}33, inset 0 0 110px ${selectedColor}1A !important;`;
			case 'side-accent':
				// Vertical accent bar on the left edge with a soft inward fade. Uses inset shadows
				// so the user's layout border (top/right/bottom) is preserved intact.
				return `box-shadow:inset 4px 0 0 0 ${selectedColor}, inset 10px 0 14px -6px ${selectedColor}66 !important;`;
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
		
		const delta = precomputedDelta;
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

		// Support for expression - extract string value
		let titleText = '';
		const titleProp = layout.props.title;
		if (typeof titleProp === 'string') {
			titleText = titleProp;
		} else if (titleProp && typeof titleProp === 'object' && titleProp.qText) {
			titleText = titleProp.qText;
		}
		if (!titleText) return '';

		const iconBefore = generateIconHtml(layout, 'before-title', colors);
		const iconAfter = generateIconHtml(layout, 'after-title', colors);
		const hasInlineIcon = !!(iconBefore || iconAfter);
		// Use flex+align-items:center when an inline icon is present to ensure
		// the icon and title text are vertically centred on the same baseline
		const titleStyle = hasInlineIcon
			? `display:flex;align-items:center;gap:4px;font-size:${fontSizes.titleFontSize};font-family:${layout.props.titleFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.titleColor};`
			: `font-size:${fontSizes.titleFontSize};font-family:${layout.props.titleFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.titleColor};`;
		const titleContent = `${iconBefore}<span>${titleText}</span>${iconAfter}`;

		return `<div class="kpi-card__title" style="${titleStyle}">${titleContent}</div>`;
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
	function generateValueHtml(layout, colors, fontSizes, currentVal, measInfo, preFormattedText) {
		const animationStyle = layout.props.animateValue ?
			`opacity:0;transform:scale(0.8);transition:opacity ${layout.props.valueAnimDuration || CONSTANTS.DEFAULT_VALUE_ANIMATION_DURATION}ms ease,transform ${layout.props.valueAnimDuration || CONSTANTS.DEFAULT_VALUE_ANIMATION_DURATION}ms ease;` : '';

		// Use Qlik's pre-formatted text when available (for 'last' agg), otherwise format manually
		const displayValue = layout.props.animateValue ? '0' : (preFormattedText || formatNumber(currentVal, measInfo));

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
	function generateDeltaHtml(layout, colors, fontSizes, fullRows, measInfo, precomputedDelta, kpi1Fmt) {
		if (!layout.props.showDelta) return '';
		
		const delta = precomputedDelta;
		if (!delta) return '';

		const diff = delta.curr - delta.prev;
		const displayType = layout.props.deltaDisplayType || 'percentage';
		const decimals = layout.props.deltaDecimals || CONSTANTS.DEFAULT_DELTA_DECIMALS;
		const factor = Math.pow(10, decimals);
		
		// Use colors passed from getEffectiveColors (theme-aware)
		let displayValue, sign, col;
		
		if (displayType === 'absolute') {
			// Absolute change - use custom format from 1st KPI if available
			const absDiff = Math.abs(diff);
			if (layout.props.deltaUseShortFormat) {
				displayValue = formatShort(absDiff, decimals);
			} else if (kpi1Fmt && kpi1Fmt.type !== 'auto') {
				displayValue = formatWithCustomSettings(absDiff, kpi1Fmt, measInfo);
			} else {
				displayValue = formatNumber(absDiff, measInfo);
			}
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

		// Comparison hint tooltip — added to delta when mode opts in. Chips are independent.
		const hintMode = layout.props.comparisonHintMode || 'chips';
		const showTooltip = (hintMode === 'tooltip' || hintMode === 'both' || hintMode === 'all');
		const rangeText = showTooltip ? buildComparisonRangeText(precomputedDelta) : '';
		const titleAttr = rangeText ? ` title="Compared periods: ${rangeText}"` : '';
		const cursorStyle = rangeText ? 'cursor:help;' : '';

		return `<div class="kpi-card__delta"${titleAttr} style="display:inline-block;margin-left:${layout.props.deltaGap || CONSTANTS.DEFAULT_DELTA_GAP}px;color:${col};font-size:${fontSizes.deltaFontSize};font-family:${layout.props.deltaFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};${cursorStyle}${animationStyle}">${sign} ${displayValue}</div>`;
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
	/**
	 * Builds the modern hover-tooltip HTML for the secondary KPI. Two coloured rows show the
	 * current and previous date ranges; visibility is purely CSS-driven (see styles.css). Returns
	 * '' when either range is missing.
	 */
	function buildCompareHoverTipHtml(layout, deltaData) {
		if (!deltaData || !deltaData.currentRange || !deltaData.previousRange) return '';
		const cr = deltaData.currentRange;
		const pr = deltaData.previousRange;
		const cLabel = (cr.startText && cr.endText && cr.startText !== cr.endText)
			? cr.startText + ' – ' + cr.endText
			: (cr.startText || '');
		const pLabel = (pr.startText && pr.endText && pr.startText !== pr.endText)
			? pr.startText + ' – ' + pr.endText
			: (pr.startText || '');
		if (!cLabel || !pLabel) return '';
		const currentColor = layout.props.scopeButtonActiveColor || '#3b82f6';
		const isDark = !!layout.props.darkMode;
		const previousColor = isDark ? 'rgba(229,231,235,0.55)' : 'rgba(100,116,139,0.7)';
		return ''
			+ '<div class="kpi-card__compare-hover-tip">'
			+   '<div class="kpi-card__compare-hover-tip-inner">'
			+     '<div class="kpi-card__compare-hover-tip-row">'
			+       '<span class="kpi-card__compare-hover-tip-dot" style="background:' + currentColor + ';"></span>'
			+       '<div>'
			+         '<div class="kpi-card__compare-hover-tip-label">Current</div>'
			+         '<div class="kpi-card__compare-hover-tip-dates">' + cLabel + '</div>'
			+       '</div>'
			+     '</div>'
			+     '<div class="kpi-card__compare-hover-tip-row">'
			+       '<span class="kpi-card__compare-hover-tip-dot" style="background:' + previousColor + ';"></span>'
			+       '<div>'
			+         '<div class="kpi-card__compare-hover-tip-label">Previous</div>'
			+         '<div class="kpi-card__compare-hover-tip-dates">' + pLabel + '</div>'
			+       '</div>'
			+     '</div>'
			+   '</div>'
			+ '</div>';
	}

	/**
	 * Builds a human-friendly "Apr 1-15 vs Mar 1-15" string from a delta payload that carries
	 * currentRange/previousRange. Returns '' if either range is missing.
	 */
	function buildComparisonRangeText(deltaData) {
		if (!deltaData || !deltaData.currentRange || !deltaData.previousRange) return '';
		const cr = deltaData.currentRange;
		const pr = deltaData.previousRange;
		function fmt(range) {
			if (!range || !range.startText) return '';
			if (range.startText === range.endText) return range.startText;
			return range.startText + ' – ' + range.endText;
		}
		const curText = fmt(cr);
		const prevText = fmt(pr);
		if (!curText || !prevText) return '';
		return curText + ' vs ' + prevText;
	}

	function generateSecondaryKpiHtml(layout, colors, fontSizes, secondaryValue, secondaryMeasInfo, preFormattedText, deltaData) {
		// Only show secondary KPI if data is available
		if (secondaryValue === null || secondaryValue === undefined) return '';

		// Default label depends on source: previous-period gets a "Previous (<unit>)" hint, otherwise the 2nd measure's title.
		let label = '';
		const isPrevSource = (layout.props.secondarySource === 'previousPeriod');
		if (isPrevSource) {
			const deltaMode = layout.props.deltaMode || 'matchScope';
			if (deltaMode === 'matchScope') {
				const scope = layout.props.kpiScope || 'full';
				const scopeLabels = { today: 'Day', wtd: 'WTD', mtd: 'MTD', qtd: 'QTD', ytd: 'YTD', last7d: 'Last 7d', last30d: 'Last 30d', last90d: 'Last 90d' };
				label = scopeLabels[scope] ? ('Previous ' + scopeLabels[scope]) : 'Previous';
			} else if (deltaMode === 'calendar') {
				const unit = layout.props.deltaCalendarUnit || 'month';
				const unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1);
				label = 'Previous ' + unitLabel;
			} else {
				label = 'Previous';
			}
		} else if (secondaryMeasInfo && secondaryMeasInfo.qFallbackTitle) {
			label = secondaryMeasInfo.qFallbackTitle;
		}
		const labelProp = layout.props.secondaryLabel;
		if (labelProp) {
			if (typeof labelProp === 'string' && labelProp.trim()) {
				label = labelProp;
			} else if (typeof labelProp === 'object' && labelProp.qText) {
				label = labelProp.qText;
			}
		}

		const color = layout.props.secondaryColor || '#94a3b8';
		const primarySizePx = parseFloat(fontSizes.valueFontSize) || layout.props.valueFontSize || 28;
		const fallbackSecondaryPx = layout.props.secondaryFontSize || (primarySizePx * 0.45);
		const fallbackFontSize = fallbackSecondaryPx + 'px';
		const fontSizeValue = fontSizes.secondaryFontSize || fallbackFontSize;
		const fontFamily = layout.props.secondaryFontFamily || layout.props.valueFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY;
		const formatted = preFormattedText || formatNumber(secondaryValue, secondaryMeasInfo);
		const isRightPosition = (layout.props.secondaryKpiPosition === 'right');

		// Comparison hint subtitle — added under the secondary KPI when the user opts in to it.
		// Chips render independently (controlled by the same property but additive, not exclusive).
		const hintMode = layout.props.comparisonHintMode || 'chips';
		const showSubtitle = (hintMode === 'subtitle' || hintMode === 'both' || hintMode === 'all');
		const rangeText = showSubtitle ? buildComparisonRangeText(deltaData) : '';
		const subtitlePx = Math.max(9, Math.round((parseFloat(fontSizeValue) || 14) * 0.62));
		const subtitleHtml = rangeText
			? `<div class="kpi-card__secondary-hint" style="font-size:${subtitlePx}px;color:${color};opacity:0.7;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rangeText}</div>`
			: '';

		// Hover tooltip — attached to the secondary KPI; appears on hover via CSS.
		const showHover = (hintMode === 'hover' || hintMode === 'all');
		const hoverTipHtml = showHover ? buildCompareHoverTipHtml(layout, deltaData) : '';
		const triggerClass = hoverTipHtml ? ' kpi-card__compare-hover-trigger' : '';

		if (isRightPosition) {
			// Right position: label above value (same layout style as 1st KPI with title above value)
			const titleFontSize = fontSizes.titleFontSize || (Math.round(primarySizePx * 0.4) + 'px');
			const labelAbove = label ? `<div style="font-size:${titleFontSize};color:${color};opacity:0.8;margin-bottom:4px;">${label}</div>` : '';
			// NOTE: NO position:relative here — the hover tooltip needs to be positioned relative
			// to the kpi-card so it can use its full width/height without being clipped by the
			// (typically narrow) secondary KPI block.
			return `<div class="kpi-card__secondary${triggerClass}" style="display:flex;flex-direction:column;align-items:flex-end;">${labelAbove}<div style="color:${color};font-size:${fontSizeValue};font-family:${fontFamily};">${formatted}</div>${subtitleHtml}${hoverTipHtml}</div>`;
		}

		// Below position: label inline with value (also no position:relative — see note above)
		const labelHtml = label ? `<span style="font-style:italic;">${label}</span>: ` : '';
		return `<div class="kpi-card__secondary${triggerClass}" style="color:${color};font-size:${fontSizeValue};font-family:${fontFamily};opacity:0.9;"><div>${labelHtml}${formatted}</div>${subtitleHtml}${hoverTipHtml}</div>`;
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

		// Support for expression - extract string value
		let labelText = '';
		const labelProp = layout.props.measureLabel;
		if (typeof labelProp === 'string') {
			labelText = labelProp;
		} else if (labelProp && typeof labelProp === 'object' && labelProp.qText) {
			labelText = labelProp.qText;
		}
		if (!labelText) return '';

		return `<div class="kpi-card__measure-label" style="font-size:${fontSizes.measureLabelFontSize};font-family:${layout.props.measureLabelFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.measureLabelColor};display:inline-block;">${labelText}</div>`;
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

		// Labels positioned at bottom corners, exactly at left and right edges, overlaying the sparkline
		return `<div class="kpi-card__labels" style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end;font-size:${fontSizes.labelFontSize};font-family:${layout.props.labelFontFamily || CONSTANTS.DEFAULT_FONT_FAMILY};color:${colors.labelColor};pointer-events:auto;z-index:5;">` +
			`<span class="kpi-card__label kpi-card__label--start" style="padding:2px 8px;max-width:${maxWidthPct}%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${startLabel}</span>` +
			`<span class="kpi-card__label kpi-card__label--end" style="padding:2px 8px;max-width:${maxWidthPct}%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right;">${endLabel}</span>` +
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
		const borderRadius = layout.props.borderRadius ?
			`-webkit-clip-path:inset(0 round ${layout.props.borderRadius}px);clip-path:inset(0 round ${layout.props.borderRadius}px);` : '';

		// Sparkline fills the entire trend layer - labels overlay on top
		// pointer-events:auto allows tooltip to work while trend layer has pointer-events:none
		return `<div class="kpi-card__sparkline" style="position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;overflow:hidden;pointer-events:auto;${borderRadius}"><div class="kpi-card__sparkline-inner"></div></div>`;
	}

	/**
	 * Generates quick buttons HTML
	 * @param {Object} layout - Layout configuration
	 * @param {string} elementId - Unique element identifier for session storage
	 * @returns {string} Quick buttons HTML
	 */
	function generateQuickButtonsHtml(layout, elementId) {
		if (!layout.props.showQuickButtons || layout.props.showTrend === false) return '';
		// Suppressed when the trend window is being driven by the KPI scope buttons (linkTrendToScope on).
		if (layout.props.showScopeButtons && layout.props.linkTrendToScope) return '';
		
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
	 * Renders a minimal range chip pill — used for both the "current period" and "previous period"
	 * indicators that sit on the right edge of their respective KPI rows. The `variant` field
	 * ('current' | 'previous') drives the dot colour so the two chips read as a pair.
	 */
	function generateSelectionChipHtml(layout, selectionInfo) {
		if (!layout || !layout.props) return '';
		if (!selectionInfo || !selectionInfo.active) return '';

		const label = selectionInfo.label
			|| (selectionInfo.startText && selectionInfo.endText && selectionInfo.startText !== selectionInfo.endText
				? selectionInfo.startText + ' – ' + selectionInfo.endText
				: (selectionInfo.startText || ''));
		if (!label) return '';

		const isDark = !!layout.props.darkMode;
		const variant = selectionInfo.variant || 'current';
		const accent = (variant === 'previous')
			? (isDark ? 'rgba(229,231,235,0.55)' : 'rgba(100,116,139,0.7)') // muted grey for previous
			: (layout.props.scopeButtonActiveColor || '#3b82f6');             // accent for current
		const fg = isDark ? 'rgba(229,231,235,0.85)' : 'rgba(55,65,81,0.8)';
		const bg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
		const tip = (variant === 'previous') ? 'Previous period' : 'Current period';

		return '<div class="kpi-card__selection-chip kpi-card__selection-chip--' + variant + '" title="' + tip + ': ' + label + '" style="font-size:8px;color:' + fg + ';background:' + bg + ';border-radius:6px;padding:1px 5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;display:inline-flex;align-items:center;">' +
			'<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:' + accent + ';margin-right:4px;flex-shrink:0;"></span>' +
			'<span style="overflow:hidden;text-overflow:ellipsis;">' + label + '</span>' +
		'</div>';
	}

	/**
	 * Generates the KPI scope quick-button bar (Today / MTD / YTD …) — independent of trend window buttons.
	 */
	function generateScopeButtonsHtml(layout, elementId) {
		if (!layout.props.showScopeButtons) return '';

		const buttonStyle = layout.props.scopeButtonStyle || 'rounded';
		const activeColor = layout.props.scopeButtonActiveColor || '#3b82f6';
		const activeLabelColor = layout.props.scopeButtonActiveLabelColor || '#ffffff';
		const inactiveBg = layout.props.scopeButtonBackgroundColor || 'rgba(255,255,255,0.1)';
		const inactiveLabel = layout.props.scopeButtonLabelColor || '';
		const displayMode = layout.props.scopeButtonsDisplay || 'chip';

		let baseStyle;
		let radiusPx = '6px';
		switch (buttonStyle) {
			case 'minimal':
				baseStyle = 'background:' + inactiveBg + ';border:1px solid rgba(255,255,255,0.2);color:' + (inactiveLabel || 'inherit') + ';';
				radiusPx = '4px';
				break;
			case 'pill':
				baseStyle = 'background:' + inactiveBg + ';border:none;border-radius:20px;color:' + (inactiveLabel || 'inherit') + ';';
				radiusPx = '20px';
				break;
			default:
				baseStyle = 'background:' + inactiveBg + ';border:none;border-radius:6px;color:' + (inactiveLabel || 'inherit') + ';';
				radiusPx = '6px';
		}

		const sessionBtn = getSelectedScopeButton(elementId);
		const current = sessionBtn || layout.props.currentSelectedScopeButton || layout.props.defaultScopeButton || 'button2';

		const labels = {
			button1: layout.props.scopeButton1Label || 'Today',
			button2: layout.props.scopeButton2Label || 'MTD',
			button3: layout.props.scopeButton3Label || 'YTD'
		};

		// ── Expanded buttons mode (legacy / opt-in for wider cards) ──
		if (displayMode === 'buttons') {
			function btnHtml(key, label) {
				const isActive = (current === key);
				const activeStyle = isActive ? ('background:' + activeColor + '!important;color:' + activeLabelColor + '!important;') : '';
				const cls = 'kpi-card__scope-btn' + (isActive ? ' ' + CONSTANTS.ACTIVE_CLASS : '');
				return '<button class="' + cls + '" data-button="' + key + '" style="' + baseStyle + activeStyle + 'padding:4px 10px;font-size:10px;cursor:pointer;transition:all 0.2s ease;">' + label + '</button>';
			}
			return '<div class="kpi-card__scope-buttons" style="display:flex;gap:4px;">' +
				btnHtml('button1', labels.button1) +
				btnHtml('button2', labels.button2) +
				btnHtml('button3', labels.button3) +
			'</div>';
		}

		// ── Chip + dropdown mode (default) ──
		const isDark = !!layout.props.darkMode;
		const popupBg = isDark ? 'rgba(38,38,42,0.98)' : 'rgba(255,255,255,0.98)';
		const popupBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
		const popupShadow = isDark ? '0 6px 20px rgba(0,0,0,0.6)' : '0 6px 20px rgba(0,0,0,0.18)';
		const popupItemDefaultColor = isDark ? '#e5e7eb' : '#1f2937';
		const popupHoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

		const chipLabel = labels[current] || labels.button2;
		// Chip itself is filled with active color so the user always sees the current scope.
		const chipStyle = 'background:' + activeColor + ';color:' + activeLabelColor + ';border:none;border-radius:' + radiusPx + ';padding:4px 10px;font-size:10px;cursor:pointer;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;line-height:1;';

		function popupItemHtml(key, label) {
			const isActive = (current === key);
			const itemBg = isActive ? activeColor : 'transparent';
			const itemColor = isActive ? activeLabelColor : popupItemDefaultColor;
			const cls = 'kpi-card__scope-btn kpi-card__scope-popup-item' + (isActive ? ' ' + CONSTANTS.ACTIVE_CLASS : '');
			return '<button class="' + cls + '" data-button="' + key + '" data-popup-hover-bg="' + popupHoverBg + '" style="background:' + itemBg + ';color:' + itemColor + ';border:none;border-radius:4px;padding:6px 12px;font-size:11px;cursor:pointer;text-align:left;transition:background 0.15s ease;width:100%;display:block;">' + label + '</button>';
		}

		return '<div class="kpi-card__scope-buttons kpi-card__scope-buttons--chip" style="position:relative;display:inline-flex;">' +
			'<button class="kpi-card__scope-chip" style="' + chipStyle + '">' +
				'<span>' + chipLabel + '</span>' +
				'<span style="font-size:9px;opacity:0.85;">▾</span>' +
			'</button>' +
			'<div class="kpi-card__scope-popup" style="display:none;position:absolute;top:calc(100% + 4px);left:0;min-width:90px;background:' + popupBg + ';border:1px solid ' + popupBorder + ';border-radius:8px;box-shadow:' + popupShadow + ';padding:4px;z-index:200;flex-direction:column;gap:2px;">' +
				popupItemHtml('button1', labels.button1) +
				popupItemHtml('button2', labels.button2) +
				popupItemHtml('button3', labels.button3) +
			'</div>' +
		'</div>';
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
	function buildFinalHtml(darkModeClass, containerStyle, layout, colors, titleHtml, valueHtml, deltaHtml, measureLabelHtml, labelsHtml, sparkHtml, quickButtonsHtml, secondaryHtml, backgroundOverride, fullRows, deltaData, scopeButtonsHtml, chip1Html, chip2Html) {
		const padding = layout.props.padding || CONSTANTS.DEFAULT_PADDING;
		const borderWidth = layout.props.borderWidth || CONSTANTS.DEFAULT_BORDER_WIDTH;
		const borderRadius = layout.props.borderRadius || CONSTANTS.DEFAULT_BORDER_RADIUS;

		// Determine alignment CSS values
		const alignValue = layout.props.align || 'left';
		const alignItemsCss = alignValue === 'center' ? 'center' : (alignValue === 'right' ? 'flex-end' : 'flex-start');
		const textAlignCss = alignValue === 'center' ? 'center' : (alignValue === 'right' ? 'right' : 'left');

		// Build value block with measure label positioning
		const valueWithDelta = `<div style="position:relative;display:inline-flex;align-items:baseline;">${valueHtml}${deltaHtml}</div>`;
		const inlineIconHtml = generateIconHtml(layout, 'value-right', colors);

		// Determine layout mode
		const secondaryKpiPosition = layout.props.secondaryKpiPosition || 'below';
		const is3ColumnLayout = secondaryHtml && secondaryKpiPosition === 'right';

		const valueContent = inlineIconHtml ? `<div class="kpi-card__value-row">${valueWithDelta}${inlineIconHtml}</div>` : valueWithDelta;

		const headerGap = layout.props.headerGapPx || CONSTANTS.DEFAULT_HEADER_GAP;
		const titleGap = titleHtml ? `<div style="height:${headerGap}px"></div>` : '';

		// Build value block with measure label
		function buildValueBlock(vc) {
			switch (layout.props.measureLabelPos) {
				case 'top':
					return `<div style="display:flex;flex-direction:column;align-items:${alignItemsCss}">${measureLabelHtml}<div style="height:${headerGap}px"></div>${vc}</div>`;
				case 'left':
					return `<div style="display:flex;align-items:baseline;gap:${headerGap}px;justify-content:${alignItemsCss}">${measureLabelHtml}${vc}</div>`;
				case 'right':
					return `<div style="display:flex;align-items:baseline;gap:${headerGap}px;justify-content:${alignItemsCss}">${vc}${measureLabelHtml}</div>`;
				default:
					return `<div style="display:flex;flex-direction:column;align-items:${alignItemsCss}">${vc}<div style="height:${headerGap}px"></div>${measureLabelHtml}</div>`;
			}
		}

		const mainKpiRow = buildValueBlock(valueContent);

		// Chips are absolutely-positioned on the right edge of each row, so the underlying KPI
		// value keeps its natural width — no flex squeeze, no truncation. They overlap only if
		// the value is wider than (card width − chip width), at which point the user can widen
		// the card or pick a shorter number format.
		// We use `right: -padding` so the chip is flush with the card edge (not the kpi-layer's
		// padded content edge), which would otherwise leave a visible gap on the right.
		const chip1 = chip1Html || '';
		const chip2 = chip2Html || '';
		const chipRightOffset = -padding;
		const mainKpiRowAligned = chip1
			? `<div style="position:relative;width:100%;">${mainKpiRow}<div style="position:absolute;top:50%;right:${chipRightOffset}px;transform:translateY(-50%);pointer-events:none;">${chip1}</div></div>`
			: mainKpiRow;

		// ═══════ CONTENT WRAPPER - layout modes ═══════
		let contentWrapper;

		if (is3ColumnLayout) {
			// ── 3-Column Layout: [1st KPI] [spacer] [2nd KPI] ──
			// Chip 2 sits under the secondary on the right column. Chip 1 still floats over the main row.
			const secondaryWithChip = chip2
				? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">${secondaryHtml}${chip2}</div>`
				: secondaryHtml;
			const leftCol = `<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-start;width:100%;">${titleHtml}${titleGap}${mainKpiRowAligned}</div>`;
			const centerCol = `<div style="flex:1;"></div>`;
			const rightCol = `<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;">${secondaryWithChip}</div>`;
			contentWrapper = `<div style="display:flex;align-items:center;width:100%;gap:12px;">${leftCol}${centerCol}${rightCol}</div>`;
		} else {
			// ── Standard vertical layout — chip 2 floats over the secondary row (or empty row) ──
			const hasSecondary = (secondaryKpiPosition === 'below' && secondaryHtml);
			let secondaryRowAligned = '';
			if (hasSecondary || chip2) {
				const secondaryContent = hasSecondary ? secondaryHtml : '';
				secondaryRowAligned = chip2
					? `<div style="position:relative;width:100%;margin-top:4px;${hasSecondary ? '' : 'min-height:14px;'}">${secondaryContent}<div style="position:absolute;top:50%;right:${chipRightOffset}px;transform:translateY(-50%);pointer-events:none;">${chip2}</div></div>`
					: `<div style="margin-top:4px;">${secondaryContent}</div>`;
			}
			contentWrapper = `<div style="display:flex;flex-direction:column;align-items:${alignItemsCss};width:100%;">${titleHtml}${titleGap}${mainKpiRowAligned}${secondaryRowAligned}</div>`;
		}

		const showTrend = layout.props.showTrend !== false;

		// Check if glass morphism theme is selected (CSS handles the styling)
		const isGlassTheme = layout.props.theme === 'glass';

		// Generate gradient background if enabled
		const gradientEnabled = layout.props.useGradient === true;
		const bgOpacityRaw = layout.props.backgroundOpacity;
		const bgOpacity = (bgOpacityRaw === undefined || bgOpacityRaw === null || isNaN(bgOpacityRaw)) ? 1 : Math.max(0, Math.min(1, Number(bgOpacityRaw)));
		let resolvedBackgroundColor = colors.backgroundColor;
		if (bgOpacity < 1 && resolvedBackgroundColor && resolvedBackgroundColor !== 'transparent') {
			resolvedBackgroundColor = hexToRgba(resolvedBackgroundColor, bgOpacity);
		}
		let containerBackgroundStyle = `background:${resolvedBackgroundColor};`;
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
				default:
					gradientCss = `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})`;
			}
			containerBackgroundStyle = `background:${gradientCss} !important;`;
		}
		if (backgroundOverride) {
			containerBackgroundStyle = `background:${backgroundOverride} !important;`;
		}

		// Generate elevation/shadow styles
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
		const scopeBtnsHtml = scopeButtonsHtml || '';
		// Chrome only carries scope buttons + status badge now; range chips have moved into the
		// KPI value rows so they line up horizontally with the values they describe.
		const chromeHtml = (statusBadgeHtml || quickButtonsHtml || scopeBtnsHtml)
			? `<div class="kpi-card__chrome" style="display:flex !important;gap:6px !important;align-items:center !important;justify-content:flex-end !important;">${scopeBtnsHtml}${quickButtonsHtml}${statusBadgeHtml}</div>`
			: '';

		// Click interaction style
		const qlikEditMode = (qlik && qlik.navigation && typeof qlik.navigation.getMode === 'function' && qlik.navigation.getMode() !== 'analysis');
		const clickEnabled = layout.props.enableClick && !qlikEditMode;
		const clickStyle = clickEnabled ? 'cursor:pointer;transition:all 0.2s ease;' : '';
		const clickClass = clickEnabled ? ' kpi-card--clickable' : '';

		// Border style
		const borderStyle = borderWidth > 0 ?
			`border: ${borderWidth}px solid ${colors.borderColor} !important;` :
			'border: 0 !important;';

		// Selection indicator bar - positioned at absolute bottom of entire card
		const selectionBarHtml = `<div class="kpi-card__selection-bar" style="position:absolute;bottom:0;left:0;right:0;z-index:100;pointer-events:none;"></div>`;

		// ========== NEW SINGLE SECTION LAYOUT ==========
		// Trend height from settings (percentage of container)
		const trendHeightPct = showTrend ? (layout.props.trendSectionHeight || CONSTANTS.DEFAULT_TREND_SECTION_HEIGHT) : 0;

		// Build trend layer (positioned at bottom, behind KPI content)
		// pointer-events:none on layer allows card clicks to pass through, but sparkline has pointer-events:auto for tooltip
		let trendLayerHtml = '';
		if (showTrend) {
			trendLayerHtml = `<div class="kpi-card__trend-layer" style="position:absolute;bottom:0;left:0;right:0;height:${trendHeightPct}%;z-index:1;overflow:visible;pointer-events:none;">${sparkHtml}${labelsHtml}</div>`;
		}

		// Build KPI content layer (positioned on top)
		const kpiLayerHtml = `<div class="kpi-card__kpi-layer" style="position:relative;z-index:2;padding:${padding}px;display:flex;flex-direction:column;align-items:${alignItemsCss};text-align:${textAlignCss};">${topIconHtml}${chromeHtml}${contentWrapper}</div>`;

		// Main container with single unified layout
		const mainContainerStyle = `position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;`;

		return `<div class="kpi-card${darkModeClass}${isGlassTheme ? ' kpi-card--glass' : ''}${clickClass}" data-border-width="${borderWidth}" data-border-color="${colors.borderColor}" style="${mainContainerStyle}${containerBackgroundStyle}${containerElevationStyle}${clickStyle}border-radius:${borderRadius}px;${borderStyle}">${trendLayerHtml}${kpiLayerHtml}${selectionBarHtml}</div>`;
	}
	return {
		generateIconHtml:         generateIconHtml,
		evaluateCondition:        evaluateCondition,
		getConditionalBackground: getConditionalBackground,
		checkIfSelected:          checkIfSelected,
		getSelectedIndicatorStyle: getSelectedIndicatorStyle,
		generateStatusBadgeHtml:  generateStatusBadgeHtml,
		generateTitleHtml:        generateTitleHtml,
		generateValueHtml:        generateValueHtml,
		generateDeltaHtml:        generateDeltaHtml,
		generateSecondaryKpiHtml: generateSecondaryKpiHtml,
		generateMeasureLabelHtml: generateMeasureLabelHtml,
		generateLabelsHtml:       generateLabelsHtml,
		generateSparklineHtml:    generateSparklineHtml,
		generateQuickButtonsHtml: generateQuickButtonsHtml,
		generateScopeButtonsHtml: generateScopeButtonsHtml,
		generateSelectionChipHtml: generateSelectionChipHtml,
		buildFinalHtml:           buildFinalHtml
	};
});