/**
 * Test Data Module
 * 
 * Provides sample datasets for development, testing, and demonstration purposes
 * for the ApparentlyAR data visualization platform.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

/**
 * Sample student data for educational demonstrations
 * @type {Array<Object>}
 */
const sampleData = [
  { name: 'Alice', age: 25, score: 85, grade: 'A' },
  { name: 'Bob', age: 22, score: 92, grade: 'A' },
  { name: 'Charlie', age: 28, score: 78, grade: 'B' },
  { name: 'Diana', age: 24, score: 95, grade: 'A' },
  { name: 'Eve', age: 26, score: 88, grade: 'A' },
  { name: 'Frank', age: 23, score: 72, grade: 'C' },
  { name: 'Grace', age: 27, score: 91, grade: 'A' },
  { name: 'Henry', age: 25, score: 83, grade: 'B' },
  { name: 'Ivy', age: 24, score: 89, grade: 'A' },
  { name: 'Jack', age: 29, score: 76, grade: 'C' }
];

/**
 * Monthly weather data for environmental analysis
 * @type {Array<Object>}
 */
const weatherData = [
  { month: 'Jan', temperature: 15, rainfall: 80, humidity: 65 },
  { month: 'Feb', temperature: 17, rainfall: 70, humidity: 60 },
  { month: 'Mar', temperature: 20, rainfall: 85, humidity: 70 },
  { month: 'Apr', temperature: 23, rainfall: 90, humidity: 75 },
  { month: 'May', temperature: 26, rainfall: 100, humidity: 80 },
  { month: 'Jun', temperature: 28, rainfall: 120, humidity: 85 },
  { month: 'Jul', temperature: 30, rainfall: 110, humidity: 80 },
  { month: 'Aug', temperature: 29, rainfall: 95, humidity: 75 },
  { month: 'Sep', temperature: 25, rainfall: 85, humidity: 70 },
  { month: 'Oct', temperature: 22, rainfall: 75, humidity: 65 },
  { month: 'Nov', temperature: 18, rainfall: 80, humidity: 70 },
  { month: 'Dec', temperature: 16, rainfall: 85, humidity: 75 }
];

/**
 * Sales data for business analytics demonstrations
 * @type {Array<Object>}
 */
const salesData = [
  { product: 'Laptop', sales: 120, revenue: 144000, region: 'North' },
  { product: 'Phone', sales: 200, revenue: 120000, region: 'North' },
  { product: 'Tablet', sales: 80, revenue: 64000, region: 'North' },
  { product: 'Laptop', sales: 150, revenue: 180000, region: 'South' },
  { product: 'Phone', sales: 180, revenue: 108000, region: 'South' },
  { product: 'Tablet', sales: 90, revenue: 72000, region: 'South' },
  { product: 'Laptop', sales: 100, revenue: 120000, region: 'East' },
  { product: 'Phone', sales: 160, revenue: 96000, region: 'East' },
  { product: 'Tablet', sales: 70, revenue: 56000, region: 'East' },
  { product: 'Laptop', sales: 130, revenue: 156000, region: 'West' },
  { product: 'Phone', sales: 190, revenue: 114000, region: 'West' },
  { product: 'Tablet', sales: 85, revenue: 68000, region: 'West' }
];

module.exports = {
  sampleData,
  weatherData,
  salesData
};
