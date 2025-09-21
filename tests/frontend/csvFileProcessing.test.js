const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const request = require('supertest');
const app = require('../../server');

/**
 * CSV file processing test
 * - Looks for the first .csv file in the repo root
 * - Parses with headers
 * - Sends a simple pipeline to /api/process-data
 * - Asserts sorted CO2 column is correct
 * - Skips automatically if no CSV is present
 */

function findRootCsvOrNull() {
	const repoRoot = path.resolve(__dirname, '../../');
	const entries = fs.readdirSync(repoRoot);
	const csv = entries.find((f) => f.toLowerCase().endsWith('.csv'));
	return csv ? path.join(repoRoot, csv) : null;
}

function detectColumn(headers, needle) {
	const lower = needle.toLowerCase();
	return headers.find((h) => h && h.toLowerCase().includes(lower));
}

const csvPath = path.resolve(__dirname, '../../', 'Copy of 2 Data Story Telling and Visualisation Workshop.csv');
const maybe = csvPath ? test : test.skip;

describe('CSV file processing (root CSV)', () => {
	maybe('processes CSV via backend and sorts by CO2 desc', async () => {
		const csvText = fs.readFileSync(csvPath, 'utf8');
		const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
		const rows = parsed.data;
		expect(Array.isArray(rows)).toBe(true);
		expect(rows.length).toBeGreaterThan(0);

		// Detect likely column names
		const headers = Object.keys(rows[0] || {});
		const co2Col = detectColumn(headers, 'co2');
		const dayCol = detectColumn(headers, 'day') || headers[0];
		const timeCol = detectColumn(headers, 'time') || headers[1];
		const tempCol = detectColumn(headers, 'temp') || detectColumn(headers, 'temperat');
		const humidCol = detectColumn(headers, 'humid');

		expect(co2Col).toBeTruthy();

		const selectCols = [dayCol, timeCol, tempCol, humidCol, co2Col].filter(Boolean);

		const operations = [
			{ type: 'filter', params: { column: co2Col, operator: 'not_equals', value: '' } },
			{ type: 'select', params: { columns: selectCols } },
			{ type: 'sort', params: { column: co2Col, direction: 'desc' } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: rows, operations })
			.expect(200);

		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBeGreaterThan(0);

		const nums = res.body.data
			.map((r) => parseFloat(r[co2Col]))
			.filter((n) => !Number.isNaN(n));
		const max = Math.max(...nums);
		expect(parseFloat(res.body.data[0][co2Col])).toBe(max);
	});

	maybe('groups by day and sums CO2', async () => {
		const csvText = fs.readFileSync(csvPath, 'utf8');
		const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
		const rows = parsed.data;
		const headers = Object.keys(rows[0] || {});
		const co2Col = detectColumn(headers, 'co2');
		const dayCol = detectColumn(headers, 'day') || headers[0];
		expect(co2Col).toBeTruthy();
		expect(dayCol).toBeTruthy();

		const operations = [
			{ type: 'filter', params: { column: co2Col, operator: 'not_equals', value: '' } },
			{ type: 'groupBy', params: { groupBy: dayCol, aggregations: [{ column: co2Col, operation: 'sum', alias: 'totalCo2' }] } },
			{ type: 'sort', params: { column: 'totalCo2', direction: 'desc' } }
		];

		const res = await request(app).post('/api/process-data').send({ data: rows, operations }).expect(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		// top row should have the highest aggregated CO2 for a day
		const totals = res.body.data.map((r) => Number(r.totalCo2)).filter((n) => !Number.isNaN(n));
		const max = Math.max(...totals);
		expect(Number(res.body.data[0].totalCo2)).toBe(max);
	});

	maybe('calculates a new column and selects subset', async () => {
		const csvText = fs.readFileSync(csvPath, 'utf8');
		const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
		const rows = parsed.data;
		const headers = Object.keys(rows[0] || {});
		const tempCol = detectColumn(headers, 'temp') || detectColumn(headers, 'temperat');
		const humidCol = detectColumn(headers, 'humid');
		const co2Col = detectColumn(headers, 'co2');

		// Pick any two numeric-ish columns for a derived metric if available
		const left = tempCol || co2Col;
		const right = humidCol || co2Col;
		expect(left).toBeTruthy();
		expect(right).toBeTruthy();

		const operations = [
			{ type: 'filter', params: { column: left, operator: 'not_equals', value: '' } },
			{ type: 'filter', params: { column: right, operator: 'not_equals', value: '' } },
			{ type: 'calculate', params: { expression: `${left} * ${right}`, newColumnName: 'derived' } },
			{ type: 'select', params: { columns: [left, right, 'derived'].filter(Boolean) } },
			{ type: 'sort', params: { column: 'derived', direction: 'desc' } }
		];

		const res = await request(app).post('/api/process-data').send({ data: rows, operations }).expect(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		// derived should be a number-like string on first row
		const top = res.body.data[0];
		expect(top).toHaveProperty('derived');
		expect(Number.isNaN(Number(top.derived))).toBe(false);
	});

	maybe('combined pipeline: cleanup, calculate, group+avg', async () => {
		const csvText = fs.readFileSync(csvPath, 'utf8');
		const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
		const rows = parsed.data;
		const headers = Object.keys(rows[0] || {});
		const co2Col = detectColumn(headers, 'co2');
		const tempCol = detectColumn(headers, 'temp') || detectColumn(headers, 'temperat');
		const dayCol = detectColumn(headers, 'day') || headers[0];
		expect(co2Col).toBeTruthy();
		expect(tempCol).toBeTruthy();
		expect(dayCol).toBeTruthy();

		const operations = [
			{ type: 'filter', params: { column: co2Col, operator: 'not_equals', value: '' } },
			{ type: 'filter', params: { column: tempCol, operator: 'not_equals', value: '' } },
			{ type: 'calculate', params: { expression: `${tempCol} * 1`, newColumnName: 'tempNum' } },
			{ type: 'groupBy', params: { groupBy: dayCol, aggregations: [
				{ column: co2Col, operation: 'average', alias: 'avgCo2' },
				{ column: 'tempNum', operation: 'average', alias: 'avgTemp' }
			] } },
			{ type: 'sort', params: { column: 'avgCo2', direction: 'desc' } }
		];

		const res = await request(app).post('/api/process-data').send({ data: rows, operations }).expect(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		// Averages should parse as numbers
		const first = res.body.data[0];
		expect(first).toHaveProperty('avgCo2');
		expect(first).toHaveProperty('avgTemp');
		expect(Number.isNaN(Number(first.avgCo2))).toBe(false);
		expect(Number.isNaN(Number(first.avgTemp))).toBe(false);
	});
});
