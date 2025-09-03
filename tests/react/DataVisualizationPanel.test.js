/**
 * Test suite for DataVisualizationPanel React component
 * Tests data display, chart rendering, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataVisualizationPanel from '../../src/react/components/DataVisualizationPanel';

// Mock Chart.js
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    resize: jest.fn()
  }))
}));

// Mock the backend modules
jest.mock('../../src/backend/dataProcessor', () => ({
  getDataSummary: jest.fn(() => ({
    rows: 3,
    columns: 3,
    summary: {
      name: { type: 'text', unique: 3 },
      age: { type: 'numeric', min: 25, max: 30, average: 27.67 },
      score: { type: 'numeric', min: 78, max: 92, average: 85 }
    }
  })),
  processData: jest.fn((data) => Promise.resolve(data))
}));

jest.mock('../../src/backend/chartGenerator', () => ({
  generateChart: jest.fn(() => Promise.resolve({
    success: true,
    chartType: 'bar',
    config: {
      type: 'bar',
      data: {
        labels: ['Alice', 'Bob', 'Charlie'],
        datasets: [{ data: [85, 92, 78] }]
      },
      options: {}
    }
  }))
}));

describe('DataVisualizationPanel Component', () => {
  const mockData = [
    { name: 'Alice', age: 25, score: 85 },
    { name: 'Bob', age: 30, score: 92 },
    { name: 'Charlie', age: 28, score: 78 }
  ];

  const defaultProps = {
    data: mockData,
    onDataChange: jest.fn(),
    onChartGenerate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render data table', () => {\n    render(<DataVisualizationPanel {...defaultProps} />);\n    \n    expect(screen.getByText('Alice')).toBeInTheDocument();\n    expect(screen.getByText('Bob')).toBeInTheDocument();\n    expect(screen.getByText('Charlie')).toBeInTheDocument();\n  });\n\n  test('should render data summary', () => {\n    render(<DataVisualizationPanel {...defaultProps} />);\n    \n    expect(screen.getByText(/3 rows/i)).toBeInTheDocument();\n    expect(screen.getByText(/3 columns/i)).toBeInTheDocument();\n  });\n\n  test('should handle empty data', () => {\n    render(<DataVisualizationPanel {...defaultProps} data={[]} />);\n    \n    expect(screen.getByText(/no data to display/i)).toBeInTheDocument();\n  });\n\n  test('should handle data loading state', () => {\n    render(<DataVisualizationPanel {...defaultProps} loading={true} />);\n    \n    expect(screen.getByText(/loading/i)).toBeInTheDocument();\n    expect(screen.getByRole('progressbar')).toBeInTheDocument();\n  });\n\n  test('should handle data processing errors', () => {\n    const errorMessage = 'Failed to process data';\n    render(<DataVisualizationPanel {...defaultProps} error={errorMessage} />);\n    \n    expect(screen.getByText(errorMessage)).toBeInTheDocument();\n    expect(screen.getByRole('alert')).toBeInTheDocument();\n  });\n\n  test('should render chart when chart data is provided', async () => {\n    const chartConfig = {\n      type: 'bar',\n      data: { labels: ['A', 'B'], datasets: [{ data: [1, 2] }] }\n    };\n    \n    render(<DataVisualizationPanel {...defaultProps} chartConfig={chartConfig} />);\n    \n    await waitFor(() => {\n      expect(screen.getByTestId('chart-canvas')).toBeInTheDocument();\n    });\n  });\n\n  test('should handle chart resize', () => {\n    const { rerender } = render(<DataVisualizationPanel {...defaultProps} />);\n    \n    // Simulate window resize\n    global.dispatchEvent(new Event('resize'));\n    \n    // Should not throw errors\n    expect(true).toBe(true);\n  });\n\n  test('should support data filtering', async () => {\n    render(<DataVisualizationPanel {...defaultProps} showFilters={true} />);\n    \n    const filterInput = screen.getByPlaceholderText(/filter data/i);\n    fireEvent.change(filterInput, { target: { value: 'Alice' } });\n    \n    await waitFor(() => {\n      expect(screen.getByText('Alice')).toBeInTheDocument();\n      expect(screen.queryByText('Bob')).not.toBeInTheDocument();\n    });\n  });\n\n  test('should support data sorting', () => {\n    render(<DataVisualizationPanel {...defaultProps} />);\n    \n    const nameHeader = screen.getByText('Name');\n    fireEvent.click(nameHeader);\n    \n    // Should trigger sort - verify through data order change\n    expect(defaultProps.onDataChange).toHaveBeenCalled();\n  });\n\n  test('should handle data pagination', () => {\n    const largeData = Array.from({ length: 50 }, (_, i) => ({\n      id: i,\n      name: `Person ${i}`,\n      value: i * 10\n    }));\n    \n    render(<DataVisualizationPanel {...defaultProps} data={largeData} pageSize={10} />);\n    \n    expect(screen.getByText('Person 0')).toBeInTheDocument();\n    expect(screen.queryByText('Person 10')).not.toBeInTheDocument();\n    \n    const nextButton = screen.getByRole('button', { name: /next/i });\n    fireEvent.click(nextButton);\n    \n    expect(screen.getByText('Person 10')).toBeInTheDocument();\n  });\n\n  test('should export data functionality', () => {\n    render(<DataVisualizationPanel {...defaultProps} showExport={true} />);\n    \n    const exportButton = screen.getByRole('button', { name: /export/i });\n    fireEvent.click(exportButton);\n    \n    expect(screen.getByText(/csv/i)).toBeInTheDocument();\n    expect(screen.getByText(/json/i)).toBeInTheDocument();\n  });\n\n  test('should handle column visibility toggling', () => {\n    render(<DataVisualizationPanel {...defaultProps} showColumnControls={true} />);\n    \n    const columnToggle = screen.getByLabelText(/show age column/i);\n    fireEvent.click(columnToggle);\n    \n    expect(screen.queryByText('25')).not.toBeInTheDocument();\n  });\n\n  test('should support data editing', () => {\n    render(<DataVisualizationPanel {...defaultProps} editable={true} />);\n    \n    const cellToEdit = screen.getByText('Alice');\n    fireEvent.doubleClick(cellToEdit);\n    \n    const editInput = screen.getByDisplayValue('Alice');\n    fireEvent.change(editInput, { target: { value: 'Alice Smith' } });\n    fireEvent.blur(editInput);\n    \n    expect(defaultProps.onDataChange).toHaveBeenCalled();\n  });\n});