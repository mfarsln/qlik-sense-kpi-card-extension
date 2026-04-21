/**
 * KPI Card Extension - Chart & Sparkline
 * Statistical regression, forecast generation, SVG helpers, and sparkline renderer.
 */
define(['jquery', './constants'], function ($, constantsModule) {
	'use strict';

	var CONSTANTS = constantsModule.CONSTANTS;

	// ── Regression & Forecast ──────────────────────────────────────────────────
	/**
	 * Performs simple linear regression on data points
	 */
	function linearRegression(data) {
		if (!data || data.length < 2) {
			return { slope: 0, intercept: 0, predict: function() { return 0; }, rSquared: 0, stdError: 0 };
		}

		var n = data.length;
		var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

		for (var i = 0; i < n; i++) {
			var x = i;
			var y = data[i][1];
			if (y === null || y === undefined || isNaN(y)) continue;
			sumX += x;
			sumY += y;
			sumXY += x * y;
			sumX2 += x * x;
			sumY2 += y * y;
		}

		var slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
		var intercept = (sumY - slope * sumX) / n;

		var meanY = sumY / n;
		var ssTotal = 0, ssResidual = 0;
		for (var j = 0; j < n; j++) {
			var yVal = data[j][1];
			if (yVal === null || yVal === undefined || isNaN(yVal)) continue;
			var predicted = slope * j + intercept;
			ssTotal += Math.pow(yVal - meanY, 2);
			ssResidual += Math.pow(yVal - predicted, 2);
		}
		var rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
		var stdError = Math.sqrt(ssResidual / Math.max(1, n - 2));

		return {
			slope: slope,
			intercept: intercept,
			rSquared: rSquared,
			stdError: stdError,
			predict: function(x) {
				return slope * x + intercept;
			}
		};
	}

	/**
	 * Polynomial Regression (Quadratic) - Captures curved trends
	 * Fits y = a + bx + cx²
	 * @param {Array} data - Array of [x, y] pairs
	 * @returns {Object} Coefficients and predict function
	 */
	function polynomialRegression(data, degree) {
		degree = degree || 2;
		if (!data || data.length < degree + 1) {
			return { coefficients: [0], predict: function(x) { return data && data.length > 0 ? data[data.length-1][1] : 0; }, stdError: 0 };
		}

		var n = data.length;
		var values = [];
		for (var i = 0; i < n; i++) {
			if (data[i][1] !== null && data[i][1] !== undefined && !isNaN(data[i][1])) {
				values.push({ x: i, y: data[i][1] });
			}
		}
		n = values.length;
		if (n < degree + 1) {
			return { coefficients: [0], predict: function() { return values.length > 0 ? values[values.length-1].y : 0; }, stdError: 0 };
		}

		// Build normal equations matrix for least squares
		var matrixSize = degree + 1;
		var matrix = [];
		var vector = [];

		for (var row = 0; row < matrixSize; row++) {
			matrix[row] = [];
			var sumY = 0;
			for (var col = 0; col < matrixSize; col++) {
				var sumX = 0;
				for (var k = 0; k < n; k++) {
					sumX += Math.pow(values[k].x, row + col);
				}
				matrix[row][col] = sumX;
			}
			for (var m = 0; m < n; m++) {
				sumY += values[m].y * Math.pow(values[m].x, row);
			}
			vector[row] = sumY;
		}

		// Gaussian elimination to solve the system
		var coefficients = gaussianElimination(matrix, vector);

		// Calculate standard error
		var ssResidual = 0;
		for (var p = 0; p < n; p++) {
			var predicted = 0;
			for (var q = 0; q < coefficients.length; q++) {
				predicted += coefficients[q] * Math.pow(values[p].x, q);
			}
			ssResidual += Math.pow(values[p].y - predicted, 2);
		}
		var stdError = Math.sqrt(ssResidual / Math.max(1, n - degree - 1));

		return {
			coefficients: coefficients,
			stdError: stdError,
			predict: function(x) {
				var result = 0;
				for (var c = 0; c < coefficients.length; c++) {
					result += coefficients[c] * Math.pow(x, c);
				}
				return result;
			}
		};
	}

	/**
	 * Gaussian elimination for solving linear systems
	 */
	function gaussianElimination(matrix, vector) {
		var n = vector.length;
		var augmented = [];
		for (var i = 0; i < n; i++) {
			augmented[i] = matrix[i].slice();
			augmented[i].push(vector[i]);
		}

		// Forward elimination
		for (var col = 0; col < n; col++) {
			// Find pivot
			var maxRow = col;
			for (var row = col + 1; row < n; row++) {
				if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
					maxRow = row;
				}
			}
			var temp = augmented[col];
			augmented[col] = augmented[maxRow];
			augmented[maxRow] = temp;

			if (Math.abs(augmented[col][col]) < 1e-10) continue;

			// Eliminate
			for (var r = col + 1; r < n; r++) {
				var factor = augmented[r][col] / augmented[col][col];
				for (var c = col; c <= n; c++) {
					augmented[r][c] -= factor * augmented[col][c];
				}
			}
		}

		// Back substitution
		var solution = new Array(n).fill(0);
		for (var i2 = n - 1; i2 >= 0; i2--) {
			if (Math.abs(augmented[i2][i2]) < 1e-10) {
				solution[i2] = 0;
				continue;
			}
			var sum = augmented[i2][n];
			for (var j = i2 + 1; j < n; j++) {
				sum -= augmented[i2][j] * solution[j];
			}
			solution[i2] = sum / augmented[i2][i2];
		}
		return solution;
	}

	/**
	 * Holt's Double Exponential Smoothing
	 * Captures both level and trend for more accurate forecasting
	 * @param {Array} data - Array of [x, y] pairs
	 * @param {number} alpha - Smoothing factor for level (0-1)
	 * @param {number} beta - Smoothing factor for trend (0-1)
	 * @returns {Object} Forecast function and parameters
	 */
	function holtExponentialSmoothing(data, alpha, beta) {
		alpha = alpha || 0.3;
		beta = beta || 0.1;

		if (!data || data.length < 2) {
			return {
				level: 0,
				trend: 0,
				predict: function() { return data && data.length > 0 ? data[data.length-1][1] : 0; },
				stdError: 0,
				smoothedValues: []
			};
		}

		var values = [];
		for (var i = 0; i < data.length; i++) {
			var v = data[i][1];
			if (v !== null && v !== undefined && !isNaN(v)) {
				values.push(v);
			}
		}

		if (values.length < 2) {
			return { level: values[0] || 0, trend: 0, predict: function() { return values[0] || 0; }, stdError: 0, smoothedValues: values };
		}

		// Initialize level and trend
		var level = values[0];
		var trend = values[1] - values[0];
		var smoothedValues = [level];
		var ssResidual = 0;

		// Apply Holt's smoothing
		for (var t = 1; t < values.length; t++) {
			var prevLevel = level;
			var prevTrend = trend;

			// Update level: L_t = α * Y_t + (1-α) * (L_{t-1} + T_{t-1})
			level = alpha * values[t] + (1 - alpha) * (prevLevel + prevTrend);

			// Update trend: T_t = β * (L_t - L_{t-1}) + (1-β) * T_{t-1}
			trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;

			smoothedValues.push(level);

			// Calculate residual for this point
			var predicted = prevLevel + prevTrend;
			ssResidual += Math.pow(values[t] - predicted, 2);
		}

		var stdError = Math.sqrt(ssResidual / Math.max(1, values.length - 2));

		return {
			level: level,
			trend: trend,
			stdError: stdError,
			smoothedValues: smoothedValues,
			predict: function(periodsAhead) {
				return level + trend * periodsAhead;
			}
		};
	}

	/**
	 * Weighted Moving Average - gives more weight to recent values
	 * @param {Array} data - Array of [x, y] pairs
	 * @param {number} periods - Number of periods
	 * @returns {Object} Forecast function
	 */
	function weightedMovingAverage(data, periods) {
		periods = periods || 5;
		if (!data || data.length < 2) {
			return { predict: function() { return data && data.length > 0 ? data[data.length-1][1] : 0; }, stdError: 0 };
		}

		var values = [];
		for (var i = 0; i < data.length; i++) {
			var v = data[i][1];
			if (v !== null && v !== undefined && !isNaN(v)) {
				values.push(v);
			}
		}

		var actualPeriods = Math.min(periods, values.length);
		var startIdx = values.length - actualPeriods;

		// Calculate weighted average with linear weights (more recent = higher weight)
		var weightSum = 0;
		var weightedSum = 0;
		for (var j = 0; j < actualPeriods; j++) {
			var weight = j + 1; // Weight increases linearly
			weightedSum += values[startIdx + j] * weight;
			weightSum += weight;
		}
		var wmAverage = weightedSum / weightSum;

		// Calculate trend from weighted values
		var trendSum = 0;
		for (var k = 1; k < actualPeriods; k++) {
			trendSum += (values[startIdx + k] - values[startIdx + k - 1]) * (k / actualPeriods);
		}
		var trend = trendSum / Math.max(1, actualPeriods - 1);

		// Calculate standard error
		var ssResidual = 0;
		for (var m = startIdx; m < values.length; m++) {
			var idx = m - startIdx;
			var predicted = wmAverage + trend * (idx - actualPeriods + 1);
			ssResidual += Math.pow(values[m] - predicted, 2);
		}
		var stdError = Math.sqrt(ssResidual / Math.max(1, actualPeriods));

		return {
			average: wmAverage,
			trend: trend,
			stdError: stdError,
			predict: function(periodsAhead) {
				return wmAverage + trend * periodsAhead;
			}
		};
	}

	/**
	 * ARIMA-like Simple Autoregressive Model (AR)
	 * Uses past values to predict future values
	 * @param {Array} data - Array of [x, y] pairs
	 * @param {number} order - AR order (number of lagged values to use)
	 * @returns {Object} Forecast function
	 */
	function autoRegressive(data, order) {
		order = order || 3;
		if (!data || data.length < order + 1) {
			return { predict: function() { return data && data.length > 0 ? data[data.length-1][1] : 0; }, stdError: 0, coefficients: [] };
		}

		var values = [];
		for (var i = 0; i < data.length; i++) {
			var v = data[i][1];
			if (v !== null && v !== undefined && !isNaN(v)) {
				values.push(v);
			}
		}

		if (values.length < order + 1) {
			return { predict: function() { return values[values.length-1] || 0; }, stdError: 0, coefficients: [] };
		}

		// Build design matrix and target vector for least squares
		var n = values.length - order;
		var X = [];
		var Y = [];

		for (var t = order; t < values.length; t++) {
			var row = [1]; // Intercept
			for (var lag = 1; lag <= order; lag++) {
				row.push(values[t - lag]);
			}
			X.push(row);
			Y.push(values[t]);
		}

		// Solve using normal equations: (X'X)^-1 * X'Y
		var XtX = [];
		var XtY = [];
		var cols = order + 1;

		for (var i2 = 0; i2 < cols; i2++) {
			XtX[i2] = [];
			var sumXtY = 0;
			for (var j = 0; j < cols; j++) {
				var sumXtX = 0;
				for (var k = 0; k < n; k++) {
					sumXtX += X[k][i2] * X[k][j];
				}
				XtX[i2][j] = sumXtX;
			}
			for (var k2 = 0; k2 < n; k2++) {
				sumXtY += X[k2][i2] * Y[k2];
			}
			XtY[i2] = sumXtY;
		}

		var coefficients = gaussianElimination(XtX, XtY);

		// Calculate standard error
		var ssResidual = 0;
		for (var m = 0; m < n; m++) {
			var predicted = 0;
			for (var c = 0; c < coefficients.length; c++) {
				predicted += coefficients[c] * X[m][c];
			}
			ssResidual += Math.pow(Y[m] - predicted, 2);
		}
		var stdError = Math.sqrt(ssResidual / Math.max(1, n - order - 1));

		return {
			coefficients: coefficients,
			stdError: stdError,
			lastValues: values.slice(-order),
			predict: function(periodsAhead, prevValues) {
				var vals = prevValues || this.lastValues.slice();
				var result = vals[vals.length - 1];

				for (var step = 0; step < periodsAhead; step++) {
					var predicted = coefficients[0]; // Intercept
					for (var lag = 1; lag <= order && lag <= vals.length; lag++) {
						predicted += coefficients[lag] * vals[vals.length - lag];
					}
					result = predicted;
					vals.push(predicted);
				}
				return result;
			},
			predictSequence: function(periodsAhead) {
				var vals = this.lastValues.slice();
				var results = [];

				for (var step = 0; step < periodsAhead; step++) {
					var predicted = coefficients[0];
					for (var lag = 1; lag <= order && lag <= vals.length; lag++) {
						predicted += coefficients[lag] * vals[vals.length - lag];
					}
					results.push(predicted);
					vals.push(predicted);
				}
				return results;
			}
		};
	}

	/**
	 * Generates forecast data points using selected method
	 * @param {Array} data - Original data array of [x, y] pairs
	 * @param {Object} props - Layout properties
	 * @returns {Object} Forecast data including points and confidence interval
	 */
	function generateForecastData(data, props) {
		if (!data || data.length < 3) return null;

		var forecastPeriods = props.forecastPeriods || 5;
		var method = props.forecastMethod || 'holt';
		var confidenceLevel = props.confidenceLevel || 80;

		var forecastPoints = [];
		var upperBound = [];
		var lowerBound = [];
		var lastDataIndex = data.length - 1;

		// Z-score for confidence interval
		var zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 90 ? 1.645 : 1.28;
		var model, predicted, interval, i;

		switch (method) {
			case 'linear':
				model = linearRegression(data);
				for (i = 1; i <= forecastPeriods; i++) {
					var x = lastDataIndex + i;
					predicted = model.predict(x);
					forecastPoints.push([x, predicted]);
					interval = zScore * model.stdError * Math.sqrt(1 + 1/data.length + Math.pow(i, 2) / (data.length * data.length / 12));
					upperBound.push([x, predicted + interval]);
					lowerBound.push([x, predicted - interval]);
				}
				break;

			case 'polynomial':
				model = polynomialRegression(data, 2);
				for (i = 1; i <= forecastPeriods; i++) {
					var px = lastDataIndex + i;
					predicted = model.predict(px);
					forecastPoints.push([px, predicted]);
					interval = zScore * model.stdError * Math.sqrt(1 + i * 0.5);
					upperBound.push([px, predicted + interval]);
					lowerBound.push([px, predicted - interval]);
				}
				break;

			case 'holt':
				model = holtExponentialSmoothing(data, 0.3, 0.1);
				for (i = 1; i <= forecastPeriods; i++) {
					predicted = model.predict(i);
					forecastPoints.push([lastDataIndex + i, predicted]);
					// Confidence interval widens with forecast horizon
					interval = zScore * model.stdError * Math.sqrt(i);
					upperBound.push([lastDataIndex + i, predicted + interval]);
					lowerBound.push([lastDataIndex + i, predicted - interval]);
				}
				break;

			case 'weightedMA':
				model = weightedMovingAverage(data, 5);
				for (i = 1; i <= forecastPeriods; i++) {
					predicted = model.predict(i);
					forecastPoints.push([lastDataIndex + i, predicted]);
					interval = zScore * model.stdError * Math.sqrt(1 + i * 0.3);
					upperBound.push([lastDataIndex + i, predicted + interval]);
					lowerBound.push([lastDataIndex + i, predicted - interval]);
				}
				break;

			case 'autoRegressive':
				model = autoRegressive(data, 3);
				var arPredictions = model.predictSequence(forecastPeriods);
				for (i = 0; i < forecastPeriods; i++) {
					predicted = arPredictions[i];
					forecastPoints.push([lastDataIndex + i + 1, predicted]);
					interval = zScore * model.stdError * Math.sqrt(1 + (i + 1) * 0.4);
					upperBound.push([lastDataIndex + i + 1, predicted + interval]);
					lowerBound.push([lastDataIndex + i + 1, predicted - interval]);
				}
				break;

			default: // Fallback to Holt
				model = holtExponentialSmoothing(data, 0.3, 0.1);
				for (i = 1; i <= forecastPeriods; i++) {
					predicted = model.predict(i);
					forecastPoints.push([lastDataIndex + i, predicted]);
					interval = zScore * model.stdError * Math.sqrt(i);
					upperBound.push([lastDataIndex + i, predicted + interval]);
					lowerBound.push([lastDataIndex + i, predicted - interval]);
				}
		}

		return {
			points: forecastPoints,
			upperBound: upperBound,
			lowerBound: lowerBound,
			startPoint: [lastDataIndex, data[lastDataIndex][1]],
			method: method
		};
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

	/**
	 * Builds a stepped/staircase path for the sparkline
	 * @param {Array} points - Array of [x, y] points
	 * @returns {string} SVG path data string
	 */
	function buildSteppedPath(points) {
		if (!points.length) return '';

		let pathData = '';
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

			// Stepped: horizontal then vertical
			pathData += ' H' + point[0];
			pathData += ' V' + point[1];
			prevPoint = point;
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

		// Force height recalculation if height is 0 or very small
		if (!height || height < 10) {
			$container.css('height', '100%');
			height = $container.parent().height() || $container.height();
		}

		// Minimum dimensions for rendering (allow very small but not zero)
		if (!width || width < 10 || !height || height < 10) return;
		
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
		svg.setAttribute('style', 'pointer-events:auto;display:block;');
		
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
		
		
	let barGradFillId = null;
	if (opts && opts.barGradient && opts.mode === 'bar') {
		var _bgId = 'barGrad-' + Math.random().toString(36).substr(2, 6);
		var _bg = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
		_bg.setAttribute('id', _bgId);
		_bg.setAttribute('x1', '0'); _bg.setAttribute('y1', '0');
		_bg.setAttribute('x2', '0'); _bg.setAttribute('y2', '1');
		var _s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		_s1.setAttribute('offset', '0%');
		_s1.setAttribute('stop-color', opts.barGradientStart || opts.lineColor || 'currentColor');
		var _s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
		_s2.setAttribute('offset', '100%');
		_s2.setAttribute('stop-color', opts.barGradientEnd || opts.lineColor || 'currentColor');
		_bg.appendChild(_s1); _bg.appendChild(_s2);
		defs.appendChild(_bg);
		barGradFillId = 'url(#' + _bgId + ')';
	}
	if (defs.childNodes.length) svg.appendChild(defs);

		const mode = opts && opts.mode ? opts.mode : 'line';

		// Handle different sparkline modes
		if (mode === 'bar') {
			// Bar Chart Mode
			const barWidth = Math.max(2, (w / dataPairs.length) * 0.7);
			const barGap = (w / dataPairs.length) * 0.15;
			const baseY = h + paddingObj.top;

			// Find min and max values for coloring
			let minVal = Infinity, maxVal = -Infinity;
			let minIdx = -1, maxIdx = -1;
			for (let k = 0; k < dataPairs.length; k++) {
				const v = dataPairs[k][1];
				if (v === null || v === undefined || isNaN(v)) continue;
				if (v < minVal) { minVal = v; minIdx = k; }
				if (v > maxVal) { maxVal = v; maxIdx = k; }
			}

			// Define min/max colors
			const minBarColor = '#ef4444'; // Red for minimum
			const maxBarColor = '#22c55e'; // Green for maximum
			const normalBarColor = opts.lineColor || 'currentColor';

			const barFillNormal = barGradFillId || normalBarColor;

			for (let i = 0; i < dataPairs.length; i++) {
				const val = dataPairs[i][1];
				if (val === null || val === undefined || isNaN(val)) continue;

				const barHeight = Math.max(2, ((val - minY) / (maxY - minY)) * h);
				const barX = (i / dataPairs.length) * w + barGap;
				const barY = baseY - barHeight;

				// Determine bar color based on min/max (only when showBarMinMax enabled)
				let barColor = barFillNormal;
				let barOpacity = '0.8';
				if (opts.showBarMinMax && i === maxIdx && minIdx !== maxIdx) {
					barColor = maxBarColor;
					barOpacity = '1';
				} else if (opts.showBarMinMax && i === minIdx && minIdx !== maxIdx) {
					barColor = minBarColor;
					barOpacity = '1';
				}

				const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				rect.setAttribute('x', String(barX));
				rect.setAttribute('y', String(barY));
				rect.setAttribute('width', String(barWidth));
				rect.setAttribute('height', String(barHeight));
				rect.setAttribute('fill', barColor);
				rect.setAttribute('opacity', barOpacity);
				rect.setAttribute('rx', '2');
				rect.setAttribute('ry', '2');

				if (opts && opts.animateDraw) {
					rect.style.transform = 'scaleY(0)';
					rect.style.transformOrigin = 'bottom';
					rect.style.transition = `transform ${opts.animDurationMs || 500}ms ease ${i * 30}ms`;
					setTimeout(() => { rect.style.transform = 'scaleY(1)'; }, 10);
				}

				svg.appendChild(rect);
			}
		} else if (mode === 'dots') {
			// Dot Plot Mode
			const dotRadius = Math.max(3, Math.min(8, h / 10));

			for (let i = 0; i < points.length; i++) {
				const [px, py] = points[i];
				if (py === null) continue;

				const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				circle.setAttribute('cx', String(px));
				circle.setAttribute('cy', String(py));
				circle.setAttribute('r', String(dotRadius));
				circle.setAttribute('fill', opts.lineColor || 'currentColor');
				circle.setAttribute('opacity', '0.9');

				if (opts && opts.animateDraw) {
					circle.style.transform = 'scale(0)';
					circle.style.transformOrigin = 'center';
					circle.style.transition = `transform ${opts.animDurationMs || 500}ms ease ${i * 50}ms`;
					setTimeout(() => { circle.style.transform = 'scale(1)'; }, 10);
				}

				svg.appendChild(circle);
			}

			// Optional: Connect dots with faint line
			if (points.length > 1) {
				const connectPath = buildPath(points, false);
				if (connectPath) {
					const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					line.setAttribute('d', connectPath);
					line.setAttribute('stroke', opts.lineColor || 'currentColor');
					line.setAttribute('stroke-width', '1');
					line.setAttribute('stroke-opacity', '0.3');
					line.setAttribute('fill', 'none');
					svg.insertBefore(line, svg.firstChild);
				}
			}
		} else if (mode === 'stepped') {
			// Stepped Line Mode
			const steppedPath = buildSteppedPath(points);
			if (steppedPath) {
				const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				path.setAttribute('d', steppedPath);
				path.setAttribute('stroke', opts.lineColor || 'currentColor');
				path.setAttribute('stroke-width', String(opts.lineWidth || 2));
				path.setAttribute('fill', 'none');
				path.setAttribute('stroke-linecap', 'square');

				if (opts && opts.showGlow) {
					path.setAttribute('filter', 'url(#' + CONSTANTS.FILTER_ID + ')');
				}

				if (opts && opts.animateDraw) {
					const len = path.getTotalLength ? path.getTotalLength() : 0;
					if (len > 0) {
						path.style.strokeDasharray = String(len);
						path.style.strokeDashoffset = String(len);
						path.style.transition = `stroke-dashoffset ${opts.animDurationMs || 500}ms ease`;
						setTimeout(() => { path.style.strokeDashoffset = '0'; }, 10);
					}
				}

				svg.appendChild(path);
			}
		} else {
			// Line or Area Mode (original behavior)
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
			if (mode === 'area' && pathData) {
				const area = createAreaPath(document, pathData, points, h, paddingObj.top, opts, gradId);
				if (area) {
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
		}

		// Create min/max markers (for all modes except bar)
		if (mode !== 'bar') {
			const markers = createMinMaxMarkers(document, dataPairs, points, opts);
			markers.forEach(marker => svg.appendChild(marker));
		}

		// Add forecast line if enabled (for line, area, stepped modes)
		if (opts && opts.showForecast && (mode === 'line' || mode === 'area' || mode === 'stepped') && dataPairs.length > 3) {
			const forecastData = generateForecastData(dataPairs, opts);
			if (forecastData && forecastData.points.length > 0) {
				// Calculate forecast extension - forecast extends BEYOND actual data
				// Allocate 25% of the total width for forecast area
				const forecastRatio = 0.25;
				const actualDataWidth = w * (1 - forecastRatio);  // 75% for actual data
				const forecastWidth = w * forecastRatio;  // 25% for forecast

				// Last actual data point X position (at the end of actual data area)
				var lastActualX = actualDataWidth;

				// Scale for forecast X positions (starts from lastActualX, extends to w)
				const forecastXScale = function(forecastIdx) {
					if (forecastData.points.length === 1) return lastActualX + forecastWidth / 2;
					return lastActualX + ((forecastIdx + 1) / forecastData.points.length) * forecastWidth;
				};

				// Recalculate yScale to include forecast values
				let forecastMinY = minY, forecastMaxY = maxY;
				for (var fi = 0; fi < forecastData.points.length; fi++) {
					var fv = forecastData.points[fi][1];
					if (fv < forecastMinY) forecastMinY = fv;
					if (fv > forecastMaxY) forecastMaxY = fv;
				}
				// Include confidence bounds in Y scale
				if (forecastData.upperBound) {
					for (var fui = 0; fui < forecastData.upperBound.length; fui++) {
						if (forecastData.upperBound[fui][1] > forecastMaxY) forecastMaxY = forecastData.upperBound[fui][1];
						if (forecastData.lowerBound[fui][1] < forecastMinY) forecastMinY = forecastData.lowerBound[fui][1];
					}
				}

				const extendedYScale = function(v) {
					if (forecastMinY === forecastMaxY) return (h / 2 + paddingObj.top);
					return (h - ((v - forecastMinY) / (forecastMaxY - forecastMinY)) * h) + paddingObj.top;
				};

				// Recalculate actual data points with new Y scale and compressed X scale
				const actualXScale = function(i) {
					if (dataPairs.length === 1) return actualDataWidth / 2;
					return (i / (dataPairs.length - 1)) * actualDataWidth;
				};

				// We need to rebuild the actual data path with the new scales
				// First, update the existing path/area elements
				const actualPoints = [];
				for (var ai = 0; ai < dataPairs.length; ai++) {
					var av = dataPairs[ai][1];
					var ayv = (av === null || av === undefined || isNaN(av)) ? null : extendedYScale(av);
					actualPoints.push([actualXScale(ai), ayv]);
				}

				// Rebuild actual data visualization with new scale
				// Remove old path/area and create new ones
				var oldPaths = svg.querySelectorAll('path:not(.kpi-card__forecast-line):not(.kpi-card__confidence-interval)');
				oldPaths.forEach(function(p) { p.remove(); });

				// Recreate the main line/area with adjusted scale
				if (mode === 'area') {
					var areaPathData = buildPath(actualPoints, true, h + paddingObj.top);
					if (areaPathData) {
						var newAreaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
						newAreaPath.setAttribute('d', areaPathData);
						newAreaPath.setAttribute('fill', gradId ? 'url(#' + gradId + ')' : (opts.areaColor || 'currentColor'));
						newAreaPath.setAttribute('fill-opacity', String(opts.areaOpacity || 0.3));
						newAreaPath.setAttribute('stroke', 'none');
						svg.insertBefore(newAreaPath, svg.firstChild);
					}
				}

				var linePathData = buildPath(actualPoints, false);
				if (linePathData) {
					var newLinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					newLinePath.setAttribute('d', linePathData);
					newLinePath.setAttribute('stroke', opts.lineColor || 'currentColor');
					newLinePath.setAttribute('stroke-width', String(opts.lineWidth || 1.5));
					newLinePath.setAttribute('fill', 'none');
					newLinePath.setAttribute('stroke-linecap', 'round');
					newLinePath.setAttribute('stroke-linejoin', 'round');
					if (opts.showGlow) {
						newLinePath.setAttribute('filter', 'url(#' + CONSTANTS.FILTER_ID + ')');
					}
					svg.appendChild(newLinePath);
				}

				// Update min/max markers positions
				var oldMarkers = svg.querySelectorAll('.' + CONSTANTS.PULSE_CLASS);
				oldMarkers.forEach(function(m) { m.remove(); });

				// Recreate markers with new positions
				const newMarkers = createMinMaxMarkers(document, dataPairs, actualPoints, opts);
				newMarkers.forEach(function(marker) { svg.appendChild(marker); });

				// Build forecast points starting from last actual data point
				const forecastPoints = [];
				var lastActualY = extendedYScale(dataPairs[dataPairs.length - 1][1]);
				forecastPoints.push([lastActualX, lastActualY]);

				for (var fj = 0; fj < forecastData.points.length; fj++) {
					var fx = forecastXScale(fj);
					var fy = extendedYScale(forecastData.points[fj][1]);
					forecastPoints.push([fx, fy]);
				}

				// Determine forecast line style
				var forecastLineStyle = opts.forecastLineStyle || 'dashed';
				var strokeDasharray = forecastLineStyle === 'dashed' ? '8,4' : (forecastLineStyle === 'dotted' ? '2,4' : 'none');

				// Determine forecast color
				var forecastColor = opts.forecastUseThemeColor !== false ? (opts.lineColor || '#f59e0b') : (opts.forecastColor || '#f59e0b');
				var forecastOpacity = opts.forecastOpacity || 0.7;

				// Create forecast path
				var forecastPathData = buildPath(forecastPoints, false);
				if (forecastPathData) {
					var forecastPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					forecastPath.setAttribute('d', forecastPathData);
					forecastPath.setAttribute('stroke', forecastColor);
					forecastPath.setAttribute('stroke-width', String((opts.lineWidth || 1.5) * 0.8));
					forecastPath.setAttribute('stroke-opacity', String(forecastOpacity));
					forecastPath.setAttribute('fill', 'none');
					forecastPath.setAttribute('stroke-linecap', 'round');
					forecastPath.setAttribute('class', 'kpi-card__forecast-line');
					if (strokeDasharray !== 'none') {
						forecastPath.setAttribute('stroke-dasharray', strokeDasharray);
					}
					svg.appendChild(forecastPath);

					// Add forecast endpoint marker
					var lastForecastPoint = forecastPoints[forecastPoints.length - 1];
					var forecastEndMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
					forecastEndMarker.setAttribute('cx', String(lastForecastPoint[0]));
					forecastEndMarker.setAttribute('cy', String(lastForecastPoint[1]));
					forecastEndMarker.setAttribute('r', '4');
					forecastEndMarker.setAttribute('fill', forecastColor);
					forecastEndMarker.setAttribute('opacity', String(forecastOpacity));
					forecastEndMarker.setAttribute('class', 'kpi-card__forecast-marker');
					svg.appendChild(forecastEndMarker);
				}

				// Draw confidence interval if enabled
				if (opts.showConfidenceInterval && forecastData.upperBound && forecastData.upperBound.length > 0) {
					var upperPoints = [[lastActualX, lastActualY]];
					var lowerPoints = [[lastActualX, lastActualY]];

					for (var ci = 0; ci < forecastData.upperBound.length; ci++) {
						var ux = forecastXScale(ci);
						var uy = extendedYScale(forecastData.upperBound[ci][1]);
						var ly = extendedYScale(forecastData.lowerBound[ci][1]);
						upperPoints.push([ux, uy]);
						lowerPoints.push([ux, ly]);
					}

					// Create confidence area path
					var areaPath = 'M' + upperPoints[0][0] + ',' + upperPoints[0][1];
					for (var ui = 1; ui < upperPoints.length; ui++) {
						areaPath += ' L' + upperPoints[ui][0] + ',' + upperPoints[ui][1];
					}
					for (var li = lowerPoints.length - 1; li >= 0; li--) {
						areaPath += ' L' + lowerPoints[li][0] + ',' + lowerPoints[li][1];
					}
					areaPath += ' Z';

					var confidenceArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					confidenceArea.setAttribute('d', areaPath);
					confidenceArea.setAttribute('fill', forecastColor);
					confidenceArea.setAttribute('fill-opacity', '0.15');
					confidenceArea.setAttribute('stroke', 'none');
					confidenceArea.setAttribute('class', 'kpi-card__confidence-interval');
					svg.insertBefore(confidenceArea, svg.firstChild);
				}

				// Add a visual separator line between actual and forecast
				var separatorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				separatorLine.setAttribute('x1', String(lastActualX));
				separatorLine.setAttribute('y1', String(paddingObj.top));
				separatorLine.setAttribute('x2', String(lastActualX));
				separatorLine.setAttribute('y2', String(h + paddingObj.top));
				separatorLine.setAttribute('stroke', opts.lineColor || '#94a3b8');
				separatorLine.setAttribute('stroke-width', '1');
				separatorLine.setAttribute('stroke-opacity', '0.3');
				separatorLine.setAttribute('stroke-dasharray', '4,4');
				separatorLine.setAttribute('class', 'kpi-card__forecast-separator');
				svg.insertBefore(separatorLine, svg.firstChild);
			}
		}

		// Add SVG to container
		$container.empty().append(svg);
		
		// Create tooltip
		createTooltip($container, svg, dataPairs, points, w, opts);
	}
	return {
		linearRegression: linearRegression,
		polynomialRegression: polynomialRegression,
		gaussianElimination: gaussianElimination,
		holtExponentialSmoothing: holtExponentialSmoothing,
		weightedMovingAverage: weightedMovingAverage,
		autoRegressive: autoRegressive,
		generateForecastData: generateForecastData,
		animateCounter: animateCounter,
		computeAggregate: computeAggregate,
		filterByWindow: filterByWindow,
		buildPath: buildPath,
		buildSteppedPath: buildSteppedPath,
		createGlowFilter: createGlowFilter,
		createAreaGradient: createAreaGradient,
		createSparklinePath: createSparklinePath,
		createAreaPath: createAreaPath,
		createMinMaxMarkers: createMinMaxMarkers,
		createTooltip: createTooltip,
		buildSparkline: buildSparkline
	};
});
