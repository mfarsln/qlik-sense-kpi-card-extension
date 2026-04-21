/**
 * KPI Card Extension - Formatters & Utilities
 * Number formatting, date formatting, color helpers, markup utilities,
 * session storage helpers, and preset serialization.
 */
define(['qlik', './constants'], function (qlik, constantsModule) {
	'use strict';

	var CONSTANTS = constantsModule.CONSTANTS;
	var PRESET_ALLOWED_KEYS = constantsModule.PRESET_ALLOWED_KEYS;

	// ── Session Storage ───────────────────────────────────────────────────────
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

	// ── Markup Utilities ──────────────────────────────────────────────────────
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

	// ── Preset Helpers ────────────────────────────────────────────────────────
	function sanitizePresetProps(props) {
		const snapshot = {};
		if (!props) return snapshot;
		PRESET_ALLOWED_KEYS.forEach(function (key) {
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
		PRESET_ALLOWED_KEYS.forEach(function (key) {
			if (Object.prototype.hasOwnProperty.call(preset, key)) {
				targetProps[key] = preset[key];
			}
		});
	}

	// ── Number Formatting ─────────────────────────────────────────────────────
	/**
	 * Formats a number with thousand separators and decimal places.
	 */
	function formatWithSeparators(value, decimals, decSep, thousSep) {
		var isNeg = value < 0;
		var parts = Math.abs(value).toFixed(decimals).split('.');
		if (thousSep) {
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousSep);
		}
		var result = parts.length > 1 ? parts[0] + decSep + parts[1] : parts[0];
		if (isNeg) result = '-' + result;
		return result;
	}

	/**
	 * Extracts decimal places count from a format pattern string.
	 */
	function extractDecimalsFromFmt(fmt, defaultVal) {
		if (!fmt) return defaultVal;
		var match = fmt.match(/\.([0#]+)/);
		if (match) return match[1].length;
		return defaultVal;
	}

	/**
	 * Formats a number using short suffixes (K, M, B, T).
	 */
	function formatShort(value, decimals) {
		var absVal = Math.abs(value);
		var sign = value < 0 ? '-' : '';
		if (absVal >= 1e12) return sign + (absVal / 1e12).toFixed(decimals) + 'T';
		if (absVal >= 1e9)  return sign + (absVal / 1e9).toFixed(decimals) + 'B';
		if (absVal >= 1e6)  return sign + (absVal / 1e6).toFixed(decimals) + 'M';
		if (absVal >= 1e3)  return sign + (absVal / 1e3).toFixed(decimals) + 'K';
		if (absVal === 0) return '0';
		if (absVal < 1) return value.toFixed(Math.max(decimals, 2));
		return value.toFixed(decimals);
	}

	/**
	 * Formats a number value using the Qlik measure's native format definition.
	 */
	function formatNumber(value, qMeasureInfo) {
		if (value === null || value === undefined) return '-';
		if (typeof value !== 'number' || !isFinite(value)) return String(value);

		var numFmt   = (qMeasureInfo && qMeasureInfo.qNumFormat) || {};
		var fmtType  = numFmt.qType  || 'U';
		var fmt      = numFmt.qFmt   || '';
		var nDec     = numFmt.qnDec;
		var decSep   = numFmt.qDec   || '.';
		var thousSep = numFmt.qThou  || ',';
		var useThou  = numFmt.qUseThou !== undefined ? (numFmt.qUseThou === 1 || numFmt.qUseThou === true) : true;
		if (!useThou) thousSep = '';

		// Try Qlik's native formatting first
		if (fmt) {
			try {
				if (typeof qlik !== 'undefined' && qlik && qlik.formatNumber) {
					var qlikFormatted = qlik.formatNumber(value, fmt);
					if (qlikFormatted && qlikFormatted !== 'NaN' && qlikFormatted !== 'undefined' && qlikFormatted !== '') {
						return qlikFormatted;
					}
				}
			} catch (e) { /* fall through to manual */ }
		}

		// Percentage format
		if (fmt.indexOf('%') !== -1) {
			var scaled = value * 100;
			var pctDec = (nDec !== undefined && nDec >= 0) ? nDec : extractDecimalsFromFmt(fmt, 0);
			return formatWithSeparators(scaled, pctDec, decSep, thousSep) + '%';
		}

		// Auto / Unknown format — use short format (K/M/B) for large numbers
		if (fmtType === 'U' || (!fmt && fmtType !== 'F' && fmtType !== 'I' && fmtType !== 'M' && fmtType !== 'R')) {
			var absValAuto = Math.abs(value);
			var autoDec = absValAuto >= 1000
				? Math.max(2, (nDec !== undefined && nDec >= 0) ? nDec : 2)
				: ((nDec !== undefined && nDec >= 0) ? nDec : 0);
			return formatShort(value, autoDec);
		}

		// Integer format
		if (fmtType === 'I') {
			return formatWithSeparators(value, 0, decSep, thousSep);
		}

		// Fixed / Money / Real
		var decimals = (nDec !== undefined && nDec >= 0) ? nDec : extractDecimalsFromFmt(fmt, 2);
		var result = formatWithSeparators(value, decimals, decSep, thousSep);

		if (fmt) {
			var prefixMatch = fmt.match(/^([^#0,.\-\s]+)/);
			var suffixMatch = fmt.match(/([^#0,.%\s]+)$/);
			if (prefixMatch && prefixMatch[1] !== '-') result = (value < 0 ? '-' : '') + prefixMatch[1] + result.replace(/^-/, '');
			else if (suffixMatch) result = result + suffixMatch[1];
		}

		return result;
	}

	/**
	 * Formats a value using custom format settings from measure properties.
	 */
	function formatWithCustomSettings(value, customFmt, qMeasureInfo) {
		if (value === null || value === undefined) return '-';
		if (typeof value !== 'number' || !isFinite(value)) return String(value);

		// If no custom format or set to 'auto', use smart formatting
		if (!customFmt || customFmt.type === 'auto') {
			// For large values always abbreviate (K/M/B/T) with 2 decimal places.
			if (Math.abs(value) >= 1000) {
				return formatShort(value, 2);
			}
			return formatNumber(value, qMeasureInfo);
		}

		var dec      = customFmt.decimals !== undefined ? customFmt.decimals : 2;
		var thousSep = customFmt.useThousandSep ? ',' : '';
		var prefix   = customFmt.prefix || '';
		var suffix   = customFmt.suffix || '';

		if (customFmt.type === 'percent') {
			var scaledPct = Math.abs(value) <= 1 ? value * 100 : value;
			var pctResult = formatWithSeparators(scaledPct, dec, '.', thousSep);
			return prefix + pctResult + '%' + suffix;
		}

		var result = formatWithSeparators(value, dec, '.', thousSep);
		return prefix + result + suffix;
	}

	// ── Date & Color Utilities ─────────────────────────────────────────────────
	function formatDate(label) {
		return label || '';
	}

	function hexToRgba(hex, alpha) {
		if (!hex) return 'rgba(59, 130, 246, ' + alpha + ')';
		if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
			var match = hex.match(/[\d.]+/g);
			if (match && match.length >= 3) {
				return 'rgba(' + match[0] + ', ' + match[1] + ', ' + match[2] + ', ' + alpha + ')';
			}
			return 'rgba(59, 130, 246, ' + alpha + ')';
		}
		if (hex.length < 7) return 'rgba(59, 130, 246, ' + alpha + ')';
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
	}

	return {
		getSessionKey:              getSessionKey,
		saveSelectedButton:         saveSelectedButton,
		getSelectedButton:          getSelectedButton,
		decodeCustomMarkup:         decodeCustomMarkup,
		sanitizeSvgMarkup:          sanitizeSvgMarkup,
		sanitizePresetProps:        sanitizePresetProps,
		serializePresetProps:       serializePresetProps,
		parsePresetText:            parsePresetText,
		applyPresetToProps:         applyPresetToProps,
		formatWithSeparators:       formatWithSeparators,
		extractDecimalsFromFmt:     extractDecimalsFromFmt,
		formatShort:                formatShort,
		formatNumber:               formatNumber,
		formatWithCustomSettings:   formatWithCustomSettings,
		formatDate:                 formatDate,
		hexToRgba:                  hexToRgba
	};
});
