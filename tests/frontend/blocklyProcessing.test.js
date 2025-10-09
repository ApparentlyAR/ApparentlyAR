/**
 * Tests for Blockly data processing blocks integration with frontend API client.
 * We stub a minimal Blockly environment and mock window.AppApi.processData.
 */

describe('Blockly data processing blocks integration', () => {
	beforeEach(() => {
		// Minimal window + Blockly stubs
		global.window = global.window || {};
		global.window.AppApi = { processData: jest.fn() };

		const noop = () => {};
		global.Blockly = {
			JavaScript: {
				ORDER_NONE: 0,
				ORDER_FUNCTION_CALL: 1,
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

		// Load generator file (registers individual block generators)
		jest.isolateModules(() => {
			require('../../src/blocks/data_ops.js');
		});
	});

	test('filter_data generator calls AppApi.processData with filter operation', async () => {
		const gen = global.Blockly.JavaScript['filter_data'];
		expect(typeof gen).toBe('function');

		// Fake block returns field values
		const fakeBlock = {
			getFieldValue: (name) => {
				const map = {
					COLUMN: 'age',
					OPERATOR: 'greater_than',
					VALUE: '18'
				};
				return map[name] || '';
			}
		};

		// Generate code and evaluate it
		const code = gen(fakeBlock)[0];
		const inputData = [
			{ name: 'A', age: '20' },
			{ name: 'B', age: '16' }
		];

		// Mock API to verify payload and return processed result
		const processedOut = [{ name: 'A', age: '20' }];
		window.AppApi.processData.mockImplementation(async (data, ops) => {
			expect(data).toBe(inputData);
			expect(Array.isArray(ops)).toBe(true);
			expect(ops).toHaveLength(1);
			expect(ops[0]).toEqual({
				type: 'filter',
				params: { column: 'age', operator: 'greater_than', value: '18' }
			});
			return { data: processedOut };
		});

		// eslint-disable-next-line no-eval
		let result = eval(code);
		if (result && typeof result.then === 'function') {
			result = await result;
		}

		expect(result).toEqual(processedOut);
		expect(window.AppApi.processData).toHaveBeenCalledTimes(1);
	});

	test('group_by generator calls AppApi.processData with groupBy operation', async () => {
		const gen = global.Blockly.JavaScript['group_by'];
		expect(typeof gen).toBe('function');

		// Fake block returns field values
		const fakeBlock = {
			getFieldValue: (name) => {
				const map = {
					GROUP_COLUMN: 'category',
					AGGREGATION: 'sum',
					AGG_COLUMN: 'amount',
					ALIAS: 'total'
				};
				return map[name] || '';
			}
		};

		// Generate code and evaluate it
		const code = gen(fakeBlock)[0];
		const inputData = [
			{ category: 'A', amount: 10 },
			{ category: 'A', amount: 20 }
		];

		// Mock API to verify payload and return processed result
		const processedOut = [{ category: 'A', total: 30 }];
		window.AppApi.processData.mockImplementation(async (data, ops) => {
			expect(data).toBe(inputData);
			expect(Array.isArray(ops)).toBe(true);
			expect(ops).toHaveLength(1);
			expect(ops[0]).toEqual({
				type: 'groupBy',
				params: {
					groupBy: 'category',
					aggregations: [{ column: 'amount', operation: 'sum', alias: 'total' }]
				}
			});
			return { data: processedOut };
		});

		// eslint-disable-next-line no-eval
		let result = eval(code);
		if (result && typeof result.then === 'function') {
			result = await result;
		}

		expect(result).toEqual(processedOut);
		expect(window.AppApi.processData).toHaveBeenCalledTimes(1);
	});

	test('generator handles API missing gracefully', async () => {
		const gen = global.Blockly.JavaScript['filter_data'];

		// Remove API to simulate missing client
		window.AppApi = undefined;

		// Mock valueToCode to return a valid data reference
		Blockly.JavaScript.valueToCode = jest.fn(() => 'Blockly.CsvImportData.data');
		
		const fakeBlock = { getFieldValue: () => 'test' };
		const code = gen(fakeBlock)[0];

		// Should not throw, should return original data due to error handling
		const result = await eval(code);
		expect(result).toEqual([]); // Returns empty array when API is missing
	});

	test('generator handles invalid input data gracefully', async () => {
		const gen = global.Blockly.JavaScript['filter_data'];

		// Mock API to return success
		window.AppApi = { processData: jest.fn().mockResolvedValue({ data: [] }) };

		// Mock valueToCode to return invalid data
		Blockly.JavaScript.valueToCode = jest.fn(() => 'null');
		
		const fakeBlock = { getFieldValue: () => 'test' };
		const code = gen(fakeBlock)[0];

		// Should not throw, should return empty array
		const result = await eval(code);
		expect(result).toEqual([]);
	});
});
