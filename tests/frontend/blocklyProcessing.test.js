/**
 * Tests for Blockly process_data block integration with frontend API client.
 * We stub a minimal Blockly environment and mock window.AppApi.processData.
 */

describe('Blockly process_data generator integration', () => {
	beforeEach(() => {
		// Minimal window + Blockly stubs
		global.window = global.window || {};
		global.window.AppApi = { processData: jest.fn() };

		const noop = () => {};
		global.Blockly = {
			JavaScript: {
				ORDER_NONE: 0,
				valueToCode: jest.fn(() => 'inputData') // return variable name
			},
			CsvImportData: { data: null },
			defineBlocksWithJsonArray: noop,
			Extensions: { register: noop },
			fieldRegistry: { register: noop },
			Field: class { constructor() {} }
		};

		// Make sure window.Blockly points to the same object as global.Blockly for tests
		global.window.Blockly = global.Blockly;

		// Load generator file (registers Blockly.JavaScript.process_data)
		jest.isolateModules(() => {
			require('../../src/blocks/data_ops.js');
		});
	});

	test('generator builds operations and calls AppApi.processData', async () => {
		const gen = global.Blockly.JavaScript['process_data'];
		expect(typeof gen).toBe('function');

		// Fake block returns field values
		const fakeBlock = {
			getFieldValue: (name) => {
				const map = {
					DROP_EMPTY_COL: 'score',
					FILTER_COL: 'age',
					FILTER_OP: 'greater_than',
					FILTER_VAL: '14',
					SELECT_COLS: 'name,score,class',
					SORT_COL: 'score',
					SORT_DIR: 'desc',
					GROUP_COL: '',
					AGG_COL: '',
					AGG_OP: 'sum',
					AGG_ALIAS: 'totalScore',
					CALC_EXPR: 'price * quantity',
					CALC_NAME: 'total'
				};
				return map[name] || '';
			}
		};

		// Generate code and evaluate it with an input variable in scope
		const code = gen(fakeBlock)[0];
		const inputData = [
			{ name: 'A', age: '15', score: '10', price: '2', quantity: '3' },
			{ name: 'B', age: '13', score: '', price: '5', quantity: '1' }
		];

		// Mock API to verify payload and return processed result
		const processedOut = [{ name: 'A', score: '10', class: 'X', total: 6 }];
		window.AppApi.processData.mockImplementation(async (data, ops) => {
			// Ensure data is passed through and operations include our steps
			expect(data).toBe(inputData);
			expect(Array.isArray(ops)).toBe(true);
			// DROP_EMPTY_COL creates a filter to drop empty values in score column
			expect(ops.find(o => o.type === 'filter' && o.params.column === 'score' && o.params.operator === 'not_equals')).toBeTruthy();
			// FILTER_COL creates a filter on age column
			expect(ops.find(o => o.type === 'filter' && o.params.column === 'age' && o.params.operator === 'greater_than')).toBeTruthy();
			expect(ops.find(o => o.type === 'select')).toBeTruthy();
			expect(ops.find(o => o.type === 'calculate')).toBeTruthy();
			expect(ops.find(o => o.type === 'sort')).toBeTruthy();
			return { data: processedOut };
		});

		// eslint-disable-next-line no-eval
		let result = eval(code);
		if (result && typeof result.then === 'function') {
			result = await result;
		}

		expect(result).toEqual(processedOut);
		// The generated code sets window.Blockly.CsvImportData.data, but we're using global.Blockly in tests
		expect(global.Blockly.CsvImportData.data).toEqual(processedOut);
		expect(window.AppApi.processData).toHaveBeenCalledTimes(1);
	});

	test('generator falls back to input data if API missing', async () => {
		const gen = global.Blockly.JavaScript['process_data'];

		// Remove API to simulate missing client
		window.AppApi = undefined;

		const fakeBlock = { getFieldValue: () => '' };
		const code = gen(fakeBlock)[0];
		const inputData = [{ x: 1 }];

		await expect((async () => {
			// eslint-disable-next-line no-eval
			let res = eval(code);
			if (res && typeof res.then === 'function') res = await res;
			return res;
		})()).rejects.toThrow('API not available');
	});
});
