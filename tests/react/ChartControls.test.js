/**
 * Test suite for ChartControls React component
 * Tests user interactions, state management, and chart type selection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartControls from '../../src/react/components/ChartControls';

// Mock the chart generation functions
jest.mock('../../src/backend/chartGenerator', () => ({
  generateChart: jest.fn(),
  getSupportedChartTypes: jest.fn(() => ['bar', 'line', 'pie', 'scatter'])
}));

describe('ChartControls Component', () => {
  const mockData = [
    { name: 'Alice', age: 25, score: 85 },
    { name: 'Bob', age: 30, score: 92 },
    { name: 'Charlie', age: 28, score: 78 }
  ];

  const defaultProps = {
    data: mockData,
    onChartGenerate: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render chart type selector', () => {
    render(<ChartControls {...defaultProps} />);
    
    expect(screen.getByLabelText(/chart type/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('bar')).toBeInTheDocument();
  });

  test('should render column selectors', () => {
    render(<ChartControls {...defaultProps} />);
    
    expect(screen.getByLabelText(/x-axis/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/y-axis/i)).toBeInTheDocument();
  });

  test('should handle chart type change', () => {
    render(<ChartControls {...defaultProps} />);
    
    const chartTypeSelect = screen.getByLabelText(/chart type/i);
    fireEvent.change(chartTypeSelect, { target: { value: 'line' } });
    
    expect(chartTypeSelect.value).toBe('line');
  });

  test('should handle column selection', () => {
    render(<ChartControls {...defaultProps} />);
    
    const xAxisSelect = screen.getByLabelText(/x-axis/i);
    fireEvent.change(xAxisSelect, { target: { value: 'name' } });
    
    expect(xAxisSelect.value).toBe('name');
  });

  test('should generate chart on button click', async () => {
    const mockOnChartGenerate = jest.fn();
    render(<ChartControls {...defaultProps} onChartGenerate={mockOnChartGenerate} />);
    
    const generateButton = screen.getByRole('button', { name: /generate chart/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockOnChartGenerate).toHaveBeenCalled();
    });
  });

  test('should handle empty data gracefully', () => {
    render(<ChartControls {...defaultProps} data={[]} />);
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  test('should disable controls when loading', () => {
    render(<ChartControls {...defaultProps} loading={true} />);
    
    const generateButton = screen.getByRole('button', { name: /generating/i });
    expect(generateButton).toBeDisabled();
  });

  test('should show error messages', () => {
    const errorMessage = 'Chart generation failed';
    render(<ChartControls {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('should reset form when data changes', () => {
    const { rerender } = render(<ChartControls {...defaultProps} />);
    
    const xAxisSelect = screen.getByLabelText(/x-axis/i);
    fireEvent.change(xAxisSelect, { target: { value: 'name' } });
    
    const newData = [{ id: 1, value: 100 }];
    rerender(<ChartControls {...defaultProps} data={newData} />);
    
    // Should reset to default or first available column
    expect(xAxisSelect.value).not.toBe('name');
  });

  test('should handle advanced chart options', () => {
    render(<ChartControls {...defaultProps} showAdvanced={true} />);
    
    expect(screen.getByLabelText(/chart title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color scheme/i)).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    render(<ChartControls {...defaultProps} />);
    
    // Clear required fields
    const xAxisSelect = screen.getByLabelText(/x-axis/i);
    fireEvent.change(xAxisSelect, { target: { value: '' } });
    
    const generateButton = screen.getByRole('button', { name: /generate chart/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please select required fields/i)).toBeInTheDocument();
    });
  });
});