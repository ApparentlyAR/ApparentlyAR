const request = require('supertest');
const app = require('../../server');

/**
 * These tests validate the data-processing flows the frontend relies on,
 * using small CSV-like arrays and combined operations.
 */

describe('Frontend Data Processing Flows', () => {
	const sample = [
		{ name: 'Alice', age: '14', score: '87', class: 'A', price: '2', quantity: '5' },
		{ name: 'Bob', age: '15', score: '92', class: 'A', price: '3', quantity: '2' },
		{ name: 'Cara', age: '14', score: '78', class: 'B', price: '10', quantity: '1' },
		{ name: 'Dan', age: '16', score: '', class: 'B', price: '4', quantity: '3' },
	];

	test('filter: greater_than age and non-empty score', async () => {
		const operations = [
			{ type: 'filter', params: { column: 'age', operator: 'greater_than', value: '14' } },
			{ type: 'filter', params: { column: 'score', operator: 'not_equals', value: '' } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: sample, operations })
			.expect(200);

		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		// Bob (15, score 92) should remain; Dan has empty score
		expect(res.body.data.map(r => r.name)).toEqual(['Bob']);
	});

	test('select: keep only name and score', async () => {
		const operations = [
			{ type: 'select', params: { columns: ['name', 'score'] } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: sample, operations })
			.expect(200);

		const row = res.body.data[0];
		expect(Object.keys(row).sort()).toEqual(['name', 'score']);
	});

	test('sort: by score desc (numeric)', async () => {
		const operations = [
			{ type: 'sort', params: { column: 'score', direction: 'desc' } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: sample, operations })
			.expect(200);

		const sorted = res.body.data.map(r => r.name);
		// Scores: 92 (Bob), 87 (Alice), 78 (Cara), '' (Dan)
		expect(sorted).toEqual(['Bob', 'Alice', 'Cara', 'Dan']);
	});

	test('groupBy: class with sum of scores', async () => {
		const operations = [
			{ type: 'groupBy', params: { groupBy: 'class', aggregations: [ { column: 'score', operation: 'sum', alias: 'totalScore' } ] } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: sample, operations })
			.expect(200);

		// Empty score is ignored in numeric parsing; A: 87+92=179, B: 78
		const byClass = Object.fromEntries(res.body.data.map(r => [r.class, r.totalScore]));
		expect(byClass['A']).toBe(179);
		expect(byClass['B']).toBe(78);
	});

	test('calculate: price * quantity as total', async () => {
		const operations = [
			{ type: 'calculate', params: { expression: 'price * quantity', newColumnName: 'total' } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: sample, operations })
			.expect(200);

		const totals = res.body.data.map(r => r.total);
		expect(totals).toEqual([10, 6, 10, 12]);
	});

	test('combined pipeline: cleanup, calculate, select, sort', async () => {
		const operations = [
			// drop rows with empty score
			{ type: 'filter', params: { column: 'score', operator: 'not_equals', value: '' } },
			{ type: 'calculate', params: { expression: 'price * quantity', newColumnName: 'total' } },
			{ type: 'select', params: { columns: ['name', 'class', 'total'] } },
			{ type: 'sort', params: { column: 'total', direction: 'desc' } },
		];

		const res = await request(app)
			.post('/api/process-data')
			.send({ data: sample, operations })
			.expect(200);

		const rows = res.body.data;
		expect(rows.map(r => r.name)).toEqual(['Alice', 'Cara', 'Bob']);
		expect(Object.keys(rows[0]).sort()).toEqual(['class', 'name', 'total']);
	});
});
