/**
 * KPI Card Extension - Properties Panel
 * Qlik Sense properties panel definition + initialProperties.
 */
define(['qlik', './constants', './themes', './formatters'], function (qlik, constantsModule, themesModule, formatters) {
	'use strict';

	var GRADIENT_PRESETS     = constantsModule.GRADIENT_PRESETS;
	var EMOJI_ICON_OPTIONS   = constantsModule.EMOJI_ICON_OPTIONS;
	var MODERN_ICON_OPTIONS  = constantsModule.MODERN_ICON_OPTIONS;
	var THEME_OPTIONS        = themesModule.THEME_OPTIONS;

	var serializePresetProps = formatters.serializePresetProps;
	var parsePresetText      = formatters.parsePresetText;
	var applyPresetToProps   = formatters.applyPresetToProps;

	// ── Properties Panel ─────────────────────────────────────────────────────
		var properties = {
		type: 'items', component: 'accordion', items: {
			data: { uses: 'data', items: { dimensions: { min: 1, max: 1 }, measures: { min: 1, max: 2 } } },
			sorting: { uses: 'sorting' },
			appearance: { uses: 'settings', items: {
				// Content
				contentSection: { type: 'items', label: 'Content', items: {
					title: { ref: 'props.title', label: 'Title', type: 'string', expression: 'optional', defaultValue: '' },
					measureLabel: { ref: 'props.measureLabel', label: 'Measure Label', type: 'string', expression: 'optional', defaultValue: '' },
					measureLabelPos: { ref: 'props.measureLabelPos', label: 'Measure Label Position', type: 'string', component: 'dropdown', options: [ { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' } ], defaultValue: 'bottom' },
					measureLabelGap: { ref: 'props.measureLabelGap', label: 'Label Gap (px)', type: 'number', defaultValue: 4 },
					align: { ref: 'props.align', label: 'Alignment', type: 'string', component: 'dropdown', options: [ { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' } ], defaultValue: 'left' },
					kpiAgg: { ref: 'props.kpiAgg', label: 'KPI Aggregation', type: 'string', component: 'dropdown', expression: 'optional', options: [ { value: 'last', label: 'Last' }, { value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' } ], defaultValue: 'last' },
					kpiScope: { ref: 'props.kpiScope', label: 'KPI Scope', type: 'string', component: 'dropdown', expression: 'optional', options: [ { value: 'full', label: 'Full data' }, { value: 'window', label: 'Trend window' } ], defaultValue: 'full' },
					kpi1FormatType: { ref: 'props.kpi1FormatType', label: 'Number Format', type: 'string', component: 'dropdown', options: [ { value: 'auto', label: 'Auto (from Qlik)' }, { value: 'number', label: 'Number' }, { value: 'percent', label: 'Percentage (%)' } ], defaultValue: 'auto' },
					kpi1FormatDecimals: { ref: 'props.kpi1FormatDecimals', label: 'Decimal Places', type: 'number', defaultValue: 2, min: 0, max: 10, show: function(d) { return d && d.props && d.props.kpi1FormatType && d.props.kpi1FormatType !== 'auto'; } },
					kpi1FormatUseThousandSep: { ref: 'props.kpi1FormatUseThousandSep', label: 'Thousand Separator', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.kpi1FormatType && d.props.kpi1FormatType !== 'auto'; } },
					kpi1FormatPrefix: { ref: 'props.kpi1FormatPrefix', label: 'Prefix', type: 'string', defaultValue: '', show: function(d) { return d && d.props && d.props.kpi1FormatType && d.props.kpi1FormatType !== 'auto'; } },
					kpi1FormatSuffix: { ref: 'props.kpi1FormatSuffix', label: 'Suffix', type: 'string', defaultValue: '', show: function(d) { return d && d.props && d.props.kpi1FormatType && d.props.kpi1FormatType !== 'auto'; } }
				} },
				// Secondary KPI Styling (visible when a 2nd measure is added in Data>Measures)
				secondaryKpiSection: { type: 'items', label: 'Secondary KPI', items: {
					secondaryKpiPosition: { ref: 'props.secondaryKpiPosition', label: 'Position', type: 'string', component: 'dropdown', options: [ { value: 'below', label: 'Below 1st KPI' }, { value: 'right', label: 'Right side of object' } ], defaultValue: 'below' },
					secondaryLabel: { ref: 'props.secondaryLabel', label: 'Custom Label (leave empty for measure name)', type: 'string', expression: 'optional', defaultValue: '' },
					secondaryColor: { ref: 'props.secondaryColor', label: 'Color', type: 'string', defaultValue: '#94a3b8' },
					secondaryFontSize: { ref: 'props.secondaryFontSize', label: 'Font Size (px)', type: 'number', defaultValue: 16, min: 8, max: 48 },
					secondaryFontFamily: { ref: 'props.secondaryFontFamily', label: 'Font Family', type: 'string', defaultValue: 'Open Sans' },
					kpi2FormatType: { ref: 'props.kpi2FormatType', label: 'Number Format', type: 'string', component: 'dropdown', options: [ { value: 'auto', label: 'Auto (from Qlik)' }, { value: 'number', label: 'Number' }, { value: 'percent', label: 'Percentage (%)' } ], defaultValue: 'auto' },
					kpi2FormatDecimals: { ref: 'props.kpi2FormatDecimals', label: 'Decimal Places', type: 'number', defaultValue: 2, min: 0, max: 10, show: function(d) { return d && d.props && d.props.kpi2FormatType && d.props.kpi2FormatType !== 'auto'; } },
					kpi2FormatUseThousandSep: { ref: 'props.kpi2FormatUseThousandSep', label: 'Thousand Separator', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.kpi2FormatType && d.props.kpi2FormatType !== 'auto'; } },
					kpi2FormatPrefix: { ref: 'props.kpi2FormatPrefix', label: 'Prefix', type: 'string', defaultValue: '', show: function(d) { return d && d.props && d.props.kpi2FormatType && d.props.kpi2FormatType !== 'auto'; } },
					kpi2FormatSuffix: { ref: 'props.kpi2FormatSuffix', label: 'Suffix', type: 'string', defaultValue: '', show: function(d) { return d && d.props && d.props.kpi2FormatType && d.props.kpi2FormatType !== 'auto'; } }
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
				// Colors, Theme & Conditional
				colorsSection: { type: 'items', label: 'Colors & Theme', items: {
					theme: { ref: 'props.theme', label: 'Theme', type: 'string', component: 'dropdown', options: THEME_OPTIONS, defaultValue: 'custom' },
					valueColor: { ref: 'props.valueColor', label: 'Value Color', type: 'string', defaultValue: '#111111', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					titleColor: { ref: 'props.titleColor', label: 'Title Color', type: 'string', defaultValue: '#111111', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					dateLabelColor: { ref: 'props.labelColor', label: 'Date Label Color', type: 'string', defaultValue: '#555555', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					measureLabelColor: { ref: 'props.measureLabelColor', label: 'Measure Label Color', type: 'string', defaultValue: '#666666', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					backgroundColor: { ref: 'props.backgroundColor', label: 'Background', type: 'string', defaultValue: 'transparent', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					borderColor: { ref: 'props.borderColor', label: 'Border Color', type: 'string', defaultValue: 'transparent', show: function(d) { return d && d.props && d.props.theme === 'custom'; } },
					enableBackgroundCondition: { ref: 'props.enableBackgroundCondition', label: 'Enable Conditional Background', type: 'boolean', defaultValue: false },
					backgroundConditionOperator: { ref: 'props.backgroundConditionOperator', label: 'Condition', type: 'string', component: 'dropdown', options: [ { value: 'gt', label: '> (greater than)' }, { value: 'gte', label: '≥ (greater equal)' }, { value: 'lt', label: '< (less than)' }, { value: 'lte', label: '≤ (less equal)' }, { value: 'eq', label: '= (equals)' }, { value: 'between', label: 'Between' } ], defaultValue: 'gt', show: function(d) { return d && d.props && d.props.enableBackgroundCondition; } },
					backgroundConditionValue: { ref: 'props.backgroundConditionValue', label: 'Threshold', type: 'number', expression: 'optional', defaultValue: 0, show: function(d) { return d && d.props && d.props.enableBackgroundCondition; } },
					backgroundConditionValue2: { ref: 'props.backgroundConditionValue2', label: 'Threshold (max)', type: 'number', expression: 'optional', defaultValue: 0, show: function(d) { return d && d.props && d.props.enableBackgroundCondition && d.props.backgroundConditionOperator === 'between'; } },
					backgroundConditionColor: { ref: 'props.backgroundConditionColor', label: 'Conditional Background Color', type: 'string', defaultValue: '#1f2937', show: function(d) { return d && d.props && d.props.enableBackgroundCondition; } }
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
					gradientDirection: { ref: 'props.gradientDirection', label: 'Gradient Direction', type: 'string', component: 'dropdown', options: [ { value: 'vertical', label: 'Vertical (Top to Bottom)' }, { value: 'horizontal', label: 'Horizontal (Left to Right)' }, { value: 'diagonal', label: 'Diagonal (Top Left to Bottom Right)' }, { value: 'radial', label: 'Radial (Center)' } ], defaultValue: 'vertical', show: function(d) { return d && d.props && d.props.useGradient && (d.props.gradientPreset || 'custom') === 'custom'; } },
					kpiSectionHeight: { ref: 'props.kpiSectionHeight', label: 'KPI Section Height (%)', type: 'number', defaultValue: 60, min: 20, max: 80 },
					trendSectionHeight: { ref: 'props.trendSectionHeight', label: 'Trend Section Height (%)', type: 'number', defaultValue: 40, min: 20, max: 80 },
					sectionGap: { ref: 'props.sectionGap', label: 'Section Gap (vh)', type: 'number', defaultValue: 1, min: 0, max: 5 }
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
							try {
								return qlik.currApp().getList('FieldList').then(function(model) {
									return model.layout.qFieldList.qItems.map(function(item) {
										return { value: item.qName, label: item.qName };
									});
								}).catch(function() { return []; });
							} catch(e) { return []; }
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
							try {
								return qlik.currApp().getList('VariableList').then(function(model) {
									var items = model && model.layout && model.layout.qVariableList && model.layout.qVariableList.qItems || [];
									return items.filter(function(v) { return !v.qIsReserved; }).map(function(v) {
										return { value: v.qName, label: v.qName };
									});
								}).catch(function() { return []; });
							} catch(e) { return []; }
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
				// Delta & Status Section
				deltaSection: { type: 'items', label: 'Delta & Status', items: {
					showDelta: { ref: 'props.showDelta', label: 'Show Delta vs Previous', type: 'boolean', defaultValue: true },
					deltaDisplayType: { ref: 'props.deltaDisplayType', label: 'Delta Display Type', type: 'string', component: 'dropdown', options: [ { value: 'percentage', label: 'Percentage (%)' }, { value: 'absolute', label: 'Absolute Amount' } ], defaultValue: 'percentage', show: function(layout) { return layout.props.showDelta; } },
					deltaUseShortFormat: { ref: 'props.deltaUseShortFormat', label: 'Use Short Format (K/M/B)', type: 'boolean', defaultValue: false, show: function(layout) { return layout.props.showDelta && layout.props.deltaDisplayType === 'absolute'; } },
					deltaMode: { ref: 'props.deltaMode', label: 'Delta Mode', type: 'string', component: 'dropdown', options: [ { value: 'points', label: 'Previous N points (offset supported)' } ], defaultValue: 'points', show: function(layout) { return layout.props.showDelta; } },
					deltaPoints: { ref: 'props.deltaPoints', label: 'Window Size N (points)', type: 'number', expression: 'optional', defaultValue: 1, show: function(layout) { return layout.props.showDelta; } },
					deltaOffset: { ref: 'props.deltaOffset', label: 'Compare Offset (in windows)', type: 'number', expression: 'optional', defaultValue: 1, show: function(layout) { return layout.props.showDelta; } },
					deltaAgg: { ref: 'props.deltaAgg', label: 'Delta Aggregation', type: 'string', component: 'dropdown', expression: 'optional', options: [ { value: 'last', label: 'Last' }, { value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Average' } ], defaultValue: 'last', show: function(layout) { return layout.props.showDelta; } },
					deltaDecimals: { ref: 'props.deltaDecimals', label: 'Delta Decimals', type: 'number', defaultValue: 1, show: function(layout) { return layout.props.showDelta; } },
					deltaFontSize: { ref: 'props.deltaFontSize', label: 'Delta Font Size (px)', type: 'number', defaultValue: 0, show: function(layout) { return layout.props.showDelta; } },
					deltaFontFamily: { ref: 'props.deltaFontFamily', label: 'Delta Font Family', type: 'string', defaultValue: 'Open Sans', show: function(layout) { return layout.props.showDelta; } },
					deltaUpColor: { ref: 'props.deltaUpColor', label: 'Delta Up Color', type: 'string', defaultValue: '#16a34a', show: function(d) { return d && d.props && d.props.showDelta && d.props.theme === 'custom'; } },
					deltaDownColor: { ref: 'props.deltaDownColor', label: 'Delta Down Color', type: 'string', defaultValue: '#dc2626', show: function(d) { return d && d.props && d.props.showDelta && d.props.theme === 'custom'; } },
					deltaNeutralColor: { ref: 'props.deltaNeutralColor', label: 'Delta Neutral Color', type: 'string', defaultValue: '#9ca3af', show: function(d) { return d && d.props && d.props.showDelta && d.props.theme === 'custom'; } },
					deltaGap: { ref: 'props.deltaGap', label: 'Gap between Value and Delta (px)', type: 'number', defaultValue: 6, show: function(layout) { return layout.props.showDelta; } },
					showStatusBadge: { ref: 'props.showStatusBadge', label: 'Show Status Badge', type: 'boolean', defaultValue: false, show: function(d) { return d && d.props && d.props.showDelta; } }
				} },
				// Trend Section
				trendSection: { type: 'items', label: 'Trend', items: {
					showTrend: { ref: 'props.showTrend', label: 'Show Trend', type: 'boolean', defaultValue: true },
					trendPosition: { ref: 'props.trendPosition', label: 'Trend Position', type: 'string', component: 'dropdown', options: [ { value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' } ], defaultValue: 'bottom', show: function(layout) { return layout.props.showTrend; } },
					trendHeight: { ref: 'props.trendHeight', label: 'Trend Height (px) - Auto responsive if 0', type: 'number', defaultValue: 0, show: function(layout) { return false; } },
					trendTopMarginPx: { ref: 'props.trendTopMarginPx', label: 'Trend Top Margin (px) - Auto responsive if 0', type: 'number', defaultValue: 0, show: function(layout) { return false; } },
					trendMode: { ref: 'props.trendMode', label: 'Trend Mode', type: 'string', component: 'dropdown', options: [ { value: 'line', label: 'Line' }, { value: 'area', label: 'Area' }, { value: 'bar', label: 'Bar Chart' }, { value: 'dots', label: 'Dot Plot' }, { value: 'stepped', label: 'Stepped Line' } ], defaultValue: 'line', show: function(layout) { return layout.props.showTrend; } },
				showBarMinMax: { ref: 'props.showBarMinMax', label: 'Highlight Min/Max Bars (red/green)', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.showTrend && d.props.trendMode === 'bar'; } },
					barGradient: { ref: 'props.barGradient', label: 'Bar Gradient Fill', type: 'boolean', defaultValue: false, show: function(d) { return d && d.props && d.props.showTrend && d.props.trendMode === 'bar'; } },
					barGradientAuto: { ref: 'props.barGradientAuto', label: 'Use Theme Colors (Auto)', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.showTrend && d.props.trendMode === 'bar' && d.props.barGradient; } },
					barGradientStart: { ref: 'props.barGradientStart', label: 'Gradient Top Color', type: 'string', defaultValue: '#ffffff', show: function(d) { return d && d.props && d.props.showTrend && d.props.trendMode === 'bar' && d.props.barGradient && d.props.barGradientAuto === false; } },
					barGradientEnd: { ref: 'props.barGradientEnd', label: 'Gradient Bottom Color', type: 'string', defaultValue: '#3f51b5', show: function(d) { return d && d.props && d.props.showTrend && d.props.trendMode === 'bar' && d.props.barGradient && d.props.barGradientAuto === false; } },
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
					trendWindowMode: { ref: 'props.trendWindowMode', label: 'Trend Window', type: 'string', component: 'dropdown', expression: 'optional', options: [ { value: 'all', label: 'All data' }, { value: 'lastNPoints', label: 'Last N points' }, { value: 'lastNDays', label: 'Last N days' } ], defaultValue: 'all', show: function(layout) { return layout.props.showTrend; } },
					trendWindowPoints: { ref: 'props.trendWindowPoints', label: 'N (points)', type: 'number', expression: 'optional', defaultValue: 60, show: function (d) { return d.props && d.props.trendWindowMode === 'lastNPoints' && d.props.showTrend; } },
					trendWindowDays: { ref: 'props.trendWindowDays', label: 'N (days)', type: 'number', expression: 'optional', defaultValue: 180, show: function (d) { return d.props && d.props.trendWindowMode === 'lastNDays' && d.props.showTrend; } },
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
					currentSelectedButton: { ref: 'props.currentSelectedButton', label: 'Current Selected Button (Internal)', type: 'string', defaultValue: 'button2', show: function(d) { return false; } },
					showLabelDates: { ref: 'props.showLabelDates', label: 'Show start/end date labels', type: 'boolean', defaultValue: true },
					labelMaxWidthPct: { ref: 'props.labelMaxWidthPct', label: 'Date Label Max Width (%)', type: 'number', defaultValue: 45, show: function(d) { return d && d.props && d.props.showLabelDates; } },
					endLabelOffsetPx: { ref: 'props.endLabelOffsetPx', label: 'End Label Left Offset (px)', type: 'number', defaultValue: 8, show: function(d) { return d && d.props && d.props.showLabelDates; } },
					startLabelRightPadPx: { ref: 'props.startLabelRightPadPx', label: 'Start Label Right Padding (px)', type: 'number', defaultValue: 6, show: function(d) { return d && d.props && d.props.showLabelDates; } },
					endLabelRightPadPx: { ref: 'props.endLabelRightPadPx', label: 'End Label Right Padding (px)', type: 'number', defaultValue: 8, show: function(d) { return d && d.props && d.props.showLabelDates; } },
					labelsGapPx: { ref: 'props.labelsGapPx', label: 'Labels Top Gap (px)', type: 'number', defaultValue: 2, show: function(d) { return d && d.props && d.props.showLabelDates; } }
				} },
				// Forecast Section
				forecastSection: { type: 'items', label: 'Forecast', items: {
					showForecast: { ref: 'props.showForecast', label: 'Show Forecast Line', type: 'boolean', defaultValue: false },
					forecastPeriods: { ref: 'props.forecastPeriods', label: 'Forecast Periods', type: 'number', defaultValue: 5, min: 1, max: 20, show: function(d) { return d && d.props && d.props.showForecast; } },
					forecastMethod: {
						ref: 'props.forecastMethod',
						label: 'Forecast Method',
						type: 'string',
						component: 'dropdown',
						options: [
							{ value: 'holt', label: 'Holt Exponential Smoothing (Recommended)' },
							{ value: 'polynomial', label: 'Polynomial Regression (Curved)' },
							{ value: 'autoRegressive', label: 'Auto-Regressive (AR)' },
							{ value: 'weightedMA', label: 'Weighted Moving Average' },
							{ value: 'linear', label: 'Linear Regression' }
						],
						defaultValue: 'holt',
						show: function(d) { return d && d.props && d.props.showForecast; }
					},
					forecastLineStyle: { ref: 'props.forecastLineStyle', label: 'Line Style', type: 'string', component: 'dropdown', options: [ { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'solid', label: 'Solid' } ], defaultValue: 'dashed', show: function(d) { return d && d.props && d.props.showForecast; } },
					forecastUseThemeColor: { ref: 'props.forecastUseThemeColor', label: 'Use Theme Color', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.showForecast; } },
					forecastColor: { ref: 'props.forecastColor', label: 'Forecast Line Color', type: 'string', defaultValue: '#f59e0b', show: function(d) { return d && d.props && d.props.showForecast && !d.props.forecastUseThemeColor; } },
					forecastOpacity: { ref: 'props.forecastOpacity', label: 'Forecast Opacity', type: 'number', defaultValue: 0.7, show: function(d) { return d && d.props && d.props.showForecast; } },
					showConfidenceInterval: { ref: 'props.showConfidenceInterval', label: 'Show Confidence Interval', type: 'boolean', defaultValue: true, show: function(d) { return d && d.props && d.props.showForecast; } },
					confidenceLevel: { ref: 'props.confidenceLevel', label: 'Confidence Level (%)', type: 'number', component: 'dropdown', options: [ { value: 80, label: '80%' }, { value: 90, label: '90%' }, { value: 95, label: '95%' } ], defaultValue: 80, show: function(d) { return d && d.props && d.props.showForecast && d.props.showConfidenceInterval; } }
				} },
				// Effects & Animations
				effectsSection: { type: 'items', label: 'Effects & Animations', items: {
					showGlow: { ref: 'props.showGlow', label: 'Glow Effect', type: 'boolean', defaultValue: false },
					glowColor: { ref: 'props.glowColor', label: 'Glow Color', type: 'string', defaultValue: '#ffffff', show: function(d) { return d && d.props && d.props.showGlow; } },
					glowStdDev: { ref: 'props.glowStdDev', label: 'Glow Strength', type: 'number', defaultValue: 2, show: function(d) { return d && d.props && d.props.showGlow; } },
					showTooltip: { ref: 'props.showTooltip', label: 'Show Tooltip on Hover', type: 'boolean', defaultValue: true },
					showMinMax: { ref: 'props.showMinMax', label: 'Highlight Min/Max with Pulse', type: 'boolean', defaultValue: true },
					pulseRadius: { ref: 'props.pulseRadius', label: 'Pulse Radius (px)', type: 'number', defaultValue: 1.8, show: function(d) { return d && d.props && d.props.showMinMax; } },
					pulseMinColor: { ref: 'props.pulseMinColor', label: 'Pulse Min Color', type: 'string', defaultValue: '#dc2626', show: function(d) { return d && d.props && d.props.showMinMax; } },
					pulseMaxColor: { ref: 'props.pulseMaxColor', label: 'Pulse Max Color', type: 'string', defaultValue: '#16a34a', show: function(d) { return d && d.props && d.props.showMinMax; } },
					hoverValueScale: { ref: 'props.hoverValueScale', label: 'Value Hover Scale Effect', type: 'boolean', defaultValue: true },
					hoverLineThickness: { ref: 'props.hoverLineThickness', label: 'Line Hover Thickness Effect', type: 'boolean', defaultValue: true },
					hoverLineThicknessMultiplier: { ref: 'props.hoverLineThicknessMultiplier', label: 'Line Thickness Multiplier', type: 'number', defaultValue: 1.5, show: function(d) { return d.props.hoverLineThickness; } },
					darkMode: { ref: 'props.darkMode', label: 'Dark Mode', type: 'boolean', defaultValue: false },
					animateDraw: { ref: 'props.animateDraw', label: 'Animate Line Draw', type: 'boolean', defaultValue: true },
					animDurationMs: { ref: 'props.animDurationMs', label: 'Animation Duration (ms)', type: 'number', defaultValue: 600, show: function(d) { return d && d.props && d.props.animateDraw; } },
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

	// ── Initial Properties ───────────────────────────────────────────────────
	var initialProperties = { qHyperCubeDef: { qDimensions: [], qMeasures: [], qInterColumnSortOrder: [], qNoOfLeftDims: 1, qSuppressMissing: true, qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 1000 }] }, props: { showLabelDates: true, align: 'left', fontMode: 'static', valueFontSize: 28, valueFontFamily: 'Open Sans', titleFontSize: 12, titleFontFamily: 'Open Sans', deltaFontSize: 16, deltaFontFamily: 'Open Sans', labelFontSize: 10, labelFontFamily: 'Open Sans', measureLabelSize: 11, measureLabelFontFamily: 'Open Sans', measureLabelPos: 'bottom', measureLabelGap: 4, theme: 'custom', valueColor: '#111111', titleColor: '#111111', labelColor: '#555555', measureLabelColor: '#666666', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, borderRadius: 0, padding: 8, cardElevation: 'none', useGradient: false, gradientPreset: 'custom', gradientStart: '#3b82f6', gradientEnd: '#8b5cf6', gradientDirection: 'vertical', showIcon: false, iconPack: 'emoji', iconType: 'chart', iconSize: 24, iconCustom: '', iconPosition: 'top-right', showStatusBadge: false, enableClick: false, clickAction: 'select-field-value', selectFieldName: '', selectFieldValue: '', variableName: '', variableValue: '', selectedIndicator: 'bottom-border', selectedColor: '#3b82f6', kpiSectionHeight: 60, trendSectionHeight: 40, sectionGap: 1, showDelta: true, deltaDisplayType: 'percentage', deltaUseShortFormat: false, deltaMode: 'points', deltaPoints: 1, deltaOffset: 1, deltaAgg: 'last', deltaDecimals: 1, deltaUpColor: '#16a34a', deltaDownColor: '#dc2626', deltaNeutralColor: '#9ca3af', deltaGap: 6, showTrend: true, trendPosition: 'bottom', trendHeight: 0, trendTopMarginPx: 0, pulseRadius: 1.8, pulseMinColor: '#dc2626', pulseMaxColor: '#16a34a', showGlow: false, glowColor: '#ffffff', glowStdDev: 2, animateDraw: true, animDurationMs: 600, animatePulse: true, pulseAnimDelay: 300, animateArea: false, areaAnimDuration: 800, animateValue: true, valueAnimDuration: 1000, animateDelta: false, deltaAnimDuration: 600, trendMode: 'line', trendCorners: 'sharp', lineColor: '#3f51b5', lineWidth: 1.5, areaColor: '#3f51b5', areaOpacity: 0.2, labelMaxWidthPct: 45, endLabelOffsetPx: 8, startLabelRightPadPx: 6, kpiAgg: 'last', kpiScope: 'full', secondaryKpiPosition: 'below', secondaryLabel: '', secondaryColor: '#94a3b8', secondaryFontSize: 16, secondaryFontFamily: 'Open Sans', trendWindowMode: 'lastNPoints', trendWindowPoints: 60, trendWindowDays: 180, showTooltip: true, showMinMax: true, labelsGapPx: 2, areaGradient: false, areaGradientType: 'vertical', areaGradStartColor: '#3f51b5', areaGradEndColor: '#3f51b5', areaGradStartOpacity: 0.2, areaGradEndOpacity: 0, showQuickButtons: true, button1Value: 12, button1Label: '12P', button2Value: 60, button2Label: '60P', button3Value: 365, button3Label: '1Y', buttonStyle: 'rounded', buttonBackgroundColor: 'rgba(255,255,255,0.1)', buttonLabelColor: '', buttonActiveColor: '#3b82f6', buttonActiveLabelColor: '#ffffff', defaultButton: 'button2', currentSelectedButton: 'button2', hoverValueScale: true, hoverLineThickness: true, hoverLineThicknessMultiplier: 1.5, darkMode: false, enableBackgroundCondition: false, backgroundConditionOperator: 'gt', backgroundConditionValue: 0, backgroundConditionValue2: 0, backgroundConditionColor: '#1f2937', progressMaxValue: 100, progressBarWidthPct: 100, configPresetAction: '', configPresetText: '' } };

	return {
		definition: properties,
		initialProperties: initialProperties
	};
});