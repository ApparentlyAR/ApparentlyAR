const chartGenerator = require('../../src/backend/chartGenerator');

describe('ChartGenerator', () => {
  const sampleData = [
    { month: 'Jan', sales: 100, profit: 20 },
    { month: 'Feb', sales: 120, profit: 25 },
    { month: 'Mar', sales: 90, profit: 15 },
    { month: 'Apr', sales: 150, profit: 30 }
  ];

  const pieData = [
    { category: 'Electronics', value: 300 },
    { category: 'Clothing', value: 200 },
    { category: 'Books', value: 100 }
  ];

  describe('generateChart', () => {
    test('should generate bar chart', async () => {
      const result = await chartGenerator.generateChart(sampleData, 'bar', {
        xColumn: 'month',
        yColumn: 'sales',
        title: 'Monthly Sales'
      });

      expect(result.success).toBe(true);
      expect(result.chartType).toBe('bar');
      expect(result.config.type).toBe('bar');
      expect(result.config.data.labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
      expect(result.config.data.datasets[0].data).toEqual([100, 120, 90, 150]);
      expect(result.metadata.dataPoints).toBe(4);
    });

    test('should generate line chart', async () => {
      const result = await chartGenerator.generateChart(sampleData, 'line', {
        xColumn: 'month',
        yColumn: 'profit',
        title: 'Monthly Profit'
      });

      expect(result.success).toBe(true);
      expect(result.chartType).toBe('line');
      expect(result.config.type).toBe('line');
      expect(result.config.data.labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
      expect(result.config.data.datasets[0].data).toEqual([20, 25, 15, 30]);
    });

    test('should generate scatter chart', async () => {
      const result = await chartGenerator.generateChart(sampleData, 'scatter', {
        xColumn: 'sales',
        yColumn: 'profit',
        title: 'Sales vs Profit'
      });

      expect(result.success).toBe(true);
      expect(result.chartType).toBe('scatter');
      expect(result.config.type).toBe('scatter');
      expect(result.config.data.datasets[0].data).toHaveLength(4);
      expect(result.config.data.datasets[0].data[0]).toEqual({ x: 100, y: 20 });
    });

    test('should generate pie chart', async () => {
      const result = await chartGenerator.generateChart(pieData, 'pie', {
        labelColumn: 'category',
        valueColumn: 'value',
        title: 'Sales by Category'
      });

      expect(result.success).toBe(true);
      expect(result.chartType).toBe('pie');
      expect(result.config.type).toBe('pie');
      expect(result.config.data.labels).toEqual(['Electronics', 'Clothing', 'Books']);
      expect(result.config.data.datasets[0].data).toEqual([300, 200, 100]);
    });

    test('should generate doughnut chart', async () => {
      const result = await chartGenerator.generateChart(pieData, 'doughnut', {
        labelColumn: 'category',
        valueColumn: 'value',
        title: 'Sales by Category'
      });

      expect(result.success).toBe(true);
      expect(result.chartType).toBe('doughnut');
      expect(result.config.type).toBe('doughnut');
    });

    test('should generate area chart', async () => {
      const result = await chartGenerator.generateChart(sampleData, 'area', {
        xColumn: 'month',
        yColumn: 'sales',
        title: 'Monthly Sales Area'
      });

      expect(result.success).toBe(true);
      expect(result.chartType).toBe('area');
      expect(result.config.type).toBe('line');
      expect(result.config.data.datasets[0].fill).toBe(true);
    });

    test('should throw error for unsupported chart type', async () => {
      await expect(chartGenerator.generateChart(sampleData, 'unsupported'))
        .rejects.toThrow('Unsupported chart type: unsupported');
    });
  });

  describe('generateBarChart', () => {
    test('should generate bar chart with default options', async () => {
      const result = await chartGenerator.generateBarChart(sampleData, {
        xColumn: 'month',
        yColumn: 'sales'
      });

      expect(result.type).toBe('bar');
      expect(result.data.labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
      expect(result.data.datasets[0].data).toEqual([100, 120, 90, 150]);
      expect(result.data.datasets[0].backgroundColor).toBe('#2d8cf0');
      expect(result.options.plugins.title.text).toBe('Bar Chart');
    });

    test('should generate bar chart with custom options', async () => {
      const result = await chartGenerator.generateBarChart(sampleData, {
        xColumn: 'month',
        yColumn: 'sales',
        title: 'Custom Title',
        color: '#ff0000'
      });

      expect(result.options.plugins.title.text).toBe('Custom Title');
      expect(result.data.datasets[0].backgroundColor).toBe('#ff0000');
    });

    test('should handle non-numeric values', async () => {
      const dataWithStrings = [
        { month: 'Jan', sales: '100' },
        { month: 'Feb', sales: '120' }
      ];

      const result = await chartGenerator.generateBarChart(dataWithStrings, {
        xColumn: 'month',
        yColumn: 'sales'
      });

      expect(result.data.datasets[0].data).toEqual([100, 120]);
    });
  });

  describe('generateLineChart', () => {
    test('should generate line chart with default options', async () => {
      const result = await chartGenerator.generateLineChart(sampleData, {
        xColumn: 'month',
        yColumn: 'profit'
      });

      expect(result.type).toBe('line');
      expect(result.data.datasets[0].fill).toBe(false);
      expect(result.data.datasets[0].tension).toBe(0.1);
    });

    test('should generate line chart with custom options', async () => {
      const result = await chartGenerator.generateLineChart(sampleData, {
        xColumn: 'month',
        yColumn: 'profit',
        title: 'Custom Line Chart',
        color: '#00ff00'
      });

      expect(result.options.plugins.title.text).toBe('Custom Line Chart');
      expect(result.data.datasets[0].borderColor).toBe('#00ff00');
    });
  });

  describe('generateScatterChart', () => {
    test('should generate scatter chart', async () => {
      const result = await chartGenerator.generateScatterChart(sampleData, {
        xColumn: 'sales',
        yColumn: 'profit'
      });

      expect(result.type).toBe('scatter');
      expect(result.data.datasets[0].data).toHaveLength(4);
      expect(result.data.datasets[0].data[0]).toEqual({ x: 100, y: 20 });
    });

    test('should handle non-numeric values in scatter', async () => {
      const dataWithStrings = [
        { x: '10', y: '20' },
        { x: '30', y: '40' }
      ];

      const result = await chartGenerator.generateScatterChart(dataWithStrings, {
        xColumn: 'x',
        yColumn: 'y'
      });

      expect(result.data.datasets[0].data[0]).toEqual({ x: 10, y: 20 });
    });
  });

  describe('generatePieChart', () => {
    test('should generate pie chart', async () => {
      const result = await chartGenerator.generatePieChart(pieData, {
        labelColumn: 'category',
        valueColumn: 'value'
      });

      expect(result.type).toBe('pie');
      expect(result.data.labels).toEqual(['Electronics', 'Clothing', 'Books']);
      expect(result.data.datasets[0].data).toEqual([300, 200, 100]);
      expect(result.options.plugins.legend.position).toBe('right');
    });

    test('should generate colors for pie chart', async () => {
      const result = await chartGenerator.generatePieChart(pieData, {
        labelColumn: 'category',
        valueColumn: 'value'
      });

      expect(result.data.datasets[0].backgroundColor).toHaveLength(3);
      expect(result.data.datasets[0].backgroundColor[0]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('generateDoughnutChart', () => {
    test('should generate doughnut chart', async () => {
      const result = await chartGenerator.generateDoughnutChart(pieData, {
        labelColumn: 'category',
        valueColumn: 'value'
      });

      expect(result.type).toBe('doughnut');
      expect(result.data.labels).toEqual(['Electronics', 'Clothing', 'Books']);
    });
  });

  describe('generateAreaChart', () => {
    test('should generate area chart', async () => {
      const result = await chartGenerator.generateAreaChart(sampleData, {
        xColumn: 'month',
        yColumn: 'sales'
      });

      expect(result.type).toBe('line');
      expect(result.data.datasets[0].fill).toBe(true);
      expect(result.data.datasets[0].backgroundColor).toContain('40'); // transparency
    });
  });

  describe('generateARVisualization', () => {
    test('should generate AR visualization data', async () => {
      const result = await chartGenerator.generateARVisualization(sampleData, 'bar', 'marker1');

      expect(result.markerId).toBe('marker1');
      expect(result.visualizationType).toBe('bar');
      expect(result.chartData).toBeDefined();
      expect(result.options).toBeDefined();
      expect(result.metadata.dataPoints).toBe(4);
      expect(result.metadata.columns).toEqual(['month', 'sales', 'profit']);
    });
  });

  describe('generateColors', () => {
    test('should generate colors for given count', () => {
      const colors = chartGenerator.generateColors(3);
      
      expect(colors).toHaveLength(3);
      expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(colors[1]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(colors[2]).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('should cycle through colors for large count', () => {
      const colors = chartGenerator.generateColors(20);
      
      expect(colors).toHaveLength(20);
      // Should cycle through the color palette
      expect(colors[0]).toBe(colors[15]); // 15 colors in palette, so 16th should repeat
    });
  });

  describe('generateHistogramChart', () => {
    const histogramData = [
      { age: 25 }, { age: 30 }, { age: 22 }, { age: 35 },
      { age: 28 }, { age: 32 }, { age: 26 }, { age: 29 }
    ];

    test('should generate histogram with default bins', async () => {
      const result = await chartGenerator.generateHistogramChart(histogramData, {
        valueColumn: 'age'
      });

      expect(result.type).toBe('bar');
      expect(result.data.datasets[0].label).toBe('Frequency');
      expect(result.data.labels).toHaveLength(10); // default bins
      expect(result.options.scales.x.title.text).toBe('age');
      expect(result.options.scales.y.title.text).toBe('Frequency');
    });

    test('should generate histogram with custom bins', async () => {
      const result = await chartGenerator.generateHistogramChart(histogramData, {
        valueColumn: 'age',
        bins: 5,
        title: 'Age Distribution'
      });

      expect(result.data.labels).toHaveLength(5);
      expect(result.options.plugins.title.text).toBe('Age Distribution');
    });
  });

  describe('generateBoxPlotChart', () => {
    const boxPlotData = [
      { grade: 'A', score: 95 }, { grade: 'A', score: 92 },
      { grade: 'B', score: 85 }, { grade: 'B', score: 88 },
      { grade: 'C', score: 75 }, { grade: 'C', score: 78 }
    ];

    test('should generate box plot with grouping', async () => {
      const result = await chartGenerator.generateBoxPlotChart(boxPlotData, {
        valueColumn: 'score',
        groupColumn: 'grade'
      });

      expect(result.type).toBe('boxplot');
      expect(result.data.labels).toEqual(['A', 'B', 'C']);
      expect(result.data.datasets[0].data).toHaveLength(3);
    });

    test('should generate box plot without grouping', async () => {
      const result = await chartGenerator.generateBoxPlotChart(boxPlotData, {
        valueColumn: 'score'
      });

      expect(result.type).toBe('boxplot');
      expect(result.data.labels).toEqual(['score']);
      expect(result.data.datasets[0].data).toHaveLength(1);
    });
  });

  describe('generateHeatmapChart', () => {
    const heatmapData = [
      { month: 'Jan', region: 'North', sales: 100 },
      { month: 'Jan', region: 'South', sales: 120 },
      { month: 'Feb', region: 'North', sales: 110 },
      { month: 'Feb', region: 'South', sales: 130 }
    ];

    test('should generate heatmap chart', async () => {
      const result = await chartGenerator.generateHeatmapChart(heatmapData, {
        xColumn: 'month',
        yColumn: 'region',
        valueColumn: 'sales'
      });

      expect(result.type).toBe('scatter');
      expect(result.data.datasets[0].data).toHaveLength(4);
      expect(result.options.scales.x.title.text).toBe('month');
      expect(result.options.scales.y.title.text).toBe('region');
    });
  });

  describe('generateRadarChart', () => {
    const radarData = [
      { student: 'Alice', math: 90, science: 85, english: 95, history: 80 },
      { student: 'Bob', math: 75, science: 90, english: 70, history: 85 }
    ];

    test('should generate radar chart', async () => {
      const result = await chartGenerator.generateRadarChart(radarData, {
        columns: ['math', 'science', 'english', 'history'],
        labelColumn: 'student'
      });

      expect(result.type).toBe('radar');
      expect(result.data.labels).toEqual(['math', 'science', 'english', 'history']);
      expect(result.data.datasets).toHaveLength(2);
      expect(result.data.datasets[0].label).toBe('Alice');
      expect(result.data.datasets[1].label).toBe('Bob');
    });

    test('should auto-detect numeric columns for radar', async () => {
      const result = await chartGenerator.generateRadarChart(radarData, {
        labelColumn: 'student'
      });

      expect(result.type).toBe('radar');
      expect(result.data.labels).toEqual(['math', 'science', 'english', 'history']);
    });
  });

  describe('percentile utility', () => {
    test('should calculate percentiles correctly', () => {
      const sortedData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      expect(chartGenerator.percentile(sortedData, 50)).toBe(5.5); // median
      expect(chartGenerator.percentile(sortedData, 25)).toBe(3.25); // Q1
      expect(chartGenerator.percentile(sortedData, 75)).toBe(7.75); // Q3
    });
  });

  describe('getSupportedChartTypes', () => {
    test('should return all supported chart types including new ones', () => {
      const types = chartGenerator.getSupportedChartTypes();
      
      expect(types).toContain('bar');
      expect(types).toContain('line');
      expect(types).toContain('scatter');
      expect(types).toContain('pie');
      expect(types).toContain('doughnut');
      expect(types).toContain('area');
      expect(types).toContain('histogram');
      expect(types).toContain('boxplot');
      expect(types).toContain('heatmap');
      expect(types).toContain('radar');
    });
  });

  describe('validateChartData', () => {
    test('should validate bar chart data', () => {
      const result = chartGenerator.validateChartData(sampleData, 'bar', {
        xColumn: 'month',
        yColumn: 'sales'
      });
      
      expect(result).toBe(true);
    });

    test('should validate pie chart data', () => {
      const result = chartGenerator.validateChartData(pieData, 'pie', {
        labelColumn: 'category',
        valueColumn: 'value'
      });
      
      expect(result).toBe(true);
    });

    test('should throw error for empty data', () => {
      expect(() => {
        chartGenerator.validateChartData([], 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('No data provided');
    });

    test('should throw error for null data', () => {
      expect(() => {
        chartGenerator.validateChartData(null, 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('No data provided');
    });

    test('should throw error for missing columns in bar chart', () => {
      expect(() => {
        chartGenerator.validateChartData(sampleData, 'bar', {
          xColumn: 'nonexistent',
          yColumn: 'sales'
        });
      }).toThrow('Missing required columns: nonexistent');
    });

    test('should throw error for missing columns in pie chart', () => {
      expect(() => {
        chartGenerator.validateChartData(pieData, 'pie', {
          labelColumn: 'nonexistent',
          valueColumn: 'value'
        });
      }).toThrow('Missing required columns: nonexistent');
    });
  });

  describe('validateChartData edge cases', () => {
    it('should throw error for empty data array', () => {
      expect(() => {
        chartGenerator.validateChartData([], 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('No data provided');
    });

    it('should throw error for null data', () => {
      expect(() => {
        chartGenerator.validateChartData(null, 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('No data provided');
    });

    it('should throw error for undefined data', () => {
      expect(() => {
        chartGenerator.validateChartData(undefined, 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('No data provided');
    });

    it('should throw error for missing required columns in bar chart', () => {
      const data = [{ x: 'A', z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('Missing required columns: y');
    });

    it('should throw error for missing required columns in line chart', () => {
      const data = [{ x: 'A', z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'line', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('Missing required columns: y');
    });

    it('should throw error for missing required columns in area chart', () => {
      const data = [{ x: 'A', z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'area', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('Missing required columns: y');
    });

    it('should throw error for missing required columns in scatter chart', () => {
      const data = [{ x: 'A', z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'scatter', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('Missing required columns: y');
    });

    it('should throw error for missing required columns in pie chart', () => {
      const data = [{ label: 'A', z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'pie', { labelColumn: 'label', valueColumn: 'value' });
      }).toThrow('Missing required columns: value');
    });

    it('should throw error for missing required columns in doughnut chart', () => {
      const data = [{ label: 'A', z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'doughnut', { labelColumn: 'label', valueColumn: 'value' });
      }).toThrow('Missing required columns: value');
    });

    it('should throw error for multiple missing columns', () => {
      const data = [{ z: 10 }];
      expect(() => {
        chartGenerator.validateChartData(data, 'bar', { xColumn: 'x', yColumn: 'y' });
      }).toThrow('Missing required columns: x, y');
    });

    it('should validate histogram chart data', () => {
      const data = [{ age: 25 }, { age: 30 }];
      const result = chartGenerator.validateChartData(data, 'histogram', {
        valueColumn: 'age'
      });
      expect(result).toBe(true);
    });

    it('should validate boxplot chart data', () => {
      const data = [{ score: 85 }, { score: 90 }];
      const result = chartGenerator.validateChartData(data, 'boxplot', {
        valueColumn: 'score'
      });
      expect(result).toBe(true);
    });

    it('should validate heatmap chart data', () => {
      const data = [{ x: 'A', y: 'B', value: 10 }];
      const result = chartGenerator.validateChartData(data, 'heatmap', {
        xColumn: 'x',
        yColumn: 'y',
        valueColumn: 'value'
      });
      expect(result).toBe(true);
    });

    it('should validate radar chart data', () => {
      const data = [{ student: 'Alice', math: 90, science: 85 }];
      const result = chartGenerator.validateChartData(data, 'radar', {
        columns: ['math', 'science'],
        labelColumn: 'student'
      });
      expect(result).toBe(true);
    });
  });

  describe('generateARVisualization edge cases', () => {
    it('should handle unsupported visualization type', async () => {
      const data = [{ x: 'A', y: 10 }];
      
      await expect(
        chartGenerator.generateARVisualization(data, 'unsupported', 'marker1')
      ).rejects.toThrow('this.supportedChartTypes[visualizationType] is not a function');
    });

    it('should generate AR data with metadata', async () => {
      const data = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 }
      ];
      
      const result = await chartGenerator.generateARVisualization(data, 'bar', 'marker1');
      
      expect(result.markerId).toBe('marker1');
      expect(result.visualizationType).toBe('bar');
      expect(result.chartData).toBeDefined();
      expect(result.options).toBeDefined();
      expect(result.metadata.dataPoints).toBe(2);
      expect(result.metadata.columns).toEqual(['x', 'y']);
      expect(result.metadata.generatedAt).toBeDefined();
    });
  });
});
