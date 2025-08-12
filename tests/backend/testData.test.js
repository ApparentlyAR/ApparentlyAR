const { sampleData, weatherData, salesData } = require('../../src/backend/testData');

describe('TestData', () => {
  describe('sampleData', () => {
    it('should have correct structure', () => {
      expect(sampleData).toBeDefined();
      expect(Array.isArray(sampleData)).toBe(true);
      expect(sampleData.length).toBeGreaterThan(0);
      
      const firstRow = sampleData[0];
      expect(firstRow).toHaveProperty('name');
      expect(firstRow).toHaveProperty('age');
      expect(firstRow).toHaveProperty('score');
      expect(firstRow).toHaveProperty('grade');
    });

    it('should have valid data types', () => {
      sampleData.forEach(row => {
        expect(typeof row.name).toBe('string');
        expect(typeof row.age).toBe('number');
        expect(typeof row.score).toBe('number');
        expect(typeof row.grade).toBe('string');
      });
    });
  });

  describe('weatherData', () => {
    it('should have correct structure', () => {
      expect(weatherData).toBeDefined();
      expect(Array.isArray(weatherData)).toBe(true);
      expect(weatherData.length).toBe(12); // 12 months
      
      const firstRow = weatherData[0];
      expect(firstRow).toHaveProperty('month');
      expect(firstRow).toHaveProperty('temperature');
      expect(firstRow).toHaveProperty('rainfall');
      expect(firstRow).toHaveProperty('humidity');
    });

    it('should have valid data types', () => {
      weatherData.forEach(row => {
        expect(typeof row.month).toBe('string');
        expect(typeof row.temperature).toBe('number');
        expect(typeof row.rainfall).toBe('number');
        expect(typeof row.humidity).toBe('number');
      });
    });
  });

  describe('salesData', () => {
    it('should have correct structure', () => {
      expect(salesData).toBeDefined();
      expect(Array.isArray(salesData)).toBe(true);
      expect(salesData.length).toBeGreaterThan(0);
      
      const firstRow = salesData[0];
      expect(firstRow).toHaveProperty('product');
      expect(firstRow).toHaveProperty('sales');
      expect(firstRow).toHaveProperty('revenue');
      expect(firstRow).toHaveProperty('region');
    });

    it('should have valid data types', () => {
      salesData.forEach(row => {
        expect(typeof row.product).toBe('string');
        expect(typeof row.sales).toBe('number');
        expect(typeof row.revenue).toBe('number');
        expect(typeof row.region).toBe('string');
      });
    });
  });
});
