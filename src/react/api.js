/**
 * Frontend API client for communicating with the backend
 * 
 * Centralizes all backend API calls for the React frontend, providing
 * a clean interface for data processing, chart generation, and AR visualization.
 * All functions return promises and handle errors consistently.
 * 
 * @module FrontendAPI
 * @version 1.0.0
 * @since 1.0.0
 */

const BASE_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Generic HTTP JSON request handler
 * 
 * @private
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} When request fails or response is not ok
 */
async function httpJson(path, options = {}) {
	const res = await fetch(path, options);
	let json = null;
	try {
		json = await res.json();
	} catch (_) {
		// ignore json parse errors; leave json as null
	}
	if (!res.ok) {
		const message = (json && json.error) || `Request failed: ${res.status}`;
		throw new Error(message);
	}
	return json;
}

/**
 * Get test data from backend
 * 
 * Retrieves sample datasets for development and testing purposes.
 * Supports three types: 'students', 'weather', and 'sales'.
 * 
 * @param {string} type - Type of test data ('students', 'weather', 'sales')
 * @returns {Promise<Object>} Test data response with success flag, data array, and summary
 * @throws {Error} When API request fails or invalid type is provided
 * 
 * @example
 * // Get student data
 * const result = await getTestData('students');
 * console.log(result.data); // Array of student objects
 * 
 * @since 1.0.0
 */
async function getTestData(type) {
	return httpJson(`/api/test-data/${type}`);
}

/**
 * Process data through backend operations
 * 
 * Sends data and a series of operations to the backend for processing.
 * Operations include filtering, sorting, grouping, aggregation, and calculations.
 * This offloads heavy data processing from the client to improve performance.
 * 
 * @param {Array} data - Input data array to process
 * @param {Array} operations - Array of operation objects with type and params
 * @returns {Promise<Object>} Processed data response with success flag and processed data
 * @throws {Error} When API request fails or operations are invalid
 * 
 * @example
 * // Filter and sort data
 * const operations = [
 *   { type: 'filter', params: { column: 'age', operator: 'greater_than', value: 20 } },
 *   { type: 'sort', params: { column: 'score', direction: 'desc' } }
 * ];
 * const result = await processData(data, operations);
 * 
 * @since 1.0.0
 */
async function processData(data, operations = []) {
	return httpJson('/api/process-data', {
		method: 'POST',
		headers: BASE_HEADERS,
		body: JSON.stringify({ data, operations })
	});
}

/**
 * Save processed data to CSV on the server
 * @param {Array} data - rows to persist
 * @param {string} filename - base filename (will be sanitized)
 * @param {boolean} overwrite - whether to overwrite if file exists
 */
async function saveCsv(data, filename, overwrite = true) {
  return httpJson('/api/save-csv', {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ data, filename, overwrite })
  });
}

async function getCsv(filename) {
  return httpJson(`/api/get-csv/${encodeURIComponent(filename)}`, {
    method: 'GET',
    headers: BASE_HEADERS
  });
}

/**
 * Generate chart configuration from data
 * 
 * Creates chart configurations for various chart types using the backend
 * chart generation service. Supports all chart types including bar, line,
 * scatter, pie, doughnut, area, histogram, heatmap, and radar.
 * 
 * @param {Array} data - Data to visualize
 * @param {string} chartType - Type of chart to generate
 * @param {Object} options - Chart-specific options (xColumn, yColumn, title, etc.)
 * @returns {Promise<Object>} Chart configuration object ready for rendering
 * @throws {Error} When API request fails or chart type is unsupported
 * 
 * @example
 * // Generate a bar chart
 * const config = await generateChart(data, 'bar', {
 *   xColumn: 'month',
 *   yColumn: 'sales',
 *   title: 'Monthly Sales'
 * });
 * 
 * @since 1.0.0
 */
async function generateChart(data, chartType, options = {}) {
	return httpJson('/api/generate-chart', {
		method: 'POST',
		headers: BASE_HEADERS,
		body: JSON.stringify({ data, chartType, options })
	});
}

/**
 * Generate AR-specific visualization data
 * 
 * Creates AR-optimized visualization data for augmented reality rendering.
 * Includes marker positioning and AR-specific chart configurations.
 * 
 * @param {Array} data - Data to visualize in AR
 * @param {string} visualizationType - Type of visualization for AR
 * @param {string} markerId - AR marker identifier for positioning
 * @returns {Promise<Object>} AR visualization data with marker positioning
 * @throws {Error} When API request fails or visualization type is unsupported
 * 
 * @example
 * // Generate AR bar chart
 * const arData = await generateArVisualization(data, 'bar', 'marker-001');
 * 
 * @since 1.0.0
 */
async function generateArVisualization(data, visualizationType, markerId) {
	return httpJson('/api/ar-visualization', {
		method: 'POST',
		headers: BASE_HEADERS,
		body: JSON.stringify({ data, visualizationType, markerId })
	});
}

// Expose for any vanilla JS usage if needed
if (typeof window !== 'undefined') {
	window.AppApi = {
		getTestData,
		processData,
    saveCsv,
    getCsv,
		generateChart,
		generateArVisualization
	};
}
