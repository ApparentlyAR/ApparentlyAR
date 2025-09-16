// Lightweight API client for backend endpoints

const BASE_HEADERS = { 'Content-Type': 'application/json' };

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

export async function getTestData(type) {
	return httpJson(`/api/test-data/${type}`);
}

export async function processData(data, operations = []) {
	return httpJson('/api/process-data', {
		method: 'POST',
		headers: BASE_HEADERS,
		body: JSON.stringify({ data, operations })
	});
}

export async function generateChart(data, chartType, options = {}) {
	return httpJson('/api/generate-chart', {
		method: 'POST',
		headers: BASE_HEADERS,
		body: JSON.stringify({ data, chartType, options })
	});
}

export async function generateArVisualization(data, visualizationType, markerId) {
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
		generateChart,
		generateArVisualization
	};
}
