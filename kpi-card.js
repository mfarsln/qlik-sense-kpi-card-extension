/*
	KPI Card extension for Qlik Sense
	- Accepts exactly one measure for the KPI value and trend
	- Requires one date dimension (used only for the sparkline trend)
	- Renders sparkline without axes; shows only start/end date labels
*/

define([
	'jquery',
	'text!./styles.css',
	'./modules/constants',
	'./modules/controller',
	'./modules/properties'
], function ($, stylesCss, constantsModule, controller, propsModule) {
	'use strict';

	var CONSTANTS = constantsModule.CONSTANTS;

	// ── CSS Injection ─────────────────────────────────────────────────────────
	$('<style>').html(stylesCss + '\n' +
		'.kpi-tooltip{position:absolute;pointer-events:none;z-index:2;background:' + CONSTANTS.DEFAULT_TOOLTIP_BACKGROUND + ';color:' + CONSTANTS.DEFAULT_TOOLTIP_COLOR + ';padding:' + CONSTANTS.DEFAULT_TOOLTIP_PADDING + ';border-radius:' + CONSTANTS.DEFAULT_TOOLTIP_BORDER_RADIUS + 'px;font-size:' + CONSTANTS.DEFAULT_TOOLTIP_FONT_SIZE + 'px;white-space:nowrap;transform:translate(-50%,-120%);}\n' +
		'@keyframes kpi-pulse{0%{opacity:.9}50%{opacity:.35}100%{opacity:.9}}\n' +
		'.kpi-pulse{animation:kpi-pulse 1.6s infinite ease-in-out;}\n' +
		'/* Force remove Qlik theme borders */\n' +
		'.qv-object[data-qv-object="kpi-card"],.qv-object[data-qv-object="kpi-card"] *,.qv-object[data-qv-object="kpi-card"] .qv-object-content,.qv-object[data-qv-object="kpi-card"] .qv-object-body{border:none!important;outline:none!important;box-shadow:none!important;background:transparent!important;}\n' +
		'.lv-object[data-qv-object="kpi-card"],.lv-object[data-qv-object="kpi-card"] *,.lv-object[data-qv-object="kpi-card"] .lv-object-content{border:none!important;outline:none!important;box-shadow:none!important;background:transparent!important;}\n'
	).appendTo('head');

	// ── Qlik Extension Export ─────────────────────────────────────────────────
	return {
		initialProperties: propsModule.initialProperties,
		definition: propsModule.definition,
		support: { snapshot: true, export: true, exportData: true },

		paint: function ($element, layout) {
			return controller.paintExtension(this, $element, layout);
		},

		resize: function ($element, layout) {
			return controller.resizeExtension(this, $element, layout);
		}
	};
});
